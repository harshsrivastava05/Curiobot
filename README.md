# Curiobot

Curiobot is an AI-powered study assistant that transforms PDF documents into interactive learning experiences. It generates dynamic mind maps, extracts key topics, and provides an intelligent Q&A chat interface to help students understand complex material faster.

## Features

- **Interactive Mind Maps**: Visualizes concepts from your PDFs in a hierarchical tree structure using React Flow.
- **AI-Powered Q&A**: Chat with your documents. The system uses RAG (Retrieval-Augmented Generation) to provide accurate answers based *only* on the specific document's content.
- **Topic Extraction**: Automatically identifies and explains key topics.
- **Parallel Processing**: Optimized backend processes large PDFs quickly by running analysis and vector embedding tasks concurrently.

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Visualization**: React Flow (for Mind Maps)
- **State Management**: React Hooks

### Backend
- **Framework**: FastAPI (Python)
- **LLM**: Google Gemini (Flash 2.0 & Pro)
- **Vector DB**: Pinecone
- **Storage**: Google Cloud Storage (GCS)
- **Caching/Progress**: Redis
- **Orchestration**: LangGraph (for analysis workflows)

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.10+
- Docker (optional, for containerization)
- Google Cloud Service Account (for GCS)
- Pinecone API Key
- Gemini API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv myenv
   source myenv/bin/activate  # Windows: myenv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file with your credentials (see `.env.example` if available).
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Containerization

### Backend
```bash
cd backend
docker build -t curiobot-backend .
docker run -p 8000:8000 --env-file .env curiobot-backend
```

### Frontend
```bash
cd frontend
docker build -t curiobot-frontend .
docker run -p 3000:3000 curiobot-frontend
```
