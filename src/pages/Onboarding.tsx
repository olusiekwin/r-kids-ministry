import { useNavigate } from 'react-router-dom';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { Logo } from '@/components/Logo';

export default function Onboarding() {
  const navigate = useNavigate();

  const features = [
    {
      title: 'QR Code Check-In',
      description: 'Quick and secure check-in using QR codes generated on parent devices'
    },
    {
      title: 'Secure Guardian Authorization',
      description: 'Multi-factor authentication ensures children are released only to authorized guardians'
    },
    {
      title: 'Real-Time Attendance',
      description: 'Track attendance across all groups with detailed reports and analytics'
    },
    {
      title: 'Group Management',
      description: 'Organize children by age groups: Little Angels, Saints, Disciples, and Trendsetters'
    },
    {
      title: 'Comprehensive Records',
      description: 'Maintain detailed profiles, medical information, and emergency contacts'
    },
    {
      title: 'Audit Trail',
      description: 'Complete logging of all actions for security and compliance'
    }
  ];

  const roleBenefits = [
    {
      role: 'admin' as UserRole,
      title: 'Administrator',
      description: 'Full system access and management',
      features: [
        'Manage parents and guardians',
        'View comprehensive reports',
        'Monitor audit logs',
        'Configure groups and settings'
      ]
    },
    {
      role: 'teacher' as UserRole,
      title: 'Teacher',
      description: 'Streamlined check-in and attendance',
      features: [
        'QR code scanning',
        'Manual check-in options',
        'Guardian verification',
        'Group attendance tracking'
      ]
    },
    {
      role: 'parent' as UserRole,
      title: 'Parent',
      description: 'Easy check-in and child management',
      features: [
        'Pre-check-in with QR codes',
        'View child profiles',
        'Track attendance history',
        'Manage guardian authorizations'
      ]
    },
    {
      role: 'teen' as UserRole,
      title: 'Teen',
      description: 'Self-service attendance tracking',
      features: [
        'View personal attendance',
        'Check session history',
        'See group information'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Video Background */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/Rice farm stock video.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10">
        {/* Simple Header for Landing */}
        <header className="border-b border-white/20 bg-black/30 backdrop-blur-sm">
          <div className="container flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Logo size={40} className="rounded-full" />
              <h1 className="text-xl font-bold text-white tracking-tight">R-KIDS</h1>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="border-b border-white/20">
          <div className="container py-12 md:py-20">
            <div className="text-center max-w-3xl mx-auto">
              <div className="mb-8 flex justify-center">
                <Logo size={150} className="rounded-full shadow-2xl" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg">
                R-KIDS
              </h1>
              <p className="text-xl md:text-2xl font-semibold text-white mb-2 drop-shadow-md">
                Ruach South Assembly
              </p>
              <p className="text-lg text-white/90 mb-2 italic drop-shadow-md">
                Growth Happens Here
              </p>
              <p className="text-base text-white/80 mb-8 drop-shadow-sm">
                Secure Children & Teens Management System
              </p>
              
              <div className="flex justify-center mb-12">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-white text-black px-12 py-4 text-lg font-semibold rounded-md hover:bg-white/90 transition-colors shadow-lg"
                >
                  Sign In to Your Account
                </button>
              </div>
              <p className="text-sm text-white/70 text-center">
                Your role will be automatically determined from your account
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-16 border-b border-white/20 bg-black/20 backdrop-blur-sm">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12 text-white drop-shadow-lg">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="border-2 border-white/30 rounded-md p-6 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:shadow-xl transition-all"
                >
                  <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-sm text-white/80 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-12 md:py-16 border-b border-white/20 bg-black/30 backdrop-blur-sm">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12 text-white drop-shadow-lg">How It Works</h2>
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center text-2xl font-bold mx-auto mb-4 border-2 border-white shadow-lg">
                    1
                  </div>
                  <h3 className="font-semibold mb-2 text-white">Pre-Check-In</h3>
                  <p className="text-sm text-white/80 leading-relaxed">
                    Parents generate a QR code before arriving at the ministry
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center text-2xl font-bold mx-auto mb-4 border-2 border-white shadow-lg">
                    2
                  </div>
                  <h3 className="font-semibold mb-2 text-white">Quick Scan</h3>
                  <p className="text-sm text-white/80 leading-relaxed">
                    Teachers scan the QR code for instant check-in at the door
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center text-2xl font-bold mx-auto mb-4 border-2 border-white shadow-lg">
                    3
                  </div>
                  <h3 className="font-semibold mb-2 text-white">Secure Release</h3>
                  <p className="text-sm text-white/80 leading-relaxed">
                    Authorized guardians verify identity with OTP before pickup
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Role-Based Access Section */}
        <section className="py-12 md:py-16 border-b border-white/20 bg-black/20 backdrop-blur-sm">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12 text-white drop-shadow-lg">System Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {roleBenefits.map((roleInfo) => (
                <div
                  key={roleInfo.role}
                  className="border-2 border-white/30 rounded-md p-6 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:shadow-xl transition-all"
                >
                  <h3 className="text-xl font-semibold mb-2 text-white">{roleInfo.title}</h3>
                  <p className="text-sm text-white/80 mb-4">{roleInfo.description}</p>
                  <ul className="space-y-2">
                    {roleInfo.features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-white/70">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <button
                onClick={() => navigate('/login')}
                className="bg-white text-black px-12 py-4 text-lg font-semibold rounded-md hover:bg-white/90 transition-colors shadow-lg"
              >
                Sign In to Access Your Portal
              </button>
            </div>
          </div>
        </section>

        {/* QR Code Example Section */}
        <section className="py-12 md:py-16 border-b border-white/20 bg-black/20 backdrop-blur-sm">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4 text-white drop-shadow-lg">Quick Check-In with QR Codes</h2>
              <p className="text-white/80 mb-8">
                Parents can generate QR codes in advance for faster check-in. Simply scan at the door!
              </p>
              <div className="flex justify-center bg-white/10 backdrop-blur-md p-6 rounded-lg border-2 border-white/30">
                <QRCodeDisplay value="RS073/01" />
              </div>
            </div>
          </div>
        </section>

        {/* Groups Section */}
        <section className="py-12 md:py-16 border-b border-white/20 bg-black/30 backdrop-blur-sm">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12 text-white drop-shadow-lg">Age Groups</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { name: 'Little Angels', age: '3-5 years', room: 'Room 101', time: '9:30 AM' },
                { name: 'Saints', age: '6-9 years', room: 'Room 102', time: '9:30 AM' },
                { name: 'Disciples', age: '10-12 years', room: 'Room 201', time: '9:30 AM' },
                { name: 'Trendsetters', age: '13-17 years', room: 'Room 205', time: '9:30 AM' }
              ].map((group) => (
                <div
                  key={group.name}
                  className="border-2 border-white/30 rounded-md p-6 text-center bg-white/10 backdrop-blur-md"
                >
                  <h3 className="text-lg font-medium mb-2 text-white">{group.name}</h3>
                  <p className="text-sm text-white/80 mb-1">{group.age}</p>
                  <p className="text-xs text-white/70">{group.room}</p>
                  <p className="text-xs text-white/70">Sundays {group.time}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-black/20 backdrop-blur-sm">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4 text-white drop-shadow-lg">Ready to Get Started?</h2>
              <p className="text-white/80 mb-8">
                Sign in with your account credentials to access the R-KIDS Ministry Management System
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-white text-black px-12 py-4 text-lg font-semibold rounded-md hover:bg-white/90 transition-colors shadow-lg"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/20 py-8 bg-black/30 backdrop-blur-sm">
          <div className="container text-center">
            <p className="text-sm font-medium text-white mb-1">R-KIDS - Ruach South Assembly</p>
            <p className="text-xs text-white/80 italic mb-2">Growth Happens Here</p>
            <p className="text-xs text-white/70">Version 1.0.0 • Secure • Reliable • Easy to Use</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
