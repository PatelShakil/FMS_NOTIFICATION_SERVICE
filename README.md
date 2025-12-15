# 📧 BoloIndia Notification Service

**Microservice for managing email notifications via Kafka event streaming**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 📋 Table of Contents

- [📧 BoloIndia Notification Service](#-boloindia-notification-service)
  - [📋 Table of Contents](#-table-of-contents)
  - [🎯 Overview](#-overview)
  - [✨ Features](#-features)
    - [Core Features](#core-features)
    - [Advanced Features](#advanced-features)
  - [🏗️ Architecture](#️-architecture)
  - [🛠️ Tech Stack](#️-tech-stack)
  - [📦 Prerequisites](#-prerequisites)
  - [🚀 Installation](#-installation)
    - [1. Clone the Repository](#1-clone-the-repository)
  - [📨 Kafka Events](#-kafka-events)
    - [Organization Events (3)](#organization-events-3)
    - [Distributor Events (4)](#distributor-events-4)
    - [Response/Feedback Events (4)](#responsefeedback-events-4)
    - [QR Code Events (8)](#qr-code-events-8)
    - [Feedback Form Events (1)](#feedback-form-events-1)
    - [Event Payload Example](#event-payload-example)
  - [📧 Email Templates](#-email-templates)
    - [Template Variables](#template-variables)

---

## 🎯 Overview

The **Notification Service** is a critical microservice in the BoloIndia ecosystem responsible for:

- **Consuming Kafka events** from 22 different topics
- **Sending email notifications** to citizens, organizations, and distributors
- **Managing user notification preferences**
- **Handling retry logic** for failed notifications
- **Tracking notification history** and analytics
- **Providing REST APIs** for manual notification triggers

---

## ✨ Features

### Core Features
- ✅ **22 Kafka Event Consumers** - Listens to all platform events
- ✅ **Email Service** - Gmail SMTP, SendGrid, AWS SES support
- ✅ **Handlebars Templates** - 22 professional email templates
- ✅ **User Preferences** - Granular notification control
- ✅ **Retry Mechanism** - Automatic retry with exponential backoff
- ✅ **REST API** - Manual notification triggers and management
- ✅ **Swagger Documentation** - Interactive API docs
- ✅ **Prometheus Metrics** - Performance monitoring
- ✅ **Health Checks** - Kubernetes-ready liveness/readiness probes

### Advanced Features
- 🔄 **Queue Management** - Priority-based notification queue
- 📊 **Analytics Dashboard** - Notification stats and insights
- 🔐 **JWT Authentication** - Secure API endpoints
- 🚦 **Rate Limiting** - HTTP and email rate limits
- 📝 **Structured Logging** - Winston with file rotation
- 🐳 **Docker Support** - Multi-stage production builds

---

## 🏗️ Architecture

┌─────────────────────────────────────────────────────────────┐
│ BoloIndia Platform │
│ (auth-service, org-service, qr-service, response-service) │
└─────────────────┬───────────────────────────────────────────┘
│
│ Produces Events
▼
┌────────────────┐
│ Kafka Broker │
│ 22 Topics │
└────────┬───────┘
│
│ Consumes Events
▼
┌───────────────────────┐
│ Notification Service │
│ │
│ ┌─────────────────┐ │
│ │ Event Consumers │ │
│ └────────┬────────┘ │
│ │ │
│ ┌────────▼────────┐ │
│ │ Template Engine │ │
│ │ (Handlebars) │ │
│ └────────┬────────┘ │
│ │ │
│ ┌────────▼────────┐ │
│ │ Email Service │ │
│ │ (SMTP/SendGrid) │ │
│ └────────┬────────┘ │
│ │ │
│ ┌────────▼────────┐ │
│ │ MongoDB │ │
│ │ (Notifications) │ │
│ └─────────────────┘ │
└───────────────────────┘
│
│ Sends Emails
▼
┌────────────────┐
│ Recipients │
│ Citizens, Orgs │
│ Distributors │
└────────────────┘


---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| Express.js | 4.18+ | REST API framework |
| Mongoose | 8.0+ | MongoDB ODM |
| KafkaJS | 2.2+ | Kafka client |
| Nodemailer | 6.9+ | Email sending |
| Handlebars | 4.7+ | Email templates |
| Winston | 3.11+ | Logging |
| prom-client | 15.1+ | Prometheus metrics |
| Swagger | 5.0+ | API documentation |
| Docker | 20+ | Containerization |

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 18.0.0
- **MongoDB** >= 5.0
- **Apache Kafka** >= 3.0
- **Docker** & **Docker Compose** (optional)
- **Gmail account** with App Password (or SendGrid API key)

---

## 🚀 Installation

### 1. Clone the Repository

```git clone https://github.com/boloindia/notification-service.git
cd notification-service```



---

## 📨 Kafka Events

The service consumes events from **22 Kafka topics**:

### Organization Events (3)
- `org.registered` → Admin notification
- `org.approved` → Owner notification
- `org.rejected` → Owner notification
- `org.suspended` → Owner notification

### Distributor Events (4)
- `distributor.registered` → Admin notification
- `distributor.approved` → Distributor notification
- `distributor.rejected` → Distributor notification
- `distributor.suspended` → Distributor notification
- `distributor.reactivated` → Distributor notification

### Response/Feedback Events (4)
- `response.submitted` → Org admin notification
- `response.reviewed` → Citizen notification
- `response.resolved` → Citizen notification
- `response.flagged` → Org admin notification

### QR Code Events (8)
- `qr.assigned` → Distributor notification
- `qr.accepted` → Org admin notification
- `qr.rejected` → Org admin notification
- `qr.deployment_submitted` → Org admin notification
- `qr.deployed` → Distributor notification
- `qr.deployment_rejected` → Distributor notification
- `qr.deactivated` → Distributor notification
- `qr.deleted` → Distributor notification

### Feedback Form Events (1)
- `feedback_form.deleted` → Org admin notification

### Event Payload Example


{
"eventId": "evt_123456",
"eventType": "org.approved",
"timestamp": "2025-12-09T12:00:00Z",
"data": {
"orgId": 42,
"orgName": "Smart City Initiative",
"ownerEmail": "admin@smartcity.gov",
"ownerName": "Jane Smith",
"approvedAt": "2025-12-09T12:00:00Z"
}
}


---

## 📧 Email Templates

All 22 templates are located in `src/templates/`:

| Template | Recipient | Trigger |
|----------|-----------|---------|
| `org_approved.hbs` | Org Owner | Organization approved |
| `org_rejected.hbs` | Org Owner | Organization rejected |
| `org_suspended.hbs` | Org Owner | Organization suspended |
| `distributor_approved.hbs` | Distributor | Account approved |
| `qr_assigned.hbs` | Distributor | QR code assigned |
| `response_submitted.hbs` | Org Admin | New feedback received |
| ... | ... | ... |

### Template Variables

Templates use Handlebars syntax:

<h1>Welcome, {{orgName}}!</h1> <p>Dear {{ownerName}},</p> <p>Your organization was approved on {{formatDateTime approvedAt}}</p> ```
📊 Monitoring
Prometheus Metrics
Access metrics at: http://localhost:8092/metrics

Available Metrics:

notification_service_emails_sent_total - Total emails sent

notification_service_emails_failed_total - Total failures

notification_service_queue_size - Current queue size

notification_service_kafka_messages_consumed_total - Kafka messages consumed

Health Checks
Basic Health: GET /health
Detailed Health: GET /health/detailed (requires JWT)
Readiness Probe: GET /health/readiness
Liveness Probe: GET /health/liveness

Logs
Logs are written to:

Console - Development mode

File - ./logs/notification-service.log

View logs: