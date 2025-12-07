import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Activities from './pages/Activities';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics'; // This is the new "Deep Analysis" page
import Settings from './pages/Settings';
import Feeds from './pages/Feeds';

// Protection Wrapper
const PrivateRoute = ({ children }) => {
  // Check for the specific token key your login saves
  const token = localStorage.getItem('admin_token');
  
  if (!token) {
    // Redirect to login if no token
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />
        <Route path="/activities" element={<PrivateRoute><Activities /></PrivateRoute>} />
        <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
        <Route path="/analysis" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/feeds" element={<PrivateRoute><Feeds /></PrivateRoute>} />
        
        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;