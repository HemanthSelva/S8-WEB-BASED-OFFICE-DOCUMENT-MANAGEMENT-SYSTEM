# IntelliDocX - Enterprise SaaS Document Management System

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Tech](https://img.shields.io/badge/Tech-React%20%7C%20Node%20%7C%20Python%20%7C%20Solidity-blue)

IntelliDocX is an AI-powered, blockchain-secured, cloud-native Document Management System designed for enterprise scale. It leverages modern web technologies to provide secure, intelligent, and real-time document handling capabilities.

## 📚 Documentation
- [**Project Summary**](PROJECT_SUMMARY.md) - High-level overview.
- [**Key Features**](FEATURES.md) - Detailed capabilities.
- [**Novelty & Innovation**](NOVELTY.md) - AI & Blockchain integration.
- [**Demo Walkthrough**](DEMO.md) - Step-by-step guide to running the system.

## 🏗️ Architecture

The project follows a **Microservices-ready Monorepo** architecture:

- **Frontend**: React + TypeScript + Vite + ShadCN UI (SPA)
- **Backend**: Node.js + Express + TypeScript (API Gateway & Business Logic)
- **AI Service**: Python FastAPI (OCR, Semantic Search, Recommendations)
- **Blockchain**: Private Ethereum Network (Ganache) + Solidity (Document Integrity)
- **Database**: PostgreSQL (Relational Data), Redis (Caching), Elasticsearch (Search Index)
- **Storage**: MinIO / S3 (Object Storage)
- **Infrastructure**: Docker Compose, Nginx

### Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React, Redux Toolkit, Tailwind | Responsive SPA UI |
| **Backend** | Node.js, Express, Prisma | API & Business Logic |
| **AI Engine** | Python, PyTorch, Transformers | OCR & Vector Embeddings |
| **Blockchain** | Solidity, Hardhat, Ganache | Immutable Audit Trail |
| **Database** | PostgreSQL | Structured Data |
| **Search** | Elasticsearch | Semantic & Text Search |
| **Cache** | Redis | API Response Caching |
| **DevOps** | Docker, Nginx, GitHub Actions | Containerization & CI/CD |

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Docker & Docker Compose

### Quick Start (Development)

1. **Install Dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   cd ../ai-service && pip install -r requirements.txt
   ```

2. **Start Infrastructure**
   ```bash
   docker-compose up -d
   ```

3. **Deploy Smart Contracts**
   ```bash
   cd blockchain
   npm install
   npx hardhat run scripts/deploy.js --network ganache
   # Update CONTRACT_ADDRESS in backend/.env
   ```

4. **Seed Demo Data**
   ```bash
   cd backend
   npm run seed:demo
   ```

5. **Run Servers**
   - Backend: `npm run dev` (Port 5000)
   - Frontend: `npm run dev` (Port 5173)
   - AI Service: `uvicorn main:app --reload` (Port 8000)

### Production Deployment
See `DEMO.md` for full production setup using `docker-compose.prod.yml`.

## 🧪 Testing & CI/CD

- **Backend Tests**: `cd backend && npm test`
- **Load Tests**: `k6 run backend/tests/load/k6-script.js`
- **Pipeline**: Automated via GitHub Actions (Tests, Lint, Build).

## 🛡️ Security Features
- **Authentication**: JWT with Refresh Token Rotation.
- **RBAC**: Role-based access control middleware.
- **Encryption**: At-rest (MinIO) and In-transit (TLS).
- **Hardening**: Helmet headers, Rate limiting, Input sanitization.

---
*Built by Hemanth Selva for Final Year Project Submission.*
