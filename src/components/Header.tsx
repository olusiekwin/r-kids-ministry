import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50 backdrop-blur-sm bg-background/95">
      <div className="container flex items-center justify-between py-3">
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
              className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-md hover:bg-muted transition-colors bg-background"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
