import { galleryMedia } from "./gallery-media.js";

const count = document.getElementById("galleryCount");
const status = document.getElementById("galleryStatus");
const gallery = document.getElementById("galleryGrid");

function makeTextElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function createCard(item) {
  const card = document.createElement("figure");
  card.className = `gallery-item gallery-item-${item.type}`;

  if (item.type === "image") {
    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.title;
    image.loading = "lazy";
    card.appendChild(image);
  } else {
    const video = document.createElement("video");
    video.src = item.src;
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("aria-label", item.title);
    card.appendChild(video);
  }

  const caption = document.createElement("figcaption");
  caption.className = "gallery-caption";
  caption.append(
    makeTextElement("h3", "gallery-caption-title", item.title),
    makeTextElement("p", "gallery-caption-description", item.description),
  );
  card.appendChild(caption);
  return card;
}

function getValidMedia(items) {
  return items.filter((item) =>
    item &&
    (item.type === "image" || item.type === "video") &&
    typeof item.src === "string" &&
    typeof item.title === "string" &&
    typeof item.description === "string",
  );
}

function renderGallery(items, emptyMessage, statusMessage) {
  const validMedia = getValidMedia(items);
  count.textContent = `${validMedia.length} ${validMedia.length === 1 ? "ITEM" : "ITEMS"}`;

  if (validMedia.length) {
    gallery.replaceChildren(...validMedia.map(createCard));
    status.textContent = statusMessage(validMedia.length);
    return;
  }

  const empty = makeTextElement("p", "gallery-empty", emptyMessage);
  empty.setAttribute("role", "status");
  gallery.replaceChildren(empty);
  status.textContent = emptyMessage;
}

renderGallery(
  galleryMedia,
  "No media has been added yet. Add photos to the Pinterest board to populate this gallery.",
  (total) => `${total} saved photo or video${total === 1 ? "" : "s"} loaded. Connecting to the Pinterest gallery…`,
);

import("./firebase.js")
  .then(({ isFirebaseConfigured, watchPinterestGallery }) => {
    if (!isFirebaseConfigured()) {
      status.textContent = `${galleryMedia.length} saved item${galleryMedia.length === 1 ? "" : "s"} loaded. Configure Firebase to enable automatic Pinterest updates.`;
      return;
    }

    watchPinterestGallery(
      (data) => {
        if (!data) {
          renderGallery(
            galleryMedia,
            "No photos are available yet. Connect Pinterest to load the My life style board.",
            (total) => `${total} saved photo or video${total === 1 ? "" : "s"} loaded. Pinterest sync has not been connected yet.`,
          );
          return;
        }

        if (!Array.isArray(data.items)) {
          console.error("The public Pinterest gallery returned an invalid items field.");
          status.textContent = "The live gallery data is invalid. Please check the Pinterest sync configuration.";
          return;
        }

        if (data.available === false) {
          renderGallery(
            [],
            'The public "My life style" Pinterest board could not be found. Make sure the board is public and still has this name.',
            () => "Pinterest board unavailable. No board photos are being shown.",
          );
          return;
        }

        renderGallery(
          data.items,
          "The My life style board has no public photos yet.",
          (total) => `${total} public photo${total === 1 ? "" : "s"} from Pinterest. Last synced ${formatSyncTime(data.syncedAt)}.`,
        );
      },
      (error) => {
        console.error("Could not load the live Pinterest gallery:", error);
        status.textContent = "Could not load the live Pinterest gallery. Check the Firebase connection and Firestore rules.";
      },
    );
  })
  .catch((error) => {
    console.error("Could not initialize the live Pinterest gallery:", error);
    status.textContent = "Could not initialize the live Pinterest gallery. Check the Firebase setup.";
  });

function formatSyncTime(timestamp) {
  const date = timestamp && typeof timestamp.toDate === "function"
    ? timestamp.toDate()
    : null;
  return date instanceof Date && !Number.isNaN(date.getTime())
    ? date.toLocaleString()
    : "time unavailable";
}
