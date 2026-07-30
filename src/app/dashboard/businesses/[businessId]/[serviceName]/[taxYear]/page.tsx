"use client";

import React, { useEffect, useState } from "react";
import styles from "../../../../page.module.css";
import { db } from "../../../../../../lib/firebase";
import { auth } from "../../../../../../lib/firebase-auth";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, FileText, UploadCloud, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

interface Business {
  id: string;
  name: string;
  type: string;
}

interface Subscription {
  id: string;
  serviceId: string;
  serviceName: string;
  category: string;
  period: string;
  status: string;
  purchaseDate: any;
  orderId?: string;
  businessId?: string;
  businessName?: string;
  amount?: number;
  startMonth?: string;
  startYear?: string;
  endMonth?: string;
  endYear?: string;
}

const TimelineProgressBar = ({ status }: { status: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const steps = ['Pending', 'Accepted', 'Documents Received & Checked', 'Filing Progress', 'Filed'];
  const currentIndex = steps.indexOf(status) >= 0 ? steps.indexOf(status) : 0;
  
  if (currentIndex === 0) return null; // Don't show timeline until Accepted

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      style={{ 
        display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', marginBottom: '1.5rem', 
        background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)',
        cursor: 'pointer', transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>FILING PROGRESS</div>
          {!isExpanded && (
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-color)', background: 'rgba(249, 115, 22, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
              {steps[currentIndex]}
            </div>
          )}
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
          {isExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          )}
        </div>
      </div>

      {isExpanded && steps.map((step, index) => {
        if (index === 0) return null; // Skip Pending
        
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: isCompleted ? 1 : 0.4, position: 'relative' }}>
            {/* Vertical Line Connector */}
            {index < steps.length - 1 && (
              <div style={{ position: 'absolute', left: '7px', top: '16px', bottom: '-16px', width: '2px', backgroundColor: isCompleted && index < currentIndex ? 'var(--accent-color)' : 'var(--border-color)' }} />
            )}
            
            <div style={{ 
              width: '16px', height: '16px', borderRadius: '50%', 
              backgroundColor: isCompleted ? 'var(--accent-color)' : 'var(--bg-secondary)',
              border: `2px solid ${isCompleted ? 'var(--accent-color)' : 'var(--border-color)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
            }}>
              {isCompleted && <div style={{ width: '6px', height: '6px', backgroundColor: 'white', borderRadius: '50%' }} />}
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: isCurrent ? 'bold' : 'normal', color: isCurrent ? 'var(--accent-color)' : 'var(--text-color)' }}>
              {step}
            </span>
          </div>
        )
      })}
    </div>
  );
};

export default function FilingDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const serviceName = params?.serviceName as string; // This is the serviceId/slug (e.g. gst-filing)
  const taxYear = params?.taxYear as string; // Current selected tax year in URL (e.g. 2024-25)

  const [business, setBusiness] = useState<Business | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [adminDocs, setAdminDocs] = useState<any[]>([]);
  const [userDocs, setUserDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [startingFilingFor, setStartingFilingFor] = useState<string | null>(null);
  const [showDocsFor, setShowDocsFor] = useState<string | null>(null);
  const [showAdminDocsFor, setShowAdminDocsFor] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && businessId && serviceName) {
        setUser(currentUser);
        await Promise.all([
          fetchBusinessDetails(),
          fetchSubscriptionDetails(currentUser.uid),
          fetchServiceRequests(currentUser.uid),
          fetchAdminDocuments(currentUser.uid),
          fetchUserDocuments(currentUser.uid)
        ]);
        setLoading(false);
      } else if (!currentUser) {
        router.push("/auth/login");
      }
    });
    return () => unsubscribe();
  }, [businessId, serviceName, taxYear]);

  const fetchBusinessDetails = async () => {
    try {
      const docRef = doc(db, "businesses", businessId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBusiness({ id: docSnap.id, ...docSnap.data() } as Business);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSubscriptionDetails = async (uid: string) => {
    try {
      const q = query(
        collection(db, "user_subscriptions"),
        where("userId", "==", uid),
        where("businessId", "==", businessId),
        where("serviceId", "==", serviceName)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const d = querySnapshot.docs[0];
        setSubscription({ id: d.id, ...d.data() } as Subscription);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchServiceRequests = async (uid: string) => {
    try {
      const q = query(
        collection(db, "service_requests"),
        where("userId", "==", uid),
        where("businessId", "==", businessId),
        where("taxYear", "==", taxYear)
      );
      const querySnapshot = await getDocs(q);
      const r: any[] = [];
      querySnapshot.forEach((doc) => {
        r.push({ id: doc.id, ...doc.data() });
      });
      setRequests(r);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminDocuments = async (uid: string) => {
    try {
      const q = query(
        collection(db, "users", uid, "documents"),
        where("uploadedBy", "==", "Admin")
      );
      const snapshot = await getDocs(q);
      const docs: any[] = [];
      snapshot.forEach(docSnap => {
        docs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAdminDocs(docs);
    } catch (e) {
      console.error("Error fetching admin documents:", e);
    }
  };

  const fetchUserDocuments = async (uid: string) => {
    try {
      const q = query(
        collection(db, "documents"),
        where("businessId", "==", businessId)
      );
      const snapshot = await getDocs(q);
      const docs: any[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.taxYear === taxYear && data.uploaderType === "User") {
          docs.push({ id: docSnap.id, ...data });
        }
      });
      setUserDocs(docs);
    } catch (e) {
      console.error("Error fetching user documents:", e);
    }
  };

  const handleStartFiling = async (periodLabel: string, monthVal: string, quarterVal: string, returnType: "Original" | "Revision" = "Original") => {
    if (!user || !subscription || !business) return;
    setStartingFilingFor(`${periodLabel} - ${returnType}`);

    try {
      await addDoc(collection(db, "service_requests"), {
        orderId: subscription.orderId || "",
        userId: user.uid,
        businessId: businessId,
        businessName: business.name,
        serviceName: subscription.serviceName,
        planType: subscription.period,
        status: "Pending",
        taxYear: taxYear,
        quarter: quarterVal,
        month: monthVal,
        returnType: returnType,
        createdAt: serverTimestamp()
      });

      // Refresh requests list
      await fetchServiceRequests(user.uid);
      alert(`${returnType} filing started successfully for ${periodLabel}!`);
    } catch (err) {
      console.error(err);
      alert(`Failed to start ${returnType.toLowerCase()} filing.`);
    } finally {
      setStartingFilingFor(null);
    }
  };

  const handleTaxYearChange = (newTaxYear: string) => {
    router.push(`/dashboard/businesses/${businessId}/${serviceName}/${newTaxYear}`);
  };

  if (loading || !business || !subscription) {
    return <div style={{ padding: '2rem' }}>Loading Filing Dashboard...</div>;
  }

  const period = subscription.period || "";
  const svcNameLower = serviceName.toLowerCase();
  const subNameLower = subscription.serviceName.toLowerCase();

  const isMonthly = period.toLowerCase().includes("month") || 
                    svcNameLower.includes("gst") || subNameLower.includes("gst") || 
                    svcNameLower.includes("esi") || subNameLower.includes("esi") || 
                    svcNameLower.includes("pf") || subNameLower.includes("pf") ||
                    svcNameLower.includes("accounting") || subNameLower.includes("accounting") ||
                    svcNameLower.includes("bookkeeping") || subNameLower.includes("bookkeeping") ||
                    svcNameLower.includes("payroll") || subNameLower.includes("payroll");

  const isQuarterly = !isMonthly && (period.toLowerCase().includes("quarter") || 
                      svcNameLower.includes("tds") || subNameLower.includes("tds"));

  const isAnnual = !isMonthly && !isQuarterly && 
                   (period.toLowerCase().includes("year") || period.toLowerCase().includes("annual") || 
                    svcNameLower.includes("annual") || subNameLower.includes("annual"));

  const isOneTime = !isMonthly && !isQuarterly && !isAnnual;

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Generate 12 months for Monthly subscription plan under selected taxYear YYYY-YY
  // Financial Year format: YYYY-YY (e.g. 2024-25). Starts April YYYY to March (YYYY+1)
  const getMonthlyPeriods = () => {
    const parts = taxYear.split('-');
    const startYear = parseInt(parts[0]);
    const endYear = startYear + 1; // e.g. 2025

    return [
      { label: "April", value: `${startYear}-04` },
      { label: "May", value: `${startYear}-05` },
      { label: "June", value: `${startYear}-06` },
      { label: "July", value: `${startYear}-07` },
      { label: "August", value: `${startYear}-08` },
      { label: "September", value: `${startYear}-09` },
      { label: "October", value: `${startYear}-10` },
      { label: "November", value: `${startYear}-11` },
      { label: "December", value: `${startYear}-12` },
      { label: "January", value: `${endYear}-01` },
      { label: "February", value: `${endYear}-02` },
      { label: "March", value: `${endYear}-03` },
    ];
  };

  const getQuarterlyPeriods = () => {
    return [
      { label: "Q1 (Apr - Jun)", value: "Q1" },
      { label: "Q2 (Jul - Sep)", value: "Q2" },
      { label: "Q3 (Oct - Dec)", value: "Q3" },
      { label: "Q4 (Jan - Mar)", value: "Q4" },
    ];
  };

  return (
    <div style={{ width: '100%', margin: '0 auto', padding: '2rem' }}>
      <Link href={`/dashboard/businesses/${businessId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        <ArrowLeft size={16} /> Back to Business
      </Link>

      {/* Header Panel */}
      <div className="cleartax-card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filing Dashboard</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.25rem', marginBottom: '0.5rem' }}>{subscription.serviceName}</h1>
            <p style={{ color: 'var(--text-muted)' }}>Business Profile: <strong>{subscription.businessName}</strong></p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Select Tax Year:</label>
            <select 
              value={taxYear} 
              onChange={(e) => handleTaxYearChange(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)', fontWeight: 600 }}
            >
              <option value="2026-27">2026-27</option>
              <option value="2027-28">2027-28</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filings Breakdown Grid */}
      <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Filing Status & Periods</h2>

      {isMonthly && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {getMonthlyPeriods().map((period, index, array) => {
            
            // 1. Subscription active window logic
            let isWithinSubscription = true;
            if (subscription.startMonth && subscription.startYear && subscription.endMonth && subscription.endYear) {
               const periodYear = parseInt(period.value.split('-')[0]);
               const periodMonth = parseInt(period.value.split('-')[1]);
               const periodNum = periodYear * 100 + periodMonth;

               const startNum = parseInt(subscription.startYear) * 100 + (months.indexOf(subscription.startMonth) + 1);
               const endNum = parseInt(subscription.endYear) * 100 + (months.indexOf(subscription.endMonth) + 1);

               isWithinSubscription = periodNum >= startNum && periodNum <= endNum;
            }

            const originalReq = requests.find(r => r.month === period.value && r.serviceName === subscription.serviceName && r.returnType !== 'Revision');
            const revisionReq = requests.find(r => r.month === period.value && r.serviceName === subscription.serviceName && r.returnType === 'Revision');
            const periodUserDocs = userDocs.filter(d => 
              (d.serviceId === subscription.serviceId || d.serviceName === subscription.serviceName) && 
              d.taxYear === taxYear && 
              (d.periodValue === period.value || d.periodValue === period.label || (d.periodValue || "").toLowerCase().includes(period.value.toLowerCase()))
            );
            
            const originalUploaded = originalReq?.documentsUploaded || (originalReq && originalReq.status !== 'Pending') || periodUserDocs.filter(d => d.returnType !== 'Revision').length > 0;

            // Revision charge logic
            const totalRevisionsInTaxYear = requests.filter(r => r.returnType === 'Revision' && r.serviceName === subscription.serviceName).length;
            const isRevisionFree = totalRevisionsInTaxYear === 0;
            const annualCharge = subscription.amount || 6000;
            const revisionCharge = annualCharge / 12;

            const periodAdminDocs = adminDocs.filter(d => 
              (d.serviceId === subscription.serviceId || d.serviceName === subscription.serviceName) && 
              d.taxYear === taxYear && 
              (d.periodValue === period.value || d.periodValue === period.label || (d.periodValue || "").toLowerCase().includes(period.value.toLowerCase()))
            );
            
            const periodAdminDocsOriginal = periodAdminDocs.filter(d => (!d.returnType || d.returnType === 'Original'));
            const originalDisplayStatus = originalReq ? (periodAdminDocsOriginal.length > 0 || originalReq.status === 'Filed' ? 'Completed' : originalReq.status) : null;
            const isCompleted = originalDisplayStatus === 'Completed';

            const periodAdminDocsRevision = periodAdminDocs.filter(d => d.returnType === 'Revision');
            const revisionDisplayStatus = revisionReq ? (periodAdminDocsRevision.length > 0 || revisionReq.status === 'Filed' ? 'Completed' : revisionReq.status) : null;

            // 2. Sequential filing logic
            let isLockedSequentially = false;
            for (let i = index - 1; i >= 0; i--) {
              // Re-calculate isWithinSubscription for prior month
              let prevWithinSub = true;
              if (subscription.startMonth && subscription.startYear && subscription.endMonth && subscription.endYear) {
                 const pYear = parseInt(array[i].value.split('-')[0]);
                 const pMonth = parseInt(array[i].value.split('-')[1]);
                 const pNum = pYear * 100 + pMonth;
                 const sNum = parseInt(subscription.startYear) * 100 + (months.indexOf(subscription.startMonth) + 1);
                 const eNum = parseInt(subscription.endYear) * 100 + (months.indexOf(subscription.endMonth) + 1);
                 prevWithinSub = pNum >= sNum && pNum <= eNum;
              }
              if (prevWithinSub) {
                 const prevOriginalReq = requests.find(r => r.month === array[i].value && r.serviceName === subscription.serviceName && r.returnType !== 'Revision');
                 const prevDocs = adminDocs.filter(d => d.taxYear === taxYear && d.periodValue === array[i].value && d.returnType !== 'Revision');
                 const prevStatus = prevOriginalReq ? (prevDocs.length > 0 || prevOriginalReq.status === 'Filed' ? 'Completed' : prevOriginalReq.status) : null;
                 
                 if (prevStatus !== 'Completed') {
                    isLockedSequentially = true;
                 }
                 break;
              }
            }

            // Monthly Date lock logic
            const periodYear = parseInt(period.value.split('-')[0]);
            const periodMonth = parseInt(period.value.split('-')[1]);
            let unlockYear = periodYear;
            let unlockMonth = periodMonth + 1;
            if (unlockMonth > 12) {
              unlockMonth = 1;
              unlockYear++;
            }
            const unlockDate = new Date(unlockYear, unlockMonth - 1, 1);
            const currentDate = new Date();
            const isDateLocked = currentDate < unlockDate;

            const sName = subscription?.serviceName?.toLowerCase() || "";
            const isGST = sName.includes("gst");
            const isPFESI = sName.includes("pf") || sName.includes("esi");
            
            let dueDateStr = "";
            let isPastDue = false;
            let showDueDate = false;

            if (isGST || isPFESI) {
              showDueDate = true;
              const dueDay = isGST ? 8 : 10;
              const dueDate = new Date(unlockYear, unlockMonth - 1, dueDay);
              
              // Handle suffixes correctly (e.g., 8th, 10th)
              const getDaySuffix = (d: number) => {
                if (d > 3 && d < 21) return 'th';
                switch (d % 10) {
                  case 1: return "st";
                  case 2: return "nd";
                  case 3: return "rd";
                  default: return "th";
                }
              };
              
              dueDateStr = `${dueDay}${getDaySuffix(dueDay)} ${months[dueDate.getMonth()]}`;
              isPastDue = currentDate > dueDate;
            }

            let cardBorderColor = 'transparent';
            let cardBoxShadow = '';
            if (isWithinSubscription) {
               if (originalDisplayStatus === 'Completed') {
                  cardBorderColor = '#10b981'; // Green
                  cardBoxShadow = '0 4px 20px rgba(16, 185, 129, 0.1)';
               } else if (showDueDate && isPastDue && (!originalReq || originalDisplayStatus !== 'Completed') && !originalUploaded) {
                  cardBorderColor = '#ef4444'; // Red
                  cardBoxShadow = '0 4px 20px rgba(239, 68, 68, 0.15)';
               }
            }

            return (
              <div key={period.value} className="cleartax-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px', opacity: isWithinSubscription ? 1 : 0.6, border: cardBorderColor !== 'transparent' ? `1px solid ${cardBorderColor}` : undefined, boxShadow: cardBoxShadow ? cardBoxShadow : undefined, transition: 'all 0.3s ease' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold' }}>{period.label}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{taxYear}</span>
                  </div>

                  {/* Original Filing Status Block */}
                  <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Original Filing</span>
                      {originalReq ? (
                        <span style={{
                          padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                          backgroundColor: originalDisplayStatus === 'Completed' ? '#EAF3DE' : originalDisplayStatus === 'Pending' ? '#FAEEDA' : '#E1F5EE',
                          color: originalDisplayStatus === 'Completed' ? '#3B6D11' : originalDisplayStatus === 'Pending' ? '#854F0B' : '#0F6E56'
                        }}>
                          {originalDisplayStatus}
                        </span>
                      ) : !isWithinSubscription ? (
                        <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold' }}>Not in Plan</span>
                      ) : isDateLocked ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Locked</span>
                      ) : isLockedSequentially ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Locked</span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not Started</span>
                      )}
                    </div>

                    {originalReq && <TimelineProgressBar status={originalReq.status} />}

                    {!originalReq && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <button 
                          disabled={startingFilingFor !== null || !isWithinSubscription || isDateLocked || isLockedSequentially}
                          onClick={() => handleStartFiling(`${period.label} Original (${taxYear})`, period.value, "", "Original")}
                          className="btn btn-primary" 
                          style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', width: '100%', opacity: (!isWithinSubscription || isDateLocked || isLockedSequentially) ? 0.5 : 1, cursor: (!isWithinSubscription || isDateLocked || isLockedSequentially) ? 'not-allowed' : 'pointer' }}
                        >
                          {startingFilingFor === `${period.label} Original (${taxYear}) - Original` ? 'Starting...' : !isWithinSubscription ? 'Not in current plan' : isDateLocked ? `Unlocks ${unlockDate.getDate() === 1 ? '1st' : unlockDate.getDate() + 'th'} ${months[unlockDate.getMonth()]}` : isLockedSequentially ? 'Complete previous month first' : '+ Start Original Filing'}
                        </button>
                        {!isDateLocked && showDueDate && !isLockedSequentially && (
                           <div style={{ fontSize: '0.7rem', color: isPastDue ? '#ef4444' : 'var(--text-muted)', textAlign: 'center' }}>
                              Due: {dueDateStr} {isPastDue && '(Overdue)'}
                           </div>
                        )}
                      </div>
                    )}

                    {originalReq && originalDisplayStatus !== 'Completed' && (
                      <>
                        {!originalUploaded && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: (originalUploaded || periodUserDocs.filter(d => d.returnType !== 'Revision').length > 0) ? '0.5rem' : '0' }}>
                            <Link href={`/dashboard/requests/${originalReq.id}/upload`} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
                              <UploadCloud size={14} /> Upload Original Docs
                            </Link>
                            {showDueDate && (
                               <div style={{ fontSize: '0.7rem', color: isPastDue ? '#ef4444' : 'var(--text-muted)', textAlign: 'center' }}>
                                  Due: {dueDateStr} {isPastDue && '(Overdue)'}
                               </div>
                            )}
                          </div>
                        )}
                        {(originalUploaded || periodUserDocs.filter(d => d.returnType !== 'Revision').length > 0) && (
                          <>
                            <button onClick={() => setShowDocsFor(showDocsFor === originalReq.id ? null : originalReq.id)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                              <CheckCircle size={14} /> Documents Already Uploaded
                            </button>
                            {showDocsFor === originalReq.id && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                                {periodUserDocs.filter(d => d.returnType !== 'Revision').map(d => (
                                  <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: 'var(--text-color)' }}>📄 Download {d.fileName} {(d.specificMonth || d.uploadedMonth) && `(${d.specificMonth || d.uploadedMonth})`}</a>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}

                    {originalReq && originalDisplayStatus === 'Completed' && (
                      <>
                        {(originalUploaded || periodUserDocs.filter(d => d.returnType !== 'Revision').length > 0) && (
                          <>
                            <button onClick={() => setShowDocsFor(showDocsFor === originalReq.id ? null : originalReq.id)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                              <CheckCircle size={14} /> Documents Already Uploaded
                            </button>
                            {showDocsFor === originalReq.id && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                                {periodUserDocs.filter(d => d.returnType !== 'Revision').map(d => (
                                  <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: 'var(--text-color)' }}>📄 Download {d.fileName} {(d.specificMonth || d.uploadedMonth) && `(${d.specificMonth || d.uploadedMonth})`}</a>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                        
                        <button onClick={() => setShowAdminDocsFor(showAdminDocsFor === originalReq.id ? null : originalReq.id)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', cursor: 'pointer', marginTop: '0.5rem', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none' }}>
                          <CheckCircle size={14} /> Filing Completed - View Docs
                        </button>
                        {showAdminDocsFor === originalReq.id && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                            {periodAdminDocsOriginal.map(d => (
                              <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: 'var(--text-color)' }}>📄 Download {d.fileName} {d.specificMonth && `(${d.specificMonth})`}</a>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* Show Challans Regardless of Status */}
                    {periodAdminDocs.filter(d => d.returnType === 'Challan').length > 0 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Challans:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {periodAdminDocs.filter(d => d.returnType === 'Challan').map(d => (
                            <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: '#92400e', backgroundColor: '#fef3c7', border: '1px solid #fde68a' }}>
                              📄 Download {d.fileName} {d.specificMonth && `(${d.specificMonth})`}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Revision Filing Status Block */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Revision Filing</span>
                      {revisionReq ? (
                        <span style={{
                          padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                          backgroundColor: revisionDisplayStatus === 'Completed' ? '#EAF3DE' : revisionDisplayStatus === 'Pending' ? '#FAEEDA' : '#E1F5EE',
                          color: revisionDisplayStatus === 'Completed' ? '#3B6D11' : revisionDisplayStatus === 'Pending' ? '#854F0B' : '#0F6E56'
                        }}>
                          {revisionDisplayStatus}
                        </span>
                      ) : !originalUploaded ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Locked</span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not Started</span>
                      )}
                    </div>

                    {revisionReq && <TimelineProgressBar status={revisionReq.status} />}

                    {!originalUploaded && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                        (Upload original documents first to unlock revision option)
                      </p>
                    )}

                    {originalUploaded && !revisionReq && (
                      <button 
                        disabled={startingFilingFor !== null}
                        onClick={() => {
                          const confirmMsg = isRevisionFree 
                            ? "Start your FREE revision filing for this month?"
                            : `Start paid revision filing for this month? Charge: ₹${revisionCharge.toFixed(0)} (Annual Charge / 12).`;
                          if (confirm(confirmMsg)) {
                            handleStartFiling(`${period.label} Revision (${taxYear})`, period.value, "", "Revision");
                          }
                        }}
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', width: '100%', borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}
                      >
                        {startingFilingFor === `${period.label} Revision (${taxYear}) - Revision` 
                          ? 'Starting...' 
                          : `+ Start Revision Filing (${isRevisionFree ? 'Free' : `Paid: ₹${revisionCharge.toFixed(0)}`})`}
                      </button>
                    )}

                    {originalUploaded && revisionReq && revisionDisplayStatus !== 'Completed' && (
                      !(revisionReq.documentsUploaded || revisionReq.status !== 'Pending') ? (
                        <Link href={`/dashboard/requests/${revisionReq.id}/upload`} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
                          <UploadCloud size={14} /> Upload Revision Docs
                        </Link>
                      ) : (
                        <>
                          <button onClick={() => setShowDocsFor(showDocsFor === revisionReq.id ? null : revisionReq.id)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <CheckCircle size={14} /> Documents Already Uploaded
                          </button>
                          {showDocsFor === revisionReq.id && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                              {userDocs.filter(d => d.serviceRequestId === revisionReq.id).map(d => (
                                <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: 'var(--text-color)' }}>📄 Download {d.fileName} {(d.specificMonth || d.uploadedMonth) && `(${d.specificMonth || d.uploadedMonth})`}</a>
                              ))}
                            </div>
                          )}
                        </>
                      )
                    )}

                    {originalUploaded && revisionReq && revisionDisplayStatus === 'Completed' && (
                      <>
                        {(revisionReq.documentsUploaded || revisionReq.status !== 'Pending') && (
                          <>
                            <button onClick={() => setShowDocsFor(showDocsFor === revisionReq.id ? null : revisionReq.id)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                              <CheckCircle size={14} /> Documents Already Uploaded
                            </button>
                            {showDocsFor === revisionReq.id && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                                {userDocs.filter(d => d.serviceRequestId === revisionReq.id).map(d => (
                                  <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: 'var(--text-color)' }}>📄 Download {d.fileName} {(d.specificMonth || d.uploadedMonth) && `(${d.specificMonth || d.uploadedMonth})`}</a>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                        <button onClick={() => setShowAdminDocsFor(showAdminDocsFor === revisionReq.id ? null : revisionReq.id)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', cursor: 'pointer', marginTop: '0.5rem', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none' }}>
                          <CheckCircle size={14} /> Filing Completed - View Docs
                        </button>
                        {showAdminDocsFor === revisionReq.id && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                            {periodAdminDocsRevision.map(d => (
                              <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: 'var(--text-color)' }}>📄 Download {d.fileName}</a>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>


                </div>
              </div>
            );
          })}
        </div>
      )}

      {isQuarterly && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {getQuarterlyPeriods().map(period => {
            const isTDS = svcNameLower.includes("tds") || subNameLower.includes("tds");
            const originalReq = requests.find(r => r.quarter === period.value && r.serviceName === subscription.serviceName && r.returnType !== 'Revision');
            const revisionReq = requests.find(r => r.quarter === period.value && r.serviceName === subscription.serviceName && r.returnType === 'Revision');
            
            const periodUserDocs = userDocs.filter(d => 
              (d.serviceId === subscription.serviceId || d.serviceName === subscription.serviceName) && 
              d.taxYear === taxYear && 
              (d.periodValue === period.value || d.periodValue === period.label || (d.periodValue || "").toLowerCase().includes(period.value.toLowerCase()))
            );

            let uploadedMonthsForQuarter: string[] = [];
            if (isTDS) {
               const docsForOriginal = periodUserDocs.filter(d => d.returnType !== 'Revision');
               docsForOriginal.forEach(d => {
                  if (d.uploadedMonth && !uploadedMonthsForQuarter.includes(d.uploadedMonth)) {
                     uploadedMonthsForQuarter.push(d.uploadedMonth);
                  }
               });
            }

            const originalUploaded = isTDS 
               ? (uploadedMonthsForQuarter.length >= 3 || (originalReq && originalReq.status !== 'Pending')) 
               : (originalReq?.documentsUploaded || (originalReq && originalReq.status !== 'Pending'));

            // Revision charge logic
            const totalRevisionsInTaxYear = requests.filter(r => r.returnType === 'Revision' && r.serviceName === subscription.serviceName).length;
            const isRevisionFree = totalRevisionsInTaxYear === 0;
            const annualCharge = subscription.amount || 6000;
            const revisionCharge = annualCharge / 4;

            const periodAdminDocs = adminDocs.filter(d => 
              (d.serviceId === subscription.serviceId || d.serviceName === subscription.serviceName) && 
              d.taxYear === taxYear && 
              (d.periodValue === period.value || d.periodValue === period.label || (d.periodValue || "").toLowerCase().includes(period.value.toLowerCase()))
            );
            
            const periodAdminDocsOriginal = periodAdminDocs.filter(d => (!d.returnType || d.returnType === 'Original'));
            const originalDisplayStatus = originalReq ? (periodAdminDocsOriginal.length > 0 || originalReq.status === 'Filed' ? 'Completed' : originalReq.status) : null;

            const periodAdminDocsRevision = periodAdminDocs.filter(d => d.returnType === 'Revision');
            const revisionDisplayStatus = revisionReq ? (periodAdminDocsRevision.length > 0 || revisionReq.status === 'Filed' ? 'Completed' : revisionReq.status) : null;

            // Quarterly Date lock logic
            const parts = taxYear.split('-');
            const startYear = parseInt(parts[0]);
            const endYear = startYear + 1;
            
            let unlockDate = new Date();
            let qStartMonth = 0, qStartYear = 0, qEndMonth = 0, qEndYear = 0;
            if (period.value === "Q1") {
               unlockDate = isTDS ? new Date(startYear, 4, 1) : new Date(startYear, 6, 1);
               qStartYear = startYear; qStartMonth = 4; qEndYear = startYear; qEndMonth = 6;
            } else if (period.value === "Q2") {
               unlockDate = isTDS ? new Date(startYear, 7, 1) : new Date(startYear, 9, 1);
               qStartYear = startYear; qStartMonth = 7; qEndYear = startYear; qEndMonth = 9;
            } else if (period.value === "Q3") {
               unlockDate = isTDS ? new Date(startYear, 10, 1) : new Date(endYear, 0, 1);
               qStartYear = startYear; qStartMonth = 10; qEndYear = startYear; qEndMonth = 12;
            } else if (period.value === "Q4") {
               unlockDate = isTDS ? new Date(endYear, 1, 1) : new Date(endYear, 3, 15);
               qStartYear = endYear; qStartMonth = 1; qEndYear = endYear; qEndMonth = 3;
            }
            
            const qStartNum = qStartYear * 100 + qStartMonth;
            const qEndNum = qEndYear * 100 + qEndMonth;

            let isWithinSubscription = true;
            if (subscription.startMonth && subscription.startYear && subscription.endMonth && subscription.endYear) {
               const subStartNum = parseInt(subscription.startYear) * 100 + (months.indexOf(subscription.startMonth) + 1);
               const subEndNum = parseInt(subscription.endYear) * 100 + (months.indexOf(subscription.endMonth) + 1);
               isWithinSubscription = (qStartNum >= subStartNum && qStartNum <= subEndNum) || 
                                      (qEndNum >= subStartNum && qEndNum <= subEndNum) ||
                                      (subStartNum >= qStartNum && subStartNum <= qEndNum);
            }
            
            const currentDate = new Date();
            const isDateLocked = currentDate < unlockDate;

            return (
              <div key={period.value} className="cleartax-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px', opacity: isWithinSubscription ? 1 : 0.6 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold' }}>{period.label}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{taxYear}</span>
                  </div>

                  {/* Original Filing Status Block */}
                  <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Original Filing</span>
                      {originalReq ? (
                        <span style={{
                          padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                          backgroundColor: originalDisplayStatus === 'Completed' ? '#EAF3DE' : originalDisplayStatus === 'Pending' ? '#FAEEDA' : '#E1F5EE',
                          color: originalDisplayStatus === 'Completed' ? '#3B6D11' : originalDisplayStatus === 'Pending' ? '#854F0B' : '#0F6E56'
                        }}>
                          {originalDisplayStatus}
                        </span>
                      ) : !isWithinSubscription ? (
                        <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold' }}>Not in Plan</span>
                      ) : isDateLocked ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Locked</span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not Started</span>
                      )}
                    </div>

                    {originalReq && <TimelineProgressBar status={originalReq.status} />}

                    {!originalReq && (
                      <button 
                        disabled={startingFilingFor !== null || !isWithinSubscription || isDateLocked}
                        onClick={() => handleStartFiling(`${period.label} Original (${taxYear})`, "", period.value, "Original")}
                        className="btn btn-primary" 
                        style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', width: '100%', opacity: (!isWithinSubscription || isDateLocked) ? 0.5 : 1, cursor: (!isWithinSubscription || isDateLocked) ? 'not-allowed' : 'pointer' }}
                      >
                        {startingFilingFor === `${period.label} Original (${taxYear}) - Original` ? 'Starting...' : !isWithinSubscription ? 'Not in current plan' : isDateLocked ? `Unlocks ${unlockDate.getDate() === 1 ? '1st' : '15th'} ${months[unlockDate.getMonth()]}` : '+ Start Original Filing'}
                      </button>
                    )}

                    {originalReq && originalDisplayStatus !== 'Completed' && (
                      <>
                        {!originalUploaded && (
                          <div style={{ marginBottom: (originalUploaded || periodUserDocs.filter(d => d.returnType !== 'Revision').length > 0) ? '0.5rem' : '0' }}>
                            <Link href={`/dashboard/requests/${originalReq.id}/upload`} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
                              <UploadCloud size={14} /> {isTDS ? `Upload Original Docs (${uploadedMonthsForQuarter.length}/3)` : `Upload Original Docs`}
                            </Link>
                          </div>
                        )}
                        {(originalUploaded || periodUserDocs.filter(d => d.returnType !== 'Revision').length > 0) && (
                          <>
                            <button onClick={() => setShowDocsFor(showDocsFor === originalReq.id ? null : originalReq.id)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                              <CheckCircle size={14} /> Documents Already Uploaded
                            </button>
                            {showDocsFor === originalReq.id && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                                {periodUserDocs.filter(d => d.returnType !== 'Revision').map(d => (
                                  <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: 'var(--text-color)' }}>📄 Download {d.fileName} {(d.specificMonth || d.uploadedMonth) && `(${d.specificMonth || d.uploadedMonth})`}</a>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}

                    {originalReq && originalDisplayStatus === 'Completed' && (
                      <>
                        {(originalUploaded || periodUserDocs.filter(d => d.returnType !== 'Revision').length > 0) && (
                          <>
                            <button onClick={() => setShowDocsFor(showDocsFor === originalReq.id ? null : originalReq.id)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                              <CheckCircle size={14} /> Documents Already Uploaded
                            </button>
                            {showDocsFor === originalReq.id && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                                {periodUserDocs.filter(d => d.returnType !== 'Revision').map(d => (
                                  <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: 'var(--text-color)' }}>📄 Download {d.fileName} {(d.specificMonth || d.uploadedMonth) && `(${d.specificMonth || d.uploadedMonth})`}</a>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                        
                        <button onClick={() => setShowAdminDocsFor(showAdminDocsFor === originalReq.id ? null : originalReq.id)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', cursor: 'pointer', marginTop: '0.5rem', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none' }}>
                          <CheckCircle size={14} /> Filing Completed - View Docs
                        </button>
                        {showAdminDocsFor === originalReq.id && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                            {periodAdminDocsOriginal.map(d => (
                              <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: 'var(--text-color)' }}>📄 Download {d.fileName}</a>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    {/* Show Challans Regardless of Status */}
                    {periodAdminDocs.filter(d => d.returnType === 'Challan').length > 0 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Challans:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {periodAdminDocs.filter(d => d.returnType === 'Challan').map(d => (
                            <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: '#92400e', backgroundColor: '#fef3c7', border: '1px solid #fde68a' }}>
                              📄 Download {d.fileName} {d.specificMonth && `(${d.specificMonth})`}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Revision Filing Status Block */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Revision Filing</span>
                      {revisionReq ? (
                        <span style={{
                          padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                          backgroundColor: revisionDisplayStatus === 'Completed' ? '#EAF3DE' : revisionDisplayStatus === 'Pending' ? '#FAEEDA' : '#E1F5EE',
                          color: revisionDisplayStatus === 'Completed' ? '#3B6D11' : revisionDisplayStatus === 'Pending' ? '#854F0B' : '#0F6E56'
                        }}>
                          {revisionDisplayStatus}
                        </span>
                      ) : !originalUploaded ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Locked</span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not Started</span>
                      )}
                    </div>

                    {revisionReq && <TimelineProgressBar status={revisionReq.status} />}

                    {!originalUploaded && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                        (Upload original documents first to unlock revision option)
                      </p>
                    )}

                    {originalUploaded && !revisionReq && (
                      <button 
                        disabled={startingFilingFor !== null}
                        onClick={() => {
                          const confirmMsg = isRevisionFree 
                            ? "Start your FREE revision filing for this quarter?"
                            : `Start paid revision filing for this quarter? Charge: ₹${revisionCharge} (Annual Charge / 4).`;
                          if (confirm(confirmMsg)) {
                            handleStartFiling(`${period.label} Revision (${taxYear})`, "", period.value, "Revision");
                          }
                        }}
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', width: '100%', borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}
                      >
                        {startingFilingFor === `${period.label} Revision (${taxYear}) - Revision` 
                          ? 'Starting...' 
                          : `+ Start Revision Filing (${isRevisionFree ? 'Free' : `Paid: ₹${revisionCharge}`})`}
                      </button>
                    )}

                    {originalUploaded && revisionReq && revisionDisplayStatus !== 'Completed' && (
                      !(revisionReq.documentsUploaded || revisionReq.status !== 'Pending') ? (
                        <Link href={`/dashboard/requests/${revisionReq.id}/upload`} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
                          <UploadCloud size={14} /> Upload Revision Docs
                        </Link>
                      ) : (
                        <>
                          <button onClick={() => setShowDocsFor(showDocsFor === revisionReq.id ? null : revisionReq.id)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <CheckCircle size={14} /> Documents Already Uploaded
                          </button>
                          {showDocsFor === revisionReq.id && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                              {userDocs.filter(d => d.serviceRequestId === revisionReq.id).map(d => (
                                <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: 'var(--text-color)' }}>📄 Download {d.fileName} {(d.specificMonth || d.uploadedMonth) && `(${d.specificMonth || d.uploadedMonth})`}</a>
                              ))}
                            </div>
                          )}
                        </>
                      )
                    )}

                    {originalUploaded && revisionReq && revisionDisplayStatus === 'Completed' && (
                      <>
                        {(revisionReq.documentsUploaded || revisionReq.status !== 'Pending') && (
                          <>
                            <button onClick={() => setShowDocsFor(showDocsFor === revisionReq.id ? null : revisionReq.id)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                              <CheckCircle size={14} /> Documents Already Uploaded
                            </button>
                            {showDocsFor === revisionReq.id && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                                {userDocs.filter(d => d.serviceRequestId === revisionReq.id).map(d => (
                                  <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: 'var(--text-color)' }}>📄 Download {d.fileName} {(d.specificMonth || d.uploadedMonth) && `(${d.specificMonth || d.uploadedMonth})`}</a>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                        <button onClick={() => setShowAdminDocsFor(showAdminDocsFor === revisionReq.id ? null : revisionReq.id)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', cursor: 'pointer', marginTop: '0.5rem', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none' }}>
                          <CheckCircle size={14} /> Filing Completed - View Docs
                        </button>
                        {showAdminDocsFor === revisionReq.id && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                            {periodAdminDocsRevision.map(d => (
                              <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: 'var(--text-color)' }}>📄 Download {d.fileName}</a>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>


                </div>
              </div>
            );
          })}
        </div>
      )}

      {(isAnnual || isOneTime) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="cleartax-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {isOneTime ? 'Upload Documents for Registration' : `Annual Tax Year Filing (${taxYear})`}
              </h3>
              {(() => {
                const req = requests.find(r => r.serviceName === subscription.serviceName);
                if (req) {
                  const annualAdminDocs = adminDocs.filter(d => 
                    (d.serviceId === subscription.serviceId || d.serviceName === subscription.serviceName) && 
                    d.taxYear === taxYear
                  );
                  const annualAdminDocsOriginal = annualAdminDocs.filter(d => (!d.returnType || d.returnType === 'Original'));
                  const displayStatus = (annualAdminDocsOriginal.length > 0 || req.status === 'Filed') ? 'Completed' : req.status;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {displayStatus === 'Completed' ? <CheckCircle size={18} color="#10b981" /> : <Clock size={18} color="#f59e0b" />}
                        <span style={{
                          padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold',
                          backgroundColor: displayStatus === 'Completed' ? '#EAF3DE' : displayStatus === 'Pending' ? '#FAEEDA' : '#E1F5EE',
                          color: displayStatus === 'Completed' ? '#3B6D11' : displayStatus === 'Pending' ? '#854F0B' : '#0F6E56'
                        }}>
                          {displayStatus}
                        </span>
                      </div>
                      <TimelineProgressBar status={req.status} />
                    </div>
                  );
                }
                return <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Filing for this year has not been started.</span>;
              })()}
            </div>

            <div>
              {(() => {
                const req = requests.find(r => r.serviceName === subscription.serviceName);
                if (req) {
                  const annualAdminDocs = adminDocs.filter(d => 
                    (d.serviceId === subscription.serviceId || d.serviceName === subscription.serviceName) && 
                    d.taxYear === taxYear
                  );
                  const annualAdminDocsOriginal = annualAdminDocs.filter(d => (!d.returnType || d.returnType === 'Original'));
                  const displayStatus = (annualAdminDocsOriginal.length > 0 || req.status === 'Filed') ? 'Completed' : req.status;

                  return displayStatus !== 'Completed' ? (
                    !(req.documentsUploaded || req.status !== 'Pending') ? (
                      <Link href={`/dashboard/requests/${req.id}/upload`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UploadCloud size={16} /> Upload Documents
                      </Link>
                    ) : (
                      <>
                        <button onClick={() => setShowDocsFor(showDocsFor === req.id ? null : req.id)} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <CheckCircle size={16} /> Documents Already Uploaded
                        </button>
                        {showDocsFor === req.id && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                            {userDocs.filter(d => d.serviceRequestId === req.id).map(d => (
                              <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: 'var(--text-color)' }}>📄 Download {d.fileName} {(d.specificMonth || d.uploadedMonth) && `(${d.specificMonth || d.uploadedMonth})`}</a>
                            ))}
                          </div>
                        )}
                      </>
                    )
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                      {(req.documentsUploaded || req.status !== 'Pending') && (
                        <>
                          <button onClick={() => setShowDocsFor(showDocsFor === req.id ? null : req.id)} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <CheckCircle size={16} /> Documents Already Uploaded
                          </button>
                          {showDocsFor === req.id && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                              {userDocs.filter(d => d.serviceRequestId === req.id).map(d => (
                                <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: 'var(--text-color)' }}>📄 Download {d.fileName} {(d.specificMonth || d.uploadedMonth) && `(${d.specificMonth || d.uploadedMonth})`}</a>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                      
                      <button onClick={() => setShowAdminDocsFor(showAdminDocsFor === req.id ? null : req.id)} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none' }}>
                        <CheckCircle size={16} /> Filing Completed - View Docs
                      </button>
                        {showAdminDocsFor === req.id && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem', alignItems: 'flex-end' }}>
                            {annualAdminDocsOriginal.map(d => (
                              <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: 'var(--text-color)' }}>📄 Download {d.fileName}</a>
                            ))}
                          </div>
                        )}
                        {/* Show Challans Regardless of Status */}
                        {annualAdminDocs.filter(d => d.returnType === 'Challan').length > 0 && (
                          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Challans:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end' }}>
                              {annualAdminDocs.filter(d => d.returnType === 'Challan').map(d => (
                                <a key={d.id} href={d.fileUrl} target="_blank" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content', color: '#92400e', backgroundColor: '#fef3c7', border: '1px solid #fde68a' }}>
                                  📄 Download {d.fileName} {d.specificMonth && `(${d.specificMonth})`}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  );
                }
                return (
                  <button 
                    disabled={startingFilingFor === (isOneTime ? "Registration - Original" : `Annual Filing (${taxYear}) - Original`)}
                    onClick={() => handleStartFiling(isOneTime ? "Registration" : `Annual Filing (${taxYear})`, "", "")}
                    className="btn btn-primary"
                  >
                    {startingFilingFor === (isOneTime ? "Registration - Original" : `Annual Filing (${taxYear}) - Original`) ? 'Starting...' : (isOneTime ? '+ Start Registration' : '+ Start Filing')}
                  </button>
                );
              })()}
            </div>
          </div>


        </div>
      )}
    </div>
  );
}
