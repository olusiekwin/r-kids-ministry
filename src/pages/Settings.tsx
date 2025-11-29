import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <h2 className="text-xl font-medium mb-6">Settings & Support</h2>
        
        {/* Account Info */}
        <div className="border border-border rounded-sm p-4 mb-6">
          <h3 className="text-lg font-medium mb-3">Account</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {user?.name}</p>
            <p><span className="text-muted-foreground">Email:</span> {user?.email}</p>
            <p><span className="text-muted-foreground">Role:</span> {user?.role}</p>
          </div>
        </div>

        {/* Settings Links */}
        <div className="space-y-2 mb-6">
          <button className="btn-ghost w-full text-left justify-start">
            [Change Password]
          </button>
          <button className="btn-ghost w-full text-left justify-start">
            [MFA Settings]
          </button>
          <button className="btn-ghost w-full text-left justify-start">
            [Notification Preferences]
          </button>
        </div>

        {/* Support Links */}
        <div className="border-t border-border pt-6 mb-6">
          <h3 className="text-lg font-medium mb-3">Support</h3>
          <div className="space-y-2">
            <button className="btn-ghost w-full text-left justify-start">
              [Contact Support]
            </button>
            <button className="btn-ghost w-full text-left justify-start">
              [System Status]
            </button>
            <button className="btn-ghost w-full text-left justify-start">
              [Help Documentation]
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="border border-border rounded-sm p-4 mb-6">
          <h3 className="text-lg font-medium mb-3">System Information</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Version: 1.0.0</p>
            <p>Last Updated: 2025-01-26</p>
            <p>Status: Operational</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn-destructive w-full md:w-auto"
        >
          [Logout]
        </button>
      </main>

      <MobileNav />
    </div>
  );
}
