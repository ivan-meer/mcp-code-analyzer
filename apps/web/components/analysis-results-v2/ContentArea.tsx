import React from 'react';
import { ProjectAnalysis } from '@/types/analysis.types';

interface ContentAreaProps {
  data: ProjectAnalysis;
}

export const ContentArea: React.FC<ContentAreaProps> = ({ data }) => {
  return (
    <div className="content-area">
      <h2>Analysis Results</h2>
      <div className="stats">
        <div>Files: {data.files.length}</div>
        <div>Dependencies: {data.dependencies.length}</div>
        <div>Todos: {data.all_todos?.length || 0}</div>
      </div>
    </div>
  );
};
