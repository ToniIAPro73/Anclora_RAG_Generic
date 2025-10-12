# Anclora RAG Generic - Port Configuration

| Service    | Port  | Description                    |
|------------|-------|--------------------------------|
| Frontend   | 3030  | Web UI (Streamlit/React)       |
| Backend    | 8030  | FastAPI REST API               |
| PostgreSQL | 5462  | Database (metadata, batches)   |
| Qdrant     | 6363  | Vector database                |
| Redis      | 6389  | Task queue                     |
| Ollama     | 11464 | Local LLM inference            |

## Development Setup

To run the services locally:

- **Frontend**: <http://localhost:3030>
- **Backend API**: <http://localhost:8030>
- **API Docs**: <http://localhost:8030/docs>
- **Qdrant Dashboard**: <http://localhost:6363/dashboard>
- **PostgreSQL**: `localhost:5462`
- **Redis**: `localhost:6389`
- **Ollama**: <http://localhost:11464>

## Multi-Project Context

This port configuration avoids conflicts with:
- **Anclora Flow**: Frontend 3020, Backend 8020, Database 5452
- **Anclora Kairon**: (specify ports if active)

## Connection Examples

```bash
# PostgreSQL
psql -h localhost -p 5462 -U anclora_user -d anclora_rag

# Redis CLI
redis-cli -p 6389

# Test API
curl http://localhost:8030/health

# Qdrant collections
curl http://localhost:6363/collections
```
