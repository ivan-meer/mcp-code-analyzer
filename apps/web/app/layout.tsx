import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MCP Code Analyzer - Intelligent Code Analysis',
  description: 'AI-powered code analysis and visualization platform built with Model Context Protocol',
  keywords: ['code analysis', 'AI', 'visualization', 'MCP', 'developer tools'],
  authors: [{ name: 'MCP Code Analyzer Team' }],
  openGraph: {
    title: 'MCP Code Analyzer',
    description: 'Transform your code into interactive visualizations',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          themes={['light', 'dark', 'theme-high-contrast', 'theme-soft-tones']}
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
