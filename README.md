# Notification Service

Serviço centralizado de notificações para arquitetura de microsserviços. Responsável por processar e enviar notificações por email através de filas RabbitMQ, construído seguindo a metodologia PDCA para resolver problemas de escalabilidade de notificações em múltiplas aplicações.

## Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso da API](#uso-da-api)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Docker](#docker)
- [Logs](#logs)
- [Desenvolvimento](#desenvolvimento)
- [Monitoramento](#monitoramento)

## Visão Geral

### Problema Identificado (PLAN)

Múltiplas aplicações enfrentavam desafios relacionados a notificações:
- Configurações de email espalhadas por diferentes serviços
- Templates de notificação inconsistentes e sem padronização
- Dificuldade em rastrear e gerenciar entregas de notificações
- Ausência de uma forma centralizada para enfileiramento e agendamento
- Problemas de escalabilidade quando o volume de notificações aumentava

### Solução Implementada (DO)

Desenvolvimento de um microsserviço centralizado que:
- **Unifica** todas as notificações por email em um único serviço
- **Padroniza** templates de notificação e métodos de entrega
- **Centraliza** configurações e gerenciamento de chaves de API
- **Escala** automaticamente com processamento assíncrono via RabbitMQ
- **Simplifica** integração através de uma API REST limpa e documentada

### Monitoramento (CHECK)

- Sistema de logs estruturado com Winston para rastreamento de status de entrega
- Endpoints de health check para monitoramento do serviço
- Tratamento e reporte de erros para notificações falhas
- Monitoramento de filas através da interface de gerenciamento do RabbitMQ

### Melhoria Contínua (ACT)

- Aprimoramento contínuo baseado em métricas do serviço
- Melhorias nos templates baseadas em feedback dos usuários
- Otimização de performance baseada em estatísticas de processamento de filas
- Aprimoramentos na API para melhor experiência do desenvolvedor

## Funcionalidades

- **Envio de Emails**: Entrega de emails via SMTP configurável
- **Autenticação**: Proteção por API Key para segurança
- **Agendamento**: Suporte a notificações agendadas com delay configurável
- **Processamento Assíncrono**: Utilização de RabbitMQ para processamento em fila
- **Logs Estruturados**: Sistema de logging completo com Winston
- **Templates Responsivos**: Templates HTML responsivos para emails
- **TypeScript**: Código totalmente tipado para maior confiabilidade
- **Validação de Dados**: Validação de schemas com Zod
- **Containerização**: Suporte completo a Docker e Docker Compose

## Arquitetura

O serviço segue uma arquitetura baseada em filas (queue-based) para processamento assíncrono:

1. **API REST**: Recebe requisições de notificação via endpoint POST
2. **Validação**: Valida dados de entrada usando schemas Zod
3. **Enfileiramento**: Publica mensagens na fila RabbitMQ
4. **Worker**: Consome mensagens da fila em background
5. **Processamento**: Envia emails via Nodemailer
6. **Logging**: Registra todas as operações e erros

### Fluxo de Processamento

```
Cliente → API (POST) → Validação → Fila RabbitMQ → Worker → Envio Email → Log
                           ↓
                      Agendamento (opcional)
```

## Tecnologias

### Core

- **Node.js 20+**: Runtime JavaScript
- **TypeScript 5.x**: Superset tipado do JavaScript
- **Express 5.x**: Framework web minimalista

### Comunicação e Mensageria

- **RabbitMQ**: Sistema de mensageria para filas assíncronas
- **amqplib**: Cliente RabbitMQ para Node.js
- **CORS**: Habilitação de Cross-Origin Resource Sharing

### Email e Notificações

- **Nodemailer**: Biblioteca para envio de emails via SMTP

### Validação e Configuração

- **Zod**: Validação de schemas e dados
- **dotenv**: Gerenciamento de variáveis de ambiente

### Logging

- **Winston**: Sistema de logging estruturado e configurável

### DevOps

- **Docker**: Containerização da aplicação
- **Docker Compose**: Orquestração de containers

### Ferramentas de Desenvolvimento

- **ts-node**: Execução de TypeScript diretamente
- **nodemon**: Hot-reload durante desenvolvimento
- **cross-env**: Configuração multiplataforma de variáveis de ambiente

## Instalação

### Pré-requisitos

Certifique-se de ter instalado:

- Node.js 20 ou superior
- npm ou yarn
- RabbitMQ (local ou via Docker)
- Servidor SMTP configurado (ex: Gmail, SendGrid, etc)
- Docker e Docker Compose (para ambiente containerizado)

### Instalação Local

```bash
# Clone o repositório
git clone https://github.com/oondels/notification-service.git
cd notification-service

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Execute em modo de desenvolvimento
npm run dev
```

### Instalação com Docker

```bash
# Clone o repositório
git clone https://github.com/oondels/notification-service.git
cd notification-service

# Configure as variáveis de ambiente
cp .env.example .env

# Inicie os serviços
docker-compose up -d
```

### Variáveis de Ambiente

O serviço utiliza dois arquivos de configuração dependendo do ambiente:
- `.env` - Para ambiente de desenvolvimento (DEV_ENV=development)
- `.env.prod` - Para ambiente de produção (DEV_ENV=production)

Crie o arquivo apropriado com as seguintes variáveis:

```env
# Configuração de Email SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app

# Configuração do RabbitMQ
RABBITMQ_URL=amqp://usuario:senha@localhost:5672

# Segurança
NOTIFICATION_API_KEY=sua-chave-api-segura

# Ambiente (development ou production)
DEV_ENV=development
```

#### Descrição das Variáveis

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `EMAIL_HOST` | Servidor SMTP para envio de emails | smtp.gmail.com |
| `EMAIL_USER` | Email do remetente (deve ser válido) | notificacoes@empresa.com |
| `EMAIL_PASS` | Senha ou senha de app do email | abcd1234efgh5678 |
| `RABBITMQ_URL` | URL de conexão do RabbitMQ | amqp://user:pass@host:5672 |
| `NOTIFICATION_API_KEY` | Chave de autenticação da API | chave-secreta-aqui |
| `DEV_ENV` | Ambiente de execução | development ou production |

### Configuração de SMTP

O serviço suporta qualquer provedor SMTP. Para usar o Gmail:

1. Acesse as configurações da sua conta Google
2. Habilite a autenticação de dois fatores
3. Gere uma "Senha de App" específica
4. Use essa senha no campo `EMAIL_PASS`

Para outros provedores (SendGrid, Amazon SES, etc), ajuste as configurações conforme a documentação do provedor.

### Validação de Configuração

O serviço valida todas as variáveis de ambiente na inicialização usando Zod. Se alguma variável estiver faltando ou inválida, o serviço não iniciará e exibirá uma mensagem de erro detalhada.

## Uso da API

### URL Base

```
http://localhost:6752
```

### Autenticação

Todas as rotas protegidas requerem o header de autenticação:

```
x-api-key: SUA_CHAVE_API
```

A chave deve corresponder ao valor configurado em `NOTIFICATION_API_KEY` no arquivo de ambiente.

### Endpoints

#### 1. Health Check

Verifica se o serviço está funcionando.

**Requisição:**
```http
GET /
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Notification service is runnig!"
}
```

#### 2. Enviar Notificação

Envia uma notificação por email ou agenda para envio futuro.

**Requisição:**
```http
POST /notification/
```

**Headers Obrigatórios:**
```
Content-Type: application/json
x-api-key: SUA_CHAVE_API
```

**Corpo da Requisição:**
```json
{
  "to": "destinatario@exemplo.com",
  "subject": "Assunto do Email",
  "title": "Título da Notificação",
  "message": "Conteúdo da mensagem que será exibida no corpo do email",
  "link": "https://exemplo.com/detalhes",
  "scheduleFor": 60000,
  "application": "Nome do Sistema"
}
```

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `to` | string | Sim | Email do destinatário |
| `subject` | string | Sim | Assunto do email |
| `title` | string | Sim | Título exibido no corpo do email |
| `message` | string | Sim | Mensagem principal do email |
| `link` | string | Não | Link para botão "Ver detalhes" no email |
| `scheduleFor` | number | Não | Delay em milissegundos para agendar o envio |
| `application` | string | Não | Nome da aplicação que está enviando |

**Resposta de Sucesso (200):**
```json
{
  "message": "Notificação enviada com sucesso!"
}
```

**Resposta de Erro - Autenticação (401):**
```json
{
  "message": "Chave de API inválida!"
}
```

**Resposta de Erro - Validação (400):**
```json
{
  "message": "Informações ausentes ou iválidas: ",
  "error": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["to"],
      "message": "Required"
    }
  ]
}
```

**Resposta de Erro - Servidor (500):**
```json
{
  "message": "Erro interno no servidor. Contate o suporte técnico!"
}
```

### Exemplos de Uso

#### Exemplo 1: Notificação Simples

```bash
curl -X POST http://localhost:6752/notification/ \
  -H "Content-Type: application/json" \
  -H "x-api-key: sua-chave-api" \
  -d '{
    "to": "usuario@exemplo.com",
    "subject": "Bem-vindo ao Sistema",
    "title": "Cadastro Realizado",
    "message": "Seu cadastro foi realizado com sucesso!"
  }'
```

#### Exemplo 2: Notificação com Link

```bash
curl -X POST http://localhost:6752/notification/ \
  -H "Content-Type: application/json" \
  -H "x-api-key: sua-chave-api" \
  -d '{
    "to": "usuario@exemplo.com",
    "subject": "Novo Pedido Aprovado",
    "title": "Pedido #12345",
    "message": "Seu pedido foi aprovado e está sendo processado.",
    "link": "https://sistema.com/pedidos/12345"
  }'
```

#### Exemplo 3: Notificação Agendada

```bash
curl -X POST http://localhost:6752/notification/ \
  -H "Content-Type: application/json" \
  -H "x-api-key: sua-chave-api" \
  -d '{
    "to": "usuario@exemplo.com",
    "subject": "Lembrete de Reunião",
    "title": "Reunião em 1 hora",
    "message": "Não esqueça da reunião agendada para hoje às 14:00.",
    "scheduleFor": 3600000,
    "application": "Sistema de Agendamentos"
  }'
```

**Nota:** `scheduleFor` está em milissegundos (3600000 = 1 hora)

#### Exemplo 4: Usando JavaScript/TypeScript

```typescript
const axios = require('axios');

async function sendNotification() {
  try {
    const response = await axios.post('http://localhost:6752/notification/', {
      to: 'usuario@exemplo.com',
      subject: 'Teste de Notificação',
      title: 'Sistema de Notificações',
      message: 'Esta é uma notificação de teste enviada via API.',
      link: 'https://exemplo.com',
      application: 'Meu Sistema'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'sua-chave-api'
      }
    });
    
    console.log('Notificação enviada:', response.data);
  } catch (error) {
    console.error('Erro ao enviar notificação:', error.response?.data);
  }
}

sendNotification();
```

#### Exemplo 5: Usando Python

```python
import requests
import json

def send_notification():
    url = "http://localhost:6752/notification/"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": "sua-chave-api"
    }
    data = {
        "to": "usuario@exemplo.com",
        "subject": "Notificação Python",
        "title": "Teste de Integração",
        "message": "Notificação enviada através de script Python",
        "application": "Sistema Python"
    }
    
    response = requests.post(url, headers=headers, data=json.dumps(data))
    print(f"Status: {response.status_code}")
    print(f"Resposta: {response.json()}")

send_notification()
```

## Estrutura do Projeto

```
notification-service/
├── src/
│   ├── config/
│   │   └── dotenv.ts              # Configuração de variáveis de ambiente
│   │                               # Validação com Zod, carrega .env ou .env.prod
│   │
│   ├── infrastructure/
│   │   ├── mail/
│   │   │   └── mailer.ts          # Configuração do Nodemailer
│   │   │                           # Template HTML dos emails
│   │   │                           # Função de envio via SMTP
│   │   └── queue/
│   │       ├── connection.ts      # Conexão com RabbitMQ
│   │       └── queue.ts           # Funções publish/consume da fila
│   │
│   ├── routes/
│   │   └── notification.route.ts  # Rotas da API REST
│   │                               # Validação de API Key
│   │                               # Validação de payload com Zod
│   │
│   ├── services/
│   │   └── notification.ts        # Lógica de negócio
│   │                               # Processamento de notificações
│   │                               # Agendamento e enfileiramento
│   │
│   ├── types/
│   │   └── model.ts               # Definições de tipos TypeScript
│   │                               # Interface MailOptions
│   │
│   ├── utils/
│   │   └── logger.ts              # Sistema de logging com Winston
│   │                               # Logs estruturados com timestamp
│   │
│   ├── workers/
│   │   └── bootstrap.ts           # Worker de processamento
│   │                               # Consome fila RabbitMQ
│   │                               # Processa envio de emails
│   │
│   └── notificationService.ts     # Ponto de entrada principal
│                                   # Inicialização do Express
│                                   # Setup de rotas e middlewares
│
├── logs/                          # Diretório de logs gerados
├── .env                          # Variáveis de ambiente (desenvolvimento)
├── .env.prod                     # Variáveis de ambiente (produção)
├── .env.example                  # Template de variáveis de ambiente
├── Dockerfile                    # Configuração do container Docker
├── docker-compose.yml            # Orquestração de serviços
├── package.json                  # Dependências e scripts npm
├── tsconfig.json                 # Configuração TypeScript
└── README.md                     # Este arquivo
```

### Descrição dos Componentes

#### Config
- **dotenv.ts**: Carrega e valida variáveis de ambiente usando Zod. Decide entre `.env` (dev) ou `.env.prod` (prod) baseado em `DEV_ENV`.

#### Infrastructure
- **mailer.ts**: Configura transporter do Nodemailer, define template HTML responsivo e implementa função de envio de email.
- **connection.ts**: Gerencia conexão persistente com RabbitMQ.
- **queue.ts**: Implementa funções `publish()` e `consume()` para gerenciamento de filas.

#### Routes
- **notification.route.ts**: Define endpoint POST `/notification/`, implementa autenticação via API Key e valida payload usando schemas Zod.

#### Services
- **notification.ts**: Contém lógica de negócio principal. Decide entre enfileirar (para requisições API) ou enviar diretamente (para worker).

#### Workers
- **bootstrap.ts**: Inicia worker que consome mensagens da fila RabbitMQ em background e processa envio de emails.

#### Utils
- **logger.ts**: Configura Winston para logging estruturado com níveis (info, error, warn) e formatação customizada.

## Docker

### Construir Imagem

```bash
# Construir a imagem Docker
docker build -t notification-service:latest .
```

### Executar Container

```bash
# Executar container standalone
docker run -d \
  --name notification-service \
  -p 6752:6752 \
  --env-file .env \
  notification-service:latest
```

### Docker Compose

O arquivo [docker-compose.yml](docker-compose.yml) está configurado para executar o serviço em uma rede Docker externa chamada `dass_private`.

```yaml
services:
  notification-service:
    build: .
    container_name: notification-service
    ports:
      - "6752:6752"
    env_file:
      - .env
    environment:
      - DEV_ENV=production
    networks:
      - dass_private

networks:
  dass_private:
    external: true
```

**Comandos úteis:**

```bash
# Iniciar serviços
docker-compose up -d

# Ver logs
docker-compose logs -f notification-service

# Parar serviços
docker-compose down

# Rebuild e restart
docker-compose up -d --build
```

### Multi-stage Build

O Dockerfile usa multi-stage build para otimizar o tamanho da imagem:

1. **Stage Builder**: Instala todas as dependências e compila TypeScript
2. **Stage Production**: Copia apenas o necessário (dist, node_modules de produção)

Resultado: Imagem final menor e mais segura.


## Logs

O sistema gera logs estruturados usando Winston com as seguintes saídas:

- **Console**: Logs coloridos para desenvolvimento (stdout)
- **combined.log**: Todos os logs (info, warn, error)
- **error.log**: Apenas logs de erro

### Formato dos Logs

```
[2024-01-15 10:30:45] [NotificationService] info: Notification server running on port: 6752
[2024-01-15 10:31:20] [Email] info: Email enviado com sucesso para: usuario@exemplo.com
[2024-01-15 10:32:15] [Worker] info: Worker de notificação iniciado com sucesso
[2024-01-15 10:35:40] [Email] error: Erro ao enviar email: Connection timeout
```

### Níveis de Log

| Nível | Descrição | Uso |
|-------|-----------|-----|
| `info` | Informações gerais | Operações bem-sucedidas, inicializações |
| `warn` | Avisos | Situações anormais mas não críticas |
| `error` | Erros | Falhas em operações, exceções |

### Localização dos Logs

Os arquivos de log são armazenados no diretório `logs/` na raiz do projeto:

```
logs/
├── combined.log    # Todos os logs
└── error.log       # Apenas erros
```

### Configuração do Logger

O logger é configurado em [src/utils/logger.ts](src/utils/logger.ts) e pode ser customizado conforme necessário.

## Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento com hot-reload (nodemon)
npm run dev

# Build do projeto (compila TypeScript)
npm run build

# Execução em produção
npm start
```

### Estrutura de Desenvolvimento

O projeto utiliza:
- **TypeScript** para tipagem estática
- **Nodemon** para hot-reload durante desenvolvimento
- **ts-node** para execução direta de arquivos TypeScript
- **Zod** para validação de schemas em runtime

### Adicionando Novos Tipos de Notificação

Para adicionar um novo tipo de notificação:

1. **Estender a Interface** em [src/types/model.ts](src/types/model.ts):
```typescript
export interface MailOptions {
  to: string;
  subject: string;
  title: string;
  message: string;
  link?: string;
  scheduleFor?: number;
  application?: string;
  // Adicione novos campos aqui
  priority?: 'high' | 'medium' | 'low';
}
```

2. **Atualizar Schema de Validação** em [src/routes/notification.route.ts](src/routes/notification.route.ts):
```typescript
const mailOptionsSchema = z.object({
  to: z.string(),
  subject: z.string(),
  title: z.string(),
  message: z.string(),
  link: z.string().optional(),
  scheduleFor: z.number().optional(),
  application: z.string().optional(),
  // Adicione validação para novos campos
  priority: z.enum(['high', 'medium', 'low']).optional(),
});
```

3. **Modificar Template** em [src/infrastructure/mail/mailer.ts](src/infrastructure/mail/mailer.ts):
```typescript
// Adapte o template HTML conforme necessário
const html = `
  <div style="...">
    ${priority === 'high' ? '<div class="urgent">URGENTE</div>' : ''}
    <!-- restante do template -->
  </div>
`;
```

### Boas Práticas

1. **Sempre valide dados de entrada** usando schemas Zod
2. **Use logging apropriado** para rastrear operações
3. **Trate erros adequadamente** com try-catch e logging
4. **Mantenha tipos TypeScript atualizados** para segurança de tipos
5. **Teste mudanças localmente** antes de fazer deploy

### Implementação PDCA no Desenvolvimento

#### Planejar (Plan)
- Analisar requisitos de notificação de diferentes aplicações
- Projetar contratos de API e schemas de dados
- Planejar medidas de escalabilidade e confiabilidade

#### Fazer (Do)
- Implementar funcionalidade core de notificações
- Criar templates de email padronizados
- Configurar processamento de fila e tratamento de erros

#### Verificar (Check)
- Monitorar taxas de entrega e métricas de performance
- Coletar feedback das equipes de desenvolvimento
- Analisar logs para identificar potenciais melhorias

#### Agir (Act)
- Implementar melhorias baseadas em métricas
- Atualizar templates e API baseado em feedback
- Otimizar gargalos de performance

## Monitoramento

### Health Check

O serviço expõe um endpoint de health check:

```bash
curl http://localhost:6752/
```

Resposta esperada:
```json
{
  "message": "Notification service is runnig!"
}
```

### Monitoramento do RabbitMQ

Se estiver usando RabbitMQ com interface de gerenciamento, acesse:

```
http://localhost:15672
```

Credenciais padrão: `guest` / `guest`

Através da interface você pode:
- Visualizar filas e suas mensagens
- Monitorar taxa de publicação/consumo
- Ver conexões ativas
- Analisar estatísticas de performance

### Métricas Importantes

Monitore as seguintes métricas em produção:

1. **Taxa de Sucesso de Envio**: Percentual de emails enviados com sucesso
2. **Tempo de Processamento**: Tempo médio para processar notificações
3. **Tamanho da Fila**: Número de mensagens aguardando processamento
4. **Taxa de Erro**: Frequência de falhas no envio
5. **Latência**: Tempo entre requisição e envio efetivo

### Alertas Recomendados

Configure alertas para:
- Taxa de erro acima de 5%
- Fila com mais de 1000 mensagens pendentes
- Serviço indisponível por mais de 1 minuto
- Tempo de processamento acima de 10 segundos

## Solução de Problemas

### Problema: Emails não estão sendo enviados

**Possíveis causas:**
- Credenciais SMTP incorretas
- Servidor SMTP bloqueando conexão
- Firewall bloqueando porta 465

**Solução:**
1. Verifique as variáveis de ambiente em `.env`
2. Teste conexão SMTP manualmente
3. Verifique logs em `logs/error.log`

### Problema: Serviço não conecta ao RabbitMQ

**Possíveis causas:**
- RabbitMQ não está rodando
- URL de conexão incorreta
- Problemas de rede

**Solução:**
```bash
# Verifique se RabbitMQ está rodando
docker ps | grep rabbitmq

# Teste conectividade
telnet localhost 5672

# Verifique logs do RabbitMQ
docker logs <rabbitmq-container-id>
```

### Problema: API retorna erro 401

**Causa:** API Key inválida ou ausente

**Solução:**
```bash
# Verifique se o header está correto
curl -H "x-api-key: SUA_CHAVE" http://localhost:6752/notification/

# Confirme que a chave corresponde à configurada em .env
echo $NOTIFICATION_API_KEY
```

### Problema: Notificações agendadas não estão sendo enviadas

**Possíveis causas:**
- Worker não está rodando
- Problema com fila RabbitMQ
- Delay muito longo

**Solução:**
1. Verifique logs do worker
2. Confirme que o worker foi iniciado
3. Verifique fila no RabbitMQ Management

## Segurança

### Boas Práticas Implementadas

1. **Autenticação via API Key**: Todas as requisições requerem chave válida
2. **Validação de Dados**: Entrada validada com Zod antes do processamento
3. **Variáveis de Ambiente**: Credenciais nunca expostas no código
4. **Logs Estruturados**: Rastreamento de todas as operações
5. **Container Isolation**: Execução em container Docker isolado

### Recomendações Adicionais

1. **Rotação de API Keys**: Altere periodicamente a chave de API
2. **HTTPS**: Use HTTPS em produção (configure proxy reverso)
3. **Rate Limiting**: Implemente limitação de taxa se necessário
4. **Backup**: Mantenha backup das configurações
5. **Monitoramento**: Configure alertas para atividades suspeitas

## Licença

Este projeto está disponível sob licença MIT. Consulte o arquivo LICENSE para mais detalhes.

## Suporte

Para suporte técnico ou dúvidas sobre o projeto, abra uma issue no repositório do GitHub.

## Informações do Projeto

- **Nome**: Notification Service
- **Versão**: 1.0.0
- **Porta Padrão**: 6752
- **Repositório**: https://github.com/oondels/notification-service
- **Linguagem**: TypeScript / Node.js
- **Framework**: Express.js

---

Desenvolvido com TypeScript seguindo a metodologia PDCA para qualidade e melhoria contínua.
