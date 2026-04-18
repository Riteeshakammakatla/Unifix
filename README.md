# 🛠️ UniFix - Smart Campus Issue Management System

UniFix is a full-stack, AI-powered maintenance and issue tracking platform designed for modern university campuses. It streamlines the communication between students, faculty, and maintenance staff, using Artificial Intelligence to prioritize, categorize, and assign tasks automatically.

---

## 🚀 Key Features

### 🤖 AI-Driven Intelligence
- **Automatic Classification**: Uses Groq AI to automatically categorize issues (Electrical, Plumbing, HVAC, etc.) based on user descriptions.
- **Smart Prioritization**: Issues are ranked by severity (Critical to Low) to ensure urgent problems are solved first.
- **Duplicate Detection**: Identifying similar reports to prevent redundant maintenance work.

### 🔒 Secure Authentication
- **Multi-Role Support**: Custom dashboards for Admins, Supervisors, Workers, and Students.
- **OTP Verification**: Enhanced security with Email-based One-Time Passwords (SMTP) for all logins.

### 📊 Comprehensive Dashboards
- **Admin Panel**: High-level analytics on campus health and worker performance.
- **Supervisor Dashboard**: One-click assignment, inventory tracking, and worker management.
- **Worker View**: Real-time task lists with status updates (In Progress, Resolved).
- **Student Portal**: Easy reporting with location tagging and status tracking.

### 📦 Inventory & Logistics
- **Material Management**: Automated tracking of stock levels for each department.
- **Audit Logs**: Full history of worker additions and maintenance activities.

---

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS, Vite
- **Backend**: Django, Django REST Framework
- **Database**: PostgreSQL (Production), SQLite (Development)
- **AI Engine**: Groq Cloud API
- **Deployment**: Render (Web Service + Static Site)
- **Email**: Gmail SMTP with App Passwords

---

## 📂 Project Structure

```bash
UniFix/
├── backend/            # Django API
│   ├── apps/           # Core applications (Auth, Issues, Inventory)
│   ├── config/         # Django settings and production config
│   └── seed_live.py    # Production data migration script
├── src/                # React Frontend
├── README.md           # Project Documentation
└── build.sh            # Production deployment script
```
## ⚙️ Installation & Setup

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate 
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
### 2. Frontend Setup
```bash
# From the root directory
npm install
npm run dev
```

