import React, { useState, useEffect } from 'react';
import IncomeChart from '../../components/IncomeChart';
import IncomeSourceItem from '../../components/IncomeSourceItem';
import AddIncomeForm from '../../components/AddIncomeForm';
import EditIncomeForm from '../../components/EditIncomeForm';
import Modal from '../../components/Modal';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

const IncomePage = () => {
  const [incomes, setIncomes] = useState([]);
  const [filteredIncomes, setFilteredIncomes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // New state for filters
  const [monthFilter, setMonthFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);

  const getUserData = () => {
    try {
      const userData = localStorage.getItem('user');
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
      
      if (parsed && typeof parsed === 'object' && (parsed.firstName || parsed.email || parsed.id)) {
        return parsed;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      return null;
    }
  };

  useEffect(() => {
    const userData = getUserData();
    if (userData) {
      setUser(userData);
      fetchIncomes();
    } else {
      setLoading(false);
      setError('Please log in to access this page');
      navigate('/login');
    }
  }, [navigate]);

  // Extract unique categories when incomes change
  useEffect(() => {
    const categories = [...new Set(incomes
      .map(income => income.category)
      .filter(category => category && category.trim() !== '')
    )].sort();
    setAvailableCategories(categories);
  }, [incomes]);

  // Filter incomes based on search term, month, and category
  useEffect(() => {
    let filtered = incomes;

    // Apply search term filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(income =>
        income.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        income.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        income.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        income.amount?.toString().includes(searchTerm)
      );
    }

    // Apply month filter
    if (monthFilter) {
      filtered = filtered.filter(income => {
        const incomeDate = new Date(income.date);
        const incomeMonth = `${incomeDate.getFullYear()}-${String(incomeDate.getMonth() + 1).padStart(2, '0')}`;
        return incomeMonth === monthFilter;
      });
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(income => income.category === categoryFilter);
    }

    setFilteredIncomes(filtered);
  }, [incomes, searchTerm, monthFilter, categoryFilter]);
  
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
      const response = await fetch('http://localhost:5000/api/incomes', {
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
      
      let incomeData = [];
      if (Array.isArray(data)) {
        incomeData = data;
      } else if (data.incomes && Array.isArray(data.incomes)) {
        incomeData = data.incomes;
      }
      
      const filteredIncomes = incomeData.filter(income => 
        income && 
        typeof income === 'object' && 
        !income.isAutoGenerated && 
        !income.isDemo
      );
      
      setIncomes(filteredIncomes);
      
    } catch (error) {
      console.error('Error fetching incomes:', error);
      setError('Failed to load income data. Please try again.');
      setIncomes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomeById = async (id) => {
    const headers = getAuthHeaders();
    if (!headers) return null;

    try {
      const response = await fetch(`http://localhost:5000/api/incomes/${id}`, {
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
      const response = await fetch('http://localhost:5000/api/incomes', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(newIncome),
      });
      
      if (response.ok) {
        const addedIncome = await response.json();
        setIncomes(prev => [...prev, addedIncome]);
        setIsModalOpen(false);
        setError(null);
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
    }
  };

  const updateIncome = async (id, updatedIncome) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch(`http://localhost:5000/api/incomes/${id}`, {
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
        setError(null);
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
    }
  };

  const deleteIncome = async (id) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    if (!window.confirm('Are you sure you want to delete this income source?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/incomes/${id}`, {
        method: 'DELETE',
        headers: headers,
      });
      
      if (response.ok) {
        setIncomes(prev => prev.filter(income => income._id !== id));
        setError(null);
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
    }
  };

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

  const handleUpdateIncome = async (updatedIncome) => {
    if (!editingIncome) return;
    await updateIncome(editingIncome._id, updatedIncome);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingIncome(null);
  };
  
  const downloadIncomesAsExcel = () => {
    const dataToDownload = filteredIncomes;
    
    if (dataToDownload.length === 0) {
      setError('No income data available to download');
      return;
    }

    try {
      const ws = XLSX.utils.json_to_sheet(dataToDownload.map(income => ({
        Source: income.source,
        Amount: income.amount,
        Date: new Date(income.date).toLocaleDateString(),
        Category: income.category || 'Uncategorized',
        Description: income.description || '',
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Incomes");
      
      const userName = user?.firstName || 'user';
      const fileName = searchTerm ? 
        `income_data_${searchTerm}_${userName}.xlsx` : 
        `income_data_${userName}.xlsx`;
      
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      setError('Failed to download income data');
    }
  };

  // Generate available months from incomes
  const getAvailableMonths = () => {
    const monthsSet = new Set();
    incomes.forEach(income => {
      const date = new Date(income.date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthsSet.add(month);
    });
    return Array.from(monthsSet).sort().reverse();
  };

  const availableMonths = getAvailableMonths();

  const totalIncome = incomes.reduce((sum, income) => sum + (income.amount || 0), 0);
  const filteredTotalIncome = filteredIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);

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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const clearMonthFilter = () => {
    setMonthFilter('');
  };

  const clearCategoryFilter = () => {
    setCategoryFilter('');
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setMonthFilter('');
    setCategoryFilter('');
  };

  const hasActiveFilters = searchTerm || monthFilter || categoryFilter;

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
              disabled={filteredIncomes.length === 0}
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

      {/* Filters Section */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by source, category, description, or amount..."
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Month and Category Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Month Filter */}
          <div className="flex items-center space-x-2">
            <label htmlFor="monthFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Filter by Month:
            </label>
            <div className="relative">
              <select
                id="monthFilter"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Months</option>
                {availableMonths.map(month => {
                  const [year, monthNum] = month.split('-');
                  const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  });
                  return (
                    <option key={month} value={month}>
                      {monthName}
                    </option>
                  );
                })}
              </select>
              {monthFilter && (
                <button
                  onClick={clearMonthFilter}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <label htmlFor="categoryFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Filter by Category:
            </label>
            <div className="relative">
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {categoryFilter && (
                <button
                  onClick={clearCategoryFilter}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Clear All Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-150"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* Filter Summary */}
        {hasActiveFilters && (
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>
              Showing {filteredIncomes.length} of {incomes.length} income sources
            </span>
            {filteredIncomes.length > 0 && (
              <span>• Filtered total: ${filteredTotalIncome.toLocaleString()}</span>
            )}
            {monthFilter && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                Month: {new Date(monthFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            )}
            {categoryFilter && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                Category: {categoryFilter}
              </span>
            )}
            {searchTerm && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                Search: "{searchTerm}"
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income Chart */}
        <div className="lg:col-span-1 p-6 bg-white rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Income Overview</h3>
          {(incomes.length > 0 && filteredIncomes.length > 0) ? (
            <IncomeChart 
              data={filteredIncomes.map(inc => ({ 
                date: new Date(inc.date).toLocaleDateString(), 
                amount: inc.amount,
                source: inc.source 
              }))} 
            />
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-gray-500">
                {hasActiveFilters ? 'No matching income sources found' : 'No data available for chart'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Add income sources to see visualization'}
              </p>
            </div>
          )}
        </div>
        
        {/* Income Sources List */}
        <div className="lg:col-span-1 p-6 bg-white rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Income Sources</h3>
            <span className="text-sm text-gray-500">
              {filteredIncomes.length} source{filteredIncomes.length !== 1 ? 's' : ''}
              {hasActiveFilters && ` (of ${incomes.length})`}
            </span>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredIncomes.length > 0 ? (
              filteredIncomes.map(income => (
                <IncomeSourceItem 
                  key={income._id} 
                  income={income} 
                  onDelete={deleteIncome}
                  onEdit={handleEditIncome} 
                />
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-gray-500 mb-2">
                  {hasActiveFilters ? 'No income sources found' : 'No income sources yet'}
                </p>
                <p className="text-sm text-gray-400">
                  {hasActiveFilters ? 'Try adjusting your filters' : 'Add your first income source to get started'}
                </p>
                {!hasActiveFilters && (
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    + Add Income Source
                  </button>
                )}
                {hasActiveFilters && (
                  <button 
                    onClick={clearAllFilters}
                    className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      {incomes.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">
              {hasActiveFilters ? 'Filtered Sources' : 'Total Sources'}
            </p>
            <p className="text-2xl font-bold text-gray-800">
              {hasActiveFilters ? filteredIncomes.length : incomes.length}
              {hasActiveFilters && <span className="text-sm font-normal text-gray-500 ml-1">/ {incomes.length}</span>}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">
              {hasActiveFilters ? 'Filtered Total' : 'Total Income'}
            </p>
            <p className="text-2xl font-bold text-gray-800">
              ${(hasActiveFilters ? filteredTotalIncome : totalIncome).toLocaleString()}
              {hasActiveFilters && totalIncome !== filteredTotalIncome && (
                <span className="text-sm font-normal text-gray-500 ml-1">
                  of ${totalIncome.toLocaleString()}
                </span>
              )}
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
        <EditIncomeForm 
          income={editingIncome}
          onClose={handleCloseEditModal}
          onUpdateIncome={handleUpdateIncome}
        />
      )}
    </div>
  );
};

export default IncomePage;