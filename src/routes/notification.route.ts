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

    const payload = req.body

    const mailOptionsSchema = z.object({
      to: z.union([z.string(), z.array(z.string())]),
      subject: z.string(),
      title: z.string(),
      message: z.string(),
      link: z.string().optional(),
      scheduleFor: z.number().optional(),
      application: z.string().optional(),
    });

    const validation = mailOptionsSchema.safeParse(payload);

    if (!validation.success) {
      res.status(400).json({
        message: "Informações ausentes ou iválidas: ",
        error: validation.error.errors
      })
      return
    }

    await handleNotification(payload)
    res.status(200).json({ message: "Notificação enviada com sucesso!" })
    return
  } catch (error) {
    next(error)
  }
})

