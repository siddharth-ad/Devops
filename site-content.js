function applySiteContent(content) {
  document.querySelectorAll("[data-site-content]").forEach((element) => {
    const key = element.dataset.siteContent;
    const value = content[key];
    if (typeof value !== "string" || !value.trim()) return;

    if (element instanceof HTMLMetaElement) {
      element.content = value;
    } else {
      element.textContent = value;
    }
  });

  document.querySelectorAll("[data-site-href]").forEach((element) => {
    const key = element.dataset.siteHref;
    const value = content[key];
    if (typeof value !== "string" || !value.trim()) return;

    if (key === "contactEmail") {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        element.href = "mailto:" + value;
      } else {
        console.error("Invalid contactEmail in Firestore siteContent/portfolio.");
      }
      return;
    }

    try {
      const url = new URL(value);
      if (url.protocol === "https:" || url.protocol === "http:") {
        element.href = url.href;
      } else {
        console.error("Only HTTP(S) URLs are allowed for Firestore content field:", key);
      }
    } catch (error) {
      console.error("Invalid URL in Firestore content field:", key, error);
    }
  });

  document.querySelectorAll("[data-site-tags]").forEach((element) => {
    const key = element.dataset.siteTags;
    const tags = content[key];
    if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === "string")) return;

    element.replaceChildren(...tags.slice(0, 12).map((tag) => {
      const item = document.createElement("li");
      item.textContent = tag.slice(0, 50);
      return item;
    }));
  });
}

import("./firebase.js")
  .then(({ isFirebaseConfigured, watchSiteContent }) => {
    if (!isFirebaseConfigured()) {
      console.info("Firebase is not configured yet. The website is using its built-in content.");
      return;
    }

    watchSiteContent(
      (content) => {
        if (!content) {
          console.warn("Firestore document siteContent/portfolio does not exist; using built-in content.");
          return;
        }
        applySiteContent(content);
      },
      (error) => console.error("Could not load live website content from Firebase:", error),
    );
  })
  .catch((error) => console.error("Could not initialize the Firebase content integration:", error));
