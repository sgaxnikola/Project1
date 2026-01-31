import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import type { Budget, Category, MonthlyStats, Settings, Transaction } from '../types';
import { createId } from '../lib/id';
import { buildSeedFinanceState } from '../data/seed';
import { apiRequest } from '../lib/api';
import { STORAGE_KEYS, readString, writeString, removeKey } from '../lib/storage';
import { useAuth } from './AuthContext';

interface FinanceState {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  settings: Settings;
}

interface FinanceContextValue extends FinanceState {
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addCategory: (category: Omit<Category, 'id'> & { id?: string }) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  setBudget: (budget: Omit<Budget, 'id'> & { id?: string }) => Promise<void>;

  updateSettings: (settings: Partial<Settings>) => Promise<void>;

  getMonthlyStats: (month: number, year: number) => MonthlyStats;
  getMonthlyTransactions: (month: number, year: number) => Transaction[];
  getCategoryTransactions: (categoryId: string, month: number, year: number) => Transaction[];

  resetToSeed: () => Promise<void>;
}

type FinanceAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; updates: Partial<Transaction> } }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; updates: Partial<Category> } }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_BUDGET'; payload: Budget }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'LOAD_STATE'; payload: FinanceState };

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

function initState(): FinanceState {
  const seed = buildSeedFinanceState();
  const openaiApiKey = readString(STORAGE_KEYS.openaiApiKey, null);
  return {
    ...seed,
    settings: { ...seed.settings, openaiApiKey: openaiApiKey ?? undefined },
  };
}

function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };

    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        ),
      };

    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.payload) };

    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        ),
      };

    case 'DELETE_CATEGORY': {
      const categoryId = action.payload;
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== categoryId),
        transactions: state.transactions.filter((t) => t.categoryId !== categoryId),
        budgets: state.budgets.filter((b) => b.categoryId !== categoryId),
      };
    }

    case 'SET_BUDGET': {
      const withoutSameMonth = state.budgets.filter(
        (b) => !(b.categoryId === action.payload.categoryId && b.month === action.payload.month && b.year === action.payload.year)
      );
      return { ...state, budgets: [...withoutSameMonth, action.payload] };
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'LOAD_STATE':
      return action.payload;

    default:
      return state;
  }
}

type ServerState = {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  settings: Omit<Settings, 'openaiApiKey'>;
};

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(financeReducer, undefined, initState);

  const loadFromServer = useCallback(async () => {
    if (!token) return;
    const server = await apiRequest<ServerState>('/api/finance/state', { token });

    const localKey = readString(STORAGE_KEYS.openaiApiKey, null);
    dispatch({
      type: 'LOAD_STATE',
      payload: {
        categories: server.categories,
        transactions: server.transactions,
        budgets: server.budgets,
        settings: { ...server.settings, openaiApiKey: localKey ?? undefined },
      },
    });
  }, [token]);

  // Load fresh state after login
  useEffect(() => {
    if (isAuthenticated) {
      void loadFromServer();
    } else {
      // back to local seed (login screen won't show it, but keeps app consistent)
      dispatch({ type: 'LOAD_STATE', payload: initState() });
    }
  }, [isAuthenticated, loadFromServer]);

  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, 'id'>) => {
      if (!token) throw new Error('Not authenticated');
      const id = createId('tx');
      await apiRequest<{ id: string }>('/api/finance/transactions', {
        method: 'POST',
        token,
        body: JSON.stringify({ ...transaction, id }),
      });
      dispatch({ type: 'ADD_TRANSACTION', payload: { ...transaction, id } });
    },
    [token]
  );

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      if (!token) throw new Error('Not authenticated');
      await apiRequest<{ ok: true }>(`/api/finance/transactions/${id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify(updates),
      });
      dispatch({ type: 'UPDATE_TRANSACTION', payload: { id, updates } });
    },
    [token]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!token) throw new Error('Not authenticated');
      await apiRequest<{ ok: true }>(`/api/finance/transactions/${id}`, { method: 'DELETE', token });
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
    },
    [token]
  );

  const addCategory = useCallback(
    async (category: Omit<Category, 'id'> & { id?: string }) => {
      if (!token) throw new Error('Not authenticated');
      const id = category.id ?? createId('cat');
      const payload: Category = { ...category, id } as Category;
      await apiRequest<{ ok: true }>('/api/finance/categories', {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      });
      dispatch({ type: 'ADD_CATEGORY', payload });
    },
    [token]
  );

  const updateCategory = useCallback(
    async (id: string, updates: Partial<Category>) => {
      if (!token) throw new Error('Not authenticated');
      await apiRequest<{ ok: true }>(`/api/finance/categories/${id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify(updates),
      });
      dispatch({ type: 'UPDATE_CATEGORY', payload: { id, updates } });
    },
    [token]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      if (!token) throw new Error('Not authenticated');
      await apiRequest<{ ok: true }>(`/api/finance/categories/${id}`, { method: 'DELETE', token });
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
    },
    [token]
  );

  const setBudget = useCallback(
    async (budget: Omit<Budget, 'id'> & { id?: string }) => {
      if (!token) throw new Error('Not authenticated');
      const res = await apiRequest<{ id: string }>('/api/finance/budgets', {
        method: 'PUT',
        token,
        body: JSON.stringify({
          categoryId: budget.categoryId || undefined,
          month: budget.month,
          year: budget.year,
          amount: budget.amount,
          rolloverEnabled: budget.rolloverEnabled,
        }),
      });

      const normalized: Budget = { ...budget, id: res.id, categoryId: budget.categoryId || undefined };
      dispatch({ type: 'SET_BUDGET', payload: normalized });
    },
    [token]
  );

  const updateSettings = useCallback(
    async (updates: Partial<Settings>) => {
      // OpenAI key: local-only
      if (Object.prototype.hasOwnProperty.call(updates, 'openaiApiKey')) {
        const key = (updates.openaiApiKey ?? '').trim();
        if (key) writeString(STORAGE_KEYS.openaiApiKey, key);
        else removeKey(STORAGE_KEYS.openaiApiKey);
      }

      // Server settings
      if (token) {
        const { openaiApiKey: _ignore, ...serverUpdates } = updates;
        const hasServerUpdates = Object.keys(serverUpdates).length > 0;
        if (hasServerUpdates) {
          await apiRequest<{ ok: true }>('/api/finance/settings', {
            method: 'PATCH',
            token,
            body: JSON.stringify(serverUpdates),
          });
        }
      }

      dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
    },
    [token]
  );

  const getMonthlyTransactions = useCallback(
    (month: number, year: number) => {
      return state.transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      });
    },
    [state.transactions]
  );

  const getCategoryTransactions = useCallback(
    (categoryId: string, month: number, year: number) => {
      return getMonthlyTransactions(month, year).filter((t) => t.categoryId === categoryId);
    },
    [getMonthlyTransactions]
  );

  const getMonthlyStats = useCallback(
    (month: number, year: number): MonthlyStats => {
      const monthlyTransactions = getMonthlyTransactions(month, year);

      const totalIncome = monthlyTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = monthlyTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const netAmount = totalIncome - totalExpenses;

      const monthBudgets = state.budgets.filter((b) => b.month === month && b.year === year);
      const budgetTotal = monthBudgets.reduce((sum, b) => sum + b.amount, 0);
      const budgetRemaining = budgetTotal - totalExpenses;

      return { totalIncome, totalExpenses, netAmount, budgetRemaining };
    },
    [getMonthlyTransactions, state.budgets]
  );

  const resetToSeed = useCallback(async () => {
    if (!token) throw new Error('Not authenticated');
    await apiRequest<{ ok: true }>('/api/finance/reset', { method: 'POST', token });
    await loadFromServer();
  }, [token, loadFromServer]);

  const value: FinanceContextValue = useMemo(
    () => ({
      ...state,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      setBudget,
      updateSettings,
      getMonthlyStats,
      getMonthlyTransactions,
      getCategoryTransactions,
      resetToSeed,
    }),
    [
      state,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      setBudget,
      updateSettings,
      getMonthlyStats,
      getMonthlyTransactions,
      getCategoryTransactions,
      resetToSeed,
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within a FinanceProvider');
  return ctx;
}
