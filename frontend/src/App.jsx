import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';

// Components
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import UserManagement from './components/dashboard/UserManagement';
import PermissionManagement from './components/dashboard/PermissionManagement';
import PageView from './components/pages/PageView';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthContext from './context/AuthContext';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token on app load
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = (userData, tokens) => {
    setUser(userData);
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={
              user ? <Navigate to="/dashboard" replace /> : <Login />
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/users" element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            } />
            
            <Route path="/permissions" element={
              <ProtectedRoute>
                <PermissionManagement />
              </ProtectedRoute>
            } />
            
            <Route path="/page/:pageName" element={
              <ProtectedRoute>
                <PageView />
              </ProtectedRoute>
            } />
            
            <Route path="/" element={
              user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
