from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
import sqlite3
from pathlib import Path
import uvicorn
import asyncio
import logging

# Импорт AI сервисов
from ai_services import (
    initialize_ai_services, 
    get_ai_manager, 
    CodeContext, 
    AIResponse,
    AIServiceError
)

# Модели данных
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
    functions: List[str] = []
    imports: List[str] = []

class ProjectAnalysisResult(BaseModel):
    project_path: str
    files: List[FileInfo]
    dependencies: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    architecture_patterns: List[str]

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

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3002", "http://127.0.0.1:3002"],
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
            imports=[]
        )
        
        # Анализ содержимого для JS/TS/Python файлов
        if path_obj.suffix in ['.js', '.ts', '.tsx', '.jsx', '.py']:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    file_info.lines_of_code = len(content.split('\n'))
                    
                    # Простой поиск функций (можно улучшить)
                    if path_obj.suffix in ['.js', '.ts', '.tsx', '.jsx']:
                        # JavaScript/TypeScript функции
                        import re
                        functions = re.findall(r'function\s+(\w+)|const\s+(\w+)\s*=.*?=>|(\w+)\s*:\s*\([^)]*\)\s*=>', content)
                        file_info.functions = [f for func_group in functions for f in func_group if f]
                        
                        # Импорты
                        imports = re.findall(r'import.*?from\s+[\'"]([^\'"]+)[\'"]', content)
                        file_info.imports = imports
                    
                    elif path_obj.suffix == '.py':
                        # Python функции
                        import re
                        functions = re.findall(r'def\s+(\w+)', content)
                        file_info.functions = functions
                        
                        # Импорты
                        imports = re.findall(r'from\s+(\S+)\s+import|import\s+(\S+)', content)
                        file_info.imports = [imp for imp_group in imports for imp in imp_group if imp]
                        
            except Exception as e:
                print(f"Error analyzing file {file_path}: {e}")
        
        return file_info
    
    @staticmethod
    def analyze_project(project_path: str) -> ProjectAnalysisResult:
        """Анализ всего проекта"""
        path_obj = Path(project_path)
        
        if not path_obj.exists():
            raise HTTPException(status_code=404, detail="Project path not found")
        
        files = []
        dependencies = []
        
        # Сканируем файлы проекта
        for file_path in path_obj.rglob("*"):
            if file_path.is_file() and file_path.suffix in ['.js', '.ts', '.tsx', '.jsx', '.py', '.html', '.css']:
                # Пропускаем node_modules и другие служебные папки
                if any(part in str(file_path) for part in ['node_modules', '.git', 'dist', 'build', '__pycache__']):
                    continue
                
                try:
                    file_info = CodeAnalyzer.analyze_file(str(file_path))
                    files.append(file_info)
                except Exception as e:
                    print(f"Error analyzing {file_path}: {e}")
        
        # Строим граф зависимостей
        for file_info in files:
            for import_path in file_info.imports:
                dependencies.append({
                    "from": file_info.path,
                    "to": import_path,
                    "type": "import"
                })
        
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
            architecture_patterns=patterns
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
    """Анализ проекта"""
    try:
        result = CodeAnalyzer.analyze_project(request.path)
        
        # Сохраняем результат в базу
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
        
        # Сохраняем анализ
        cursor.execute("""
            INSERT INTO analyses (project_id, analysis_type, results)
            VALUES (?, ?, ?)
        """, (project_id, "full_analysis", json.dumps(result.dict())))
        
        conn.commit()
        conn.close()
        
        return result
        
    except Exception as e:
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
