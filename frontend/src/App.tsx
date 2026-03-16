import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { ManagerDashboard } from '@/pages/ManagerDashboard';
import { EmployeeDashboard } from '@/pages/EmployeeDashboard';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { WorkflowsPage } from '@/pages/WorkflowsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';

const Unauthorized = () => (
  <div className="flex items-center justify-center h-[calc(100vh-64px)]">
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
      <p className="text-gray-600">You do not have permission to view this page.</p>
      <Button onClick={() => window.history.back()}>Go Back</Button>
    </div>
  </div>
);

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout />}>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="dashboard/admin" element={<AdminDashboard />} />
              </Route>

              {/* Manager Routes */}
              <Route element={<ProtectedRoute allowedRoles={['MANAGER']} />}>
                <Route path="dashboard/manager" element={<ManagerDashboard />} />
              </Route>

              {/* Employee Routes */}
              <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
                <Route path="dashboard/employee" element={<EmployeeDashboard />} />
              </Route>

              {/* Shared Routes (accessible by all authenticated users, or restrict as needed) */}
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="workflows" element={<WorkflowsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="unauthorized" element={<Unauthorized />} />

              {/* Default Redirect */}
              <Route path="" element={<Navigate to="/dashboard/admin" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
