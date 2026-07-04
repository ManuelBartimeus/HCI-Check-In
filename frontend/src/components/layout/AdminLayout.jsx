import { useNavigate, useLocation, NavLink, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard, Users, CalendarDays, ClipboardList,
  BarChart3, Trophy, Upload, Settings, LogOut, Menu, X, Cross,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { logout as apiLogout } from '@/api/auth';
import toast from 'react-hot-toast';
import hciLogo from '@/assets/hci_logo.png';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/members', label: 'Members', icon: Users },
  { to: '/admin/meetings', label: 'Meetings', icon: CalendarDays },
  { to: '/admin/attendance', label: 'Attendance', icon: ClipboardList },
  { to: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/import', label: 'Import CSV', icon: Upload },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({ onClose }) {
  const authStore = useAuthStore();
  const navigate = useNavigate();

  async function handleLogout() {
    try { await apiLogout(); } catch (_) { }
    authStore.logout();
    toast.success('Logged out');
    navigate('/');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-hairline">
        <div className="w-8 h-8 rounded-lg spotlight-red flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img src={hciLogo} alt="Logo" className="w-6 h-6 object-contain drop-shadow-md" />
        </div>
        <div>
          <div className="text-[13px] font-semibold text-ink leading-none">Admin Portal</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Harvest Chapel KNUST</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn-icon ml-auto !w-7 !h-7" aria-label="Close menu">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" aria-label="Admin navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-all duration-100 ${isActive
                ? 'bg-surface-2 text-ink'
                : 'text-ink-muted hover:text-ink hover:bg-surface-1'
              }`
            }
          >
            <Icon size={15} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-hairline">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-[13px] font-medium
                     text-ink-muted hover:text-red-400 hover:bg-red-500/8 transition-all duration-100"
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-surface-1 border-r border-hairline flex-shrink-0 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-canvas/70 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: -224 }} animate={{ x: 0 }} exit={{ x: -224 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-56 bg-surface-1 border-r border-hairline z-50 lg:hidden flex flex-col"
            >
              <SidebarContent onClose={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-56">
        {/* Top bar (mobile only) */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-surface-1 border-b border-hairline">
          <button
            onClick={() => setDrawerOpen(true)}
            className="btn-icon"
            aria-label="Open menu"
          >
            <Menu size={16} />
          </button>
          <span className="text-[13px] font-semibold text-ink">Admin Portal</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1200px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
