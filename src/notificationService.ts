import { connectQueue } from './infrastructure/queue/connection';
import { startWorker } from './workers/bootstrap';
import logger from './utils/logger';
import express, { Request, Response, NextFunction } from "express"
import cors from "cors"
import { notificationRoute } from "./routes/notification.route"

const app = express()
const port = 6752;

app.use(express.json())
app.use(cors())
app.use("/notification/", notificationRoute)

async function main() {
  try {
    await connectQueue();
    startWorker();

    app.listen(port, () => {
      logger.info("NotificationService", `Notification server running on port: ${port}`)
    })

    app.get("/", (req: Request, res: Response, next: NextFunction) => {
      res.status(200).json({ message: "Notification service is runnig!" })
      return
    })

    app.use((error: any, req: Request, res: Response, next: NextFunction) => {
      logger.error("NotificationService", `Erro no método ${req.method} em ${req.originalUrl} - ${error}`);
      res.status(500).json({ message: "Erro interno no servidor. Contate a equipe de automação!" });
    })
  } catch (error) {
    logger.error('NotificationService', `Failed to start notification service: ${error}`);
    console.error(error);
    
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('NotificationService', `Fatal error: ${error}`);
  process.exit(1);
});