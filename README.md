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
 

http://127.0.0.1:8000/api/docs/
http://127.0.0.1:8000/api/schema/


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

Use a **full URL** to the Django API (e.g. `http://127.0.0.1:8000/api`). Do **not** set only `/api` — that would call the Next.js dev server instead of Django. If the variable is missing or blank, the apps default to `http://127.0.0.1:8000/api`.

To verify the in-app notification bell, create a test row for your logged-in user:

```bash
cd backend/home_backend
python manage.py create_test_notification --username YOUR_USERNAME
```
