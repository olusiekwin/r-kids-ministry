import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export function MobileNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const getNavItems = () => {
    switch (user.role) {
      case 'admin':
        return [
          { label: 'Dashboard', path: '/admin' },
          { label: 'Parents', path: '/admin/parents' },
          { label: 'Reports', path: '/admin/reports' },
          { label: 'Settings', path: '/settings' },
        ];
      case 'teacher':
        return [
          { label: 'Dashboard', path: '/teacher' },
          { label: 'Check-In', path: '/teacher/checkin' },
          { label: 'Attendance', path: '/teacher/attendance' },
          { label: 'Settings', path: '/settings' },
        ];
      case 'parent':
        return [
          { label: 'Dashboard', path: '/parent' },
          { label: 'Children', path: '/parent/children' },
          { label: 'Notifications', path: '/parent/notifications' },
          { label: 'Settings', path: '/settings' },
        ];
      case 'teen':
        return [
          { label: 'Dashboard', path: '/teen' },
          { label: 'Attendance', path: '/teen/attendance' },
          { label: 'Settings', path: '/settings' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="mobile-nav md:hidden">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`text-xs py-3 px-2 ${
            location.pathname === item.path
              ? 'text-foreground font-medium'
              : 'text-muted-foreground'
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
