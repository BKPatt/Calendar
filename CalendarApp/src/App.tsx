import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import theme from './theme';

import SignIn from './auth/Signin';
import SignUp from './auth/Signup';
import HomeScreen from './screens/HomeScreen';
import CalendarScreen from './screens/CalendarScreen';
import GroupScreen from './screens/GroupScreen';
import ProfileScreen from './screens/ProfileScreen';
import EventScreen from './screens/EventScreen';
import UpcomingEventsScreen from './screens/UpcomingEventsScreen';
import LoadingSpinner from './components/common/LoadingSpinner';
import PublicRoute from './auth/PublicRoute';
import AppHeader from './AppHeader';
import NavTray from './NavTray';
import SettingsScreen from './screens/SettingsScreen';
import { AppProvider } from './contexts/AppContext';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <LoadingSpinner />;
  }
  return isAuthenticated ? children : <Navigate to="/signin" />;
};

const App: React.FC = () => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setDrawerOpen(!isDrawerOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppProvider>
          <Router>
            <div style={{ display: 'flex', position: 'relative' }}>
              <AppHeader onMenuClick={toggleDrawer} />
              <NavTray isDrawerOpen={isDrawerOpen} toggleDrawer={toggleDrawer} />

              <main style={{ flexGrow: 1, padding: '80px 24px 24px' }}>
                <Routes>
                  <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
                  <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
                  <Route path="/" element={<PrivateRoute><HomeScreen /></PrivateRoute>} />
                  <Route path="/calendar" element={<PrivateRoute><CalendarScreen /></PrivateRoute>} />
                  <Route path="/groups" element={<PrivateRoute><GroupScreen /></PrivateRoute>} />
                  <Route path="/profile" element={<PrivateRoute><ProfileScreen /></PrivateRoute>} />
                  <Route path="/settings" element={<PrivateRoute><SettingsScreen /></PrivateRoute>} />
                  <Route path="/events/:eventId" element={<PrivateRoute><EventScreen /></PrivateRoute>} />
                  <Route path="/events" element={<PrivateRoute><UpcomingEventsScreen /></PrivateRoute>} />
                </Routes>
              </main>
            </div>
          </Router>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
