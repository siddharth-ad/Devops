const test = require("node:test");
const assert = require("node:assert/strict");
const { buildGalleryItems } = require("./pinterest-gallery");

test("converts Pinterest board photos to safe gallery items with captions", () => {
  const items = buildGalleryItems([{
    id: "123",
    title: "Weekend",
    description: "A day out",
    media: {
      media_type: "image",
      images: {
        "600x": {
          url: "https://i.pinimg.com/600x/photo.jpg",
          width: 600,
          height: 800,
        },
        "1200x": {
          url: "https://i.pinimg.com/1200x/photo.jpg",
          width: 1200,
          height: 1600,
        },
      },
    },
  }]);

  assert.deepEqual(items, [{
    id: "123-0",
    type: "image",
    src: "https://i.pinimg.com/1200x/photo.jpg",
    title: "Weekend",
    description: "A day out",
  }]);
});

test("includes every image in multi-image pins and skips video-only pins", () => {
  const items = buildGalleryItems([
    {
      id: "multi",
      media: {
        media_type: "multiple_images",
        items: [
          { images: { "400x300": { url: "https://i.pinimg.com/400x300/one.jpg" } } },
          { images: { "400x300": { url: "https://i.pinimg.com/400x300/two.jpg" } } },
        ],
      },
    },
    { id: "video", media: { media_type: "video" } },
  ]);

  assert.deepEqual(items.map((item) => item.src), [
    "https://i.pinimg.com/400x300/one.jpg",
    "https://i.pinimg.com/400x300/two.jpg",
  ]);
});

test("rejects non-Pinterest image URLs", () => {
  const items = buildGalleryItems([{
    id: "unsafe",
    media: {
      media_type: "image",
      images: { "600x": { url: "https://example.com/image.jpg" } },
    },
  }]);

  assert.deepEqual(items, []);
});

test("includes every photo across a board with more than 50 pins", () => {
  const items = buildGalleryItems(Array.from({ length: 60 }, (_, index) => ({
    id: String(index),
    media: {
      media_type: "image",
      images: { "150x150": { url: `https://i.pinimg.com/150x150/${index}.jpg` } },
    },
  })));

  assert.equal(items.length, 60);
});
