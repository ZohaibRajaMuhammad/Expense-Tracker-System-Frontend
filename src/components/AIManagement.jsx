import React, { useState } from 'react';
import axios from 'axios';
import { 
  FaRobot, 
  FaPaperPlane, 
  FaPlus, 
  FaChartLine, 
  FaPiggyBank, 
  FaLightbulb 
} from 'react-icons/fa';

const AIManagement = () => {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setLoading(true);
    
    // Add user message to conversation
    setConversation(prev => [...prev, { 
      type: 'user', 
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/ai/manage', 
        { message: userMessage },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      // Add AI response to conversation
      setConversation(prev => [...prev, { 
        type: 'ai', 
        content: response.data.message,
        data: response.data,
        timestamp: new Date().toISOString()
      }]);
      
      setShowQuickActions(false);
    } catch (error) {
      console.error('AI Management error:', error);
      setConversation(prev => [...prev, { 
        type: 'ai', 
        content: 'Sorry, I encountered an error. Please try again.',
        isError: true,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (presetMessage) => {
    if (!presetMessage) return;
    
    setMessage(presetMessage);
    // Small delay to allow state update
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    {
      icon: <FaPlus className="text-green-500" />,
      label: 'Add Income',
      message: 'Add income of $500 from freelance work',
      description: 'Record new income'
    },
    {
      icon: <FaPlus className="text-red-500" />,
      label: 'Add Expense',
      message: 'Add $45 expense for groceries',
      description: 'Record new expense'
    },
    {
      icon: <FaChartLine className="text-blue-500" />,
      label: 'Spending Analysis',
      message: 'Analyze my spending this month',
      description: 'Get spending insights'
    },
    {
      icon: <FaPiggyBank className="text-purple-500" />,
      label: 'Savings Advice',
      message: 'How can I save more money?',
      description: 'Get savings tips'
    }
  ];

  const quickSuggestions = [
    { text: "What's my current balance?", action: "What's my current balance?" },
    { text: "Food spending", action: "How much have I spent on food?" },
    { text: "Budget tips", action: "Give me budget suggestions" }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200  flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <FaRobot className="text-purple-600 text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Finance Assistant</h2>
            <p className="text-sm text-gray-600">Manage income, expenses & get insights</p>
          </div>
        </div>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 p-4 overflow-y-auto max-h-96">
        {conversation.length === 0 && showQuickActions && (
          <div className="text-center py-8">
            <FaLightbulb className="text-yellow-500 text-3xl mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">How can I help you today?</h3>
            <p className="text-gray-600 text-sm mb-6">
              I can help you manage transactions, analyze spending, and provide financial advice.
            </p>
            
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.message)}
                  className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left group border border-transparent hover:border-gray-200"
                  type="button"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {action.icon}
                    <span className="font-medium text-gray-900 text-sm">{action.label}</span>
                  </div>
                  <p className="text-xs text-gray-600 group-hover:text-gray-700">
                    {action.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4">
          {conversation.map((msg, index) => (
            <div
              key={`${msg.timestamp}-${index}`}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.type === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : msg.isError
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                
                {/* Additional data from AI response */}
                {msg.data && msg.data.suggestions && msg.data.suggestions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 border-opacity-50">
                    {msg.data.suggestions.map((suggestion, idx) => (
                      <p key={idx} className="text-xs text-gray-600 mt-1 flex items-start">
                        <span className="mr-1">💡</span>
                        {suggestion}
                      </p>
                    ))}
                  </div>
                )}

                {/* Show data summary if available */}
                {msg.data && msg.data.data && (
                  <div className="mt-2 pt-2 border-t border-gray-200 border-opacity-50">
                    <p className="text-xs text-gray-600">
                      {JSON.stringify(msg.data.data, null, 2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-none px-4 py-3 max-w-[80%]">
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse rounded-full h-2 w-2 bg-gray-400"></div>
                  <div className="animate-pulse rounded-full h-2 w-2 bg-gray-400"></div>
                  <div className="animate-pulse rounded-full h-2 w-2 bg-gray-400"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to add transactions, analyze spending, or get advice..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            disabled={loading}
            aria-label="Type your message to the AI assistant"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !message.trim()}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            type="button"
            aria-label="Send message"
          >
            <FaPaperPlane className="text-sm" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        
        {/* Quick Suggestions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {quickSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(suggestion.action)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors border border-transparent hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
              type="button"
              disabled={loading}
            >
              {suggestion.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIManagement;