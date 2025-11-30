import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { childrenApi } from '@/services/api';
import { Child } from '@/types';

export default function ChildProfile() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (childId) {
      loadChild();
    }
  }, [childId]);

  const loadChild = async () => {
    try {
      setLoading(true);
      const data = await childrenApi.get(childId!);
      setChild(data);
    } catch (error) {
      console.error('Failed to load child:', error);
      setChild(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6">
          <p className="text-destructive">Child not found</p>
          <button onClick={() => navigate('/parent')} className="btn-secondary mt-4">
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Child Profile</h1>
          <p className="text-muted-foreground">View child details and guardians</p>
        </div>
        
        <div className="border border-border rounded-md p-6 mb-6 bg-background shadow-sm">
          <div className="flex items-start gap-6">
            <PhotoPlaceholder size="lg" className="w-24 h-24" />
            <div className="flex-1">
              <p className="font-mono text-sm text-muted-foreground mb-1">
                {child.registrationId}
              </p>
              <h3 className="text-2xl font-semibold mb-2">{child.name}</h3>
              <div className="space-y-1 text-sm">
                <p>Age: {child.age}</p>
                <p>Group: {child.group}</p>
                <p>Status: {child.status}</p>
                {child.gender && <p>Gender: {child.gender}</p>}
                {child.dateOfBirth && <p>Date of Birth: {child.dateOfBirth}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3">Authorized Guardians</h4>
          {child.guardians && child.guardians.length > 0 ? (
            <div className="border border-border rounded-md divide-y divide-border bg-background shadow-sm">
            {child.guardians.map((guardian) => (
                <div key={guardian.id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                  <span className={guardian.status === 'active' ? 'text-foreground' : 'text-muted-foreground'}>
                  {guardian.status === 'active' ? '✓' : '✗'}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{guardian.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {guardian.relationship}
                    {guardian.expiresAt && ` • Expires: ${guardian.expiresAt}`}
                    {guardian.status === 'expired' && ' • Expired'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <p className="text-muted-foreground">No guardians assigned</p>
          )}
        </div>

        <button onClick={() => navigate('/parent')} className="btn-secondary">
          Back to Dashboard
        </button>
      </main>

      <MobileNav />
    </div>
  );
}
