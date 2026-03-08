# VeriMail: Multi-Tenant Email Verification Platform

VeriMail is a robust, full-stack multi-tenant email verification API platform designed for high-volume validation and scalability. This project provides a complete foundation for building email verification services that require organizational isolation, subscription management, and secure API key access.

## 🚀 Features

### Core Infrastructure
- **Multi-Tenancy**: Complete isolation of verification logs and data between organizations.
- **Subscription Tiers**: Flexible plan system with configurable request limits (verification credits), rate limits, and API key quotas.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `OWNER` and `MEMBER` roles.
- **Modern Tech Stack**: Built with Next.js 16, Express, Prisma, and Redis.

### Email Verification & Security
- **Verification Logging**: Detailed tracking of every email verification attempt including status and validity.
- **JWT-based Authentication**: Secure user sessions and cross-origin resource sharing.
- **API Key Management**: Organizations can generate and manage multiple API keys for programmatic verification access.
- **Rate Limiting**: Redis-backed rate limiting to protect validation services and enforce subscription tiers.

### Frontend Dashboard
- **Modern UI/UX**: Responsive dashboard built with Tailwind CSS 4 and Radix UI primitives.
- **State Management**: Optimized data fetching with React Query and global state via Zustand.
- **Usage Insights**: Real-time verification logs and subscription status tracking.

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Cache/Rate Limiting**: Redis (ioredis)
- **Auth**: JSON Web Tokens (JWT), Bcrypt

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4, Lucide React
- **UI Components**: Shadcn UI (Radix UI)
- **Data Fetching**: TanStack Query (React Query), Axios
- **State Management**: Zustand
- **Forms**: React Hook Form, Zod

## 📂 Project Structure

```text
├── client/                 # Next.js frontend application
│   ├── app/                # App router (pages & layouts)
│   ├── components/         # Reusable UI components
│   ├── lib/                # API clients and utilities
│   └── store/              # Zustand state stores
├── prisma/                 # Database schema and migrations
├── routes/                 # Express API routes
├── middlewares/            # Auth, Rate limiting, and API key validation
├── utils/                  # Shared utilities (JWT, Email, etc.)
├── index.js                # Backend entry point
└── prisma.config.ts        # Prisma configuration
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL
- Redis

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd multi-tenant-subscription-model
   ```

2. **Backend Setup**:
   ```bash
   npm install
   # Create a .env file based on your environment
   # DATABASE_URL, REDIS_URL, JWT_SECRET, etc.
   npx prisma generate
   npx prisma migrate dev
   npm run seed # To populate initial plans
   ```

3. **Frontend Setup**:
   ```bash
   cd client
   npm install
   # Create a .env.local file
   # NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

### Running the Application

- **Start Backend**: `npm run dev` (from root)
- **Start Frontend**: `npm run dev` (from `client/` directory)

## 📖 API Documentation
Detailed API documentation and endpoint descriptions can be found in the `routes/` directory. The platform supports:
- `/auth`: Registration, login, and session management.
- `/org`: Organization settings and member management.
- `/api-keys`: CRUD operations for organization API keys.
- `/product`: Email verification endpoints protected by subscription tiers.

## 📄 License
This project is licensed under the ISC License.
