import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { LogIn, Loader2, Lock, User } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { login as apiLogin } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function AdminLoginModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const authStore = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  async function onSubmit({ username, password }) {
    setLoading(true);
    try {
      const { data } = await apiLogin(username, password);
      authStore.login(data.access_token, { username: data.username });
      toast.success('Welcome back, Admin!');
      reset();
      onClose();
      navigate('/admin/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid credentials';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); reset(); }} title="Admin Login">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Username */}
        <div>
          <label htmlFor="admin-username" className="block text-[13px] font-medium text-ink-muted mb-1.5">
            Username
          </label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <input
              id="admin-username"
              type="text"
              autoComplete="username"
              placeholder="admin"
              {...register('username', { required: 'Username is required' })}
              className="input pl-9"
              aria-describedby={errors.username ? 'username-error' : undefined}
            />
          </div>
          {errors.username && (
            <p id="username-error" className="text-[12px] text-red-400 mt-1">{errors.username.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="admin-password" className="block text-[13px] font-medium text-ink-muted mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
              className="input pl-9"
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
          </div>
          {errors.password && (
            <p id="password-error" className="text-[12px] text-red-400 mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          id="admin-login-submit"
          type="submit"
          disabled={loading}
          className={`btn-primary w-full justify-center mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Signing in…</>
          ) : (
            <><LogIn size={15} /> Sign In</>
          )}
        </button>

        {/* Hint */}
        <p className="text-[12px] text-ink-muted text-center pt-1">
          Default: admin / passw0rd
        </p>
      </form>
    </Modal>
  );
}
