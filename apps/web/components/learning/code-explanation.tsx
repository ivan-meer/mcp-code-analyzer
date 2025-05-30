'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Play, Lightbulb, Code } from 'lucide-react';

interface CodeExplanationProps {
  // Этот компонент пока для демонстрации, позже подключим к API
}

export function CodeExplanation({}: CodeExplanationProps) {
  const [code, setCode] = useState('');
  const [explanation, setExplanation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const explainCode = async () => {
    if (!code.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/backend/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          language: 'javascript',
          level: 'intermediate'
        })
      });
      
      const result = await response.json();
      setExplanation(result);
    } catch (error) {
      console.error('Error explaining code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Code Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Объяснение кода
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Вставьте сюда код для объяснения..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="min-h-32 font-mono"
          />
          <Button onClick={explainCode} disabled={isLoading || !code.trim()}>
            {isLoading ? 'Анализирую...' : 'Объяснить код'}
            <Play className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Explanation Results */}
      {explanation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Объяснение
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {explanation.explanation}
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Концепции
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {explanation.concepts.map((concept: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {concept}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Примеры</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {explanation.examples.map((example: string, index: number) => (
                    <div key={index} className="text-sm p-2 bg-slate-100 dark:bg-slate-800 rounded">
                      {example}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}
