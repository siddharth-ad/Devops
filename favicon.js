// Animate the DevOps infinity loop in the browser tab's tiny favicon.
(function () {
  const icon = document.querySelector('link[rel="icon"]');
  if (!icon) return;

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) return;

  const colors = [
    "#EE0000", "#0052CC", "#F09820", "#2496ED", "#00BFB3", "#49A0C8",
    "#FC6D26", "#2088FF", "#FFD814", "#4BA3D9", "#D33833", "#326CE5",
    "#F46800", "#C71A36", "#8B949E", "#2F93E0", "#E6522C", "#40B4E5",
    "#FF6600", "#43B02A", "#7B42BC", "#3BD671", "#1868F2", "#0054FF",
    "#40BE46", "#5282FF", "#FE7139",
  ];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let phase = 0;
  let timer = 0;

  function draw() {
    context.clearRect(0, 0, 64, 64);
    context.fillStyle = "#080b12";
    context.beginPath();
    context.roundRect(0, 0, 64, 64, 14);
    context.fill();

    context.beginPath();
    for (let i = 0; i <= 160; i++) {
      const angle = (i / 160) * Math.PI * 2;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      const divisor = 1 + sin * sin;
      const x = 32 + (25 * cos) / divisor;
      const y = 32 + (25 * sin * cos) / divisor;
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.strokeStyle = "#347dff";
    context.lineWidth = 3;
    context.shadowColor = "#268aff";
    context.shadowBlur = 8;
    context.stroke();
    context.shadowBlur = 0;

    colors.forEach((color, index) => {
      const angle = phase + (index * Math.PI * 2) / colors.length;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      const divisor = 1 + sin * sin;
      const x = 32 + (25 * cos) / divisor;
      const y = 32 + (25 * sin * cos) / divisor;
      context.beginPath();
      context.arc(x, y, 2, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
    });

    icon.href = canvas.toDataURL("image/png");
  }

  function start() {
    draw();
    if (!reduceMotion.matches && !document.hidden && !timer) {
      timer = window.setInterval(() => {
        phase += 0.12;
        draw();
      }, 120);
    }
  }

  function stop() {
    if (!timer) return;
    window.clearInterval(timer);
    timer = 0;
  }

  start();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) {
      stop();
      draw();
    } else {
      start();
    }
  });
})();
