import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LifeOS - Planning',
  description: 'Calendar-centric life planning with routines, tasks, and projects',
};

export default function LifeOSLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content area - navigation is now in global sidebar */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
