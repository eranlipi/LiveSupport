import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Dashboard } from './components/dashboard/Dashboard';
import { AuthPage } from './components/auth/AuthPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';

function AppContent() {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return state.isAuthenticated ? <Dashboard /> : <AuthPage />;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
