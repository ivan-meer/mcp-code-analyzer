import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

interface Dependency {
  name: string;
  version: string;
  latest: string;
  type: 'production' | 'development';
}

export const DependenciesSectionV2: React.FC = () => {
  const dependencies: Dependency[] = [
    { name: 'react', version: '18.2.0', latest: '18.2.0', type: 'production' },
    { name: 'next', version: '14.1.0', latest: '14.1.0', type: 'production' },
    { name: 'typescript', version: '5.3.0', latest: '5.3.0', type: 'development' },
    { name: 'tailwindcss', version: '3.4.0', latest: '3.4.0', type: 'development' }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Project Dependencies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Current Version</TableHead>
                <TableHead>Latest Version</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dependencies.map((dep) => (
                <TableRow key={dep.name}>
                  <TableCell>{dep.name}</TableCell>
                  <TableCell>{dep.version}</TableCell>
                  <TableCell>{dep.latest}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      dep.type === 'production' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {dep.type}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
