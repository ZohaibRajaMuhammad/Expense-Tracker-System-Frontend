import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ExpenseOverviewChart from '../../components/ExpenseOverviewChart';
import ExpenseItem from '../../components/ExpenseItem';
import AddExpenseModal from '../../components/AddExpenseModal';
import EditExpenseModal from '../../components/EditExpenseModal';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const API_BASE_URL = 'https://expense-tracker-backend-3lql.vercel.app/api/expenses';

const ExpensePage = () => {
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hoveredExpenseId, setHoveredExpenseId] = useState(null);

  const getSafeUserData = useCallback(() => {
    try {
      const userData = localStorage.getItem('user');
      
      if (!userData) {
        return null;
      }
      
      const trimmedData = userData.trim();
      
      if (trimmedData === 'undefined' || 
          trimmedData === 'null' || 
          trimmedData === '' || 
          trimmedData === '{}') {
        return null;
      }
      
      const parsedData = JSON.parse(userData);
      return parsedData && typeof parsedData === 'object' ? parsedData : null;
      
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      return null;
    }
  }, []);

  useEffect(() => {
    const userData = getSafeUserData();
    if (userData) {
      setUser(userData);
    }
    fetchExpenses();
  }, [getSafeUserData]);

  const getAuthHeaders = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      throw error;
    }
  }, []);

  const showSuccessMessage = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(API_BASE_URL, {
        headers: getAuthHeaders()
      });
      
      setExpenses(response.data);
      processChartData(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      const errorMessage = error.response?.status === 401 
        ? 'Authentication failed. Please login again.'
        : error.message === 'No authentication token found'
        ? 'Please login to access your expenses.'
        : 'Failed to fetch expenses. Please try again.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleExpense = async (id) => {
    try {
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching expense:', error);
      const errorMessage = error.response?.status === 401 
        ? 'Authentication failed. Please login again.'
        : error.message === 'No authentication token found'
        ? 'Please login to access expenses.'
        : 'Failed to fetch expense. Please try again.';
      
      setError(errorMessage);
      throw error;
    }
  };

  const processChartData = useCallback((expenseList) => {
    if (!expenseList || expenseList.length === 0) {
      setChartData({
        labels: [],
        datasets: [
          {
            label: 'Expense Overview',
            data: [],
            fill: true,
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            borderColor: 'rgb(139, 92, 246)',
            pointBackgroundColor: 'rgb(139, 92, 246)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(139, 92, 246)',
            tension: 0.4,
          },
        ],
      });
      return;
    }

    const sortedExpenses = [...expenseList].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    const labels = [];
    const data = [];

    sortedExpenses.forEach(expense => {
      try {
        const date = new Date(expense.date).toLocaleDateString('en-US', { 
          day: '2-digit', 
          month: 'short' 
        });
        labels.push(date);
        data.push(expense.amount);
      } catch (error) {
        console.error('Error processing expense date:', error);
      }
    });

    setChartData({
      labels: labels,
      datasets: [
        {
          label: 'Expense Overview',
          data: data,
          fill: true,
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          borderColor: 'rgb(139, 92, 246)',
          pointBackgroundColor: 'rgb(139, 92, 246)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(139, 92, 246)',
          tension: 0.4,
        },
      ],
    });
  }, []);

  const handleAddExpense = async (newExpense) => {
    try {
      setError(null);
      
      await axios.post(API_BASE_URL, newExpense, {
        headers: getAuthHeaders()
      });
      
      await fetchExpenses();
      setIsModalOpen(false);
      showSuccessMessage('Expense added successfully!');
    } catch (error) {
      console.error('Error adding expense:', error);
      const errorMessage = error.response?.status === 401 
        ? 'Authentication failed. Please login again.'
        : error.message === 'No authentication token found'
        ? 'Please login to add expenses.'
        : error.response?.data?.message || 'Failed to add expense. Please try again.';
      
      setError(errorMessage);
    }
  };

  const handleEditExpense = async (id, updatedExpense) => {
    try {
      setError(null);
      
      await axios.put(`${API_BASE_URL}/${id}`, updatedExpense, {
        headers: getAuthHeaders()
      });
      
      await fetchExpenses();  
      setIsEditModalOpen(false);
      setEditingExpense(null);
      showSuccessMessage('Expense updated successfully!');
    } catch (error) {
      console.error('Error updating expense:', error);
      const errorMessage = error.response?.status === 401 
        ? 'Authentication failed. Please login again.'
        : error.message === 'No authentication token found'
        ? 'Please login to update expenses.'
        : error.response?.data?.message || 'Failed to update expense. Please try again.';
      
      setError(errorMessage);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      setError(null);
      
      await axios.delete(`${API_BASE_URL}/${id}`, {
        headers: getAuthHeaders()
      });
      
      await fetchExpenses(); 
      showSuccessMessage('Expense deleted successfully!');
    } catch (error) {
      console.error('Error deleting expense:', error);
      const errorMessage = error.response?.status === 401 
        ? 'Authentication failed. Please login again.'
        : error.message === 'No authentication token found'
        ? 'Please login to delete expenses.'
        : error.response?.data?.message || 'Failed to delete expense. Please try again.';
      
      setError(errorMessage);
    }
  };

  const openEditModal = async (expense) => {
    try {
      setError(null);
      const freshExpenseData = await fetchSingleExpense(expense._id);
      setEditingExpense(freshExpenseData);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error('Error preparing expense for edit:', error);
      setEditingExpense(expense);
      setIsEditModalOpen(true);
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingExpense(null);
  };

  const downloadExpensesAsExcel = () => {
    if (expenses.length === 0) {
      setError('No expenses to download');
      return;
    }

    try {
      const data = expenses.map(exp => ({
        'Category': exp.category,
        'Description': exp.description || 'No description',
        'Amount': exp.amount,
        'Date': new Date(exp.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        'Created By': user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        'User Email': user ? user.email : 'Unknown'
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
      
      const colWidths = [
        { wch: 15 }, 
        { wch: 25 }, 
        { wch: 12 }, 
        { wch: 15 }, 
        { wch: 20 }, 
        { wch: 25 }  
      ];
      worksheet['!cols'] = colWidths;
      
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "8B5CF6" } }
      };
      
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = headerStyle;
      }
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const dataBlob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const fileName = user 
        ? `expenses_${user.firstName}_${new Date().toISOString().split('T')[0]}.xlsx`
        : `expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      saveAs(dataBlob, fileName);
      showSuccessMessage('Expenses downloaded successfully!');
    } catch (error) {
      console.error('Error downloading expenses:', error);
      setError('Failed to download expenses. Please try again.');
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
  
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + (expense.amount || 0);
    return acc;
  }, {});

  const topCategory = Object.keys(expensesByCategory).reduce((top, category) => {
    return expensesByCategory[category] > (expensesByCategory[top] || 0) ? category : top;
  }, '');

  const handleExpenseMouseEnter = (expenseId) => {
    setHoveredExpenseId(expenseId);
  };

  const handleExpenseMouseLeave = () => {
    setHoveredExpenseId(null);
  };

  if (loading) {
    return (
      <div className="ml-64 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <span className="ml-4 text-gray-600">Loading expenses...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-600 mt-2">Track and manage your expenses efficiently</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-green-700">{success}</p>
              </div>
              <button 
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-500 hover:text-green-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">${totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Expense</p>
                <p className="text-2xl font-bold text-gray-900">${averageExpense.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Top Category</p>
                <p className="text-2xl font-bold text-gray-900">{topCategory || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Expense Overview</h2>
                <p className="text-gray-600 mt-1">
                  Track your spending trends over time
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={downloadExpensesAsExcel}
                  disabled={expenses.length === 0}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Excel
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center text-sm transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Expense
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="h-80">
              <ExpenseOverviewChart chartData={chartData} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-800">All Expenses</h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {expenses.length} expense{expenses.length !== 1 ? 's' : ''} total
                </span>
                {expenses.length > 0 && (
                  <div className="text-sm text-gray-500">
                    Total: <span className="font-semibold text-purple-600">${totalExpenses.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {expenses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {expenses
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((expense) => (
                    <div
                      key={expense._id}
                      className="relative"
                      onMouseEnter={() => handleExpenseMouseEnter(expense._id)}
                      onMouseLeave={handleExpenseMouseLeave}
                    >
                      <ExpenseItem
                        expense={expense}
                        onDelete={handleDeleteExpense}
                        onEdit={openEditModal}
                      />
                      {hoveredExpenseId === expense._id && (
                        <button
                          onClick={() => openEditModal(expense)}
                          className="absolute top-6  right-10 p-2 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all duration-200 z-10"
                          title="Edit Expense"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-800 mb-2">No expenses recorded yet</h4>
                <p className="text-gray-600 mb-4">Start tracking your expenses by adding your first one!</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Your First Expense
                </button>
              </div>
            )}
          </div>
        </div>

        <AddExpenseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddExpense={handleAddExpense}
        />

        <EditExpenseModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onUpdateExpense={handleEditExpense}
          expense={editingExpense}
        />
      </div>
    </div>
  );
};

export default ExpensePage;