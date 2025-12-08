import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { ParentImageUpload } from '@/components/ParentImageUpload';
import { ParentImageModal } from '@/components/ParentImageModal';
import { parentsApi, checkInApi, checkOutApi, sessionsApi, sessionBookingsApi, childrenApi, groupsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/sonner';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Edit, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  Power,
  PowerOff,
  Eye,
  Printer,
  FileText,
  LogOut
} from 'lucide-react';

interface ParentDetails {
  id: string;
  parentId: string;
  name: string;
  email: string;
  phone: string;
  photoUrl?: string;
  status: string;
  activeUntil?: string;
  createdAt: string;
  childrenCount: number;
  children: ChildDetail[];
  recentCheckIns: any[];
}

interface ChildDetail {
  id: string;
  registrationId: string;
  name: string;
  dateOfBirth: string;
  group: {
    id: string;
    name: string;
  } | null;
  status: string;
  photoUrl?: string;
}

export default function ParentProfile() {
  const { parentId } = useParams<{ parentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [parent, setParent] = useState<ParentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modal states
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showEditChildModal, setShowEditChildModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ChildDetail | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Session-based check-in/checkout
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (parentId) {
      loadParentDetails();
      loadTodaySessions();
    }
  }, [parentId]);
  
  useEffect(() => {
    if (showCheckInModal || showCheckOutModal) {
      loadTodaySessions();
    }
  }, [showCheckInModal, showCheckOutModal]);
  
  const loadTodaySessions = async () => {
    try {
      setLoadingSessions(true);
      const today = new Date().toISOString().split('T')[0];
      const data = await sessionsApi.list({ date: today });
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadParentDetails = async () => {
    if (!parentId) return;
    
    setLoading(true);
    setError('');
    try {
      const details = await parentsApi.getDetails(parentId);
      setParent(details);
    } catch (error: any) {
      console.error('Failed to load parent details:', error);
      setError(error.message || 'Failed to load parent details');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedChild || !parent) return;
    if (!user?.id) {
      toast.error('Authentication required', {
        description: 'Please login again to continue.',
      });
      return;
    }
    
    // Require session selection for check-in
    if (!selectedSession) {
      toast.error('Session required', {
        description: 'Please select a session before checking in.',
      });
      return;
    }
    
    setActionLoading(selectedChild.id);
    try {
      await checkInApi.manual(selectedChild.id, selectedSession.id, user.id);
      await loadParentDetails();
      setShowCheckInModal(false);
      setSelectedChild(null);
      setSelectedSession(null);
      toast.success('Check-in successful', {
        description: `${selectedChild.name} has been checked in for ${selectedSession.title}.`,
      });
    } catch (error: any) {
      console.error('Check-in failed:', error);
      toast.error('Check-in failed', {
        description: error.message || 'Failed to check in child. Please try again.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedChild || !parent) return;
    
    setActionLoading(selectedChild.id);
    try {
      // Manual check-out - just record the timestamp
      // Note: Checkout doesn't require session, it finds the active check-in record
      await checkOutApi.release(selectedChild.id, parent.id, '');
      await loadParentDetails();
      setShowCheckOutModal(false);
      setSelectedChild(null);
      setSelectedSession(null);
      toast.success('Check-out successful', {
        description: `${selectedChild.name} has been checked out.`,
      });
    } catch (error: any) {
      console.error('Check-out failed:', error);
      toast.error('Check-out failed', {
        description: error.message || 'Failed to check out child. Please try again.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateDeactivate = async () => {
    if (!parent) return;
    
    setActionLoading('status');
    try {
      const newStatus = parent.status === 'active' ? 'inactive' : 'active';
      await parentsApi.update(parent.id, { status: newStatus });
      await loadParentDetails();
      setShowActivateModal(false);
      toast.success(`Parent ${newStatus === 'active' ? 'activated' : 'deactivated'}`, {
        description: `The parent account has been ${newStatus === 'active' ? 'activated' : 'suspended'} successfully.`,
      });
    } catch (error: any) {
      console.error('Status update failed:', error);
      toast.error('Status update failed', {
        description: error.message || 'Failed to update parent status. Please try again.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A';
    try {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return `${age} years`;
    } catch {
      return 'N/A';
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!parent) return;
    
    setUploadingImage(true);
    try {
      // Convert file to ArrayBuffer, then to hex string
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to hex string
      const hexString = Array.from(uint8Array)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      
      // Get file MIME type
      const mimeType = file.type || 'image/jpeg';
      
      // Send hex string with MIME type to backend
      await parentsApi.uploadImage(parent.id, hexString, mimeType);
      
      // Reload parent details to get updated image
      await loadParentDetails();
      toast.success('Image uploaded', {
        description: 'Parent image has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Failed to process image:', error);
      toast.error('Processing failed', {
        description: error.message || 'Failed to process image. Please try again.',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = async () => {
    if (!parent) return;
    
    setUploadingImage(true);
    try {
      await parentsApi.removeImage(parent.id);
      await loadParentDetails();
      toast.success('Image removed', {
        description: 'Parent image has been removed successfully.',
      });
    } catch (error: any) {
      console.error('Failed to remove image:', error);
      toast.error('Remove failed', {
        description: error.message || 'Failed to remove image. Please try again.',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Render field with "Not provided" fallback
  const renderField = (label: string, value: string | null | undefined, icon?: React.ReactNode) => {
    const displayValue = value && value.trim() ? value : 'Not provided';
    const isNotProvided = !value || !value.trim();
    
    return (
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 text-muted-foreground">{icon}</div>}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
          <div className={`text-sm ${isNotProvided ? 'text-muted-foreground italic' : 'text-foreground'}`}>
            {displayValue}
          </div>
        </div>
      </div>
    );
  };

  // Skeleton loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-8 mx-auto px-4 sm:px-6 lg:px-8 max-w-full">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Skeleton className="h-32 w-32 rounded-xl" />
              <Skeleton className="h-24" />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  if (error || !parent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-8 mx-auto px-4 sm:px-6 lg:px-8 max-w-full">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error || 'Parent not found'}</p>
            <button onClick={() => navigate('/admin')} className="btn-primary">
              Back to Search
            </button>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin')}
          className="btn-ghost mb-8 flex items-center gap-2 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Parent Search
        </button>

        {/* Two-Column Layout: Left (Photo + Primary Info) | Right (Full Details + Actions) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6">
          {/* Left Column: Photo + Primary Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="border-2 border-border/80 rounded-xl p-8 bg-background shadow-lg">
              <div className="flex flex-col items-center gap-4">
                {/* Parent Image with Upload */}
                <div className="relative">
                  <ParentImageUpload
                    currentImageUrl={parent.photoUrl}
                    parentName={parent.name}
                    onUpload={handleImageUpload}
                    onRemove={handleImageRemove}
                    disabled={uploadingImage}
                    size={120}
                    className="mb-2"
                  />
                  {parent.photoUrl && (
                    <button
                      onClick={() => setShowImageModal(true)}
                      className="mt-2 w-full btn-secondary text-xs py-1.5 flex items-center justify-center gap-1"
                      aria-label="View full size image"
                    >
                      <Eye className="w-3 h-3" />
                      View Full Size
                    </button>
                  )}
                </div>

                {/* Primary Info */}
                <div className="w-full space-y-4 text-center">
                  <div>
                    <span className="font-mono font-bold text-base bg-foreground text-background px-3 py-1.5 rounded-md inline-block mb-2">
                      {parent.parentId}
                    </span>
                    <h1 className="text-2xl font-bold text-foreground mb-2">{parent.name}</h1>
                    {parent.status === 'active' ? (
                      <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-medium">
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Children</div>
                      <div className="text-lg font-semibold text-foreground">{parent.childrenCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Status</div>
                      <div className="text-lg font-semibold text-foreground capitalize">{parent.status}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

                 {/* Right Column: Full Details + Actions */}
                 <div className="lg:col-span-2 space-y-6">
                   {/* Contact Information Card */}
                   <div className="border-2 border-border/80 rounded-xl p-6 bg-background shadow-lg">
                     <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                       <User className="w-5 h-5" />
                       Contact Information
                     </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField('Email Address', parent.email, <Mail className="w-4 h-4" />)}
                {renderField('Phone Number', parent.phone, <Phone className="w-4 h-4" />)}
                {renderField('Registration Date', formatDate(parent.createdAt), <Calendar className="w-4 h-4" />)}
                {renderField('Status', parent.status === 'active' ? 'Active' : 'Inactive', <Clock className="w-4 h-4" />)}
                {parent.activeUntil && renderField('Active Until', formatDate(parent.activeUntil), <Calendar className="w-4 h-4" />)}
              </div>
            </div>

            {/* Actions Card */}
            <div className="border-2 border-border/80 rounded-xl p-6 bg-background shadow-lg">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Actions
              </h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`/admin/parents/${parent.id}/edit`)}
                  className="btn-primary flex items-center gap-2 px-6 py-3"
                >
                  <Edit className="w-4 h-4" />
                  Edit Parent Details
                </button>
                {parent.status === 'active' ? (
                  <button
                    onClick={() => setShowActivateModal(true)}
                    className="btn-secondary flex items-center gap-2 px-6 py-3 text-red-600 hover:bg-red-50 border-red-200"
                  >
                    <PowerOff className="w-4 h-4" />
                    Deactivate Parent
                  </button>
                ) : (
                  <button
                    onClick={() => setShowActivateModal(true)}
                    className="btn-primary flex items-center gap-2 px-6 py-3"
                  >
                    <Power className="w-4 h-4" />
                    Activate Parent
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Children Section */}
        <div className="border-2 border-border/80 rounded-xl p-6 bg-background shadow-lg mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              Children ({parent.children.length})
            </h2>
            <button
              onClick={() => navigate(`/admin/parents/${parent.id}/add-child`)}
              className="btn-primary flex items-center gap-2 px-6 py-3"
            >
              <Users className="w-4 h-4" />
              Add Child
            </button>
          </div>

          {parent.children.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No children registered for this parent</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parent.children.map((child) => (
                <div
                  key={child.id}
                  className="border-2 border-border/80 rounded-xl p-6 hover:border-foreground/50 hover:shadow-md transition-all duration-200 bg-background"
                >
                  <div className="flex items-start gap-4 mb-4">
                    {child.photoUrl ? (
                      <img
                        src={child.photoUrl}
                        alt={child.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                        <User className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                          {child.registrationId}
                        </span>
                        <h3 className="font-semibold text-foreground">{child.name}</h3>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Age: {calculateAge(child.dateOfBirth)}</p>
                        {child.group && (
                          <p>Group: <span className="font-medium">{child.group.name}</span></p>
                        )}
                        <p>DOB: {formatDate(child.dateOfBirth)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-4 border-t border-border">
                    <button
                      onClick={() => {
                        setSelectedChild(child);
                        setShowEditChildModal(true);
                      }}
                      className="btn-secondary flex items-center justify-center gap-2 text-sm py-2 px-3"
                      title="Edit child details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedChild(child);
                        setShowCheckInModal(true);
                      }}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Check In
                    </button>
                    <button
                      onClick={() => {
                        setSelectedChild(child);
                        setShowCheckOutModal(true);
                      }}
                      className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm py-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Check Out
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Check-In History */}
        {parent.recentCheckIns && parent.recentCheckIns.length > 0 && (
          <div className="border-2 border-border/80 rounded-xl p-6 bg-background shadow-lg">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Recent Check-In History
            </h2>
            <div className="space-y-3">
              {parent.recentCheckIns.map((record: any, index: number) => {
                const formatDateTime = (timestamp: string) => {
                  if (!timestamp) return 'N/A';
                  try {
                    const date = new Date(timestamp);
                    return date.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    });
                  } catch {
                    return timestamp;
                  }
                };
                
                const formatTime = (timestamp: string) => {
                  if (!timestamp) return '';
                  try {
                    const date = new Date(timestamp);
                    return date.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    });
                  } catch {
                    return timestamp;
                  }
                };
                
                return (
                <div
                  key={record.recordId || index}
                  className="border border-border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-2">
                      {record.childName || 'Unknown Child'}
                      {record.childRegistrationId && (
                        <span className="font-mono text-xs text-muted-foreground ml-2">
                          ({record.childRegistrationId})
                        </span>
                      )}
                    </p>
                    
                    {/* Check-In Timestamp */}
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Checked In:</span>
                        <span className="text-sm text-foreground ml-2 font-medium">
                          {record.timestampIn ? formatDateTime(record.timestampIn) : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Check-Out Timestamp */}
                    {record.timestampOut && (
                      <div className="flex items-center gap-2 mb-1">
                        <LogOut className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Checked Out:</span>
                          <span className="text-sm text-foreground ml-2 font-medium">
                            {formatDateTime(record.timestampOut)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Duration if checked out */}
                    {record.timestampIn && record.timestampOut && (
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Duration:</span>
                          <span className="text-sm text-foreground ml-2 font-medium">
                            {(() => {
                              try {
                                const checkIn = new Date(record.timestampIn);
                                const checkOut = new Date(record.timestampOut);
                                const diffMs = checkOut.getTime() - checkIn.getTime();
                                const diffMins = Math.floor(diffMs / 60000);
                                const hours = Math.floor(diffMins / 60);
                                const mins = diffMins % 60;
                                return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                              } catch {
                                return 'N/A';
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Method and Teacher */}
                    <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                      {record.method && (
                        <span>Method: <span className="font-medium">{record.method}</span></span>
                      )}
                      {record.teacherName && (
                        <span>Teacher: <span className="font-medium">{record.teacherName}</span></span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {record.timestampOut ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Checked Out
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Checked In
                      </span>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Check-In Confirmation Modal */}
        <AlertDialog open={showCheckInModal} onOpenChange={(open) => {
          setShowCheckInModal(open);
          if (!open) {
            setSelectedSession(null);
            setSelectedChild(null);
          }
        }}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Check In Child</AlertDialogTitle>
              <AlertDialogDescription>
                Select a session for <strong>{selectedChild?.name}</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-4">
              {loadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading sessions...</span>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No sessions available for today.</p>
                  <p className="text-xs mt-1">Please create a session in the calendar first.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={`w-full text-left p-3 rounded-md border-2 transition-all ${
                        selectedSession?.id === session.id
                          ? 'border-foreground bg-muted'
                          : 'border-border hover:border-foreground/50'
                      }`}
                    >
                      <div className="font-medium">{session.title || 'Session'}</div>
                      {session.start_time && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(`2000-01-01T${session.start_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {session.end_time && ` - ${new Date(`2000-01-01T${session.end_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCheckIn}
                disabled={actionLoading !== null || !selectedSession || loadingSessions}
                className="bg-foreground text-background"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Checking In...
                  </>
                ) : (
                  'Confirm Check-In'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Check-Out Confirmation Modal */}
        <AlertDialog open={showCheckOutModal} onOpenChange={setShowCheckOutModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Check-Out</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to check out <strong>{selectedChild?.name}</strong>?
                This will record their departure time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCheckOut}
                disabled={actionLoading !== null}
                className="bg-foreground text-background"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Processing...
                  </>
                ) : (
                  'Confirm Check-Out'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Image Preview Modal */}
        {parent.photoUrl && (
          <ParentImageModal
            isOpen={showImageModal}
            onClose={() => setShowImageModal(false)}
            imageUrl={parent.photoUrl}
            alt={`Parent image for ${parent.name}`}
          />
        )}

        {/* Activate/Deactivate Confirmation Modal */}
        <AlertDialog open={showActivateModal} onOpenChange={setShowActivateModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {parent.status === 'active' ? 'Deactivate Parent' : 'Activate Parent'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to {parent.status === 'active' ? 'deactivate' : 'activate'} <strong>{parent.name}</strong>?
                {parent.status === 'active' && ' This will prevent them from checking in/out children.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleActivateDeactivate}
                disabled={actionLoading !== null}
                className={parent.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-foreground text-background'}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Processing...
                  </>
                ) : (
                  parent.status === 'active' ? 'Deactivate' : 'Activate'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

