"use client";

import { useEffect, useState } from "react";
import styles from "../app/auth/page.module.css";
import { db } from "../lib/firebase";
import { auth } from "../lib/firebase-auth";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AuthPage({ defaultIsLogin = true }: { defaultIsLogin?: boolean }) {
  const [isLogin, setIsLogin] = useState(defaultIsLogin);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Registration restrictions
  const [restrictEmails, setRestrictEmails] = useState(true);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);

  const router = useRouter();

  useEffect(() => {
    const fetchAuthSettings = async () => {
      try {
        const docRef = doc(db, "settings", "auth");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.restrictEmails !== undefined) setRestrictEmails(data.restrictEmails);
          if (data.allowedDomains) {
            setAllowedDomains(data.allowedDomains);
          }
        } else {
          // Defaults if not configured
          setAllowedDomains([
            "gmail.com", "zohomail.com", "zohomail.in", "outlook.com", 
            "outlook.in", "live.com", "yahoo.com", "ymail.com", 
            "rediffmail.com", "proton.me"
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch auth settings", err);
      }
    };
    fetchAuthSettings();
  }, []);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return null;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pass);
    const isLongEnough = pass.length >= 8;

    let score = 0;
    if (hasUpper) score++;
    if (hasLower) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;
    if (isLongEnough) score++;

    if (score <= 3 || !isLongEnough) return { label: "Weak", color: "#ef4444", pct: "33%" };
    if (score === 4) return { label: "Moderate", color: "#eab308", pct: "66%" };
    return { label: "Strong", color: "#22c55e", pct: "100%" };
  };


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
        // Registration validations
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }

        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^a-zA-Z0-9]/.test(password);
        
        if (password.length < 8 || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
          setError("Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.");
          setLoading(false);
          return;
        }

        // Check domain restrictions before creating user
        if (restrictEmails) {

          const emailDomain = email.split('@')[1]?.toLowerCase();
          
          if (!emailDomain || !allowedDomains.includes(emailDomain)) {
            setError(`Registration is restricted to supported email providers. Temporary or unauthorized emails are not allowed.`);
            setLoading(false);
            return;
          }
        }

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
        setConfirmPassword("");
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
        <h1>{isResetPassword ? "Reset Password" : (isLogin ? "Login" : "Create an Account")}</h1>
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
          {!isLogin && !isResetPassword && restrictEmails && allowedDomains.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', marginTop: '-0.5rem' }}>
              <strong>Allowed domains:</strong> {allowedDomains.map(d => `@${d}`).join(', ')}
            </div>
          )}
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
                minLength={!isLogin ? 8 : undefined}
              />
              {!isLogin && password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ height: '4px', width: '100%', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: getPasswordStrength(password)?.pct, 
                      backgroundColor: getPasswordStrength(password)?.color,
                      transition: 'all 0.3s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px', color: getPasswordStrength(password)?.color, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{getPasswordStrength(password)?.label}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special</span>
                  </div>
                </div>
              )}
            </div>
          )}
          {!isLogin && !isResetPassword && (
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input 
                type="password" 
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={!isLogin} 
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
