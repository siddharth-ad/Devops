document.querySelectorAll(".site-header").forEach((header) => {
  const toggle = header.querySelector(".nav-toggle");
  const navigation = header.querySelector(".site-nav");
  if (!toggle || !navigation) return;

  const closeMenu = () => {
    navigation.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) closeMenu();
  });
});
