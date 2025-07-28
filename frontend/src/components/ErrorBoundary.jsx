import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error: error 
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null 
    });
    
    // Call the onReset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="error-boundary p-6 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">
                {this.props.fallbackTitle || 'Something went wrong'}
              </h3>
              {this.state.error && (
                <div className="mt-2 text-sm text-red-700">
                  <p className="font-semibold">{this.state.error.message || 'An unexpected error occurred'}</p>
                  {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-sm text-red-600 cursor-pointer">View error details</summary>
                      <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>
          {this.props.showResetButton !== false && (
            <div className="mt-4">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {this.props.resetButtonText || 'Try again'}
              </button>
            </div>
          )}
        </div>
      );
    }

    // Normally, just render children
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallbackTitle: PropTypes.string,
  resetButtonText: PropTypes.string,
  showResetButton: PropTypes.bool,
  onReset: PropTypes.func,
};

export default ErrorBoundary;
