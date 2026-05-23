"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { auth } from "../../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push("/dashboard");
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

  return (
    <div className={styles.container}>
      <div className={`cleartax-card ${styles.authCard}`}>
        <h2>{isLogin ? "Login" : "Create an Account"}</h2>
        <p>{isLogin ? "Sign in to manage your services." : "Join us to buy and manage services."}</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className={styles.inputField} 
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className={styles.inputField} 
            />
          </div>
          
          {error && <div className={styles.error}>{error}</div>}
          
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Please wait..." : (isLogin ? "Login" : "Register")}
          </button>
        </form>

        <div className={styles.toggleText}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className={styles.toggleBtn}
            type="button"
          >
            {isLogin ? "Register here" : "Login here"}
          </button>
        </div>
      </div>
    </div>
  );
}
