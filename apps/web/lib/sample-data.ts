// Sample data generator for demonstrating the enhanced visualization capabilities
// This creates realistic project structures that showcase the power of the dependency graph

export interface SampleProjectData {
  files: Array<{
    path: string;
    name: string;
    type: string;
    size: number;
    lines_of_code?: number;
    functions: string[];
    imports?: string[];
    exports?: string[];
    complexity?: number;
  }>;
  dependencies: Array<{
    from: string;
    to: string;
    type: string;
    weight?: number;
  }>;
  metrics: {
    total_files: number;
    total_lines: number;
    languages: string[];
    complexity_score?: number;
  };
}

export function generateSampleReactProject(): SampleProjectData {
  const files = [
    // Core Application Files
    {
      path: "src/App.tsx",
      name: "App.tsx",
      type: "tsx",
      size: 2500,
      lines_of_code: 120,
      functions: ["App", "initializeApp", "handleGlobalError"],
      imports: ["React", "Router", "ThemeProvider", "./components/Header", "./components/Main"],
      exports: ["App"],
      complexity: 4
    },
    {
      path: "src/main.tsx",
      name: "main.tsx", 
      type: "tsx",
      size: 800,
      lines_of_code: 25,
      functions: ["bootstrap", "createRoot"],
      imports: ["React", "ReactDOM", "./App"],
      exports: [],
      complexity: 2
    },
    
    // Component Architecture
    {
      path: "src/components/Header/Header.tsx",
      name: "Header.tsx",
      type: "tsx",
      size: 1800,
      lines_of_code: 85,
      functions: ["Header", "NavigationMenu", "UserProfile", "handleNavigation"],
      imports: ["React", "useState", "./Navigation", "../ui/Button"],
      exports: ["Header"],
      complexity: 5
    },
    {
      path: "src/components/Header/Navigation.tsx",
      name: "Navigation.tsx",
      type: "tsx", 
      size: 1200,
      lines_of_code: 60,
      functions: ["Navigation", "MenuItem", "handleClick"],
      imports: ["React", "Link", "../ui/Button"],
      exports: ["Navigation"],
      complexity: 3
    },
    {
      path: "src/components/ui/Button.tsx",
      name: "Button.tsx",
      type: "tsx",
      size: 950,
      lines_of_code: 45,
      functions: ["Button", "forwardRef"],
      imports: ["React", "forwardRef", "./button.variants"],
      exports: ["Button"],
      complexity: 2
    },
    {
      path: "src/components/ui/Card.tsx", 
      name: "Card.tsx",
      type: "tsx",
      size: 1100,
      lines_of_code: 55,
      functions: ["Card", "CardHeader", "CardContent", "CardFooter"],
      imports: ["React", "./card.variants"],
      exports: ["Card", "CardHeader", "CardContent"],
      complexity: 3
    },
    
    // Business Logic
    {
      path: "src/services/api.ts",
      name: "api.ts",
      type: "ts",
      size: 3200,
      lines_of_code: 150,
      functions: ["createApiClient", "get", "post", "put", "delete", "handleResponse", "handleError"],
      imports: ["axios", "./types", "./config"],
      exports: ["apiClient", "ApiError"],
      complexity: 8
    },
    {
      path: "src/services/auth.ts",
      name: "auth.ts", 
      type: "ts",
      size: 2800,
      lines_of_code: 130,
      functions: ["login", "logout", "refreshToken", "getUser", "validateToken"],
      imports: ["./api", "./storage", "./types"],
      exports: ["authService"],
      complexity: 7
    },
    {
      path: "src/hooks/useAuth.ts",
      name: "useAuth.ts",
      type: "ts", 
      size: 1500,
      lines_of_code: 70,
      functions: ["useAuth", "useAuthState"],
      imports: ["React", "useState", "useEffect", "../services/auth"],
      exports: ["useAuth"],
      complexity: 5
    },
    
    // State Management  
    {
      path: "src/store/index.ts",
      name: "index.ts",
      type: "ts",
      size: 800,
      lines_of_code: 35,
      functions: ["createStore", "configureStore"],
      imports: ["redux", "./reducers", "./middleware"],
      exports: ["store"],
      complexity: 3
    },
    {
      path: "src/store/userSlice.ts",
      name: "userSlice.ts",
      type: "ts",
      size: 2000,
      lines_of_code: 95,
      functions: ["createSlice", "setUser", "clearUser", "updateProfile"],
      imports: ["@reduxjs/toolkit", "../types"],
      exports: ["userSlice", "userActions"],
      complexity: 6
    },
    
    // Utilities and Configuration
    {
      path: "src/utils/helpers.ts",
      name: "helpers.ts",
      type: "ts",
      size: 1800,
      lines_of_code: 85,
      functions: ["formatDate", "debounce", "throttle", "deepClone", "validateEmail"],
      imports: [],
      exports: ["formatDate", "debounce", "validateEmail"],
      complexity: 4
    },
    {
      path: "src/types/index.ts",
      name: "index.ts",
      type: "ts",
      size: 1200,
      lines_of_code: 60,
      functions: [],
      imports: [],
      exports: ["User", "ApiResponse", "AuthState"],
      complexity: 1
    },
    
    // Styling
    {
      path: "src/styles/globals.css",
      name: "globals.css",
      type: "css",
      size: 2500,
      lines_of_code: 120,
      functions: [],
      imports: [],
      exports: [],
      complexity: 2
    },
    {
      path: "tailwind.config.js",
      name: "tailwind.config.js",
      type: "js",
      size: 800,
      lines_of_code: 40,
      functions: [],
      imports: [],
      exports: ["config"],
      complexity: 2
    },
    
    // Configuration Files
    {
      path: "package.json",
      name: "package.json",
      type: "json",
      size: 1500,
      lines_of_code: 75,
      functions: [],
      imports: [],
      exports: [],
      complexity: 1
    },
    {
      path: "vite.config.ts",
      name: "vite.config.ts",
      type: "ts",
      size: 600,
      lines_of_code: 30,
      functions: ["defineConfig"],
      imports: ["vite", "@vitejs/plugin-react"],
      exports: ["config"],
      complexity: 2
    }
  ];

  const dependencies = [
    // Main App Dependencies
    { from: "src/main.tsx", to: "src/App.tsx", type: "import", weight: 1 },
    { from: "src/App.tsx", to: "src/components/Header/Header.tsx", type: "import", weight: 2 },
    { from: "src/App.tsx", to: "src/store/index.ts", type: "import", weight: 2 },
    { from: "src/App.tsx", to: "src/hooks/useAuth.ts", type: "import", weight: 2 },
    
    // Component Dependencies
    { from: "src/components/Header/Header.tsx", to: "src/components/Header/Navigation.tsx", type: "import", weight: 1 },
    { from: "src/components/Header/Header.tsx", to: "src/components/ui/Button.tsx", type: "import", weight: 1 },
    { from: "src/components/Header/Navigation.tsx", to: "src/components/ui/Button.tsx", type: "import", weight: 1 },
    
    // Service Layer Dependencies
    { from: "src/services/auth.ts", to: "src/services/api.ts", type: "import", weight: 3 },
    { from: "src/services/auth.ts", to: "src/types/index.ts", type: "import", weight: 1 },
    { from: "src/services/api.ts", to: "src/types/index.ts", type: "import", weight: 2 },
    
    // Hook Dependencies
    { from: "src/hooks/useAuth.ts", to: "src/services/auth.ts", type: "import", weight: 3 },
    { from: "src/hooks/useAuth.ts", to: "src/types/index.ts", type: "import", weight: 1 },
    
    // Store Dependencies
    { from: "src/store/userSlice.ts", to: "src/types/index.ts", type: "import", weight: 2 },
    { from: "src/store/index.ts", to: "src/store/userSlice.ts", type: "import", weight: 1 },
    
    // Utility Dependencies
    { from: "src/components/Header/Header.tsx", to: "src/utils/helpers.ts", type: "import", weight: 1 },
    { from: "src/services/api.ts", to: "src/utils/helpers.ts", type: "import", weight: 1 },
    
    // Configuration Dependencies
    { from: "src/App.tsx", to: "src/styles/globals.css", type: "import", weight: 1 },
    { from: "vite.config.ts", to: "package.json", type: "dependency", weight: 1 }
  ];

  return {
    files,
    dependencies,
    metrics: {
      total_files: files.length,
      total_lines: files.reduce((sum, file) => sum + (file.lines_of_code || 0), 0),
      languages: ["tsx", "ts", "css", "js", "json"],
      complexity_score: 4.2
    }
  };
}

export function generateSamplePythonProject(): SampleProjectData {
  const files = [
    {
      path: "main.py",
      name: "main.py",
      type: "py",
      size: 1200,
      lines_of_code: 60,
      functions: ["main", "setup_logging", "parse_args"],
      imports: ["logging", "argparse", "src.app"],
      exports: [],
      complexity: 3
    },
    {
      path: "src/app.py",
      name: "app.py",
      type: "py",
      size: 2500,
      lines_of_code: 120,
      functions: ["create_app", "configure_routes", "handle_error"],
      imports: ["flask", "src.models", "src.services"],
      exports: ["create_app"],
      complexity: 6
    },
    {
      path: "src/models/user.py",
      name: "user.py",
      type: "py",
      size: 1800,
      lines_of_code: 85,
      functions: ["User", "__init__", "save", "find_by_id", "validate"],
      imports: ["dataclasses", "typing", "src.database"],
      exports: ["User"],
      complexity: 5
    },
    {
      path: "src/services/auth_service.py",
      name: "auth_service.py",
      type: "py",
      size: 2200,
      lines_of_code: 105,
      functions: ["authenticate", "generate_token", "verify_token", "hash_password"],
      imports: ["jwt", "bcrypt", "src.models.user"],
      exports: ["AuthService"],
      complexity: 7
    },
    {
      path: "src/database/connection.py",
      name: "connection.py",
      type: "py",
      size: 1500,
      lines_of_code: 70,
      functions: ["create_connection", "execute_query", "close_connection"],
      imports: ["sqlite3", "logging"],
      exports: ["Database"],
      complexity: 4
    },
    {
      path: "tests/test_auth.py",
      name: "test_auth.py",
      type: "py",
      size: 1800,
      lines_of_code: 90,
      functions: ["test_login", "test_register", "test_token_validation", "setUp"],
      imports: ["unittest", "src.services.auth_service"],
      exports: [],
      complexity: 3
    },
    {
      path: "requirements.txt",
      name: "requirements.txt",
      type: "txt",
      size: 400,
      lines_of_code: 20,
      functions: [],
      imports: [],
      exports: [],
      complexity: 1
    }
  ];

  const dependencies = [
    { from: "main.py", to: "src/app.py", type: "import", weight: 1 },
    { from: "src/app.py", to: "src/models/user.py", type: "import", weight: 2 },
    { from: "src/app.py", to: "src/services/auth_service.py", type: "import", weight: 2 },
    { from: "src/services/auth_service.py", to: "src/models/user.py", type: "import", weight: 3 },
    { from: "src/models/user.py", to: "src/database/connection.py", type: "import", weight: 2 },
    { from: "tests/test_auth.py", to: "src/services/auth_service.py", type: "import", weight: 1 }
  ];

  return {
    files,
    dependencies,
    metrics: {
      total_files: files.length,
      total_lines: files.reduce((sum, file) => sum + (file.lines_of_code || 0), 0),
      languages: ["py", "txt"],
      complexity_score: 4.8
    }
  };
}