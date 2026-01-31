import React, { useState } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { formatCurrency } from '../utils/helpers';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';

export function Reports() {
  const { transactions, categories, budgets, settings, getMonthlyStats } = useFinance();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string>('');
  const [error, setError] = useState<string>('');

  const generateReport = async () => {
    if (!settings.openaiApiKey) {
      setError('Vui lòng cấu hình OpenAI API key trong phần Cài Đặt trước.');
      return;
    }

    setLoading(true);
    setError('');
    setReport('');

    try {
      // Get current month stats
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const stats = getMonthlyStats(currentMonth, currentYear);

      // Calculate category spending
      const categorySpending = categories
        .filter(cat => cat.type === 'expense')
        .map(category => {
          const categoryTransactions = transactions.filter(
            t => t.categoryId === category.id && 
            t.type === 'expense' &&
            new Date(t.date).getMonth() + 1 === currentMonth &&
            new Date(t.date).getFullYear() === currentYear
          );
          const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
          return { category: category.name, total };
        })
        .filter(item => item.total > 0)
        .sort((a, b) => b.total - a.total);

      // Budget analysis
      const budgetAnalysis = budgets
        .filter(b => b.month === currentMonth && b.year === currentYear)
        .map(budget => {
          const category = categories.find(c => c.id === budget.categoryId);
          const spent = transactions
            .filter(t => 
              t.categoryId === budget.categoryId && 
              t.type === 'expense' &&
              new Date(t.date).getMonth() + 1 === currentMonth &&
              new Date(t.date).getFullYear() === currentYear
            )
            .reduce((sum, t) => sum + t.amount, 0);
          
          return {
            category: category?.name || 'Unknown',
            budget: budget.amount,
            spent,
            percentage: (spent / budget.amount) * 100
          };
        });

      // Recent transactions
      const recentTransactions = transactions
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
        .map(t => {
          const category = categories.find(c => c.id === t.categoryId);
          return {
            type: t.type,
            category: category?.name || 'Unknown',
            amount: t.amount,
            merchant: t.merchant,
            date: new Date(t.date).toLocaleDateString('vi-VN')
          };
        });

      // Create prompt for ChatGPT
      const prompt = `Bạn là chuyên gia tư vấn tài chính cá nhân. Hãy phân tích dữ liệu tài chính sau đây và đưa ra báo cáo chi tiết, nhận định và lời khuyên bằng tiếng Việt:

**Tổng quan tháng ${currentMonth}/${currentYear}:**
- Tổng thu nhập: ${formatCurrency(stats.totalIncome, 'VND')}
- Tổng chi tiêu: ${formatCurrency(stats.totalExpenses, 'VND')}
- Thu nhập ròng: ${formatCurrency(stats.netAmount, 'VND')}
- Tỷ lệ tiết kiệm: ${stats.totalIncome > 0 ? ((stats.netAmount / stats.totalIncome) * 100).toFixed(1) : 0}%

**Chi tiêu theo danh mục:**
${categorySpending.map(item => `- ${item.category}: ${formatCurrency(item.total, 'VND')}`).join('\n')}

**Phân tích ngân sách:**
${budgetAnalysis.map(item => `- ${item.category}: Đã chi ${formatCurrency(item.spent, 'VND')}/${formatCurrency(item.budget, 'VND')} (${item.percentage.toFixed(1)}%)`).join('\n')}

**10 giao dịch gần nhất:**
${recentTransactions.map((t, i) => `${i + 1}. [${t.type === 'income' ? 'Thu' : 'Chi'}] ${t.category} - ${formatCurrency(t.amount, 'VND')} - ${t.merchant || 'N/A'} (${t.date})`).join('\n')}

Hãy cung cấp:
1. **Tóm tắt tình hình tài chính**: Đánh giá tổng quan về tình hình thu chi
2. **Phân tích chi tiết**: Nhận xét về các danh mục chi tiêu và ngân sách
3. **Xu hướng**: Những điểm đáng chú ý trong thói quen chi tiêu
4. **Lời khuyên**: 3-5 gợi ý cụ thể để cải thiện tài chính cá nhân
5. **Cảnh báo**: Những vấn đề cần lưu ý (nếu có)

Trả lời bằng tiếng Việt, dễ hiểu và thân thiện.`;

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Bạn là chuyên gia tư vấn tài chính cá nhân chuyên nghiệp, giúp người dùng quản lý và cải thiện tài chính của họ.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Lỗi khi gọi OpenAI API');
      }

      const data = await response.json();
      const aiReport = data.choices[0]?.message?.content || 'Không thể tạo báo cáo';
      
      setReport(aiReport);
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message || 'Đã xảy ra lỗi khi tạo báo cáo. Vui lòng kiểm tra API key và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const stats = getMonthlyStats(currentMonth, currentYear);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Báo Cáo Tài Chính AI</h1>
        <p className="text-muted-foreground">
          Phân tích thông minh về tình hình tài chính của bạn
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Thu Nhập Tháng Này
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalIncome, settings.currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chi Tiêu Tháng Này
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalExpenses, settings.currency)}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${stats.netAmount >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Thu Nhập Ròng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.netAmount, settings.currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tỷ Lệ Tiết Kiệm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalIncome > 0 
                ? `${((stats.netAmount / stats.totalIncome) * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Report Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Báo Cáo AI Thông Minh
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Nhận phân tích và lời khuyên từ AI dựa trên dữ liệu tài chính của bạn
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!settings.openaiApiKey && (
              <div className="flex items-start gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Chưa cấu hình API Key
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Vui lòng vào phần <strong>Cài Đặt</strong> để thêm OpenAI API key trước khi sử dụng tính năng này.
                  </p>
                </div>
              </div>
            )}

            <Button 
              onClick={generateReport} 
              disabled={loading || !settings.openaiApiKey}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang phân tích...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Tạo Báo Cáo AI
                </>
              )}
            </Button>

            {error && (
              <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Lỗi
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {report && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {report}
                  </div>
                </div>
              </div>
            )}

            {!report && !error && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Nhấn nút trên để tạo báo cáo AI về tình hình tài chính của bạn</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}