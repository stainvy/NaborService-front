import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DslExplorer } from '../components/DslExplorer';
import { DslConsole } from '../components/DslConsole';
import { DslAudit } from '../components/DslAudit';
import { ApiExplorer } from '../components/ApiExplorer';
import { GeoNeighbourhoodPanel } from '../components/GeoNeighbourhoodPanel';
import { MessageLookup } from '../components/MessageLookup';

type AdminTab = 'explorer' | 'console' | 'audit' | 'api' | 'geo' | 'messages';

const TABS: { key: AdminTab; labelKey: string }[] = [
  { key: 'explorer', labelKey: 'dsl.tab_explorer' },
  { key: 'console', labelKey: 'dsl.tab_console' },
  { key: 'audit', labelKey: 'dsl.tab_audit' },
  { key: 'api', labelKey: 'dsl.tab_api' },
  { key: 'geo', labelKey: 'dsl.tab_geo' },
  { key: 'messages', labelKey: 'dsl.tab_messages' },
];

export function AdminDashboardPage() {
  const { t } = useTranslation('admin');
  const [tab, setTab] = useState<AdminTab>('explorer');

  return (
    <div className="min-h-screen bg-white">
      {/* Barre supérieure */}
      <header className="flex items-center justify-between border-b border-gray/20 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm text-orange underline">
            ← {t('nav_home')}
          </Link>
          <h1 className="text-xl font-bold text-navy">{t('title')}</h1>
        </div>
      </header>

      {/* Onglets */}
      <nav className="flex gap-0 overflow-x-auto border-b border-gray/20 px-6">
        {TABS.map(({ key, labelKey }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              tab === key
                ? 'border-b-2 border-orange text-orange'
                : 'text-gray hover:text-navy'
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
      </nav>

      {/* Contenu */}
      <main className="p-6">
        {tab === 'explorer' && <DslExplorer />}
        {tab === 'console' && <DslConsole />}
        {tab === 'audit' && <DslAudit />}
        {tab === 'api' && <ApiExplorer />}
        {tab === 'geo' && <GeoNeighbourhoodPanel />}
        {tab === 'messages' && <MessageLookup />}
      </main>
    </div>
  );
}
