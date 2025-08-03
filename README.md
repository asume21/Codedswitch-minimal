# CodedSwitch 🎵💻

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=render)](https://www.codedswitch.com)
[![GitHub License](https://img.shields.io/github/license/asume21/Codedswitch-minimal?style=for-the-badge)](LICENSE)

**The world's first AI-powered coding rapper platform that bridges technology and music creation.**

</div>

![CodedSwitch Banner](https://raw.githubusercontent.com/asume21/Codedswitch-minimal/main/frontend/public/images/banner.png)

## 🚀 Overview

CodedSwitch is a revolutionary platform that combines AI-powered coding tools with music creation capabilities. It allows developers and musicians to collaborate, create, and innovate in ways never before possible.

## ✨ Key Features

### AI-Powered Tools
- **Code Translator** - Translate code between multiple programming languages
- **Lyric Analyzer** - Advanced analysis of lyrics including rhyme schemes, sentiment, and themes
- **Vulnerability Scanner** - Detect security issues in your codebase
- **AI Assistant** - Get coding help and answers to technical questions

### Music Creation Studio
- **Lyric Lab** - Generate creative song lyrics with AI
- **Beat Studio** - Create and edit musical beats
- **Music Studio** - Compose full songs with AI assistance
- **CodeBeat Studio** - Turn your code into music

### Collaboration Features
- **Real-time Collaboration** - Work together on music projects in real-time
- **Performance Monitoring** - Track system performance and optimize workflows
- **Advanced Analytics** - Deep insights into your creative process

### Professional Infrastructure
- **API Key Management** - Secure authentication with regular and God Mode keys
- **Subscription System** - Stripe integration for payments
- **Email System** - Professional email communications
- **Diagnostics** - System health monitoring
- **Performance Analytics** - Real-time performance tracking and optimization

## 🛠️ Tech Stack

### Frontend
- React 18 with Hooks
- Vite.js build system
- TailwindCSS for styling
- Tone.js for audio processing
- React Router for navigation
- Advanced audio engine with real-time processing
- Performance monitoring and analytics

### Backend
- Flask web framework
- Flask-CORS for cross-origin requests
- Docker containerization
- Grok AI API integration
- Redis for task queueing
- RQ (Redis Queue) for background tasks
- Flask-Mail for email system
- Stripe API for payments
- Advanced lyric analysis engine
- Performance monitoring and metrics collection

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 16+ (for local development)
- Python 3.10+
- Grok API key (for AI features)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/asume21/Codedswitch-minimal.git
   cd Codedswitch-minimal
   ```

2. **Set up environment variables:**
   ```bash
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   ```

3. **Update the environment variables** in both `.env` files:
   - Set `VITE_BACKEND_URL` in frontend/.env
   - Add your `GROK_API_KEY` in backend/.env
   - Configure `STRIPE_SECRET_KEY` if using payment features

4. **Start the application** using Docker Compose:
   ```bash
   docker-compose up --build
   ```

5. **Access the application** at:
   - 🌐 **Frontend:** http://localhost:3000
   - 🔌 **Backend API:** http://localhost:10000
   - 📊 **Redis:** localhost:6379

## 🌩️ Production Deployment

### Render.com Deployment

CodedSwitch is designed for seamless deployment on Render.com with three separate services:

#### 1. Frontend Service (Static Site)

- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  ```
  VITE_BACKEND_URL=https://your-backend-url.onrender.com
  VITE_API_URL=https://your-backend-url.onrender.com
  VITE_AI_URL=https://your-backend-url.onrender.com/api/ai
  ```

#### 2. Backend Service (Web Service)

- **Root Directory**: `.` (project root)
- **Docker File**: `backend/Dockerfile.backend`
- **Health Check Path**: `/api/health`
- **Environment Variables**:
  ```
  FLASK_ENV=production
  SECRET_KEY=your-secret-key
  GROK_API_KEY=your-grok-api-key
  DATABASE_URL=postgresql://user:password@host:port/database
  STRIPE_SECRET_KEY=your-stripe-secret-key
  STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
  MAIL_SERVER=your-smtp-server
  MAIL_PORT=587
  MAIL_USE_TLS=true
  MAIL_USERNAME=your-email@example.com
  MAIL_PASSWORD=your-email-password
  REDIS_URL=redis://redis:6379/0
  RQ_REDIS_URL=redis://redis:6379/0
  ```

#### 3. Worker Service (Background Tasks)

- **Root Directory**: `.` (project root)
- **Docker File**: `backend/Dockerfile.worker`
- **Environment Variables**: Same as backend service

## 📸 Screenshots

### Code Translator
![Code Translator](https://raw.githubusercontent.com/asume21/Codedswitch-minimal/main/frontend/public/images/screenshots/code-translator.png)

### Music Studio
![Music Studio](https://raw.githubusercontent.com/asume21/Codedswitch-minimal/main/frontend/public/images/screenshots/music-studio.png)

### Beat Studio
![Beat Studio](https://raw.githubusercontent.com/asume21/Codedswitch-minimal/main/frontend/public/images/screenshots/beat-studio.png)

## 📁 Project Structure

```
.
├── backend/                      # Backend API (Flask)
│   ├── assets/                   # Static assets
│   ├── Dockerfile.backend        # Backend service Dockerfile
│   ├── Dockerfile.worker         # Worker service Dockerfile
│   ├── requirements.txt          # Python dependencies
│   ├── templates/                # Email templates
│   └── web_backend.py           # Main Flask application
├── frontend/                    # Frontend (React/Vite)
│   ├── public/                   # Static public files
│   │   ├── images/              # App images
│   │   └── sounds/              # Audio files
│   ├── src/                      # React source code
│   │   ├── components/          # Reusable UI components
│   │   │   ├── CodeTranslator/  # Code translation component
│   │   │   ├── LyricLab/        # Lyric generation component
│   │   │   └── MusicStudio/     # Music creation component
│   │   ├── App.jsx              # Main application component
│   │   └── main.jsx             # Application entry point
│   ├── .env                      # Environment variables
│   ├── index.html               # HTML template
│   ├── package.json             # NPM dependencies
│   └── vite.config.js           # Vite configuration
├── docker-compose.yml          # Docker compose configuration
├── LICENSE                      # MIT License
└── README.md                    # This file
```

## 🔑 Environment Variables

### Backend Environment Variables

| Variable | Description |
| --- | --- |
| `FLASK_ENV` | Application environment (development, production) |
| `SECRET_KEY` | Secret key for session management |
| `GROK_API_KEY` | API key for Grok AI integration |
| `DATABASE_URL` | Database connection URL |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `MAIL_SERVER` | SMTP server for sending emails |
| `MAIL_PORT` | SMTP port |
| `MAIL_USE_TLS` | Whether to use TLS for email |
| `MAIL_USERNAME` | Email username |
| `MAIL_PASSWORD` | Email password |
| `REDIS_URL` | Redis connection URL |
| `RQ_REDIS_URL` | RQ Redis connection URL |

### Frontend Environment Variables

| Variable | Description |
| --- | --- |
| `VITE_BACKEND_URL` | Backend service URL |
| `VITE_API_URL` | API service URL |
| `VITE_AI_URL` | AI service URL |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe public key |

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📬 Contact

- **Email**: servicehelp@codedswitch.com
- **Website**: [www.codedswitch.com](https://www.codedswitch.com)
- **GitHub**: [@asume21](https://github.com/asume21)

---

<div align="center">

**Built with ❤️ by [Asume21](https://github.com/asume21)**

</div>
