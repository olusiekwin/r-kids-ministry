import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types';

export default function Onboarding() {
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    navigate('/login', { state: { role } });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-medium text-center mb-2">R KIDS</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Church Children & Teens Ministry
        </p>
        
        <p className="text-sm text-center mb-6">Select your role to continue:</p>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleRoleSelect('admin')}
            className="btn-secondary py-6"
          >
            Admin
          </button>
          <button
            onClick={() => handleRoleSelect('teacher')}
            className="btn-secondary py-6"
          >
            Teacher
          </button>
          <button
            onClick={() => handleRoleSelect('parent')}
            className="btn-secondary py-6"
          >
            Parent
          </button>
          <button
            onClick={() => handleRoleSelect('teen')}
            className="btn-secondary py-6"
          >
            Teen
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8">
          Demo: [role]@rkids.church / password123 / MFA: 123456
        </p>
      </div>
    </div>
  );
}
