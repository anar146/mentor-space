import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'MentorSpace — 1-on-1 Mentorship Platform',
  description: 'Live 1-on-1 sessions with video, real-time collaborative code editor, and chat.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
