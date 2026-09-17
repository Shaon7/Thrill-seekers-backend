import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter =
    nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(
        process.env.SMTP_PORT || 587,
      ),
      secure:
        process.env.SMTP_SECURE === 'true',

      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

  async sendMail(
    to: string,
    subject: string,
    html: string,
  ) {
    return this.transporter.sendMail({
      from:
        process.env.MAIL_FROM ||
        process.env.SMTP_USER,

      to,
      subject,
      html,
    });
  }

  async sendWelcomeEmail(
    to: string,
    name: string,
    playerId: string,
  ) {
    return this.sendMail(
      to,
      'Welcome to Thrill Seekers eFootball Club',
      `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            background: #080808;
            color: #ffffff;
            padding: 30px;
          "
        >
          <h2 style="color: #facc15;">
            Welcome to Thrill Seekers!
          </h2>

          <p>
            Hello ${name},
          </p>

          <p>
            Your account has been successfully
            created in the Thrill Seekers
            eFootball Club system.
          </p>

          <div
            style="
              margin: 24px 0;
              padding: 18px;
              border: 1px solid #333;
              border-radius: 12px;
              background: #111;
            "
          >
            <p style="margin: 0 0 8px; color: #999;">
              Your Player ID
            </p>

            <p
              style="
                margin: 0;
                font-size: 22px;
                font-weight: bold;
                color: #facc15;
              "
            >
              ${playerId}
            </p>
          </div>

          <p>
            You can use your Player ID or email
            address to log in to the system.
          </p>

          <p style="margin-top: 30px;">
            Regards,<br />
            <strong>
              Thrill Seekers eFootball Club
            </strong>
          </p>
        </div>
      `,
    );
  }

  async sendPasswordResetCode(
    to: string,
    name: string,
    code: string,
  ) {
    return this.sendMail(
      to,
      'Thrill Seekers Password Reset Code',
      `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            background: #080808;
            color: #ffffff;
            padding: 30px;
          "
        >
          <h2 style="color: #facc15;">
            Password Reset
          </h2>

          <p>
            Hello ${name},
          </p>

          <p>
            We received a request to reset
            your Thrill Seekers account password.
          </p>

          <p>
            Your verification code is:
          </p>

          <div
            style="
              margin: 25px 0;
              text-align: center;
              padding: 18px;
              border-radius: 12px;
              background: #111;
              border: 1px solid #333;
            "
          >
            <span
              style="
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 8px;
                color: #facc15;
              "
            >
              ${code}
            </span>
          </div>

          <p>
            This code will expire in 10 minutes.
          </p>

          <p>
            If you did not request a password
            reset, you can safely ignore this email.
          </p>

          <p style="margin-top: 30px;">
            Regards,<br />
            <strong>
              Thrill Seekers eFootball Club
            </strong>
          </p>
        </div>
      `,
    );
  }
}