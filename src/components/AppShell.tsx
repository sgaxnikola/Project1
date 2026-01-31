import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

import { Layout } from './Layout';
import { Dashboard } from './Dashboard';
import { TransactionsList } from './TransactionsList';
import { BudgetsView } from './BudgetsView';
import { Reports } from './Reports';
import { TransactionForm } from './TransactionForm';
import { Login } from './Login';
import { Register } from './Register';
import { SettingsView } from './SettingsView';

type View = 'dashboard' | 'transactions' | 'budgets' | 'reports' | 'settings';
type AuthMode = 'login' | 'register';

export function AppShell() {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <Login onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onAddTransaction={() => setShowTransactionForm(true)} />;
      case 'transactions':
        return <TransactionsList onAddTransaction={() => setShowTransactionForm(true)} />;
      case 'budgets':
        return <BudgetsView />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <SettingsView />;
      default:
        return null;
    }
  };

  return (
    <>
      <Layout currentView={currentView} onNavigate={setCurrentView}>
        {renderView()}
      </Layout>

      <TransactionForm open={showTransactionForm} onClose={() => setShowTransactionForm(false)} />
    </>
  );
}
