'use client';

import * as React from 'react';
import { Moon, Sun, Contrast, Paintbrush } from 'lucide-react'; // Added Contrast and Paintbrush
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

interface ThemeOption {
  name: string;
  value: string;
  icon?: React.ElementType;
  displayText: string;
}

const themeOptions: ThemeOption[] = [
  { name: 'Light', value: 'light', icon: Sun, displayText: 'Light' },
  { name: 'Dark', value: 'dark', icon: Moon, displayText: 'Dark' },
  { name: 'High Contrast', value: 'theme-high-contrast', icon: Contrast, displayText: 'Contrast' },
  { name: 'Soft Tones', value: 'theme-soft-tones', icon: Paintbrush, displayText: 'Soft' },
];

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder or nothing on the server to avoid hydration mismatch
    // For multiple buttons, it might be better to render them disabled or with a default state.
    // Or, simply return a single placeholder button.
    return (
      <div className="flex space-x-1">
        {themeOptions.map((option) => (
          <Button key={option.value} variant="outline" size="sm" disabled className="h-9 px-2">
            {option.icon && <option.icon className="h-4 w-4 mr-1" />}
            {option.displayText}
          </Button>
        ))}
      </div>
    );
  }

  // Determine the active theme, preferring resolvedTheme for system preference handling
  const currentActiveTheme = theme === 'system' ? resolvedTheme : theme;

  return (
    <div className="flex space-x-1" role="group" aria-label="Theme switcher">
      {themeOptions.map((option) => {
        const IconComponent = option.icon;
        return (
          <Button
            key={option.value}
            variant={currentActiveTheme === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme(option.value)}
            className="h-9 px-2"
            aria-pressed={currentActiveTheme === option.value}
            title={`Set theme to ${option.name}`}
          >
            {IconComponent && <IconComponent className="h-4 w-4 mr-1" />}
            {option.displayText}
            <span className="sr-only">{`Set theme to ${option.name}`}</span>
          </Button>
        );
      })}
    </div>
  );
}
