import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
import { firebaseConfig, galleryOwnerUid } from "./firebase-config.js";

const isFirebaseConfigured = () =>
  Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value.length > 0 && !value.startsWith("YOUR_"),
  );

const app = isFirebaseConfigured() ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;
const storage = app ? getStorage(app) : null;

function requireDatabase() {
  if (!db) {
    throw new Error("Set your Firebase web app configuration in firebase-config.js first.");
  }
  return db;
}

export { isFirebaseConfigured };

export const isGalleryOwnerConfigured = () =>
  typeof galleryOwnerUid === "string" &&
  galleryOwnerUid.length > 0 &&
  !galleryOwnerUid.startsWith("YOUR_");

export const isGalleryOwner = (user) =>
  Boolean(user && isGalleryOwnerConfigured() && user.uid === galleryOwnerUid);

export function watchGalleryItems(onItems, onError) {
  const database = requireDatabase();
  const galleryQuery = query(
    collection(database, "galleryItems"),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(
    galleryQuery,
    (snapshot) => onItems(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  );
}

export function watchGalleryAuth(onUser, onError) {
  if (!auth) throw new Error("Firebase is not configured for gallery sign-in.");
  return onAuthStateChanged(auth, onUser, onError);
}

export async function signInGalleryOwner(email, password) {
  if (!auth) throw new Error("Firebase is not configured for gallery sign-in.");
  const credential = await signInWithEmailAndPassword(auth, email, password);
  if (!isGalleryOwner(credential.user)) {
    await signOut(auth);
    throw new Error("This Firebase account's UID does not match the configured gallery owner UID.");
  }
  return credential.user;
}

export async function signOutGalleryOwner() {
  if (!auth) throw new Error("Firebase is not configured for gallery sign-in.");
  await signOut(auth);
}

export async function uploadGalleryItem({ file, title, description, type, onProgress }) {
  const database = requireDatabase();
  if (!auth?.currentUser || !storage || !isGalleryOwnerConfigured()) {
    throw new Error("Sign in with the configured gallery owner account before uploading.");
  }

  const user = auth.currentUser;
  if (!isGalleryOwner(user)) {
    throw new Error("This account is not authorized to manage the gallery.");
  }

  const itemId = crypto.randomUUID();
  const safeName = file.name.replace(/[^\w.-]+/g, "-").slice(-120) || "media";
  const fileRef = storageRef(storage, `gallery/${user.uid}/${itemId}-${safeName}`);
  const uploadTask = uploadBytesResumable(fileRef, file, { contentType: file.type });
  await new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => onProgress?.(snapshot.bytesTransferred / snapshot.totalBytes),
      reject,
      resolve,
    );
  });

  const downloadURL = await getDownloadURL(fileRef);
  try {
    await setDoc(doc(database, "galleryItems", itemId), {
      ownerUid: user.uid,
      type,
      title,
      description,
      storagePath: fileRef.fullPath,
      downloadURL,
      contentType: file.type,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    try {
      await deleteObject(fileRef);
    } catch (cleanupError) {
      console.error("Could not clean up uploaded gallery media after metadata save failed:", cleanupError);
    }
    throw error;
  }
}

export async function deleteGalleryItem(item) {
  const database = requireDatabase();
  if (!auth?.currentUser || !storage || !isGalleryOwnerConfigured()) {
    throw new Error("Sign in with the configured gallery owner account before deleting media.");
  }
  if (!isGalleryOwner(auth.currentUser) || item.ownerUid !== auth.currentUser.uid) {
    throw new Error("This account is not authorized to manage the gallery.");
  }

  await deleteDoc(doc(database, "galleryItems", item.id));
  try {
    await deleteObject(storageRef(storage, item.storagePath));
  } catch (error) {
    console.error("Gallery item metadata was deleted, but its storage file could not be removed:", error);
    throw new Error("The gallery item was removed, but its file could not be deleted from storage. Check Firebase Storage.");
  }
}

export function watchSiteContent(onContent, onError) {
  const database = requireDatabase();
  return onSnapshot(
    doc(database, "siteContent", "portfolio"),
    (snapshot) => onContent(snapshot.exists() ? snapshot.data() : null),
    onError,
  );
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
