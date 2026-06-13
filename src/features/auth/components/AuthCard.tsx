import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// Carte centrée commune aux écrans d'auth.
export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm rounded-lg border border-gray/30 p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-navy">{title}</h1>
        {children}
      </div>
    </div>
  );
}
