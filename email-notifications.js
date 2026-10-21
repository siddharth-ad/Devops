import { emailjsConfig } from "./emailjs-config.js";

const emailjsEndpoint = "https://api.emailjs.com/api/v1.0/email/send";

function isEmailjsConfigured() {
  return Object.values(emailjsConfig).every(
    (value) => typeof value === "string" && value.length > 0 && !value.startsWith("YOUR_"),
  );
}

export async function sendContactNotification({ name, email, message }) {
  if (!isEmailjsConfigured()) {
    throw new Error("Email notifications are not configured. Add the EmailJS service ID, template ID, and public key.");
  }

  const response = await fetch(emailjsEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: emailjsConfig.serviceId,
      template_id: emailjsConfig.templateId,
      user_id: emailjsConfig.publicKey,
      template_params: {
        from_name: name,
        reply_to: email,
        message,
        subject: "New portfolio contact message",
      },
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).trim();
    throw new Error(detail || `Email service returned HTTP ${response.status}.`);
  }
}
