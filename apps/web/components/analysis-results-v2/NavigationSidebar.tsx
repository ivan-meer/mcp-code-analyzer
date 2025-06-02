import React from 'react';

export const NavigationSidebar: React.FC = () => {
  return (
    <div className="navigation-sidebar">
      {/* Basic sidebar implementation */}
      <nav>
        <ul>
          <li>Overview</li>
          <li>Files</li>
          <li>Dependencies</li>
          <li>Todos</li>
        </ul>
      </nav>
    </div>
  );
};
