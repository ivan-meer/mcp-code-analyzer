import unittest
import tempfile
import shutil
from pathlib import Path
import os # Make sure os is imported

# Adjust the import path based on the actual location of main.py and ImportResolver
import sys
current_script_path = Path(__file__).resolve()
# Assuming this script is apps/api/tests/test_import_resolver.py
# project_root should be the directory containing the 'apps' folder.
project_root = current_script_path.parent.parent.parent.parent
sys.path.insert(0, str(project_root))
from apps.api.main import ImportResolver # Now this should work


class TestImportResolver(unittest.TestCase):

    def setUp(self):
        # Create a temporary directory for the mock project
        self.test_project_dir = Path(tempfile.mkdtemp())

    def tearDown(self):
        # Remove the temporary directory after tests
        shutil.rmtree(self.test_project_dir)

    def _create_file(self, relative_path_str: str, content: str = ""):
        full_path = self.test_project_dir / relative_path_str
        full_path.parent.mkdir(parents=True, exist_ok=True)
        with open(full_path, "w") as f:
            f.write(content)
        return str(full_path) # Return absolute path string

    def test_python_relative_imports(self):
        self._create_file("proj_root/pkg1/module1.py", "import os")
        self._create_file("proj_root/pkg1/sibling.py", "import os")
        self._create_file("proj_root/pkg1/__init__.py", "")
        self._create_file("proj_root/pkg2/module2.py", "import os")
        self._create_file("proj_root/pkg2/__init__.py", "")
        self._create_file("proj_root/__init__.py", "") # Project root is also a package

        resolver = ImportResolver(str(self.test_project_dir / "proj_root"))

        # Test case: from . import sibling
        source_file = str(self.test_project_dir / "proj_root/pkg1/module1.py")
        imports = [".sibling"] # Represents "from . import sibling" or "from .sibling import X"
        resolved = resolver.resolve_imports(imports, source_file)
        self.assertEqual(len(resolved), 1)
        self.assertEqual(resolved[0]["original"], ".sibling")
        self.assertEqual(
            Path(resolved[0]["resolved"]),
            self.test_project_dir / "proj_root/pkg1/sibling.py"
        )

        # Test case: from ..pkg2 import module2
        source_file_deep = str(self.test_project_dir / "proj_root/pkg1/subpkg/mod_deep.py")
        self._create_file("proj_root/pkg1/subpkg/__init__.py", "")
        self._create_file("proj_root/pkg1/subpkg/mod_deep.py", "")
        imports = ["..pkg2.module2"]
        resolved = resolver.resolve_imports(imports, source_file_deep)
        self.assertEqual(len(resolved), 1)
        self.assertEqual(resolved[0]["original"], "..pkg2.module2")
        self.assertEqual(
            Path(resolved[0]["resolved"]),
            self.test_project_dir / "proj_root/pkg2/module2.py"
        )

        # Test case: from . import non_existent_sibling
        imports = [".non_existent_sibling"]
        resolved = resolver.resolve_imports(imports, source_file)
        self.assertEqual(len(resolved), 1)
        self.assertIsNone(resolved[0]["resolved"])

    def test_python_absolute_imports_in_project(self):
        self._create_file("my_project/app/main.py", "")
        self._create_file("my_project/app/utils/helper.py", "")
        self._create_file("my_project/app/__init__.py", "")
        self._create_file("my_project/app/utils/__init__.py", "")

        resolver = ImportResolver(str(self.test_project_dir / "my_project"))

        # Test case: import app.utils.helper
        source_file = str(self.test_project_dir / "my_project/app/main.py")
        imports = ["app.utils.helper"]
        resolved = resolver.resolve_imports(imports, source_file)
        self.assertEqual(len(resolved), 1)
        self.assertEqual(
            Path(resolved[0]["resolved"]),
            self.test_project_dir / "my_project/app/utils/helper.py"
        )

        # Test case: import app.utils (resolves to __init__.py)
        imports = ["app.utils"]
        resolved = resolver.resolve_imports(imports, source_file)
        self.assertEqual(len(resolved), 1)
        self.assertEqual(
            Path(resolved[0]["resolved"]),
            self.test_project_dir / "my_project/app/utils/__init__.py"
        )

        # Test case: import non_existent_module
        imports = ["non_existent_module.sub_module"]
        resolved = resolver.resolve_imports(imports, source_file)
        self.assertEqual(len(resolved), 1)
        self.assertIsNone(resolved[0]["resolved"])

    def test_js_ts_relative_imports(self):
        self._create_file("frontend/src/components/button.js", "")
        self._create_file("frontend/src/components/modal/index.ts", "") # Test index file resolution
        self._create_file("frontend/src/utils/api.ts", "")

        resolver = ImportResolver(str(self.test_project_dir / "frontend"))

        # Test case: import './api' from utils folder (assuming utils/api.ts)
        source_file = str(self.test_project_dir / "frontend/src/components/button.js")
        imports = ["../utils/api"]
        resolved = resolver.resolve_imports(imports, source_file)
        self.assertEqual(len(resolved), 1)
        self.assertEqual(
            Path(resolved[0]["resolved"]),
            self.test_project_dir / "frontend/src/utils/api.ts"
        )

        # Test case: import '../components/modal' (resolves to modal/index.ts)
        source_file_utils = str(self.test_project_dir / "frontend/src/utils/api.ts")
        imports = ["../components/modal"]
        resolved = resolver.resolve_imports(imports, source_file_utils)
        self.assertEqual(len(resolved), 1)
        self.assertEqual(
            Path(resolved[0]["resolved"]),
            self.test_project_dir / "frontend/src/components/modal/index.ts"
        )

        # Test case: import './non_existent_component'
        imports = ["./non_existent_component"]
        resolved = resolver.resolve_imports(imports, source_file)
        self.assertEqual(len(resolved), 1)
        self.assertIsNone(resolved[0]["resolved"])

    def test_js_ts_aliased_imports(self):
        # Setup for alias resolution (e.g. @/ or ~/)
        # Resolver tries self.project_path, self.project_path / 'src', self.project_path / 'app'
        self._create_file("webapp/src/components/header.tsx", "")
        self._create_file("webapp/src/services/auth.js", "")
        self._create_file("webapp/app/old_utils.js", "") # For ~ trying project_path/app

        resolver = ImportResolver(str(self.test_project_dir / "webapp"))

        # Test case: import '@/components/header' (assuming @/ maps to src/)
        source_file = str(self.test_project_dir / "webapp/src/services/auth.js")
        imports = ["@/components/header"]
        resolved = resolver.resolve_imports(imports, source_file)
        self.assertEqual(len(resolved), 1)
        self.assertEqual(
            Path(resolved[0]["resolved"]),
            self.test_project_dir / "webapp/src/components/header.tsx"
        )

        # Test case: import '~/old_utils' (assuming ~/ maps to app/ first, then src/, then root)
        # In this setup, webapp/app/old_utils.js should be found
        imports = ["~/old_utils"] # This relies on the resolver's specific alias base paths
        resolved = resolver.resolve_imports(imports, source_file)
        self.assertEqual(len(resolved), 1)
        # The resolver tries self.project_path / 'src' / 'old_utils' first for `~/` if `src` exists.
        # And then self.project_path / 'app' / 'old_utils'.
        # The current _resolve_js_ts_import has alias_bases = [self.project_path, self.project_path / 'src', self.project_path / 'app']
        # It will check self.project_path / 'old_utils' first. Let's create that.
        self._create_file("webapp/old_utils_at_root.js")
        imports_root = ["~/old_utils_at_root"]
        resolved_root = resolver.resolve_imports(imports_root, source_file)
        self.assertEqual(len(resolved_root),1)
        self.assertEqual(Path(resolved_root[0]["resolved"]), self.test_project_dir / "webapp/old_utils_at_root.js")


        # Test case: import '@/non_existent_service'
        imports = ["@/non_existent_service"]
        resolved = resolver.resolve_imports(imports, source_file)
        self.assertEqual(len(resolved), 1)
        self.assertIsNone(resolved[0]["resolved"])

    def test_unresolvable_imports(self):
        self._create_file("project_x/main.py", "")
        resolver = ImportResolver(str(self.test_project_dir / "project_x"))
        source_file = str(self.test_project_dir / "project_x/main.py")

        imports = ["nonexistent_package", "another.one.that.fails"]
        resolved = resolver.resolve_imports(imports, source_file)
        self.assertEqual(len(resolved), 2)
        self.assertIsNone(resolved[0]["resolved"])
        self.assertEqual(resolved[0]["original"], "nonexistent_package")
        self.assertIsNone(resolved[1]["resolved"])
        self.assertEqual(resolved[1]["original"], "another.one.that.fails")

    def test_different_file_extensions_js_ts(self):
        self._create_file("ext_proj/src/app.js", "")
        self._create_file("ext_proj/src/components/comp.jsx", "")
        self._create_file("ext_proj/src/data/data.json", "")
        self._create_file("ext_proj/src/module/mod.mjs", "")
        self._create_file("ext_proj/src/legacy/legacy.cjs", "")
        self._create_file("ext_proj/src/styles/style.css", "") # Test direct import of non-js/ts file

        resolver = ImportResolver(str(self.test_project_dir / "ext_proj"))
        source_file = str(self.test_project_dir / "ext_proj/src/app.js")

        test_cases = [
            ("./components/comp", "ext_proj/src/components/comp.jsx"),
            ("../src/data/data", "ext_proj/src/data/data.json"), # Test relative path with src included
            ("./module/mod", "ext_proj/src/module/mod.mjs"),
            ("./legacy/legacy", "ext_proj/src/legacy/legacy.cjs"),
            ("./styles/style.css", "ext_proj/src/styles/style.css"),
        ]

        for import_path, expected_resolve_suffix in test_cases:
            with self.subTest(import_path=import_path):
                resolved = resolver.resolve_imports([import_path], source_file)
                self.assertEqual(len(resolved), 1)
                self.assertIsNotNone(resolved[0]["resolved"], f"Failed to resolve {import_path}")
                self.assertEqual(
                    Path(resolved[0]["resolved"]),
                    self.test_project_dir / expected_resolve_suffix
                )

    def test_python_import_package_itself(self):
        self._create_file("py_pkg_test/my_pkg/__init__.py", "")
        self._create_file("py_pkg_test/my_pkg/sub_module.py", "")
        self._create_file("py_pkg_test/main.py", "import my_pkg")

        resolver = ImportResolver(str(self.test_project_dir / "py_pkg_test"))
        source_file = str(self.test_project_dir / "py_pkg_test/main.py")

        imports = ["my_pkg"] # import my_pkg
        resolved = resolver.resolve_imports(imports, source_file)
        self.assertEqual(len(resolved), 1)
        self.assertIsNotNone(resolved[0]["resolved"])
        self.assertEqual(
            Path(resolved[0]["resolved"]),
            self.test_project_dir / "py_pkg_test/my_pkg/__init__.py"
        )

        # from . import sibling_module (where sibling_module.py exists)
        source_file_in_pkg = str(self.test_project_dir / "py_pkg_test/my_pkg/__init__.py")
        self._create_file("py_pkg_test/my_pkg/sibling_module.py","")
        imports_relative_module = [".sibling_module"]
        resolved_relative_module = resolver.resolve_imports(imports_relative_module, source_file_in_pkg)
        self.assertEqual(len(resolved_relative_module),1)
        self.assertIsNotNone(resolved_relative_module[0]["resolved"])
        self.assertEqual(
            Path(resolved_relative_module[0]["resolved"]),
            self.test_project_dir / "py_pkg_test/my_pkg/sibling_module.py"
        )


if __name__ == '__main__':
    unittest.main()
