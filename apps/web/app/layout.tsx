import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NotificationProvider } from '@/components/notification-system';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MCP Code Analyzer - Супер Интерфейс',
  description: 'AI-powered код анализатор с MCP интеграцией и 3D визуализацией',
  keywords: ['code analysis', 'AI', 'MCP', 'visualization', '3D'],
  authors: [{ name: 'MCP Code Analyzer Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#667eea',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        {/* Font Awesome */}
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" 
          rel="stylesheet" 
        />
        {/* Three.js */}
        <script 
          src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
          defer
        ></script>
        {/* D3.js */}
        <script 
          src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"
          defer
        ></script>
      </head>
      <body className={inter.className}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
