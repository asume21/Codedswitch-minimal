# CodedSwitch

AI-powered coding and music creation platform.

## Features

- AI-powered code translation
- Music generation and editing
- Real-time collaboration
- Secure API access
- User authentication

## Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- Python 3.10+

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/asume21/Codedswitch-minimal.git
   cd Codedswitch-minimal
   ```

2. Copy the example environment files:
   ```bash
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   ```

3. Update the environment variables in both `.env` files with your configuration.

4. Start the application using Docker Compose:
   ```bash
   docker-compose up --build
   ```

5. Access the application at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:10000
   - Redis: localhost:6379

## Production Deployment

### Render.com

1. Fork this repository to your GitHub account.

2. Create a new Web Service on Render and connect your GitHub repository.

3. Configure the following environment variables in the Render dashboard:
   - `FLASK_ENV=production`
   - `SECRET_KEY=your-secret-key`
   - `DATABASE_URL=postgresql://user:password@host:port/database`
   - `STRIPE_SECRET_KEY=your-stripe-secret-key`
   - `STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret`
   - `MAIL_SERVER=your-smtp-server`
   - `MAIL_PORT=587`
   - `MAIL_USE_TLS=true`
   - `MAIL_USERNAME=your-email@example.com`
   - `MAIL_PASSWORD=your-email-password`
   - `REDIS_URL=redis://redis:6379/0`
   - `RQ_REDIS_URL=redis://redis:6379/0`

4. Set the build command to:
   ```
   cd frontend && npm install && npm run build
   ```

5. Set the start command to:
   ```
   gunicorn --bind 0.0.0.0:$PORT --workers 4 --timeout 120 backend.web_backend:app
   ```

6. Deploy the application.

## Project Structure

```
.
├── backend/               # Backend API (Flask)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── routes/
│   │   └── services/
│   ├── migrations/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/             # Frontend (React)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Environment Variables

### Backend

- `FLASK_ENV`: Application environment (development, production)
- `SECRET_KEY`: Secret key for session management
- `DATABASE_URL`: Database connection URL
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
- `MAIL_*`: Email configuration
- `REDIS_URL`: Redis connection URL
- `RQ_REDIS_URL`: RQ Redis connection URL

### Frontend

- `VITE_API_URL`: Backend API URL
- `VITE_AI_URL`: AI service URL
- `VITE_STRIPE_PUBLIC_KEY`: Stripe public key
- `VITE_APP_NAME`: Application name
- `VITE_APP_ENV`: Application environment

## License

MIT
