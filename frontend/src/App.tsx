import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { WorkflowsPage } from '@/pages/WorkflowsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';

// Simple placeholders for missing dashboards
const ManagerDashboard = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Manager Dashboard</h1>
    <p>Welcome to the Manager Dashboard.</p>
  </div>
);

const EmployeeDashboard = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Employee Dashboard</h1>
    <p>Welcome to the Employee Dashboard.</p>
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
