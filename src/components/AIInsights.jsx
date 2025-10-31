import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaRobot, FaLightbulb, FaSyncAlt, FaChartLine } from 'react-icons/fa';

const AIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');

  const fetchAIInsights = async (selectedPeriod = period) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/ai/insights', 
        { period: selectedPeriod },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setInsights(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch AI insights');
      console.error('AI insights error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuickSummary = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/ai/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInsights(response.data);
    } catch (err) {
      setError('Failed to fetch quick summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuickSummary();
  }, []);

  // Loading State
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <span className="text-gray-600 font-medium">AI is analyzing your finances...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={fetchQuickSummary}
            className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-sm border border-purple-100 p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <FaRobot className="text-purple-600 text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Financial Insights</h2>
            <p className="text-sm text-gray-600">Smart analysis of your spending patterns</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <select 
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              fetchAIInsights(e.target.value);
            }}
            className="text-sm bg-white border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
          
          <button
            onClick={() => fetchAIInsights()}
            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-white rounded-lg transition-all duration-200 border border-transparent hover:border-purple-200"
            title="Refresh insights"
          >
            <FaSyncAlt />
          </button>
        </div>
      </div>

      {/* Insights Content Section */}
      {insights && (
        <div className="space-y-4">
          {/* Quick Stats Grid */}
          {insights.data && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-xl p-3 text-center border border-green-100 shadow-sm">
                <p className="text-2xl font-bold text-green-600">
                  ${insights.data.current.income?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Income</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center border border-red-100 shadow-sm">
                <p className="text-2xl font-bold text-red-600">
                  ${insights.data.current.expense?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Expenses</p>
              </div>
            </div>
          )}

          {/* AI Generated Insights */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-start space-x-3">
              <FaLightbulb className="text-yellow-500 text-lg mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-2">Smart Analysis</h3>
                <div className="text-gray-700 leading-relaxed text-sm">
                  {insights.insights || insights.summary || 'No insights available yet. Add some transactions to get personalized advice.'}
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Tips Section */}
          {insights.data && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start space-x-3">
                <FaChartLine className="text-blue-500 text-lg mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-3">Quick Stats</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Savings Rate:</span>
                      <span className={`font-semibold ${
                        insights.data.current.savings > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {insights.data.current.income > 0 
                          ? `${((insights.data.current.savings / insights.data.current.income) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Spending Trend:</span>
                      <span className={`font-semibold ${
                        insights.data.expenseChange <= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {insights.data.expenseChange >= 0 ? '+' : ''}{insights.data.expenseChange}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Top Category:</span>
                      <span className="font-semibold text-gray-900 capitalize">
                        {insights.data.topCategories[0]?.category?.toLowerCase() || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Insights State */}
      {!insights && !loading && (
        <div className="text-center py-8">
          <FaLightbulb className="text-4xl text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            No insights available. Start adding transactions to get AI-powered financial advice.
          </p>
        </div>
      )}

      
    </div>
  );
};

export default AIInsights;