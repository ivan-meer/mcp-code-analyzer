import React from 'react';
import { ProjectAnalysis } from '@/types/analysis.types';
import { NavigationSidebar } from '@/components/analysis-results-v2/NavigationSidebar';
import { ContentArea } from './ContentArea';
import { InsightsPanel } from '../InsightsPanel';
import { FloatingToolbar } from './FloatingToolbar';
import { SearchOverlay } from '../SearchOverlay';
import { ExportDialog } from '../ExportDialog';

interface AnalysisResultsV2Props {
  data: ProjectAnalysis;
}

export const AnalysisResultsV2: React.FC<AnalysisResultsV2Props> = ({ data }) => {
  return (
    <div className="analysis-results-v2">
      <NavigationSidebar />
      <ContentArea data={data} />
      <InsightsPanel insights={data.all_todos || []} />
      <FloatingToolbar />
      <SearchOverlay />
      <ExportDialog />
    </div>
  );
};
