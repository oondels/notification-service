# 📧 Notification Service

Centralized notification system for microservices architecture. Responsible for processing and sending email notifications through RabbitMQ queues, built following PDCA methodology to solve notification scalability issues across multiple internal applications (Dass).

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technologies](#-technologies)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Docker](#-docker)
- [Logs](#-logs)
- [Usage Examples](#-usage-examples)
- [Development](#-development)

## 🎯 Overview

### Problem Statement (PLAN)
Multiple internal applications were facing notification challenges:
- Scattered email configurations across different services
- Inconsistent notification templates and formatting
- Difficulty in tracking and managing notification delivery
- No centralized way to handle notification queuing and scheduling
- Scalability issues when notification volume increased

### Solution (DO)
Built a centralized notification microservice that:
- **Unifies** all email notifications through a single service
- **Standardizes** notification templates and delivery methods
- **Centralizes** configuration and API key management
- **Scales** automatically with RabbitMQ queue processing
- **Simplifies** integration with a clean REST API

### Monitoring (CHECK)
- Structured logging with Winston for tracking delivery status
- Health check endpoints for service monitoring
- Error handling and reporting for failed notifications
- Queue monitoring through RabbitMQ management interface

### Improvement (ACT)
- Continuous enhancement based on service metrics
- Template improvements based on user feedback
- Performance optimization based on queue processing stats
- API enhancements for better developer experience

## ✨ Features

- 📨 **Email Delivery** via configurable SMTP
- 🔐 **API Key Authentication** for security
- ⏰ **Scheduled Notifications** with delay support
- 🐰 **Asynchronous Processing** via RabbitMQ
- 📊 **Structured Logging** with Winston
- 🎨 **Responsive HTML Templates** for emails
- ⚡ **TypeScript** for enhanced reliability
- 🔄 **Data Validation** with Zod schemas

## 🛠 Technologies

- **Node.js** + **TypeScript**
- **Express.js** - Web framework
- **Nodemailer** - Email delivery
- **RabbitMQ** - Message queuing system
- **Winston** - Logging system
- **Zod** - Schema validation
- **Docker** - Containerization

## 🚀 Installation

### Prerequisites

- Node.js 20+
- RabbitMQ
- SMTP server configured

### Development

```bash
# Clone the repository
git clone https://github.com/oondels/notification-service
cd services/notification-service

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run in development mode
npm run dev
```

### Production

```bash
# Build the project
npm run build
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file (development) or `.env.prod` file (production):

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# RabbitMQ
RABBITMQ_URL=amqp://user:password@localhost:5672

# Security
NOTIFICATION_API_KEY=your-secure-api-key

# Environment
DEV_ENV=development
```

### SMTP Configuration

The service supports any SMTP provider. For Gmail:

1. Enable 2-factor authentication
2. Generate an app password
3. Use the app password in `EMAIL_PASS`

## 📡 API Documentation

### Base URL
```
http://localhost:6752
```

### Authentication

All protected routes require the header:
```
x-api-key: YOUR_API_KEY
```

### Endpoints

#### 1. Health Check

```http
GET /
```

**Response:**
```json
{
  "message": "Notification service is running!"
}
```

#### 2. Send Notification

```http
POST /notification/
```

**Headers:**
```
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Email Subject",
  "title": "Notification Title",
  "message": "Message content",
  "link": "https://example.com/details", // Optional
  "scheduleFor": 60000, // Optional - delay in ms
  "application": "System Name" // Optional
}
```

**Success Response (200):**
```json
{
  "message": "Notification sent successfully!"
}
```

**Error Responses:**

```json
// 401 - Invalid API Key
{
  "message": "Invalid API key!"
}

// 400 - Invalid data
{
  "message": "Missing or invalid information: ",
  "error": [
    {
      "path": ["to"],
      "message": "Required"
    }
  ]
}

// 500 - Internal error
{
  "message": "Internal server error. Contact the development team!"
}
```

### Validation Schema

```typescript
{
  to: string,           // Recipient email (required)
  subject: string,      // Email subject (required)
  title: string,        // Notification title (required)
  message: string,      // Message content (required)
  link?: string,        // Optional action link
  scheduleFor?: number, // Delay in milliseconds
  application?: string  // Application name
}
```

## 📁 Project Structure

```
notification-service/
├── src/
│   ├── config/
│   │   └── dotenv.ts           # Environment configuration
│   ├── infrastructure/
│   │   ├── mail/
│   │   │   └── mailer.ts       # Nodemailer configuration
│   │   └── queue/
│   │       ├── connection.ts   # RabbitMQ connection
│   │       └── queue.ts        # Queue management
│   ├── routes/
│   │   └── notification.route.ts # API routes
│   ├── services/
│   │   └── notification.ts     # Business logic
│   ├── types/
│   │   └── model.ts           # TypeScript definitions
│   ├── utils/
│   │   └── logger.ts          # Logging system
│   ├── workers/
│   │   └── bootstrap.ts       # Queue processing worker
│   ├── test/
│   │   └── sendTestNotification.js # Test script
│   └── notificationService.ts  # Main entry point
├── logs/                      # System logs
├── .env                      # Development variables
├── .env.prod                 # Production variables
├── Dockerfile               # Docker container
├── docker-compose.yml       # Docker orchestration
└── package.json
```

## 🐳 Docker

### Build Image

```bash
docker build -t notification-service .
```

### Docker Compose

```yaml
version: '3.8'
services:
  notification-service:
    build: .
    ports:
      - "6752:6752"
    environment:
      - EMAIL_HOST=smtp.gmail.com
      - EMAIL_USER=your-email@gmail.com
      - EMAIL_PASS=your-password
      - RABBITMQ_URL=amqp://rabbitmq:5672
      - NOTIFICATION_API_KEY=your-api-key
    depends_on:
      - rabbitmq
    
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
```

### Run with Docker

```bash
docker-compose up -d
```

## 📊 Logs

The system generates structured logs in:

- **Console**: Colored logs for development
- **combined.log**: All logs (except debug)
- **error.log**: Error logs only

### Log Example

```
[2024-01-15 10:30:45] [NotificationService] info: Notification server running on port: 6752
[2024-01-15 10:31:20] [NotificationService] error: Failed to send email: Connection timeout
```

## 💡 Usage Examples

### 1. Integration with other microservices

```javascript
// services/main-service/src/services/notificationService.js
const axios = require('axios');

async function sendNotification(to, subject, title, message) {
  try {
    await axios.post('http://notification-service:6752/notification/', {
      to,
      subject,
      title,
      message
    }, {
      headers: {
        'x-api-key': process.env.NOTIFICATION_API_KEY
      }
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
```

### 2. Scheduled notifications

```javascript
// Send notification after 1 hour (3600000ms)
const notification = {
  to: "user@example.com",
  subject: "Reminder",
  title: "Your task is pending",
  message: "You have a task that needs to be completed.",
  scheduleFor: 3600000,
  link: "http://system.com/tasks/123"
};
```

### 3. Test script

Run the test script to verify the service is working:

```bash
cd src/test
node sendTestNotification.js
```

## 🔧 Development

### Available Scripts

```bash
# Development with hot-reload
npm run dev

# Build project
npm run build

# Production
npm start

# Tests
npm test

# Linting
npm run lint
```

### Adding New Notification Types

1. Extend the `MailOptions` interface in [`src/types/model.ts`](src/types/model.ts)
2. Update validation schema in [`src/routes/notification.route.ts`](src/routes/notification.route.ts)
3. Modify the template in [`src/infrastructure/mail/mailer.ts`](src/infrastructure/mail/mailer.ts)

### PDCA Implementation in Development

#### Plan
- Analyze notification requirements from different applications
- Design API contracts and data schemas
- Plan scalability and reliability measures

#### Do
- Implement core notification functionality
- Create standardized email templates
- Set up queue processing and error handling

#### Check
- Monitor delivery rates and performance metrics
- Collect feedback from development teams
- Analyze logs for potential improvements

#### Act
- Implement improvements based on metrics
- Update templates and API based on feedback
- Optimize performance bottlenecks

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 👥 Support

For technical support, please contact the development team through your organization's internal channels.

---

**Notification Service** - Centralized Email Notifications v1.0