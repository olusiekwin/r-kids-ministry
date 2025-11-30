import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

export function Header() {
  const { user, logout, showIdleWarning } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      {/* Idle Warning Banner */}
      {showIdleWarning && user && (
        <div className="bg-yellow-500 text-black text-center py-2 px-4 sticky top-0 z-50">
          <p className="text-sm font-medium">
            ⚠️ Your session will expire in 1 minute due to inactivity. 
            <button 
              onClick={(e) => {
                e.preventDefault();
                // Any click will reset the timer via the activity listeners
                // This button just provides a clear action
                window.dispatchEvent(new Event('mousedown'));
              }}
              className="ml-2 underline font-semibold hover:text-yellow-800"
            >
              Stay logged in
            </button>
          </p>
        </div>
      )}
      
      <header className="border-b border-border bg-background sticky top-0 z-50 backdrop-blur-sm bg-background/95">
        <div className="container flex items-center justify-between py-3">
          {/* Left side: Logo and Role */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Logo size={32} />
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">R-KIDS</h1>
                <p className="text-xs text-muted-foreground hidden md:block">Ruach South Assembly</p>
              </div>
            </div>
            {user && (
              <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            )}
          </div>
          
          {/* Right side: User info and Logout */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-md hover:bg-muted transition-colors bg-background whitespace-nowrap"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
