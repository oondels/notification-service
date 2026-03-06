export interface MailOptions {
  to: string | string[];
  subject: string;
  title: string;
  message: string;
  link?: string;
  // Delay em ms (retrocompatibilidade)
  scheduleFor?: number;
  // Timestamp futuro (ms) ou ISO string
  scheduleAt?: number | string;
  application?: string
}
