import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Code2, Brain, BarChart3, Network } from "lucide-react";

export function FeaturesGrid() {
  const features = [
    {
      icon: <Code2 className="h-6 w-6" />,
      title: "Анализ кода",
      description: "Глубокий анализ структуры и качества вашего кода"
    },
    {
      icon: <Network className="h-6 w-6" />,
      title: "Визуализация зависимостей",
      description: "Интерактивные графы связей между компонентами"
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI объяснения",
      description: "Умные объяснения сложных концепций и паттернов"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Метрики качества",
      description: "Детальная аналитика и рекомендации по улучшению"
    }
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg w-fit">
                {feature.icon}
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
