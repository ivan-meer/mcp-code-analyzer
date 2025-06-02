import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@radix-ui/react-dialog';

export const ExportDialog: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Options</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button variant="outline" className="w-full">
            Export as CSV
          </Button>
          <Button variant="outline" className="w-full">
            Export as JSON
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
