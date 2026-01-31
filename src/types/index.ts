export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  categoryId: string;
  type: 'income' | 'expense';
  amount: number;
  date: string; // ISO date string
  merchant?: string;
  notes?: string;
  tags: string[];
  isRecurring: boolean;
  recurringRule?: 'monthly' | 'weekly' | 'yearly';
}

export interface Budget {
  id: string;
  categoryId?: string; // null for overall budget
  month: number; // 1-12
  year: number;
  amount: number;
  rolloverEnabled: boolean;
}

export interface Settings {
  currency: string;
  firstDayOfMonth: number; // 1-28
  theme: 'light' | 'dark' | 'system';
  openaiApiKey?: string; // OpenAI API key for AI reports
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  budgetRemaining: number;
}