"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { auth } from "../../../../lib/firebase-auth";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
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
  const [taxYear, setTaxYear] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");

  const taxYearSlugs = [
    "accounting-bookkeeping",
    "income-tax-return",
    "llp-annual-return",
    "opc-annual-filing",
    "roc-annual-compliance",
    "gst-lut-filing"
  ];
  const isTaxYearService = taxYearSlugs.includes(params?.slug as string);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    if (!startMonth || !startYear || !selectedPlan) {
      setEndMonth("");
      setEndYear("");
      return;
    }
    const startIndex = months.indexOf(startMonth);
    if (startIndex !== -1) {
      const addMonths = selectedPlan === 'Half Yearly' ? 5 : 11;
      const totalMonths = startIndex + addMonths;
      const endIndex = totalMonths % 12;
      const addYears = Math.floor(totalMonths / 12);
      
      setEndMonth(months[endIndex]);
      setEndYear((parseInt(startYear) + addYears).toString());
    }
  }, [startMonth, startYear, selectedPlan]);

  useEffect(() => {
    if (service) {
      if (!service.isRecurring) {
        setSelectedPlan("One-time");
      } else {
        if (!selectedPlan || selectedPlan === "One-time") {
          setSelectedPlan("Annual");
        }
      }
    }
  }, [service, selectedPlan]);

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
    if (service?.isRecurring) {
      if (isTaxYearService && !taxYear) {
        return alert("Please select a Tax Year.");
      } else if (!isTaxYearService && (!startMonth || !startYear || !endMonth || !endYear)) {
        return alert("Please select a Start Month and Start Year.");
      }
    }
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
        } else if (p.includes('half') || p === 'half yearly') {
          now.setMonth(now.getMonth() + 6);
          nextDueDate = now.toISOString();
        }
      }

      const sName = service?.name || `Service: ${params?.slug as string}`;
      let basePrice = 0;
      let dType = 'none';
      let dValue = 0;
      
      if (!service?.isRecurring) {
        basePrice = service?.oneTimePrice || 0;
        dType = service?.oneTimeDiscountType || 'none';
        dValue = service?.oneTimeDiscountValue || 0;
      } else if (selectedPlan === 'Half Yearly') {
        basePrice = service?.halfYearlyPrice || 0;
        dType = service?.halfYearlyDiscountType || 'none';
        dValue = service?.halfYearlyDiscountValue || 0;
      } else {
        basePrice = service?.annualPrice || 0;
        dType = service?.annualDiscountType || 'none';
        dValue = service?.annualDiscountValue || 0;
      }

      let finalPrice = basePrice;
      if (dType === 'percentage' && dValue) {
        finalPrice = Math.round(basePrice - (basePrice * (dValue / 100)));
      } else if (dType === 'amount' && dValue) {
        finalPrice = Math.max(0, Math.round(basePrice - dValue));
      }
      const amount = finalPrice;
      
      let finalInvoiceNo = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      try {
        const { updateDoc } = await import("firebase/firestore");
        const settingsRef = doc(db, "settings", "payment");
        const setSnap = await getDoc(settingsRef);
        if (setSnap.exists()) {
          const sData = setSnap.data();
          if (sData.invoiceNo) {
            const match = sData.invoiceNo.match(/^(.*?)(\d+)$/);
            if (match) {
              const prefix = match[1];
              const num = parseInt(match[2], 10);
              finalInvoiceNo = `${prefix}${num}`;
              await updateDoc(settingsRef, { invoiceNo: `${prefix}${num + 1}` });
            } else {
              finalInvoiceNo = sData.invoiceNo + "-" + Math.floor(Math.random() * 1000);
            }
          }
        }
      } catch (e) {
        console.error("Error reading payment settings for invoice no", e);
      }
      const invoiceNumber = finalInvoiceNo;
      
      const now = new Date();
      let endDate = null;
      if (selectedPlan === 'Half Yearly') {
        const d = new Date(now);
        d.setMonth(d.getMonth() + 6);
        endDate = d.toISOString();
      } else if (selectedPlan === 'Annual') {
        const d = new Date(now);
        d.setFullYear(d.getFullYear() + 1);
        endDate = d.toISOString();
      }
      
      // Fetch fresh user data just in case
      let userDetails = { name: user.displayName || 'Client', email: user.email || '', phone: user.phoneNumber || '' };
      let userCity = '';
      let userState = '';
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const ud = userDoc.data();
          userDetails.name = ud.name || userDetails.name;
          userCity = ud.city || '';
          userState = ud.state || '';
        }
      } catch (e) { console.error("Error fetching user profile", e); }

      const selectedBusinessData = businesses.find(b => b.id === selectedBusiness);
      const businessGst = selectedBusinessData?.gstNumber || selectedBusinessData?.gstin || selectedBusinessData?.gst || '';
      
      // 1. Create the Order
      const orderRef = await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userEmail: userDetails.email,
        userName: userDetails.name,
        businessId: selectedBusiness,
        businessName: bName,
        serviceSlug: params?.slug || "unknown",
        serviceName: sName,
        planType: selectedPlan,
        paymentStatus: "Paid", // Simulating payment success
        invoiceNumber: invoiceNumber,
        basePrice: basePrice,
        discountType: dType,
        discountValue: dValue,
        discountAmount: basePrice - finalPrice,
        amount: amount,
        startDate: now.toISOString(),
        endDate: endDate,
        taxYear: isTaxYearService ? taxYear : "",
        startMonth: !isTaxYearService && service?.isRecurring ? startMonth : "",
        startYear: !isTaxYearService && service?.isRecurring ? startYear : "",
        endMonth: !isTaxYearService && service?.isRecurring ? endMonth : "",
        endYear: !isTaxYearService && service?.isRecurring ? endYear : "",
        userCity,
        userState,
        businessGst,
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
        taxYear: isTaxYearService ? taxYear : "",
        quarter: "",
        month: "",
        startMonth: !isTaxYearService && service?.isRecurring ? startMonth : "",
        startYear: !isTaxYearService && service?.isRecurring ? startYear : "",
        endMonth: !isTaxYearService && service?.isRecurring ? endMonth : "",
        endYear: !isTaxYearService && service?.isRecurring ? endYear : "",
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
        businessName: bName,
        taxYear: isTaxYearService ? taxYear : "",
        startMonth: !isTaxYearService && service?.isRecurring ? startMonth : "",
        startYear: !isTaxYearService && service?.isRecurring ? startYear : "",
        endMonth: !isTaxYearService && service?.isRecurring ? endMonth : "",
        endYear: !isTaxYearService && service?.isRecurring ? endYear : ""
      });

      alert("Purchase successful! Redirecting to your billing dashboard...");
      router.push("/dashboard/billing");
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
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You are buying the service: <strong style={{ color: 'var(--accent-color)' }}>{service?.name || params?.slug}</strong></p>

      <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>1. Select Business</label>
          <select 
            required 
            value={selectedBusiness} 
            onChange={(e) => setSelectedBusiness(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
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
            {!service?.isRecurring ? (
              <label style={{ flex: 1, padding: '1rem', border: '2px solid var(--primary-color)', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', textAlign: 'center' }}>
                <input type="radio" name="plan" value="One-time" checked={true} readOnly style={{ display: 'none' }} />
                <strong>One-time</strong>
              </label>
            ) : (
              (service?.annualOnly ? ['Annual'] : ['Half Yearly', 'Annual']).map(plan => (
                <label key={plan} style={{ position: 'relative', flex: 1, padding: '1rem', border: selectedPlan === plan ? '2px solid var(--primary-color)' : '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', textAlign: 'center' }}>
                  <input type="radio" name="plan" value={plan} checked={selectedPlan === plan} onChange={() => setSelectedPlan(plan)} style={{ display: 'none' }} />
                  <strong>{plan}</strong>
                  {plan === 'Annual' && (
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#f59e0b', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px' }}>
                      Best Value
                    </div>
                  )}
                </label>
              ))
            )}
          </div>
        </div>

        {service?.isRecurring && isTaxYearService && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select Tax Year</label>
            <select 
              required 
              value={taxYear} 
              onChange={(e) => setTaxYear(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="">-- Choose Tax Year --</option>
              <option value="2026-27">2026-27</option>
            </select>
          </div>
        )}

        {service?.isRecurring && !isTaxYearService && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Start Month</label>
              <select 
                required 
                value={startMonth} 
                onChange={(e) => setStartMonth(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              >
                <option value="">-- Choose Month --</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Start Year</label>
              <select 
                required 
                value={startYear} 
                onChange={(e) => setStartYear(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              >
                <option value="">-- Choose Year --</option>
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              </select>
            </div>
            <div style={{ flex: 1.5 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>End Month & Year</label>
              <input 
                type="text" 
                readOnly 
                value={endMonth && endYear ? `${endMonth} ${endYear}` : ""} 
                placeholder="Auto-calculated"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#f8fafc', color: '#64748b' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Based on your {selectedPlan} plan
              </div>
            </div>
          </div>
        )}


        <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '1rem' }}>
          {(() => {
            let basePrice = 0;
            let dType = 'none';
            let dValue = 0;
            if (!service?.isRecurring) {
              basePrice = service?.oneTimePrice || 0;
              dType = service?.oneTimeDiscountType || 'none';
              dValue = service?.oneTimeDiscountValue || 0;
            } else if (selectedPlan === 'Half Yearly') {
              basePrice = service?.halfYearlyPrice || 0;
              dType = service?.halfYearlyDiscountType || 'none';
              dValue = service?.halfYearlyDiscountValue || 0;
            } else {
              basePrice = service?.annualPrice || 0;
              dType = service?.annualDiscountType || 'none';
              dValue = service?.annualDiscountValue || 0;
            }

            let finalPrice = basePrice;
            if (dType === 'percentage' && dValue) {
              finalPrice = Math.round(basePrice - (basePrice * (dValue / 100)));
            } else if (dType === 'amount' && dValue) {
              finalPrice = Math.max(0, Math.round(basePrice - dValue));
            }
            
            return (
              <>
                {dType !== 'none' && dValue > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#64748b' }}>
                    <span>Base Price</span>
                    <span style={{ textDecoration: 'line-through' }}>₹{basePrice.toLocaleString()}</span>
                  </div>
                )}
                {dType !== 'none' && dValue > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#16a34a', fontWeight: 'bold' }}>
                    <span>Discount ({dType === 'percentage' ? `${dValue}%` : `₹${dValue.toLocaleString()}`})</span>
                    <span>-₹{dType === 'percentage' ? Math.round(basePrice * (dValue / 100)).toLocaleString() : Math.round(dValue).toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', paddingTop: dType !== 'none' && dValue > 0 ? '1rem' : '0', borderTop: dType !== 'none' && dValue > 0 ? '1px solid var(--border-color)' : 'none' }}>
                  <span>Total Amount</span>
                  <span>₹{finalPrice.toLocaleString()}</span>
                </div>
              </>
            );
          })()}
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
