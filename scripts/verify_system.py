"""
Script de verificación del sistema Anclora RAG.
Valida que todos los componentes estén correctamente configurados.
"""
import sys
import os
from pathlib import Path
from datetime import datetime

# Agregar raíz del proyecto al path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Colores para terminal
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def print_header(text):
    """Imprime un encabezado decorado."""
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'=' * 60}{Colors.RESET}")
    print(f"{Colors.CYAN}{Colors.BOLD}{text}{Colors.RESET}")
    print(f"{Colors.CYAN}{Colors.BOLD}{'=' * 60}{Colors.RESET}\n")


def print_check(name, passed, details=""):
    """Imprime resultado de una verificación."""
    symbol = f"{Colors.GREEN}✅" if passed else f"{Colors.RED}❌"
    status = f"{Colors.GREEN}OK" if passed else f"{Colors.RED}FAIL"
    print(f"{symbol} {name:.<50} [{status}{Colors.RESET}]")
    if details and not passed:
        print(f"   {Colors.YELLOW}↳ {details}{Colors.RESET}")


def check_environment_variables():
    """Verifica variables de entorno requeridas."""
    print_header("1. VARIABLES DE ENTORNO")
    
    required_vars = {
        "DATABASE_URL": "PostgreSQL connection string",
        "QDRANT_URL": "Qdrant server URL",
        "REDIS_URL": "Redis server URL"
    }
    
    all_ok = True
    for var, description in required_vars.items():
        value = os.getenv(var)
        passed = value is not None and value != ""
        all_ok = all_ok and passed
        print_check(f"{var} ({description})", passed, 
                   "Variable no encontrada en .env" if not passed else "")
    
    return all_ok


def check_database_connection():
    """Verifica conexión a PostgreSQL."""
    print_header("2. BASE DE DATOS POSTGRESQL")
    
    try:
        from apps.api.database.postgres_client import get_db_session, init_db_engine
        
        # Inicializar motor
        init_db_engine()
        print_check("Motor de base de datos inicializado", True)
        
        # Probar conexión
        session = get_db_session()
        from sqlalchemy import text
        result = session.execute(text("SELECT version();"))
        version = result.fetchone()[0]
        session.close()
        
        print_check("Conexión a PostgreSQL", True)
        print(f"   {Colors.CYAN}↳ Versión: {version.split()[0]} {version.split()[1]}{Colors.RESET}")
        return True
        
    except Exception as e:
        print_check("Conexión a PostgreSQL", False, str(e))
        return False


def check_database_tables():
    """Verifica que las tablas necesarias existan."""
    print_header("3. TABLAS DE BASE DE DATOS")
    
    try:
        from apps.api.database.postgres_client import get_db_session
        from sqlalchemy import text
        
        session = get_db_session()
        
        # Verificar tabla ingestion_batches
        result = session.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'ingestion_batches'
            );
        """))
        batches_exists = result.fetchone()[0]
        print_check("Tabla 'ingestion_batches'", batches_exists,
                   "Ejecuta: python apps/api/database/init_db.py")
        
        # Verificar tabla batch_documents
        result = session.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'batch_documents'
            );
        """))
        documents_exists = result.fetchone()[0]
        print_check("Tabla 'batch_documents'", documents_exists,
                   "Ejecuta: python apps/api/database/init_db.py")
        
        session.close()
        return batches_exists and documents_exists
        
    except Exception as e:
        print_check("Verificación de tablas", False, str(e))
        return False


def check_qdrant_connection():
    """Verifica conexión a Qdrant."""
    print_header("4. QDRANT VECTOR DATABASE")
    
    try:
        from qdrant_client import QdrantClient
        
        qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        client = QdrantClient(url=qdrant_url)
        
        # Obtener info del cluster
        info = client.get_collections()
        print_check("Conexión a Qdrant", True)
        print(f"   {Colors.CYAN}↳ Colecciones existentes: {len(info.collections)}{Colors.RESET}")
        
        return True
        
    except Exception as e:
        print_check("Conexión a Qdrant", False, str(e))
        print(f"   {Colors.YELLOW}↳ Asegúrate de que Qdrant esté corriendo (docker compose up qdrant){Colors.RESET}")
        return False


def check_redis_connection():
    """Verifica conexión a Redis."""
    print_header("5. REDIS QUEUE")
    
    try:
        from redis import Redis
        
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        redis_conn = Redis.from_url(redis_url)
        
        # Ping Redis
        redis_conn.ping()
        print_check("Conexión a Redis", True)
        
        # Info de Redis
        info = redis_conn.info()
        print(f"   {Colors.CYAN}↳ Versión: {info['redis_version']}{Colors.RESET}")
        print(f"   {Colors.CYAN}↳ Uptime: {info['uptime_in_days']} días{Colors.RESET}")
        
        return True
        
    except Exception as e:
        print_check("Conexión a Redis", False, str(e))
        print(f"   {Colors.YELLOW}↳ Asegúrate de que Redis esté corriendo (docker compose up redis){Colors.RESET}")
        return False


def check_embedding_model():
    """Verifica disponibilidad del modelo de embeddings."""
    print_header("6. MODELO DE EMBEDDINGS")
    
    try:
        from llama_index.embeddings.huggingface import HuggingFaceEmbedding
        
        print(f"   {Colors.CYAN}⏳ Cargando modelo nomic-embed-text-v1.5 (puede tardar en primera ejecución)...{Colors.RESET}")
        
        model = HuggingFaceEmbedding(
            model_name="nomic-ai/nomic-embed-text-v1.5",
            cache_folder="./models"
        )
        
        # Probar embedding
        test_embedding = model.get_text_embedding("test")
        
        print_check("Modelo de embeddings cargado", True)
        print(f"   {Colors.CYAN}↳ Dimensiones: {len(test_embedding)}{Colors.RESET}")
        print(f"   {Colors.CYAN}↳ Modelo: nomic-ai/nomic-embed-text-v1.5{Colors.RESET}")
        
        return True
        
    except Exception as e:
        print_check("Modelo de embeddings", False, str(e))
        return False


def check_project_structure():
    """Verifica estructura de archivos del proyecto."""
    print_header("7. ESTRUCTURA DEL PROYECTO")
    
    required_paths = [
        "apps/api/main.py",
        "apps/api/database/postgres_client.py",
        "apps/api/database/batch_manager.py",
        "apps/api/database/init_db.py",
        "apps/api/models/batch.py",
        "apps/api/models/document.py",
        "apps/api/workers/ingestion_worker.py",
        "apps/api/start_worker.py",
        "apps/api/rag/pipeline.py",
        "packages/parsers/pdf.py",
        "packages/parsers/docx_parser.py",
        "infra/docker/docker-compose.dev.yml",
        "scripts/verify_system.py"
    ]
    
    all_ok = True
    for path in required_paths:
        exists = Path(path).exists()
        all_ok = all_ok and exists
        if not exists:
            print_check(path, False, "Archivo no encontrado")
    
    if all_ok:
        print_check("Estructura del proyecto", True)
        print(f"   {Colors.CYAN}↳ Todos los archivos requeridos presentes{Colors.RESET}")
    
    return all_ok


def main():
    """Ejecuta todas las verificaciones."""
    print(f"\n{Colors.BOLD}{Colors.CYAN}")
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║       VERIFICACIÓN DEL SISTEMA ANCLORA RAG               ║")
    print("╚═══════════════════════════════════════════════════════════╝")
    print(Colors.RESET)
    print(f"Ejecutado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Ejecutar verificaciones
    checks = [
        ("Variables de entorno", check_environment_variables),
        ("Conexión PostgreSQL", check_database_connection),
        ("Tablas de base de datos", check_database_tables),
        ("Conexión Qdrant", check_qdrant_connection),
        ("Conexión Redis", check_redis_connection),
        ("Modelo de embeddings", check_embedding_model),
        ("Estructura del proyecto", check_project_structure)
    ]
    
    results = {}
    for name, check_func in checks:
        try:
            results[name] = check_func()
        except Exception as e:
            results[name] = False
            print(f"{Colors.RED}Error inesperado en '{name}': {e}{Colors.RESET}")
    
    # Resumen
    print_header("RESUMEN")
    
    passed = sum(results.values())
    total = len(results)
    
    print(f"Verificaciones pasadas: {Colors.GREEN if passed == total else Colors.YELLOW}{passed}/{total}{Colors.RESET}")
    
    if passed == total:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ¡SISTEMA LISTO! Todos los componentes funcionando correctamente.{Colors.RESET}")
        print(f"\n{Colors.CYAN}Puedes iniciar los servicios con:{Colors.RESET}")
        print(f"   {Colors.BOLD}docker compose -f infra/docker/docker-compose.dev.yml up -d{Colors.RESET}")
        return 0
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}⚠️  SISTEMA INCOMPLETO. Revisa los errores anteriores.{Colors.RESET}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
