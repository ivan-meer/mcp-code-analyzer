import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VirtualList } from '@/components/shared/VirtualList';
import { Button } from '@/components/ui/button';
import { Copy, File, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DuplicateGroup } from '@/types/analysis.types';

interface DuplicatesSectionProps {
  /**
   * Массив групп дубликатов
   * Каждая группа содержит файлы с идентичным содержимым
   */
  duplicates: DuplicateGroup[];
  /**
   * Базовый путь проекта для отображения относительных путей
   */
  projectPath: string;
  /**
   * Обработчик навигации по файлам
   * @param filePath - полный путь к файлу
   * @param line - необязательный номер строки
   */
  onFileNavigate: (filePath: string, line?: number) => void;
}

export const DuplicatesSection: React.FC<DuplicatesSectionProps> = ({
  duplicates,
  projectPath,
  onFileNavigate
}) => {
  if (duplicates.length === 0) {
    return (
      <Card className="duplicates-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Дубликаты файлов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Дубликаты файлов не найдены
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="duplicates-section">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Дубликаты файлов
          </CardTitle>
          <Badge variant="secondary">
            {duplicates.length} групп дубликатов
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <VirtualList
          items={duplicates}
          itemHeight={120}
          renderItem={(group, index) => (
            <div key={index} className="mb-6 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Группа {index + 1}</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Удалить дубликаты
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                {group.files.map((file: {path: string, lines: number[]}, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    onClick={() => onFileNavigate(file.path, file.lines[0])}
                  >
                    <File className="h-4 w-4 flex-shrink-0" />
                    <div className="truncate flex-1">
                      {file.path.replace(projectPath, '')}
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
};