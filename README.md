# 🚀 NestJS Boilerplate by Abredagn kebede

A production-ready NestJS boilerplate designed to help you kickstart your next backend project with all the essentials preconfigured: authentication, PostgreSQL, environment config, clean architecture, and best practices out of the box.

---

## 📦 Features

- ✅ Modular folder structure (Auth, User, Config, Database)
- 🔐 JWT-based Authentication (Access & Refresh token-ready)
- 🗃️ PostgreSQL + TypeORM setup
- 🔁 Class-based DTO validation with `class-validator`
- 📜 Environment configuration using `@nestjs/config`
- 🧪 Testing-ready with Jest & `supertest`
- 📚 Swagger API documentation
- 🧼 Prettier + ESLint configured
- 🐳 Optional: Docker & Docker Compose support
- 🧰 Utilities like bcrypt, Passport strategies, and guards

---

## 🧱 Technologies

- **NestJS** – Progressive Node.js framework
- **TypeScript** – Type-safe backend
- **TypeORM** – Elegant ORM for data access
- **PostgreSQL** – Default SQL database
- **Passport** – Authentication middleware
- **JWT** – Secure token-based auth
- **class-validator** – DTO validation
- **Swagger** – Auto API docs

---

## ✅ Folder structure
src/
├── app.module.ts                 # Root module
├── main.ts                       # Application entry point
├── common/                       # Shared code
│   ├── constants/                # Application constants
│   ├── decorators/               # Custom decorators
│   ├── dto/                      # Common DTOs
│   ├── entities/                 # Base entities
│   ├── enums/                    # Enum definitions
│   ├── exceptions/               # Custom exceptions
│   ├── filters/                  # Exception filters
│   ├── guards/                   # Custom guards
│   ├── interfaces/               # TypeScript interfaces
│   ├── interceptors/             # Custom interceptors
│   ├── middlewares/              # HTTP middlewares
│   ├── pipes/                    # Custom validation pipes
│   └── utils/                    # Helper functions
├── config/                       # Configuration 
│   ├── app.config.ts             # App configuration
│   ├── auth.config.ts            # Auth configuration 
│   ├── database.config.ts        # Database configuration
│   ├── email.config.ts           # Email configuration
│   ├── redis.config.ts           # Redis configuration
│   ├── storage.config.ts         # Storage configuration
│   └── validation.schema.ts      # Env validation schema
├── apps/                      # Feature modules
│   ├── auth/                     # Authentication
│   ├── users/                    # User management
│   └── health/                   # Health checks
├── database/                     # Database related
│   ├── migrations/               # TypeORM migrations
│   ├── seeders/                  # Database seeders
│   └── repositories/             # Custom repositories
└── resources/                    # Static resources
    ├── email-templates/          # Email templates
    └── locales/                  # i18n translations

## ⚙️ Getting Started

### 1. Clone the boilerplate

```bash
git clone https://github.com/AbredagnKebede/nestjs-boilerplate.git my-new-app
cd my-new-app
rm -rf .git
npm install

