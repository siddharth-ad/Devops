// ===== 3D mascot: stars + head follows the mouse =====
(function () {
  const section = document.getElementById("spotlight");
  const mascot = document.getElementById("mascot");
  if (!section || !mascot) return;

  // 1) Create twinkling stars
  const starsBox = section.querySelector(".stars");
  for (let i = 0; i < 45; i++) {
    const star = document.createElement("span");
    const size = 1 + Math.random() * 2;
    star.style.width = size + "px";
    star.style.height = size + "px";
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    star.style.animationDelay = Math.random() * 3 + "s";
    starsBox.appendChild(star);
  }

  // 2) Head and eyes follow the mouse (skipped if the visitor prefers less motion)
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const clamp = (v, max) => Math.max(-max, Math.min(max, v));

  function setLook(rx, ry, px, py) {
    mascot.style.setProperty("--rx", rx + "deg");
    mascot.style.setProperty("--ry", ry + "deg");
    mascot.style.setProperty("--px", px + "px");
    mascot.style.setProperty("--py", py + "px");
  }

  section.addEventListener("mousemove", (event) => {
    const box = mascot.getBoundingClientRect();
    // distance from the mascot's centre, as a fraction of the screen
    const dx = (event.clientX - (box.left + box.width / 2)) / window.innerWidth;
    const dy = (event.clientY - (box.top + box.height / 2)) / window.innerHeight;

    setLook(clamp(-dy * 40, 18), clamp(dx * 40, 22), clamp(dx * 14, 4), clamp(dy * 14, 4));
  });

  section.addEventListener("mouseleave", () => setLook(0, 0, 0, 0));
})();