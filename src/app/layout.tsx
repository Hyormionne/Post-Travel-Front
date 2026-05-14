import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: '여행후유증',
  description: '사진을 던지면 AI가 여행기를 써드려요',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&family=Gaegu:wght@400;700&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
