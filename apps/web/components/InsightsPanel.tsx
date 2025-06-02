import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { ProjectTodo } from '@/types/analysis.types';

interface InsightsPanelProps {
  insights: ProjectTodo[];
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  const getSeverity = (type: string): 'low' | 'medium' | 'high' => {
    switch(type) {
      case 'FIXME': return 'high';
      case 'TODO': return 'medium';
      default: return 'low';
    }
  };
  return (
    <Card className="insights-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-medium">{insight.type}: {insight.file_path.split('/').pop()}</span>
              <span className="text-xs text-muted-foreground">Line {insight.line}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {insight.content}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
