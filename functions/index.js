const { initializeApp, getApps } = require("firebase-admin/app");
const { FieldValue, Timestamp, getFirestore } = require("firebase-admin/firestore");
const { defineSecret, defineString } = require("firebase-functions/params");
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const { buildGalleryItems } = require("./pinterest-gallery");
const { createOAuthState, isValidOAuthState } = require("./oauth-state");

const PROJECT_ID = "devops-10bda";
const REGION = "us-central1";
const BOARD_NAME = "My life style";
const REDIRECT_URI = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/pinterestOAuth`;
const OAUTH_SCOPE = "boards:read,pins:read";
const PINTEREST_API_BASE = "https://api.pinterest.com/v5";
const MAX_BOARDS_TO_SCAN = 1000;
const pinterestClientId = defineString("PINTEREST_CLIENT_ID");
const pinterestContinuousRefresh = defineString("PINTEREST_CONTINUOUS_REFRESH", {
  default: "false",
});
const pinterestClientSecret = defineSecret("PINTEREST_CLIENT_SECRET");

if (getApps().length === 0) {
  initializeApp();
}

const database = getFirestore();

function htmlResponse(response, status, heading, message) {
  response.status(status).set("Content-Type", "text/html; charset=utf-8").send(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${heading}</title><body><main><h1>${heading}</h1><p>${message}</p><p>You can close this window and return to the portfolio.</p></main></body></html>`,
  );
}

async function requestPinterestToken(form, clientId, clientSecret) {
  const response = await fetch(`${PINTEREST_API_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams(form),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    logger.error("Pinterest OAuth token request failed.", { status: response.status });
    throw new Error(`Pinterest OAuth returned HTTP ${response.status}.`);
  }

  return response.json();
}

function validateTokenResponse(token) {
  if (
    !token ||
    typeof token.access_token !== "string" ||
    !token.access_token ||
    !Number.isFinite(Number(token.expires_in))
  ) {
    throw new Error("Pinterest returned an invalid access-token response.");
  }
}

function authHeader(accessToken) {
  return { Authorization: ["Bearer", accessToken].join(" "), Accept: "application/json" };
}

async function requestPinterestJson(path, accessToken) {
  const response = await fetch(`${PINTEREST_API_BASE}${path}`, {
    headers: authHeader(accessToken),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    logger.error("Pinterest API request failed.", { path, status: response.status });
    throw new Error(`Pinterest API request failed with HTTP ${response.status}.`);
  }
  return response.json();
}

async function getValidAccessToken() {
  const tokenRef = database.doc("privateIntegrations/pinterest");
  const snapshot = await tokenRef.get();
  if (!snapshot.exists) {
    throw new Error("Pinterest is not connected. Complete the Pinterest OAuth setup first.");
  }

  const tokenData = snapshot.data();
  const expiresAt = tokenData.accessTokenExpiresAt?.toMillis?.() || 0;
  if (tokenData.accessToken && expiresAt > Date.now() + 5 * 60 * 1000) {
    return tokenData.accessToken;
  }
  if (typeof tokenData.refreshToken !== "string" || !tokenData.refreshToken) {
    throw new Error("The Pinterest refresh token is missing. Reconnect Pinterest.");
  }

  const refreshedToken = await requestPinterestToken({
    grant_type: "refresh_token",
    refresh_token: tokenData.refreshToken,
  }, pinterestClientId.value(), pinterestClientSecret.value());
  validateTokenResponse(refreshedToken);

  const nextRefreshToken = typeof refreshedToken.refresh_token === "string" && refreshedToken.refresh_token
    ? refreshedToken.refresh_token
    : tokenData.refreshToken;
  await tokenRef.set({
    accessToken: refreshedToken.access_token,
    refreshToken: nextRefreshToken,
    accessTokenExpiresAt: Timestamp.fromMillis(Date.now() + Number(refreshedToken.expires_in) * 1000),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return refreshedToken.access_token;
}

async function findBoardId(accessToken) {
  let bookmark;
  let scanned = 0;
  const seenBookmarks = new Set();

  while (scanned < MAX_BOARDS_TO_SCAN) {
    const query = new URLSearchParams({ page_size: "250", privacy: "PUBLIC" });
    if (bookmark) query.set("bookmark", bookmark);
    const page = await requestPinterestJson(`/boards?${query}`, accessToken);
    const boards = Array.isArray(page.items) ? page.items : [];
    const board = boards.find((item) =>
      typeof item.name === "string" && item.name.trim().toLowerCase() === BOARD_NAME.toLowerCase(),
    );
    if (board?.id) {
      if (board.privacy !== "PUBLIC") {
        throw new Error(`The Pinterest board "${BOARD_NAME}" must be public before its photos can sync.`);
      }
      return board.id;
    }

    scanned += boards.length;
    bookmark = page.bookmark;
    if (!bookmark || boards.length === 0) break;
    if (seenBookmarks.has(bookmark)) {
      throw new Error("Pinterest returned a repeated board pagination cursor.");
    }
    seenBookmarks.add(bookmark);
  }

  const error = new Error(`The public Pinterest board "${BOARD_NAME}" could not be found.`);
  error.code = "BOARD_NOT_FOUND";
  throw error;
}

async function getBoardPins(accessToken, boardId) {
  const pins = [];
  let bookmark;
  const seenBookmarks = new Set();

  while (true) {
    const query = new URLSearchParams({
      page_size: "100",
      order: "DESCENDING",
    });
    if (bookmark) query.set("bookmark", bookmark);
    const page = await requestPinterestJson(
      `/boards/${encodeURIComponent(boardId)}/pins?${query}`,
      accessToken,
    );
    const pagePins = Array.isArray(page.items) ? page.items : [];
    pins.push(...pagePins);
    bookmark = page.bookmark;
    if (!bookmark || pagePins.length === 0) break;
    if (seenBookmarks.has(bookmark)) {
      throw new Error("Pinterest returned a repeated pin pagination cursor.");
    }
    seenBookmarks.add(bookmark);
  }

  return pins;
}

async function replacePublicGalleryItems(items, available = true) {
  const galleryCollection = database.collection("publicGallery");
  const existingItems = await galleryCollection.get();
  const itemIds = new Set(items.map((item) => item.id));
  const operations = [];

  items.forEach((item, position) => {
    operations.push({
      type: "set",
      reference: galleryCollection.doc(item.id),
      data: { ...item, position },
    });
  });
  existingItems.docs.forEach((snapshot) => {
    if (!itemIds.has(snapshot.id)) {
      operations.push({ type: "delete", reference: snapshot.ref });
    }
  });

  for (let index = 0; index < operations.length; index += 450) {
    const batch = database.batch();
    operations.slice(index, index + 450).forEach((operation) => {
      if (operation.type === "set") {
        batch.set(operation.reference, operation.data);
      } else {
        batch.delete(operation.reference);
      }
    });
    await batch.commit();
  }

  await database.doc("publicGalleryStatus/lifestyle").set({
    boardName: BOARD_NAME,
    available,
    itemCount: items.length,
    syncedAt: FieldValue.serverTimestamp(),
  });
}

async function syncPinterestBoard() {
  const accessToken = await getValidAccessToken();
  let boardId;
  try {
    boardId = await findBoardId(accessToken);
  } catch (error) {
    if (error.code === "BOARD_NOT_FOUND") {
      await replacePublicGalleryItems([], false);
    }
    throw error;
  }

  const pins = await getBoardPins(accessToken, boardId);
  const items = buildGalleryItems(pins);
  await replacePublicGalleryItems(items);

  logger.info("Pinterest gallery synchronized.", { photoCount: items.length });
  return items.length;
}

exports.pinterestOAuth = onRequest(
  {
    region: REGION,
    secrets: [pinterestClientSecret],
    cors: false,
    maxInstances: 2,
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async (request, response) => {
    if (request.method !== "GET") {
      response.set("Allow", "GET").status(405).send("Method not allowed.");
      return;
    }

    const clientId = pinterestClientId.value();
    const clientSecret = pinterestClientSecret.value();
    const action = request.query.action;

    if (action === "connect") {
      const state = createOAuthState(clientSecret);
      const authorizationUrl = new URL("https://www.pinterest.com/oauth/");
      authorizationUrl.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: OAUTH_SCOPE,
        state,
      }).toString();
      response.redirect(302, authorizationUrl.toString());
      return;
    }

    if (typeof request.query.error === "string") {
      logger.error("Pinterest authorization was declined or failed.");
      htmlResponse(response, 400, "Pinterest was not connected", "Pinterest authorization was declined or could not be completed.");
      return;
    }

    const code = request.query.code;
    const state = request.query.state;
    if (
      typeof code !== "string" ||
      !code ||
      typeof state !== "string" ||
      !isValidOAuthState(state, clientSecret)
    ) {
      htmlResponse(response, 400, "Pinterest connection failed", "The authorization response was invalid or expired. Start the connection again.");
      return;
    }

    try {
      const form = {
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      };
      if (pinterestContinuousRefresh.value().toLowerCase() === "true") {
        form.continuous_refresh = "true";
      }

      const token = await requestPinterestToken(form, clientId, clientSecret);
      validateTokenResponse(token);
      if (typeof token.refresh_token !== "string" || !token.refresh_token) {
        throw new Error("Pinterest did not return a refresh token required for automatic gallery updates.");
      }
      await database.doc("privateIntegrations/pinterest").set({
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        accessTokenExpiresAt: Timestamp.fromMillis(Date.now() + Number(token.expires_in) * 1000),
        updatedAt: FieldValue.serverTimestamp(),
      });

      try {
        const photoCount = await syncPinterestBoard();
        htmlResponse(response, 200, "Pinterest connected", `${photoCount} public photo${photoCount === 1 ? "" : "s"} from "${BOARD_NAME}" are now available in your portfolio gallery. New board photos will sync automatically every six hours.`);
      } catch (error) {
        logger.error("Pinterest connected, but the first gallery sync failed.", {
          message: error instanceof Error ? error.message : "Unknown synchronization error",
        });
        htmlResponse(response, 503, "Pinterest connected; first sync needs attention", "Your Pinterest authorization was saved securely, but the initial board sync failed. Check the board name, API access, and function logs. The scheduled sync will retry.");
      }
    } catch (error) {
      logger.error("Pinterest OAuth callback failed.", {
        message: error instanceof Error ? error.message : "Unknown OAuth error",
      });
      htmlResponse(response, 502, "Pinterest connection failed", "The access token could not be saved. Check the function logs and try connecting again.");
    }
  },
);

exports.syncPinterestGallery = onSchedule(
  {
    schedule: "every 6 hours",
    region: REGION,
    secrets: [pinterestClientSecret],
    timeZone: "Etc/UTC",
    maxInstances: 1,
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async () => {
    const token = await database.doc("privateIntegrations/pinterest").get();
    if (!token.exists) {
      logger.warn("Pinterest gallery sync skipped because the account is not connected.");
      return;
    }
    await syncPinterestBoard();
  },
);
