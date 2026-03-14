# Estatery-Frontend
A Web App for buying and selling of building properties.

## Projects
- **estatery/admin** – Admin dashboard (Next.js) – port 3000
- **estatery/customer** – User-facing website (Next.js) – port 3001
- **backend** – Django REST API – port 8000

## Quick start

### 1. Backend (required for API)
```bash
cd backend/home_backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
Runs at http://localhost:8000

### 2. Frontend
```bash
# Install dependencies
./install.bat   # Windows
# or
./install.sh    # macOS / Linux

# Run admin dashboard
npm run dev:admin    # http://localhost:3000

# Run user website
npm run dev:website  # http://localhost:3001
```

### 3. Connect to API
Both frontends use `NEXT_PUBLIC_API_URL`. Copy `.env.example` to `.env`:
- `estatery/admin/.env.example` → `estatery/admin/.env`
- `estatery/customer/.env.example` → `estatery/customer/.env`

Default: `http://localhost:8000/api` (when backend runs on port 8000)
