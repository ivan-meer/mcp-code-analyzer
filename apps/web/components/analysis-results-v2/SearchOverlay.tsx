import React from 'react';

export const SearchOverlay: React.FC = () => {
  return (
    <div className="search-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-background p-6 rounded-lg w-full max-w-md">
        <input
          type="text"
          placeholder="Search..."
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex justify-end mt-4 space-x-2">
          <button className="px-4 py-2 border rounded-lg hover:bg-accent">
            Cancel
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
            Search
          </button>
        </div>
      </div>
    </div>
  );
};
