import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import GlobalChat from './pages/GlobalChat';
import Queries from './pages/Queries';
import Leaderboard from './pages/Leaderboard';
import AdminPanel from './pages/AdminPanel';
import Analytics from './pages/Analytics';
import Submissions from './pages/Submissions';

const AppLayout = ({ children, pageTitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1 }}>
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          pageTitle={pageTitle}
        />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout pageTitle="Dashboard">
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/tasks" element={
        <ProtectedRoute>
          <AppLayout pageTitle="Tasks">
            <TaskList />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/global-chat" element={
        <ProtectedRoute>
          <AppLayout pageTitle="Global Chat">
            <GlobalChat />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/submissions" element={
        <ProtectedRoute>
          <AppLayout pageTitle="Submissions">
            <Submissions />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/queries" element={
        <ProtectedRoute>
          <AppLayout pageTitle="Support & Queries">
            <Queries />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/leaderboard" element={
        <ProtectedRoute>
          <AppLayout pageTitle="Leaderboard">
            <Leaderboard />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Admin Only Routes */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}>
          <AppLayout pageTitle="Admin Panel">
            <AdminPanel />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/analytics" element={
        <ProtectedRoute roles={['admin']}>
          <AppLayout pageTitle="Analytics">
            <Analytics />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Redirect */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
