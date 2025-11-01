import React, { useState, useEffect } from 'react';

const EditIncomeForm = ({ income, onClose, onUpdateIncome }) => {
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    date: '',
    category: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});

  // TEMPORARY FIX: Use expense categories since backend is using expense validation
  // Replace with actual income categories once backend is fixed
  const expenseCategories = [
    'Food',
    'Transportation',
    'Entertainment',
    'Utilities',
    'Healthcare',
    'Shopping',
    'Education',
    'Travel',
    'Other'
  ];

  // Map original income categories to valid expense categories for display
  const categoryMapping = {
    'Salary': 'Other',
    'Freelance': 'Other',
    'Investment': 'Other',
    'Business': 'Other',
    'Rental': 'Other',
    'Other': 'Other'
  };

  useEffect(() => {
    if (income) {
      // Format date for input field (YYYY-MM-DD)
      const date = new Date(income.date);
      const formattedDate = date.toISOString().split('T')[0];
      
      // Map the existing category to a valid expense category
      const mappedCategory = categoryMapping[income.category] || 'Other';
      
      setFormData({
        source: income.source || '',
        amount: income.amount || '',
        date: formattedDate,
        category: mappedCategory,
        description: income.description || ''
      });
    }
  }, [income]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.source.trim()) {
      errors.source = 'Income source is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!formData.date) {
      errors.date = 'Date is required';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Mark all fields as touched
    setTouched({
      source: true,
      amount: true,
      date: true,
      category: true,
      description: true
    });

    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setError('Please fix the errors below');
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        source: formData.source.trim(),
        amount: parseFloat(formData.amount),
        date: formData.date,
        category: formData.category, // Already using valid expense category
        description: formData.description.trim()
      };

      console.log('Updating income with:', updateData);
      
      await onUpdateIncome(updateData);
      onClose(); // Close form on success
    } catch (err) {
      console.error('Update error:', err);
      // Provide more specific error message for category issues
      if (err.message.includes('category') && err.message.includes('not a valid enum value')) {
        setError('Category validation error. Please select a valid category from the list.');
      } else {
        setError(err.message || 'Failed to update income. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const errors = validateForm();
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="h-full edit-income-form-container">
      <div className="edit-income-form">
        <div className="form-header">
          <h2 className="form-title">Edit Income</h2>
          <button 
            onClick={onClose}
            className="close-button"
            type="button"
            disabled={loading}
          >
            ×
          </button>
        </div>
        
      
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="income-form" noValidate>
          <div className="form-group">
            <label htmlFor="source" className="form-label">
              Income Source *
            </label>
            <input
              id="source"
              type="text"
              name="source"
              value={formData.source}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${touched.source && errors.source ? 'error' : ''}`}
              required
              disabled={loading}
              placeholder="e.g., Salary, Freelance work, etc."
            />
            {touched.source && errors.source && (
              <span className="field-error">{errors.source}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="amount" className="form-label">
              Amount *
            </label>
            <div className="amount-input-container">
              <span className="currency-symbol">$</span>
              <input
                id="amount"
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                onBlur={handleBlur}
                step="0.01"
                min="0.01"
                className={`form-input ${touched.amount && errors.amount ? 'error' : ''}`}
                required
                disabled={loading}
                placeholder="0.00"
              />
            </div>
            {touched.amount && errors.amount && (
              <span className="field-error">{errors.amount}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="date" className="form-label">
              Date *
            </label>
            <input
              id="date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${touched.date && errors.date ? 'error' : ''}`}
              required
              disabled={loading}
            />
            {touched.date && errors.date && (
              <span className="field-error">{errors.date}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${touched.category && errors.category ? 'error' : ''}`}
              required
              disabled={loading}
            >
              <option value="">Select Category</option>
              {expenseCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {touched.category && errors.category && (
              <span className="field-error">{errors.category}</span>
            )}
            <div className="category-note">
              <small>Note: Using expense categories temporarily</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              rows="3"
              className="form-textarea"
              placeholder="Optional description or notes..."
              disabled={loading}
            />
          </div>

          <div className="form-buttons">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || hasErrors}
              className="btn btn-submit"
            >
              {loading ? (
                <span className="loading-content">
                  <span className="spinner"></span>
                  Updating...
                </span>
              ) : (
                'Update Income'
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .edit-income-form-container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: 100vh;
          padding: 1rem;
          background-color: rgba(0, 0, 0, 0.5);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          overflow-y: auto;
          backdrop-filter: blur(4px);
        }
        
        .edit-income-form {
          background-color: white;
          border-radius: 16px;
          padding: 2rem;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          margin: auto;
          position: relative;
        }
        
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .form-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0;
        }
        
        .warning-banner {
          background-color: #fffaf0;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          margin-bottom: 1.5rem;
        }
        
        .warning-banner p {
          color: #c05621;
          font-size: 0.875rem;
          margin: 0;
          font-weight: 500;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #718096;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .close-button:hover {
          background-color: #f7fafc;
          color: #2d3748;
        }
        
        .close-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .error-message {
          margin-bottom: 1.5rem;
          padding: 0.75rem 1rem;
          background-color: #fed7d7;
          border: 1px solid #feb2b2;
          border-radius: 8px;
          color: #c53030;
          font-size: 0.875rem;
        }
        
        .income-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }
        
        .form-input, .form-textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
          background-color: white;
        }
        
        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #4299e1;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }
        
        .form-input.error, .form-textarea.error {
          border-color: #e53e3e;
          box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
        }
        
        .form-input:disabled, .form-textarea:disabled {
          background-color: #f7fafc;
          color: #a0aec0;
          cursor: not-allowed;
        }
        
        .amount-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .currency-symbol {
          position: absolute;
          left: 1rem;
          color: #718096;
          font-weight: 500;
          z-index: 1;
        }
        
        .amount-input-container .form-input {
          padding-left: 2rem;
        }
        
        .form-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }
        
        .field-error {
          color: #e53e3e;
          font-size: 0.75rem;
          margin-top: 0.25rem;
          font-weight: 500;
        }
        
        .category-note {
          margin-top: 0.25rem;
        }
        
        .category-note small {
          color: #718096;
          font-style: italic;
        }
        
        .form-buttons {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }
        
        .btn {
          flex: 1;
          padding: 0.75rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
        }
        
        .btn-cancel {
          background-color: #f7fafc;
          color: #4a5568;
          border: 2px solid #e2e8f0;
        }
        
        .btn-cancel:hover:not(:disabled) {
          background-color: #edf2f7;
          border-color: #cbd5e0;
        }
        
        .btn-submit {
          background-color: #10b981;
          color: white;
          border: 2px solid #10b981;
        }
        
        .btn-submit:hover:not(:disabled) {
          background-color: #059669;
          border-color: #059669;
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .loading-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Responsive adjustments */
        @media (max-width: 640px) {
          .edit-income-form-container {
            padding: 0.5rem;
            align-items: center;
          }
          
          .edit-income-form {
            padding: 1.5rem;
            border-radius: 12px;
          }
          
          .form-title {
            font-size: 1.25rem;
          }
          
          .form-buttons {
            flex-direction: column;
          }
        }
        
        @media (max-width: 480px) {
          .edit-income-form {
            padding: 1.25rem;
          }
          
          .form-input, .form-textarea {
            padding: 0.625rem 0.875rem;
          }
        }
        
        @media (min-width: 1024px) {
          .edit-income-form {
            max-width: 520px;
          }
        }
      `}</style>
    </div>
  );
};

export default EditIncomeForm;