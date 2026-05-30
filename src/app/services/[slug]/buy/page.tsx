"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "../../../../lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function BuyServicePage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [processing, setProcessing] = useState(false);
  const [service, setService] = useState<any>(null);

  useEffect(() => {
    // Auto-select plan based on service type
    const serviceName = (params?.slug as string) || "";
    if (serviceName.toLowerCase().includes("registration")) {
      setSelectedPlan("One-time");
    } else if (!selectedPlan) {
      setSelectedPlan("Annual");
    }
  }, [params]);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!params?.slug) return;
      const q = query(collection(db, "services"), where("slug", "==", params.slug as string));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setService({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
      }
    };
    fetchServiceDetails();
  }, [params]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchBusinesses(currentUser.uid);
      } else {
        router.push("/auth/login"); // Redirect to login if not logged in before buying
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const fetchBusinesses = async (uid: string) => {
    try {
      const q = query(collection(db, "businesses"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      const b: any[] = [];
      querySnapshot.forEach((doc) => {
        b.push({ id: doc.id, ...doc.data() });
      });
      setBusinesses(b);
    } catch (error) {
      console.error("Error fetching businesses:", error);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness || !selectedPlan) return alert("Please select business and plan.");
    setProcessing(true);

    try {
      const bName = businesses.find(b => b.id === selectedBusiness)?.name;

      // Calculate next due date
      let nextDueDate = null;
      const period = selectedPlan;
      if (period) {
        const p = period.toLowerCase();
        const now = new Date();
        if (p.includes('month') || p === 'monthly') {
          now.setMonth(now.getMonth() + 1);
          nextDueDate = now.toISOString();
        } else if (p.includes('year') || p === 'annual') {
          now.setFullYear(now.getFullYear() + 1);
          nextDueDate = now.toISOString();
        } else if (p.includes('quarter') || p === 'quarterly') {
          now.setMonth(now.getMonth() + 3);
          nextDueDate = now.toISOString();
        }
      }

      const sName = service?.name || `Service: ${params?.slug}`;
      const amount = selectedPlan === 'Annual' ? 12000 : 5000;
      
      // 1. Create the Order
      const orderRef = await addDoc(collection(db, "orders"), {
        userId: user.uid,
        businessId: selectedBusiness,
        businessName: bName,
        serviceSlug: params?.slug || "unknown",
        planType: selectedPlan,
        paymentStatus: "Paid", // Simulating payment success
        amount: amount,
        createdAt: serverTimestamp()
      });

      // 2. Automatically generate the first Service Request
      await addDoc(collection(db, "service_requests"), {
        orderId: orderRef.id,
        userId: user.uid,
        businessId: selectedBusiness,
        businessName: bName,
        serviceName: sName,
        planType: selectedPlan,
        status: "Pending",
        taxYear: "",
        quarter: "",
        month: "",
        createdAt: serverTimestamp()
      });

      // 3. Create the active user subscription doc linked to the business
      await addDoc(collection(db, "user_subscriptions"), {
        userId: user.uid,
        serviceId: service?.id || params?.slug || "unknown",
        serviceName: sName,
        category: service?.category || "General",
        period: selectedPlan,
        amount: amount,
        purchaseDate: serverTimestamp(),
        nextDueDate,
        status: 'active',
        orderId: orderRef.id,
        businessId: selectedBusiness,
        businessName: bName
      });

      alert("Purchase successful! Redirecting to your dashboard to upload documents...");
      router.push("/dashboard/requests");
    } catch (error) {
      console.error("Error during checkout:", error);
      alert("Checkout failed.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Checkout...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Complete Purchase</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You are buying the service: <strong style={{ color: 'var(--primary-color)' }}>{params?.slug}</strong></p>

      <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>1. Select Business</label>
          <select 
            required 
            value={selectedBusiness} 
            onChange={(e) => setSelectedBusiness(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'white' }}
          >
            <option value="">-- Choose a business --</option>
            {businesses.map(b => (
              <option key={b.id} value={b.id}>{b.name} (GSTIN: {b.gstNumber || 'N/A'})</option>
            ))}
          </select>
          {businesses.length === 0 && (
            <p style={{ color: '#e53e3e', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              You don't have any businesses added. <a href="/dashboard/businesses" style={{ textDecoration: 'underline' }}>Add one first.</a>
            </p>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>2. Choose Payment Plan</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {((params?.slug as string || "").toLowerCase().includes("registration")) ? (
              <label style={{ flex: 1, padding: '1rem', border: '2px solid var(--primary-color)', borderRadius: '8px', cursor: 'pointer', background: 'white', textAlign: 'center' }}>
                <input type="radio" name="plan" value="One-time" checked={true} readOnly style={{ display: 'none' }} />
                <strong>One-time (Registration)</strong>
              </label>
            ) : (
              ['Monthly', 'Quarterly', 'Annual'].map(plan => (
                <label key={plan} style={{ flex: 1, padding: '1rem', border: selectedPlan === plan ? '2px solid var(--primary-color)' : '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'white', textAlign: 'center' }}>
                  <input type="radio" name="plan" value={plan} checked={selectedPlan === plan} onChange={() => setSelectedPlan(plan)} style={{ display: 'none' }} />
                  <strong>{plan}</strong>
                </label>
              ))
            )}
          </div>
        </div>

        <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Subtotal</span>
            <strong>₹{selectedPlan === 'Annual' ? '12,000' : '5,000'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-muted)' }}>
            <span>Taxes (18% GST)</span>
            <span>₹{selectedPlan === 'Annual' ? '2,160' : '900'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <span>Total</span>
            <span>₹{selectedPlan === 'Annual' ? '14,160' : '5,900'}</span>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={processing || businesses.length === 0} 
          className="btn btn-primary" 
          style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}
        >
          {processing ? 'Processing Payment...' : 'Pay Securely'}
        </button>
      </form>
    </div>
  );
}
