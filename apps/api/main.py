from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


import os
import ast # For Python AST parsing
import json
import sqlite3
from pathlib import Path
import uvicorn
import asyncio
import logging
import uuid
import traceback
import time
from datetime import datetime, timezone
import re # For JSDoc regex parsing

# 🚀 Импорт AI сервисов
from ai_services import (
    initialize_ai_services, 
    get_ai_manager, 
    CodeContext, 
    AIResponse,
    AIServiceError
)

# 🔍 Импорт нашей интеллектуальной системы мониторинга
from monitoring_system import (
    analytics_logger,
    track_analysis_operation,
    log_analysis_event,
    get_system_health,
    get_analytics_summary,
    EventType
)


from dotenv import load_dotenv
load_dotenv()



# Модели данных

# Documentation Models
class DocFunctionParam(BaseModel):
    name: str
    type: Optional[str] = None
    description: Optional[str] = None

class DocFunction(BaseModel):
    name: str
    description: Optional[str] = None
    params: List[DocFunctionParam] = Field(default_factory=list)
    returns: Optional[Dict[str, Optional[str]]] = None # e.g., {"type": "str", "description": "..."}
    line_start: Optional[int] = None
    line_end: Optional[int] = None

class DocFile(BaseModel):
    file_path: str
    functions: List[DocFunction] = Field(default_factory=list)

# Main Models
class ProjectAnalysisRequest(BaseModel):
    path: str
    include_tests: bool = True
    analysis_depth: str = "medium"

class FileInfo(BaseModel):
    path: str
    name: str
    type: str
    size: int
    lines_of_code: Optional[int] = None
    functions: List[str] = [] # Still keep simple list of function names for other uses
    imports: List[str] = []
    todos: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    doc_details: Optional[List[DocFunction]] = Field(default_factory=list) # Parsed function documentation

class ProjectAnalysisResult(BaseModel):
    project_path: str
    files: List[FileInfo]
    dependencies: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    architecture_patterns: List[str]
    all_todos: List[Dict[str, Any]] = Field(default_factory=list)
    project_documentation: Optional[List[DocFile]] = Field(default_factory=list)

class CodeExplanationRequest(BaseModel):
    code: str
    language: str = "javascript"
    level: str = "intermediate"
    file_path: Optional[str] = None
    project_context: Optional[Dict[str, Any]] = None

class CodeExplanation(BaseModel):
    explanation: str
    concepts: List[str]
    examples: List[str]
    recommendations: List[str]
    improvements: List[str] = []
    patterns: List[str] = []
    confidence_score: float = 0.0
    ai_provider: str = "unknown"

class ComprehensiveAnalysisRequest(BaseModel):
    file_path: str
    project_path: str
    explanation_level: str = "intermediate"

class ComprehensiveAnalysisResult(BaseModel):
    explanation: Optional[Dict[str, Any]] = None
    improvements: List[str] = []
    patterns: List[str] = []
    analysis_metadata: Dict[str, Any] = {}

# Глобальная переменная для AI менеджера
ai_manager = None

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Инициализация FastAPI
app = FastAPI(
    title="MCP Code Analyzer API with AI Integration",
    description="Backend API for intelligent code analysis and visualization with AI-powered explanations",
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 🌐 CORS настройки с поддержкой всех портов разработки
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://127.0.0.1:3000",  # Основной порт Next.js
        "http://localhost:3001", "http://127.0.0.1:3001",  # Альтернативный порт
        "http://localhost:3002", "http://127.0.0.1:3002",  # Дополнительный порт
        "http://localhost:3003", "http://127.0.0.1:3003",  # Резервный порт
        "http://192.168.156.236:3000"  # Ваш внешний адрес фронта
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация базы данных
def init_database():
    """Инициализация SQLite базы данных"""
    conn = sqlite3.connect("code_analyzer.db")
    cursor = conn.cursor()
    
    # Таблица проектов
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            path TEXT NOT NULL UNIQUE,
            language TEXT,
            framework TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Таблица анализов
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            analysis_type TEXT NOT NULL,
            results TEXT, -- JSON
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects (id)
        )
    """)
    
    # Таблица обучающих сессий
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS learning_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            topic TEXT,
            progress TEXT, -- JSON
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()

# Утилиты для анализа кода
class CodeAnalyzer:
    @staticmethod
    def analyze_file(file_path: str) -> FileInfo:
        """Анализ одного файла"""
        import re # Ensure re is imported here
        path_obj = Path(file_path)
        
        if not path_obj.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        file_info = FileInfo(
            path=str(path_obj),
            name=path_obj.name,
            type=path_obj.suffix[1:] if path_obj.suffix else "unknown",
            size=path_obj.stat().st_size,
            lines_of_code=0,
            functions=[],
            imports=[],
            todos=[],
            doc_details=[]
        )
        
        # Regex patterns for TODOs, FIXMEs, HACKs
        # Covers #, //, /* ... */, <!-- ... -->, """ ... """, ''' ... '''
        todo_patterns = [
            re.compile(r"#\s*(TODO|FIXME|HACK)\s*[:\-]\s*(.*)", re.IGNORECASE),
            re.compile(r"//\s*(TODO|FIXME|HACK)\s*[:\-]\s*(.*)", re.IGNORECASE),
            re.compile(r"/\*\s*(TODO|FIXME|HACK)\s*[:\-]\s*(.*?)\s*\*/", re.IGNORECASE | re.DOTALL),
            re.compile(r"<!--\s*(TODO|FIXME|HACK)\s*[:\-]\s*(.*?)\s*-->", re.IGNORECASE | re.DOTALL),
            # Python docstrings (multiline) - basic check, might need refinement for perfect parsing
            re.compile(r"\"\"\"\s*(TODO|FIXME|HACK)\s*[:\-]\s*(.*?)\s*\"\"\"", re.IGNORECASE | re.DOTALL),
            re.compile(r"'''\s*(TODO|FIXME|HACK)\s*[:\-]\s*(.*?)\s*'''", re.IGNORECASE | re.DOTALL),
        ]

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content_lines = f.readlines()
                file_info.lines_of_code = len(content_lines)

                full_content = "".join(content_lines)

                # Scan for TODOs/FIXMEs
                # For line-by-line comments (#, //)
                for i, line_text in enumerate(content_lines):
                    for pattern in todo_patterns[:2]: # Only line comment patterns
                        match = pattern.search(line_text)
                        if match:
                            file_info.todos.append({
                                "line": i + 1,
                                "type": match.group(1).upper(),
                                "content": match.group(2).strip(),
                                "priority": None # Placeholder for future enhancement
                            })

                # For block comments (/* ... */, <!-- ... -->, """...""", '''...''')
                # These need to be searched in the full content, line numbers are approximations (start of match)
                for pattern in todo_patterns[2:]:
                    for match in pattern.finditer(full_content):
                        start_char_index = match.start()
                        # Approximate line number
                        line_num = full_content.count('\n', 0, start_char_index) + 1
                        file_info.todos.append({
                            "line": line_num,
                            "type": match.group(1).upper(),
                            "content": match.group(2).strip().replace('\n', ' '), # Flatten multiline content
                            "priority": None
                        })

                # Existing analysis for functions and imports
                if path_obj.suffix in ['.js', '.ts', '.tsx', '.jsx']:
                    functions = re.findall(r'function\s+(\w+)|const\s+(\w+)\s*=.*?=>|(\w+)\s*:\s*\([^)]*\)\s*=>', full_content)
                    file_info.functions = [f for func_group in functions for f in func_group if f]
                    imports = re.findall(r'import.*?from\s+[\'"]([^\'"]+)[\'"]', full_content)
                    file_info.imports = imports

                elif path_obj.suffix == '.py':
                    functions = re.findall(r'def\s+(\w+)', full_content)
                    file_info.functions = functions
                    imports = re.findall(r'from\s+(\S+)\s+import|import\s+(\S+)', full_content)
                    file_info.imports = [imp for imp_group in imports for imp in imp_group if imp]
                    
                    # Python Docstring Parsing using AST
                    try:
                        tree = ast.parse(full_content, filename=file_path)
                        for node in ast.walk(tree):
                            if isinstance(node, ast.FunctionDef):
                                docstring = ast.get_docstring(node)
                                parsed_function = DocFunction(name=node.name, line_start=node.lineno, line_end=node.end_lineno)
                                if docstring:
                                    # Simple parsing for now, can be expanded
                                    lines = [line.strip() for line in docstring.split('\n')]
                                    parsed_function.description = lines[0] if lines else None

                                    param_matches = re.finditer(r":param\s+(?:([\w\s]+)\s*:\s*)?(\w+)\s*:(.*)", docstring) # :param type name: desc or :param name: desc
                                    for match in param_matches:
                                        param_type, param_name, param_desc = match.groups()
                                        parsed_function.params.append(DocFunctionParam(name=param_name.strip(), type=param_type.strip() if param_type else None, description=param_desc.strip()))

                                    return_match = re.search(r":return(?:s)?\s*(?:([\w\s\[\],\|]+)\s*:\s*)?(.*)|:rtype:\s*([\w\s\[\],\|]+)", docstring, re.DOTALL) # :return type: desc or :returns: desc or :rtype: type
                                    if return_match:
                                        g = return_match.groups()
                                        # g[0] is type from :return type:, g[1] is desc from :return ...: desc, g[2] is type from :rtype:
                                        return_type = g[0] or g[2]
                                        return_desc = g[1]
                                        parsed_function.returns = {"type": return_type.strip() if return_type else None, "description": return_desc.strip() if return_desc else None}
                                file_info.doc_details.append(parsed_function)
                    except Exception as e:
                        print(f"Error parsing Python AST for {file_path}: {e}")

                elif path_obj.suffix in ['.js', '.ts', '.tsx', '.jsx']:
                    # JSDoc Parsing (Simplified Regex)
                    # This regex is basic and may need significant improvement for complex cases or various JSDoc styles.
                    # It tries to find a JSDoc block and the function/method name that follows it.
                    jsdoc_func_pattern = re.compile(
                        r"/\*\*(.*?)\*/\s*(?:export\s+)?(?:async\s+)?(?:function\s*(?P<funcName1>\w+)\s*\(|const\s+(?P<funcName2>\w+)\s*=\s*(?:async)?\s*\(|(?P<methodName>\w+)\s*\([^)]*\)\s*\{)",
                        re.DOTALL | re.MULTILINE
                    )
                    for match in jsdoc_func_pattern.finditer(full_content):
                        jsdoc_content = match.group(1)
                        func_name = match.group('funcName1') or match.group('funcName2') or match.group('methodName')
                        if not func_name: continue

                        parsed_function = DocFunction(name=func_name)
                        
                        desc_match = re.search(r"@description\s+([^\n@]+)|([^\n@]+)", jsdoc_content, re.DOTALL) # First non-tag line or @description
                        if desc_match:
                            parsed_function.description = (desc_match.group(1) or desc_match.group(2) or "").strip()

                        for param_match in re.finditer(r"@param\s+\{(.*?)\}\s+(\w+)\s*(?:-\s*(.*?))?\s*(?=\n|\@)", jsdoc_content, re.DOTALL):
                            param_type, param_name, param_desc = param_match.groups()
                            parsed_function.params.append(DocFunctionParam(name=param_name.strip(), type=param_type.strip(), description=(param_desc or "").strip()))
                        
                        returns_match = re.search(r"@returns?\s+\{(.*?)\}\s*(.*)|@returns?\s+(.*)", jsdoc_content, re.DOTALL)
                        if returns_match:
                            g = returns_match.groups()
                            # g[0] is type from {@type}, g[1] is desc from {@type} desc, g[2] is desc from @returns desc
                            return_type = g[0]
                            return_desc = g[1] or g[2]
                            parsed_function.returns = {"type": return_type.strip() if return_type else None, "description": return_desc.strip() if return_desc else None}
                        
                        file_info.doc_details.append(parsed_function)

        except Exception as e:
            print(f"Error analyzing file content for {file_path}: {e}")
        
        return file_info
    
    @staticmethod
    async def analyze_project_monitored(
        project_path: str, 
        session_id: str,
        include_tests: bool = True,
        analysis_depth: str = "medium"
    ) -> ProjectAnalysisResult:
        """
        🚀 Интеллектуальный анализ проекта с полным мониторингом
        Усовершенствованная версия анализа с детальным отслеживанием каждого этапа
        """
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        async with analytics_logger.track_operation(
            EventType.FILE_SCAN_START,
            project_path=project_path,
            session_id=session_id
        ):
            # 📁 Подготовка к сканированию файлов
            path_obj = Path(project_path)
            
            if not path_obj.exists():
                raise HTTPException(status_code=404, detail="Project path not found")
            
            files = []
            dependencies = []
            file_paths = []
            
            # 🔍 Сканируем файлы проекта с мониторингом
            logger.info(f"🔍 Начинаем сканирование файлов в проекте: {project_path}")
            
            for file_path in path_obj.rglob("*"):
                if file_path.is_file() and file_path.suffix in ['.js', '.ts', '.tsx', '.jsx', '.py', '.html', '.css']:
                    # Пропускаем служебные папки
                    if any(part in str(file_path) for part in ['node_modules', '.git', 'dist', 'build', '__pycache__']):
                        continue
                    file_paths.append(str(file_path))
            
            # 📊 Ограничиваем количество файлов для анализа
            max_files = 1000 if analysis_depth == "deep" else 500 if analysis_depth == "medium" else 200
            if len(file_paths) > max_files:
                logger.info(f"📊 Ограничиваем анализ до {max_files} файлов из {len(file_paths)} найденных")
                file_paths = file_paths[:max_files]
            
            logger.info(f"📁 Найдено файлов для анализа: {len(file_paths)}")
        
        # 🔄 Параллельная обработка файлов с мониторингом
        async with analytics_logger.track_operation(
            EventType.FILE_ANALYSIS_START,
            project_path=project_path,
            metadata={"files_count": len(file_paths), "analysis_depth": analysis_depth},
            session_id=session_id
        ):
            
            total_files = len(file_paths)
            processed_files = 0
            
            logger.info(f"🚀 Начинаем параллельный анализ {total_files} файлов...")
            
            def analyze_single_file_monitored(file_path_str: str) -> Optional[FileInfo]:
                """Анализ одного файла с индивидуальным мониторингом"""
                try:
                    # Для каждого файла создаём отдельное событие мониторинга
                    start_time = time.time()
                    
                    result = CodeAnalyzer.analyze_file(file_path_str)
                    
                    duration_ms = (time.time() - start_time) * 1000
                    
                    # Логируем завершение анализа файла
                    log_analysis_event(
                        EventType.FILE_ANALYSIS_COMPLETE,
                        project_path=project_path,
                        file_path=file_path_str,
                        duration_ms=duration_ms,
                        metadata={
                            "file_size": result.size,
                            "lines_of_code": result.lines_of_code,
                            "functions_count": len(result.functions)
                        },
                        session_id=session_id
                    )
                    
                    return result
                    
                except Exception as e:
                    # Логируем ошибку анализа файла
                    log_analysis_event(
                        EventType.ANALYSIS_ERROR,
                        project_path=project_path,
                        file_path=file_path_str,
                        error_message=str(e),
                        metadata={"error_type": "file_analysis_error"},
                        session_id=session_id
                    )
                    logger.warning(f"⚠️ Ошибка анализа файла {file_path_str}: {str(e)}")
                    return None
            
            # 🔄 Выполняем параллельный анализ с мониторингом прогресса
            with ThreadPoolExecutor(max_workers=8) as executor:
                future_to_path = {
                    executor.submit(analyze_single_file_monitored, path): path 
                    for path in file_paths
                }
                
                for future in as_completed(future_to_path):
                    path = future_to_path[future]
                    try:
                        file_info = future.result()
                        if file_info:
                            files.append(file_info)
                        processed_files += 1
                        
                        # 📊 Логируем прогресс каждые 10 файлов
                        if processed_files % 10 == 0 or processed_files == total_files:
                            progress_percentage = (processed_files / total_files) * 100
                            logger.info(f"📈 Прогресс: {processed_files}/{total_files} файлов ({progress_percentage:.1f}%)")
                            
                            # Отправляем событие прогресса
                            log_analysis_event(
                                EventType.PERFORMANCE_METRIC,
                                project_path=project_path,
                                metadata={
                                    "progress_percentage": progress_percentage,
                                    "files_processed": processed_files,
                                    "files_total": total_files
                                },
                                session_id=session_id
                            )
                            
                    except Exception as e:
                        logger.error(f"❌ Ошибка обработки будущего результата для {path}: {e}")
            
            logger.info(f"✅ Анализ файлов завершён. Обработано: {len(files)} из {total_files}")
        
        # 🔗 Построение графа зависимостей с мониторингом
        logger.info("🔗 Строим граф зависимостей...")
        
        all_project_todos = []
        project_docs_list: List[DocFile] = []

        for file_info in files:
            # Dependencies
            for import_path in file_info.imports:
                dependencies.append({
                    "from": file_info.path,
                    "to": import_path,
                    "type": "import"
                })
            # Aggregate TODOs
            if file_info.todos:
                for todo in file_info.todos:
                    all_project_todos.append({
                        "file_path": file_info.path,
                        "line": todo["line"],
                        "type": todo["type"],
                        "content": todo["content"],
                        "priority": todo.get("priority")
                    })
            # Aggregate Documentation
            if file_info.doc_details and len(file_info.doc_details) > 0:
                project_docs_list.append(DocFile(
                    file_path=file_info.path,
                    functions=file_info.doc_details
                ))
        
        # 📊 Вычисляем метрики с подробной аналитикой
        total_lines = sum(f.lines_of_code or 0 for f in files)
        total_functions = sum(len(f.functions) for f in files)
        
        metrics = {
            "total_files": len(files),
            "total_lines": total_lines,
            "total_functions": total_functions,
            "avg_lines_per_file": total_lines / len(files) if files else 0,
            "languages": list(set(f.type for f in files if f.type != "unknown")),
            "analysis_depth": analysis_depth,
            "analysis_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # 🏗️ Определяем архитектурные паттерны с ИИ-помощью
        patterns = []
        if any("component" in f.path.lower() for f in files):
            patterns.append("Component Architecture")
        if any("api" in f.path.lower() or "service" in f.path.lower() for f in files):
            patterns.append("Service Layer")
        if any("test" in f.path.lower() for f in files):
            patterns.append("Test Coverage")
        
        # 📈 Финальная аналитика
        final_result = ProjectAnalysisResult(
            project_path=project_path,
            files=files,
            dependencies=dependencies,
            metrics=metrics,
            architecture_patterns=patterns,
            all_todos=all_project_todos,
            project_documentation=project_docs_list
        )
        
        # 🎯 Логируем финальную статистику
        log_analysis_event(
            EventType.ANALYSIS_COMPLETE,
            project_path=project_path,
            metadata={
                "final_metrics": metrics,
                "patterns_detected": patterns,
                "total_todos": len(all_project_todos),
                "documentation_files": len(project_docs_list)
            },
            session_id=session_id
        )
        
        logger.info(f"🎉 Интеллектуальный анализ проекта завершён успешно!")
        logger.info(f"📊 Итоговая статистика:")
        logger.info(f"   📁 Файлов: {metrics['total_files']}")
        logger.info(f"   📝 Строк кода: {metrics['total_lines']:,}")
        logger.info(f"   ⚙️ Функций: {metrics['total_functions']}")
        logger.info(f"   🔗 Зависимостей: {len(dependencies)}")
        logger.info(f"   📋 TODO элементов: {len(all_project_todos)}")
        logger.info(f"   🏗️ Паттернов: {len(patterns)}")
        
        return final_result
        """Анализ всего проекта с использованием параллельной обработки для повышения скорости"""
        from concurrent.futures import ThreadPoolExecutor, as_completed
        path_obj = Path(project_path)
        
        if not path_obj.exists():
            raise HTTPException(status_code=404, detail="Project path not found")
        
        files = []
        dependencies = []
        file_paths = []
        
        # Сканируем файлы проекта и собираем список для параллельной обработки
        for file_path in path_obj.rglob("*"):
            if file_path.is_file() and file_path.suffix in ['.js', '.ts', '.tsx', '.jsx', '.py', '.html', '.css']:
                # Пропускаем node_modules и другие служебные папки
                if any(part in str(file_path) for part in ['node_modules', '.git', 'dist', 'build', '__pycache__']):
                    continue
                file_paths.append(str(file_path))
        
        # Ограничиваем количество файлов для анализа, чтобы избежать перегрузки
        max_files = 500
        if len(file_paths) > max_files:
            print(f"Project has {len(file_paths)} files, limiting analysis to first {max_files} files for performance.")
            file_paths = file_paths[:max_files]
        
        # Параллельная обработка файлов с индикатором прогресса
        total_files = len(file_paths)
        processed_files = 0
        print(f"Starting analysis of {total_files} files...")
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_path = {executor.submit(CodeAnalyzer.analyze_file, path): path for path in file_paths}
            for future in as_completed(future_to_path):
                path = future_to_path[future]
                try:
                    file_info = future.result()
                    files.append(file_info)
                    processed_files += 1
                    print(f"Processed {processed_files}/{total_files} files ({(processed_files/total_files)*100:.1f}%) - {path}")
                except Exception as e:
                    print(f"Error analyzing {path}: {e}")
        print("Analysis complete.")
        
        # Строим граф зависимостей, собираем все TODOs и документацию
        all_project_todos = []
        project_docs_list: List[DocFile] = []

        for file_info in files:
            # Dependencies
            for import_path in file_info.imports:
                dependencies.append({
                    "from": file_info.path,
                    "to": import_path,
                    "type": "import"
                })
            # Aggregate TODOs
            if file_info.todos:
                for todo in file_info.todos:
                    all_project_todos.append({
                        "file_path": file_info.path,
                        "line": todo["line"],
                        "type": todo["type"],
                        "content": todo["content"],
                        "priority": todo.get("priority")
                    })
            # Aggregate Documentation
            if file_info.doc_details and len(file_info.doc_details) > 0:
                project_docs_list.append(DocFile(
                    file_path=file_info.path,
                    functions=file_info.doc_details
                ))
        
        # Вычисляем метрики
        total_lines = sum(f.lines_of_code or 0 for f in files)
        total_functions = sum(len(f.functions) for f in files)
        
        metrics = {
            "total_files": len(files),
            "total_lines": total_lines,
            "total_functions": total_functions,
            "avg_lines_per_file": total_lines / len(files) if files else 0,
            "languages": list(set(f.type for f in files if f.type != "unknown"))
        }
        
        # Определяем архитектурные паттерны (упрощенно)
        patterns = []
        if any("component" in f.path.lower() for f in files):
            patterns.append("Component Architecture")
        if any("api" in f.path.lower() or "service" in f.path.lower() for f in files):
            patterns.append("Service Layer")
        if any("test" in f.path.lower() for f in files):
            patterns.append("Test Coverage")
        
        return ProjectAnalysisResult(
            project_path=project_path,
            files=files,
            dependencies=dependencies,
            metrics=metrics,
            architecture_patterns=patterns,
            all_todos=all_project_todos,
            project_documentation=project_docs_list
        )

# API Endpoints
@app.get("/")
async def root():
    """Главная страница API"""
    return {
        "message": "MCP Code Analyzer API",
        "version": "0.1.0",
        "status": "running",
        "endpoints": {
            "docs": "/docs",
            "analyze": "/api/analyze",
            "explain": "/api/explain",
            "projects": "/api/projects"
        }
    }

@app.post("/api/analyze", response_model=ProjectAnalysisResult)
async def analyze_project(request: ProjectAnalysisRequest):
    """
    🚀 Интеллектуальный анализ проекта с полным мониторингом
    Комплексная система анализа кода с AI интеграцией и детальным отслеживанием
    """
    
    # 🆔 Генерируем уникальный ID сессии для отслеживания
    session_id = str(uuid.uuid4())
    
    try:
        # 🎯 Начинаем отслеживание всей операции анализа
        async with analytics_logger.track_operation(
            EventType.ANALYSIS_START,
            project_path=request.path,
            metadata={
                "include_tests": request.include_tests,
                "analysis_depth": request.analysis_depth,
                "request_timestamp": datetime.now().isoformat()
            },
            session_id=session_id
        ) as operation_id:
            
            # 📊 Логируем начало анализа
            logger.info(f"🚀 Начинаем интеллектуальный анализ проекта: {request.path}")
            logger.info(f"📋 Параметры анализа: глубина={request.analysis_depth}, тесты={request.include_tests}")
            logger.info(f"🆔 ID сессии: {session_id}")
            
            # 🔍 Запускаем анализ с мониторингом
            result = await CodeAnalyzer.analyze_project_monitored(
                request.path, 
                session_id,
                include_tests=request.include_tests,
                analysis_depth=request.analysis_depth
            )
            
            # 💾 Сохраняем результат в базу с метаданными
            conn = sqlite3.connect("code_analyzer.db")
            cursor = conn.cursor()
            
            # Сохраняем проект
            cursor.execute("""
                INSERT OR REPLACE INTO projects (name, path, language)
                VALUES (?, ?, ?)
            """, (
                os.path.basename(request.path),
                request.path,
                result.metrics.get("languages", ["unknown"])[0] if result.metrics.get("languages") else "unknown"
            ))
            
            project_id = cursor.lastrowid
            
            # Сохраняем анализ с метаданными сессии
            analysis_metadata = {
                "session_id": session_id,
                "operation_id": operation_id,
                "analysis_depth": request.analysis_depth,
                "include_tests": request.include_tests,
                "completion_time": datetime.now().isoformat()
            }
            
            cursor.execute("""
                INSERT INTO analyses (project_id, analysis_type, results)
                VALUES (?, ?, ?)
            """, (
                project_id, 
                "full_analysis_monitored", 
                json.dumps({
                    **result.dict(),
                    "analysis_metadata": analysis_metadata
                })
            ))
            
            conn.commit()
            conn.close()
            
            # 🎉 Логируем успешное завершение
            analytics_summary = get_analytics_summary(session_id)
            logger.info(f"✅ Анализ проекта завершён успешно!")
            logger.info(f"📊 Результаты: {len(result.files)} файлов, {result.metrics['total_lines']} строк, {result.metrics['total_functions']} функций")
            logger.info(f"📈 Аналитика сессии: {analytics_summary}")
            
            return result
            
    except Exception as e:
        # 🚨 Детальное логирование ошибки
        logger.error(f"❌ Критическая ошибка при анализе проекта {request.path}: {str(e)}")
        
        # Логируем в систему мониторинга
        log_analysis_event(
            EventType.ANALYSIS_ERROR,
            project_path=request.path,
            error_message=str(e),
            error_traceback=traceback.format_exc(),
            metadata={
                "request_params": {
                    "include_tests": request.include_tests,
                    "analysis_depth": request.analysis_depth
                },
                "session_id": session_id
            }
        )
        
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/explain", response_model=CodeExplanation)
async def explain_code(request: CodeExplanationRequest):
    """
    Интеллектуальное объяснение кода с использованием AI.
    Поддерживает OpenAI GPT и Anthropic Claude для генерации объяснений.
    """
    global ai_manager
    
    try:
        # Создаем контекст кода для AI анализа
        context = CodeContext(
            file_path=request.file_path or "unknown",
            file_content=request.code,
            file_type=request.language,
            project_info=request.project_context or {},
            dependencies=[],
            functions=[],
            imports=[],
            architecture_patterns=[],
            lines_of_code=len(request.code.split('\n'))
        )
        
        # Если AI менеджер доступен, используем его
        if ai_manager and ai_manager.services:
            try:
                # Получаем умное объяснение от AI
                ai_response = await ai_manager.explain_code_smart(context, request.level)
                
                if ai_response:
                    # Также получаем предложения по улучшению и паттерны
                    improvements_task = ai_manager.suggest_improvements_smart(context)
                    patterns_task = ai_manager.detect_patterns_smart(context)
                    
                    improvements, patterns = await asyncio.gather(
                        improvements_task, patterns_task, return_exceptions=True
                    )
                    
                    # Обрабатываем результаты (игнорируем ошибки)
                    improvements = improvements if not isinstance(improvements, Exception) else []
                    patterns = patterns if not isinstance(patterns, Exception) else []
                    
                    # Определяем использованный провайдер
                    used_provider = "unknown"
                    for provider, service in ai_manager.services.items():
                        if service.request_count > 0:
                            used_provider = provider.value
                            break
                    
                    return CodeExplanation(
                        explanation=ai_response.explanation,
                        concepts=ai_response.concepts,
                        examples=ai_response.examples,
                        recommendations=ai_response.recommendations,
                        improvements=improvements[:5],  # Ограничиваем количество
                        patterns=patterns[:5],
                        confidence_score=ai_response.confidence_score,
                        ai_provider=used_provider
                    )
                    
            except AIServiceError as e:
                logger.warning(f"AI сервис недоступен: {str(e)}. Используем fallback.")
            except Exception as e:
                logger.error(f"Ошибка AI анализа: {str(e)}. Используем fallback.")
        
        # Fallback: простой анализ без AI
        logger.info("Используется fallback анализ без AI")
        explanation = f"Этот {request.language} код выполняет следующие операции..."
        
        # Простой анализ концепций
        concepts = []
        if "function" in request.code:
            concepts.append("functions")
        if any(keyword in request.code for keyword in ["const", "let", "var"]):
            concepts.append("variables")
        if "import" in request.code:
            concepts.append("modules")
        if "class" in request.code:
            concepts.append("classes")
        if "async" in request.code or "await" in request.code:
            concepts.append("asynchronous programming")
        
        return CodeExplanation(
            explanation=explanation,
            concepts=concepts,
            examples=["Пример 1: базовое использование", "Пример 2: расширенный случай"],
            recommendations=["Добавьте комментарии", "Используйте описательные имена переменных"],
            improvements=[],
            patterns=[],
            confidence_score=0.5,
            ai_provider="fallback"
        )
        
    except Exception as e:
        logger.error(f"Ошибка при объяснении кода: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка при анализе кода: {str(e)}")

@app.post("/api/comprehensive-analysis", response_model=ComprehensiveAnalysisResult)
async def comprehensive_analysis(request: ComprehensiveAnalysisRequest):
    """
    Комплексный AI-анализ файла с использованием всех доступных AI сервисов.
    Предоставляет объяснение, улучшения и обнаружение паттернов.
    """
    global ai_manager
    
    try:
        # Проверяем существование файла
        if not Path(request.file_path).exists():
            raise HTTPException(status_code=404, detail="Файл не найден")
        
        # Анализируем файл
        file_info = CodeAnalyzer.analyze_file(request.file_path)
        
        # Читаем содержимое файла
        with open(request.file_path, 'r', encoding='utf-8') as f:
            file_content = f.read()
        
        # Анализируем проект для контекста
        try:
            project_analysis = CodeAnalyzer.analyze_project(request.project_path)
            project_context = {
                "total_files": project_analysis.metrics["total_files"],
                "total_lines": project_analysis.metrics["total_lines"],
                "languages": project_analysis.metrics["languages"],
                "architecture_patterns": project_analysis.architecture_patterns
            }
        except Exception:
            project_context = {}
        
        # Создаем контекст для AI
        context = CodeContext(
            file_path=request.file_path,
            file_content=file_content,
            file_type=file_info.type,
            project_info=project_context,
            dependencies=[],
            functions=file_info.functions,
            imports=file_info.imports,
            architecture_patterns=project_context.get("architecture_patterns", []),
            lines_of_code=file_info.lines_of_code or 0
        )
        
        # Выполняем комплексный анализ
        if ai_manager and ai_manager.services:
            try:
                results = await ai_manager.comprehensive_analysis(context, request.explanation_level)
                
                # Форматируем результаты
                explanation_data = None
                if results.get("explanation"):
                    explanation_data = {
                        "text": results["explanation"].explanation,
                        "concepts": results["explanation"].concepts,
                        "recommendations": results["explanation"].recommendations,
                        "confidence": results["explanation"].confidence_score
                    }
                
                return ComprehensiveAnalysisResult(
                    explanation=explanation_data,
                    improvements=results.get("improvements", []),
                    patterns=results.get("patterns", []),
                    analysis_metadata=results.get("analysis_metadata", {})
                )
                
            except Exception as e:
                logger.error(f"Ошибка комплексного AI анализа: {str(e)}")
        
        # Fallback анализ
        return ComprehensiveAnalysisResult(
            explanation={
                "text": f"Файл {Path(request.file_path).name} содержит {len(file_info.functions)} функций и {file_info.lines_of_code} строк кода.",
                "concepts": ["file analysis", "code structure"],
                "recommendations": ["AI анализ недоступен"],
                "confidence": 0.3
            },
            improvements=["AI сервисы недоступны для детального анализа"],
            patterns=["Автоматическое обнаружение паттернов недоступно"],
            analysis_metadata={
                "timestamp": "fallback",
                "ai_available": False
            }
        )
        
    except Exception as e:
        logger.error(f"Ошибка комплексного анализа: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai-status")
async def get_ai_status():
    """
    Получение статуса AI сервисов и статистики использования.
    """
    global ai_manager
    
    if not ai_manager:
        return {
            "status": "not_initialized",
            "available_services": [],
            "usage_stats": {}
        }
    
    available_services = []
    for provider in ai_manager.services.keys():
        available_services.append(provider.value)
    
    usage_stats = ai_manager.get_all_usage_stats()
    
    return {
        "status": "initialized" if available_services else "no_services",
        "available_services": available_services,
        "usage_stats": usage_stats,
        "total_requests": sum(stats.get("request_count", 0) for stats in usage_stats.values()),
        "total_tokens": sum(stats.get("total_tokens_used", 0) for stats in usage_stats.values())
    }

@app.get("/api/projects")
async def get_projects():
    """Получение списка проектов"""
    conn = sqlite3.connect("code_analyzer.db")
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, name, path, language, created_at, updated_at
        FROM projects
        ORDER BY updated_at DESC
    """)
    
    projects = []
    for row in cursor.fetchall():
        projects.append({
            "id": row[0],
            "name": row[1],
            "path": row[2],
            "language": row[3],
            "created_at": row[4],
            "updated_at": row[5]
        })
    
    conn.close()
    return {"projects": projects}

@app.get("/api/health")
async def health_check():
    """
    🩺 Расширенная проверка здоровья системы
    Возвращает детальную информацию о состоянии всех компонентов
    """
    try:
        # 🔍 Получаем детальную информацию о здоровье системы
        health_data = get_system_health()
        
        # 🧠 Проверяем статус AI сервисов
        ai_status = "unknown"
        ai_services = []
        
        global ai_manager
        if ai_manager and ai_manager.services:
            ai_status = "healthy"
            for provider, service in ai_manager.services.items():
                ai_services.append({
                    "provider": provider.value,
                    "status": "active",
                    "request_count": getattr(service, 'request_count', 0)
                })
        else:
            ai_status = "unavailable"
        
        # 💾 Проверяем базу данных
        db_status = "unknown"
        try:
            conn = sqlite3.connect("code_analyzer.db")
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM projects")
            projects_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM analyses")
            analyses_count = cursor.fetchone()[0]
            conn.close()
            db_status = "healthy"
        except Exception as e:
            db_status = f"error: {str(e)}"
            projects_count = 0
            analyses_count = 0
        
        # 📊 Формируем комплексный отчёт о здоровье
        comprehensive_health = {
            **health_data,
            "services": {
                "ai_engine": {
                    "status": ai_status,
                    "services": ai_services
                },
                "database": {
                    "status": db_status,
                    "projects_count": projects_count,
                    "analyses_count": analyses_count
                },
                "monitoring": {
                    "status": "active",
                    "events_logged": len(analytics_logger.events),
                    "active_sessions": len(analytics_logger.session_stats)
                }
            },
            "api_info": {
                "version": "0.2.0",
                "uptime_events": len(analytics_logger.events),
                "last_restart": datetime.now(timezone.utc).isoformat()
            }
        }
        
        return comprehensive_health
        
    except Exception as e:
        logger.error(f"❌ Ошибка при проверке здоровья системы: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

@app.get("/api/analytics")
async def get_system_analytics(session_id: Optional[str] = None):
    """
    📊 Получение детальной аналитики системы
    Предоставляет метрики производительности и статистику использования
    """
    try:
        # 🎯 Получаем аналитическую сводку
        analytics_data = get_analytics_summary(session_id)
        
        # 📈 Добавляем дополнительные метрики
        recent_events = analytics_logger.events[-50:] if len(analytics_logger.events) > 50 else analytics_logger.events
        
        # 🔥 Анализ производительности за последние события
        performance_events = [e for e in recent_events if e.performance_metrics]
        
        performance_trends = {
            "avg_cpu_usage": 0,
            "avg_memory_usage": 0,
            "peak_cpu_usage": 0,
            "peak_memory_usage": 0,
            "events_analyzed": len(performance_events)
        }
        
        if performance_events:
            cpu_values = [e.performance_metrics.cpu_usage for e in performance_events]
            memory_values = [e.performance_metrics.memory_usage for e in performance_events]
            
            performance_trends.update({
                "avg_cpu_usage": sum(cpu_values) / len(cpu_values),
                "avg_memory_usage": sum(memory_values) / len(memory_values),
                "peak_cpu_usage": max(cpu_values),
                "peak_memory_usage": max(memory_values)
            })
        
        # 📋 Статистика по типам событий
        event_types_stats = {}
        for event in recent_events:
            event_type = event.event_type.value
            if event_type not in event_types_stats:
                event_types_stats[event_type] = 0
            event_types_stats[event_type] += 1
        
        # 🎯 Формируем полный отчёт аналитики
        comprehensive_analytics = {
            **analytics_data,
            "performance_trends": performance_trends,
            "event_types_distribution": event_types_stats,
            "recent_events_count": len(recent_events),
            "system_insights": {
                "most_common_event": max(event_types_stats.items(), key=lambda x: x[1])[0] if event_types_stats else "none",
                "analysis_success_rate": (
                    (analytics_data.get("total_events", 0) - (analytics_data.get("total_events", 0) * analytics_data.get("error_rate", 0) / 100)) / 
                    max(analytics_data.get("total_events", 1), 1) * 100
                ) if analytics_data.get("total_events", 0) > 0 else 100
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return comprehensive_analytics
        
    except Exception as e:
        logger.error(f"❌ Ошибка при получении аналитики: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка получения аналитики: {str(e)}")

@app.get("/api/monitoring/events")
async def get_recent_events(limit: int = 50, event_type: Optional[str] = None):
    """
    📋 Получение последних событий мониторинга
    Позволяет просматривать детальные логи системы в реальном времени
    """
    try:
        # 🔍 Фильтруем события по типу (если указан)
        events = analytics_logger.events
        
        if event_type:
            try:
                target_event_type = EventType(event_type)
                events = [e for e in events if e.event_type == target_event_type]
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Неизвестный тип события: {event_type}")
        
        # 📝 Получаем последние события
        recent_events = events[-limit:] if len(events) > limit else events
        
        # 📊 Формируем ответ с метаданными
        formatted_events = []
        for event in recent_events:
            formatted_event = {
                "event_id": event.event_id,
                "event_type": event.event_type.value,
                "timestamp": event.timestamp.isoformat(),
                "project_path": event.project_path,
                "file_path": event.file_path,
                "duration_ms": event.duration_ms,
                "error_message": event.error_message,
                "metadata": event.metadata or {},
                "performance_metrics": event.performance_metrics.__dict__ if event.performance_metrics else None
            }
            formatted_events.append(formatted_event)
        
        return {
            "events": formatted_events,
            "total_events_available": len(events),
            "events_returned": len(formatted_events),
            "filter_applied": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Ошибка при получении событий мониторинга: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка получения событий: {str(e)}")

@app.get("/api/monitoring/sessions/{session_id}")
async def get_session_details(session_id: str):
    """
    🔍 Детальная информация о конкретной сессии анализа
    Предоставляет полную историю и метрики для отладки и оптимизации
    """
    try:
        # 🎯 Получаем события конкретной сессии
        session_events = [e for e in analytics_logger.events if e.user_session_id == session_id]
        
        if not session_events:
            raise HTTPException(status_code=404, detail=f"Сессия {session_id} не найдена")
        
        # 📊 Вычисляем статистику сессии
        session_stats = analytics_logger.session_stats.get(session_id, {})
        
        # ⏱️ Анализ временных характеристик
        start_time = min(e.timestamp for e in session_events)
        end_time = max(e.timestamp for e in session_events)
        total_duration = (end_time - start_time).total_seconds() * 1000  # в миллисекундах
        
        # 📈 Производительность сессии
        performance_data = []
        for event in session_events:
            if event.performance_metrics:
                performance_data.append({
                    "timestamp": event.timestamp.isoformat(),
                    "cpu_usage": event.performance_metrics.cpu_usage,
                    "memory_usage": event.performance_metrics.memory_usage,
                    "event_type": event.event_type.value
                })
        
        # 🎯 Формируем детальный отчёт по сессии
        session_details = {
            "session_id": session_id,
            "session_stats": session_stats,
            "timeline": {
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "total_duration_ms": total_duration,
                "events_count": len(session_events)
            },
            "events_timeline": [
                {
                    "event_id": e.event_id,
                    "event_type": e.event_type.value,
                    "timestamp": e.timestamp.isoformat(),
                    "duration_ms": e.duration_ms,
                    "file_path": e.file_path,
                    "error_message": e.error_message,
                    "metadata": e.metadata or {}
                }
                for e in session_events
            ],
            "performance_timeline": performance_data,
            "error_analysis": {
                "total_errors": len([e for e in session_events if e.error_message]),
                "error_types": list(set(e.error_message for e in session_events if e.error_message))
            },
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
        return session_details
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Ошибка при получении деталей сессии {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка получения деталей сессии: {str(e)}")

@app.delete("/api/monitoring/events")
async def clear_monitoring_logs():
    """
    🧹 Очистка логов мониторинга
    Административная функция для очистки накопленных данных мониторинга
    """
    try:
        events_count = len(analytics_logger.events)
        sessions_count = len(analytics_logger.session_stats)
        
        # 🗑️ Очищаем все данные
        analytics_logger.events.clear()
        analytics_logger.session_stats.clear()
        analytics_logger.active_operations.clear()
        
        logger.info(f"🧹 Логи мониторинга очищены: {events_count} событий, {sessions_count} сессий")
        
        return {
            "message": "Логи мониторинга успешно очищены",
            "cleared_events": events_count,
            "cleared_sessions": sessions_count,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Ошибка при очистке логов мониторинга: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка очистки логов: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Проверка здоровья API"""
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}

# Инициализация при запуске
@app.on_event("startup")
async def startup_event():
    global ai_manager
    
    # Инициализация базы данных
    init_database()
    
    # Инициализация AI сервисов
    try:
        ai_manager = initialize_ai_services()
        if ai_manager.services:
            logger.info(f"🤖 AI сервисы инициализированы: {list(ai_manager.services.keys())}")
        else:
            logger.warning("⚠️ AI сервисы не настроены. Установите OPENAI_API_KEY или ANTHROPIC_API_KEY в переменных окружения.")
    except Exception as e:
        logger.error(f"❌ Ошибка инициализации AI сервисов: {str(e)}")
        ai_manager = None
    
    print("🚀 MCP Code Analyzer API с AI интеграцией запущен!")
    print("📖 Документация: http://localhost:8000/docs")
    print("🤖 AI статус: http://localhost:8000/api/ai-status")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
