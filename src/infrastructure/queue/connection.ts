import amqp from "amqplib";
import { EventEmitter } from "events";
import { config } from "../../config/dotenv";
import logger from "../../utils/logger";

let connection: amqp.Connection | null = null;
let connectionPromise: Promise<amqp.Connection> | null = null;
let connected = false;
let reconnecting = false;
let reconnectAttempts = 0;
const queueEvents = new EventEmitter();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function emitConnected(conn: amqp.Connection) {
  queueEvents.emit('connected', conn);
}

async function reconnectLoop() {
  if (reconnecting) return;
  reconnecting = true;

  while (!connected && reconnectAttempts < config.rabbitmqReconnectAttempts) {
    reconnectAttempts++;
    const delay = Math.min(1000 * reconnectAttempts, 30000);
    logger.info("RabbitMQ", `Tentando reconectar em ${delay / 1000}s... (${reconnectAttempts}/${config.rabbitmqReconnectAttempts})`);
    await wait(delay);

    try {
      await connectQueue();
      reconnecting = false;
      return;
    } catch (error) {
      logger.error("RabbitMQ", `Falha na reconexão: ${error}`);
    }
  }

  reconnecting = false;
  if (!connected) {
    logger.error("RabbitMQ", "Limite de tentativas de reconexão atingido.");
  }
}

async function createConnection() {
  const conn = await amqp.connect(config.rabbitmqUrl);
  connection = conn;
  connected = true;
  reconnectAttempts = 0;

  // Gerenciar fechamento de conexão
  conn.on('close', (err) => {
    logger.error("RabbitMQ", `Conexão fechada: ${err?.message || 'Sem detalhes'}`);
    connected = false;
    connection = null;
    connectionPromise = null;
    void reconnectLoop();
  });

  conn.on('error', (error) => {
    logger.error("RabbitMQ", `Erro de conexão: ${error.message}`);
  });

  emitConnected(conn);
  return conn;
}

export async function connectQueue() {
  if (connection && connected) return connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = createConnection().catch((error) => {
    connectionPromise = null;
    connected = false;
    connection = null;
    throw error;
  });

  return connectionPromise;
}

export function onQueueConnected(listener: (conn: amqp.Connection) => void) {
  queueEvents.on('connected', listener);
}

export function isQueueConnected() {
  return connected;
}
