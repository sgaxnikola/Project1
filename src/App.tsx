import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { AppShell } from './components/AppShell';

import './styles/globals.css';

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <AppShell />
      </FinanceProvider>
    </AuthProvider>
  );
}
