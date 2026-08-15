import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ConductorDashboard from './pages/ConductorDashboard';
import CreateEvent from './pages/CreateEvent';
import EventDetail from './pages/EventDetail';
import CandidateDashboard from './pages/CandidateDashboard';
import CandidateEventDetail from './pages/CandidateEventDetail';
import ResultsDashboard from './pages/ResultsDashboard';
import NotFound from './pages/NotFound';
import { useAuth } from './context/useAuth';

// Home Component: Route to appropriate dashboard or login
const Home = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return role === 'CONDUCTOR' ? <Navigate to="/conductor" replace /> : <Navigate to="/candidate" replace />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Conductor Protected Routes */}
          <Route
            path="/conductor"
            element={
              <ProtectedRoute allowedRole="CONDUCTOR">
                <ConductorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conductor/events/create"
            element={
              <ProtectedRoute allowedRole="CONDUCTOR">
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conductor/events/:eventId"
            element={
              <ProtectedRoute allowedRole="CONDUCTOR">
                <EventDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conductor/events/:eventId/results"
            element={
              <ProtectedRoute allowedRole="CONDUCTOR">
                <ResultsDashboard />
              </ProtectedRoute>
            }
          />

          {/* Candidate Protected Routes */}
          <Route
            path="/candidate"
            element={
              <ProtectedRoute allowedRole="CANDIDATE">
                <CandidateDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/events/:eventId"
            element={
              <ProtectedRoute allowedRole="CANDIDATE">
                <CandidateEventDetail />
              </ProtectedRoute>
            }
          />

          {/* Shared Authenticated Results Route (Backend enforces role & visibility) */}
          <Route
            path="/events/:eventId/results"
            element={
              <ProtectedRoute>
                <ResultsDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
