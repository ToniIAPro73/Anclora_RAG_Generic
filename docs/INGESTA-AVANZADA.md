# Sistema de Ingesta Avanzada - Especificación Técnica

## 1. Visión General

### 1.1 Objetivo

Implementar un sistema robusto de ingesta multi-formato que permita procesar documentos heterogéneos, repositorios de código y fuentes estructuradas mediante un pipeline escalable de procesamiento asíncrono.

### 1.2 Capacidades Principales

- **Ingesta por Lotes**: Agrupación lógica de documentos relacionados
- **Multi-Formato**: Soporte para 15+ tipos de archivo
- **Procesamiento Asíncrono**: Colas distribuidas con RQ/Redis
- **Parseo Avanzado**: unstructured.io + tree-sitter + parsers especializados
- **Chunking Inteligente**: Fragmentación semántica con LlamaIndex
- **Deduplicación**: Detección de contenido duplicado con SimHash
- **Metadata Enriquecida**: Extracción automática de metadatos contextuales

### 1.3 Arquitectura de Alto Nivel

```text
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │
│  │ Drag&Drop│  │ GitHub   │  │ Structured     │   │
│  │ Uploader │  │ Importer │  │ Source Parser  │   │
│  └─────┬────┘  └─────┬────┘  └────────┬───────┘   │
└────────┼─────────────┼─────────────────┼───────────┘
         │             │                 │
         └─────────────┴─────────────────┘
                       │
         ┌─────────────▼─────────────┐
         │   API Gateway (FastAPI)   │
         │  ┌────────────────────┐   │
         │  │ Batch Manager      │   │
         │  │ File Validator     │   │
         │  │ Job Orchestrator   │   │
         │  └──────────┬─────────┘   │
         └─────────────┼─────────────┘
                       │
         ┌─────────────▼─────────────┐
         │      Redis Queue          │
         │  ┌──────────────────┐     │
         │  │ ingestion_queue  │     │
         │  │ enrichment_queue │     │
         │  │ embedding_queue  │     │
         │  └──────────────────┘     │
         └─────────────┬─────────────┘
                       │
         ┌─────────────▼─────────────┐
         │    Worker Pool (RQ)       │
         │  ┌──────────────────┐     │
         │  │ Parser Workers   │     │
         │  │ Chunker Workers  │     │
         │  │ Embedding Workers│     │
         │  └──────────┬───────┘     │
         └─────────────┼─────────────┘
                       │
         ┌─────────────▼─────────────┐
         │     Storage Layer         │
         │  ┌─────────┐  ┌────────┐  │
         │  │ Qdrant  │  │Supabase│  │
         │  │(Vectors)│  │ (Meta) │  │
         │  └─────────┘  └────────┘  │
         └───────────────────────────┘
```

---

## 2. Componentes del Sistema

### 2.1 Batch Manager

**Responsabilidades:**

- Crear y gestionar lotes de ingesta
- Validar tamaño total del lote
- Asignar identificadores únicos
- Trackear progreso de procesamiento
- Gestionar ciclo de vida (pending → processing → completed/failed)

**Implementación:**

```python
from dataclasses import dataclass
from uuid import UUID, uuid4
from enum import Enum
from datetime import datetime

class BatchStatus(str, Enum):
    PENDING = "pending"
    VALIDATING = "validating"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"  # Algunos archivos fallaron

@dataclass
class IngestionBatch:
    id: UUID
    user_id: UUID
    name: str
    description: str | None
    status: BatchStatus
    total_files: int
    processed_files: int
    failed_files: int
    total_size_bytes: int
    qdrant_collection: str
    created_at: datetime
    completed_at: datetime | None
    error_summary: dict | None

class BatchManager:
    def __init__(self, db: SupabaseClient, redis: Redis):
        self.db = db
        self.redis = redis
    
    async def create_batch(
        self, 
        user_id: UUID, 
        name: str,
        collection_name: str,
        description: str | None = None
    ) -> UUID:
        """
        Crea un nuevo lote de ingesta.
        
        Returns:
            UUID del lote creado
        """
        batch_id = uuid4()
        
        await self.db.table("ingestion_batches").insert({
            "id": str(batch_id),
            "user_id": str(user_id),
            "name": name,
            "description": description,
            "status": BatchStatus.PENDING,
            "qdrant_collection": collection_name,
            "total_files": 0,
            "processed_files": 0,
            "failed_files": 0,
            "total_size_bytes": 0
        }).execute()
        
        return batch_id
    
    async def add_files_to_batch(
        self,
        batch_id: UUID,
        files: list[UploadFile]
    ) -> list[UUID]:
        """
        Añade archivos a un lote existente.
        
        Returns:
            Lista de UUIDs de documentos creados
        """
        doc_ids = []
        total_size = 0
        
        for file in files:
            doc_id = uuid4()
            file_size = await self._get_file_size(file)
            total_size += file_size
            
            # Guardar metadata del documento
            await self.db.table("batch_documents").insert({
                "id": str(doc_id),
                "batch_id": str(batch_id),
                "filename": file.filename,
                "source_type": "file_upload",
                "file_size": file_size,
                "mime_type": file.content_type,
                "status": "pending"
            }).execute()
            
            doc_ids.append(doc_id)
        
        # Actualizar contador del batch
        await self.db.table("ingestion_batches").update({
            "total_files": len(files),
            "total_size_bytes": total_size
        }).eq("id", str(batch_id)).execute()
        
        return doc_ids
    
    async def update_progress(
        self,
        batch_id: UUID,
        doc_id: UUID,
        status: str,
        error: str | None = None
    ):
        """
        Actualiza el progreso de procesamiento de un documento.
        """
        # Actualizar documento
        update_data = {"status": status, "processed_at": datetime.utcnow()}
        if error:
            update_data["error_message"] = error
        
        await self.db.table("batch_documents").update(
            update_data
        ).eq("id", str(doc_id)).execute()
        
        # Actualizar contadores del batch
        batch = await self._get_batch(batch_id)
        
        if status == "completed":
            batch.processed_files += 1
        elif status == "failed":
            batch.failed_files += 1
        
        # Determinar estado del batch
        new_status = BatchStatus.PROCESSING
        if batch.processed_files + batch.failed_files == batch.total_files:
            if batch.failed_files == 0:
                new_status = BatchStatus.COMPLETED
            elif batch.processed_files == 0:
                new_status = BatchStatus.FAILED
            else:
                new_status = BatchStatus.PARTIAL
        
        await self.db.table("ingestion_batches").update({
            "processed_files": batch.processed_files,
            "failed_files": batch.failed_files,
            "status": new_status,
            "completed_at": datetime.utcnow() if new_status in [
                BatchStatus.COMPLETED, 
                BatchStatus.FAILED, 
                BatchStatus.PARTIAL
            ] else None
        }).eq("id", str(batch_id)).execute()
```

---

### 2.2 File Validator

**Criterios de Validación:**

1. Extensión en lista permitida
2. Tamaño individual < MAX_FILE_SIZE
3. Tamaño total del batch < MAX_BATCH_SIZE
4. MIME type coincide con extensión
5. No está corrupto (magic bytes)

**Implementación:**

```python
import magic
from pathlib import Path
from typing import Literal

class ValidationError(Exception):
    pass

class FileValidator:
    ALLOWED_EXTENSIONS = {
        # Documentos
        ".pdf", ".docx", ".doc", ".odt", ".rtf",
        ".txt", ".md", ".html", ".htm", ".epub",
        
        # Código
        ".py", ".js", ".ts", ".jsx", ".tsx",
        ".java", ".cpp", ".c", ".h", ".rs",
        ".go", ".rb", ".php", ".swift", ".kt",
        
        # Datos
        ".json", ".yaml", ".yml", ".xml", ".csv",
        ".sql", ".jsonl",
        
        # Comprimidos
        ".zip", ".tar", ".gz", ".7z", ".rar"
    }
    
    MIME_MAPPING = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".zip": "application/zip",
        ".json": "application/json",
        # ... más mappings
    }
    
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    MAX_BATCH_SIZE = 500 * 1024 * 1024  # 500MB
    
    def __init__(self):
        self.mime_detector = magic.Magic(mime=True)
    
    def validate_file(
        self, 
        file: UploadFile,
        check_content: bool = True
    ) -> tuple[bool, str | None]:
        """
        Valida un archivo individual.
        
        Args:
            file: Archivo a validar
            check_content: Si verificar contenido (más lento)
        
        Returns:
            (is_valid, error_message)
        """
        filename = Path(file.filename)
        
        # 1. Validar extensión
        if filename.suffix.lower() not in self.ALLOWED_EXTENSIONS:
            return False, f"Extensión no permitida: {filename.suffix}"
        
        # 2. Validar tamaño
        file.file.seek(0, 2)  # Ir al final
        size = file.file.tell()
        file.file.seek(0)  # Volver al inicio
        
        if size > self.MAX_FILE_SIZE:
            return False, f"Archivo demasiado grande: {size/1024/1024:.1f}MB"
        
        if size == 0:
            return False, "Archivo vacío"
        
        # 3. Validar MIME type
        if check_content:
            content_sample = file.file.read(8192)
            file.file.seek(0)
            
            detected_mime = self.mime_detector.from_buffer(content_sample)
            expected_mime = self.MIME_MAPPING.get(filename.suffix.lower())
            
            if expected_mime and detected_mime != expected_mime:
                # Permitir algunos tipos genéricos
                if detected_mime not in ["text/plain", "application/octet-stream"]:
                    return False, f"MIME type no coincide: esperado {expected_mime}, detectado {detected_mime}"
        
        return True, None
    
    def validate_batch(
        self, 
        files: list[UploadFile]
    ) -> tuple[bool, list[dict]]:
        """
        Valida un lote completo de archivos.
        
        Returns:
            (all_valid, validation_results)
        """
        results = []
        total_size = 0
        
        for file in files:
            is_valid, error = self.validate_file(file)
            
            file.file.seek(0, 2)
            size = file.file.tell()
            file.file.seek(0)
            total_size += size
            
            results.append({
                "filename": file.filename,
                "is_valid": is_valid,
                "error": error,
                "size": size
            })
        
        # Validar tamaño total
        if total_size > self.MAX_BATCH_SIZE:
            return False, [{
                "filename": "BATCH",
                "is_valid": False,
                "error": f"Tamaño total excede límite: {total_size/1024/1024:.1f}MB > {self.MAX_BATCH_SIZE/1024/1024:.1f}MB"
            }]
        
        all_valid = all(r["is_valid"] for r in results)
        return all_valid, results
```

---

### 2.3 Document Parser

**Estrategia de Parseo:**

```text
Document → Parser Router → Specialized Parser → Structured Output
```

**Implementación Base:**

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

@dataclass
class ParsedDocument:
    """Salida estandarizada del parseo"""
    text: str
    metadata: dict[str, Any]
    chunks: list[str] | None = None
    tables: list[dict] | None = None
    images: list[dict] | None = None
    code_blocks: list[dict] | None = None

class BaseParser(ABC):
    """Parser base para todos los tipos de documento"""
    
    @abstractmethod
    async def parse(self, file_path: Path) -> ParsedDocument:
        """Parsear documento y retornar estructura estandarizada"""
        pass
    
    @abstractmethod
    def can_parse(self, file_path: Path) -> bool:
        """Determinar si este parser puede procesar el archivo"""
        pass

class ParserRouter:
    """Enruta archivos al parser apropiado"""
    
    def __init__(self):
        self.parsers: list[BaseParser] = [
            PDFParser(),
            DOCXParser(),
            MarkdownParser(),
            CodeParser(),
            CompressedFileParser(),
            StructuredDataParser(),
            GitHubRepoParser()
        ]
    
    async def parse(self, file_path: Path) -> ParsedDocument:
        """
        Encuentra el parser apropiado y procesa el archivo.
        """
        for parser in self.parsers:
            if parser.can_parse(file_path):
                return await parser.parse(file_path)
        
        raise ValueError(f"No parser disponible para: {file_path.suffix}")
```

#### 2.3.1 PDF Parser

```python
from unstructured.partition.pdf import partition_pdf
import pdfplumber
from PIL import Image

class PDFParser(BaseParser):
    def can_parse(self, file_path: Path) -> bool:
        return file_path.suffix.lower() == ".pdf"
    
    async def parse(self, file_path: Path) -> ParsedDocument:
        """
        Parsea PDF con estrategia híbrida:
        1. unstructured.io para texto y layout
        2. pdfplumber para tablas
        3. OCR con Tesseract si no hay texto
        """
        # Parseo principal con unstructured
        elements = partition_pdf(
            filename=str(file_path),
            strategy="hi_res",  # Alta resolución para mejor OCR
            extract_images_in_pdf=True,
            infer_table_structure=True
        )
        
        # Extraer texto estructurado
        text_parts = []
        tables = []
        metadata = {
            "source": str(file_path),
            "file_type": "pdf",
            "total_pages": 0
        }
        
        for element in elements:
            if element.category == "Table":
                tables.append({
                    "html": element.metadata.text_as_html,
                    "page": element.metadata.page_number
                })
            else:
                text_parts.append(element.text)
            
            if hasattr(element, 'metadata') and element.metadata.page_number:
                metadata["total_pages"] = max(
                    metadata["total_pages"], 
                    element.metadata.page_number
                )
        
        full_text = "\n\n".join(text_parts)
        
        # Fallback: si no hay texto, intentar OCR
        if len(full_text.strip()) < 100:
            full_text = await self._ocr_fallback(file_path)
        
        # Extraer tablas adicionales con pdfplumber
        additional_tables = await self._extract_tables_pdfplumber(file_path)
        tables.extend(additional_tables)
        
        return ParsedDocument(
            text=full_text,
            metadata=metadata,
            tables=tables
        )
    
    async def _ocr_fallback(self, file_path: Path) -> str:
        """OCR con Tesseract para PDFs escaneados"""
        import pytesseract
        from pdf2image import convert_from_path
        
        images = convert_from_path(file_path)
        text_parts = []
        
        for i, image in enumerate(images):
            text = pytesseract.image_to_string(image, lang='spa+eng')
            text_parts.append(f"[Página {i+1}]\n{text}")
        
        return "\n\n".join(text_parts)
    
    async def _extract_tables_pdfplumber(self, file_path: Path) -> list[dict]:
        """Extracción especializada de tablas"""
        tables = []
        
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                page_tables = page.extract_tables()
                for table in page_tables:
                    tables.append({
                        "data": table,
                        "page": page_num
                    })
        
        return tables
```

#### 2.3.2 Code Parser (GitHub Repos)

```python
from tree_sitter import Language, Parser
import tree_sitter_python as tspython
import tree_sitter_javascript as tsjavascript

class CodeParser(BaseParser):
    SUPPORTED_LANGUAGES = {
        '.py': 'python',
        '.js': 'javascript',
        '.ts': 'typescript',
        '.jsx': 'javascript',
        '.tsx': 'typescript'
    }
    
    def __init__(self):
        # Cargar parsers de tree-sitter
        self.parsers = {
            'python': Parser(Language(tspython.language())),
            'javascript': Parser(Language(tsjavascript.language())),
        }
    
    def can_parse(self, file_path: Path) -> bool:
        return file_path.suffix in self.SUPPORTED_LANGUAGES
    
    async def parse(self, file_path: Path) -> ParsedDocument:
        """
        Parsea código fuente y extrae:
        - Funciones/clases con docstrings
        - Imports/dependencias
        - Comentarios importantes
        """
        language = self.SUPPORTED_LANGUAGES[file_path.suffix]
        parser = self.parsers.get(language)
        
        with open(file_path, 'rb') as f:
            code_bytes = f.read()
        
        tree = parser.parse(code_bytes)
        
        # Extraer elementos estructurados
        functions = self._extract_functions(tree.root_node, code_bytes)
        classes = self._extract_classes(tree.root_node, code_bytes)
        imports = self._extract_imports(tree.root_node, code_bytes)
        
        # Construir texto enriquecido
        text_parts = [f"# Archivo: {file_path.name}\n"]
        
        if imports:
            text_parts.append("## Dependencias\n" + "\n".join(imports))
        
        for cls in classes:
            text_parts.append(f"\n## Clase: {cls['name']}")
            if cls['docstring']:
                text_parts.append(cls['docstring'])
        
        for func in functions:
            text_parts.append(f"\n### Función: {func['name']}")
            if func['docstring']:
                text_parts.append(func['docstring'])
        
        metadata = {
            "source": str(file_path),
            "file_type": "code",
            "language": language,
            "functions_count": len(functions),
            "classes_count": len(classes)
        }
        
        return ParsedDocument(
            text="\n".join(text_parts),
            metadata=metadata,
            code_blocks=[{
                "type": "function",
                "name": f['name'],
                "signature": f['signature']
            } for f in functions]
        )
    
    def _extract_functions(self, node, code_bytes: bytes) -> list[dict]:
        """Extrae todas las funciones con sus docstrings"""
        functions = []
        
        def traverse(node):
            if node.type == 'function_definition':
                name_node = node.child_by_field_name('name')
                name = code_bytes[name_node.start_byte:name_node.end_byte].decode()
                
                # Buscar docstring
                docstring = None
                body = node.child_by_field_name('body')
                if body and body.child_count > 0:
                    first_stmt = body.children[0]
                    if first_stmt.type == 'expression_statement':
                        string_node = first_stmt.children[0]
                        if string_node.type == 'string':
                            docstring = code_bytes[
                                string_node.start_byte:string_node.end_byte
                            ].decode().strip('"""').strip("'''")
                
                functions.append({
                    "name": name,
                    "docstring": docstring,
                    "signature": code_bytes[node.start_byte:node.end_byte].decode().split('\n')[0]
                })
            
            for child in node.children:
                traverse(child)
        
        traverse(node)
        return functions
    
    def _extract_classes(self, node, code_bytes: bytes) -> list[dict]:
        """Similar a _extract_functions pero para clases"""
        # Implementación similar...
        pass
    
    def _extract_imports(self, node, code_bytes: bytes) -> list[str]:
        """Extrae todas las declaraciones de import"""
        # Implementación...
        pass
```

#### 2.3.3 GitHub Repository Parser

```python
import git
from pathlib import Path
import tempfile

class GitHubRepoParser(BaseParser):
    def __init__(self):
        self.code_parser = CodeParser()
        self.markdown_parser = MarkdownParser()
    
    def can_parse(self, file_path: Path) -> bool:
        # Este parser se invoca explícitamente, no por extensión
        return False
    
    async def parse_repo(
        self, 
        repo_url: str, 
        branch: str = "main",
        include_patterns: list[str] | None = None,
        exclude_patterns: list[str] | None = None
    ) -> list[ParsedDocument]:
        """
        Clona y parsea un repositorio completo.
        
        Args:
            repo_url: URL del repositorio GitHub
            branch: Rama a clonar
            include_patterns: Patrones de archivos a incluir (ej: ["*.py", "*.md"])
            exclude_patterns: Patrones a excluir (ej: ["tests/*", "node_modules/*"])
        
        Returns:
            Lista de documentos parseados
        """
        with tempfile.TemporaryDirectory() as tmpdir:
            repo_path = Path(tmpdir) / "repo"
            
            # Clonar repositorio
            print(f"Clonando {repo_url}...")
            git.Repo.clone_from(
                repo_url, 
                repo_path, 
                branch=branch,
                depth=1  # Shallow clone para rapidez
            )
            
            # Filtrar archivos
            files_to_process = self._filter_files(
                repo_path,
                include_patterns or ["*.py", "*.js", "*.ts", "*.md", "*.txt"],
                exclude_patterns or [
                    "**/node_modules/**",
                    "**/.git/**",
                    "**/dist/**",
                    "**/build/**",
                    "**/__pycache__/**",
                    "**/tests/**",
                    "**/.venv/**"
                ]
            )
            
            print(f"Procesando {len(files_to_process)} archivos...")
            
            # Parsear cada archivo
            documents = []
            for file_path in files_to_process:
                try:
                    if file_path.suffix in CodeParser.SUPPORTED_LANGUAGES:
                        doc = await self.code_parser.parse(file_path)
                    elif file_path.suffix == '.md':
                        doc = await self.markdown_parser.parse(file_path)
                    else:
                        # Texto plano
                        doc = ParsedDocument(
                            text=file_path.read_text(encoding='utf-8'),
                            metadata={
                                "source": str(file_path.relative_to(repo_path)),
                                "repo_url": repo_url
                            }
                        )
                    
                    documents.append(doc)
                except Exception as e:
                    print(f"Error parseando {file_path}: {e}")
                    continue
            
            # Crear documento de resumen del repositorio
            readme = repo_path / "README.md"
            if readme.exists():
                readme_doc = await self.markdown_parser.parse(readme)
                readme_doc.metadata["is_readme"] = True
                documents.insert(0, readme_doc)
            
            return documents
    
    def _filter_files(
        self,
        repo_path: Path,
        include_patterns: list[str],
        exclude_patterns: list[str]
    ) -> list[Path]:
        """Filtra archivos basado en patrones de inclusión/exclusión"""
        from fnmatch import fnmatch
        
        all_files = list(repo_path.rglob("*"))
        filtered = []
        
        for file in all_files:
            if not file.is_file():
                continue
            
            relative_path = str(file.relative_to(repo_path))
            
            # Check exclusions first
            if any(fnmatch(relative_path, pattern) for pattern in exclude_patterns):
                continue
            
            # Check inclusions
            if any(fnmatch(file.name, pattern) for pattern in include_patterns):
                filtered.append(file)
        
        return filtered
```

#### 2.3.4 Structured Data Parser

```python
import json
import yaml

class StructuredDataParser(BaseParser):
    """
    Parser para fuentes estructuradas:
    - Exportaciones de NotebookLM
    - Investigaciones de Gemini/Perplexity
    - Conversaciones de Claude/ChatGPT
    """
    
    PARSERS = {
        "notebooklm": "_parse_notebooklm",
        "gemini_research": "_parse_gemini_research",
        "perplexity": "_parse_perplexity",
        "claude_project": "_parse_claude_project",
        "chatgpt_export": "_parse_chatgpt_export"
    }
    
    def can_parse(self, file_path: Path) -> bool:
        return file_path.suffix in [".json", ".jsonl", ".md"]
    
    async def parse(
        self, 
        file_path: Path,
        source_type: str | None = None
    ) -> ParsedDocument:
        """
        Parsea fuente estructurada.
        
        Args:
            file_path: Ruta al archivo
            source_type: Tipo de fuente (autodetectar si None)
        """
        # Cargar datos
        if file_path.suffix == ".json":
            with open(file_path) as f:
                data = json.load(f)
        elif file_path.suffix == ".md":
            data = self._parse_markdown_structured(file_path)
        else:
            raise ValueError(f"Formato no soportado: {file_path.suffix}")
        
        # Autodetectar tipo si no se especifica
        if source_type is None:
            source_type = self._detect_source_type(data)
        
        # Delegar a parser específico
        parser_method = getattr(self, self.PARSERS[source_type])
        return parser_method(data, file_path)
    
    def _detect_source_type(self, data: dict) -> str:
        """Detecta el tipo de fuente basado en la estructura"""
        if "sources" in data and "notebook_guide" in data:
            return "notebooklm"
        elif "research_query" in data and "findings" in data:
            return "gemini_research"
        elif "conversations" in data and "mapping" in data:
            return "chatgpt_export"
        else:
            raise ValueError("No se pudo detectar el tipo de fuente")
    
    def _parse_notebooklm(self, data: dict, file_path: Path) -> ParsedDocument:
        """
        Parsea exportación de NotebookLM.
        
        Estructura esperada:
        {
            "sources": [
                {"title": str, "content": str, "url": str},
                ...
            ],
            "notebook_guide": str,
            "audio_overview": str (opcional)
        }
        """
        text_parts = []
        
        # Guía del notebook
        if "notebook_guide" in data:
            text_parts.append(f"# Guía del Notebook\n\n{data['notebook_guide']}")
        
        # Procesar cada fuente
        sources_metadata = []
        for i, source in enumerate(data.get("sources", []), 1):
            text_parts.append(f"\n## Fuente {i}: {source['title']}\n")
            text_parts.append(source['content'])
            
            sources_metadata.append({
                "title": source['title'],
                "url": source.get('url'),
                "index": i
            })
        
        metadata = {
            "source": str(file_path),
            "file_type": "notebooklm_export",
            "sources_count": len(sources_metadata),
            "sources": sources_metadata
        }
        
        return ParsedDocument(
            text="\n".join(text_parts),
            metadata=metadata
        )
    
    def _parse_gemini_research(self, data: dict, file_path: Path) -> ParsedDocument:
        """
        Parsea investigación de Gemini.
        
        Estructura esperada:
        {
            "research_query": str,
            "findings": [
                {"title": str, "content": str, "sources": [str]},
                ...
            ],
            "summary": str
        }
        """
        text_parts = [
            f"# Investigación: {data['research_query']}\n",
            f"\n## Resumen\n{data.get('summary', '')}\n"
        ]
        
        for i, finding in enumerate(data.get("findings", []), 1):
            text_parts.append(f"\n## Hallazgo {i}: {finding['title']}\n")
            text_parts.append(finding['content'])
            
            if finding.get('sources'):
                text_parts.append("\n**Fuentes:**")
                for source in finding['sources']:
                    text_parts.append(f"- {source}")
        
        return ParsedDocument(
            text="\n".join(text_parts),
            metadata={
                "source": str(file_path),
                "file_type": "gemini_research",
                "query": data['research_query'],
                "findings_count": len(data.get('findings', []))
            }
        )
```

---

### 2.4 Chunking Strategy

**Implementación con LlamaIndex:**

```python
from llama_index.core.node_parser import (
    SemanticSplitterNodeParser,
    SentenceSplitter
)
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

class AdvancedChunker:
    def __init__(self):
        self.embed_model = HuggingFaceEmbedding(
            model_name="nomic-ai/nomic-embed-text-v1.5"
        )
        
        # Chunker semántico
        self.semantic_splitter = SemanticSplitterNodeParser(
            embed_model=self.embed_model,
            buffer_size=1,  # Contexto de 1 oración antes/después
            breakpoint_percentile_threshold=95,  # Umbral de similitud
        )
        
        # Fallback para documentos muy largos
        self.sentence_splitter = SentenceSplitter(
            chunk_size=512,
            chunk_overlap=50
        )
    
    async def chunk_document(
        self, 
        parsed_doc: ParsedDocument,
        strategy: Literal["semantic", "fixed", "hybrid"] = "semantic"
    ) -> list[dict]:
        """
        Fragmenta documento usando estrategia especificada.
        
        Returns:
            Lista de chunks con metadata
        """
        from llama_index.core import Document
        
        # Convertir a Document de LlamaIndex
        doc = Document(
            text=parsed_doc.text,
            metadata=parsed_doc.metadata
        )
        
        if strategy == "semantic":
            nodes = self.semantic_splitter.get_nodes_from_documents([doc])
        elif strategy == "fixed":
            nodes = self.sentence_splitter.get_nodes_from_documents([doc])
        else:  # hybrid
            # Intentar semántico, fallback a fijo si muy largo
            if len(parsed_doc.text) > 100000:  # >100k caracteres
                nodes = self.sentence_splitter.get_nodes_from_documents([doc])
            else:
                nodes = self.semantic_splitter.get_nodes_from_documents([doc])
        
        # Convertir nodos a formato estándar
        chunks = []
        for i, node in enumerate(nodes):
            chunk = {
                "text": node.get_content(),
                "index": i,
                "metadata": {
                    **parsed_doc.metadata,
                    "chunk_id": node.node_id,
                    "char_start": node.start_char_idx,
                    "char_end": node.end_char_idx,
                }
            }
            
            # Añadir contexto de chunks adyacentes si están disponibles
            if i > 0:
                chunk["metadata"]["prev_chunk_id"] = nodes[i-1].node_id
            if i < len(nodes) - 1:
                chunk["metadata"]["next_chunk_id"] = nodes[i+1].node_id
            
            chunks.append(chunk)
        
        return chunks
```

---

### 2.5 Ingestion Pipeline (Worker Tasks)

**Implementación con RQ:**

```python
from rq import Queue, Worker
from redis import Redis
import asyncio

# Configuración de colas
redis_conn = Redis(host='redis', port=6379)
ingestion_queue = Queue('ingestion', connection=redis_conn)
embedding_queue = Queue('embedding', connection=redis_conn)

# ============= TASKS =============

async def process_document_task(
    doc_id: str,
    batch_id: str,
    file_path: str,
    collection_name: str
):
    """
    Task principal de procesamiento de documento.
    
    Flujo:
    1. Parseo → ParsedDocument
    2. Chunking → List[chunks]
    3. Enqueue para embeddings
    """
    try:
        # 1. Parsear documento
        parser = ParserRouter()
        parsed_doc = await parser.parse(Path(file_path))
        
        # 2. Chunking
        chunker = AdvancedChunker()
        chunks = await chunker.chunk_document(parsed_doc, strategy="semantic")
        
        # 3. Enqueue cada chunk para embedding
        for chunk in chunks:
            embedding_queue.enqueue(
                embed_and_store_chunk,
                chunk=chunk,
                doc_id=doc_id,
                collection_name=collection_name,
                job_timeout='10m'
            )
        
        # 4. Actualizar progreso
        batch_manager = BatchManager(supabase_client, redis_conn)
        await batch_manager.update_progress(
            UUID(batch_id),
            UUID(doc_id),
            status="chunked",
            chunk_count=len(chunks)
        )
        
    except Exception as e:
        # Registrar error
        await batch_manager.update_progress(
            UUID(batch_id),
            UUID(doc_id),
            status="failed",
            error=str(e)
        )
        raise

def embed_and_store_chunk(
    chunk: dict,
    doc_id: str,
    collection_name: str
):
    """
    Task para generar embedding y almacenar en Qdrant.
    
    Nota: Esta función es síncrona porque RQ no soporta async workers
    """
    from qdrant_client import QdrantClient
    from qdrant_client.models import PointStruct
    import uuid
    
    # 1. Generar embedding
    embed_model = HuggingFaceEmbedding("nomic-ai/nomic-embed-text-v1.5")
    embedding = embed_model.get_text_embedding(chunk["text"])
    
    # 2. Preparar punto para Qdrant
    point_id = str(uuid.uuid4())
    point = PointStruct(
        id=point_id,
        vector=embedding,
        payload={
            "text": chunk["text"],
            "doc_id": doc_id,
            "chunk_index": chunk["index"],
            "metadata": chunk["metadata"]
        }
    )
    
    # 3. Upsert a Qdrant
    qdrant_client = QdrantClient(host="qdrant", port=6333)
    qdrant_client.upsert(
        collection_name=collection_name,
        points=[point]
    )
    
    return point_id

# ============= API ENDPOINTS =============

from fastapi import APIRouter, UploadFile, Depends, BackgroundTasks
from typing import List

router = APIRouter(prefix="/api/v1/ingest", tags=["ingestion"])

@router.post("/batch")
async def create_ingestion_batch(
    batch_name: str,
    collection_name: str,
    files: List[UploadFile],
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user)
):
    """
    Crea un lote de ingesta y encola procesamiento.
    """
    # 1. Validar archivos
    validator = FileValidator()
    is_valid, validation_results = validator.validate_batch(files)
    
    if not is_valid:
        raise HTTPException(400, detail={
            "message": "Validación fallida",
            "errors": validation_results
        })
    
    # 2. Crear batch
    batch_manager = BatchManager(supabase_client, redis_conn)
    batch_id = await batch_manager.create_batch(
        user.id,
        batch_name,
        collection_name
    )
    
    # 3. Guardar archivos temporalmente y crear registros
    temp_dir = Path(f"/tmp/ingestion/{batch_id}")
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    doc_ids = []
    for file in files:
        # Guardar archivo
        file_path = temp_dir / file.filename
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Crear registro en DB
        doc_id = uuid4()
        await batch_manager.add_file_to_batch(
            batch_id,
            file.filename,
            "file_upload",
            file.size,
            file.content_type
        )
        doc_ids.append(doc_id)
        
        # Encolar procesamiento
        ingestion_queue.enqueue(
            process_document_task,
            doc_id=str(doc_id),
            batch_id=str(batch_id),
            file_path=str(file_path),
            collection_name=collection_name,
            job_timeout='30m'
        )
    
    return {
        "batch_id": str(batch_id),
        "document_ids": [str(d) for d in doc_ids],
        "status": "queued",
        "message": f"{len(files)} archivos encolados para procesamiento"
    }

@router.post("/batch/{batch_id}/github")
async def ingest_github_repo(
    batch_id: UUID,
    repo_url: str,
    branch: str = "main",
    include_patterns: List[str] | None = None,
    user: User = Depends(get_current_admin_user)
):
    """
    Ingesta un repositorio completo de GitHub.
    """
    # Validar que el batch existe y pertenece al usuario
    batch = await batch_manager.get_batch(batch_id)
    if not batch:
        raise HTTPException(404, "Batch no encontrado")
    
    # Encolar tarea de clonado y procesamiento
    job = ingestion_queue.enqueue(
        process_github_repo_task,
        batch_id=str(batch_id),
        repo_url=repo_url,
        branch=branch,
        include_patterns=include_patterns,
        job_timeout='1h'
    )
    
    return {
        "batch_id": str(batch_id),
        "job_id": job.id,
        "status": "queued",
        "repo_url": repo_url
    }

@router.get("/batch/{batch_id}/status")
async def get_batch_status(
    batch_id: UUID,
    user: User = Depends(get_current_user)
):
    """
    Obtiene el estado detallado de un batch.
    """
    # Obtener información del batch
    batch = await batch_manager.get_batch(batch_id)
    
    # Obtener documentos
    docs = await batch_manager.get_batch_documents(batch_id)
    
    # Calcular estadísticas
    stats = {
        "total": len(docs),
        "pending": sum(1 for d in docs if d['status'] == 'pending'),
        "processing": sum(1 for d in docs if d['status'] == 'processing'),
        "completed": sum(1 for d in docs if d['status'] == 'completed'),
        "failed": sum(1 for d in docs if d['status'] == 'failed')
    }
    
    return {
        "batch": batch,
        "documents": docs,
        "statistics": stats,
        "progress_percentage": (stats['completed'] / stats['total'] * 100) if stats['total'] > 0 else 0
    }
```

---

## 3. Configuración del Sistema

### 3.1 Configuración de Límites

```yaml
# config/ingestion.yaml
ingestion:
  limits:
    max_file_size_mb: 50
    max_batch_size_mb: 500
    max_files_per_batch: 1000
    max_concurrent_batches: 10
  
  timeouts:
    parsing_timeout_seconds: 300
    embedding_timeout_seconds: 60
    total_batch_timeout_hours: 24
  
  retry:
    max_attempts: 3
    backoff_multiplier: 2
    max_backoff_seconds: 300
  
  chunking:
    default_strategy: "semantic"
    semantic:
      breakpoint_threshold: 95
      buffer_size: 1
    fixed:
      chunk_size: 512
      chunk_overlap: 50
  
  parsers:
    pdf:
      strategy: "hi_res"
      ocr_enabled: true
      extract_images: false
      extract_tables: true
    
    code:
      max_file_size_kb: 500
      extract_docstrings: true
      extract_comments: false
    
    github:
      default_branch: "main"
      shallow_clone: true
      exclude_patterns:
        - "**/node_modules/**"
        - "**/.git/**"
        - "**/dist/**"
        - "**/build/**"
```

### 3.2 Variables de Entorno

```bash
# .env.example

# API
API_HOST=0.0.0.0
API_PORT=8000

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# Qdrant
QDRANT_HOST=qdrant
QDRANT_PORT=6333
QDRANT_API_KEY=  # Opcional

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Modelos
EMBEDDING_MODEL=nomic-ai/nomic-embed-text-v1.5
EMBEDDING_DEVICE=cuda  # o 'cpu'

# GitHub
GITHUB_TOKEN=ghp_your_token  # Para repos privados

# Storage
TEMP_STORAGE_PATH=/tmp/ingestion
PERSISTENT_STORAGE_PATH=/data/ingestion

# Workers
WORKER_CONCURRENCY=4
WORKER_LOG_LEVEL=INFO
```

---

## 4. Monitoreo y Observabilidad

### 4.1 Métricas Clave

```python
from prometheus_client import Counter, Histogram, Gauge

# Contadores
ingestion_jobs_total = Counter(
    'ingestion_jobs_total',
    'Total de trabajos de ingesta',
    ['status', 'source_type']
)

# Histogramas (latencias)
parsing_duration = Histogram(
    'parsing_duration_seconds',
    'Duración del parseo',
    ['parser_type']
)

chunking_duration = Histogram(
    'chunking_duration_seconds',
    'Duración del chunking',
    ['strategy']
)

embedding_duration = Histogram(
    'embedding_duration_seconds',
    'Duración de generación de embeddings'
)

# Gauges (estado actual)
active_batches = Gauge(
    'active_batches',
    'Número de batches activos'
)

queue_size = Gauge(
    'queue_size',
    'Tamaño de la cola',
    ['queue_name']
)

# Instrumentar funciones
@parsing_duration.labels(parser_type='pdf').time()
async def parse_pdf(file_path: Path):
    # ...
    pass
```

### 4.2 Dashboard Grafana

**Paneles Sugeridos:**

1. **Throughput**: Documentos procesados por minuto
2. **Queue Health**: Tamaño de colas y latencia
3. **Error Rate**: Tasa de fallos por tipo de parser
4. **Resource Usage**: CPU/RAM/GPU de workers
5. **Batch Progress**: Estado de batches activos

---

## 5. Testing

### 5.1 Test de Parsers

```python
import pytest
from pathlib import Path

@pytest.fixture
def sample_pdf():
    return Path("tests/fixtures/sample.pdf")

@pytest.fixture
def sample_repo_url():
    return "https://github.com/example/test-repo"

class TestPDFParser:
    async def test_parse_text_pdf(self, sample_pdf):
        parser = PDFParser()
        result = await parser.parse(sample_pdf)
        
        assert len(result.text) > 0
        assert result.metadata['file_type'] == 'pdf'
        assert result.metadata['total_pages'] > 0
    
    async def test_parse_tables(self, sample_pdf_with_tables):
        parser = PDFParser()
        result = await parser.parse(sample_pdf_with_tables)
        
        assert len(result.tables) > 0
        assert 'data' in result.tables[0]

class TestGitHubParser:
    @pytest.mark.integration
    async def test_clone_and_parse(self, sample_repo_url):
        parser = GitHubRepoParser()
        documents = await parser.parse_repo(sample_repo_url)
        
        assert len(documents) > 0
        # Debe haber al menos un README
        assert any(d.metadata.get('is_readme') for d in documents)
```

### 5.2 Test de Integración End-to-End

```python
@pytest.mark.integration
class TestIngestionPipeline:
    async def test_full_pipeline(self, test_client, sample_files):
        """Test del pipeline completo: upload → parse → chunk → embed"""
        
        # 1. Crear batch
        response = await test_client.post(
            "/api/v1/ingest/batch",
            data={
                "batch_name": "test_batch",
                "collection_name": "test_collection"
            },
            files=[("files", f) for f in sample_files]
        )
        assert response.status_code == 200
        batch_id = response.json()["batch_id"]
        
        # 2. Esperar procesamiento (con timeout)
        await self._wait_for_batch_completion(batch_id, timeout=300)
        
        # 3. Verificar en Qdrant
        qdrant = QdrantClient(host="qdrant")
        points = qdrant.scroll(
            collection_name="test_collection",
            limit=100
        )[0]
        
        assert len(points) > 0
        # Verificar que tienen embeddings
        assert len(points[0].vector) == 768  # nomic-embed-text dimension
```

---

## 6. Troubleshooting

### 6.1 Problemas Comunes

#### Error: "No se pudo parsear PDF"

- **Causa**: PDF corrupto o protegido por contraseña
- **Solución**: Validar integridad del archivo, intentar con `qpdf --decrypt`

#### Error: "Timeout en embedding"

- **Causa**: Chunk demasiado grande o GPU sobrecargada
- **Solución**: Reducir tamaño de chunk, escalar workers

#### Error: "Out of memory en parsing"

- **Causa**: Documento muy grande (>100MB)
- **Solución**: Implementar streaming parsing, aumentar RAM del worker

### 6.2 Logs de Debugging

```python
import logging

# Configurar logging detallado
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/ingestion/debug.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# En el código
logger.debug(f"Parseando archivo: {file_path}")
logger.info(f"Generados {len(chunks)} chunks")
logger.warning(f"Chunk muy grande: {len(chunk['text'])} caracteres")
logger.error(f"Error en parseo: {str(e)}", exc_info=True)
```

---

## 7. Roadmap de Mejoras

### Fase 1 (Actual)

- [x] Parseo multi-formato básico
- [x] Chunking semántico
- [x] Sistema de colas
- [ ] Tests de integración

### Fase 2

- [ ] Parseo incremental (solo documentos nuevos/modificados)
- [ ] Deduplicación avanzada con MinHash LSH
- [ ] Extracción de entidades (NER)
- [ ] Soporte para imágenes (OCR + image embeddings)

### Fase 3

- [ ] Parsing distribuido (múltiples workers en paralelo)
- [ ] Versionado de documentos
- [ ] Pipeline de re-indexación automática
- [ ] ML para clasificación automática de documentos

---

## Anexo A: Ejemplos de Uso

### A.1 Upload Simple

```bash
curl -X POST http://localhost:8000/api/v1/ingest/batch \
  -H "Authorization: Bearer $TOKEN" \
  -F "batch_name=My Documents" \
  -F "collection_name=personal_docs" \
  -F "files=@document1.pdf" \
  -F "files=@document2.docx"
```

### A.2 GitHub Repo

```bash
curl -X POST http://localhost:8000/api/v1/ingest/batch/$BATCH_ID/github \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/username/repo",
    "branch": "main",
    "include_patterns": ["*.py", "*.md"]
  }'
```

### A.3 Monitorear Progreso

```bash
# WebSocket para actualizaciones en tiempo real
wscat -c ws://localhost:8000/api/v1/ingest/batch/$BATCH_ID/stream

# O polling
while true; do
  curl http://localhost:8000/api/v1/ingest/batch/$BATCH_ID/status
  sleep 5
done
```

---

**Documento creado el 2025-10-04**
**Versión: 1.0**
