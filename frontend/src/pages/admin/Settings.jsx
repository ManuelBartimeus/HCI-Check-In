import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import api from '@/api/index';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings')
      .then(r => setSettings(r.data))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-display-md text-ink" style={{ fontFamily: "'Mona Sans', sans-serif" }}>Settings</h1>
        <p className="text-[13px] text-ink-muted mt-0.5">System configuration</p>
      </div>

      <div className="card p-6 max-w-lg space-y-5">
        <h2 className="text-[14px] font-semibold text-ink flex items-center gap-2">
          <SettingsIcon size={15} /> Church Configuration
        </h2>

        {loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-10 skeleton rounded-md" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] text-ink-muted mb-1.5">Church Name</label>
              <input
                className="input"
                value={settings?.church_name || ''}
                readOnly
              />
              <p className="text-[11px] text-ink-muted mt-1">Configure via CHURCH_NAME env variable</p>
            </div>
            <div>
              <label className="block text-[13px] text-ink-muted mb-1.5">Timezone</label>
              <input className="input" value={settings?.timezone || ''} readOnly />
              <p className="text-[11px] text-ink-muted mt-1">Configure via CHURCH_TIMEZONE env variable</p>
            </div>
            <div>
              <label className="block text-[13px] text-ink-muted mb-1.5">Admin Username</label>
              <input className="input" value={settings?.admin_username || ''} readOnly />
              <p className="text-[11px] text-ink-muted mt-1">Configure via ADMIN_USERNAME env variable</p>
            </div>
          </div>
        )}

        <div className="divider pt-2" />

        <div className="space-y-2">
          <h3 className="text-[13px] font-semibold text-ink">Configuration Guide</h3>
          <p className="text-[12px] text-ink-muted">
            Copy <code className="bg-surface-2 px-1.5 py-0.5 rounded text-[11px]">.env.example</code> to{' '}
            <code className="bg-surface-2 px-1.5 py-0.5 rounded text-[11px]">.env</code> in the backend folder
            and set your values. Restart the server to apply changes.
          </p>
          <div className="bg-surface-2 rounded-md p-3 text-[12px] font-mono text-ink-muted">
            CHURCH_NAME=Harvest Chapel KNUST<br />
            CHURCH_TIMEZONE=Africa/Accra<br />
            ADMIN_USERNAME=admin<br />
            ADMIN_PASSWORD=passw0rd
          </div>
        </div>
      </div>
    </div>
  );
}
