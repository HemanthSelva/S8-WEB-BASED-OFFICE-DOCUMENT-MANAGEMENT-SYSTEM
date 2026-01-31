# Key Features

## 🧠 Artificial Intelligence
- **OCR (Optical Character Recognition)**: Extracts text from scanned PDFs and images.
- **Auto-Classification**: Uses NLP to determine if a document is an Invoice, Contract, Report, etc.
- **Semantic Search**: Vector-based search (Elasticsearch + embeddings) finds documents by *meaning*, not just keywords.

## ⛓️ Blockchain Security
- **Immutable Ledger**: Every document upload and version change is recorded on a private Ethereum blockchain.
- **Tamper Detection**: Cryptographic hashing ensures that any unauthorized change to a file is immediately detectable.
- **Audit Trail**: A transparent, unalterable history of who uploaded what and when.

## ⚡ Workflow Automation
- **Visual Template Builder**: Define multi-step approval chains (e.g., Employee -> Manager -> Admin).
- **SLA Monitoring**: Track bottlenecks and auto-escalate overdue tasks.
- **Role-Based Routing**: Tasks are assigned dynamically based on user roles.

## 📊 Analytics & Insights
- **Real-Time Dashboard**: Visualize storage usage, user activity, and workflow velocity.
- **Deep Querying**: Analyze document trends across departments.

## 🛡️ Enterprise Grade
- **RBAC**: Granular permissions (Admin, Manager, Viewer).
- **Security**: JWT Authentication, Refresh Token Rotation, Rate Limiting, Helmet Security Headers.
- **Scalability**: Dockerized microservices architecture with Redis caching.
