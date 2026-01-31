import type { Budget, Category, Settings, Transaction } from '../types';

export interface FinanceSeedState {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  settings: Settings;
}

/**
 * Seed data used on the very first run (when there is no saved state).
 * Keep it small + realistic so the app feels alive without being noisy.
 */
export function buildSeedFinanceState(now: Date = new Date()): FinanceSeedState {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const categories: Category[] = [
    { id: 'dining', name: 'Ăn Uống', type: 'expense', color: '#ef4444', icon: 'food' },
    { id: 'transport', name: 'Giao Thông', type: 'expense', color: '#3b82f6', icon: 'transport' },
    { id: 'groceries', name: 'Tạp Hóa', type: 'expense', color: '#10b981', icon: 'shopping' },
    { id: 'entertainment', name: 'Giải Trí', type: 'expense', color: '#8b5cf6', icon: 'entertainment' },
    { id: 'utilities', name: 'Tiện Ích', type: 'expense', color: '#f59e0b', icon: 'utilities' },
    { id: 'healthcare', name: 'Y Tế', type: 'expense', color: '#ec4899', icon: 'health' },
    { id: 'salary', name: 'Lương', type: 'income', color: '#10b981', icon: 'salary' },
    { id: 'freelance', name: 'Tự Do', type: 'income', color: '#06b6d4', icon: 'freelance' },
  ];

  const day = 24 * 60 * 60 * 1000;

  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'expense',
      amount: 250_000,
      date: new Date(now.getTime() - day).toISOString(),
      merchant: 'Nhà Hàng Địa Phương',
      categoryId: 'dining',
      notes: 'Ăn tối với gia đình',
      tags: ['thực phẩm', 'gia đình'],
      isRecurring: false,
    },
    {
      id: '2',
      type: 'expense',
      amount: 150_000,
      date: new Date(now.getTime() - 2 * day).toISOString(),
      merchant: 'Grab',
      categoryId: 'transport',
      notes: 'Đi lại trong ngày',
      tags: ['di chuyển'],
      isRecurring: false,
    },
    {
      id: '3',
      type: 'expense',
      amount: 850_000,
      date: new Date(now.getTime() - 3 * day).toISOString(),
      merchant: 'Siêu Thị',
      categoryId: 'groceries',
      notes: 'Mua sắm hàng tuần',
      tags: ['thực phẩm', 'nhà cửa'],
      isRecurring: false,
    },
    {
      id: '4',
      type: 'income',
      amount: 3_000_000,
      date: new Date(now.getTime() - 4 * day).toISOString(),
      merchant: 'Freelance',
      categoryId: 'freelance',
      notes: 'Dự án phụ',
      tags: ['thu nhập'],
      isRecurring: false,
    },
    {
      id: '5',
      type: 'income',
      amount: 15_000_000,
      date: new Date(now.getTime() - 5 * day).toISOString(),
      merchant: 'Công ty',
      categoryId: 'salary',
      notes: 'Lương tháng',
      tags: ['lương'],
      isRecurring: true,
      recurringRule: 'monthly',
    },
  ];

  const budgets: Budget[] = [
    { id: '1', categoryId: 'dining', amount: 3_000_000, month, year, rolloverEnabled: false },
    { id: '2', categoryId: 'transport', amount: 1_500_000, month, year, rolloverEnabled: false },
    { id: '3', categoryId: 'groceries', amount: 4_000_000, month, year, rolloverEnabled: false },
  ];

  const settings: Settings = {
    currency: 'VND',
    firstDayOfMonth: 1,
    theme: 'system',
  };

  return { categories, transactions, budgets, settings };
}
