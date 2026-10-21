// ===== Footer year (updates itself every January) =====
document.getElementById("year").textContent = new Date().getFullYear();

// ===== Contact form (stores submissions in Firebase) =====
const form = document.getElementById("contactForm");
const statusText = document.getElementById("formStatus");
const submitButton = form.querySelector('button[type="submit"]');

function getContactErrorMessage(error) {
  if (error?.message?.includes("Set your Firebase web app configuration")) {
    return "Firebase is not configured in this deployed version. Add your web app config, publish it, then try again.";
  }

  switch (error?.code) {
    case "permission-denied":
    case "firestore/permission-denied":
      return "Firestore rejected this message. Check that the latest rules from firestore.rules are published.";
    case "unavailable":
    case "firestore/unavailable":
    case "deadline-exceeded":
    case "firestore/deadline-exceeded":
      return "Could not reach Firebase. Check your internet connection and try again.";
    case "failed-precondition":
    case "firestore/failed-precondition":
      return "Firestore setup is incomplete. Check that the database exists and its rules are published.";
    case "invalid-argument":
    case "firestore/invalid-argument":
      return "Firebase rejected the message format. Check the Firestore rules.";
    case "resource-exhausted":
    case "firestore/resource-exhausted":
      return "Firebase has reached a usage limit. Check the project quota and billing status.";
    default:
      if (error instanceof TypeError) {
        return "Could not load or reach Firebase. Use localhost or HTTPS and check your network connection.";
      }
      return "Message not saved. Check the browser console for the Firebase error, then try again.";
  }
}

function showContactStatus(message, type) {
  statusText.className = `form-status ${type}`;
  statusText.textContent = message;
  statusText.focus({ preventScroll: true });
  statusText.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "nearest",
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusText.className = "form-status";
  statusText.textContent = "Sending...";
  submitButton.disabled = true;

  try {
    const { saveContactMessage } = await import("./firebase.js");
    const values = new FormData(form);
    const contactMessage = {
      name: String(values.get("name") ?? "").trim(),
      email: String(values.get("email") ?? "").trim(),
      message: String(values.get("message") ?? "").trim(),
    };
    await saveContactMessage(contactMessage);

    form.reset();
    try {
      const { sendContactNotification } = await import("./email-notifications.js");
      await sendContactNotification(contactMessage);
      showContactStatus("Message sent successfully. Thank you for reaching out!", "ok");
    } catch (emailError) {
      console.error("Firebase saved the contact message, but email delivery failed:", emailError);
      const message = emailError.message?.includes("not configured")
        ? "Your message was saved in Firebase, but email is not configured yet. Add your EmailJS service ID, template ID, and public key to emailjs-config.js."
        : "Your message was saved in Firebase, but the email notification could not be sent. Check EmailJS settings and try again later.";
      showContactStatus(message, "error");
    }
  } catch (error) {
    console.error("Firebase contact form submission failed:", error);
    showContactStatus(getContactErrorMessage(error), "error");
  } finally {
    submitButton.disabled = false;
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

// Reveal content as it enters the viewport and reset it when it leaves,
// so the same motion plays in reverse when visitors scroll back up.
const scrollRevealItems = document.querySelectorAll(
  ".hero-grid > *, .spotlight-inner > *, .tools-wall, " +
  "#services .section-title, #services .service, " +
  "#work .section-title, #work .project, " +
  "#contact .contact-grid > *, .site-footer .footer-inner",
);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (
  "IntersectionObserver" in window &&
  !prefersReducedMotion
) {
  let scrollDirection = "down";
  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY !== lastScrollY) {
      scrollDirection = currentScrollY > lastScrollY ? "down" : "up";
      lastScrollY = currentScrollY;
    }
  }, { passive: true });

  const scrollRevealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.dataset.scrollDirection = scrollDirection;
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    },
    { threshold: 0.08, rootMargin: "-8% 0px -8% 0px" },
  );

  scrollRevealItems.forEach((item) => {
    const siblingIndex = Array.from(item.parentElement.children).indexOf(item);
    item.style.setProperty("--reveal-order", String(Math.min(siblingIndex, 3)));
    item.classList.add("scroll-reveal");
    scrollRevealObserver.observe(item);
  });
}

if (!prefersReducedMotion) {
  const spotlight = document.getElementById("spotlight");
  const parallaxLayers = spotlight
    ? [
        [spotlight.querySelector(".glow"), -34],
        [spotlight.querySelector(".stars"), 18],
      ]
    : [];
  let parallaxFrame = 0;

  const updateParallax = () => {
    parallaxFrame = 0;
    if (!spotlight) return;

    const bounds = spotlight.getBoundingClientRect();
    const distanceFromCenter =
      (bounds.top + bounds.height / 2 - window.innerHeight / 2) / window.innerHeight;
    const progress = Math.max(-1, Math.min(1, distanceFromCenter));

    parallaxLayers.forEach(([layer, strength]) => {
      layer?.style.setProperty("--scroll-parallax", `${progress * strength}px`);
    });
  };

  const scheduleParallaxUpdate = () => {
    if (!parallaxFrame) parallaxFrame = window.requestAnimationFrame(updateParallax);
  };

  window.addEventListener("scroll", scheduleParallaxUpdate, { passive: true });
  window.addEventListener("resize", scheduleParallaxUpdate);
  scheduleParallaxUpdate();
}




















































// ===== Chat assistant =====
(function () {
  const launcher = document.getElementById("botLauncher");
  const win = document.getElementById("botWindow");
  const closeBtn = document.getElementById("botClose");
  const log = document.getElementById("botMessages");
  const chipsBox = document.getElementById("botChips");
  const form = document.getElementById("botForm");
  const input = document.getElementById("botInput");
  if (!launcher || !win) return;

  // ---------- 1. What the bot knows (EDIT THESE ANSWERS) ----------
  const TOOL_INFO = {
    "ansible": "Ansible automates server setup and app deployment using simple YAML playbooks, with no agent needed.",
    "bamboo": "Bamboo is Atlassian's CI/CD server. It builds, tests and deploys code and connects well with Jira.",
    "chef": "Chef manages server configuration as code using 'recipes' and 'cookbooks'.",
    "docker": "Docker packages an app and everything it needs into a container, so it runs the same everywhere.",
    "elk": "The ELK Stack (Elasticsearch, Logstash, Kibana) collects, searches and visualises logs.",
    "elk stack": "The ELK Stack (Elasticsearch, Logstash, Kibana) collects, searches and visualises logs.",
    "fluentd": "Fluentd collects logs from many sources and sends them to one place such as Elasticsearch.",
    "gitlab": "GitLab hosts Git repositories and has built-in CI/CD pipelines.",
    "github actions": "GitHub Actions runs automated workflows (tests, builds, deploys) whenever you push code.",
    "github": "GitHub hosts code with Git, supports teamwork through pull requests, and runs GitHub Actions.",
    "vault": "HashiCorp Vault stores and protects secrets like passwords, tokens and API keys.",
    "hashicorp vault": "HashiCorp Vault stores and protects secrets like passwords, tokens and API keys.",
    "icinga": "Icinga monitors servers and services and sends alerts when something fails.",
    "jenkins": "Jenkins is an open-source automation server for building, testing and deploying software with pipelines.",
    "kubernetes": "Kubernetes runs and scales containers across many machines and restarts them if they fail.",
    "k8s": "Kubernetes runs and scales containers across many machines and restarts them if they fail.",
    "loki": "Grafana Loki is a lightweight log system that works well with Grafana dashboards.",
    "maven": "Maven builds Java projects and manages their dependencies using a pom.xml file.",
    "nagios": "Nagios is a classic monitoring tool that checks hosts and services and raises alerts.",
    "octopus deploy": "Octopus Deploy automates releases and deployments across environments.",
    "octopus": "Octopus Deploy automates releases and deployments across environments.",
    "prometheus": "Prometheus collects metrics from your systems and triggers alerts. It is usually paired with Grafana.",
    "grafana": "Grafana turns metrics and logs into live dashboards and alerts.",
    "quay": "Quay is a container image registry that stores and scans Docker images.",
    "rabbitmq": "RabbitMQ is a message broker. It lets services talk to each other through queues.",
    "selenium": "Selenium automates web browsers for testing websites.",
    "terraform": "Terraform creates cloud infrastructure (AWS, GCP, Azure) from code. This is called Infrastructure as Code.",
    "uptime robot": "Uptime Robot checks if your website is online and alerts you when it goes down.",
    "vagrant": "Vagrant builds and manages reproducible virtual machine environments for development.",
    "wiz": "Wiz is a cloud security platform that finds risks and misconfigurations in cloud accounts.",
    "xray": "JFrog Xray scans software packages and container images for vulnerabilities.",
    "ydb": "YDB is a distributed SQL database from Yandex.",
    "zipkin": "Zipkin is a distributed tracing tool. It shows how a request travels through microservices.",
  };

  // keys = words that trigger the answer. go = optional button [selector or page, label]
  const INTENTS = [
    { keys: ["hi", "hello", "hey", "hii", "good morning", "good evening"],
      answer: "Hi! I'm the DevOps assistant on Siddharth's portfolio. Ask me about his projects, tools or how to get in touch." },
    { keys: ["who are you", "about", "siddharth", "yourself", "owner", "who is"],
      answer: "This is the portfolio of Siddharth Adhikary. He builds and showcases DevOps projects covering CI/CD, Infrastructure as Code and containers.",
      go: ["about.html", "Go to About"] },
    { keys: ["project", "projects", "work", "portfolio", "built"],
      answer: "Projects on this site:\n• CI/CD Pipeline (Git, GitHub Actions, automated deployment)\n• Exploring Projects (web, DevOps and automation)\n• Main agenda of a DevOps Engineer",
      go: ["#work", "See the projects"] },
    { keys: ["tools", "tool", "technology", "technologies", "stack", "skills", "skill", "know"],
      answer: "The tools strip covers 27 tools, including Ansible, Docker, Jenkins, Kubernetes, Terraform, Prometheus, GitLab and GitHub Actions. Type any tool name and I'll explain it.",
      go: ["#work", "See the tools"] },
    { keys: ["devops", "what is devops", "meaning"],
      answer: "DevOps combines Development and Operations. The goal is to release software faster and more safely using automation, CI/CD, monitoring and Infrastructure as Code." },
    { keys: ["ci cd", "cicd", "pipeline", "continuous integration", "continuous delivery", "continuous deployment"],
      answer: "CI/CD automates the path from code to production.\n• CI (Continuous Integration): every code change is built and tested automatically.\n• CD (Continuous Delivery/Deployment): tested code is released automatically.\nThe first project on this site shows it in action.",
      go: ["#work", "See the CI/CD project"] },
    { keys: ["infrastructure as code", "iac"],
      answer: "Infrastructure as Code means creating servers, networks and databases from code files (for example with Terraform or Ansible) instead of clicking in a console." },
    { keys: ["cloud", "aws", "gcp", "azure"],
      answer: "The portfolio mentions AWS, GCP and Azure as the cloud platforms Siddharth works with." },
    { keys: ["monitoring", "monitor", "logging", "logs", "observability"],
      answer: "For monitoring and logs, popular tools are Prometheus, Grafana, Loki, the ELK Stack, Fluentd, Nagios and Icinga. Ask me about any of them." },
    { keys: ["contact", "email", "mail", "reach", "hire", "linkedin", "connect", "talk"],
      answer: "You can reach Siddharth at tadhikary239@gmail.com, on LinkedIn, or on GitHub (siddharth-ad). He replies within 1 working day.",
      go: ["#contact", "Go to Contact"] },
    { keys: ["services", "service", "offer", "help with", "do for"],
      answer: "Services: building DevOps projects, DevOps implementation, and launch and support (hosting, domains, GitHub Pages).",
      go: ["#services", "See services"] },
    { keys: ["reply", "response time", "how long"],
      answer: "Messages are answered within 1 working day." },
    { keys: ["thanks", "thank you", "thx", "great", "awesome"],
      answer: "You're welcome! Anything else you'd like to know?" },
    { keys: ["bye", "goodbye", "see you"],
      answer: "Goodbye! Thanks for visiting." },
  ];

  const START_CHIPS = ["Show projects", "What tools do you know?", "What is CI/CD?", "How can I contact you?"];
  const FALLBACK = "I'm not sure about that one yet. Try asking about projects, tools (for example 'What is Docker?'), CI/CD, or how to contact Siddharth.";

  // ---------- 2. Understanding the question ----------
  const clean = (t) => " " + t.toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim() + " ";
  const hasWord = (text, key) => text.includes(" " + key + " ");

  function findAnswer(question) {
    const text = clean(question);

    // a) A specific tool? (longest names first, so "github actions" beats "github")
    const toolKeys = Object.keys(TOOL_INFO).sort((a, b) => b.length - a.length);
    for (const key of toolKeys) {
      if (hasWord(text, key)) return { answer: TOOL_INFO[key] };
    }

    // b) Otherwise pick the topic with the most matching keywords
    let best = null;
    let bestScore = 0;
    for (const intent of INTENTS) {
      let score = 0;
      for (const key of intent.keys) {
        if (hasWord(text, key)) score += key.split(" ").length; // longer phrases count more
      }
      if (score > bestScore) { best = intent; bestScore = score; }
    }
    return best || { answer: FALLBACK };
  }

  // ---------- 3. Showing messages ----------
  function scrollDown() { log.scrollTop = log.scrollHeight; }

  function addMessage(text, who, go) {
    const msg = document.createElement("div");
    msg.className = "bot-msg " + who;
    msg.textContent = text;            // textContent keeps user text safe

    if (go) {
      msg.appendChild(document.createElement("br"));
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bot-go";
      btn.textContent = go[1];
      btn.addEventListener("click", () => {
        if (go[0].startsWith("#")) {
          const target = document.querySelector(go[0]);
          if (target) target.scrollIntoView({ behavior: "smooth" });
        } else {
          window.location.href = go[0];
        }
        if (window.innerWidth < 600) closeChat();
      });
      msg.appendChild(btn);
    }
    log.appendChild(msg);
    scrollDown();
    return msg;
  }

  function reply(question) {
    const result = findAnswer(question);

    // typing animation
    const typing = document.createElement("div");
    typing.className = "bot-msg bot bot-typing";
    typing.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(typing);
    scrollDown();

    setTimeout(() => {
      typing.remove();
      addMessage(result.answer, "bot", result.go);
    }, 600 + Math.random() * 400);
  }

  function ask(question) {
    const q = question.trim();
    if (!q) return;
    addMessage(q, "user");
    reply(q);
  }

  // ---------- 4. Buttons and events ----------
  START_CHIPS.forEach((label) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.textContent = label;
    chip.addEventListener("click", () => ask(label));
    chipsBox.appendChild(chip);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(input.value);
    input.value = "";
  });

  let greeted = false;
  function openChat() {
    win.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    if (!greeted) {
      greeted = true;
      addMessage("Hi! 👋 I'm the DevOps assistant. Ask me about projects, tools or how to get in touch.", "bot");
    }
    input.focus();
  }
  function closeChat() {
    win.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  }

  launcher.addEventListener("click", () => (win.hidden ? openChat() : closeChat()));
  closeBtn.addEventListener("click", closeChat);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !win.hidden) closeChat();
  });
})();