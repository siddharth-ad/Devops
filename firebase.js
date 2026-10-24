import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const isFirebaseConfigured = () =>
  Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value.length > 0 && !value.startsWith("YOUR_"),
  );

const app = isFirebaseConfigured() ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;

function requireDatabase() {
  if (!db) {
    throw new Error("Set your Firebase web app configuration in firebase-config.js first.");
  }
  return db;
}

export { isFirebaseConfigured };

export function watchSiteContent(onContent, onError) {
  const database = requireDatabase();
  return onSnapshot(
    doc(database, "siteContent", "portfolio"),
    (snapshot) => onContent(snapshot.exists() ? snapshot.data() : null),
    onError,
  );
}

export function watchPinterestGallery(onGallery, onError) {
  const database = requireDatabase();
  let items = null;
  let status = null;
  let itemsReady = false;
  let statusReady = false;
  let stopped = false;
  let stopItems = () => {};
  let stopStatus = () => {};

  const stop = () => {
    stopped = true;
    stopItems();
    stopStatus();
  };
  const handleError = (error) => {
    if (stopped) return;
    stop();
    onError(error);
  };

  const publishGallery = () => {
    if (!stopped && itemsReady && statusReady) {
      onGallery(status
        ? {
            items,
            syncedAt: status.syncedAt || null,
            available: status.available !== false,
          }
        : null);
    }
  };
  stopItems = onSnapshot(
    query(collection(database, "publicGallery"), orderBy("position", "asc")),
    (snapshot) => {
      items = snapshot.docs.map((item) => item.data());
      itemsReady = true;
      publishGallery();
    },
    handleError,
  );
  stopStatus = onSnapshot(
    doc(database, "publicGalleryStatus", "lifestyle"),
    (snapshot) => {
      status = snapshot.exists() ? snapshot.data() : null;
      statusReady = true;
      publishGallery();
    },
    handleError,
  );

  return stop;
}

export async function saveContactMessage({ name, email, message }) {
  const database = requireDatabase();

  if (!name || name.length > 100) {
    throw new Error("Name must be between 1 and 100 characters.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error("Enter a valid email address.");
  }
  if (!message || message.length > 5000) {
    throw new Error("Message must be between 1 and 5000 characters.");
  }

  const body = message;
  await addDoc(collection(database, "contactMessages"), {
    name,
    email,
    body,
    to: ["tadhikary239@gmail.com"],
    replyTo: email,
    message: {
      subject: "New portfolio contact message",
      text: `From: ${name}\nEmail: ${email}\n\n${body}`,
    },
    createdAt: serverTimestamp(),
  });
}
