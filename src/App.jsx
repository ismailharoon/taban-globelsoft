import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePortal } from './context/PortalContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FlightBookings from './pages/FlightBookings';
import FlightManagement from './pages/FlightManagement';
import FlightPOS from './pages/FlightPOS';
import SegmentManagement from './pages/SegmentManagement';
import ManageSubAgents from './pages/ManageSubAgents';
import ManageAdmins from './pages/ManageAdmins';

function getFirstAllowedAdminRoute(hasPermission, isMasterAdmin) {
  if (hasPermission('bookings')) return '/FlightBookings';
  if (hasPermission('searchFlight')) return '/FlightPOS';
  if (hasPermission('dashboard')) return '/Dashboard';
  if (hasPermission('segments')) return '/SegmentManagement';
  if (hasPermission('subAgents')) return '/ManageSubAgents';
  if (isMasterAdmin) return '/ManageAdmins';
  return '/login';
}

function ProtectedShell({ children, adminOnly = false, masterOnly = false, permKey = '' }) {
  const { user, isSubAgent, isMasterAdmin, hasPermission } = usePortal();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (masterOnly && !isMasterAdmin) {
    return (
      <Navigate
        to={isSubAgent ? '/FlightPOS' : getFirstAllowedAdminRoute(hasPermission, isMasterAdmin)}
        replace
      />
    );
  }
  if (adminOnly && isSubAgent) {
    return <Navigate to="/FlightPOS" replace />;
  }
  if (!isSubAgent && permKey && !hasPermission(permKey)) {
    return <Navigate to={getFirstAllowedAdminRoute(hasPermission, isMasterAdmin)} replace />;
  }
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { isSubAgent, isMasterAdmin, hasPermission } = usePortal();
  const defaultRoute = isSubAgent
    ? '/FlightPOS'
    : getFirstAllowedAdminRoute(hasPermission, isMasterAdmin);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/Dashboard"
        element={
          <ProtectedShell permKey="dashboard">
            <Dashboard />
          </ProtectedShell>
        }
      />
      <Route
        path="/FlightPOS"
        element={
          <ProtectedShell permKey="searchFlight">
            <FlightPOS />
          </ProtectedShell>
        }
      />
      <Route
        path="/FlightBookings"
        element={
          <ProtectedShell permKey="bookings">
            <FlightBookings />
          </ProtectedShell>
        }
      />
      <Route
        path="/FlightManagement"
        element={
          <ProtectedShell adminOnly permKey="segments">
            <FlightManagement />
          </ProtectedShell>
        }
      />
      <Route
        path="/SegmentManagement"
        element={
          <ProtectedShell adminOnly permKey="segments">
            <SegmentManagement />
          </ProtectedShell>
        }
      />
      <Route
        path="/ManageSubAgents"
        element={
          <ProtectedShell adminOnly permKey="subAgents">
            <ManageSubAgents />
          </ProtectedShell>
        }
      />
      <Route
        path="/ManageAdmins"
        element={
          <ProtectedShell adminOnly masterOnly>
            <ManageAdmins />
          </ProtectedShell>
        }
      />
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />
      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
}
