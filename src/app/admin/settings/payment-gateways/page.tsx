"use client";

import { useState, useEffect } from "react";
import styles from "../../page.module.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

export default function PaymentGatewaysConfig() {
  const [activeGateway, setActiveGateway] = useState("razorpay");
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "payment");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.activeGateway) setActiveGateway(data.activeGateway);
          if (data.razorpayKeyId) setRazorpayKeyId(data.razorpayKeyId);
          if (data.razorpayKeySecret) setRazorpayKeySecret(data.razorpayKeySecret);
        }
      } catch (err) {
        console.error("Error fetching payment settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const docRef = doc(db, "settings", "payment");
      await setDoc(docRef, {
        activeGateway,
        razorpayKeyId,
        razorpayKeySecret,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setMessage("Payment gateway configuration saved successfully!");
    } catch (err: any) {
      console.error(err);
      setMessage("Error saving settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Payment Gateways</h1>
      <p className={styles.pageSubtitle}>Configure the active payment gateway and API keys for processing service purchases.</p>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
        <form className={styles.form} onSubmit={handleSave}>
          
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#60a5fa' }}>Active Gateway Selection</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div className={styles.inputGroup}>
              <label>Select Active Payment Gateway</label>
              <select 
                value={activeGateway} 
                onChange={(e) => setActiveGateway(e.target.value)} 
                className={styles.inputField} 
                required
              >
                <option value="razorpay">Razorpay</option>
                {/* Additional gateways can be added here in the future */}
              </select>
            </div>
          </div>

          {activeGateway === 'razorpay' && (
            <>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#60a5fa' }}>Razorpay Configuration</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div className={styles.inputGroup}>
                  <label>Razorpay Key ID</label>
                  <input 
                    type="text" 
                    value={razorpayKeyId} 
                    onChange={(e) => setRazorpayKeyId(e.target.value)} 
                    className={styles.inputField} 
                    placeholder="rzp_test_..."
                    required={activeGateway === 'razorpay'} 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Razorpay Key Secret</label>
                  <input 
                    type="password" 
                    value={razorpayKeySecret} 
                    onChange={(e) => setRazorpayKeySecret(e.target.value)} 
                    className={styles.inputField} 
                    required={activeGateway === 'razorpay'} 
                  />
                </div>
              </div>
            </>
          )}
          
          {message && (
            <div style={{ color: message.includes("Error") ? "#dc2626" : "#16a34a", padding: "10px 0", fontWeight: 'bold' }}>
              {message}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className={styles.submitBtn} disabled={loading} style={{ padding: '0.8rem 2rem' }}>
              {loading ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
