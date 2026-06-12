import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useAuthStore } from "./store/authStore";

import AuthPage from "./AuthPage";
import DashboardHome from "./DashboardHome";
import InterviewRoom from "./InterviewRoom";
import EvaluationReport from "./EvaluationReport";
import CorporateGap from "./CorporateGap";

export default function App() {
  const { firebaseUser, setFirebaseUser, loading, setLoading, logoutStore } =
    useAuthStore();

  const [activeView, setActiveView] = useState(() => {
    if (localStorage.getItem("intervyo_active_id")) return "voice_room";
    return "dashboard";
  });

  const [sessionTopic, setSessionTopic] = useState(
    () => localStorage.getItem("intervyo_active_topic") || ""
  );

  const [sessionDifficulty, setSessionDifficulty] = useState(
    () => localStorage.getItem("intervyo_active_difficulty") || "medium"
  );

  const [historyLogs, setHistoryLogs] = useState([]);
  const [completedReportData, setCompletedReportData] = useState(null);

useEffect(() => {

  const unsub = onAuthStateChanged(auth, async (user) => {
    setFirebaseUser(user);

if (user) {
  const token = await user.getIdToken();

  await fetch("http://localhost:5000/api/auth/firebase-login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ token }),
  });

  localStorage.setItem("token", token);
} else {
  localStorage.removeItem("token");
}

    setLoading(false);
  });

  return () => unsub();
}, []);

  useEffect(() => {
    if (firebaseUser) fetchHistory();
  }, [activeView, firebaseUser]);

  useEffect(() => {
    if (activeView === "voice_room") {
      localStorage.setItem("intervyo_active_topic", sessionTopic);
      localStorage.setItem("intervyo_active_difficulty", sessionDifficulty);
    }
  }, [activeView, sessionTopic, sessionDifficulty]);

  const fetchHistory = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const response = await fetch("http://localhost:5000/api/interviews/history", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok && Array.isArray(data)) setHistoryLogs(data);
    } catch (err) {
      console.error("Failed to sync history:", err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    logoutStore();
    localStorage.clear();
    setActiveView("dashboard");
  };

  const startInterviewHandler = (topic, difficulty) => {
    setSessionTopic(topic);
    setSessionDifficulty(difficulty);
    setActiveView("voice_room");
  };

  const handleDisplayEvaluationReport = (interviewData) => {
    setCompletedReportData(interviewData);
    setActiveView("evaluation");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        Loading HireReady AI...
      </div>
    );
  }

  if (!firebaseUser) return <AuthPage />;

  return (
    <div className="bg-[#0B0F19] min-h-screen text-gray-100 selection:bg-purple-500/30">
      <button
        onClick={handleLogout}
        className="fixed top-4 right-4 z-50 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg"
      >
        Logout
      </button>

      {activeView === "dashboard" && (
        <DashboardHome
          onStartInterview={startInterviewHandler}
          onStartDsaPractice={(topic, diff) => {
            setSessionTopic(topic);
            setSessionDifficulty(diff);
            setActiveView("corporate_gap");
          }}
          onViewReport={handleDisplayEvaluationReport}
          history={historyLogs}
        />
      )}

      {activeView === "voice_room" && (
        <InterviewRoom
          topic={sessionTopic}
          difficulty={sessionDifficulty}
          onExit={() => setActiveView("dashboard")}
          onFinished={handleDisplayEvaluationReport}
        />
      )}

      {activeView === "evaluation" && (
        <EvaluationReport
          report={completedReportData}
          onClose={() => setActiveView("dashboard")}
        />
      )}

      {activeView === "corporate_gap" && (
        <CorporateGap
          topic={sessionTopic}
          difficulty={sessionDifficulty}
          onBackToHome={() => setActiveView("dashboard")}
        />
      )}
    </div>
  );
}