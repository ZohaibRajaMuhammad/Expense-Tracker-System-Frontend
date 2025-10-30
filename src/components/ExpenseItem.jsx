import React, { useState } from 'react';

const ExpenseItem = ({ expense, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent any parent clicks
    if (window.confirm(`Are you sure you want to delete the expense for "${expense.category}"?`)) {
      onDelete(expense._id);
    }
  };

  const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(expense.amount);

  return (
    <div
      className="relative flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm hover:bg-gray-100 transition-colors duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center">
        <span className="text-2xl mr-4">{expense.icon}</span> {/* Display the emoji */}
        <div>
          <p className="font-medium text-gray-800">{expense.category}</p>
          <p className="text-sm text-gray-500">{formattedDate}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <p className="text-green-500 font-semibold">{`-${formattedAmount}`}</p>
        {isHovered && (
          <button
            onClick={handleDeleteClick}
            className="text-red-400 hover:text-red-600 p-1 rounded-full bg-transparent hover:bg-red-100 transition-colors duration-200"
            title="Delete expense"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ExpenseItem;