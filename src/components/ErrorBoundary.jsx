import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MoodBeats Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-3xl mb-4 shadow-xl shadow-pink-500/20">
            🎵
          </div>
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-400 text-sm max-w-md mb-6">
            An unexpected error occurred. Click below to reload and continue listening.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform cursor-pointer"
          >
            Reload Player
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
