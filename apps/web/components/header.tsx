import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Code2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MCP Code Analyzer
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300">
              🧪 Experimental
            </Badge>
            <ThemeToggle />
          </div>
        </motion.div>
      </div>
    </header>
  );
}
