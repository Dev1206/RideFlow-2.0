import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import BookRidePage from './pages/BookRidePage';
import LandingPage from './pages/LandingPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageRidesPage from './pages/ManageRidesPage';
import ManageDriversPage from './pages/ManageDriversPage';
import MyRidesPage from './pages/MyRidesPage';
import RideHistoryPage from './pages/RideHistoryPage';
import { ErrorBoundary } from './utils/errorHandling';

function App() {
  const { user, userRoles } = useAuth();

  return (
    <ErrorBoundary>
      <Router future={{ 
        v7_startTransition: true,
        v7_relativeSplatPath: true 
      }}>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/book-ride" element={user ? <BookRidePage /> : <Navigate to="/" />} />
          <Route path="/my-rides" element={user && userRoles.includes('driver') ? <MyRidesPage /> : <Navigate to="/dashboard" />} />
          <Route path="/ride-history" element={user ? <RideHistoryPage /> : <Navigate to="/" />} />
          <Route 
            path="/manage-rides" 
            element={
              user && (userRoles.includes('admin') || userRoles.includes('developer')) 
                ? <ManageRidesPage /> 
                : <Navigate to="/dashboard" />
            } 
          />
          <Route 
            path="/manage-drivers" 
            element={
              user && (userRoles.includes('admin') || userRoles.includes('developer')) 
                ? <ManageDriversPage /> 
                : <Navigate to="/dashboard" />
            } 
          />
          <Route 
            path="/manage-users" 
            element={
              user && userRoles.includes('admin')
                ? <ManageUsersPage /> 
                : <Navigate to="/dashboard" />
            } 
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
