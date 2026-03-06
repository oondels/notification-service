# Notification Service

Microserviço de notificações por e-mail com processamento assíncrono via RabbitMQ.

## Visão geral

Este serviço centraliza o envio de e-mails para outros sistemas. Em vez de enviar e-mail diretamente na requisição HTTP, ele:

1. Recebe a solicitação via API.
2. Valida autenticação e payload.
3. Enfileira a mensagem no RabbitMQ.
4. Worker interno consome a fila.
5. Envia o e-mail via SMTP (Nodemailer).

Esse modelo desacopla os sistemas clientes e melhora resiliência em picos de carga.

## Regra de negócio

### Regras principais

1. Toda notificação recebida na API é enfileirada e retorna `202 Accepted`.
2. O envio de e-mail acontece no worker, nunca diretamente na rota HTTP.
3. Se o processamento falhar, a mensagem entra em retry automático com backoff exponencial.
4. Após exceder o limite de tentativas, a mensagem é encaminhada para DLQ.
5. Agendamento pode ser feito por delay (`scheduleFor`) ou data/hora (`scheduleAt`).

### Priorização de agendamento

1. Se `scheduleAt` for informado, ele tem prioridade.
2. Se `scheduleAt` não for informado, usa `scheduleFor` (delay em ms).
3. Se nenhum for informado, o envio é imediato (sem delay).

### Topologia de filas

Considerando `QUEUE_NAME=notifications`:

- `notifications`: fila principal consumida pelo worker.
- `notifications.retry`: fila de retry (TTL por mensagem + dead-letter para principal).
- `notifications.delayed`: fila de agendamento (TTL por mensagem + dead-letter para principal).
- `notifications.dlq`: dead-letter queue final.

## Arquitetura

- API: [src/routes/notification.route.ts](src/routes/notification.route.ts)
- Serviço de negócio: [src/services/notification.ts](src/services/notification.ts)
- Worker: [src/workers/bootstrap.ts](src/workers/bootstrap.ts)
- Conexão RabbitMQ: [src/infrastructure/queue/connection.ts](src/infrastructure/queue/connection.ts)
- Publicação/consumo e retry: [src/infrastructure/queue/queue.ts](src/infrastructure/queue/queue.ts)
- Envio SMTP: [src/infrastructure/mail/mailer.ts](src/infrastructure/mail/mailer.ts)
- Configuração de ambiente: [src/config/dotenv.ts](src/config/dotenv.ts)
- Bootstrap da aplicação: [src/notificationService.ts](src/notificationService.ts)

## Stack

- Node.js 20+
- TypeScript
- Express 5
- RabbitMQ (`amqplib`)
- Nodemailer
- Zod
- Winston
- Docker

## Endpoints

Base URL padrão: `http://localhost:6752`

### `GET /`

Health simples da API.

Resposta `200`:

```json
{
  "message": "Notification service is running!"
}
```

### `GET /health`

Health de dependências (atualmente RabbitMQ).

Resposta `200` quando RabbitMQ conectado:

```json
{
  "status": "ok",
  "dependencies": {
    "rabbitmq": "up"
  }
}
```

Resposta `503` quando RabbitMQ indisponível:

```json
{
  "status": "degraded",
  "dependencies": {
    "rabbitmq": "down"
  }
}
```

### `POST /notification`

Cria uma notificação (enfileira para processamento assíncrono).

Headers obrigatórios:

```http
Content-Type: application/json
x-api-key: SUA_CHAVE
```

Resposta de sucesso: `202`.

```json
{
  "message": "Notificação recebida e enfileirada com sucesso!"
}
```

## Contrato da requisição

Campos aceitos:

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| `to` | `string` ou `string[]` | Sim | Deve ser e-mail válido |
| `subject` | `string` | Sim | Não vazio |
| `title` | `string` | Sim | Não vazio |
| `message` | `string` | Sim | Não vazio |
| `link` | `string` | Não | URL válida |
| `application` | `string` | Não | Não vazio |
| `scheduleFor` | `number` | Não | Inteiro positivo (delay em ms) |
| `scheduleAt` | `number` ou `string` | Não | Timestamp ms ou ISO datetime com timezone |

Observações:

- Payload é validado com Zod em modo `strict`.
- Campos extras não previstos são rejeitados (`400`).

### Exemplo: envio imediato

```bash
curl -X POST http://localhost:6752/notification \
  -H "Content-Type: application/json" \
  -H "x-api-key: SUA_CHAVE" \
  -d '{
    "to": "usuario@empresa.com",
    "subject": "Pedido aprovado",
    "title": "Pedido #1234",
    "message": "Seu pedido foi aprovado.",
    "application": "ERP"
  }'
```

### Exemplo: agendamento por delay (`scheduleFor`)

```bash
curl -X POST http://localhost:6752/notification \
  -H "Content-Type: application/json" \
  -H "x-api-key: SUA_CHAVE" \
  -d '{
    "to": "usuario@empresa.com",
    "subject": "Lembrete",
    "title": "Reunião",
    "message": "Sua reunião começa em 10 minutos.",
    "scheduleFor": 600000
  }'
```

### Exemplo: agendamento por data/hora (`scheduleAt`)

```bash
curl -X POST http://localhost:6752/notification \
  -H "Content-Type: application/json" \
  -H "x-api-key: SUA_CHAVE" \
  -d '{
    "to": "usuario@empresa.com",
    "subject": "Fechamento",
    "title": "Processo diário",
    "message": "Início do fechamento diário.",
    "scheduleAt": "2026-03-06T18:30:00-03:00"
  }'
```

## Comunicação entre containers via RabbitMQ

Sim, o serviço funciona para comunicação entre containers.

Requisitos:

1. Todos os containers devem estar na mesma rede Docker.
2. `RABBITMQ_URL` deve apontar para o hostname do container RabbitMQ.
3. Os produtores devem publicar no `QUEUE_NAME` configurado neste serviço.

Exemplo de URL na rede Docker:

```env
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
```

### Exemplo de publicação direta na fila (Node.js)

```ts
import amqp from 'amqplib';

const payload = {
  to: 'usuario@empresa.com',
  subject: 'Mensagem via RabbitMQ',
  title: 'Processo assíncrono',
  message: 'Publicada diretamente na fila principal',
  application: 'service-a'
};

const conn = await amqp.connect('amqp://guest:guest@rabbitmq:5672');
const channel = await conn.createChannel();
await channel.assertQueue('notifications', { durable: true });
channel.sendToQueue('notifications', Buffer.from(JSON.stringify(payload)), {
  persistent: true,
});
await channel.close();
await conn.close();
```

Use o mesmo valor definido em `QUEUE_NAME` (não fixe `notifications` se seu ambiente usar outro nome).

## Retry e DLQ

Configuração via ambiente:

- `QUEUE_MAX_RETRY_ATTEMPTS` (default `3`)
- `QUEUE_RETRY_BASE_DELAY_MS` (default `5000`)

Comportamento:

1. Falha na tentativa 1 -> vai para `*.retry` com delay base.
2. Falha na tentativa 2 -> delay dobra.
3. Falha na tentativa 3 -> delay dobra novamente.
4. Excedeu o limite -> mensagem é nacked sem requeue e vai para `*.dlq`.

## Variáveis de ambiente

O serviço carrega:

- `.env` quando `DEV_ENV=development`
- `.env.prod` para outros ambientes (incluindo `production`)

Variáveis suportadas:

| Variável | Obrigatória | Default | Descrição |
|---|---|---|---|
| `EMAIL_HOST` | Sim | - | Host SMTP |
| `EMAIL_USER` | Sim | - | Usuário SMTP (e-mail válido) |
| `EMAIL_PASS` | Sim | - | Senha/app password SMTP |
| `RABBITMQ_URL` | Sim | - | URL AMQP do RabbitMQ |
| `NOTIFICATION_API_KEY` | Sim | - | Chave da API |
| `PORT` | Não | `6752` | Porta HTTP da API |
| `QUEUE_NAME` | Não | `notifications` | Nome da fila principal |
| `RABBITMQ_RECONNECT_ATTEMPTS` | Não | `10` | Tentativas de reconexão AMQP |
| `QUEUE_MAX_RETRY_ATTEMPTS` | Não | `3` | Máximo de retries por mensagem |
| `QUEUE_RETRY_BASE_DELAY_MS` | Não | `5000` | Delay base (ms) para backoff |

Exemplo de `.env` (desenvolvimento):

```env
DEV_ENV=development

EMAIL_HOST=smtp.gmail.com
EMAIL_USER=seu-email@empresa.com
EMAIL_PASS=sua-senha-ou-app-password

RABBITMQ_URL=amqp://guest:guest@localhost:5672
NOTIFICATION_API_KEY=troque-esta-chave

PORT=6752
QUEUE_NAME=notifications
RABBITMQ_RECONNECT_ATTEMPTS=10
QUEUE_MAX_RETRY_ATTEMPTS=3
QUEUE_RETRY_BASE_DELAY_MS=5000
```

Exemplo de `.env.prod`:

```env
DEV_ENV=production

EMAIL_HOST=smtp.seu-provedor.com
EMAIL_USER=notifier@empresa.com
EMAIL_PASS=senha-forte

RABBITMQ_URL=amqp://user:pass@rabbitmq:5672
NOTIFICATION_API_KEY=chave-producao

PORT=6752
QUEUE_NAME=notifications
RABBITMQ_RECONNECT_ATTEMPTS=10
QUEUE_MAX_RETRY_ATTEMPTS=5
QUEUE_RETRY_BASE_DELAY_MS=10000
```

## Como executar

### Local

```bash
npm install
npm run dev
```

Scripts disponíveis:

- `npm run dev`: desenvolvimento com `nodemon`.
- `npm run start`: inicializa via `ts-node` com `DEV_ENV=development`.
- `npm run build`: compila TypeScript para `dist`.

Observação:

- Para produção, prefira a execução via Docker (imagem final roda `node dist/notificationService.js`).

### Docker

Build:

```bash
docker build -t notification-service:latest .
```

Run:

```bash
docker run -d \
  --name notification-service \
  -p 6752:6752 \
  --env-file .env.prod \
  notification-service:latest
```

### Docker Compose

Arquivo atual: [docker-compose.yml](docker-compose.yml)

Pontos importantes:

- Usa `env_file: .env.prod`.
- Seta `DEV_ENV=production`.
- Mapeia porta com `${PORT:-6752}` no `docker-compose.yml`.
- Usa rede externa `dass_private`.

Observação sobre `PORT` no Compose:

- A interpolação `${PORT:-6752}` é resolvida pelo Docker Compose (variável de shell ou arquivo `.env` do Compose).
- Se for usar porta diferente de `6752`, defina `PORT` no ambiente do Compose e mantenha o mesmo valor dentro do container.

Crie a rede antes de subir, se não existir:

```bash
docker network create dass_private
```

Subir serviço:

```bash
docker compose up -d --build
```

## Logs e observabilidade

Logs são gravados em:

- `logs/combined.log`
- `logs/error.log`

Formato:

```text
[YYYY-MM-DD HH:mm:ss] [ServiceName] level: mensagem
```

Sugestão de monitoramento:

- Taxa de mensagens em `*.retry`.
- Volume em `*.dlq`.
- Disponibilidade de `GET /health`.

## Erros comuns

### `401 Chave de API inválida`

- Header `x-api-key` ausente/incorreto.
- Valor diferente de `NOTIFICATION_API_KEY`.

### `400 Informações ausentes ou inválidas`

- Payload fora do schema.
- E-mail inválido em `to`.
- Campo extra não permitido.

### Serviço não sobe

- Variável de ambiente obrigatória ausente.
- RabbitMQ indisponível no `RABBITMQ_URL`.

### Mensagens acumulando em DLQ

- Falha recorrente de SMTP.
- Payload inconsistente vindo de produtor direto em RabbitMQ.

## Segurança

- Use API key forte e rotacione periodicamente.
- Não versione credenciais em repositório.
- Exponha a API atrás de proxy HTTPS em produção.
- Considere rate limit para clientes HTTP.

## Licença

MIT.
