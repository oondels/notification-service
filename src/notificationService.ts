import { connectQueue, isQueueConnected } from './infrastructure/queue/connection';
import { startWorker } from './workers/bootstrap';
import logger from './utils/logger';
import express, { Request, Response, NextFunction } from "express"
import cors from "cors"
import { notificationRoute } from "./routes/notification.route"
import { config } from "./config/dotenv";

const app = express()

app.use(express.json())
app.use(cors())
app.use("/notification", notificationRoute)

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Notification service is running!" })
})

app.get("/health", (req: Request, res: Response) => {
  const rabbitmq = isQueueConnected() ? "up" : "down";
  const statusCode = rabbitmq === "up" ? 200 : 503;

  res.status(statusCode).json({
    status: rabbitmq === "up" ? "ok" : "degraded",
    dependencies: {
      rabbitmq,
    },
  });
});

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("NotificationService", `Erro no método ${req.method} em ${req.originalUrl} - ${error.message}`);
  res.status(500).json({ message: "Erro interno no servidor. Contate a equipe de automação!" });
})

async function main() {
  try {
    await connectQueue();
    await startWorker();

    app.listen(config.port, () => {
      logger.info("NotificationService", `Notification server running on port: ${config.port}`)
    })
  } catch (error) {
    logger.error('NotificationService', `Failed to start notification service: ${error}`);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('NotificationService', `Fatal error: ${error}`);
  process.exit(1);
});
