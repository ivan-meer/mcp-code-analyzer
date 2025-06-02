import React from 'react';

export const FloatingToolbar: React.FC = () => {
  return (
    <div className="floating-toolbar">
      {/* Basic toolbar implementation */}
      <div className="flex items-center gap-2 p-2 bg-background border rounded-lg shadow-lg">
        <button className="p-2 hover:bg-accent rounded">
          Refresh
        </button>
        <button className="p-2 hover:bg-accent rounded">
          Settings
        </button>
      </div>
    </div>
  );
};
