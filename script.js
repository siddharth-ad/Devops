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

















































// ===== Tools wall (logos + animation) =====
// Format: [ "Name", "logo name on simpleicons.org", "colour without #" ]
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

// Build one card
function makeToolCard([name, logo, color]) {
  const card = document.createElement("div");
  card.className = "tool-card";
  card.style.setProperty("--c", "#" + color);

  const img = document.createElement("img");
  // If the logo name contains a dot (like "logos/wiz.svg") use your own file,
  // otherwise load it from Simple Icons
  img.src = logo.includes(".") ? logo : "https://cdn.simpleicons.org/" + logo + "/" + color;
  img.alt = "";
  img.loading = "lazy";

  // If the logo is missing, show a coloured letter instead
  img.addEventListener("error", () => {
    const badge = document.createElement("span");
    badge.className = "tool-badge";
    badge.textContent = name.charAt(0);
    img.replaceWith(badge);
  });

  card.append(img, name);
  return card;
}

// Fill one row (the list is added twice so the loop is seamless)
function fillRow(rowId, list) {
  const row = document.getElementById(rowId);
  if (!row) return;

  const track = document.createElement("div");
  track.className = "tools-track";

  for (let copy = 0; copy < 2; copy++) {
    const group = document.createElement("div");
    group.className = "tools-group";
    if (copy === 1) group.setAttribute("aria-hidden", "true");
    list.forEach((tool) => group.appendChild(makeToolCard(tool)));
    track.appendChild(group);
  }
  row.appendChild(track);
}

// Put all the tools in one row
fillRow("toolsRow1", TOOLS);