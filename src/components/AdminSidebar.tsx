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
    { label: 'Dashboard', path: '/admin' },
    { label: 'Manage Users', path: '/admin/manage-users' },
    { label: 'All Children', path: '/admin/children' },
    { label: 'Pending Approvals', path: '/admin/pending-approvals', badge: 0 },
    { label: 'Check-Ins & Check-Outs', path: '/admin/check-ins' },
    { label: 'Manage Guardians', path: '/admin/guardians' },
    { label: 'Groups', path: '/admin/groups' },
    { label: 'Reports', path: '/admin/reports' },
    { label: 'Audit Log', path: '/admin/audit-log' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:left-0 md:pt-16 md:z-30 border-r border-border bg-background">
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-4 py-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span className="text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-background text-foreground px-2 py-0.5 rounded-full text-xs font-semibold">
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

