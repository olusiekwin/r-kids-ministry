import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { parentsApi } from '@/services/api';
import { ArrowLeft, ArrowRight, Check, User, Mail, Phone, MapPin, UserPlus, AlertCircle } from 'lucide-react';

type Step = 1 | 2 | 3;

export default function AddParent() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdParentId, setCreatedParentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Step 2: Contact Details
    address: '',
    city: '',
    state: '',
    zipCode: '',
    emergencyContact: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    
    // Step 3: Additional Info
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateStep = (step: Step): boolean => {
    setError('');
    
    if (step === 1) {
      if (!formData.firstName.trim()) {
        setError('First name is required');
        return false;
      }
      if (!formData.lastName.trim()) {
        setError('Last name is required');
        return false;
      }
      if (!formData.phone.trim()) {
        setError('Phone number is required');
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep((currentStep + 1) as Step);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    } else {
      navigate('/admin');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setLoading(true);
    setError('');
    
    try {
      const result = await parentsApi.create({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email || undefined,
        phone: formData.phone,
        address: formData.address || undefined,
      });
      
      setCreatedParentId(result.parentId || result.id);
      // Move to success step
      setCurrentStep(3);
    } catch (error: any) {
      console.error('Failed to create parent:', error);
      setError(error.message || 'Failed to create parent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewParent = () => {
    if (createdParentId) {
      navigate(`/admin/parents/${createdParentId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8 mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBack}
              className="btn-ghost flex items-center gap-2 px-4 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentStep >= 1 ? 'bg-foreground text-background border-foreground' : 'border-border'
                }`}>
                  {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <span className="hidden sm:inline text-sm font-medium">Basic Info</span>
              </div>
              <div className={`h-1 w-16 ${currentStep >= 2 ? 'bg-foreground' : 'bg-border'}`} />
              <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentStep >= 2 ? 'bg-foreground text-background border-foreground' : 'border-border'
                }`}>
                  {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
                </div>
                <span className="hidden sm:inline text-sm font-medium">Contact Details</span>
              </div>
              <div className={`h-1 w-16 ${currentStep >= 3 ? 'bg-foreground' : 'bg-border'}`} />
              <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentStep >= 3 ? 'bg-foreground text-background border-foreground' : 'border-border'
                }`}>
                  3
                </div>
                <span className="hidden sm:inline text-sm font-medium">Review</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="border-2 border-border rounded-lg p-8 bg-background">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Basic Information</h2>
                  <p className="text-muted-foreground">Enter the parent's basic details</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="input-field w-full"
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="input-field w-full"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input-field w-full pl-10"
                      placeholder="john.doe@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="input-field w-full pl-10"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-secondary px-6"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary px-6 flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Contact Details */}
          {currentStep === 2 && (
            <div className="border-2 border-border rounded-lg p-8 bg-background">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Contact Details</h2>
                  <p className="text-muted-foreground">Additional contact information</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="input-field w-full"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="input-field w-full"
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="input-field w-full"
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      className="input-field w-full"
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">Contact Name</label>
                      <input
                        type="text"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleChange}
                        className="input-field w-full"
                        placeholder="Emergency contact name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">Contact Phone</label>
                      <input
                        type="tel"
                        name="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={handleChange}
                        className="input-field w-full"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <label className="block text-sm font-medium text-foreground">Relationship</label>
                    <select
                      name="emergencyRelationship"
                      value={formData.emergencyRelationship}
                      onChange={handleChange}
                      className="input-field w-full"
                    >
                      <option value="">Select relationship</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-secondary px-6 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary px-6 flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {currentStep === 3 && !createdParentId && (
            <div className="border-2 border-border rounded-lg p-8 bg-background">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Review & Submit</h2>
                  <p className="text-muted-foreground">Review the information before creating the parent</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border border-border rounded-lg p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{formData.email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{formData.phone}</p>
                    </div>
                  </div>
                </div>

                {(formData.address || formData.city || formData.state) && (
                  <div className="border border-border rounded-lg p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Address
                    </h3>
                    <p className="text-sm">
                      {formData.address && <>{formData.address}<br /></>}
                      {formData.city && formData.city}
                      {formData.state && `, ${formData.state}`}
                      {formData.zipCode && ` ${formData.zipCode}`}
                    </p>
                  </div>
                )}

                {formData.emergencyContact && (
                  <div className="border border-border rounded-lg p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Emergency Contact
                    </h3>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{formData.emergencyContact}</span></p>
                      {formData.emergencyPhone && (
                        <p><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{formData.emergencyPhone}</span></p>
                      )}
                      {formData.emergencyRelationship && (
                        <p><span className="text-muted-foreground">Relationship:</span> <span className="font-medium">{formData.emergencyRelationship}</span></p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Additional Notes (Optional)</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    className="input-field w-full"
                    placeholder="Any additional notes about this parent..."
                  />
                </div>
              </div>

              <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-secondary px-6 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-6 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create Parent
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Success Step */}
          {createdParentId && (
            <div className="border-2 border-green-500 rounded-lg p-12 bg-green-50 text-center">
              <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Parent Created Successfully!</h2>
              <p className="text-muted-foreground mb-6">
                Parent has been registered in the system
              </p>
              <div className="bg-background border-2 border-border rounded-lg p-6 max-w-md mx-auto mb-6">
                <p className="text-sm text-muted-foreground mb-2">Parent ID</p>
                <p className="text-2xl font-mono font-bold text-foreground">
                  {createdParentId}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This ID can be used for check-in and check-out operations
                </p>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="btn-secondary px-6"
                >
                  Back to Search
                </button>
                <button
                  type="button"
                  onClick={handleViewParent}
                  className="btn-primary px-6"
                >
                  View Parent Profile
                </button>
              </div>
            </div>
          )}
        </form>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}


