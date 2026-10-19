// ===== Mobile menu =====
const navToggle = document.getElementById("navToggle");
const siteNav = document.getElementById("siteNav");

navToggle.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

// Close the menu after tapping a link
siteNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    siteNav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

// ===== Footer year (updates itself every January) =====
document.getElementById("year").textContent = new Date().getFullYear();

// ===== Contact form (works with Formspree) =====
const form = document.getElementById("contactForm");
const statusText = document.getElementById("formStatus");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusText.className = "form-status";

  // Reminder if the form has not been connected yet
  if (form.action.includes("YOUR_FORM_ID")) {
    statusText.textContent = "The form is not connected yet. Add your Formspree form ID in index.html.";
    statusText.classList.add("error");
    return;
  }

  statusText.textContent = "Sending...";

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      statusText.textContent = "Message sent. I'll reply within one working day.";
      statusText.classList.add("ok");
      form.reset();
    } else {
      throw new Error("Request failed");
    }
  } catch (error) {
    statusText.textContent = "Message not sent. Please email me directly instead.";
    statusText.classList.add("error");
  }
});
