import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { mockChildren } from '@/data/mockData';

export default function ChildProfile() {
  const navigate = useNavigate();
  const { childId } = useParams();

  const child = mockChildren.find(c => c.registrationId === childId);

  if (!child) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6">
          <p className="text-destructive">Child not found: {childId}</p>
          <button onClick={() => navigate('/parent')} className="btn-secondary mt-4">
            [Back to Dashboard]
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <h2 className="text-xl font-medium mb-6">Child Profile</h2>
        
        {/* Profile Card */}
        <div className="border border-border rounded-sm p-6 mb-6">
          <div className="flex items-start gap-6">
            <PhotoPlaceholder size="lg" className="w-24 h-24" />
            <div className="flex-1">
              <p className="font-mono text-sm text-muted-foreground mb-1">
                {child.registrationId}
              </p>
              <h3 className="text-2xl font-medium mb-2">{child.name}</h3>
              <div className="space-y-1 text-sm">
                <p>Age: {child.age}</p>
                <p>Group: {child.group}</p>
                <p>Status: Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Guardians Section */}
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-3">Authorized Guardians</h4>
          <div className="border border-border rounded-sm divide-y divide-border">
            {child.guardians.map((guardian) => (
              <div key={guardian.id} className="flex items-center gap-3 p-4">
                <span className={guardian.status === 'active' ? 'text-success' : 'text-destructive'}>
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
        </div>

        {/* Medical/Allergies Section */}
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-3">Medical Information</h4>
          <div className="border border-border rounded-sm p-4">
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Allergies:</span> None reported</p>
              <p><span className="text-muted-foreground">Medications:</span> None</p>
              <p><span className="text-muted-foreground">Special Needs:</span> None</p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-3">Emergency Contact</h4>
          <div className="border border-border rounded-sm p-4">
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {child.guardians[0]?.name || 'N/A'}</p>
              <p><span className="text-muted-foreground">Phone:</span> +1 (555) 123-4567</p>
              <p><span className="text-muted-foreground">Relationship:</span> {child.guardians[0]?.relationship || 'N/A'}</p>
            </div>
          </div>
        </div>

        <button onClick={() => navigate('/parent')} className="btn-secondary">
          [Back to Dashboard]
        </button>
      </main>

      <MobileNav />
    </div>
  );
}
