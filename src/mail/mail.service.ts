import { Injectable, Logger } from '@nestjs/common';
import { gmail } from '@googleapis/gmail';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private readonly oauth2Client: OAuth2Client;
  private readonly gmail;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error(
        'Google OAuth2 environment variables are missing.',
      );
    }

    this.oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground',
    );

    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    this.gmail = gmail({
      version: 'v1',
      auth: this.oauth2Client,
    });

    this.logger.log(
      'Google Gmail API initialized successfully.',
    );
  }

  private createRawMessage(
    to: string,
    subject: string,
    html: string,
  ): string {
    const from =
      process.env.MAIL_FROM ||
      process.env.GOOGLE_EMAIL;

    const message = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      html,
    ].join('\r\n');

    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  async sendMail(
    to: string,
    subject: string,
    html: string,
  ) {
    try {
      const raw = this.createRawMessage(
        to,
        subject,
        html,
      );

      const response =
        await this.gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw,
          },
        });

      this.logger.log(
        `Email sent successfully to ${to}`,
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Google Gmail API email failed:',
        error?.response?.data ||
          error?.message ||
          error,
      );

      throw error;
    }
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

  // =====================================================
  // LEAGUE PARTICIPATION EMAIL
  // =====================================================

  async sendLeagueParticipationEmail(
    to: string,
    name: string,
    playerId: string,
    leagueName: string,
    amount: number,
  ) {
    const paymentDeadline = new Date();

    paymentDeadline.setDate(
      paymentDeadline.getDate() + 2,
    );

    const deadlineText =
      paymentDeadline.toLocaleDateString(
        undefined,
        {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        },
      );

    return this.sendMail(
      to,
      `Official League Registration - ${leagueName}`,
      `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 680px;
            margin: 0 auto;
            background: #f4f4f5;
            color: #18181b;
            padding: 0;
          "
        >

          <!-- HEADER -->

          <div
            style="
              background: #080808;
              padding: 30px 35px;
              border-bottom: 5px solid #facc15;
            "
          >
            <p
              style="
                margin: 0;
                color: #facc15;
                font-size: 24px;
                font-weight: 800;
                letter-spacing: 1px;
              "
            >
              THRILL SEEKERS
            </p>

            <p
              style="
                margin: 6px 0 0;
                color: #d4d4d8;
                font-size: 11px;
                letter-spacing: 3px;
                font-weight: 600;
              "
            >
              EFOOTBALL CLUB
            </p>
          </div>

          <!-- BODY -->

          <div
            style="
              padding: 35px;
              background: #ffffff;
            "
          >

            <p
              style="
                margin: 0;
                color: #71717a;
                font-size: 12px;
                font-weight: bold;
                letter-spacing: 2px;
                text-transform: uppercase;
              "
            >
              Official League Notification
            </p>

            <h1
              style="
                margin: 10px 0 20px;
                color: #18181b;
                font-size: 28px;
                line-height: 1.3;
              "
            >
              You have been added to
              <span style="color: #ca8a04;">
                ${leagueName}
              </span>
            </h1>

            <p
              style="
                font-size: 15px;
                line-height: 1.8;
                color: #3f3f46;
              "
            >
              Dear <strong>${name}</strong>,
            </p>

            <p
              style="
                font-size: 15px;
                line-height: 1.8;
                color: #3f3f46;
              "
            >
              We are pleased to inform you that you
              have been officially registered as a
              participating player in the
              <strong>${leagueName}</strong>
              under Thrill Seekers eFootball Club.
            </p>

            <!-- PLAYER INFORMATION -->

            <div
              style="
                margin: 25px 0;
                padding: 20px;
                background: #fafafa;
                border: 1px solid #e4e4e7;
                border-radius: 14px;
              "
            >
              <p
                style="
                  margin: 0 0 8px;
                  color: #71717a;
                  font-size: 11px;
                  font-weight: bold;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                "
              >
                Player Information
              </p>

              <p
                style="
                  margin: 8px 0;
                  font-size: 15px;
                "
              >
                <strong>Player Name:</strong>
                ${name}
              </p>

              <p
                style="
                  margin: 8px 0;
                  font-size: 15px;
                "
              >
                <strong>Player ID:</strong>
                ${playerId}
              </p>

              <p
                style="
                  margin: 8px 0;
                  font-size: 15px;
                "
              >
                <strong>League:</strong>
                ${leagueName}
              </p>
            </div>

            <!-- MATCH INFORMATION -->

            <div
              style="
                margin: 25px 0;
                padding: 22px;
                background: #eff6ff;
                border-left: 5px solid #2563eb;
                border-radius: 10px;
              "
            >
              <h3
                style="
                  margin: 0 0 12px;
                  color: #1d4ed8;
                  font-size: 16px;
                "
              >
                Match Fixture Information
              </h3>

              <p
                style="
                  margin: 0;
                  color: #334155;
                  font-size: 14px;
                  line-height: 1.7;
                "
              >
                Your upcoming match fixtures are
                available on the Thrill Seekers
                website.
              </p>

              <p
                style="
                  margin: 12px 0 0;
                "
              >
                <a
                  href="https://thrillseekers.vercel.app/matches"
                  style="
                    display: inline-block;
                    background: #2563eb;
                    color: #ffffff;
                    padding: 12px 18px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: bold;
                  "
                >
                  View My Match Fixtures
                </a>
              </p>
            </div>

            <!-- PAYMENT INFORMATION -->

            <div
              style="
                margin: 25px 0;
                padding: 22px;
                background: #fffbeb;
                border: 1px solid #fde68a;
                border-radius: 14px;
              "
            >
              <p
                style="
                  margin: 0;
                  color: #92400e;
                  font-size: 12px;
                  font-weight: bold;
                  letter-spacing: 1px;
                  text-transform: uppercase;
                "
              >
                League Participation Fee
              </p>

              <p
                style="
                  margin: 8px 0;
                  color: #18181b;
                  font-size: 30px;
                  font-weight: 800;
                "
              >
                BDT ${amount}
              </p>

              <p
                style="
                  margin: 0;
                  color: #57534e;
                  font-size: 14px;
                  line-height: 1.7;
                "
              >
                Please complete your league
                participation payment within two days
                from the date of this notification.
              </p>

              <p
                style="
                  margin: 10px 0 0;
                  color: #92400e;
                  font-size: 13px;
                  font-weight: bold;
                "
              >
                Payment deadline: ${deadlineText}
              </p>

              <!-- PAYMENT INSTRUCTIONS -->

              <div
                style="
                  margin-top: 18px;
                  padding: 18px;
                  background: #ffffff;
                  border: 1px solid #fde68a;
                  border-radius: 12px;
                "
              >
                <h3
                  style="
                    margin: 0 0 12px;
                    color: #92400e;
                    font-size: 15px;
                  "
                >
                  Payment Instructions
                </h3>

                <p
                  style="
                    margin: 7px 0;
                    color: #57534e;
                    font-size: 14px;
                    line-height: 1.7;
                  "
                >
                  1. Complete your payment using the
                  official payment method provided by
                  Thrill Seekers Management.
                </p>

                <p
                  style="
                    margin: 7px 0;
                    color: #57534e;
                    font-size: 14px;
                    line-height: 1.7;
                  "
                >
                  2. Keep your payment transaction or
                  reference ID after completing the payment.
                </p>

                <p
                  style="
                    margin: 7px 0;
                    color: #57534e;
                    font-size: 14px;
                    line-height: 1.7;
                  "
                >
                  3. Login to the Thrill Seekers website
                  and go to:
                  <strong>
                    Payment → Pending Payment
                  </strong>
                </p>

                <p
                  style="
                    margin: 7px 0;
                    color: #57534e;
                    font-size: 14px;
                    line-height: 1.7;
                  "
                >
                  4. Enter your payment information,
                  including your sender bKash number and
                  transaction ID.
                </p>

                <p
                  style="
                    margin: 7px 0;
                    color: #57534e;
                    font-size: 14px;
                    line-height: 1.7;
                  "
                >
                  5. Submit the payment information and
                  wait for confirmation from Thrill Seekers
                  Management.
                </p>

              </div>
            </div>

            <!-- IMPORTANT INFORMATION -->

            <div
              style="
                margin: 25px 0;
                padding: 20px;
                background: #fafafa;
                border: 1px solid #e4e4e7;
                border-radius: 14px;
              "
            >
              <h3
                style="
                  margin: 0 0 12px;
                  font-size: 16px;
                  color: #18181b;
                "
              >
                Important Information
              </h3>

              <p
                style="
                  margin: 7px 0;
                  color: #52525b;
                  font-size: 14px;
                  line-height: 1.7;
                "
              >
                • Please check your match fixtures
                regularly.
              </p>

              <p
                style="
                  margin: 7px 0;
                  color: #52525b;
                  font-size: 14px;
                  line-height: 1.7;
                "
              >
                • Complete your matches within the
                assigned deadlines.
              </p>

              <p
                style="
                  margin: 7px 0;
                  color: #52525b;
                  font-size: 14px;
                  line-height: 1.7;
                "
              >
                • Submit your match results through
                the website.
              </p>

              <p
                style="
                  margin: 7px 0;
                  color: #52525b;
                  font-size: 14px;
                  line-height: 1.7;
                "
              >
                • Submit your payment transaction
                details after making the payment.
              </p>

              <p
                style="
                  margin: 7px 0;
                  color: #52525b;
                  font-size: 14px;
                  line-height: 1.7;
                "
              >
                • Follow the official Thrill Seekers
                league rules and instructions.
              </p>
            </div>

            <!-- FORMAL CLOSING -->

            <p
              style="
                margin-top: 30px;
                font-size: 15px;
                line-height: 1.8;
                color: #3f3f46;
              "
            >
              We are pleased to have you as part of
              this league and look forward to your
              participation. We wish you the very best
              throughout the league.
            </p>

            <p
              style="
                margin-top: 30px;
                font-size: 14px;
                line-height: 1.7;
                color: #52525b;
              "
            >
              Best Regards,<br />
              <strong style="color: #18181b;">
                Thrill Seekers Management
              </strong><br />
              Thrill Seekers eFootball Club<br />
              https://thrillseekers.vercel.app
            </p>

          </div>

          <!-- FOOTER -->

          <div
            style="
              background: #080808;
              padding: 20px 35px;
              text-align: center;
            "
          >
            <p
              style="
                margin: 0;
                color: #71717a;
                font-size: 11px;
              "
            >
              This is an official automated
              notification from Thrill Seekers
              eFootball Club.
            </p>
          </div>

        </div>
      `,
    );
  }
}