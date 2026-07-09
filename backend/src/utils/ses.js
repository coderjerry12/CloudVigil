const { SESClient, SendRawEmailCommand } = require('@aws-sdk/client-ses');
const QRCode = require('qrcode');

const sesClient = new SESClient({});
const SENDER_EMAIL = process.env.SES_SENDER_EMAIL || 'noreply@eventshield.ai';

/**
 * Send registration email with QR code as CID inline attachment.
 * This is the ONLY reliable way to show images in Gmail.
 */
async function sendRegistrationEmailWithQR({ to, from, attendeeName, eventTitle, venue, eventDate, registrationId, qrCodeData }) {
  try {
    const senderEmail = from || SENDER_EMAIL;
    const formattedDate = new Date(eventDate).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    // Generate QR as PNG buffer
    const qrBuffer = await QRCode.toBuffer(qrCodeData, { width: 200, margin: 1, type: 'png' });
    const qrBase64 = qrBuffer.toString('base64');

    const subject = `Registration Confirmed: ${eventTitle}`;
    const textBody = `Hi ${attendeeName}, you're registered for ${eventTitle} on ${formattedDate} at ${venue}. Registration ID: ${registrationId}. Open the EventShield app to view your QR ticket.`;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="background: #1B5E4B; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 20px;">EventShield AI</h1>
  </div>
  <div style="background: white; padding: 32px; border: 1px solid #E0E0E0; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1A1A1A; margin-top: 0;">Registration Confirmed! &#10003;</h2>
    <p style="color: #5F6368;">Hi ${attendeeName},</p>
    <p style="color: #5F6368;">You're registered for the following event:</p>
    <div style="background: #F8F6F1; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Event:</strong> ${eventTitle}</p>
      <p style="margin: 4px 0;"><strong>Venue:</strong> ${venue}</p>
      <p style="margin: 4px 0;"><strong>Date:</strong> ${formattedDate}</p>
      <p style="margin: 4px 0;"><strong>Registration ID:</strong> ${registrationId}</p>
    </div>
    <div style="text-align: center; margin: 24px 0; padding: 20px; border: 2px dashed #1B5E4B; border-radius: 12px;">
      <p style="color: #1B5E4B; font-weight: 600; margin: 0 0 12px 0;">Your QR Check-In Ticket</p>
      <img src="cid:qrcode" alt="QR Code" width="200" height="200" style="display: block; margin: 0 auto;" />
      <p style="color: #9E9E9E; font-size: 12px; margin: 12px 0 0 0;">Show this QR code at the venue for instant check-in</p>
    </div>
    <p style="color: #5F6368;">Your QR ticket is also available in the app under "My Tickets".</p>
    <p style="color: #9E9E9E; font-size: 12px; margin-top: 24px;">This is an automated message from EventShield AI.</p>
  </div>
</div>`;

    // Build multipart/related MIME message with CID attachment
    const boundary1 = `----=_Mixed_${Date.now()}`;
    const boundary2 = `----=_Related_${Date.now()}`;
    const boundary3 = `----=_Alt_${Date.now()}`;

    const rawMessage = [
      `From: EventShield AI <${senderEmail}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary1}"`,
      ``,
      `--${boundary1}`,
      `Content-Type: multipart/related; boundary="${boundary2}"`,
      ``,
      `--${boundary2}`,
      `Content-Type: multipart/alternative; boundary="${boundary3}"`,
      ``,
      `--${boundary3}`,
      `Content-Type: text/plain; charset=UTF-8`,
      ``,
      textBody,
      ``,
      `--${boundary3}`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      html,
      ``,
      `--${boundary3}--`,
      ``,
      `--${boundary2}`,
      `Content-Type: image/png; name="qrcode.png"`,
      `Content-Transfer-Encoding: base64`,
      `Content-ID: <qrcode>`,
      `Content-Disposition: inline; filename="qrcode.png"`,
      ``,
      qrBase64,
      ``,
      `--${boundary2}--`,
      ``,
      `--${boundary1}--`,
    ].join('\r\n');

    await sesClient.send(
      new SendRawEmailCommand({
        RawMessage: { Data: Buffer.from(rawMessage) },
      })
    );

    console.log(`Email with QR sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.warn(`Failed to send QR email to ${to}:`, err.message);
    return false;
  }
}

module.exports = { sendRegistrationEmailWithQR };
