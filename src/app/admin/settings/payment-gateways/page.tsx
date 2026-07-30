"use client";

import { useState, useEffect } from "react";
import styles from "../../page.module.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

export default function PaymentGatewaysConfig() {
  const [activeGateway, setActiveGateway] = useState("razorpay");
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingContact, setBillingContact] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [signatureText, setSignatureText] = useState("");
  const [signatureType, setSignatureType] = useState("text");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
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
          if (data.companyName) setCompanyName(data.companyName);
          if (data.billingEmail) setBillingEmail(data.billingEmail);
          if (data.billingContact) setBillingContact(data.billingContact);
          if (data.invoiceNo) setInvoiceNo(data.invoiceNo);
          if (data.bankDetails) setBankDetails(data.bankDetails);
          if (data.signatureUrl) setSignatureUrl(data.signatureUrl);
          if (data.signatureText) setSignatureText(data.signatureText);
          if (data.signatureType) setSignatureType(data.signatureType);
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
      let finalSignatureUrl = signatureUrl;
      if (signatureFile) {
        // Convert signature image directly to Base64 to bypass all CORS/bucket issues
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(signatureFile);
        });
        finalSignatureUrl = base64 as string;
        setSignatureUrl(finalSignatureUrl);
      }

      const docRef = doc(db, "settings", "payment");
      await setDoc(docRef, {
        activeGateway,
        razorpayKeyId,
        razorpayKeySecret,
        companyName,
        billingEmail,
        billingContact,
        invoiceNo,
        bankDetails,
        signatureUrl: finalSignatureUrl,
        signatureText,
        signatureType,
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

          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', marginTop: '2rem', color: '#60a5fa' }}>Billing & Invoice Settings</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className={styles.inputGroup}>
              <label>Company Name</label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className={styles.inputField} placeholder="e.g. NetProfit" />
            </div>
            <div className={styles.inputGroup}>
              <label>Billing Email ID</label>
              <input type="email" value={billingEmail} onChange={e => setBillingEmail(e.target.value)} className={styles.inputField} placeholder="e.g. billing@example.com" />
            </div>
            <div className={styles.inputGroup}>
              <label>Contact Number</label>
              <input type="text" value={billingContact} onChange={e => setBillingContact(e.target.value)} className={styles.inputField} placeholder="e.g. +91 9876543210" />
            </div>
            <div className={styles.inputGroup}>
              <label>Next Invoice No. (or Prefix)</label>
              <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className={styles.inputField} placeholder="e.g. INV-1001" />
            </div>
          </div>
          <div className={styles.inputGroup} style={{ marginBottom: '1rem' }}>
            <label>Bank Details & QR Codes / UPI ID</label>
            <textarea value={bankDetails} onChange={e => setBankDetails(e.target.value)} className={styles.inputField} rows={4} placeholder="Bank Name: SBI&#10;A/C No: 123456789&#10;IFSC: SBIN0001&#10;UPI: netprofit@sbi"></textarea>
          </div>
          <div className={styles.inputGroup} style={{ marginBottom: '1rem' }}>
            <label>Preferred Signature Type</label>
            <select value={signatureType} onChange={e => setSignatureType(e.target.value)} className={styles.inputField}>
              <option value="text">Handwritten Text (Fallback)</option>
              <option value="image">Uploaded Image</option>
            </select>
          </div>
          <div className={styles.inputGroup} style={{ marginBottom: '1rem', display: signatureType === 'text' ? 'block' : 'none' }}>
            <label>Initial Sign Text</label>
            <input type="text" value={signatureText} onChange={e => setSignatureText(e.target.value)} className={styles.inputField} placeholder="e.g. John Doe" />
          </div>
          <div className={styles.inputGroup} style={{ marginBottom: '2rem', display: signatureType === 'image' ? 'block' : 'none' }}>
            <label>Authorized Signatory Image</label>
            {signatureUrl && <img src={signatureUrl} alt="Signature" style={{ maxHeight: '80px', marginBottom: '1rem', display: 'block' }} />}
            <input type="file" accept="image/*" onChange={e => setSignatureFile(e.target.files ? e.target.files[0] : null)} className={styles.inputField} />
          </div>
          
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
