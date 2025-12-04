import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import SetPassword from "./pages/SetPassword";
import UpdateProfile from "./pages/UpdateProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import CreateParent from "./pages/admin/CreateParent";
import PendingApprovals from "./pages/admin/PendingApprovals";
import ManageGuardians from "./pages/admin/ManageGuardians";
import Groups from "./pages/admin/Groups";
import AuditLog from "./pages/admin/AuditLog";
import Reports from "./pages/admin/Reports";
import Children from "./pages/admin/Children";
import CheckIns from "./pages/admin/CheckIns";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CheckIn from "./pages/teacher/CheckIn";
import ManualCheckIn from "./pages/teacher/ManualCheckIn";
import AddChildToGroup from "./pages/teacher/AddChildToGroup";
import GuardianAuthorize from "./pages/teacher/GuardianAuthorize";
import SendPickupNotification from "./pages/teacher/SendPickupNotification";
import ParentDashboard from "./pages/parent/ParentDashboard";
import AddChild from "./pages/parent/AddChild";
import ChildProfile from "./pages/parent/ChildProfile";
import ParentAttendance from "./pages/parent/ParentAttendance";
import PreCheckOut from "./pages/parent/PreCheckOut";
import Notifications from "./pages/parent/Notifications";
import TeenDashboard from "./pages/teen/TeenDashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route path="/update-profile" element={<UpdateProfile />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/manage-users" element={<ProtectedRoute requiredRole="admin"><ManageUsers /></ProtectedRoute>} />
            <Route path="/admin/children" element={<ProtectedRoute requiredRole="admin"><Children /></ProtectedRoute>} />
            <Route path="/admin/check-ins" element={<ProtectedRoute requiredRole="admin"><CheckIns /></ProtectedRoute>} />
            <Route path="/admin/parents" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/create-parent" element={<ProtectedRoute requiredRole="admin"><CreateParent /></ProtectedRoute>} />
            <Route path="/admin/pending-approvals" element={<ProtectedRoute requiredRole="admin"><PendingApprovals /></ProtectedRoute>} />
            <Route path="/admin/guardians" element={<ProtectedRoute requiredRole="admin"><ManageGuardians /></ProtectedRoute>} />
            <Route path="/admin/groups" element={<ProtectedRoute requiredRole="admin"><Groups /></ProtectedRoute>} />
            <Route path="/admin/audit-log" element={<ProtectedRoute requiredRole="admin"><AuditLog /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute requiredRole="admin"><Reports /></ProtectedRoute>} />
            
            {/* Teacher Routes */}
            <Route path="/teacher" element={<ProtectedRoute requiredRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/checkin" element={<ProtectedRoute requiredRole="teacher"><CheckIn /></ProtectedRoute>} />
            <Route path="/teacher/manual-checkin" element={<ProtectedRoute requiredRole="teacher"><ManualCheckIn /></ProtectedRoute>} />
            <Route path="/teacher/add-child" element={<ProtectedRoute requiredRole="teacher"><AddChildToGroup /></ProtectedRoute>} />
            <Route path="/teacher/authorize/:childId" element={<ProtectedRoute requiredRole="teacher"><GuardianAuthorize /></ProtectedRoute>} />
            <Route path="/teacher/send-pickup/:childId" element={<ProtectedRoute requiredRole="teacher"><SendPickupNotification /></ProtectedRoute>} />
            <Route path="/teacher/attendance" element={<ProtectedRoute requiredRole="teacher"><Reports /></ProtectedRoute>} />
            
            {/* Parent Routes */}
            <Route path="/parent" element={<ProtectedRoute requiredRole="parent"><ParentDashboard /></ProtectedRoute>} />
            <Route path="/parent/children" element={<ProtectedRoute requiredRole="parent"><ParentDashboard /></ProtectedRoute>} />
            <Route path="/parent/add-child" element={<ProtectedRoute requiredRole="parent"><AddChild /></ProtectedRoute>} />
            <Route path="/parent/notifications" element={<ProtectedRoute requiredRole="parent"><Notifications /></ProtectedRoute>} />
            <Route path="/parent/child/:childId" element={<ProtectedRoute requiredRole="parent"><ChildProfile /></ProtectedRoute>} />
            <Route path="/parent/child/:childId/checkout" element={<ProtectedRoute requiredRole="parent"><PreCheckOut /></ProtectedRoute>} />
            <Route path="/parent/attendance" element={<ProtectedRoute requiredRole="parent"><ParentAttendance /></ProtectedRoute>} />
            
            {/* Teen Routes */}
            <Route path="/teen" element={<ProtectedRoute requiredRole="teen"><TeenDashboard /></ProtectedRoute>} />
            <Route path="/teen/attendance" element={<ProtectedRoute requiredRole="teen"><TeenDashboard /></ProtectedRoute>} />
            
            {/* Settings */}
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
