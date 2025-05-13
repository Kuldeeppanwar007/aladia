# 🚀 NestJS Monorepo Backend (Gateway + Authentication Microservice)

This project demonstrates a **modular NestJS monorepo architecture** implementing a **REST API Gateway** and an **Authentication microservice**. It showcases internal microservice communication using **TCP transport**, while following **MVC structure**, and leveraging **NestJS best practices** like **DTOs**, **validation**, **Swagger**, **Docker**, and more.

## 📁 Project Structure

```
nestjs-monorepo/
├── apps/
│   ├── gateway/           # Public-facing REST API
│   └── authentication/    # Microservice for user management
├── common/                # Shared modules, DTOs, interfaces
├── core/                  # Core utilities, logger, exceptions
├── config/                # Environment and configuration files
├── node_modules/
├── package.json
└── tsconfig.base.json
```

## ⚙️ Technologies & Tools

- **NestJS** Monorepo
- **TCP-based Microservices**
- **MongoDB** (via Mongoose)
- **Swagger** API Docs
- **Docker** & Docker Compose
- **class-validator**, **DTOs**

## 🌐 Gateway Endpoints (apps/gateway)

These are RESTful endpoints exposed to the client:

### POST `/auth/register`

Registers a new user.

- **Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePass123"
}
```

### GET `/auth/users`

Returns a list of all registered users.

## 🧠 Authentication Microservice (apps/authentication)

Handles the following business logic:

- User creation and validation
- Fetching all users
- Persistence to MongoDB
- TCP communication via NestJS microservices

## 🔌 Microservices Communication

- **Gateway ⇄ Authentication** via **TCP transport**
- Implemented with `@nestjs/microservices`
- Uses a **NetworkingService** for abstracting request/response messaging

## 🧪 Validation

- Input validation using `class-validator`
- DTOs define schema for all incoming and outgoing requests

## 📚 Swagger API Documentation

- Automatically generated using `@nestjs/swagger`
- Visit: `http://localhost:3000/api`

## 🐳 Docker Support

Spin up the entire system with one command:

```bash
docker-compose up --build
```

Includes services for:
- Gateway
- Authentication
- MongoDB

## ✅ Requirements Checklist

| Area            | Implemented |
|-----------------|-------------|
| Monorepo Structure | ✅ |
| Modular MVC      | ✅ |
| DTOs & Validation| ✅ |
| MongoDB Integration | ✅ |
| TCP Microservice Communication | ✅ |
| Swagger Docs     | ✅ |
| Dockerized Setup | ✅ |

## 🧩 Bonus Features (Optional)

- [✅] JWT Login Flow
- [✅] Centralized Logger in `core/`
- [✅] Health Checks
- [✅] Rate Limiting
- [✅] Test Coverage


## 📬 Submission Checklist

- ✅ GitHub Repository: [GitHub Link](https://github.com/Kuldeeppanwar007/aladia)
- ✅ Video Walkthrough: [Loom/Vidyard Link](#)

## 🧑‍💻 Author

**Kuldeep panwar**  
Backend Developer | Node.js & NestJS Enthusiast  
📧 kuldeeppanwar7697@gmail.com  
🔗 [LinkedIn](https://www.linkedin.com/in/kuldeeppanwar007/) | [GitHub](https://github.com/Kuldeeppanwar007)


