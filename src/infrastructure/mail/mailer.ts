import nodemailer from "nodemailer";
import { config } from "../../config/dotenv"
import logger from "../../utils/logger";
import { MailOptions } from "../../types/model"

const transporter = nodemailer.createTransport({
  host: config.emailHost,
  port: 465,
  secure: true,
  auth: {
    user: config.emailUser,
    pass: config.emailPass,
  },
});

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatMessage = (value: string) => escapeHtml(value).replace(/\n/g, "<br />");

const sendEmail = async ({ to, subject, title, message, link, application }: MailOptions) => {
  const safeTitle = escapeHtml(title);
  const safeMessage = formatMessage(message);
  const safeLink = link ? escapeHtml(link) : "";
  const safeReference = application ? escapeHtml(application) : "";

  const mailOptions = {
    to,
    subject,
    html: `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #1f2937; line-height: 1.6; max-width: 680px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px;">
      <div style="margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 20px; color: #111827;">Notificação</h1>
      </div>

      <div style="padding: 18px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em;">Título</p>
        <h2 style="margin: 0 0 18px; font-size: 22px; color: #111827;">${safeTitle}</h2>

        <p style="margin: 0 0 6px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em;">Mensagem</p>
        <p style="margin: 0; font-size: 16px; color: #374151;">${safeMessage}</p>

        ${safeReference ? `<p style="margin: 16px 0 0; font-size: 12px; color: #6b7280;"><strong>Referência:</strong> ${safeReference}</p>` : ""}
      </div>

      ${safeLink ? `
        <div style="margin-top: 16px;">
          <a href="${safeLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 6px; font-size: 14px;">
            Abrir link relacionado
          </a>
        </div>
      ` : ""}

      <div style="margin-top: 22px; font-size: 12px; color: #6b7280;">
        <p style="margin: 0;">Mensagem automática. Não responda este e-mail.</p>
      </div>
    </div>
      `,
  };

  try {
    const mail = await transporter.sendMail(mailOptions);
    logger.info("Email", `Email enviado com sucesso para: ${to}`);
    return mail;
  } catch (error: any) {
    logger.error("Email", `Erro ao enviar email: ${error.message}`);
    throw new Error(`Erro ao enviar e-mail: ${error.message}\nDetalhes: ${error.stack}`);
  }
};

export default sendEmail;
