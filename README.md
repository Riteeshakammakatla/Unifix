# 🏫 UniFix - Smart Campus Maintenance System

UniFix (formerly Campus IQ) is a modern, AI-powered issue tracking and maintenance management system designed for university campuses. It streamlines the process of reporting, assigning, and resolving facility issues using advanced Language Models (LLMs) and automated Service Level Agreements (SLAs).

---

## ✨ Key Features

- **Role-Based Access Control (RBAC):** Distinct portals for Students, Supervisors, and Administrators.
- **AI-Powered Issue Intelligence:** 
  - **Auto-Categorization**: Determines whether an issue is Plumbing, Electrical, Network, etc.
  - **Priority Prediction**: Automatically flags safety hazards as High/Critical priority.
  - **Duplicate Detection**: Identifies if a similar problem was recently reported, reducing clutter.
  - **Auto-Summarization**: Generates brief, professional summaries for supervisors.
- **Automated SLAs and Escalation:**
  - Enforces strict response and resolution deadlines based on issue categories.
  - Automatically escalates overdue issues to Campus Administrators.
- **Smart Auto-Assignment:** Automatically assigns new issues to the correct department supervisor based on AI categorization.

---

## 🛠 Tech Stack

**Frontend (Client)**
- React (Vite)
- Custom CSS / Pastel UI Design System
- Lucide React (Icons)

**Backend (Server)**
- Python 3 / Django
- Django REST Framework (DRF)
- JWT Authentication (`djangorestframework-simplejwt`)
- **AI Integration**: Groq API (`llama-3.3-70b-versatile`)
- SQLite Database

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

**Frontend:**
```bash
# In the project root
npm install
```

**Backend:**
```bash
cd backend
python -m venv .venv
# Activate environment (Windows)
.venv\\Scripts\\activate
# Or macOS/Linux: source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the `backend/` directory:
```env
# backend/.env
DEBUG=True
SECRET_KEY=your-secure-django-secret-key

# Get your free API key at console.groq.com
GROQ_API_KEY=your-groq-api-key-here
```

### 3. Database Setup

Apply migrations and populate default SLAs:
```bash
cd backend
python manage.py migrate
python manage.py shell < populate_slas.py

# Create a superuser for admin access
python manage.py createsuperuser
```

### 4. Run the Application

Start both servers concurrently:

**Frontend:**
```bash
npm run dev
```

**Backend:**
```bash
cd backend
python manage.py runserver
```

Open `http://localhost:5173` in your browser.

---

## 🧠 AI Module Notes

This project uses the Groq API for rapid LLM inference. Ensure your `GROQ_API_KEY` is valid. If the API key is missing or invalid, the backend `LLMService` will safely fallback to default manual categorizations and allow the system to continue functioning without AI features.
