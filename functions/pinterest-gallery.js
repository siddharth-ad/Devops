const PINTEREST_IMAGE_HOST = "i.pinimg.com";

function getImageSets(pin) {
  const media = pin?.media;
  if (!media) return [];

  if (media.media_type === "image") {
    return [media.images];
  }

  if (media.media_type === "multiple_images") {
    return Array.isArray(media.items)
      ? media.items.map((item) => item?.images)
      : [];
  }

  if (media.media_type === "multiple_mixed") {
    return (Array.isArray(media.items) ? media.items : [])
      .filter((item) => item.item_type === "image")
      .map((item) => item.images);
  }

  return [];
}

function getLargestImageUrl(imageSet) {
  if (!imageSet || typeof imageSet !== "object") return null;

  const images = Object.values(imageSet)
    .filter((image) => image && typeof image.url === "string")
    .sort((left, right) => (right.width || 0) * (right.height || 0) - (left.width || 0) * (left.height || 0));

  for (const image of images) {
    try {
      const url = new URL(image.url);
      if (url.protocol === "https:" && url.hostname === PINTEREST_IMAGE_HOST) {
        return url.href;
      }
    } catch (error) {
      if (error instanceof TypeError) continue;
      throw error;
    }
  }

  return null;
}

function buildGalleryItems(pins) {
  return (Array.isArray(pins) ? pins : []).flatMap((pin) => {
    const title = typeof pin.title === "string" && pin.title.trim()
      ? pin.title.trim().slice(0, 100)
      : "My life style";
    const description = typeof pin.description === "string" && pin.description.trim()
      ? pin.description.trim().slice(0, 800)
      : typeof pin.alt_text === "string" && pin.alt_text.trim()
        ? pin.alt_text.trim().slice(0, 500)
        : "From my Pinterest board, My life style.";

    return getImageSets(pin)
      .map((imageSet, index) => {
        const src = getLargestImageUrl(imageSet);
        if (!src) return null;

        return {
          id: `${pin.id || "pin"}-${index}`,
          type: "image",
          src,
          title,
          description,
        };
      })
      .filter(Boolean);
  });
}

module.exports = { buildGalleryItems };
