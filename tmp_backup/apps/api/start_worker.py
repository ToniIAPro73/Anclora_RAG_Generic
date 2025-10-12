"""
Script para iniciar workers RQ.
Lanza workers que procesan tareas de la cola de Redis.
"""
import os
import sys
from pathlib import Path
from redis import Redis
from rq import Worker, Queue
from dotenv import load_dotenv

# Agregar raíz del proyecto al path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Cargar variables de entorno
load_dotenv()


def start_worker():
    """
    Inicia un worker RQ que escucha la cola 'ingestion_queue'.
    """
    # Conectar a Redis
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_conn = Redis.from_url(redis_url)
    
    # Crear cola
    queue = Queue("ingestion_queue", connection=redis_conn)
    
    print("=" * 60)
    print("🚀 WORKER DE INGESTA - ANCLORA RAG")
    print("=" * 60)
    print(f"📡 Conectado a Redis: {redis_url}")
    print(f"📋 Escuchando cola: ingestion_queue")
    print(f"⏳ Esperando tareas...")
    print("=" * 60)
    
    # Iniciar worker
    worker = Worker([queue], connection=redis_conn)
    worker.work(with_scheduler=True)


if __name__ == "__main__":
    start_worker()
