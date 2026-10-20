// ===== Infinity loop with 27 tool logos =====
(function () {
  const box = document.getElementById("infinity");
  const stage = document.getElementById("infinityStage");
  const nameBox = document.getElementById("infinityName");
  if (!box || !stage) return;

  const TOOLS = [
    ["Ansible", "ansible", "EE0000"],
    ["Bamboo", "bamboo", "0052CC"],
    ["Chef", "chef", "F09820"],
    ["Docker", "docker", "2496ED"],
    ["ELK Stack", "elasticstack", "00BFB3"],
    ["Fluentd", "fluentd", "49A0C8"],
    ["GitLab", "gitlab", "FC6D26"],
    ["GitHub Actions", "githubactions", "2088FF"],
    ["HashiCorp Vault", "vault", "FFD814"],
    ["Icinga", "icinga", "4BA3D9"],
    ["Jenkins", "jenkins", "D33833"],
    ["Kubernetes", "kubernetes", "326CE5"],
    ["Loki", "loki", "F46800"],
    ["Maven", "apachemaven", "C71A36"],
    ["Nagios", "nagios", "8B949E"],
    ["Octopus Deploy", "octopusdeploy", "2F93E0"],
    ["Prometheus", "prometheus", "E6522C"],
    ["Quay", "quay", "40B4E5"],
    ["RabbitMQ", "rabbitmq", "FF6600"],
    ["Selenium", "selenium", "43B02A"],
    ["Terraform", "terraform", "7B42BC"],
    ["Uptime Robot", "uptimerobot", "3BD671"],
    ["Vagrant", "vagrant", "1868F2"],
    ["Wiz", "wiz", "0054FF"],
    ["Xray", "jfrog", "40BE46"],
    ["YDB", "ydb", "5282FF"],
    ["Zipkin", "zipkin", "FE7139"],
  ];

  const W = 400, H = 200;
  const AY = (H * 0.4) / 0.3536;      // makes the loop 80% of the box height
  const AX = W * 0.46;

  // A point on the infinity curve for angle t
  function point(t) {
    const s = Math.sin(t), c = Math.cos(t), d = 1 + s * s;
    return { x: W / 2 + (AX * c) / d, y: H / 2 + (AY * s * c) / d, depth: s };
  }

  // 1) Draw the loop (SVG)
  let d = "";
  for (let i = 0; i <= 160; i++) {
    const p = point((i / 160) * Math.PI * 2);
    d += (i === 0 ? "M" : "L") + p.x.toFixed(1) + " " + p.y.toFixed(1) + " ";
  }
  d += "Z";

  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML =
    '<defs><linearGradient id="infGrad" x1="0" x2="1">' +
    '<stop offset="0" stop-color="#19D3FF"/><stop offset="0.5" stop-color="#2B6BFF"/>' +
    '<stop offset="1" stop-color="#B25CFF"/></linearGradient></defs>' +
    '<g class="inf-glow">' +
    '<path d="' + d + '" fill="none" stroke="url(#infGrad)" stroke-width="9" opacity="0.28"/>' +
    '<path d="' + d + '" fill="none" stroke="url(#infGrad)" stroke-width="3"/>' +
    '<path class="inf-flow" d="' + d + '" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>' +
    '</g>';
  stage.appendChild(svg);

  // 2) Create one logo chip per tool
  const chips = TOOLS.map(function (tool) {
    const name = tool[0], logo = tool[1], color = tool[2];
    const chip = document.createElement("div");
    chip.className = "inf-chip";
    chip.style.setProperty("--c", "#" + color);
    chip.setAttribute("role", "img");
    chip.setAttribute("aria-label", name);

    const img = document.createElement("img");
    img.src = "https://cdn.simpleicons.org/" + logo + "/" + color;
    img.alt = "";
    img.addEventListener("error", function () {
      const badge = document.createElement("span");
      badge.className = "tool-badge";
      badge.style.setProperty("--c", "#" + color);
      badge.textContent = name.charAt(0);
      img.replaceWith(badge);
    });
    chip.appendChild(img);

    chip.addEventListener("mouseenter", function () { if (nameBox) nameBox.textContent = name; });
    chip.addEventListener("mouseleave", function () { if (nameBox) nameBox.textContent = "27 DevOps tools"; });

    stage.appendChild(chip);
    return chip;
  });

  // 3) Move the chips along the loop
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const compactLayout = window.matchMedia("(max-width: 600px)").matches;
  let offset = 0, last = 0, paused = false, inView = true, animationFrame = 0;
  const SPEED = 0.18;                  // radians per second (raise for faster)

  function place() {
    chips.forEach(function (chip, i) {
      const p = point(offset + (i * Math.PI * 2) / chips.length);
      const scale = 1 + (compactLayout ? 0.16 : 0.28) * p.depth; // front = bigger
      chip.style.left = (p.x / W) * 100 + "%";
      chip.style.top = (p.y / H) * 100 + "%";
      chip.style.transform = "scale(" + scale.toFixed(2) + ")";
      chip.style.opacity = (0.72 + 0.28 * ((p.depth + 1) / 2)).toFixed(2);   // back = dimmer
      chip.style.zIndex = Math.round((p.depth + 1) * 10);
    });
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!paused && !reduceMotion) offset += SPEED * dt;
    place();
    animationFrame = requestAnimationFrame(frame);
  }

  function startAnimation() {
    if (reduceMotion || !inView || document.hidden || animationFrame) return;
    last = performance.now();
    animationFrame = requestAnimationFrame(frame);
  }

  function stopAnimation() {
    if (!animationFrame) return;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }

  place();

  if ("IntersectionObserver" in window) {
    const visibilityObserver = new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) startAnimation();
      else stopAnimation();
    });
    visibilityObserver.observe(box);
  } else {
    startAnimation();
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopAnimation();
    else startAnimation();
  });

  // Pause while the mouse is over the loop
  box.addEventListener("mouseenter", function () { paused = true; });
  box.addEventListener("mouseleave", function () { paused = false; });

  // 4) Tilt toward the mouse
  const side = box.parentElement;
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    side.addEventListener("mousemove", function (e) {
      const r = box.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / r.width;
      const y = (e.clientY - (r.top + r.height / 2)) / r.height;
      stage.style.setProperty("--ry", Math.max(-1, Math.min(1, x)) * 18 + "deg");
      stage.style.setProperty("--rx", Math.max(-1, Math.min(1, y)) * -14 + "deg");
    });
    side.addEventListener("mouseleave", function () {
      stage.style.setProperty("--rx", "0deg");
      stage.style.setProperty("--ry", "0deg");
    });
  }
})();