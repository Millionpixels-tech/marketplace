import { useState, useEffect } from "react";
import { auth } from "../utils/firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/UI/Header";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate(`/dashboard/${user.uid}`);
    }
  }, [user, navigate]);

  const handleAuth = async () => {
    setErr("");
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, pw);
      } else {
        await createUserWithEmailAndPassword(auth, email, pw);
      }
    } catch (e: any) {
      setErr(e.message || "Authentication failed");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setErr("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      setErr(e.message || "Google sign in failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#f3eff5] flex flex-col">
      {/* Minimal Header */}
      <Header />

      <main className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm px-6 py-10 bg-[#f3eff5] rounded-3xl shadow-lg flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-center mb-2 text-[#0d0a0b]">
            {isLogin ? "Sign in to your account" : "Create an account"}
          </h2>
          {err && (
            <div className="text-red-500 text-center text-sm font-medium py-1">{err}</div>
          )}
          <form
            className="flex flex-col gap-5"
            onSubmit={e => { e.preventDefault(); handleAuth(); }}
            autoComplete="off"
          >
            <input
              type="email"
              className="bg-white border border-[#45495522] focus:border-[#72b01d] focus:ring-1 focus:ring-[#72b01d] px-5 py-3 rounded-2xl font-medium transition text-[#0d0a0b] placeholder:text-[#45495588] shadow-sm"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
            <input
              type="password"
              className="bg-white border border-[#45495522] focus:border-[#72b01d] focus:ring-1 focus:ring-[#72b01d] px-5 py-3 rounded-2xl font-medium transition text-[#0d0a0b] placeholder:text-[#45495588] shadow-sm"
              placeholder="Password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              required
            />
            {isLogin && (
              <div className="text-right -mt-4 mb-2">
                <button
                  type="button"
                  className="text-sm text-[#3f7d20] hover:text-[#72b01d] font-semibold transition"
                  onClick={() => {
                    // You can show a modal or redirect to a dedicated reset page
                    window.location.href = '/reset-password';
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#72b01d] text-white rounded-2xl py-3 text-lg font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] transition disabled:opacity-50"
            >
              {isLogin ? "Sign In" : "Register"}
            </button>
            <button
              type="button"
              disabled={loading}
              className="flex items-center justify-center gap-3 bg-white border border-[#45495522] text-[#454955] rounded-2xl py-3 text-lg font-semibold shadow-sm hover:bg-[#f3eff5] transition"
              onClick={handleGoogle}
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.6 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l6.5-6.5C34.4 6.2 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 18.7-7.2 19.8-17H44.5z" /><path fill="#34A853" d="M6.3 14.7l7 5.1C15.4 17 19.4 14 24 14c3 0 5.8 1.1 7.9 3l6.5-6.5C34.4 6.2 29.5 4 24 4 16.7 4 10.1 8.7 6.3 14.7z" /><path fill="#FBBC05" d="M24 44c5.4 0 10.2-1.8 13.9-5l-6.4-5.2C29.5 35.1 26.9 36 24 36c-5.8 0-10.6-2.9-13.4-7.2l-7 5.4C10.1 39.3 16.7 44 24 44z" /><path fill="#EA4335" d="M44.5 20H24v8.5h11.7C34.6 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l6.5-6.5C34.4 6.2 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 18.7-7.2 19.8-17H44.5z" opacity=".15" /></g></svg>
              Continue with Google
            </button>
          </form>
          <div className="text-center text-sm text-[#454955]">
            {isLogin ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="font-semibold text-[#3f7d20] hover:text-[#72b01d] transition"
                  onClick={() => setIsLogin(false)}
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-semibold text-[#3f7d20] hover:text-[#72b01d] transition"
                  onClick={() => setIsLogin(true)}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
