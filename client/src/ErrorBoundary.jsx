import React from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "Unexpected UI error occurred.",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught error:", error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    localStorage.removeItem("intervyo_active_id");
    localStorage.removeItem("intervyo_current_step");
    localStorage.removeItem("intervyo_current_question");
    localStorage.removeItem("intervyo_active_topic");
    localStorage.removeItem("intervyo_active_difficulty");

    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-3xl border border-red-500/20 bg-[#151D30]/90 p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
              <AlertTriangle size={34} />
            </div>

            <h1 className="mt-6 text-2xl font-black">
              Something went wrong
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              The app UI crashed unexpectedly. Your account data is safe. You can
              refresh the page or return to the dashboard.
            </p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-[#0B0F19] p-4 text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Error Details
              </p>
              <p className="mt-2 break-words text-xs text-red-300">
                {this.state.errorMessage}
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={this.handleRefresh}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-purple-900/40 transition-all hover:from-purple-500 hover:to-indigo-500"
              >
                <RefreshCcw size={15} />
                Refresh App
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-300 transition-all hover:bg-white/10 hover:text-white"
              >
                <Home size={15} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}