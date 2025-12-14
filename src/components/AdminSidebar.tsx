import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from './Logo';

interface SidebarItem {
  label: string;
  path: string;
  badge?: number;
}

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: SidebarItem[] = [
    { label: 'Dashboard', path: '/admin/parents' },
    { label: 'Manage Users', path: '/admin/manage-users' },
    { label: 'Session Management', path: '/admin/sessions' },
    { label: 'Session Analytics', path: '/admin/session-analytics' },
    { label: 'Sessions Calendar', path: '/calendar' },
    { label: 'Reports', path: '/admin/reports' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    if (path === '/calendar') {
      return location.pathname === '/calendar';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:left-0 md:pt-16 md:z-30 border-r border-border/50 glass">
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-4 py-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg scale-[1.02]'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:scale-[1.01]'
              }`}
            >
              <span className="text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-semibold border border-primary/30">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}

