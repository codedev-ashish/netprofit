"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { auth, db } from "../../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    
    try {
      if (isResetPassword) {
        if (!email) {
          setError("Please enter your email address.");
          setLoading(false);
          return;
        }
        await sendPasswordResetEmail(auth, email);
        setMessage("Password reset link sent! Please check your inbox.");
        setIsResetPassword(false);
        setLoading(false);
        return;
      }

      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Force refresh to get the absolute latest status from the server
        await userCredential.user.reload();
        // The most reliable way to bypass cache is to force refresh the ID token
        const tokenResult = await userCredential.user.getIdTokenResult(true);
        const isEmailVerified = tokenResult.claims.email_verified === true || userCredential.user.emailVerified;

        const userDocRef = doc(db, "users", userCredential.user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let isDbVerified = false;
        if (userDocSnap.exists()) {
          isDbVerified = userDocSnap.data().verified === true;
        }

        if (isEmailVerified && !isDbVerified) {
          await updateDoc(userDocRef, { verified: true });
          isDbVerified = true;
        }

        if (!isDbVerified) {
          setError("Please verify your email before logging in. Check your inbox for the verification link.");
          setShowResend(true);
          await signOut(auth);
          setLoading(false);
          return;
        }
        router.push("/dashboard");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name,
          email,
          city,
          state,
          verified: false,
          createdAt: new Date().toISOString()
        });

        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        setMessage("Registration successful! Please check your email for the verification link to log in.");
        setIsLogin(true);
        setPassword("");
      }
    } catch (err: any) {
      // console.error("Auth error", err);
      if (err.code === 'auth/wrong-password') {
        setError("Invalid Password");
      } else if (err.code === 'auth/user-not-found') {
        setError("Account Doesn't Exist");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Invalid Password or Account Doesn't Exist");
      } else {
        setError(err.message || "Failed to authenticate.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      setMessage("Verification email has been resent. Please check your inbox.");
      setShowResend(false);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`cleartax-card ${styles.authCard}`}>
        <h2>{isResetPassword ? "Reset Password" : (isLogin ? "Login" : "Create an Account")}</h2>
        <p>{isResetPassword ? "Enter your email to receive a password reset link." : (isLogin ? "Sign in to manage your services." : "Join us to buy and manage services.")}</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && !isResetPassword && (
            <div className={styles.inputGroup}>
              <label htmlFor="name">Name</label>
              <input 
                type="text" 
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                className={styles.inputField} 
              />
            </div>
          )}
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Id</label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className={styles.inputField} 
            />
          </div>
          {!isResetPassword && (
            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isResetPassword} 
                className={styles.inputField} 
              />
            </div>
          )}
          {!isLogin && !isResetPassword && (
            <>
              <div className={styles.inputGroup}>
                <label htmlFor="city">City</label>
                <input 
                  type="text" 
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required={!isLogin}
                  className={styles.inputField} 
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="state">State</label>
                <input 
                  type="text" 
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required={!isLogin}
                  className={styles.inputField} 
                />
              </div>
            </>
          )}
          
          {error && <div className={styles.error}>{error}</div>}
          {message && <div style={{ color: 'green', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>{message}</div>}
          
          {isLogin && !isResetPassword && (
            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
              <button 
                type="button" 
                onClick={() => { setIsResetPassword(true); setError(""); setMessage(""); }}
                style={{ background: 'none', border: 'none', color: '#0052cc', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Forgot Password?
              </button>
            </div>
          )}

          {showResend && (
            <button 
              type="button" 
              onClick={handleResendVerification} 
              className={styles.submitBtn} 
              style={{ backgroundColor: '#f0ad4e', marginBottom: '1rem' }}
              disabled={loading}
            >
              Resend Verification Email
            </button>
          )}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Please wait..." : (isResetPassword ? "Send Reset Link" : (isLogin ? "Login" : "Register"))}
          </button>
        </form>

        <div className={styles.toggleText}>
          {isResetPassword ? (
            <button 
              onClick={() => { setIsResetPassword(false); setError(""); setMessage(""); }} 
              className={styles.toggleBtn}
              type="button"
            >
              Back to Login
            </button>
          ) : (
            <>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(""); setMessage(""); }} 
                className={styles.toggleBtn}
                type="button"
              >
                {isLogin ? "Register here" : "Login here"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
