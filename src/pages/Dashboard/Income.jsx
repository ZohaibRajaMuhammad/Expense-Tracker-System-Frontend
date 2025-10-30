 import React, { useState, useEffect } from 'react';
import IncomeChart from '../../components/IncomeChart';
import IncomeSourceItem from '../../components/IncomeSourceItem';
import AddIncomeForm from '../../components/AddIncomeForm';
import EditIncomeForm from '../../components/EditIncomeForm'; // We'll create this
import Modal from '../../components/Modal';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

const IncomePage = () => {
  const [incomes, setIncomes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Safe way to get user data from localStorage
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('user');
      
      // Comprehensive check for invalid values
      if (!userData) return null;
      
      const trimmedData = userData.trim();
      if (trimmedData === 'undefined' || 
          trimmedData === 'null' || 
          trimmedData === '""' || 
          trimmedData === '' || 
          trimmedData === '{}') {
        return null;
      }
      
      const parsed = JSON.parse(userData);
      
      // Check if parsed object has expected structure
      if (parsed && typeof parsed === 'object' && (parsed.firstName || parsed.email || parsed.id)) {
        return parsed;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      // Clear the invalid data to prevent future errors
      localStorage.removeItem('user');
      return null;
    }
  };

  useEffect(() => {
    const userData = getUserData();
    if (userData) {
      setUser(userData);
    }
    fetchIncomes();
  }, []);
  
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Authentication token not found. Please log in.');
      setError('Please log in to access this page');
      navigate('/login');
      return null;
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const fetchIncomes = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://expense-tracker-backend-3lql.vercel.app/api/incomes', {
        method: 'GET',
        headers: headers,
      });
      
      if (response.status === 401) {
        console.error('Unauthorized (401). Token invalid or expired.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch incomes: ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        setIncomes(data);
      } else if (data.incomes && Array.isArray(data.incomes)) {
        setIncomes(data.incomes);
      } else {
        console.error('API did not return an array for incomes:', data);
        setIncomes([]);
      }
      
    } catch (error) {
      console.error('Error fetching incomes:', error);
      setError('Failed to load income data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch single income for editing
  const fetchIncomeById = async (id) => {
    const headers = getAuthHeaders();
    if (!headers) return null;

    try {
      const response = await fetch(`https://expense-tracker-backend-3lql.vercel.app/api/incomes/${id}`, {
        method: 'GET',
        headers: headers,
      });
      
      if (response.status === 401) {
        console.error('Unauthorized (401). Token invalid or expired.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Session expired. Please log in again.');
        navigate('/login');
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch income: ${response.status}`);
      }

      const income = await response.json();
      return income;
      
    } catch (error) {
      console.error('Error fetching income:', error);
      setError('Failed to load income data. Please try again.');
      return null;
    }
  };

  const addIncome = async (newIncome) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch('https://expense-tracker-backend-3lql.vercel.app/api/incomes', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(newIncome),
      });
      
      if (response.ok) {
        const addedIncome = await response.json();
        setIncomes(prev => [...prev, addedIncome]);
        setIsModalOpen(false);
      } else if (response.status === 401) {
        console.error('Unauthorized (401) to add income.');
        setError('Session expired. Please log in again.');
        navigate('/login');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add income');
      }
    } catch (error) {
      console.error('Error adding income:', error);
      setError(error.message || 'Failed to add income. Please try again.');
      fetchIncomes();
    }
  };

  const updateIncome = async (id, updatedIncome) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch(`https://expense-tracker-backend-3lql.vercel.app/api/incomes/${id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(updatedIncome),
      });
      
      if (response.ok) {
        const updated = await response.json();
        setIncomes(prev => prev.map(income => 
          income._id === id ? updated : income
        ));
        setIsEditModalOpen(false);
        setEditingIncome(null);
      } else if (response.status === 401) {
        console.error('Unauthorized (401) to update income.');
        setError('Session expired. Please log in again.');
        navigate('/login');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update income');
      }
    } catch (error) {
      console.error('Error updating income:', error);
      setError(error.message || 'Failed to update income. Please try again.');
      fetchIncomes();
    }
  };

  const deleteIncome = async (id) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch(`https://expense-tracker-backend-3lql.vercel.app/api/incomes/${id}`, {
        method: 'DELETE',
        headers: headers,
      });
      
      if (response.ok) {
        setIncomes(prev => prev.filter(income => income._id !== id));
      } else if (response.status === 401) {
        console.error('Unauthorized (401) to delete income.');
        setError('Session expired. Please log in again.');
        navigate('/login');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete income');
      }
    } catch (error) {
      console.error('Error deleting income:', error);
      setError(error.message || 'Failed to delete income. Please try again.');
      fetchIncomes();
    }
  };

  // Handle edit button click
  const handleEditIncome = async (id) => {
    setLoading(true);
    try {
      const income = await fetchIncomeById(id);
      if (income) {
        setEditingIncome(income);
        setIsEditModalOpen(true);
      }
    } catch (error) {
      console.error('Error preparing income for edit:', error);
      setError('Failed to load income for editing');
    } finally {
      setLoading(false);
    }
  };

  // Handle update income
  const handleUpdateIncome = async (updatedIncome) => {
    if (!editingIncome) return;
    await updateIncome(editingIncome._id, updatedIncome);
  };

  // Close edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingIncome(null);
  };
  
  const downloadIncomesAsExcel = () => {
    if (incomes.length === 0) {
      setError('No income data available to download');
      return;
    }

    try {
      const ws = XLSX.utils.json_to_sheet(incomes.map(income => ({
        Source: income.source,
        Amount: income.amount,
        Date: new Date(income.date).toLocaleDateString(),
        Category: income.category || 'Uncategorized',
        Description: income.description || '',
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Incomes");
      
      // Get user name safely
      const userName = user?.firstName || 'user';
      XLSX.writeFile(wb, `income_data_${userName}.xlsx`);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      setError('Failed to download income data');
    }
  };

  const totalIncome = incomes.reduce((sum, income) => sum + (income.amount || 0), 0);

  // Get display name safely
  const getDisplayName = () => {
    if (!user) return '';
    
    if (user.firstName && user.lastName) {
      return `, ${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return `, ${user.firstName}`;
    } else if (user.email) {
      return `, ${user.email.split('@')[0]}`;
    }
    return '';
  };

  if (loading && !isEditModalOpen) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gray-50 flex items-center justify-center ml-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your income data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 ml-64">
      
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Income Management
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome back{getDisplayName()}! 
              {totalIncome > 0 && ` Total Income: $${totalIncome.toLocaleString()}`}
            </p>
          </div>
          
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button 
              onClick={downloadIncomesAsExcel}
              disabled={incomes.length === 0}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download Excel
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition duration-150"
            >
              + Add Income
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
            <p className="text-red-700 text-sm font-medium">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart Section */}
        <div className="lg:col-span-1 p-6 bg-white rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Income Overview</h3>
          <IncomeChart 
            data={incomes.map(inc => ({ 
              date: new Date(inc.date).toLocaleDateString(), 
              amount: inc.amount,
              source: inc.source 
            }))} 
          />
        </div>
        
        {/* Income Sources Section */}
        <div className="lg:col-span-1 p-6 bg-white rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Income Sources</h3>
            <span className="text-sm text-gray-500">
              {incomes.length} source{incomes.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {incomes.length > 0 ? (
              incomes.map(income => (
                <IncomeSourceItem 
                  key={income._id} 
                  income={income} 
                  onDelete={deleteIncome}
                  onEdit={handleEditIncome} // Pass edit handler
                />
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-gray-500 mb-2">No income sources yet</p>
                <p className="text-sm text-gray-400">
                  Add your first income source to get started
                </p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  + Add Income Source
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {incomes.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">Total Sources</p>
            <p className="text-2xl font-bold text-gray-800">{incomes.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">Average Income</p>
            <p className="text-2xl font-bold text-gray-800">
              ${Math.round(totalIncome / incomes.length).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-2xl font-bold text-gray-800">
              ${incomes
                .filter(inc => {
                  const incomeDate = new Date(inc.date);
                  const now = new Date();
                  return incomeDate.getMonth() === now.getMonth() && 
                         incomeDate.getFullYear() === now.getFullYear();
                })
                .reduce((sum, inc) => sum + inc.amount, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Add Income Modal */}
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <AddIncomeForm 
            onClose={() => setIsModalOpen(false)} 
            onAddIncome={addIncome} 
          />
        </Modal>
      )}

      {/* Edit Income Modal */}
      {isEditModalOpen && editingIncome && (
        // <Modal onClose={handleCloseEditModal}>
          <EditIncomeForm 
            income={editingIncome}
            onClose={handleCloseEditModal}
            onUpdateIncome={handleUpdateIncome}
          />
        // </Modal>
      )}
    </div>
  );
};

export default IncomePage;