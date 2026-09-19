import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, User } from '@phosphor-icons/react';
import { PageHeader, ErrorState, VectorLoader } from '../components/ui';

const Settings = () => {
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, prefsRes] = await Promise.all([
        fetch('/api/user/profile', { signal }),
        fetch('/api/user/preferences', { signal }),
      ]);
      const profileData = await profileRes.json().catch(() => ({}));
      const prefsData = await prefsRes.json().catch(() => ({}));
      if (!profileRes.ok || !profileData.success) {
        throw new Error(profileData.message || 'Your profile could not be loaded.');
      }
      setProfile(profileData.profile || {});
      setPreferences(prefsRes.ok && prefsData.success ? prefsData.preferences || {} : {});
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || 'Unable to load your settings');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, retry]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader kicker="ACCOUNT" title="Settings" />
        <VectorLoader label="Loading your study space" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader kicker="ACCOUNT" title="Settings" />
        <ErrorState title="Profile unavailable" body={error} onRetry={() => setRetry((r) => r + 1)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-12">
      <PageHeader
        kicker="ACCOUNT"
        title="Your study space"
        intro="Your profile and saved learning preferences."
      />

      {/* Profile */}
      <section aria-label="Profile">
        <div className="neo-card flex items-center gap-4 p-5 sm:p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-[var(--border)] bg-[var(--surface-muted)]">
            <User className="h-6 w-6 text-[var(--ink)]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-black uppercase tracking-tight text-[var(--ink)]">
              {profile?.name || 'Name unavailable'}
            </h2>
            <p className="mt-1 break-all text-sm font-medium text-[var(--ink-muted)]">
              {profile?.email || 'Email unavailable'}
            </p>
            {typeof profile?.notes_count === 'number' && (
              <p className="mt-2 text-xs font-black uppercase tracking-widest text-[var(--ink-muted)]">
                {profile.notes_count} saved {profile.notes_count === 1 ? 'note' : 'notes'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Learning preferences */}
      <section aria-label="Learning preferences">
        <h2 className="section-label mb-3">Learning preferences</h2>
        {Object.keys(preferences || {}).length > 0 ? (
          <div className="neo-card divide-y-2 divide-[var(--border)]">
            {Object.entries(preferences).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
                <dt className="text-xs font-black uppercase tracking-widest text-[var(--ink-muted)]">
                  {key.replace(/_/g, ' ')}
                </dt>
                <dd className="max-w-[60%] text-right font-semibold text-[var(--ink)]">
                  {String(value)}
                </dd>
              </div>
            ))}
          </div>
        ) : (
          <div className="neo-card p-6 text-center">
            <p className="text-sm font-medium text-[var(--ink-muted)]">
              No learning preferences have been saved yet.
            </p>
          </div>
        )}
      </section>

      {/* Plans & billing */}
      <section aria-label="Plans and billing">
        <h2 className="section-label mb-3">Plans &amp; billing</h2>
        <div className="neo-card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[var(--emerald)]" aria-hidden="true" />
            <h3 className="font-black uppercase tracking-tight text-[var(--ink)]">Subscription</h3>
          </div>
          <p className="mt-3 text-sm font-medium leading-relaxed text-[var(--ink-muted)]">
            Subscription management is not available in this version of Vector AI.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Settings;
