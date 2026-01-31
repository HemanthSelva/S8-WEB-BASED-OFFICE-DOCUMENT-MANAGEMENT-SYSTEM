# IntelliDocX Demo Walkthrough

This guide provides a step-by-step walkthrough for demonstrating the key capabilities of IntelliDocX.

## Prerequisites

1. Ensure all services are running: `docker-compose up -d`
2. Run demo seed: `cd backend && npm run seed:demo`
3. Open browser: `http://localhost`

## Demo Script

### 1. Admin Dashboard & Login
- **Action**: Login with `admin@acme.com` / `password123`.
- **Talk Track**: "We start by logging in as an Admin. The system supports Role-Based Access Control (RBAC) ensuring only authorized users access sensitive data."
- **Visual**: Show the Admin Dashboard with high-level analytics (Documents, Users, Workflow Health).

### 2. Intelligent Document Upload
- **Action**: Navigate to "Documents" -> Click "Upload".
- **Action**: Upload a sample PDF (e.g., an Invoice or Contract).
- **Talk Track**: "When a document is uploaded, our AI engine immediately processes it. It performs OCR to extract text and uses NLP to classify the document type automatically."
- **Visual**: Show the document appearing in the list with status "Processing" -> "Active".

### 3. AI Classification & Search
- **Action**: Click on the uploaded document to view details.
- **Visual**: Highlight the "Metadata" section showing auto-tags (e.g., "Finance", "Invoice").
- **Action**: Use the Search Bar to search for a keyword *inside* the document content (not just the title).
- **Talk Track**: "Users don't need to manually tag files. Our vector-based semantic search allows finding documents by concept, not just exact keywords."

### 4. Workflow Automation
- **Action**: Navigate to "Workflows".
- **Action**: Start a "Standard Approval Process" for the uploaded document.
- **Talk Track**: "We can initiate automated approval chains. Here, we start a multi-step review process defined in our templates."
- **Visual**: Show the workflow instance status as "PENDING - Step 1: Manager Review".

### 5. Manager Approval
- **Action**: Logout and Login as `manager1@acme.com` / `password123`.
- **Action**: See the "Pending Action" in the Dashboard or Notifications.
- **Action**: Approve the document.
- **Talk Track**: "The manager is notified immediately. They can review and approve with a single click. The system tracks SLAB breaches if they take too long."

### 6. Blockchain Verification
- **Action**: Login back as Admin.
- **Action**: Go to the Document Details page -> Click "Verify Integrity".
- **Visual**: Show the popup: "Document Hash Matches Blockchain Record [0x123...]".
- **Talk Track**: "Crucially, every version is hashed and stored on a private Ethereum blockchain. This guarantees that the document has not been tampered with since upload."

### 7. Real-Time Analytics
- **Action**: Go to "Dashboard" -> "Analytics".
- **Visual**: Show charts for "Upload Trends", "User Activity", and "Workflow Efficiency".
- **Talk Track**: "Executives get a real-time pulse of the organization's document lifecycle."

## Q&A Prompts
- "How does the AI handle handwritten text?" (Answer: Tesseract OCR engine)
- "Is the blockchain public?" (Answer: No, it's a private permissioned network for enterprise privacy)
