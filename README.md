# 📂 IntelliDocX - Enterprise AI-Dynamic Document Ecosystem

![Banner](https://img.shields.io/badge/Status-Enterprise%20Grade-blueviolet?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20Python%20%7C%20Solidity-blue?style=for-the-badge)
![Security](https://img.shields.io/badge/Security-Blockchain%20Verified-green?style=for-the-badge)

**IntelliDocX** is a next-generation Document Management System (DMS) that transforms passive storage into active intelligence. By converging **Artificial Intelligence**, **Private Blockchain**, and **Automated Workflows**, IntelliDocX provides an immutable, smart, and highly efficient ecosystem for enterprise documents.

---

## ⚡ Key Core Pillars

### 🧠 1. AI-Powered Intelligence
*   **Auto-Classification:** Upload any document, and our Python-driven AI engine (FastAPI + NLP) automatically identifies if it's an **Invoice**, **Contract**, **HR Policy**, or **Legal Report**.
*   **Intelligent Extraction:** Automatically extracts key metadata (Dates, Amounts, Parties) to eliminate manual entry.
*   **Semantic Search:** Don't just search for keywords; search for *meanings*. Our vector-based search (Elasticsearch + Embeddings) understands context.
*   **Compliance Guard:** Real-time AI checks to ensure documents meet organizational standards before they are even stored.

### ⛓️ 2. Immutable Blockchain Notary
*   **Proof of Integrity:** Every document upload, version change, and approval is "anchored" to a private Ethereum (Ganache) blockchain.
*   **Tamper Detection:** Mathematical proof that a file hasn't been altered since its last notarization.
*   **Digital Signatures:** Secure, on-chain logging of user identities and document interactions for a flawless audit trail.

### 🌊 3. Dynamic Workflow Automation
*   **Zero-Touch Triggers:** Uploading a document automatically triggers a tailored approval pipeline based on its category.
*   **Multi-Step Approvals:** Seamless transition from **Employee → Manager → Admin** with real-time notifications.
*   **SLA & Escalation:** Active monitoring of approval times with automatic escalation to admins if deadlines are breached.
*   **Live Dashboard:** A premium, real-time visualization of all "Active Approvals" with interactive status tracking.

---

## 🏗️ Technical Architecture

IntelliDocX is built on a high-performance **Microservices-ready** architecture:

| Tier | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Framer Motion | Premium Responsive UI & Interactive Dashboards |
| **Backend** | Node.js, Express, Prisma ORM | API Gateway, RBAC, and Business Logic Orchestration |
| **AI Engine** | Python, FastAPI, PyTorch | OCR, Categorization, and Vector Search |
| **Ledger** | Solidity, Hardhat, Ganache | Immutable Evidence & Audit Recording |
| **Storage** | MinIO (S3 Compatible) | Secure Object Storage with Versioning |
| **Cache/Queue** | Redis, BullMQ | High-speed Caching & Background Processing |
| **Database** | PostgreSQL | Relational Data Management |

---

## 🚀 Deployment & Setup

### 🐳 The Dockerized Way (Recommended)
The entire ecosystem is containerized for instant deployment.

1.  **Clone & Configure:**
    ```bash
    git clone https://github.com/sanjaykumar258/IntelliDocX.git
    cd IntelliDocX
    cp .env.example .env
    ```
2.  **Spin Up Infrastructure:**
    ```bash
    docker-compose up -d
    ```
3.  **Prepare Database:**
    ```bash
    cd backend
    npx prisma migrate dev
    npx prisma db seed
    ```

### 🛠️ Manual Development Setup
If you prefer running services individually:
*   **Backend:** `cd backend && npm run dev` (Port 5000)
*   **Frontend:** `cd frontend && npm run dev` (Port 5173)
*   **AI Service:** `cd ai-service && uvicorn app.main:app --reload` (Port 8000)

---

## 👤 User Roles & Access
*   **Admin:** Complete control over organization, users, and global workflow templates.
*   **Manager:** Can manage document categories, approve/reject workflows, and view department stats.
*   **User:** Securely upload documents, track their own workflows, and interact with the IntelliBot.

---

## 🤖 IntelliBot Chat
Integrated directly into the dashboard, **IntelliBot** is your personal AI assistant. It can:
- Summarize long documents in seconds.
- Find specific clauses in contracts.
- Check the status of your pending approvals using natural language.

---

## 🛡️ Security & Compliance
- **JWT Auth:** Secure session management with refresh token rotation.
- **Helmet.js:** Enterprise-standard security headers.
- **Rate Limiting:** Protection against brute-force and DDoS attacks.
- **RBAC Middleware:** Strict enforcement of role-based permissions at the API level.

---

*IntelliDocX is more than a DMS—it's the backbone of your digital trust and automated intelligence.*
