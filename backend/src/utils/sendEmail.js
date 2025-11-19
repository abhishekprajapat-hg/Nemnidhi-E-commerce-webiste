const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, subject, html) {
  try {
    await resend.emails.send({
      from: 'Nemnidhi <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("Email error:", err);
    return false;
  }
}

module.exports = sendEmail;
