"use client";

import React, { useState, FC } from 'react';
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui button
import { Textarea } from '@/components/ui/textarea'; // Assuming shadcn/ui textarea
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Assuming shadcn/ui alert

interface ExplainButtonProps {
  code: string;
  language: string;
}

export const ExplainButton: FC<ExplainButtonProps> = ({ code, language }) => {
  const [explanation, setExplanation] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleExplain = async () => {
    if (!code.trim()) {
      setError("Code cannot be empty.");
      setExplanation('');
      return;
    }
    setLoading(true);
    setError('');
    setExplanation('');
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setExplanation(data.explanation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(`Failed to get explanation: ${errorMessage}`);
      console.error("Error in handleExplain:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleExplain} disabled={loading || !code.trim()}>
        {loading ? 'Analyzing...' : '🤖 Explain Code'}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {explanation && (
        <div className="p-4 border rounded-md bg-muted">
          <h3 className="font-semibold mb-2">Explanation:</h3>
          <Textarea value={explanation} readOnly rows={10} className="w-full bg-background" />
        </div>
      )}
    </div>
  );
};
