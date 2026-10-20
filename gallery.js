import {
  deleteGalleryItem,
  isFirebaseConfigured,
  isGalleryOwnerConfigured,
  signInGalleryOwner,
  signOutGalleryOwner,
  uploadGalleryItem,
  watchGalleryAuth,
  watchGalleryItems,
} from "./firebase.js";

const status = document.getElementById("galleryStatus");
const count = document.getElementById("galleryCount");
const imageVideoGrid = document.getElementById("galleryGrid");
const audioGrid = document.getElementById("galleryAudio");
const loginForm = document.getElementById("galleryLoginForm");
const uploadForm = document.getElementById("galleryUploadForm");
const signOutButton = document.getElementById("gallerySignOut");
const fileInput = document.getElementById("galleryFiles");
const queue = document.getElementById("galleryQueue");
const uploadButton = document.getElementById("galleryUploadButton");
const galleryHeading = document.getElementById("gallery-heading");
const filterButtons = document.querySelectorAll("[data-gallery-filter]");

const maxBytes = {
  image: 25 * 1024 * 1024,
  video: 500 * 1024 * 1024,
  audio: 100 * 1024 * 1024,
};

let galleryItems = [];
let isOwner = false;
let mediaQueue = [];
let activeFilter = "visual";

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function mediaType(file) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function makeTextElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function showEmptyState(container, text) {
  const empty = makeTextElement("p", "gallery-empty", text);
  empty.setAttribute("role", "status");
  container.replaceChildren(empty);
}

function renderItems() {
  const visibleItems = galleryItems.filter((item) =>
    activeFilter === "audio" ? item.type === "audio" : item.type !== "audio",
  );
  const visualItems = visibleItems.filter((item) => item.type !== "audio");
  const musicItems = visibleItems.filter((item) => item.type === "audio");

  count.textContent = `${galleryItems.length} ${galleryItems.length === 1 ? "ITEM" : "ITEMS"}`;
  renderCollection(imageVideoGrid, visualItems, "No photos or videos have been added yet.");
  renderCollection(audioGrid, musicItems, "No music has been added yet.");
}

function renderCollection(container, items, emptyText) {
  if (!items.length) {
    showEmptyState(container, emptyText);
    return;
  }

  const cards = items.map((item) => {
    const card = document.createElement("figure");
    card.className = `gallery-item gallery-item-${item.type}`;

    if (item.type === "image") {
      const image = document.createElement("img");
      image.src = item.downloadURL;
      image.alt = item.title;
      image.loading = "lazy";
      card.appendChild(image);
    } else if (item.type === "video") {
      const video = document.createElement("video");
      video.src = item.downloadURL;
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("aria-label", item.title);
      card.appendChild(video);
    } else {
      const audio = document.createElement("audio");
      audio.src = item.downloadURL;
      audio.controls = true;
      audio.preload = "none";
      audio.setAttribute("aria-label", item.title);
      card.appendChild(audio);
    }

    const caption = document.createElement("figcaption");
    caption.className = "gallery-caption";
    caption.append(
      makeTextElement("h3", "gallery-caption-title", item.title),
      makeTextElement("p", "gallery-caption-description", item.description),
    );
    card.appendChild(caption);

    if (isOwner) {
      const removeButton = makeTextElement("button", "gallery-delete", "Remove");
      removeButton.type = "button";
      removeButton.addEventListener("click", async () => {
        if (!window.confirm(`Remove “${item.title}” from the public gallery?`)) return;
        removeButton.disabled = true;
        setStatus(`Removing ${item.title}…`);
        try {
          await deleteGalleryItem(item);
          setStatus(`${item.title} was removed.`);
        } catch (error) {
          console.error("Could not remove gallery media:", error);
          setStatus(error.message || "Could not remove this item. Check Firebase settings and try again.", true);
          removeButton.disabled = false;
        }
      });
      card.appendChild(removeButton);
    }

    return card;
  });
  container.replaceChildren(...cards);
}

function renderQueue() {
  queue.replaceChildren();
  mediaQueue.forEach((entry, index) => {
    const row = document.createElement("fieldset");
    row.className = "gallery-queue-item";
    const legend = makeTextElement(
      "legend",
      "gallery-queue-name",
      `${entry.file.name} · ${formatBytes(entry.file.size)}`,
    );
    const titleLabel = makeTextElement("label", "", "Title");
    const titleId = `gallery-title-${index}`;
    titleLabel.htmlFor = titleId;
    const titleInput = document.createElement("input");
    titleInput.id = titleId;
    titleInput.type = "text";
    titleInput.maxLength = 120;
    titleInput.required = true;
    titleInput.value = entry.title;
    titleInput.addEventListener("input", () => { entry.title = titleInput.value; });

    const descriptionLabel = makeTextElement("label", "", "Description");
    const descriptionId = `gallery-description-${index}`;
    descriptionLabel.htmlFor = descriptionId;
    const descriptionInput = document.createElement("textarea");
    descriptionInput.id = descriptionId;
    descriptionInput.rows = 3;
    descriptionInput.maxLength = 1000;
    descriptionInput.required = true;
    descriptionInput.value = entry.description;
    descriptionInput.placeholder = "Write a description for this photo, video, or track";
    descriptionInput.addEventListener("input", () => { entry.description = descriptionInput.value; });

    const progress = document.createElement("progress");
    progress.max = 100;
    progress.value = entry.progress;
    progress.setAttribute("aria-label", `Upload progress for ${entry.file.name}`);
    const progressText = makeTextElement("span", "gallery-upload-progress", entry.progressLabel);
    const removeButton = makeTextElement("button", "gallery-queue-remove", "Remove from selection");
    removeButton.type = "button";
    removeButton.disabled = entry.uploading;
    removeButton.addEventListener("click", () => {
      mediaQueue.splice(index, 1);
      renderQueue();
    });

    row.append(legend, titleLabel, titleInput, descriptionLabel, descriptionInput, progress, progressText, removeButton);
    queue.appendChild(row);
  });
  uploadButton.disabled = !mediaQueue.length || mediaQueue.some((entry) => entry.uploading);
}

function authErrorMessage(error) {
  switch (error.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Sign-in is temporarily locked after too many attempts. Please wait and try again.";
    case "auth/network-request-failed":
      return "Could not reach Firebase Authentication. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled in Firebase Authentication.";
    default:
      return error.message || "Sign-in failed. Check Firebase Authentication setup.";
  }
}

function updateOwnerControls(user) {
  isOwner = Boolean(user && isGalleryOwnerConfigured());
  loginForm.hidden = isOwner;
  uploadForm.hidden = !isOwner;
  signOutButton.hidden = !isOwner;
  renderItems();
}

for (const button of filterButtons) {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.galleryFilter;
    for (const tab of filterButtons) {
      tab.setAttribute("aria-pressed", String(tab === button));
    }
    const isMusic = activeFilter === "audio";
    imageVideoGrid.hidden = isMusic;
    audioGrid.hidden = !isMusic;
    galleryHeading.textContent = isMusic ? "Music" : "Photo gallery";
    renderItems();
  });
}

fileInput.addEventListener("change", () => {
  const accepted = [];
  const rejected = [];
  for (const file of fileInput.files) {
    const type = mediaType(file);
    if (!type) {
      rejected.push(`${file.name}: choose an image, video, or audio file.`);
      continue;
    }
    if (file.size === 0) {
      rejected.push(`${file.name}: empty files cannot be uploaded.`);
      continue;
    }
    if (file.size > maxBytes[type]) {
      rejected.push(`${file.name}: ${type} files must be no larger than ${formatBytes(maxBytes[type])}.`);
      continue;
    }
    accepted.push({
      file,
      type,
      title: file.name.replace(/\.[^.]+$/, "").slice(0, 120),
      description: "",
      progress: 0,
      progressLabel: "Ready",
      uploading: false,
    });
  }

  mediaQueue.push(...accepted);
  renderQueue();
  setStatus(rejected.length ? rejected.join(" ") : `${accepted.length} file${accepted.length === 1 ? "" : "s"} added to the upload queue.`, rejected.length > 0);
  fileInput.value = "";
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  setStatus("Signing in…");
  try {
    await signInGalleryOwner(
      document.getElementById("galleryEmail").value.trim(),
      document.getElementById("galleryPassword").value,
    );
    loginForm.reset();
    setStatus("Signed in. You can now upload and manage gallery media.");
  } catch (error) {
    console.error("Gallery owner sign-in failed:", error);
    setStatus(authErrorMessage(error), true);
  } finally {
    button.disabled = false;
  }
});

signOutButton.addEventListener("click", async () => {
  signOutButton.disabled = true;
  try {
    await signOutGalleryOwner();
    setStatus("Signed out. The public gallery remains available to visitors.");
  } catch (error) {
    console.error("Gallery owner sign-out failed:", error);
    setStatus(error.message || "Could not sign out. Please try again.", true);
  } finally {
    signOutButton.disabled = false;
  }
});

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const incomplete = mediaQueue.some((entry) => !entry.title.trim() || !entry.description.trim());
  if (incomplete) {
    setStatus("Add a title and description for every selected item before uploading.", true);
    return;
  }

  uploadButton.disabled = true;
  try {
    for (const entry of mediaQueue) {
      if (entry.uploaded) continue;
      entry.uploading = true;
      entry.progressLabel = "Uploading…";
      renderQueue();
      setStatus(`Uploading ${entry.title}…`);
      try {
        await uploadGalleryItem({
          file: entry.file,
          title: entry.title.trim(),
          description: entry.description.trim(),
          type: entry.type,
          onProgress: (fraction) => {
            entry.progress = Math.round(fraction * 100);
            entry.progressLabel = `${entry.progress}%`;
            const progress = [...queue.querySelectorAll("progress")][mediaQueue.indexOf(entry)];
            const progressText = [...queue.querySelectorAll(".gallery-upload-progress")][mediaQueue.indexOf(entry)];
            if (progress) progress.value = entry.progress;
            if (progressText) progressText.textContent = entry.progressLabel;
          },
        });
        entry.uploaded = true;
        entry.uploading = false;
        entry.progress = 100;
        entry.progressLabel = "Uploaded";
      } catch (error) {
        entry.uploading = false;
        console.error(`Could not upload gallery file ${entry.file.name}:`, error);
        setStatus(`${entry.file.name} could not be uploaded: ${error.message || "Check Firebase Storage rules and try again."}`, true);
        renderQueue();
        return;
      }
    }
    const uploadedCount = mediaQueue.length;
    mediaQueue = mediaQueue.filter((entry) => !entry.uploaded);
    renderQueue();
    uploadForm.reset();
    setStatus(`${uploadedCount} item${uploadedCount === 1 ? "" : "s"} uploaded to the public gallery.`);
  } finally {
    uploadButton.disabled = !mediaQueue.length;
  }
});

if (!isFirebaseConfigured()) {
  setStatus("The gallery is not connected yet. Configure Firebase to load and upload public media.", true);
  count.textContent = "NOT CONNECTED";
  showEmptyState(imageVideoGrid, "Gallery is waiting for Firebase setup.");
  showEmptyState(audioGrid, "Music gallery is waiting for Firebase setup.");
  loginForm.hidden = true;
} else {
  try {
    watchGalleryItems(
      (items) => {
        galleryItems = items;
        renderItems();
        if (!items.length) {
          setStatus("No media has been uploaded yet. Sign in as the owner to add photos, videos, or music.");
        } else {
          setStatus(`${items.length} public gallery item${items.length === 1 ? "" : "s"} loaded.`);
        }
      },
      (error) => {
        console.error("Could not load public gallery media:", error);
        setStatus("Could not load the gallery. Check the published Firestore rules and your connection.", true);
      },
    );
    watchGalleryAuth(
      (user) => {
        updateOwnerControls(user?.uid === undefined ? null : user);
        if (user && !isOwner) {
          setStatus("This account is not authorized to manage the gallery.", true);
        }
      },
      (error) => {
        console.error("Could not check gallery sign-in state:", error);
        setStatus("Could not check gallery sign-in. Check Firebase Authentication setup.", true);
      },
    );
    if (!isGalleryOwnerConfigured()) {
      setStatus("Gallery viewing is ready. Set your Firebase gallery owner UID to enable owner sign-in and uploads.");
    }
  } catch (error) {
    console.error("Could not initialize the Firebase gallery:", error);
    setStatus(error.message || "Could not initialize the gallery. Check Firebase setup.", true);
  }
}
