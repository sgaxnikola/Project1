import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CurrencyInput } from './CurrencyInput';
import { CategoryPicker } from './CategoryPicker';
import { useFinance } from '../contexts/FinanceContext';
import { Transaction } from '../types';

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction;
}

export function TransactionForm({ open, onClose, transaction }: TransactionFormProps) {
  const { addTransaction, updateTransaction } = useFinance();
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    merchant: '',
    notes: '',
    tags: [] as string[],
    isRecurring: false,
    recurringRule: 'monthly' as 'monthly' | 'weekly' | 'yearly',
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: transaction.amount,
        date: transaction.date.split('T')[0],
        categoryId: transaction.categoryId,
        merchant: transaction.merchant || '',
        notes: transaction.notes || '',
        tags: transaction.tags,
        isRecurring: transaction.isRecurring,
        recurringRule: transaction.recurringRule || 'monthly',
      });
      setTagInput(transaction.tags.join(', '));
    } else {
      setFormData({
        type: 'expense',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
        merchant: '',
        notes: '',
        tags: [],
        isRecurring: false,
        recurringRule: 'monthly',
      });
      setTagInput('');
    }
  }, [transaction, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId || formData.amount <= 0) {
      return;
    }

    const tags = tagInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const transactionData = {
      ...formData,
      tags,
      date: new Date(formData.date).toISOString(),
    };

    if (transaction) {
      await updateTransaction(transaction.id, transactionData);
    } else {
      await addTransaction(transactionData);
    }

    onClose();
  };

  const updateFormData = <K extends keyof typeof formData>(
    field: K,
    value: typeof formData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Chỉnh Sửa Giao Dịch' : 'Thêm Giao Dịch'}
          </DialogTitle>
          <DialogDescription>
            {transaction 
              ? 'Cập nhật thông tin của giao dịch này.' 
              : 'Điền thông tin để thêm giao dịch mới vào sổ tài chính của bạn.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Loại</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'income' | 'expense') => updateFormData('type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">💸 Chi Tiêu</SelectItem>
                <SelectItem value="income">💰 Thu Nhập</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Số Tiền *</Label>
            <CurrencyInput
              value={formData.amount}
              onChange={(amount) => updateFormData('amount', amount)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Ngày</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => updateFormData('date', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Danh Mục *</Label>
            <CategoryPicker
              value={formData.categoryId}
              onChange={(categoryId) => updateFormData('categoryId', categoryId)}
              type={formData.type}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant">
              {formData.type === 'expense' ? 'Cửa Hàng' : 'Nguồn'}
            </Label>
            <Input
              id="merchant"
              value={formData.merchant}
              onChange={(e) => updateFormData('merchant', e.target.value)}
              placeholder={formData.type === 'expense' ? 'Tên cửa hàng' : 'Nguồn thu nhập'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Nhãn</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="thực phẩm, gia đình, v.v. (phân cách bằng dấu phẩy)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi Chú</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateFormData('notes', e.target.value)}
              placeholder="Ghi chú thêm..."
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="recurring">Giao Dịch Định Kỳ</Label>
              <Switch
                id="recurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => updateFormData('isRecurring', checked)}
              />
            </div>
            
            {formData.isRecurring && (
              <div className="space-y-2">
                <Label>Tần Suất</Label>
                <Select
                  value={formData.recurringRule}
                  onValueChange={(value: 'monthly' | 'weekly' | 'yearly') => 
                    updateFormData('recurringRule', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Hàng Tuần</SelectItem>
                    <SelectItem value="monthly">Hàng Tháng</SelectItem>
                    <SelectItem value="yearly">Hàng Năm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Hủy
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!formData.categoryId || formData.amount <= 0}
            >
              {transaction ? 'Cập Nhật' : 'Thêm'} Giao Dịch
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
