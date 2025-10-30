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
  FaPlane,
  FaFilm,
  FaBus
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

// Register ChartJS components
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

const API_URL = 'https://expense-tracker-system-backend.vercel.app/api/dashboard';

const DashboardHome = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('monthly');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token') || 'your-jwt-token-here';
        const response = await axios.get(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDashboardData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch dashboard data. Please try again later.');
        setLoading(false);
        console.error('Dashboard fetch error:', err);
      }
    };

    fetchDashboardData();
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

  if (!dashboardData) return null;

  // Process data for charts and displays based on time range
  const financialData = processFinancialData(dashboardData, timeRange);
  const chartData = prepareChartData(financialData, timeRange);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8 ml-64">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Financial Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Welcome back! Here's your financial overview for {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm text-gray-700 bg-white px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard 
          title="Total Balance" 
          amount={financialData.totalBalance}
          trend={financialData.trends.totalBalance}
          icon={<FaWallet className="text-white text-lg" />}
          color="purple"
          subtitle="All accounts"
        />
        <SummaryCard 
          title="Total Income" 
          amount={financialData.totalIncome}
          trend={financialData.trends.totalIncome}
          icon={<FaArrowUp className="text-white text-lg" />}
          color="green"
          subtitle={`This ${timeRange}`}
        />
        <SummaryCard 
          title="Total Expenses" 
          amount={financialData.totalExpenses}
          trend={financialData.trends.totalExpenses}
          icon={<FaArrowDown className="text-white text-lg" />}
          color="red"
          subtitle={`This ${timeRange}`}
        />
        <SummaryCard 
          title="Net Savings" 
          amount={financialData.netSavings}
          trend={financialData.trends.netSavings}
          icon={<FaPiggyBank className="text-white text-lg" />}
          color="blue"
          subtitle={`${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} average`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column - 2/3 width */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Distribution */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Income Distribution</h2>
                  <p className="text-sm text-gray-500 mt-1">By category</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${financialData.trends.totalIncome >= 0 ? 'text-green-600' : 'text-red-600'} font-medium ${financialData.trends.totalIncome >= 0 ? 'bg-green-50' : 'bg-red-50'} px-3 py-1 rounded-full`}>
                    {financialData.trends.totalIncome >= 0 ? '+' : ''}{financialData.trends.totalIncome}%
                  </span>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                    <FaEllipsisH />
                  </button>
                </div>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Doughnut data={chartData.incomeDistribution} options={chartData.doughnutOptions} />
              </div>
            </div>

            {/* Expenses Trend */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Expenses Trend</h2>
                  <p className="text-sm text-gray-500 mt-1">{chartData.expensesTrend.labels.length} periods</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${financialData.trends.totalExpenses >= 0 ? 'text-red-600' : 'text-green-600'} font-medium ${financialData.trends.totalExpenses >= 0 ? 'bg-red-50' : 'bg-green-50'} px-3 py-1 rounded-full`}>
                    {financialData.trends.totalExpenses >= 0 ? '+' : ''}{financialData.trends.totalExpenses}%
                  </span>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                    <FaEllipsisH />
                  </button>
                </div>
              </div>
              <div className="h-64">
                <Bar data={chartData.expensesTrend} options={chartData.barOptions} />
              </div>
            </div>
          </div>

          {/* Cash Flow Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Cash Flow</h2>
                <p className="text-sm text-gray-500 mt-1">Income vs Expenses</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${financialData.netSavings >= 0 ? 'text-green-600' : 'text-red-600'} font-medium ${financialData.netSavings >= 0 ? 'bg-green-50' : 'bg-red-50'} px-3 py-1 rounded-full`}>
                  {financialData.netSavings >= 0 ? 'Positive' : 'Negative'}
                </span>
                <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                  <FaEllipsisH />
                </button>
              </div>
            </div>
            <div className="h-72">
              <Line data={chartData.cashFlow} options={chartData.lineOptions} />
            </div>
          </div>

          {/* Transactions Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Income */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Recent Income</h2>
                  <p className="text-sm text-gray-500 mt-1">Latest transactions</p>
                </div>
                <button className="text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors bg-purple-50 px-4 py-2 rounded-lg hover:bg-purple-100">
                  View All →
                </button>
              </div>
              <TransactionList 
                transactions={financialData.recentIncome} 
                type="income"
              />
            </div>

            {/* Recent Expenses */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
                  <p className="text-sm text-gray-500 mt-1">Latest transactions</p>
                </div>
                <button className="text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors bg-purple-50 px-4 py-2 rounded-lg hover:bg-purple-100">
                  View All →
                </button>
              </div>
              <TransactionList 
                transactions={financialData.recentExpenses} 
                type="expense"
              />
            </div>
          </div>

        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          
          {/* Financial Overview */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Financial Overview</h2>
                <p className="text-sm text-gray-500 mt-1">This {timeRange}</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                <FaEllipsisH />
              </button>
            </div>
            <div className="h-64 mb-6 flex items-center justify-center">
              <Doughnut data={chartData.financialOverview} options={chartData.doughnutOptions} />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Income</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ${financialData.totalIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Expenses</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ${financialData.totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-base font-semibold text-gray-900">Net Savings</span>
                </div>
                <span className={`text-base font-bold ${financialData.netSavings >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                  ${Math.abs(financialData.netSavings).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                <p className="text-sm text-gray-500 mt-1">All activities</p>
              </div>
              <button className="text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors bg-purple-50 px-4 py-2 rounded-lg hover:bg-purple-100">
                View All →
              </button>
            </div>
            <TransactionList 
              transactions={financialData.recentTransactions} 
              showType={true}
            />
          </div>

          {/* Budget Progress */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Budget Progress</h2>
                <p className="text-sm text-gray-500 mt-1">{timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} budget</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                <FaEllipsisH />
              </button>
            </div>
            <div className="space-y-6">
              {financialData.budgetCategories.map((category, index) => (
                <BudgetProgress 
                  key={index}
                  category={category.name}
                  spent={category.spent}
                  budget={category.budget}
                  color={category.color}
                  icon={category.icon}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Enhanced SummaryCard Component
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

// Enhanced TransactionList Component
const TransactionList = ({ transactions, showType = false }) => {
  const getIcon = (category) => {
    const icons = {
      shopping: <FaShoppingCart className="text-blue-500 text-sm" />,
      salary: <FaMoneyBillWave className="text-green-500 text-sm" />,
      food: <FaUtensils className="text-orange-500 text-sm" />,
      travel: <FaPlane className="text-purple-500 text-sm" />,
      entertainment: <FaFilm className="text-pink-500 text-sm" />,
      investment: <FaPiggyBank className="text-yellow-500 text-sm" />,
      transportation: <FaBus className="text-indigo-500 text-sm" />,
      default: <FaMoneyBillWave className="text-gray-500 text-sm" />,
    };
    return icons[category] || icons.default;
  };

  const getTypeBadge = (type) => {
    const styles = {
      income: 'bg-green-50 text-green-700 border border-green-200',
      expense: 'bg-red-50 text-red-700 border border-red-200'
    };
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[type]}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {transactions.map((transaction, index) => (
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
                {showType && getTypeBadge(transaction.type)}
              </div>
              <p className="text-xs text-gray-500">{transaction.date}</p>
            </div>
          </div>
          <div className="text-right ml-2">
            <p className={`font-semibold text-sm ${
              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
            }`}>
              {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Enhanced BudgetProgress Component
const BudgetProgress = ({ category, spent, budget, color, icon }) => {
  const percentage = (spent / budget) * 100;
  
  const progressColors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  };

  const textColors = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600'
  };

  const progressColor = percentage > 90 ? 'bg-red-500' : percentage > 75 ? 'bg-orange-500' : progressColors[color] || 'bg-green-500';
  const textColor = percentage > 90 ? 'text-red-600' : percentage > 75 ? 'text-orange-600' : textColors[color] || 'text-green-600';

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            {icon}
          </div>
          <span className="font-medium text-gray-900 text-sm">{category}</span>
        </div>
        <span className="text-gray-600 text-sm font-semibold">
          ${spent.toLocaleString()}
          <span className="text-gray-400"> / ${budget.toLocaleString()}</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full ${progressColor} transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className={`font-semibold ${textColor}`}>{percentage.toFixed(1)}% spent</span>
        <span className="text-gray-500 font-medium">${(budget - spent).toLocaleString()} left</span>
      </div>
    </div>
  );
};

// Data processing functions
const processFinancialData = (data, timeRange) => {
  // This function processes the API response into a structured format based on time range
  // You'll need to adjust this based on your actual API response structure
  
  const timeRangeData = {
    weekly: {
      totalBalance: 91100,
      totalIncome: 12500,
      totalExpenses: 1800,
      netSavings: 10700,
      trends: {
        totalBalance: 2.1,
        totalIncome: 8.2,
        totalExpenses: -3.5,
        netSavings: 12.7
      },
      recentIncome: [
        { title: 'Weekly Salary', amount: 3000, date: 'Today', type: 'income', category: 'salary' },
        { title: 'Freelance Work', amount: 2500, date: '2 days ago', type: 'income', category: 'salary' },
        { title: 'Investment Returns', amount: 1200, date: '4 days ago', type: 'income', category: 'investment' },
        { title: 'Side Project', amount: 1500, date: '6 days ago', type: 'income', category: 'salary' },
      ],
      recentExpenses: [
        { title: 'Grocery Shopping', amount: 230, date: 'Today', type: 'expense', category: 'food' },
        { title: 'Restaurant', amount: 120, date: 'Yesterday', type: 'expense', category: 'food' },
        { title: 'Transportation', amount: 85, date: '3 days ago', type: 'expense', category: 'transportation' },
        { title: 'Entertainment', amount: 65, date: '5 days ago', type: 'expense', category: 'entertainment' },
      ],
      recentTransactions: [
        { title: 'Weekly Salary', amount: 3000, date: 'Today', type: 'income', category: 'salary' },
        { title: 'Grocery Shopping', amount: 230, date: 'Today', type: 'expense', category: 'food' },
        { title: 'Restaurant', amount: 120, date: 'Yesterday', type: 'expense', category: 'food' },
        { title: 'Freelance Work', amount: 2500, date: '2 days ago', type: 'income', category: 'salary' },
        { title: 'Transportation', amount: 85, date: '3 days ago', type: 'expense', category: 'transportation' },
      ],
      budgetCategories: [
        { name: 'Food & Dining', spent: 350, budget: 500, color: 'green', icon: <FaUtensils className="text-green-500 text-sm" /> },
        { name: 'Shopping', spent: 200, budget: 300, color: 'blue', icon: <FaShoppingCart className="text-blue-500 text-sm" /> },
        { name: 'Entertainment', spent: 65, budget: 100, color: 'purple', icon: <FaFilm className="text-purple-500 text-sm" /> },
        { name: 'Transportation', spent: 85, budget: 150, color: 'orange', icon: <FaBus className="text-orange-500 text-sm" /> },
      ],
      incomeDistribution: {
        Salary: 5500,
        Freelance: 2500,
        Investments: 1200,
        Other: 800
      },
      expensesByCategory: {
        Food: 350,
        Shopping: 200,
        Transportation: 85,
        Entertainment: 65
      }
    },
    monthly: {
      totalBalance: 91100,
      totalIncome: 52000,
      totalExpenses: 7100,
      netSavings: 44900,
      trends: {
        totalBalance: 12.5,
        totalIncome: 8.2,
        totalExpenses: -4.3,
        netSavings: 15.7
      },
      recentIncome: [
        { title: 'Monthly Salary', amount: 12000, date: '12th Feb 2025', type: 'income', category: 'salary' },
        { title: 'Freelance Project', amount: 8500, date: '8th Feb 2025', type: 'income', category: 'salary' },
        { title: 'Investment Returns', amount: 3200, date: '5th Feb 2025', type: 'income', category: 'investment' },
        { title: 'Bonus Payment', amount: 2500, date: '1st Feb 2025', type: 'income', category: 'salary' },
      ],
      recentExpenses: [
        { title: 'Grocery Shopping', amount: 430, date: '17th Feb 2025', type: 'expense', category: 'food' },
        { title: 'Flight Tickets', amount: 670, date: '12th Feb 2025', type: 'expense', category: 'travel' },
        { title: 'Restaurant Dinner', amount: 120, date: '10th Feb 2025', type: 'expense', category: 'food' },
        { title: 'Monthly Subscription', amount: 45, date: '8th Feb 2025', type: 'expense', category: 'entertainment' },
      ],
      recentTransactions: [
        { title: 'Monthly Salary', amount: 12000, date: '12th Feb 2025', type: 'income', category: 'salary' },
        { title: 'Grocery Shopping', amount: 430, date: '17th Feb 2025', type: 'expense', category: 'food' },
        { title: 'Flight Tickets', amount: 670, date: '12th Feb 2025', type: 'expense', category: 'travel' },
        { title: 'Freelance Project', amount: 8500, date: '8th Feb 2025', type: 'income', category: 'salary' },
        { title: 'Monthly Subscription', amount: 45, date: '8th Feb 2025', type: 'expense', category: 'entertainment' },
      ],
      budgetCategories: [
        { name: 'Food & Dining', spent: 1200, budget: 1500, color: 'green', icon: <FaUtensils className="text-green-500 text-sm" /> },
        { name: 'Shopping', spent: 800, budget: 1000, color: 'blue', icon: <FaShoppingCart className="text-blue-500 text-sm" /> },
        { name: 'Entertainment', spent: 300, budget: 500, color: 'purple', icon: <FaFilm className="text-purple-500 text-sm" /> },
        { name: 'Transportation', spent: 400, budget: 600, color: 'orange', icon: <FaBus className="text-orange-500 text-sm" /> },
      ],
      incomeDistribution: {
        Salary: 23000,
        Freelance: 8500,
        Investments: 3200,
        Bonus: 2500
      },
      expensesByCategory: {
        Shopping: 430,
        Travel: 670,
        Food: 550,
        Bills: 450
      }
    },
    quarterly: {
      totalBalance: 91100,
      totalIncome: 152000,
      totalExpenses: 21000,
      netSavings: 131000,
      trends: {
        totalBalance: 8.7,
        totalIncome: 12.3,
        totalExpenses: -2.1,
        netSavings: 18.5
      },
      recentIncome: [
        { title: 'Quarterly Bonus', amount: 15000, date: '15th Feb 2025', type: 'income', category: 'salary' },
        { title: 'Project Completion', amount: 20000, date: '1st Feb 2025', type: 'income', category: 'salary' },
        { title: 'Stock Dividends', amount: 8500, date: '25th Jan 2025', type: 'income', category: 'investment' },
        { title: 'Consulting Work', amount: 12000, date: '10th Jan 2025', type: 'income', category: 'salary' },
      ],
      recentExpenses: [
        { title: 'Vacation', amount: 3500, date: '5th Feb 2025', type: 'expense', category: 'travel' },
        { title: 'Electronics', amount: 2200, date: '20th Jan 2025', type: 'expense', category: 'shopping' },
        { title: 'Car Maintenance', amount: 1200, date: '15th Jan 2025', type: 'expense', category: 'transportation' },
        { title: 'Home Improvement', amount: 1800, date: '5th Jan 2025', type: 'expense', category: 'shopping' },
      ],
      recentTransactions: [
        { title: 'Quarterly Bonus', amount: 15000, date: '15th Feb 2025', type: 'income', category: 'salary' },
        { title: 'Vacation', amount: 3500, date: '5th Feb 2025', type: 'expense', category: 'travel' },
        { title: 'Project Completion', amount: 20000, date: '1st Feb 2025', type: 'income', category: 'salary' },
        { title: 'Electronics', amount: 2200, date: '20th Jan 2025', type: 'expense', category: 'shopping' },
        { title: 'Stock Dividends', amount: 8500, date: '25th Jan 2025', type: 'income', category: 'investment' },
      ],
      budgetCategories: [
        { name: 'Travel', spent: 3500, budget: 5000, color: 'purple', icon: <FaPlane className="text-purple-500 text-sm" /> },
        { name: 'Shopping', spent: 4000, budget: 6000, color: 'blue', icon: <FaShoppingCart className="text-blue-500 text-sm" /> },
        { name: 'Home & Utilities', spent: 2800, budget: 4000, color: 'green', icon: <FaMoneyBillWave className="text-green-500 text-sm" /> },
        { name: 'Entertainment', spent: 1200, budget: 2000, color: 'orange', icon: <FaFilm className="text-orange-500 text-sm" /> },
      ],
      incomeDistribution: {
        Salary: 75000,
        Freelance: 32000,
        Investments: 25000,
        Bonus: 20000
      },
      expensesByCategory: {
        Travel: 3500,
        Shopping: 4000,
        Bills: 2800,
        Food: 2200
      }
    },
    yearly: {
      totalBalance: 91100,
      totalIncome: 625000,
      totalExpenses: 85000,
      netSavings: 540000,
      trends: {
        totalBalance: 15.2,
        totalIncome: 18.7,
        totalExpenses: -5.3,
        netSavings: 22.4
      },
      recentIncome: [
        { title: 'Annual Bonus', amount: 50000, date: '15th Feb 2025', type: 'income', category: 'salary' },
        { title: 'Investment Returns', amount: 35000, date: '1st Feb 2025', type: 'income', category: 'investment' },
        { title: 'Business Revenue', amount: 75000, date: '25th Jan 2025', type: 'income', category: 'salary' },
        { title: 'Stock Options', amount: 45000, date: '10th Jan 2025', type: 'income', category: 'investment' },
      ],
      recentExpenses: [
        { title: 'Car Purchase', amount: 35000, date: '15th Jan 2025', type: 'expense', category: 'transportation' },
        { title: 'Home Renovation', amount: 25000, date: '1st Dec 2024', type: 'expense', category: 'shopping' },
        { title: 'Family Vacation', amount: 15000, date: '15th Nov 2024', type: 'expense', category: 'travel' },
        { title: 'Education', amount: 12000, date: '1st Oct 2024', type: 'expense', category: 'shopping' },
      ],
      recentTransactions: [
        { title: 'Annual Bonus', amount: 50000, date: '15th Feb 2025', type: 'income', category: 'salary' },
        { title: 'Car Purchase', amount: 35000, date: '15th Jan 2025', type: 'expense', category: 'transportation' },
        { title: 'Investment Returns', amount: 35000, date: '1st Feb 2025', type: 'income', category: 'investment' },
        { title: 'Home Renovation', amount: 25000, date: '1st Dec 2024', type: 'expense', category: 'shopping' },
        { title: 'Business Revenue', amount: 75000, date: '25th Jan 2025', type: 'income', category: 'salary' },
      ],
      budgetCategories: [
        { name: 'Major Purchases', spent: 60000, budget: 80000, color: 'blue', icon: <FaShoppingCart className="text-blue-500 text-sm" /> },
        { name: 'Travel & Leisure', spent: 20000, budget: 30000, color: 'purple', icon: <FaPlane className="text-purple-500 text-sm" /> },
        { name: 'Home & Utilities', spent: 15000, budget: 25000, color: 'green', icon: <FaMoneyBillWave className="text-green-500 text-sm" /> },
        { name: 'Education', spent: 12000, budget: 20000, color: 'orange', icon: <FaPiggyBank className="text-orange-500 text-sm" /> },
      ],
      incomeDistribution: {
        Salary: 300000,
        Business: 175000,
        Investments: 125000,
        Bonus: 25000
      },
      expensesByCategory: {
        'Major Purchases': 60000,
        Travel: 20000,
        'Home & Utilities': 15000,
        Education: 12000
      }
    }
  };

  return timeRangeData[timeRange] || timeRangeData.monthly;
};

const prepareChartData = (financialData, timeRange) => {
  // Get appropriate labels based on time range
  const getLabels = () => {
    switch (timeRange) {
      case 'weekly':
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      case 'monthly':
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      case 'quarterly':
        return ['Q1', 'Q2', 'Q3', 'Q4'];
      case 'yearly':
        return ['2020', '2021', '2022', '2023', '2024', '2025'];
      default:
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    }
  };

  // Get appropriate data based on time range
  const getExpensesData = () => {
    switch (timeRange) {
      case 'weekly':
        return [1200, 1800, 1500, 1400, 1600, 1900, 1700];
      case 'monthly':
        return [6500, 7100, 6800, 7200, 6900, 7100];
      case 'quarterly':
        return [18000, 21000, 19500, 22500];
      case 'yearly':
        return [65000, 72000, 78000, 82000, 79000, 85000];
      default:
        return [6500, 7100, 6800, 7200, 6900, 7100];
    }
  };

  const getIncomeData = () => {
    switch (timeRange) {
      case 'weekly':
        return [8000, 9500, 8800, 9200, 9800, 10500, 12500];
      case 'monthly':
        return [48000, 52000, 49000, 53000, 51000, 52000];
      case 'quarterly':
        return [140000, 152000, 148000, 160000];
      case 'yearly':
        return [450000, 520000, 580000, 610000, 590000, 625000];
      default:
        return [48000, 52000, 49000, 53000, 51000, 52000];
    }
  };

  const labels = getLabels();
  const expensesData = getExpensesData();
  const incomeData = getIncomeData();

  // Income Distribution Doughnut Chart
  const incomeDistribution = {
    labels: Object.keys(financialData.incomeDistribution),
    datasets: [
      {
        data: Object.values(financialData.incomeDistribution),
        backgroundColor: [
          '#8B5CF6',
          '#10B981',
          '#F59E0B',
          '#6366F1',
        ],
        borderWidth: 3,
        borderColor: '#FFFFFF',
        hoverBorderWidth: 4,
        hoverOffset: 8,
      },
    ],
  };

  // Expenses Trend Bar Chart
  const expensesTrend = {
    labels: labels,
    datasets: [
      {
        label: 'Expenses',
        data: expensesData,
        backgroundColor: '#EF4444',
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  // Cash Flow Line Chart
  const cashFlow = {
    labels: labels,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Expenses',
        data: expensesData,
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointBackgroundColor: '#EF4444',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // Financial Overview Doughnut Chart
  const financialOverview = {
    labels: ['Income', 'Expenses', 'Savings'],
    datasets: [
      {
        data: [financialData.totalIncome, financialData.totalExpenses, financialData.netSavings],
        backgroundColor: [
          '#10B981',
          '#EF4444',
          '#8B5CF6',
        ],
        borderWidth: 3,
        borderColor: '#FFFFFF',
        hoverBorderWidth: 4,
        hoverOffset: 8,
      },
    ],
  };

  // Chart options
  const doughnutOptions = {
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          }
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1F2937',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
          }
        }
      },
    },
    maintainAspectRatio: false,
  };

  const barOptions = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1F2937',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return `Expenses: $${context.parsed.y.toLocaleString()}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        border: {
          dash: [4, 4],
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          }
        }
      },
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
          pointStyle: 'circle',
          font: {
            size: 11,
          }
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1F2937',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        cornerRadius: 8,
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value.toLocaleString()}`;
          }
        }
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        border: {
          dash: [4, 4],
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          }
        }
      },
    },
    maintainAspectRatio: false,
  };

  return {
    incomeDistribution,
    expensesTrend,
    cashFlow,
    financialOverview,
    doughnutOptions,
    barOptions,
    lineOptions,
  };
};

export default DashboardHome;