# 🚀 Fullstack Backend Platform — NestJS Microservices + Real-Time ETL Pipeline

This project is a modular **NestJS Monorepo** showcasing a **REST API Gateway**, **Authentication Microservice**, and a **real-time ETL pipeline** using MongoDB, Redis Streams, Apache Spark, and MinIO. It demonstrates microservice communication, scalable architecture, event-driven design, and real-world backend infrastructure.

---

## 📦 Key Features

### ✅ NestJS Monorepo Architecture
- **Gateway** with public-facing REST API
- **Authentication microservice** with TCP transport
- **Modular folder structure** using shared `common/`, `core/`, and `config/`
- **MongoDB** for user persistence
- **Swagger API docs**
- **Dockerized setup** for all services

### ✅ Real-Time ETL Data Pipeline
- **MongoDB Change Streams** to detect inserts/updates in cdc-producer
- **Redis Streams** for buffering change events in cdc-producer
- **Apache Spark** job for transformation by using PySpark
- **MinIO** for storing cleaned Parquet data

---

## 🧠 System Architecture Overview

```text
                               ┌────────────────────────┐
                               │     NestJS Gateway     │◄────┐
                               └────────────────────────┘     │
                                         ▲                    │
                                         │ TCP                │ REST APIs
                                         ▼                    │
                          ┌────────────────────────────┐      │
                          │ Authentication Microservice│      │
                          └────────────────────────────┘      │
                                         │                    │
                          ┌──────────────┴──────────────┐     │
                          ▼                             ▼     ▼
                 [MongoDB: users, orders_source]    [Swagger Docs]
    [by using source data simulator micro-service]
                 
                                  (ETL Starts Here ↓)

    ┌──────────────┐   CDC   ┌──────────────────────┐   Stream   ┌─────────────────┐
    │ MongoDB      ├────────▶│ cdc-producer (NestJS)├───────────▶│ Redis Streams  │
    └──────────────┘         └──────────────────────┘            └─────────────────┘
                                    Producer                         ▲
                                                                     │
                                                                     ▼ streaming
                                                         ┌────────────────────┐
                                                         │ Spark ETL Pipeline │ Consumer
                                                         └────────────────────┘
                                                                     │
                                                                     ▼
                                                            ┌────────────────┐
                                                            │   MinIO Lake   │ DataLake
                                                            └────────────────┘
```                                                        [compitable to snowflake/bigquery]

---

## 📁 Project Structure

```
nestjs-monorepo/
├── apps/
│   ├── gateway/                  # Public REST API
│   ├── authentication/          # Microservice for user management
│   ├── source-data-simulator/   # Simulates insert/update events in MongoDB
│   ├── cdc-producer/            # Listens to MongoDB change streams → Redis
├── spark-apps/
│   └── etl-pipeline/            # Spark job to read Redis → Parquet (MinIO)
├── common/                      # Shared DTOs, interfaces
├── core/                        # Logger, exceptions, etc.
├── config/                      # Config loading, .env variables
├── docker-compose.yml
└── .env.example
```

---

## 🌐 Gateway API Endpoints

### POST `/auth/register`
Registers a new user.

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePass123"
}
```

### GET `/auth/users`
Fetches all registered users.

---

## 🧠 Authentication Microservice

- TCP-based microservice
- Handles:
  - User creation
  - Password hashing
  - User fetching
- MongoDB persistence via Mongoose

---

## 🔄 Real-Time ETL Flow

### 1️⃣ `source-data-simulator`
- Simulates MongoDB inserts and updates on `orders_source` collection

### 2️⃣ `cdc-producer`
- Connects to MongoDB change streams
- Sends events to Redis Stream `orders_cdc_stream`

### 3️⃣ Redis Streams
- Stores raw CDC (Change Data Capture) events

### 4️⃣ Apache Spark (PySpark)
- Reads from Redis Stream in batch
- Transforms and saves cleaned data to MinIO as Parquet

### 5️⃣ MinIO
- S3-compatible object store
- Stores historical ETL data

---

## ⚙️ Tech Stack

- **NestJS Monorepo**
- **MongoDB** with Mongoose
- **Redis Streams** (Pub/Sub style CDC buffer)
- **Apache Spark (PySpark)**
- **MinIO** as data lake
- **Swagger** API Docs
- **Docker & Docker Compose**
- **class-validator**, DTOs, centralized logger

---

## 🐳 Docker Usage

```bash
docker-compose up --build
```

This will spin up:

- MongoDB - single node replica set
- Redis - singgle node redis streams
- MinIO - object storage to simulate data lake -> open the url localhost:9001 login with id->minioadmin & pass-> minioadmin and create a bucket with name -> etl-warehouse
- Gateway - REST API Gateway
- Auth microservice - Authentication microservice
- CDC producer - Listens to MongoDB change streams
- Data simulator - Simulates MongoDB insert/update events
- ETL Spark Master - Apache Spark master node
- ETL Spark Worker - Apache Spark worker node
- ETL Spark Job Submit - Submits PySpark job to Spark Master

---

## 📚 Swagger API Docs

- Auto-generated with `@nestjs/swagger`
- URL: [http://localhost:3000/api](http://localhost:3000/api)

---

## 🧪 Validation & DTOs

- Input validation using `class-validator`
- DTOs define all schema contracts
- Validations occur at the controller level

---

## 🔐 Bonus Features

- ✅ JWT login flow (optional)
- ✅ Centralized logger (in `core/logger`)
- ✅ Health check endpoints
- ✅ Rate limiting middleware
- ✅ Spark batch orchestration

---

## 📄 Environment Variables

Create a `.env.development` file:

```env
# MongoDB
MONGO_URI=mongodb://mongo:27017/etl-db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
ORDERS_STREAM_NAME=orders_cdc_stream

# MinIO
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=orders-data
```

---

## ✅ Project Checklist

| Area                              | Done |
|-----------------------------------|------|
| NestJS Monorepo Structure         | ✅   |
| TCP Microservices                 | ✅   |
| MongoDB + Redis + MinIO           | ✅   |
| Swagger Documentation             | ✅   |
| Dockerized Deployment             | ✅   |
| PySpark ETL to MinIO              | ✅   |
| JWT Auth (optional)               | ✅   |
| Logger, Rate Limiting, Health     | ✅   |

---

## 📬 Submission Checklist

- ✅ GitHub Repository: [GitHub Link](https://github.com/Kuldeeppanwar007/aladia)

## 🧑‍💻 Author

**Kuldeep panwar**  
Backend Developer | Node.js & NestJS Enthusiast  
📧 kuldeeppanwar7697@gmail.com  
🔗 [LinkedIn](https://www.linkedin.com/in/kuldeeppanwar007/) | [GitHub](https://github.com/Kuldeeppanwar007)
