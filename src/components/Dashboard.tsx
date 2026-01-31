import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { StatCard } from './StatCard';
import { BudgetProgressBar } from './BudgetProgressBar';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency, formatDate, getCategoryIcon } from '../utils/helpers';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { Plus, TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react';

interface DashboardProps {
  onAddTransaction: () => void;
}

export function Dashboard({ onAddTransaction }: DashboardProps) {
  const context = useFinance();
  
  if (!context) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Đang tải bảng điều khiển...</div>
      </div>
    );
  }
  
  const { 
    transactions = [], 
    categories = [], 
    budgets = [], 
    settings = { currency: 'USD', firstDayOfMonth: 1, theme: 'system' }, 
    getMonthlyStats, 
    getMonthlyTransactions,
    getCategoryTransactions 
  } = context;
  
  if (!getMonthlyStats || !getMonthlyTransactions || !getCategoryTransactions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Đang tải bảng điều khiển...</div>
      </div>
    );
  }
  
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  const monthlyStats = getMonthlyStats(month, year) || {
    totalIncome: 0,
    totalExpenses: 0,
    netAmount: 0,
    budgetRemaining: 0
  };
  
  const monthlyTransactions = getMonthlyTransactions(month, year) || [];
  
  const recentTransactions = (transactions || [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const expensesByCategory = (categories || [])
    .filter(cat => cat.type === 'expense')
    .map(category => {
      const categoryTransactions = getCategoryTransactions(category.id, month, year) || [];
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      return {
        name: category.name,
        value: total,
        color: category.color,
        icon: category.icon,
      };
    })
    .filter(item => item.value > 0);

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthNum = date.getMonth() + 1;
    const yearNum = date.getFullYear();
    const monthName = date.toLocaleDateString('vi-VN', { month: 'short' });
    
    const monthTransactions = getMonthlyTransactions(monthNum, yearNum) || [];
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month: monthName,
      income,
      expenses,
      net: income - expenses,
    };
  }).reverse();

  const budgetProgress = (budgets || [])
    .filter(b => b.month === month && b.year === year)
    .map(budget => {
      const category = categories.find(c => c.id === budget.categoryId);
      const spent = (getCategoryTransactions(budget.categoryId || '', month, year) || [])
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        ...budget,
        categoryName: category?.name || 'Overall',
        color: category?.color || '#6b7280',
        spent,
      };
    })
    .slice(0, 5);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bảng Điều Khiển</h1>
          <p className="text-muted-foreground">
            Tổng quan cho {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button onClick={onAddTransaction} className="gap-2">
          <Plus size={16} />
          Thêm Giao Dịch
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng Thu Nhập"
          amount={monthlyStats?.totalIncome || 0}
          variant="income"
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          title="Tổng Chi Tiêu"
          amount={monthlyStats?.totalExpenses || 0}
          variant="expense"
          icon={<TrendingDown size={16} />}
        />
        <StatCard
          title="Số Dư Ròng"
          amount={monthlyStats?.netAmount || 0}
          variant={(monthlyStats?.netAmount || 0) >= 0 ? 'income' : 'expense'}
          icon={<Wallet size={16} />}
        />
        <StatCard
          title="Ngân Sách Còn Lại"
          amount={monthlyStats?.budgetRemaining || 0}
          variant="neutral"
          icon={<DollarSign size={16} />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cash Flow Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Dòng Tiền 6 Tháng</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="w-full" style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={last6Months || []} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => [
                      formatCurrency(value as number, settings.currency),
                      name === 'income' ? 'Thu Nhập' : name === 'expenses' ? 'Chi Tiêu' : 'Ròng'
                    ]}
                  />
                  <Bar dataKey="income" fill="#10b981" name="income" />
                  <Bar dataKey="expenses" fill="#ef4444" name="expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Chi Tiêu Theo Danh Mục</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {(expensesByCategory || []).length > 0 ? (
              <div className="w-full" style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={expensesByCategory || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={(entry) => entry.name}
                    >
                      {(expensesByCategory || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number, settings.currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: '300px' }} className="flex items-center justify-center text-muted-foreground">
                Không có chi tiêu trong tháng này
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Tiến Độ Ngân Sách</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(budgetProgress || []).length > 0 ? (
                (budgetProgress || []).map((item) => (
                  <BudgetProgressBar
                    key={item.id}
                    spent={item.spent}
                    budget={item.amount}
                    categoryName={item.categoryName}
                    color={item.color}
                  />
                ))
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  Chưa đặt ngân sách cho tháng này
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Giao Dịch Gần Đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(recentTransactions || []).length > 0 ? (
                (recentTransactions || []).map((transaction) => {
                  const category = categories.find(c => c.id === transaction.categoryId);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                          {getCategoryIcon(category?.icon || 'other')}
                        </div>
                        <div>
                          <div className="font-medium">{transaction.merchant || category?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(transaction.date)}
                          </div>
                        </div>
                      </div>
                      <div className={`font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'expense' ? '-' : '+'}
                        {formatCurrency(transaction.amount, settings.currency)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  Chưa có giao dịch nào
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}