import { FaCodeBranch, FaShareAlt, FaDownload, FaSyncAlt, FaFolder } from 'react-icons/fa';

interface AnalysisHeaderProps {
  projectName: string;
  fileCount: number;
  lineCount: number;
}

export const AnalysisHeader = ({ projectName, fileCount, lineCount }: AnalysisHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 mx-6 mt-4">
      <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#5865F2] to-transparent animate-shimmer" />
        
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center text-xl rounded-xl bg-gradient-to-br from-[#5865F2] to-[#9775FA] text-white shadow-glow">
              <FaCodeBranch />
            </div>
            
            <div>
              <h1 className="text-2xl font-extrabold bg-gradient-to-br from-white to-[#A3A9F5] bg-clip-text text-transparent mb-1">
                Результаты анализа
              </h1>
              <div className="flex items-center gap-2 font-mono text-sm text-neutral-400">
                <FaFolder />
                <span>{projectName}</span>
                <span className="text-xs text-neutral-500">•</span>
                <span>{fileCount} файл</span>
                <span className="text-xs text-neutral-500">•</span>
                <span>{lineCount.toLocaleString()} строк</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <button className="flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/15 rounded-lg text-neutral-200 text-sm font-medium transition-all hover:bg-white/15 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#5865F2]">
            <FaShareAlt />
            Поделиться
          </button>
          
          <button className="flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/15 rounded-lg text-neutral-200 text-sm font-medium transition-all hover:bg-white/15 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#5865F2]">
            <FaDownload />
            Экспорт
          </button>
          
          <button className="flex items-center gap-2 px-4 py-3 bg-gradient-to-br from-[#5865F2] to-[#5865F2] border border-[#7C84F3] rounded-lg text-white text-sm font-medium transition-all hover:from-[#7C84F3] hover:to-[#7C84F3] hover:-translate-y-0.5 shadow-glow focus:outline-none focus:ring-2 focus:ring-[#5865F2]">
            <FaSyncAlt />
            Обновить
          </button>
        </div>
      </div>
    </header>
  );
};