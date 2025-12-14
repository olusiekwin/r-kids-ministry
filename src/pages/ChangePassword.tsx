import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/services/api';
import { toast } from '@/components/ui/sonner';
import { Logo } from '@/components/Logo';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      toast.error('User ID not found');
      return;
    }

    setLoading(true);

    try {
      await usersApi.changePassword({
        userId: user.id,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      // Update user to mark password as set
      const updatedUser = {
        ...user,
        passwordSet: true,
        password_set: true,
      };
      updateUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success('Password changed successfully!');
      
      // Redirect to admin dashboard
      navigate('/admin', { replace: true });
    } catch (error: any) {
      const errorMessage = error.body?.message || error.message || 'Failed to change password';
      toast.error('Failed to change password', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <div className="min-h-screen liquid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-strong rounded-2xl p-8 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size={80} className="rounded-full" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Change Password</h1>
            <p className="text-sm text-muted-foreground">
              {user?.role === 'admin' || user?.role === 'super_admin' 
                ? 'Please set a secure password to continue'
                : 'Update your password'}
            </p>
            {user && (
              <p className="text-xs text-muted-foreground mt-2 font-mono">{user.email}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 glass border-2 border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Enter current password"
                required
              />
              {errors.currentPassword && (
                <p className="text-xs text-destructive">{errors.currentPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 glass border-2 border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Enter new password (min 8 characters)"
                required
              />
              {errors.newPassword && (
                <p className="text-xs text-destructive">{errors.newPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 glass border-2 border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Confirm new password"
                required
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
