# 🎓 Coaching Institute Management ERP (White-Label Demo)

A modern, production-grade, multi-stream Coaching Institute Management System built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM** with **PostgreSQL**.

Designed to be presented as a **white-label demo** to prospective coaching institutes, tuition centers, academies, and junior colleges.

---

## 🌟 Key Features

### 🏢 Dual-Stream Architecture
- **School Module (Standards 8th – 10th / Foundations)**: Tailored for school-level boards and foundation batches.
- **Commerce / Senior Module (Standards 11th – 12th & Beyond)**: Configured for specialized streams and career batches.

### 👥 Student & Admission Management
- Quick student admissions with comprehensive demographic, parent, and academic details.
- Batch allocation, roll numbers, enrollment statuses, and instant profile editing.
- Instant search, filters by standard/batch, and detailed student dossiers.

### 💰 Automated Fee Collection & Smart Receipt Generation
- Flexible fee assignment, installment tracking, discounts, and payment history.
- **One-click printable official PDF fee receipts** (A5 format ready) with institute watermark, authorized signature line, and auto-generated receipt numbering.
- Real-time calculations of received vs. outstanding balances.

### 📊 Attendance & Performance Tracking
- Daily batch-wise attendance recording with attendance percentage tracking.
- Test and exam management with maximum vs. obtained marks tracking.
- **Comprehensive Student Progress Dossier (PDF Report)** combining academic scores, attendance %, fee status, and recent activity.

### 🔐 Role-Based Access Control (RBAC) & Security
- Granular admin roles:
  - `SUPER_ADMIN`: Full system access, administrator management, audit privileges.
  - `SCHOOL_ADMIN`: Dedicated access to school section.
  - `COMMERCE_ADMIN`: Dedicated access to commerce section.
- JWT session management stored in secure HttpOnly cookies.
- Edge proxy / middleware route guards protecting private routes.

---

## 🎨 White-Label Rebranding in 1 Minute

All branding constants are centralized in [`lib/institute-config.ts`](file:///c:/Users/suraj/Desktop/DATABASE/Database/lib/institute-config.ts).

To customize the software for any client presentation:

1. Open [`lib/institute-config.ts`](file:///c:/Users/suraj/Desktop/DATABASE/Database/lib/institute-config.ts)
2. Update the institute name, contact details, address, and tagline:
```typescript
export const INSTITUTE_CONFIG = {
  INSTITUTE_NAME: "Apex Science Academy",
  INSTITUTE_SHORT_NAME: "Apex Academy",
  INSTITUTE_TAGLINE: "Excellence in Competitive Examinations",
  INSTITUTE_EMAIL: "contact@apexacademy.example",
  INSTITUTE_PHONE: "9876543210",
  INSTITUTE_ADDRESS: "Knowledge Park, Pune, Maharashtra",
  INSTITUTE_PAGE_TITLE: "Apex Science Academy – Management Portal",
  INSTITUTE_COPYRIGHT_NAME: "Apex Science Academy",
};
```
That's it! All login portals, navigation headers, page titles, PDF fee receipts, and student reports will immediately reflect the new institute's branding.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js 18+ or 20+
- PostgreSQL database (e.g. Neon, Supabase, AWS RDS, or local Postgres)

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure your `.env` variables:
```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
JWT_SECRET="your-strong-random-jwt-secret-key"
ADMIN_SEED_EMAIL="admin@brightfuture.example"
```

### 3. Install Dependencies & Generate Prisma Client
```bash
npm install
npx prisma generate
```

### 4. Database Setup & Seeding Demo Admin
Push the database schema and seed the initial super administrator:
```bash
npx prisma db push
npm run seed # or npx ts-node prisma/seed.ts
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## 🔑 Default Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@brightfuture.example` | `Admin@1234` |

*(You can also reseed or reset the super admin at any time via the internal endpoint `/api/seed-admin` when authenticated).*

---

## 📂 Project Architecture

```
├── app/
│   ├── admin/               # Admin dashboard and management modules
│   │   ├── students/        # School student listings and profiles
│   │   ├── fees/            # School fee management and receipt generation
│   │   ├── attendance/      # Attendance marking and analytics
│   │   ├── tests/           # Test schedules and marks entry
│   │   ├── batches/         # Batch and standard management
│   │   ├── admins/          # Admin user management & RBAC assignments
│   │   └── commerce/        # Specialized commerce module (students, fees, attendance)
│   ├── api/                 # Secure API routes for auth, data CRUD, & seeders
│   └── login/               # Authentication screens (Login, Forgot Password, Reset)
├── components/              # Reusable UI components & layouts (AdminLayout, Sidebar)
├── lib/
│   ├── auth.ts              # JWT utilities and permission validation
│   ├── institute-config.ts  # Centralized white-label branding configuration
│   └── prisma.ts            # Prisma client instance with retry logic
├── prisma/
│   ├── schema.prisma        # Database models & relationships
│   └── seed.ts              # Database seeder for demo accounts
└── proxy.ts                 # Next.js edge route protection proxy
```

---

## 💼 Client Presentation Tips

1. **Highlight Instant Receipts**: Demonstrate the fee payment flow and show how clicking *Print Receipt* produces a branded receipt instantly without needing third-party software.
2. **Showcase Separation of Streams**: Explain how School and Commerce/College departments can be managed independently under the same software.
3. **Emphasize Data Privacy & Roles**: Show the Admin management panel where teachers or stream heads can be restricted to only their respective departments.
4. **Offer Rebranding Flexibility**: Demonstrate how easy it is to plug in their institute logo, colors, and legal details.
