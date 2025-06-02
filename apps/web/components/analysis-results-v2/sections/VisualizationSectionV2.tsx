import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, PieChart } from '@/components/ui/charts';

export const VisualizationSectionV2: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Code Analysis Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={[
              { name: 'Complexity', value: 75 },
              { name: 'Duplication', value: 30 },
              { name: 'Issues', value: 45 },
              { name: 'Coverage', value: 85 }
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Issue Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <PieChart
            data={[
              { name: 'Errors', value: 15 },
              { name: 'Warnings', value: 25 },
              { name: 'Suggestions', value: 60 }
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
};
