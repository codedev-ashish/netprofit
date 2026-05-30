"use client";

import React, { useEffect, useState } from "react";
import styles from "../../page.module.css";
import { db, auth } from "../../../../lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import { Building2, ArrowLeft, Plus, Play, Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Business {
  id: string;
  name: string;
  type: string;
  gstNumber: string;
  panNumber: string;
  tanNumber: string;
  pfNumber: string;
  esicNumber: string;
}

export default function BusinessDetailsPage() {
  const params = useParams();
  const businessId = params?.businessId as string;
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [platformServices, setPlatformServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Buy service inline states
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [selectedBuyServiceId, setSelectedBuyServiceId] = useState("");
  const [selectedBuyPlan, setSelectedBuyPlan] = useState("");
  const [buyingService, setBuyingService] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && businessId) {
        setUser(currentUser);
        await Promise.all([
          fetchBusinessDetails(),
          fetchSubscriptions(currentUser.uid),
          fetchPlatformServices()
        ]);
        setLoading(false);
      } else if (!currentUser) {
        router.push("/auth/login");
      }
    });
    return () => unsubscribe();
  }, [businessId]);

  useEffect(() => {
    if (!selectedBuyServiceId) return;
    const serv = platformServices.find(s => s.id === selectedBuyServiceId);
    if (serv) {
      if (serv.isCombo || (serv.slug || "").toLowerCase().includes("registration")) {
        setSelectedBuyPlan("One-time");
      } else {
        setSelectedBuyPlan(serv.period || "Annual");
      }
    }
  }, [selectedBuyServiceId, platformServices]);

  const fetchBusinessDetails = async () => {
    try {
      const docRef = doc(db, "businesses", businessId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBusiness({ id: docSnap.id, ...docSnap.data() } as Business);
      } else {
        alert("Business profile not found");
        router.push("/dashboard/businesses");
      }
    } catch (error) {
      console.error("Error fetching business details:", error);
    }
  };

  const fetchSubscriptions = async (uid: string) => {
    try {
      const q = query(collection(db, "user_subscriptions"), where("userId", "==", uid), where("businessId", "==", businessId));
      const querySnapshot = await getDocs(q);
      const subs: any[] = [];
      querySnapshot.forEach((doc) => {
        subs.push({ id: doc.id, ...doc.data() });
      });
      setSubscriptions(subs);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    }
  };

  const fetchPlatformServices = async () => {
    try {
      const q = query(collection(db, "services"));
      const querySnapshot = await getDocs(q);
      const s: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isPublished !== false) {
          s.push({ id: doc.id, ...data });
        }
      });
      setPlatformServices(s);
    } catch (error) {
      console.error("Error fetching platform services:", error);
    }
  };

  const handleBuyAndLinkService = async () => {
    if (!user || !business || !selectedBuyServiceId || !selectedBuyPlan) {
      alert("Please select a service and a plan.");
      return;
    }
    const serv = platformServices.find(s => s.id === selectedBuyServiceId);
    if (!serv) return;

    setBuyingService(true);
    try {
      const amount = selectedBuyPlan === 'Annual' ? 12000 : selectedBuyPlan === 'Quarterly' ? 6000 : selectedBuyPlan === 'Monthly' ? 2000 : serv.price || 5000;
      const mockOrderId = `order_bypass_${Date.now()}`;

      // 1. Create Order
      const orderRef = await addDoc(collection(db, "orders"), {
        userId: user.uid,
        businessId: business.id,
        businessName: business.name,
        serviceSlug: serv.slug || "unknown",
        planType: selectedBuyPlan,
        paymentStatus: "Paid",
        amount: amount,
        createdAt: serverTimestamp()
      });

      // 2. Create Service Request
      await addDoc(collection(db, "service_requests"), {
        orderId: orderRef.id,
        userId: user.uid,
        businessId: business.id,
        businessName: business.name,
        serviceName: serv.name,
        planType: selectedBuyPlan,
        status: "Pending",
        taxYear: "2024-25",
        quarter: selectedBuyPlan === 'Quarterly' ? "Q1" : "",
        month: selectedBuyPlan === 'Monthly' ? new Date().toISOString().slice(0, 7) : "",
        createdAt: serverTimestamp()
      });

      // Calculate next due date
      let nextDueDate = null;
      const p = selectedBuyPlan.toLowerCase();
      const now = new Date();
      if (p.includes('month')) {
        now.setMonth(now.getMonth() + 1);
        nextDueDate = now.toISOString();
      } else if (p.includes('year') || p.includes('annual')) {
        now.setFullYear(now.getFullYear() + 1);
        nextDueDate = now.toISOString();
      } else if (p.includes('quarter')) {
        now.setMonth(now.getMonth() + 3);
        nextDueDate = now.toISOString();
      }

      // 3. Create Subscription
      await addDoc(collection(db, "user_subscriptions"), {
        userId: user.uid,
        serviceId: serv.id,
        serviceName: serv.name,
        category: serv.category || "General",
        period: selectedBuyPlan,
        amount: amount,
        purchaseDate: serverTimestamp(),
        nextDueDate,
        status: 'active',
        orderId: orderRef.id,
        businessId: business.id,
        businessName: business.name
      });

      setSelectedBuyServiceId("");
      setSelectedBuyPlan("");
      setShowBuyForm(false);

      await fetchSubscriptions(user.uid);
      alert(`Successfully purchased and linked ${serv.name}!`);
    } catch (e) {
      console.error("Error purchasing service inline:", e);
      alert("Purchase failed.");
    } finally {
      setBuyingService(false);
    }
  };

  if (loading || !business) return <div style={{ padding: '2rem' }}>Loading Business Panel...</div>;

  return (
    <div style={{ width: '100%', margin: '0 auto', padding: '2rem' }}>
      <Link href="/dashboard/businesses" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        <ArrowLeft size={16} /> Back to Directory
      </Link>

      {/* Business Details Header */}
      <div className="cleartax-card" style={{ padding: '2rem', marginBottom: '2.5rem', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
            <Building2 size={36} color="var(--primary-color)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{business.name}</h1>
            <span style={{ fontSize: '0.9rem', backgroundColor: 'var(--primary-color)', color: 'white', padding: '0.3rem 1rem', borderRadius: '20px', fontWeight: 600 }}>{business.type}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px' }}>
          {business.gstNumber && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}><strong>GST:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--text-color)' }}>{business.gstNumber}</span></p>}
          {business.panNumber && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}><strong>PAN:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--text-color)' }}>{business.panNumber}</span></p>}
          {business.tanNumber && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}><strong>TAN:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--text-color)' }}>{business.tanNumber}</span></p>}
          {business.pfNumber && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}><strong>PF:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--text-color)' }}>{business.pfNumber}</span></p>}
          {business.esicNumber && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}><strong>ESIC:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--text-color)' }}>{business.esicNumber}</span></p>}
        </div>
      </div>

      {/* Linked Active Subscriptions list */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Active Subscriptions</h2>
        <button className="btn btn-primary" onClick={() => setShowBuyForm(!showBuyForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
          <Plus size={16} /> Buy New Service
        </button>
      </div>

      {/* Buy New Service Form */}
      {showBuyForm && (
        <div className="cleartax-card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px dashed var(--accent-color)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>Buy & Link New Service</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>Select Service</label>
              <select 
                value={selectedBuyServiceId} 
                onChange={e => setSelectedBuyServiceId(e.target.value)} 
                style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)' }}
              >
                <option value="">-- Choose Service --</option>
                {platformServices.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (₹{s.price || 0})</option>
                ))}
              </select>
            </div>

            {selectedBuyServiceId && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>Filing Plan</label>
                <div style={{ display: 'flex', gap: '1rem', padding: '0.4rem 0' }}>
                  {(() => {
                    const serv = platformServices.find(s => s.id === selectedBuyServiceId);
                    if (serv?.isCombo || (serv?.slug || "").toLowerCase().includes("registration")) {
                      return (
                        <span style={{ fontSize: '0.85rem', padding: '0.2rem 0.6rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                          One-time
                        </span>
                      );
                    }
                    return ['Monthly', 'Quarterly', 'Annual'].map(plan => (
                      <label key={plan} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="inline-plan-details" 
                          value={plan} 
                          checked={selectedBuyPlan === plan} 
                          onChange={() => setSelectedBuyPlan(plan)} 
                        />
                        {plan}
                      </label>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              type="button" 
              disabled={buyingService || !selectedBuyServiceId}
              onClick={handleBuyAndLinkService}
              className="btn btn-primary" 
              style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
            >
              {buyingService ? 'Processing...' : 'Confirm Purchase'}
            </button>
            <button 
              type="button" 
              onClick={() => { setShowBuyForm(false); setSelectedBuyServiceId(""); }}
              className="btn btn-secondary" 
              style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div className="cleartax-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '1rem' }}>No active services linked to this business yet.</p>
          <button className="btn btn-secondary" onClick={() => setShowBuyForm(true)}>Get Started</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {subscriptions.map(sub => {
            const nextDueDisplay = (sub.period?.toLowerCase() === 'one-time' || sub.period?.toLowerCase() === 'one-time (registration)') 
              ? "Not Applicable (One-Time)" 
              : (sub.nextDueDate ? new Date(sub.nextDueDate).toLocaleDateString() : "Pending");

            return (
              <div 
                key={sub.id} 
                className="cleartax-card" 
                style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.1s' }}
                onClick={() => router.push(`/dashboard/businesses/${businessId}/${sub.serviceId}`)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.005)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--text-color)', marginBottom: '0.4rem' }}>{sub.serviceName}</h3>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span><strong>Category:</strong> {sub.category}</span>
                    <span><strong>Plan:</strong> {sub.period}</span>
                    <span><strong>Purchased On:</strong> {sub.purchaseDate ? (typeof sub.purchaseDate.toDate === 'function' ? sub.purchaseDate.toDate().toLocaleDateString() : (sub.purchaseDate.seconds ? new Date(sub.purchaseDate.seconds * 1000).toLocaleDateString() : 'Just now')) : 'Just now'}</span>
                  </div>
                  <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <strong>Next Due Date:</strong> <span style={{ color: nextDueDisplay.includes("Not Applicable") ? 'var(--text-muted)' : 'var(--accent-color)' }}>{nextDueDisplay}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 'bold',
                    backgroundColor: sub.status === 'active' ? '#E1F5EE' : '#FAEEDA',
                    color: sub.status === 'active' ? '#0F6E56' : '#854F0B'
                  }}>
                    {sub.status.toUpperCase()}
                  </span>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Play size={12} fill="currentColor" /> Manage Filings
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
