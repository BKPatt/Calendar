import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import theme from './theme';

import SignIn from './auth/Signin';
import SignUp from './auth/Signup';
import HomeScreen from './screens/HomeScreen';
import CalendarScreen from './screens/CalendarScreen';
import GroupScreen from './screens/GroupScreen';
import ProfileScreen from './screens/ProfileScreen';
import EventScreen from './screens/EventScreen';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // You can add a loading spinner here
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/signin" />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/" element={<PrivateRoute><HomeScreen /></PrivateRoute>} />
            <Route path="/calendar" element={<PrivateRoute><CalendarScreen /></PrivateRoute>} />
            <Route path="/groups" element={<PrivateRoute><GroupScreen /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfileScreen /></PrivateRoute>} />
            <Route path="/events/:eventId" element={<PrivateRoute><EventScreen /></PrivateRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;