import nodemailer from 'nodemailer';
let transporter: nodemailer.Transporter | null = null;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter as nodemailer.Transporter;
};
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[Email Mock - Missing SMTP Config] To:', options.to, 'Subject:', options.subject);
    return true;
  }
  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || '"Classroom App" <noreply@classroom.app>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}
export async function sendAccessCodeEmail(email: string, code: string): Promise<boolean> {
  console.log('================================================');
  console.log(`[Email] Sending Access Code to: ${email}`);
  console.log(`[Email] Code: ${code}`);
  console.log('================================================');
  return sendEmail({
    to: email,
    subject: 'Your Classroom Access Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Classroom Access Code</h2>
        <p>Your access code is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5;">
            ${code}
          </span>
        </div>
        <p style="color: #666;">This code expires in 10 minutes.</p>
      </div>
    `,
  });
}
export async function sendStudentInvitation(
  email: string,
  name: string,
  setupLink: string
): Promise<boolean> {
  console.log('================================================');
  console.log(`[Email] Sending Invitation to: ${email}`);
  console.log(`[Email] Link: ${setupLink}`);
  console.log('================================================');
  return sendEmail({
    to: email,
    subject: 'Welcome to Classroom',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Classroom, ${name}!</h2>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${setupLink}" 
             style="background: #666; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 8px; font-weight: bold;">
            Set Up My Account
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:
          <br><a href="${setupLink}">${setupLink}</a>
        </p>
      </div>
    `,
  });
}
