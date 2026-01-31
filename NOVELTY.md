# Project Novelty & Innovation

IntelliDocX stands out from standard CRUD applications by integrating two cutting-edge technologies—**Generative AI** and **Blockchain**—to solve real-world enterprise problems.

## 1. The "Trustless" Document System (Blockchain)
Most DMS platforms rely on "Trust me, I'm the database admin." IntelliDocX adopts a "Don't trust, verify" approach.
- **Novelty**: By anchoring document hashes to a blockchain, we provide mathematical proof of integrity. This is critical for legal and compliance use cases where "bit-rot" or malicious alteration is a risk.
- **Implementation**: We run a private Ganache network where a Solidity Smart Contract acts as the "Notary Public."

## 2. From Search to "Find" (Vector AI)
Standard SQL `LIKE %query%` search fails when users don't know the exact keyword.
- **Novelty**: We implement **Semantic Search**. A query for "billing issue" will return documents containing "invoice dispute" because the AI understands they are semantically related.
- **Implementation**: We use a Python microservice to generate vector embeddings (using `all-MiniLM-L6-v2`) and store them in Elasticsearch for cosine-similarity retrieval.

## 3. Hybrid Microservices Architecture
Instead of a monolithic Node.js app, we separate concerns:
- **Node.js**: High I/O, API Gateway, Real-time WebSockets.
- **Python**: Heavy compute (AI/ML processing).
- **Solidity**: Decentralized logic.
This demonstrates an advanced understanding of choosing the "right tool for the job."
