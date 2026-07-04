import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Cross } from 'lucide-react';
import CheckInSection from './CheckInSection';
import LeaderboardView from './LeaderboardView';
import AdminLoginModal from './AdminLoginModal';
import hciLogo from '@/assets/hci_logo.png';
export default function LandingPage() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);
  const [churchName, setChurchName] = useState('Harvest Chapel KNUST');

  // Fetch church name
  useEffect(() => {
    fetch('/api/settings/public')
      .then(r => r.json())
      .then(d => { if (d.church_name) setChurchName(d.church_name); })
      .catch(() => { });
  }, []);

  function handleCheckinSuccess(result) {
    setCheckinResult(result);
    setShowLeaderboard(true);
  }

  return (
    <div className="min-h-screen bg-canvas relative overflow-hidden flex flex-col">
      {/* ── Atmospheric glow blobs ─────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #6a4cf5 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #d44df0 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #ff7a3d 0%, transparent 70%)' }}
        />
      </div>

      {/* ── Top bar ────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          {/* Cross icon as minimal logo */}
          <div className="w-7 h-7 rounded-lg bg-surface-1 border border-hairline flex items-center justify-center overflow-hidden">
            <img src={hciLogo} alt="Logo" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-[13px] text-ink-muted font-medium tracking-[-0.13px]">
            {churchName}
          </span>
        </div>

        {/* Menu icon → Admin */}
        <button
          onClick={() => setShowAdmin(true)}
          className="btn-icon"
          aria-label="Open admin menu"
          id="admin-menu-button"
        >
          <Menu size={16} />
        </button>
      </header>

      {/* ── Main content ───────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg text-center"
        >
          {/* Church logo placeholder */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mb-8 w-20 h-20 rounded-2xl spotlight-red flex items-center justify-center animate-pulse-glow-red overflow-hidden p-2"
          >
            <img src={hciLogo} alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
          </motion.div>

          {/* Church name — massive display type */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-display-lg text-ink mb-4"
            style={{ fontFamily: "'Mona Sans', sans-serif" }}
          >
            {churchName}
          </motion.h1>

          {/* Encouraging subhead */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-[15px] text-ink-muted leading-relaxed mb-12 max-w-sm mx-auto"
          >
            Do not neglect the meeting of the brethren.
            <br />
            Plug in everyday and rack up your score.
          </motion.p>

          {/* Check-in section */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <CheckInSection onSuccess={handleCheckinSuccess} />
          </motion.div>
        </motion.div>
      </main>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="relative z-10 text-center pb-8 px-4">
        <p className="text-[12px] text-ink-muted opacity-40">
          © {new Date().getFullYear()} {churchName} · All rights reserved
        </p>
      </footer>

      {/* ── Admin login modal ──────────────────────── */}
      <AdminLoginModal isOpen={showAdmin} onClose={() => setShowAdmin(false)} />

      {/* ── Leaderboard overlay ────────────────────── */}
      <AnimatePresence>
        {showLeaderboard && checkinResult && (
          <LeaderboardView
            result={checkinResult}
            onClose={() => { setShowLeaderboard(false); setCheckinResult(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
