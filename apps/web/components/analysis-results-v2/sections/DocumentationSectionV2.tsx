import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DocumentationSectionV2Props {
  documentation: Array<{
    id: string;
    title: string;
    content: string;
    type: 'function' | 'class' | 'interface' | 'type';
    file: string;
  }>;
  onFileClick?: (filePath: string) => void;
}

export const DocumentationSectionV2: React.FC<DocumentationSectionV2Props> = ({ 
  documentation,
  onFileClick
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredDocs = documentation.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Project Documentation</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documentation..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No documentation found matching your search
            </div>
          ) : (
            <div className="space-y-8">
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{doc.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{doc.type}</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onFileClick?.(doc.file)}
                      >
                        View Source
                      </Button>
                    </div>
                  </div>
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                      {doc.content}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
