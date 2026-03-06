import { Request, Response, NextFunction, Router } from "express"
import { handleNotification } from "../services/notification"
import { z } from 'zod';
import { config } from "../config/dotenv"

export const notificationRoute = Router()

notificationRoute.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey || apiKey !== config.apiKey) {
      res.status(401).json({ message: "Chave de API inválida!" })
      return
    }

    const mailOptionsSchema = z.object({
      to: z.union([z.string().email(), z.array(z.string().email()).nonempty()]),
      subject: z.string().trim().min(1),
      title: z.string().trim().min(1),
      message: z.string().trim().min(1),
      link: z.string().url().optional(),
      scheduleFor: z.number().int().positive().optional(),
      scheduleAt: z.union([z.number().int().positive(), z.string().datetime({ offset: true })]).optional(),
      application: z.string().trim().min(1).optional(),
    }).strict();

    const validation = mailOptionsSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        message: "Informações ausentes ou inválidas.",
        error: validation.error.errors
      })
      return
    }

    await handleNotification(validation.data)
    res.status(202).json({ message: "Notificação recebida e enfileirada com sucesso!" })
    return
  } catch (error) {
    next(error)
  }
})
