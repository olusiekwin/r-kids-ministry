import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Onboarding from './Onboarding';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Super admins should go to /admin, not /super_admin
      const redirectPath = user.role === 'super_admin' ? '/admin' : `/${user.role}`;
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);

  return <Onboarding />;
};

export default Index;
