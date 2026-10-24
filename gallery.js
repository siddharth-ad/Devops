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

const validMedia = getValidMedia(galleryMedia);
count.textContent = `${validMedia.length} ${validMedia.length === 1 ? "ITEM" : "ITEMS"}`;
if (validMedia.length) {
  gallery.replaceChildren(...validMedia.map(createCard));
  status.textContent = `${validMedia.length} public photo or video${validMedia.length === 1 ? "" : "s"} loaded.`;
} else {
  const empty = makeTextElement("p", "gallery-empty", "No photos or videos have been added yet.");
  empty.setAttribute("role", "status");
  gallery.replaceChildren(empty);
  status.textContent = "No media has been added yet. New photos and videos will appear here after the site is updated.";
}
