import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { BudgetProgressBar } from './BudgetProgressBar';
import { CurrencyInput } from './CurrencyInput';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency } from '../utils/helpers';
import { Plus, Target, TrendingUp, AlertTriangle } from 'lucide-react';

export function BudgetsView() {
  const { 
    categories, 
    budgets, 
    setBudget, 
    settings,
    getCategoryTransactions,
    getMonthlyStats
  } = useFinance();
  
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: 0,
    rolloverEnabled: false,
  });

  const monthlyStats = getMonthlyStats(selectedMonth, selectedYear);

  // Get current budgets for selected month/year
  const currentBudgets = budgets
    .filter(b => b.month === selectedMonth && b.year === selectedYear)
    .map(budget => {
      const category = categories.find(c => c.id === budget.categoryId);
      const spent = budget.categoryId 
        ? getCategoryTransactions(budget.categoryId, selectedMonth, selectedYear)
            .reduce((sum, t) => sum + t.amount, 0)
        : monthlyStats.totalExpenses;
      
      return {
        ...budget,
        category,
        spent,
        percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
      };
    })
    .sort((a, b) => (b.spent / b.amount) - (a.spent / a.amount));

  // Categories without budgets
  const categoriesWithoutBudgets = categories
    .filter(cat => cat.type === 'expense')
    .filter(cat => !budgets.some(b => 
      b.categoryId === cat.id && b.month === selectedMonth && b.year === selectedYear
    ));

  const totalBudgeted = currentBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = currentBudgets.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = currentBudgets.filter(b => b.percentage > 100).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) return;

    await setBudget({
      categoryId: formData.categoryId || undefined,
      month: selectedMonth,
      year: selectedYear,
      amount: formData.amount,
      rolloverEnabled: formData.rolloverEnabled,
    });

    setFormData({
      categoryId: '',
      amount: 0,
      rolloverEnabled: false,
    });
    setShowBudgetForm(false);
  };

  const months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ngân Sách</h1>
          <p className="text-muted-foreground">
            Quản lý hạn mức chi tiêu và theo dõi tiến độ
          </p>
        </div>
        <Button onClick={() => setShowBudgetForm(true)} className="gap-2">
          <Plus size={16} />
          Đặt Ngân Sách
        </Button>
      </div>

      {/* Month/Year Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Label>Tháng</Label>
              <Select 
                value={selectedMonth.toString()} 
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Năm</Label>
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng Ngân Sách
            </CardTitle>
            <Target size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBudgeted, settings.currency)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng Chi Tiêu
            </CardTitle>
            <TrendingUp size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalSpent, settings.currency)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Còn Lại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              totalBudgeted - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(totalBudgeted - totalSpent, settings.currency)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quá Ngân Sách
            </CardTitle>
            <AlertTriangle size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overBudgetCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {overBudgetCount === 1 ? 'danh mục' : 'danh mục'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Tiến Độ Ngân Sách</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {currentBudgets.length > 0 ? (
              currentBudgets.map((budget) => (
                <BudgetProgressBar
                  key={budget.id}
                  spent={budget.spent}
                  budget={budget.amount}
                  categoryName={budget.category?.name || 'Ngân Sách Tổng Thể'}
                  color={budget.category?.color || '#6b7280'}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Chưa đặt ngân sách</h3>
                <p>Đặt ngân sách đầu tiên để bắt đầu theo dõi chi tiêu của bạn.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categories Without Budgets */}
      {categoriesWithoutBudgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Danh Mục Chưa Có Ngân Sách</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoriesWithoutBudgets.map((category) => {
                const spent = getCategoryTransactions(category.id, selectedMonth, selectedYear)
                  .reduce((sum, t) => sum + t.amount, 0);
                
                return (
                  <div 
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(spent, settings.currency)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, categoryId: category.id }));
                          setShowBudgetForm(true);
                        }}
                        className="h-6 text-xs mt-1"
                      >
                        Đặt Ngân Sách
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Form Dialog */}
      <Dialog open={showBudgetForm} onOpenChange={setShowBudgetForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Đặt Ngân Sách</DialogTitle>
            <DialogDescription>
              Đặt hạn mức chi tiêu cho một danh mục cụ thể hoặc tạo ngân sách tổng thể hàng tháng.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>Danh Mục</Label>
              <Select
                value={formData.categoryId || "overall"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value === "overall" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục (không bắt buộc cho ngân sách tổng thể)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Ngân Sách Tổng Thể</SelectItem>
                  {categories
                    .filter(cat => cat.type === 'expense')
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Số Tiền Ngân Sách *</Label>
              <CurrencyInput
                value={formData.amount}
                onChange={(amount) => setFormData(prev => ({ ...prev, amount }))}
                placeholder="0.00"
              />
            </div>

            {/* Rollover */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Bật Chuyển Tiếp</Label>
                <p className="text-sm text-muted-foreground">
                  Ngân sách chưa dùng sẽ chuyển sang tháng sau
                </p>
              </div>
              <Switch
                checked={formData.rolloverEnabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, rolloverEnabled: checked }))}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowBudgetForm(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={formData.amount <= 0}
              >
                Đặt Ngân Sách
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}