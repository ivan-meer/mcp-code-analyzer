import React from "react";
import { motion } from "framer-motion";
import { Code2 } from "lucide-react";

export function HeroSection() {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-center mb-12"
    >
      <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Превратите код в интерактивную визуализацию
      </h2>
      <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
        Интеллектуальный анализ кода с AI-объяснениями и красивой визуализацией для глубокого понимания структуры вашего проекта
      </p>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mb-10 max-w-lg mx-auto"
      >
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-lg rounded-full opacity-30"></div>
          <div className="relative bg-blue-100 dark:bg-blue-900/20 p-1 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Code2 className="w-10 h-10" />
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
