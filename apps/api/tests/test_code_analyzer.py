import pytest
import os
from pathlib import Path
from fastapi import HTTPException

# Adjust import path based on execution context of tests
try:
    # This assumes that the directory containing 'apps' (e.g. the project root) is in PYTHONPATH
    from apps.api.main import CodeAnalyzer, FileInfo, DocFunction, DocFunctionParam
except ImportError as e_initial:
    try:
        import sys
        current_file_path = Path(__file__).resolve() # /app/apps/api/tests/test_code_analyzer.py
        # Navigate up to the project root directory (which should contain 'apps')
        # /app/apps/api/tests -> /app/apps/api -> /app/apps -> /app
        project_root = current_file_path.parent.parent.parent

        if str(project_root) not in sys.path:
            sys.path.insert(0, str(project_root))
            # print(f"Initial ImportError: {e_initial}") # For debugging
            # print(f"Fallback: Added {project_root} to sys.path. New sys.path: {sys.path}") # For debugging

        # Now try the import again with the adjusted path
        from apps.api.main import CodeAnalyzer, FileInfo, DocFunction, DocFunctionParam
    except ImportError as e_fallback:
        # If it still fails, print out more debug information if possible
        # print(f"Fallback ImportError after adding {project_root}: {e_fallback}") # For debugging
        # print(f"Working directory: {os.getcwd()}") # For debugging
        # print(f"PYTHONPATH: {os.getenv('PYTHONPATH')}") # For debugging
        # It's possible the test runner or environment has a very specific structure.
        # For now, we re-raise the fallback error if path adjustment didn't work.
        raise e_fallback


# Helper to create a temporary file with content
def create_temp_file(dir_path: Path, file_name: str, content: str):
    file_path = dir_path / file_name
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    return file_path

@pytest.fixture(scope="module")
def temp_test_dir(tmp_path_factory):
    # Create a unique temporary directory for this test module
    test_dir = tmp_path_factory.mktemp("code_analyzer_tests")
    return test_dir

def test_analyze_simple_python_file(temp_test_dir):
    file_content = """
import os
from typing import List

def hello_world():
    print("Hello")

class MyClass:
    def method_one(self):
        pass
"""
    file_path = create_temp_file(temp_test_dir, "simple.py", file_content)

    analyzer = CodeAnalyzer()
    file_info = analyzer.analyze_file(str(file_path))

    assert file_info.name == "simple.py"
    assert file_info.type == "py"
    assert file_info.lines_of_code == 9 # Includes blank lines
    assert "hello_world" in file_info.functions
    assert "method_one" in file_info.functions
    assert "os" in file_info.imports
    assert "typing" in file_info.imports

    os.remove(file_path)

def test_analyze_simple_js_file(temp_test_dir):
    file_content = """
import fs from 'fs';

function greet(name) {
    console.log(`Hello, ${name}`);
}

const arrowFunc = () => {
    return "test";
};
"""
    file_path = create_temp_file(temp_test_dir, "simple.js", file_content)
    analyzer = CodeAnalyzer()
    file_info = analyzer.analyze_file(str(file_path))

    assert file_info.name == "simple.js"
    assert file_info.type == "js"
    assert "greet" in file_info.functions
    assert "arrowFunc" in file_info.functions
    assert "fs" in file_info.imports

    os.remove(file_path)

def test_analyze_todo_comments(temp_test_dir):
    file_content = """
# TODO: Fix this later
# FIXME: This is broken

# HACK: Temporary solution

def some_func():
    // TODO: Implement this
    pass

/*
TODO: Multiline todo
Another line for todo
*/

# TODO - Another format
"""
    file_path = create_temp_file(temp_test_dir, "todos.py", file_content)
    analyzer = CodeAnalyzer()
    file_info = analyzer.analyze_file(str(file_path))

    assert len(file_info.todos) >= 5

    todo_contents = [todo['content'].lower() for todo in file_info.todos]
    assert "fix this later" in todo_contents
    assert "this is broken" in todo_contents
    assert "temporary solution" in todo_contents
    assert "implement this" in todo_contents
    assert "another format" in todo_contents
    # Check for the multiline one, ensuring it's captured (content might vary slightly based on parser)
    assert any("multiline todo" in c for c in todo_contents)


    types = [todo['type'] for todo in file_info.todos]
    assert types.count("TODO") >= 3
    assert types.count("FIXME") >= 1
    assert types.count("HACK") >= 1

    os.remove(file_path)

def test_analyze_non_existent_file():
    analyzer = CodeAnalyzer()
    with pytest.raises(HTTPException) as exc_info:
        analyzer.analyze_file("non_existent_file.py")
    assert exc_info.value.status_code == 404

def test_analyze_python_docstrings(temp_test_dir):
    file_content = """
def func_with_docstring(param1: str, param2: int) -> bool:
    \"\"\"
    This is a simple docstring.
    :param param1: First parameter.
    :type param1: str
    :param int param2: Second parameter.
    :returns: A boolean value.
    :rtype: bool
    \"\"\"
    return True

def func_without_docstring():
    pass
"""
    file_path = create_temp_file(temp_test_dir, "docstrings.py", file_content)
    analyzer = CodeAnalyzer()
    file_info = analyzer.analyze_file(str(file_path))

    documented_functions = [f for f in file_info.doc_details if f.name == "func_with_docstring"]
    assert len(documented_functions) == 1
    doc_func = documented_functions[0]

    assert doc_func.name == "func_with_docstring"
    assert "this is a simple docstring" in doc_func.description.lower()
    assert len(doc_func.params) == 2

    param_names = {p.name for p in doc_func.params}
    assert "param1" in param_names
    assert "param2" in param_names

    for p in doc_func.params:
        if p.name == "param1":
            assert p.type == "str"
            assert "first parameter" in p.description.lower()
        if p.name == "param2":
            assert p.type == "int"
            assert "second parameter" in p.description.lower()

    assert doc_func.returns is not None
    assert doc_func.returns.get("type") == "bool"
    assert "a boolean value" in doc_func.returns.get("description", "").lower()

    os.remove(file_path)

# TODO: Add tests for JSDoc parsing once its reliability is confirmed or improved.
# TODO: Add tests for CodeAnalyzer.analyze_project()
