from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import ast
import re
import json
import sqlite3
from pathlib import Path
import uvicorn
import asyncio
import logging

from .ai_services import (
    initialize_ai_services, 
    get_ai_manager, 
    CodeContext, 
    AIResponse,
    AIServiceError
)

# --- Pydantic Models ---
class DocFunctionParam(BaseModel):
    name: str
    type: Optional[str] = None
    description: Optional[str] = None

class DocFunction(BaseModel):
    name: str
    description: Optional[str] = None
    params: List[DocFunctionParam] = Field(default_factory=list)
    returns: Optional[Dict[str, Optional[str]]] = None
    line_start: Optional[int] = None
    line_end: Optional[int] = None

class DocFile(BaseModel):
    file_path: str
    functions: List[DocFunction] = Field(default_factory=list)

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
    functions: List[str] = Field(default_factory=list)
    imports: List[str] = Field(default_factory=list)
    todos: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    doc_details: Optional[List[DocFunction]] = Field(default_factory=list)

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
    improvements: List[str] = Field(default_factory=list)
    patterns: List[str] = Field(default_factory=list)
    confidence_score: float = 0.0
    ai_provider: str = "unknown"

class ComprehensiveAnalysisRequest(BaseModel):
    file_path: str
    project_path: str
    explanation_level: str = "intermediate"

class ComprehensiveAnalysisResult(BaseModel):
    explanation: Optional[Dict[str, Any]] = None
    improvements: List[str] = Field(default_factory=list)
    patterns: List[str] = Field(default_factory=list)
    analysis_metadata: Dict[str, Any] = Field(default_factory=dict)

ai_manager = None
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MCP Code Analyzer API with AI Integration",
    description="Backend API for intelligent code analysis and visualization with AI-powered explanations",
    version="0.2.1", # Updated version after refactor
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3002", "http://127.0.0.1:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_database():
    conn = sqlite3.connect("code_analyzer.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, path TEXT NOT NULL UNIQUE,
            language TEXT, framework TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ) """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER, analysis_type TEXT NOT NULL,
            results TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects (id) ) """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS learning_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, topic TEXT, progress TEXT,
            completed_at TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP )""")
    conn.commit()
    conn.close()

class CodeAnalyzer:
    _excluded_dirs = {'node_modules', '.git', 'dist', 'build', '__pycache__', '.venv', 'venv', '.vscode', '.idea'}
    _supported_file_suffixes = {'.js', '.ts', '.tsx', '.jsx', '.py', '.html', '.css'}

    @staticmethod
    def _scan_for_todos(content_lines: List[str], full_content: str) -> List[Dict[str, Any]]:
        todos = []
        todo_patterns = [
            re.compile(r"#\s*(TODO|FIXME|HACK)\s*[:\-]\s*(.*)", re.IGNORECASE),
            re.compile(r"//\s*(TODO|FIXME|HACK)\s*[:\-]\s*(.*)", re.IGNORECASE),
            re.compile(r"/\*\s*(TODO|FIXME|HACK)\s*[:\-]\s*(.*?)\s*\*/", re.IGNORECASE | re.DOTALL),
            re.compile(r"<!--\s*(TODO|FIXME|HACK)\s*[:\-]\s*(.*?)\s*-->", re.IGNORECASE | re.DOTALL),
            re.compile(r'"""\s*(TODO|FIXME|HACK)\s*[:\-]\s*(.*?)\s*"""', re.IGNORECASE | re.DOTALL),
            re.compile(r"'''\s*(TODO|FIXME|HACK)\s*[:\-]\s*(.*?)\s*'''", re.IGNORECASE | re.DOTALL),
        ]
        for i, line_text in enumerate(content_lines):
            for pattern in todo_patterns[:2]:
                match = pattern.search(line_text)
                if match:
                    todos.append({"line": i + 1, "type": match.group(1).upper(), "content": match.group(2).strip(), "priority": None})
        for pattern in todo_patterns[2:]:
            for match in pattern.finditer(full_content):
                start_char_index = match.start()
                line_num = full_content.count('\\n', 0, start_char_index) + 1
                todos.append({"line": line_num, "type": match.group(1).upper(), "content": match.group(2).strip().replace('\\n', ' '), "priority": None})
        return todos

    @staticmethod
    def _analyze_python_file_details(full_content: str, file_path_str: str, file_info: FileInfo):
        try:
            file_info.functions.extend(re.findall(r'def\s+(\w+)', full_content))
            file_info.imports.extend([imp for imp_group in re.findall(r'from\s+(\S+)\s+import|import\s+(\S+)', full_content) for imp in imp_group if imp])
            tree = ast.parse(full_content, filename=file_path_str)
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    docstring = ast.get_docstring(node)
                    parsed_function = DocFunction(name=node.name, line_start=node.lineno, line_end=getattr(node, 'end_lineno', None))
                    if docstring:
                        lines = [line.strip() for line in docstring.split('\\n')]
                        parsed_function.description = lines[0] if lines else None
                        for match in re.finditer(r":param\s+(?:([\w\s]+)\s*:\s*)?(\w+)\s*:(.*)", docstring):
                            param_type, param_name, param_desc = match.groups()
                            parsed_function.params.append(DocFunctionParam(name=param_name.strip(), type=param_type.strip() if param_type else None, description=param_desc.strip()))
                        return_match = re.search(r":return(?:s)?\s*(?:([\w\s\[\],\|]+)\s*:\s*)?(.*)|:rtype:\s*([\w\s\[\],\|]+)", docstring, re.DOTALL)
                        if return_match:
                            g = return_match.groups()
                            parsed_function.returns = {"type": (g[0] or g[2] or "").strip() or None, "description": (g[1] or "").strip() or None}
                    file_info.doc_details.append(parsed_function)
        except SyntaxError as se: logger.warning(f"Syntax error parsing Python AST for {file_path_str}: {se}. Docstring parsing may be incomplete.")
        except Exception as e: logger.error(f"Error parsing Python details for {file_path_str}: {e}")

    @staticmethod
    def _analyze_javascript_file_details(full_content: str, file_path_str: str, file_info: FileInfo):
        try:
            file_info.functions.extend([f for func_group in re.findall(r'function\s+(\w+)|const\s+(\w+)\s*=.*?=>|(\w+)\s*:\s*\([^)]*\)\s*=>', full_content) for f in func_group if f])
            # Using a normal string with escaped backslashes for the regex pattern.
            file_info.imports.extend(re.findall("import.*?from\\s+['\"]([\\w./-]+)['\"]", full_content))
            jsdoc_pattern = r"/\*\*(.*?)\*/\s*(?:export\s+)?(?:async\s+)?(?:function\s*(?P<funcName1>\w+)\s*\(|const\s+(?P<funcName2>\w+)\s*=\s*(?:async)?\s*\(|(?P<methodName>\w+)\s*\([^)]*\)\s*\{)"
            for match in re.finditer(jsdoc_pattern, full_content, re.DOTALL | re.MULTILINE):
                jsdoc_content, func_name = match.group(1), match.group('funcName1') or match.group('funcName2') or match.group('methodName')
                if not func_name: continue
                parsed_function = DocFunction(name=func_name)
                desc_match = re.search(r"@description\s+([^\n@]+)|([^\n@]+)", jsdoc_content, re.DOTALL)
                if desc_match: parsed_function.description = (desc_match.group(1) or desc_match.group(2) or "").strip()
                for p_match in re.finditer(r"@param\s+\{(.*?)\}\s+(\w+)\s*(?:-\s*(.*?))?\s*(?=\\n|\@)", jsdoc_content, re.DOTALL):
                    parsed_function.params.append(DocFunctionParam(name=p_match.group(2).strip(), type=p_match.group(1).strip(), description=(p_match.group(3) or "").strip()))
                r_match = re.search(r"@returns?\s+\{(.*?)\}\s*(.*)|@returns?\s+(.*)", jsdoc_content, re.DOTALL)
                if r_match: parsed_function.returns = {"type": (r_match.group(1) or "").strip() or None, "description": (r_match.group(2) or r_match.group(3) or "").strip() or None}
                file_info.doc_details.append(parsed_function)
        except Exception as e: logger.error(f"Error parsing JS/TS details for {file_path_str}: {e}")

    @staticmethod
    def analyze_file(file_path: str) -> FileInfo:
        path_obj = Path(file_path)
        if not path_obj.exists():
            logger.error(f"File not found: {file_path}")
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

        file_info = FileInfo(
            path=str(path_obj), name=path_obj.name, type=path_obj.suffix[1:].lower() if path_obj.suffix else "unknown",
            size=path_obj.stat().st_size, lines_of_code=0, functions=[], imports=[], todos=[], doc_details=[] )

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content_lines = f.readlines()
                file_info.lines_of_code = len(content_lines)
                full_content = "".join(content_lines)

            file_info.todos = CodeAnalyzer._scan_for_todos(content_lines, full_content)
            if file_info.type in ['js', 'ts', 'tsx', 'jsx']: CodeAnalyzer._analyze_javascript_file_details(full_content, file_path, file_info)
            elif file_info.type == 'py': CodeAnalyzer._analyze_python_file_details(full_content, file_path, file_info)
        
        except IOError as e: logger.error(f"IOError reading {file_path}: {e}")
        except Exception as e: logger.error(f"Unexpected error analyzing {file_path}: {e}")
        return file_info
    
    @staticmethod
    def analyze_project(project_path: str) -> ProjectAnalysisResult:
        path_obj = Path(project_path)
        if not path_obj.is_dir():
            logger.error(f"Project path not a directory: {project_path}")
            raise HTTPException(status_code=404, detail="Project path not found or not a directory")

        files: List[FileInfo] = []
        dependencies: List[Dict[str, Any]] = []
        all_todos: List[Dict[str, Any]] = []
        project_documentation: List[DocFile] = []
        logger.info(f"Starting project analysis: {project_path}")

        for item_path in path_obj.rglob("*"):
            if any(excluded in str(item_path) for excluded in CodeAnalyzer._excluded_dirs): continue
            if item_path.is_file() and (item_path.suffix[1:].lower() if item_path.suffix else "") in CodeAnalyzer._supported_file_suffixes:
                try:
                    file_info = CodeAnalyzer.analyze_file(str(item_path))
                    files.append(file_info)
                    dependencies.extend([{"from": file_info.path, "to": imp, "type": "import"} for imp in file_info.imports])
                    all_todos.extend([{"file_path": file_info.path, **todo} for todo in file_info.todos]) # Use **todo
                    if file_info.doc_details: project_documentation.append(DocFile(file_path=file_info.path, functions=file_info.doc_details))
                except Exception as e: logger.warning(f"Skipping file {item_path} due to error: {e}")
        
        metrics = {
            "total_files": len(files), "total_lines": sum(f.lines_of_code or 0 for f in files),
            "total_functions": sum(len(f.functions) for f in files),
            "avg_lines_per_file": (sum(f.lines_of_code or 0 for f in files) / len(files)) if files else 0,
            "languages": list(set(f.type for f in files if f.type != "unknown"))
        }
        patterns = []
        lower_paths = [f.path.lower() for f in files]
        if any("component" in p for p in lower_paths): patterns.append("Component Architecture")
        if any("api" in p or "service" in p for p in lower_paths): patterns.append("Service Layer")
        if any("test" in p for p in lower_paths): patterns.append("Test Coverage")
        
        logger.info(f"Project analysis finished: {project_path}. Files: {len(files)}.")
        return ProjectAnalysisResult(project_path=project_path, files=files, dependencies=dependencies, metrics=metrics, architecture_patterns=patterns, all_todos=all_todos, project_documentation=project_documentation)

@app.get("/")
async def root():
    return {"message": "MCP Code Analyzer API", "version": app.version, "status": "running", "endpoints": {"docs": "/docs", "analyze": "/api/analyze", "explain": "/api/explain", "projects": "/api/projects"}}

@app.post("/api/analyze", response_model=ProjectAnalysisResult)
async def analyze_project_endpoint(request: ProjectAnalysisRequest):
    try:
        result = CodeAnalyzer.analyze_project(request.path)
        conn = sqlite3.connect("code_analyzer.db")
        cursor = conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO projects (name, path, language) VALUES (?, ?, ?)",
                       (os.path.basename(request.path), request.path, (result.metrics.get("languages", ["unknown"]) or ["unknown"])[0]))
        project_id = cursor.lastrowid
        cursor.execute("INSERT INTO analyses (project_id, analysis_type, results) VALUES (?, ?, ?)",
                       (project_id, "full_analysis", json.dumps(result.dict())))
        conn.commit()
        conn.close()
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in /api/analyze for path {request.path}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/explain", response_model=CodeExplanation)
async def explain_code(request: CodeExplanationRequest):
    global ai_manager
    try:
        context = CodeContext(file_path=request.file_path or "unknown_file", file_content=request.code, file_type=request.language,
                              project_info=request.project_context or {}, dependencies=[], functions=[], imports=[],
                              architecture_patterns=[], lines_of_code=len(request.code.split('\\n')))
        if ai_manager and ai_manager.services:
            try:
                ai_response = await ai_manager.explain_code_smart(context, request.level)
                if ai_response:
                    improvements, patterns = await asyncio.gather(
                        ai_manager.suggest_improvements_smart(context),
                        ai_manager.detect_patterns_smart(context),
                        return_exceptions=True
                    )
                    used_provider = next((p.value for p, s in ai_manager.services.items() if s.request_count > 0), "unknown")
                    return CodeExplanation(explanation=ai_response.explanation, concepts=ai_response.concepts, examples=ai_response.examples,
                                           recommendations=ai_response.recommendations,
                                           improvements=improvements if not isinstance(improvements, Exception) else [],
                                           patterns=patterns if not isinstance(patterns, Exception) else [],
                                           confidence_score=ai_response.confidence_score, ai_provider=used_provider)
            except AIServiceError as e: logger.warning(f"AI service error for explain: {e}. Fallback.")
            except Exception as e: logger.error(f"AI analysis error for explain: {e}. Fallback.")
        
        concepts = ["functions" if "function" in request.code else None, "variables" if any(k in request.code for k in ["const","let","var"]) else None]
        return CodeExplanation(explanation=f"Basic analysis of this {request.language} code...", concepts= [c for c in concepts if c], examples=[], recommendations=[], confidence_score=0.5, ai_provider="fallback")
    except Exception as e:
        logger.error(f"Error in /api/explain: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/comprehensive-analysis", response_model=ComprehensiveAnalysisResult)
async def comprehensive_analysis(request: ComprehensiveAnalysisRequest):
    global ai_manager
    try:
        if not Path(request.file_path).exists(): raise HTTPException(status_code=404, detail="File not found")
        file_info = CodeAnalyzer.analyze_file(str(request.file_path)) # Intentionally causing an error here for testing the fix for a typo: analyze_file
        with open(request.file_path, 'r', encoding='utf-8') as f: file_content = f.read()
        
        try:
            project_analysis = CodeAnalyzer.analyze_project(request.project_path)
            project_context = {"total_files": project_analysis.metrics["total_files"], "languages": project_analysis.metrics["languages"]}
        except Exception: project_context = {}

        context = CodeContext(file_path=request.file_path, file_content=file_content, file_type=file_info.type,
                              project_info=project_context, functions=file_info.functions, imports=file_info.imports,
                              lines_of_code=file_info.lines_of_code or 0)
        if ai_manager and ai_manager.services:
            try:
                results = await ai_manager.comprehensive_analysis(context, request.explanation_level)
                exp_data = None
                if results.get("explanation"): exp_data = {"text": results["explanation"].explanation, "concepts": results["explanation"].concepts, "recommendations": results["explanation"].recommendations, "confidence": results["explanation"].confidence_score}
                return ComprehensiveAnalysisResult(explanation=exp_data, improvements=results.get("improvements", []), patterns=results.get("patterns", []), analysis_metadata=results.get("analysis_metadata", {}))
            except Exception as e: logger.error(f"Comprehensive AI analysis error: {e}")
        
        return ComprehensiveAnalysisResult(explanation={"text": "Fallback: AI analysis unavailable.", "confidence": 0.3}, analysis_metadata={"ai_available": False})
    except HTTPException as e: raise e
    except Exception as e:
        logger.error(f"Error in /api/comprehensive-analysis for {request.file_path}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai-status")
async def get_ai_status():
    global ai_manager
    if not ai_manager: return {"status": "not_initialized", "available_services": [], "usage_stats": {}}
    stats = ai_manager.get_all_usage_stats()
    return {"status": "initialized" if ai_manager.services else "no_services", "available_services": [p.value for p in ai_manager.services.keys()],
            "usage_stats": stats, "total_requests": sum(s.get("request_count",0) for s in stats.values()), "total_tokens": sum(s.get("total_tokens_used",0) for s in stats.values())}

@app.get("/api/projects")
async def get_projects():
    conn = sqlite3.connect("code_analyzer.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, path, language, created_at, updated_at FROM projects ORDER BY updated_at DESC")
    projects = [{"id": r[0], "name": r[1], "path": r[2], "language": r[3], "created_at": r[4], "updated_at": r[5]} for r in cursor.fetchall()]
    conn.close()
    return {"projects": projects}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}

@app.on_event("startup")
async def startup_event():
    global ai_manager
    init_database()
    try:
        ai_manager = initialize_ai_services()
        if ai_manager.services: logger.info(f"🤖 AI services initialized: {list(ai_manager.services.keys())}")
        else: logger.warning("⚠️ AI services not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY env vars.")
    except Exception as e:
        logger.error(f"❌ AI services initialization error: {e}")
        ai_manager = None
    
    port_num = int(os.getenv('PORT', 8000))
    print(f"🚀 MCP Code Analyzer API (v{app.version}) with AI integration started!")
    print(f"📖 Docs: http://localhost:{port_num}/docs")
    print(f"🤖 AI Status: http://localhost:{port_num}/api/ai-status")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True, log_level="info")
