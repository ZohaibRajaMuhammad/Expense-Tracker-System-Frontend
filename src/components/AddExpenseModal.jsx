import React, { useState, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';

const AddExpenseModal = ({ isOpen, onClose, onAddExpense }) => {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🍔'); 
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const categoryOptions = [
    { value: 'Food', icon: '🍔', label: 'Food' },
    { value: 'Transport', icon: '🚗', label: 'Transport' },
    { value: 'Entertainment', icon: '🎬', label: 'Entertainment' },
    { value: 'Healthcare', icon: '🏥', label: 'Healthcare' },
    { value: 'Shopping', icon: '🛍️', label: 'Shopping' },
    { value: 'Bills', icon: '💡', label: 'Bills' },
    { value: 'Education', icon: '📚', label: 'Education' },
    { value: 'Other', icon: '❓', label: 'Other' }
  ];

  // Close modal on escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    setCategory(selectedCategory);
    
    const selectedOption = categoryOptions.find(option => option.value === selectedCategory);
    if (selectedOption) {
      setSelectedIcon(selectedOption.icon);
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setSelectedIcon(emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category || !amount || !date || !selectedIcon) {
      alert('Please fill in all fields.');
      return;
    }

    const newExpense = {
      category,
      amount: parseFloat(amount),
      date: new Date(date).toISOString(), 
      icon: selectedIcon
    };

    onAddExpense(newExpense);
    
    setCategory('');
    setAmount('');
    setDate('');
    setSelectedIcon('🍔');
  };

  return (
    <div className="fixed inset-0 bg-gray-200 backdrop-blur-md flex items-center justify-center z-50 p-4">
      {/* Backdrop click to close */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-hidden="true"
      ></div>
      
      {/* Modal container */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">Add Expense</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6">
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              id="category"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-base"
              value={category}
              onChange={handleCategoryChange}
              required
            >
              <option value="">Select a category</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div
                className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors flex-1"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <span className="text-2xl mr-3">{selectedIcon}</span>
                <span className="text-gray-600 text-sm sm:text-base">Click to change icon</span>
              </div>
              
              {category && (
                <div className="text-2xl p-2 bg-gray-100 rounded-lg self-start">
                  {categoryOptions.find(opt => opt.value === category)?.icon}
                </div>
              )}
            </div>
            
            {showEmojiPicker && (
              <div className="absolute z-10 mt-2 w-full max-w-[300px] sm:max-w-none">
                <div className="relative">
                  <EmojiPicker 
                    onEmojiClick={handleEmojiClick} 
                    theme="light" 
                    width="100%"
                    height="350px"
                  />
                </div>
              </div>
            )}
            
            {category && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Suggested icon for {category}:</p>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions
                    .filter(opt => opt.value === category)
                    .map(option => (
                      <button
                        key={option.value}
                        type="button"
                        className="text-2xl p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        onClick={() => setSelectedIcon(option.icon)}
                      >
                        {option.icon}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              id="amount"
              step="0.01"
              min="0"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-base"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              id="date"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-base"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;