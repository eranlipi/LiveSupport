import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';

export function Header() {
  const { logout, state } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Live Support Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Agent Dashboard
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={state.isLoading}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}