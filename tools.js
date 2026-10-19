// ===== Tools strip (one scrolling row with logos) =====
(function () {
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

  const row = document.getElementById("toolsRow1");
  if (!row) return;

  function makeCard(tool) {
    const name = tool[0], logo = tool[1], color = tool[2];
    const card = document.createElement("div");
    card.className = "tool-card";
    card.style.setProperty("--c", "#" + color);

    const img = document.createElement("img");
    img.src = logo.indexOf(".") !== -1 ? logo : "https://cdn.simpleicons.org/" + logo + "/" + color;
    img.alt = "";
    img.addEventListener("error", function () {
      const badge = document.createElement("span");
      badge.className = "tool-badge";
      badge.textContent = name.charAt(0);
      img.replaceWith(badge);
    });

    card.appendChild(img);
    card.appendChild(document.createTextNode(name));
    return card;
  }

  const track = document.createElement("div");
  track.className = "tools-track";

  for (let copy = 0; copy < 2; copy++) {
    const group = document.createElement("div");
    group.className = "tools-group";
    if (copy === 1) group.setAttribute("aria-hidden", "true");
    TOOLS.forEach(function (tool) { group.appendChild(makeCard(tool)); });
    track.appendChild(group);
  }
  row.appendChild(track);
})();