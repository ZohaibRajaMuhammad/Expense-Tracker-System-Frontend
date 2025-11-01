import React, { useState } from 'react';
import axios from 'axios';
import { 
  FaLightbulb, 
  FaChartLine, 
  FaPiggyBank, 
  FaShieldAlt,
  FaRocket,
  FaMoneyBillWave,
  FaChartPie,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaSync,
  FaExclamationCircle
} from 'react-icons/fa';

const AIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const mockInsights = {
    riskLevel: 'MEDIUM',
    quickWins: [
      {
        title: 'Reduce Dining Out',
        action: 'Cook at home 2 more times per week',
        potentialSavings: '$160/month',
        effort: 'LOW',
        impact: 'HIGH'
      },
      {
        title: 'Cancel Unused Subscriptions',
        action: 'Review monthly subscriptions',
        potentialSavings: '$45/month',
        effort: 'LOW',
        impact: 'MEDIUM'
      }
    ],
    incomeTips: [
      {
        title: 'Diversify Income Streams',
        message: 'Consider freelance work or side projects to increase monthly income',
        priority: 'MEDIUM',
        potentialImpact: 'HIGH',
        action: 'Explore Options'
      }
    ],
    expenseTips: [
      {
        title: 'Review Utility Bills',
        message: 'Potential savings by optimizing electricity and internet plans',
        priority: 'LOW',
        potentialImpact: 'MEDIUM',
        action: 'Compare Plans',
        currentSpending: '$280/month'
      }
    ],
    savingTips: [
      {
        title: 'Emergency Fund Boost',
        message: 'Aim to save 3 months of expenses for financial security',
        priority: 'HIGH',
        potentialImpact: 'HIGH',
        action: 'Set Goal',
        target: '$15,000'
      }
    ],
    analysis: [
      {
        aspect: 'Savings Rate',
        message: 'Your savings rate is below recommended 20%',
        details: 'Current rate: 15%. Consider increasing by reducing discretionary spending.',
        status: 'WARNING'
      },
      {
        aspect: 'Debt Management',
        message: 'Healthy debt-to-income ratio',
        details: 'Your ratio is 28%, which is within the recommended range.',
        status: 'POSITIVE'
      }
    ],
    monthlyProjection: {
      projectedIncome: 4500,
      projectedExpenses: 3820,
      projectedSavings: 680,
      confidence: '85%'
    }
  };

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/ai/insights', {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 
      });
      
      if (response.data && response.data.insights) {
        setInsights(response.data.insights);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        setError('Request timeout - server is taking too long to respond');
      } else if (error.response) {
        if (error.response.status === 500) {
          setError('Server error - please try again later or use demo data');
        } else if (error.response.status === 401) {
          setError('Authentication failed - please log in again');
        } else {
          setError(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        setError('Cannot connect to server - make sure backend is running on port 5000');
      } else {
        setError('Failed to fetch insights: ' + error.message);
      }
      
      setInsights(mockInsights);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'POSITIVE': return 'text-green-600 bg-green-50';
      case 'NEGATIVE': return 'text-red-600 bg-red-50';
      case 'CRITICAL': return 'text-red-800 bg-red-100';
      case 'WARNING': return 'text-yellow-600 bg-yellow-50';
      case 'EXCELLENT': return 'text-green-800 bg-green-100';
      case 'GOOD': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (error && !insights) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <FaExclamationCircle className="text-4xl text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Insights</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="space-y-3">
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-medium disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <FaSync className="animate-spin mr-2" />
                Retrying...
              </span>
            ) : (
              'Retry Connection'
            )}
          </button>
          <button
            onClick={() => setInsights(mockInsights)}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium"
          >
            Use Demo Data Instead
          </button>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <FaLightbulb className="text-4xl text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Financial Insights</h3>
        <p className="text-gray-600 mb-6">
          Get personalized financial advice and analysis based on your income and spending patterns
        </p>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-medium disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <FaSync className="animate-spin mr-2" />
              Analyzing Your Finances...
            </span>
          ) : (
            'Generate AI Insights'
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FaLightbulb className="text-2xl text-yellow-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Financial Advisor</h2>
              <p className="text-gray-600 text-sm">
                {error ? 'Demo Data - ' : ''}Personalized insights based on your financial data
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {error && (
              <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded-md">
                Using Demo Data
              </span>
            )}
            <button
              onClick={fetchInsights}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 flex items-center space-x-2"
            >
              <FaSync className={loading ? 'animate-spin' : ''} />
              <span>Refresh Insights</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rest of your existing JSX remains the same */}
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-1 px-6">
          {['overview', 'income', 'expenses', 'savings', 'analysis'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Risk Level */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <FaShieldAlt className={`text-xl ${
                  insights.riskLevel === 'HIGH' ? 'text-red-500' :
                  insights.riskLevel === 'MEDIUM' ? 'text-yellow-500' : 'text-green-500'
                }`} />
                <div>
                  <h4 className="font-semibold text-gray-900">Financial Risk Level</h4>
                  <p className="text-sm text-gray-600">Based on your income, expenses, and savings</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                insights.riskLevel === 'HIGH' ? 'bg-red-100 text-red-800' :
                insights.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {insights.riskLevel}
              </span>
            </div>

            {/* Quick Wins */}
            {insights.quickWins && insights.quickWins.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <FaRocket className="text-green-500" />
                  <span>Quick Wins</span>
                </h4>
                <div className="space-y-3">
                  {insights.quickWins.map((win, index) => (
                    <div key={index} className="p-4 border border-green-200 bg-green-50 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-semibold text-gray-900">{win.title}</h5>
                        <span className="text-sm font-medium text-green-700">{win.potentialSavings}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{win.action}</p>
                      <div className="flex space-x-2 text-xs">
                        <span className="px-2 py-1 bg-white rounded-md">Effort: {win.effort}</span>
                        <span className="px-2 py-1 bg-white rounded-md">Impact: {win.impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Tips from each category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Income Tips */}
              <div className="p-4 border border-blue-200 bg-blue-50 rounded-xl">
                <div className="flex items-center space-x-2 mb-3">
                  <FaMoneyBillWave className="text-blue-500" />
                  <h5 className="font-semibold text-gray-900">Income Tips</h5>
                </div>
                {insights.incomeTips.slice(0, 2).map((tip, index) => (
                  <div key={index} className="mb-2 last:mb-0">
                    <p className="text-sm font-medium text-gray-900">{tip.title}</p>
                    <p className="text-xs text-gray-600">{tip.message}</p>
                  </div>
                ))}
              </div>

              {/* Expense Tips */}
              <div className="p-4 border border-orange-200 bg-orange-50 rounded-xl">
                <div className="flex items-center space-x-2 mb-3">
                  <FaChartPie className="text-orange-500" />
                  <h5 className="font-semibold text-gray-900">Expense Tips</h5>
                </div>
                {insights.expenseTips.slice(0, 2).map((tip, index) => (
                  <div key={index} className="mb-2 last:mb-0">
                    <p className="text-sm font-medium text-gray-900">{tip.title}</p>
                    <p className="text-xs text-gray-600">{tip.message}</p>
                  </div>
                ))}
              </div>

              {/* Saving Tips */}
              <div className="p-4 border border-green-200 bg-green-50 rounded-xl">
                <div className="flex items-center space-x-2 mb-3">
                  <FaPiggyBank className="text-green-500" />
                  <h5 className="font-semibold text-gray-900">Saving Tips</h5>
                </div>
                {insights.savingTips.slice(0, 2).map((tip, index) => (
                  <div key={index} className="mb-2 last:mb-0">
                    <p className="text-sm font-medium text-gray-900">{tip.title}</p>
                    <p className="text-xs text-gray-600">{tip.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other tabs remain exactly the same */}
        {/* Income Tips Tab */}
        {activeTab === 'income' && (
          <div className="space-y-4">
            {insights.incomeTips.map((tip, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{tip.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(tip.priority)}`}>
                    {tip.priority} Priority
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{tip.message}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Potential Impact: {tip.potentialImpact}</span>
                  <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
                    {tip.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Expense Tips Tab */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {insights.expenseTips.map((tip, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-xl hover:border-orange-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{tip.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(tip.priority)}`}>
                    {tip.priority} Priority
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{tip.message}</p>
                {tip.currentSpending && (
                  <p className="text-sm text-orange-600 mb-2">Current: {tip.currentSpending}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Potential Impact: {tip.potentialImpact}</span>
                  <button className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors">
                    {tip.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Savings Tips Tab */}
        {activeTab === 'savings' && (
          <div className="space-y-4">
            {insights.savingTips.map((tip, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-xl hover:border-green-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{tip.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(tip.priority)}`}>
                    {tip.priority} Priority
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{tip.message}</p>
                {tip.target && (
                  <p className="text-sm text-green-600 mb-2">Target: {tip.target}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Potential Impact: {tip.potentialImpact}</span>
                  <button className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
                    {tip.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Financial Analysis */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <FaChartLine className="text-purple-500" />
                <span>Financial Health Analysis</span>
              </h4>
              <div className="space-y-3">
                {insights.analysis.map((item, index) => (
                  <div key={index} className={`p-4 rounded-xl ${getStatusColor(item.status)}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      {item.status === 'POSITIVE' || item.status === 'EXCELLENT' ? (
                        <FaCheckCircle className="text-green-500" />
                      ) : item.status === 'CRITICAL' || item.status === 'NEGATIVE' ? (
                        <FaExclamationTriangle className="text-red-500" />
                      ) : (
                        <FaInfoCircle className="text-yellow-500" />
                      )}
                      <h5 className="font-semibold">{item.aspect}</h5>
                    </div>
                    <p className="font-medium mb-1">{item.message}</p>
                    <p className="text-sm opacity-75">{item.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Projection */}
            {insights.monthlyProjection && (
              <div className="p-4 border border-purple-200 bg-purple-50 rounded-xl">
                <h5 className="font-semibold text-gray-900 mb-3">Next Month Projection</h5>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">${insights.monthlyProjection.projectedIncome?.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Projected Income</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">${insights.monthlyProjection.projectedExpenses?.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Projected Expenses</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${
                      insights.monthlyProjection.projectedSavings >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${Math.abs(insights.monthlyProjection.projectedSavings)?.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Projected Savings</p>
                  </div>
                </div>
                <p className="text-xs text-center mt-2 text-gray-500">
                  Confidence: {insights.monthlyProjection.confidence}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;