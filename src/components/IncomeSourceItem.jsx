import React from 'react';

const IncomeSourceItem = ({ income, onDelete, onEdit }) => {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this income?')) {
      onDelete(income._id);
    }
  };

  const handleEdit = () => {
    onEdit(income._id);
  };

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        {/* Content Section */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-800 text-base sm:text-lg truncate">
                {income.source}
              </h4>
              <p className="text-sm text-gray-600 mt-1">{income.category}</p>
            </div>
            
            {/* Amount - Mobile first view */}
            <div className="sm:hidden">
              <p className="text-lg font-bold text-green-600">
                ${income.amount?.toLocaleString()}
              </p>
            </div>
          </div>

          {income.description && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
              {income.description}
            </p>
          )}
          
          <p className="text-xs text-gray-400 mt-2 sm:mt-3">
            {new Date(income.date).toLocaleDateString()}
          </p>
        </div>

        {/* Actions and Amount Section */}
        <div className="flex flex-col sm:flex-col-reverse sm:items-end sm:justify-between sm:ml-4 sm:min-w-[120px]">
          {/* Amount - Desktop view */}
          <div className="hidden sm:block text-right">
            <p className="text-lg font-bold text-green-600">
              ${income.amount?.toLocaleString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between sm:justify-end sm:space-x-3 sm:mt-2">
            <button
              onClick={handleEdit}
              className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center px-2 py-1 sm:px-0 sm:py-0"
              title="Edit income"
            >
              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="hidden xs:inline">Edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center px-2 py-1 sm:px-0 sm:py-0"
              title="Delete income"
            >
              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden xs:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeSourceItem;