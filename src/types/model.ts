export interface MailOptions {
  to: string | string[];
  subject: string;
  title: string;
  message: string;
  link?: string;
  scheduleFor?: number;
  application?: string
}
