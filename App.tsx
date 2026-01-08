import React, { PropsWithChildren } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react';
import WorkspacesList from './components/WorkspacesList';
import Wizard from './components/Wizard';
import Dashboard from './components/Dashboard';
import AdminSetup from './components/AdminSetup';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }: PropsWithChildren) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  );
};

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/workspaces" replace />} />
        
        {/* Rota Admin */}
        <Route path="/admin/setup-meta" element={
          <ProtectedRoute>
            <Layout title="Admin Setup">
              <AdminSetup />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Lista de Workspaces */}
        <Route path="/workspaces" element={
          <ProtectedRoute>
            <Layout title="Meus Workspaces">
              <WorkspacesList />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Wizard de Setup */}
        <Route path="/w/:workspaceId/setup" element={
          <ProtectedRoute>
            <Layout title="Configuração do Workspace" showSwitcher={false}>
              <Wizard />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Dashboard */}
        <Route path="/w/:workspaceId/dashboard" element={
          <ProtectedRoute>
            <Layout title="Dashboard">
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </HashRouter>
  );
}