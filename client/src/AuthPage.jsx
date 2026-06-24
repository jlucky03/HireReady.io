import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { motion } from "framer-motion";
import { apiUrl } from "./config/api";

export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

 const syncWithBackend = async (firebaseUser) => {
  const token = await firebaseUser.getIdToken(true);

  const res = await fetch(apiUrl("/api/auth/firebase-login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Backend auth failed");

  localStorage.setItem("token", token);
  window.location.reload();
};

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
setLoading(true);

    try {
      let result;

      if (isSignup) {
        result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }

      await syncWithBackend(result.user);
 } catch (err) {
  setError(getFriendlyError(err.message));
} finally {
  setLoading(false);
}
  };

const handleGoogleLogin = async () => {
  setError("");
  setLoading(true);

  try {
    const result = await signInWithPopup(auth, googleProvider);
    await syncWithBackend(result.user);
  } catch (err) {
    setError(getFriendlyError(err.message));
  } finally {
    setLoading(false);
  }
};

const getFriendlyError = (msg) => {
  if (msg.includes("email-already-in-use")) return "This email is already registered. Please sign in instead.";
  if (msg.includes("invalid-credential")) return "Invalid email or password.";
  if (msg.includes("weak-password")) return "Password should be at least 6 characters.";
  if (msg.includes("popup-closed-by-user")) return "Google sign-in was cancelled.";
  if (msg.includes("network-request-failed")) return "Network error. Please check your connection.";
  return "Something went wrong. Please try again.";
};
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/10 border border-white/10 rounded-2xl p-8"
      >
        <h1 className="text-3xl font-bold mb-2">HireReady AI</h1>
        <p className="text-gray-400 mb-6">
          {isSignup ? "Create your account" : "Welcome back"}
        </p>

        
        {error && (
  <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
    {error}
  </div>
)}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignup && (
            <input
              className="w-full p-3 rounded-lg bg-black/30 border border-white/10"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input
            className="w-full p-3 rounded-lg bg-black/30 border border-white/10"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="w-full p-3 rounded-lg bg-black/30 border border-white/10"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

         <button
  disabled={loading}
  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 p-3 rounded-lg font-semibold"
>
  {loading ? "Please wait..." : isSignup ? "Sign Up" : "Sign In"}
</button>
        </form>

        <button
  onClick={handleGoogleLogin}
  disabled={loading}
  className="w-full mt-4 bg-white text-black disabled:opacity-50 p-3 rounded-lg font-semibold"
>
  Continue with Google
</button>

        <p className="text-center text-gray-400 mt-5">
          {isSignup ? "Already have an account?" : "New user?"}{" "}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-purple-400"
          >
            {isSignup ? "Sign in" : "Create account"}
          </button>
        </p>

      </motion.div>
    </div>
  );
}
