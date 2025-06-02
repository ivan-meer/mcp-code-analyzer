import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, FileText } from 'lucide-react';

interface DuplicateBlock {
  id: string;
  files: Array<{
    path: string;
    startLine: number;
    endLine: number;
  }>;
  code: string;
  similarity: number;
}

interface DuplicatesSectionV2Props {
  duplicates: DuplicateBlock[];
  onFileClick?: (filePath: string, line?: number) => void;
}

export const DuplicatesSectionV2: React.FC<DuplicatesSectionV2Props> = ({ 
  duplicates,
  onFileClick
}) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Code Duplicates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {duplicates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No duplicate code blocks found
            </div>
          ) : (
            <div className="space-y-8">
              {duplicates.map((duplicate) => (
                <div key={duplicate.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {duplicate.similarity}% similar
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {duplicate.files.length} locations
                    </div>
                  </div>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                    {duplicate.code}
                  </pre>
                  <div className="space-y-2">
                    {duplicate.files.map((file, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {file.path} (lines {file.startLine}-{file.endLine})
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onFileClick?.(file.path, file.startLine)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
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
