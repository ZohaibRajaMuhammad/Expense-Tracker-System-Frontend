import React, { useState } from 'react';

const AddIncomeForm = ({ onClose, onAddIncome }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    icon: '💰'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // TEMPORARY: Use expense categories since backend is misconfigured
  const expenseCategories = ['Food', 'Transport', 'Entertainment', 'Healthcare', 'Shopping', 'Bills', 'Education', 'Other'];
  const incomeCategories = ['Salary', 'Freelance', 'Business', 'Investment', 'Rental', 'Gift', 'Dividend', 'Other'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleEmojiSelect = (emoji) => {
    setFormData(prev => ({
      ...prev,
      icon: emoji
    }));
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Enhanced validation
    if (!formData.title.trim()) {
      setError('Income title is required');
      setLoading(false);
      return;
    }

    const amountValue = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid amount greater than 0');
      setLoading(false);
      return;
    }

    if (!formData.category) {
      setError('Category is required');
      setLoading(false);
      return;
    }

    try {
      const incomeData = {
        title: formData.title.trim(),
        amount: amountValue,
        category: formData.category,
        description: formData.description.trim(),
        date: formData.date,
        icon: formData.icon
      };

      console.log('🔄 SENDING INCOME DATA:', incomeData);
      console.log('⚠️  WARNING: Backend is using Expense model for incomes');
      
      await onAddIncome(incomeData);
      onClose();
    } catch (err) {
      console.error('❌ Error in form submission:', err);
      
      if (err.message?.includes('Expense validation failed')) {
        setError(`🚨 BACKEND MISCONFIGURATION DETECTED

Your income is being processed as an expense!

Problem: 
• The /api/incomes endpoint is using the Expense model
• Expense categories are: ${expenseCategories.join(', ')}

Temporary Solution:
• Use expense categories instead of income categories
• "Dividend" → Use "Other" or "Investment"

Permanent Fix Needed:
• Backend developer must fix the route to use Income model
• Income routes should use income categories`);
      } else {
        setError(`Error: ${err.message || 'Failed to add income'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const commonEmojis = ['💰', '💵', '💳', '🏦', '💼', '👔', '💻', '📈', '🎁', '✨'];

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Add New Income</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>

      {/* Backend Warning */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-700 text-sm">
          ⚠️ <strong>Backend Issue:</strong> Currently using expense categories due to backend misconfiguration.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm whitespace-pre-line">{error}</p>
          </div>
        )}

        {/* Rest of your form remains the same */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Icon
          </label>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-12 h-12 text-2xl flex items-center justify-center border-2 border-gray-300 rounded-lg hover:border-indigo-500 transition-colors"
            >
              {formData.icon}
            </button>
            <span className="text-sm text-gray-500">Click to change icon</span>
          </div>

          {showEmojiPicker && (
            <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                {commonEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="w-8 h-8 text-lg flex items-center justify-center hover:bg-white rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Income Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Monthly Salary, Freelance Project"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            required
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              required
            />
          </div>
        </div>

        {/* UPDATED: Use expense categories temporarily */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            required
          >
            <option value="">Select a category</option>
            {expenseCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <p className="text-xs text-yellow-600 mt-1">
            ⚠️ Temporary: Using expense categories until backend is fixed
          </p>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Optional description"
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-colors"
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Adding...
              </div>
            ) : (
              'Add Income'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddIncomeForm;