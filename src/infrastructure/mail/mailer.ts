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


const sendEmail = async ({ to, subject, title, message, link, application }: MailOptions) => {
  const mailOptions = {
    to,
    subject,
    html: `
     <div style="color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 15px; border-radius: 12px; border: 1px solid rgb(224, 224, 224);">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #B22222; font-size: 28px; margin: 0; font-weight: bold; letter-spacing: 1px;">
          Dass Automação
        </h1>
        <p style="color: #555; font-size: 14px; margin-top: 8px;">
          Sistema de Notificações ${application ?? 'SEST'}
        </p>
      </div>

      <div style="background-color: #fff5f5; padding: 25px; border-radius: 10px; border: 1px solid #f0c7c7;">
        <h2 style="color: #B22222; font-size: 22px; margin: 0 0 15px; text-align: center; border-bottom: 1px solid #f4cccc; padding-bottom: 10px;">
          ${title}
        </h2>

        <p style="font-size: 16px; color: #444; text-align: center; margin-bottom: 20px;">
          ${message}
        </p>

        ${link ? `
          <div style="text-align: center; margin-top: 20px;">
            <a href="${link}" target="_blank" style="background-color: #B22222; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 16px; display: inline-block;">
              Ver detalhes
            </a>
          </div>
        ` : ''}
      </div>

      <div style="text-align: center; margin-top: 40px; color: #999; font-size: 13px;">
        <p>Esta é uma mensagem automática do sistema <strong>Dass Automação Santo Estêvão</strong>.</p>
        <p>Em caso de dúvidas, entre em contato pelo e-mail: <a href="mailto:hendrius.santana@grupodass.com.br" style="color: #B22222; text-decoration: none;">Dass Suporte</a></p>
        <p style="margin-top: 10px;">Por favor, não responda a este e-mail diretamente.</p>
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
