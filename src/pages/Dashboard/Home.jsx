import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaWallet, 
  FaArrowUp, 
  FaArrowDown, 
  FaMoneyBillWave, 
  FaPiggyBank, 
  FaShoppingCart, 
  FaEllipsisH,
  FaUtensils,
  FaHome,
  FaFilm,
  FaBus,
  FaHeartbeat,
  FaGraduationCap,
  FaGift,
  FaRobot,
  FaLightbulb,
  FaSyncAlt,
  FaChartLine
} from 'react-icons/fa';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  LineElement,
  PointElement,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import AIInsights from '../../components/AIInsights';
import AIManagement from '../../components/AIManagement';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  LineElement,
  PointElement
);

const DashboardHome = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const baseURL = 'http://localhost:5000/api';
        
        // Fetch all data in parallel
        const [dashboardResponse, incomesResponse, expensesResponse] = await Promise.all([
          axios.get(`${baseURL}/dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${baseURL}/incomes`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${baseURL}/expenses`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setDashboardData(dashboardResponse.data);
        setIncomes(incomesResponse.data);
        setExpenses(expensesResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Data fetch error:', err);
        setError(err.response?.data?.message || 'Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center ml-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading dashboard data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center ml-64">
      <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-gray-200 max-w-md w-full mx-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaArrowDown className="text-red-500 text-xl" />
        </div>
        <p className="text-lg font-semibold text-gray-900 mb-2">Connection Error</p>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );

  // Calculate totals from actual data
  const financialData = calculateFinancialData(incomes, expenses, dashboardData);
  const chartData = prepareChartData(financialData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8 ml-64">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Financial Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              {financialData.isEmpty ? 
                "Welcome! Start tracking your finances by adding income and expenses." : 
                `Welcome back! Here's your financial overview - ${financialData.totalTransactions} transactions`
              }
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
            <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-200">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {financialData.isEmpty ? (
        <EmptyDashboardState />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <SummaryCard 
              title="Total Income" 
              amount={financialData.totalIncome}
              trend={financialData.incomeTrend}
              icon={<FaArrowUp className="text-white text-lg" />}
              color="green"
              subtitle={`${incomes.length} transactions`}
            />
            <SummaryCard 
              title="Total Expenses" 
              amount={financialData.totalExpenses}
              trend={financialData.expenseTrend}
              icon={<FaArrowDown className="text-white text-lg" />}
              color="red"
              subtitle={`${expenses.length} transactions`}
            />
            <SummaryCard 
              title="Current Balance" 
              amount={financialData.currentBalance}
              trend={financialData.balanceTrend}
              icon={<FaWallet className="text-white text-lg" />}
              color="purple"
              subtitle="Net amount"
            />
            <SummaryCard 
              title="Monthly Savings" 
              amount={financialData.currentMonthSavings}
              trend={financialData.savingsTrend}
              icon={<FaPiggyBank className="text-white text-lg" />}
              color="blue"
              subtitle={`${financialData.savingsRate}% savings rate`}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            <div className="xl:col-span-2 space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Insights Component */}
                <div className="lg:col-span-2">
                  <AIInsights />
                </div>

                {/* Income Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Income Distribution</h2>
                      <p className="text-sm text-gray-500 mt-1">By category</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 font-medium bg-gray-50 px-3 py-1 rounded-full">
                        Total: ${financialData.totalIncome.toLocaleString()}
                      </span>
                      <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                        <FaEllipsisH />
                      </button>
                    </div>
                  </div>
                  <div className="h-64 flex items-center justify-center">
                    {financialData.incomeByCategory.length > 0 ? (
                      <Doughnut data={chartData.incomeDistribution} options={chartData.doughnutOptions} />
                    ) : (
                      <div className="text-center text-gray-500">
                        <FaMoneyBillWave className="text-4xl mx-auto mb-2 text-gray-300" />
                        <p>No income data</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expenses Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Expenses Distribution</h2>
                      <p className="text-sm text-gray-500 mt-1">By category</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 font-medium bg-gray-50 px-3 py-1 rounded-full">
                        Total: ${financialData.totalExpenses.toLocaleString()}
                      </span>
                      <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                        <FaEllipsisH />
                      </button>
                    </div>
                  </div>
                  <div className="h-64 flex items-center justify-center">
                    {financialData.expenseByCategory.length > 0 ? (
                      <Doughnut data={chartData.expenseDistribution} options={chartData.doughnutOptions} />
                    ) : (
                      <div className="text-center text-gray-500">
                        <FaShoppingCart className="text-4xl mx-auto mb-2 text-gray-300" />
                        <p>No expense data</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Monthly Trend */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Monthly Trend</h2>
                    <p className="text-sm text-gray-500 mt-1">Last 6 months</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${financialData.currentMonthSavings >= 0 ? 'text-green-600' : 'text-red-600'} font-medium ${financialData.currentMonthSavings >= 0 ? 'bg-green-50' : 'bg-red-50'} px-3 py-1 rounded-full`}>
                      {financialData.currentMonthSavings >= 0 ? 'Positive' : 'Negative'}
                    </span>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                      <FaEllipsisH />
                    </button>
                  </div>
                </div>
                <div className="h-72">
                  <Line data={chartData.monthlyTrend} options={chartData.lineOptions} />
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Recent Income</h2>
                      <p className="text-sm text-gray-500 mt-1">Latest transactions</p>
                    </div>
                    <button className="text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors bg-purple-50 px-4 py-2 rounded-lg hover:bg-purple-100">
                      View All ({incomes.length})
                    </button>
                  </div>
                  <TransactionList 
                    transactions={financialData.recentIncomes} 
                    type="income"
                  />
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
                      <p className="text-sm text-gray-500 mt-1">Latest transactions</p>
                    </div>
                    <button className="text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors bg-purple-50 px-4 py-2 rounded-lg hover:bg-purple-100">
                      View All ({expenses.length})
                    </button>
                  </div>
                  <TransactionList 
                    transactions={financialData.recentExpenses} 
                    type="expense"
                  />
                </div>
              </div>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* AI Management Component */}
              <AIManagement />

              {/* Financial Overview */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Financial Overview</h2>
                    <p className="text-sm text-gray-500 mt-1">This month</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                    <FaEllipsisH />
                  </button>
                </div>
                <div className="h-64 mb-6 flex items-center justify-center">
                  {financialData.totalIncome > 0 || financialData.totalExpenses > 0 ? (
                    <Doughnut data={chartData.financialOverview} options={chartData.doughnutOptions} />
                  ) : (
                    <div className="text-center text-gray-500">
                      <FaWallet className="text-4xl mx-auto mb-2 text-gray-300" />
                      <p>No financial data</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Monthly Income</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      ${financialData.currentMonthIncome.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Monthly Expenses</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      ${financialData.currentMonthExpense.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-base font-semibold text-gray-900">Monthly Savings</span>
                    </div>
                    <span className={`text-base font-bold ${financialData.currentMonthSavings >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                      ${Math.abs(financialData.currentMonthSavings).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Categories */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Top Categories</h2>
                    <p className="text-sm text-gray-500 mt-1">This month</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {financialData.topIncomeCategories.map((category, index) => (
                    <CategoryItem 
                      key={`income-${index}`}
                      category={category.name}
                      amount={category.amount}
                      type="income"
                      percentage={category.percentage}
                    />
                  ))}
                  {financialData.topExpenseCategories.map((category, index) => (
                    <CategoryItem 
                      key={`expense-${index}`}
                      category={category.name}
                      amount={category.amount}
                      type="expense"
                      percentage={category.percentage}
                    />
                  ))}
                </div>
              </div>

              {/* Financial Insights */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Financial Insights</h2>
                    <p className="text-sm text-gray-500 mt-1">Key metrics</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <InsightItem 
                    title="Total Transactions"
                    value={financialData.totalTransactions}
                    description="income & expense records"
                    positive={true}
                  />
                  <InsightItem 
                    title="Average Income"
                    value={`$${financialData.averageIncome}`}
                    description="per transaction"
                    positive={true}
                  />
                  <InsightItem 
                    title="Average Expense"
                    value={`$${financialData.averageExpense}`}
                    description="per transaction"
                    positive={false}
                  />
                  <InsightItem 
                    title="Savings Rate"
                    value={`${financialData.savingsRate}%`}
                    description="of income saved"
                    positive={financialData.savingsRate > 0}
                  />
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Helper Components
const SummaryCard = ({ title, amount, trend, icon, color, subtitle }) => {
  const colorClasses = {
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
    green: 'bg-gradient-to-br from-green-500 to-green-600',
    red: 'bg-gradient-to-br from-red-500 to-red-600',
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
  };

  const trendColor = trend >= 0 ? 'text-green-600' : 'text-red-600';
  const trendBgColor = trend >= 0 ? 'bg-green-50' : 'bg-red-50';
  const trendIcon = trend >= 0 ? '↗' : '↘';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
          {icon}
        </div>
        <span className={`text-xs font-semibold ${trendColor} ${trendBgColor} px-3 py-1 rounded-full`}>
          {trendIcon} {Math.abs(trend)}%
        </span>
      </div>
      <div>
        <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mb-1">${amount.toLocaleString()}</p>
        <p className="text-xs text-gray-400 font-medium">{subtitle}</p>
      </div>
    </div>
  );
};

const TransactionList = ({ transactions, type }) => {
  const getIcon = (category) => {
    return getCategoryIcon(category);
  };

  return (
    <div className="space-y-3">
      {transactions.length > 0 ? (
        transactions.map((transaction, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer group border border-transparent hover:border-gray-200"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-white transition-colors shadow-sm">
                {getIcon(transaction.category)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-semibold text-gray-900 truncate text-sm">{transaction.title}</p>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(transaction.date).toLocaleDateString()} • {transaction.category}
                </p>
              </div>
            </div>
            <div className="text-right ml-2">
              <p className={`font-semibold text-sm ${
                type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
              </p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FaMoneyBillWave className="text-3xl mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No {type} transactions</p>
        </div>
      )}
    </div>
  );
};

const CategoryItem = ({ category, amount, type, percentage }) => {
  const isIncome = type === 'income';
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          {getCategoryIcon(category)}
        </div>
        <div>
          <span className="font-medium text-gray-900 text-sm capitalize">{category.toLowerCase()}</span>
          <p className="text-xs text-gray-500">{type}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
          ${amount.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500">{percentage}%</p>
      </div>
    </div>
  );
};

const InsightItem = ({ title, value, description, positive }) => {
  return (
    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div>
        <span className="font-medium text-gray-900 text-sm">{title}</span>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <span className={`text-sm font-semibold ${positive ? 'text-green-600' : 'text-red-600'}`}>
        {value}
      </span>
    </div>
  );
};

const EmptyDashboardState = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <FaWallet className="text-purple-500 text-2xl" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Your Dashboard!</h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">
      Start tracking your finances by adding your first income and expense transactions.
      Your dashboard will show insightful charts and statistics here.
    </p>
    <div className="flex justify-center space-x-4">
      <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-medium">
        Add Income
      </button>
      <button className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium">
        Add Expense
      </button>
    </div>
  </div>
);

// Helper Functions
const getCategoryIcon = (category) => {
  const icons = {
    Food: <FaUtensils className="text-orange-500 text-sm" />,
    Shopping: <FaShoppingCart className="text-blue-500 text-sm" />,
    Transport: <FaBus className="text-indigo-500 text-sm" />,
    Entertainment: <FaFilm className="text-pink-500 text-sm" />,
    Healthcare: <FaHeartbeat className="text-red-500 text-sm" />,
    Bills: <FaHome className="text-gray-500 text-sm" />,
    Education: <FaGraduationCap className="text-green-500 text-sm" />,
    Other: <FaGift className="text-purple-500 text-sm" />,
    Salary: <FaMoneyBillWave className="text-green-500 text-sm" />,
    Freelance: <FaMoneyBillWave className="text-blue-500 text-sm" />,
    Investment: <FaPiggyBank className="text-yellow-500 text-sm" />,
    Business: <FaMoneyBillWave className="text-purple-500 text-sm" />,
    Gift: <FaGift className="text-pink-500 text-sm" />,
  };
  return icons[category] || icons.Other;
};

// Data Processing Functions
const calculateFinancialData = (incomes, expenses, dashboardData) => {
  // Calculate totals from actual data
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const currentBalance = totalIncome - totalExpenses;

  // Current month calculations
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthIncome = incomes
    .filter(income => {
      const incomeDate = new Date(income.date);
      return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
    })
    .reduce((sum, income) => sum + income.amount, 0);

  const currentMonthExpense = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const currentMonthSavings = currentMonthIncome - currentMonthExpense;
  const savingsRate = currentMonthIncome > 0 ? ((currentMonthSavings / currentMonthIncome) * 100).toFixed(1) : 0;

  // Calculate category data
  const incomeByCategory = calculateCategoryData(incomes);
  const expenseByCategory = calculateCategoryData(expenses);

  // Get recent transactions (last 5)
  const recentIncomes = [...incomes]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Top categories
  const topIncomeCategories = incomeByCategory.slice(0, 3).map(cat => ({
    name: cat.category,
    amount: cat.total,
    percentage: ((cat.total / totalIncome) * 100).toFixed(1)
  }));

  const topExpenseCategories = expenseByCategory.slice(0, 3).map(cat => ({
    name: cat.category,
    amount: cat.total,
    percentage: ((cat.total / totalExpenses) * 100).toFixed(1)
  }));

  // Averages
  const averageIncome = incomes.length > 0 ? (totalIncome / incomes.length).toFixed(2) : "0.00";
  const averageExpense = expenses.length > 0 ? (totalExpenses / expenses.length).toFixed(2) : "0.00";

  return {
    isEmpty: incomes.length === 0 && expenses.length === 0,
    totalIncome,
    totalExpenses,
    currentBalance,
    currentMonthIncome,
    currentMonthExpense,
    currentMonthSavings,
    savingsRate: parseFloat(savingsRate),
    incomeTrend: 0, // You can calculate this based on previous data
    expenseTrend: 0,
    balanceTrend: currentBalance >= 0 ? 1 : -1,
    savingsTrend: currentMonthSavings >= 0 ? 1 : -1,
    incomeByCategory,
    expenseByCategory,
    recentIncomes,
    recentExpenses,
    topIncomeCategories,
    topExpenseCategories,
    averageIncome,
    averageExpense,
    totalTransactions: incomes.length + expenses.length,
    monthlyTrend: dashboardData?.charts?.monthlyTrend || generateMonthlyTrend(incomes, expenses)
  };
};

const calculateCategoryData = (transactions) => {
  const categoryMap = {};
  
  transactions.forEach(transaction => {
    const category = transaction.category;
    if (!categoryMap[category]) {
      categoryMap[category] = {
        category,
        total: 0,
        count: 0
      };
    }
    categoryMap[category].total += transaction.amount;
    categoryMap[category].count += 1;
  });

  return Object.values(categoryMap)
    .sort((a, b) => b.total - a.total);
};

const generateMonthlyTrend = (incomes, expenses) => {
  const monthlyTrend = [];
  const currentDate = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    const monthIncome = incomes
      .filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate.getMonth() === month.getMonth() && 
               incomeDate.getFullYear() === month.getFullYear();
      })
      .reduce((sum, income) => sum + income.amount, 0);

    const monthExpense = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === month.getMonth() && 
               expenseDate.getFullYear() === month.getFullYear();
      })
      .reduce((sum, expense) => sum + expense.amount, 0);

    monthlyTrend.push({
      month: monthName,
      income: monthIncome,
      expense: monthExpense,
      savings: monthIncome - monthExpense
    });
  }
  
  return monthlyTrend;
};

const prepareChartData = (financialData) => {
  // Income Distribution Chart
  const incomeDistribution = {
    labels: financialData.incomeByCategory.map(item => item.category),
    datasets: [
      {
        data: financialData.incomeByCategory.map(item => item.total),
        backgroundColor: [
          '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6366F1', '#EC4899'
        ],
        borderWidth: 3,
        borderColor: '#FFFFFF',
      },
    ],
  };

  // Expense Distribution Chart
  const expenseDistribution = {
    labels: financialData.expenseByCategory.map(item => item.category),
    datasets: [
      {
        data: financialData.expenseByCategory.map(item => item.total),
        backgroundColor: [
          '#EF4444', '#8B5CF6', '#F59E0B', '#10B981', '#6366F1', '#EC4899'
        ],
        borderWidth: 3,
        borderColor: '#FFFFFF',
      },
    ],
  };

  // Monthly Trend Chart
  const monthlyTrend = {
    labels: financialData.monthlyTrend.map(item => item.month),
    datasets: [
      {
        label: 'Income',
        data: financialData.monthlyTrend.map(item => item.income),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        borderWidth: 3,
      },
      {
        label: 'Expenses',
        data: financialData.monthlyTrend.map(item => item.expense),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        borderWidth: 3,
      },
    ],
  };

  // Financial Overview Chart
  const financialOverview = {
    labels: ['Income', 'Expenses', 'Balance'],
    datasets: [
      {
        data: [
          financialData.totalIncome,
          financialData.totalExpenses,
          financialData.currentBalance
        ],
        backgroundColor: ['#10B981', '#EF4444', '#8B5CF6'],
        borderWidth: 3,
        borderColor: '#FFFFFF',
      },
    ],
  };

  // Chart Options
  const doughnutOptions = {
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: { size: 11 }
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    },
    maintainAspectRatio: false,
  };

  const lineOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: { size: 11 }
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      },
      x: {
        grid: { display: false },
      },
    },
    maintainAspectRatio: false,
  };

  return {
    incomeDistribution,
    expenseDistribution,
    monthlyTrend,
    financialOverview,
    doughnutOptions,
    lineOptions,
  };
};

export default DashboardHome;