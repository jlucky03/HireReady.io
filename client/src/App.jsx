import React, { useState, useEffect } from 'react';
import Auth from './Auth';
import DashboardHome from './DashboardHome';
import HistoryCenter from './HistoryCenter';
import InterviewSetup from './InterviewSetup';
import InterviewRoom from './InterviewRoom';
import PerformanceDashboard from './PerformanceDashboard';
import AtsOptimizer from './AtsOptimizer';
import CorporateGap from './CorporateGap';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeInterview, setActiveInterview] = useState(null);
  
  // Supported views: 'dashboard' | 'history-list' | 'setup' | 'active' | 'report' | 'ats' | 'gap'
  const [currentView, setCurrentView] = useState('dashboard');
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const bootstrapSession = async () => {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      const savedActiveInterviewId = localStorage.getItem('activeInterviewId');

      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));

        // ---- RESUME INTERVIEW ON REFRESH ENGINE ----
        if (savedActiveInterviewId) {
          try {
            const response = await fetch(`http://localhost:5000/api/interviews/${savedActiveInterviewId}`, {
              headers: { 'Authorization': `Bearer ${savedToken}` }
            });
            const data = await response.json();
            if (response.ok && data.interview && !data.interview.isFinished) {
              setActiveInterview(data.interview);
              setCurrentView('active'); // Route straight back into the coding lab!
            } else {
              localStorage.removeItem('activeInterviewId');
            }
          } catch (err) {
            console.error("Failed to restore refreshed interview vectors:", err);
          }
        }
      }
      setAppLoading(false);
    };

    bootstrapSession();
  }, []);

  const handleAuthSuccess = () => {
    setUser(JSON.parse(localStorage.getItem('user')));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeInterviewId');
    setUser(null);
    setActiveInterview(null);
    setCurrentView('dashboard');
  };

  const handleSelectInterviewFromHistory = (interviewSession) => {
    setActiveInterview(interviewSession);
    if (interviewSession.isFinished) {
      setCurrentView('report');
    } else {
      localStorage.setItem('activeInterviewId', interviewSession._id); // Lock id cache
      setCurrentView('active');
    }
  };

  if (appLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center font-mono text-xs text-blue-400 animate-pulse">
        Synchronizing active placement session state vectors...
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100">
      
      {/* 1. Main Hub Landing Page View */}
      {currentView === 'dashboard' && (
        <DashboardHome 
          onLaunchInterviewSetup={() => setCurrentView('setup')}
          onLaunchAts={() => setCurrentView('ats')}
          onLaunchGap={() => setCurrentView('gap')}
          onOpenHistory={() => setCurrentView('history-list')}
          onLogout={handleLogout}
        />
      )}

      {/* 2. Isolated Full History Logs Index Page */}
      {currentView === 'history-list' && (
        <HistoryCenter 
          onClose={() => setCurrentView('dashboard')}
          onSelectInterview={handleSelectInterviewFromHistory}
        />
      )}

      {/* 3. Dedicated ATS Parser Matrix Workdesk */}
      {currentView === 'ats' && (
        <AtsOptimizer onBackToHome={() => setCurrentView('dashboard')} />
      )}

      {/* 4. Dedicated Corporate Alignment Gap Sheet */}
      {currentView === 'gap' && (
        <CorporateGap onBackToHome={() => setCurrentView('dashboard')} />
      )}

      {/* 5. Parameter Configuration Form Entry Screen */}
      {currentView === 'setup' && (
        <InterviewSetup 
          onStartInterview={(session) => {
            setActiveInterview(session);
            localStorage.setItem('activeInterviewId', session._id); // Register session lock
            setCurrentView('active');
          }} 
        />
      )}

      {/* 6. Live Active Monaco Code IDE Lab Screen */}
      {currentView === 'active' && (
        <InterviewRoom 
          interview={activeInterview} 
          onInterviewUpdate={(updatedSession) => {
            setActiveInterview(updatedSession);
            if (updatedSession.isFinished) {
              localStorage.removeItem('activeInterviewId'); // Clear lock on completion
              setCurrentView('report');
            }
          }} 
          onBackToHome={() => {
            localStorage.removeItem('activeInterviewId'); // Clean tracking parameter on manual exit
            setCurrentView('dashboard');
          }} 
        />
      )}

      {/* 7. Isolated Performance Review Analytics Report Card View */}
      {currentView === 'report' && (
        <PerformanceDashboard 
          interview={activeInterview} 
          onReset={() => setCurrentView('dashboard')}
        />
      )}

    </div>
  );
}