// src/utils/sendEmail.js
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, subject, html) {
  try {
    console.log("sendEmail called -> to:", to);
    const resp = await resend.emails.send({
      from: "Nemnidhi <onboarding@nemnidhi.com>",
      to,
      subject,
      html,
    });

    console.log("Resend response:", resp);

    // If provider returned an error wrapper, treat as failure
    if (resp && resp.error) {
      console.error("Resend reported error:", resp.error);
      return false;
    }

    // resp may include id/messageId when successful
    return true;
  } catch (err) {
    console.error("sendEmail ERROR for", to, err);
    return false;
  }
}

module.exports = sendEmail;
