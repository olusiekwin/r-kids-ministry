import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CreateParent from "./pages/admin/CreateParent";
import ManageGuardians from "./pages/admin/ManageGuardians";
import Groups from "./pages/admin/Groups";
import AuditLog from "./pages/admin/AuditLog";
import Reports from "./pages/admin/Reports";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CheckIn from "./pages/teacher/CheckIn";
import ManualCheckIn from "./pages/teacher/ManualCheckIn";
import GuardianAuthorize from "./pages/teacher/GuardianAuthorize";
import ParentDashboard from "./pages/parent/ParentDashboard";
import ChildProfile from "./pages/parent/ChildProfile";
import ParentAttendance from "./pages/parent/ParentAttendance";
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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/parents" element={<AdminDashboard />} />
            <Route path="/admin/create-parent" element={<CreateParent />} />
            <Route path="/admin/guardians" element={<ManageGuardians />} />
            <Route path="/admin/groups" element={<Groups />} />
            <Route path="/admin/audit-log" element={<AuditLog />} />
            <Route path="/admin/reports" element={<Reports />} />
            
            {/* Teacher Routes */}
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/checkin" element={<CheckIn />} />
            <Route path="/teacher/manual-checkin" element={<ManualCheckIn />} />
            <Route path="/teacher/authorize/:childId" element={<GuardianAuthorize />} />
            <Route path="/teacher/attendance" element={<Reports />} />
            
            {/* Parent Routes */}
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/parent/children" element={<ParentDashboard />} />
            <Route path="/parent/child/:childId" element={<ChildProfile />} />
            <Route path="/parent/attendance" element={<ParentAttendance />} />
            
            {/* Teen Routes */}
            <Route path="/teen" element={<TeenDashboard />} />
            <Route path="/teen/attendance" element={<TeenDashboard />} />
            
            {/* Settings */}
            <Route path="/settings" element={<Settings />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
