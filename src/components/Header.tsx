import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-medium">R KIDS</h1>
          {user && (
            <span className="text-sm text-muted-foreground">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm hidden md:block">{user.name}</span>
            <button onClick={handleLogout} className="btn-ghost btn-sm">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
