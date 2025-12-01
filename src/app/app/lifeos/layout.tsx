import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LifeOS - Planning',
  description: 'Intelligent life planning with AI-powered scheduling',
};

export default function LifeOSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Module header could go here in the future */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
