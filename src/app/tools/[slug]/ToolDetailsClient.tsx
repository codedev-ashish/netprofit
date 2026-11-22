"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import styles from "../../page.module.css";
import Link from "next/link";
import LoanCalculator from "../../../components/calculators/LoanCalculator";
import GratuityCalculator from "../../../components/calculators/GratuityCalculator";
import PpfCalculator from "../../../components/calculators/PpfCalculator";
import SsyCalculator from "../../../components/calculators/SsyCalculator";
import ToolHeader from "../../../components/ToolHeader";
import DisclaimerCard from "../../../components/DisclaimerCard";

export default function ToolDetailsClient({ initialToolName = null, slug }: { initialToolName?: string | null, slug: string }) {
  const router = useRouter();
  
  const [toolName, setToolName] = useState<string | null>(initialToolName);
  const [loading, setLoading] = useState(initialToolName === null);

  const isLoanCalculator = ['car-loan-calculator', 'home-loan-calculator', 'personal-loan-calculator', 'term-loan-calculator'].includes(slug);
  const isGratuityCalculator = slug === 'gratuity-calculator';
  const isPpfCalculator = slug === 'ppf-calculator';
  const isSsyCalculator = slug === 'sukanya-samriddhi-yojana-calculator';

  useEffect(() => {
    if (initialToolName !== null) {
      setLoading(false);
      return;
    }
    const fetchToolData = async () => {
      if (!slug) return;
      try {
        const q = query(collection(db, "tools"), where("slug", "==", slug), where("isPublished", "==", true));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          setToolName(snapshot.docs[0].data().name);
        } else {
          // Tool not found or not published
          router.push("/tools");
        }
      } catch (error) {
        console.error("Error fetching tool:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchToolData();
  }, [slug, router, initialToolName]);

  if (loading) {
    return (
      <div className={styles.container} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading calculator...</p>
      </div>
    );
  }

  if (isLoanCalculator) {
    let defaults = { amount: 500000, rate: 9, tenure: 5 };
    if (slug === 'home-loan-calculator') defaults = { amount: 5000000, rate: 8.5, tenure: 20 };
    if (slug === 'personal-loan-calculator') defaults = { amount: 300000, rate: 12, tenure: 3 };
    if (slug === 'term-loan-calculator') defaults = { amount: 1000000, rate: 10, tenure: 5 };
    
    return (
      <>
        <ToolHeader toolSlug={slug} initialTitle={toolName} />
        <div className={styles.container}>
          <div className={styles.contentWrapper}>
            <LoanCalculator title={toolName || "Loan Calculator"} defaultAmount={defaults.amount} defaultRate={defaults.rate} defaultTenure={defaults.tenure} />
            <DisclaimerCard toolSlug={slug} />
          </div>
        </div>
      </>
    );
  }

  if (isGratuityCalculator) {
    return (
      <>
        <ToolHeader toolSlug={slug} initialTitle={toolName} />
        <div className={styles.container}>
          <div className={styles.contentWrapper}>
            <GratuityCalculator title={toolName || "Gratuity Calculator"} />
            <DisclaimerCard toolSlug={slug} />
          </div>
        </div>
      </>
    );
  }

  if (isPpfCalculator) {
    return (
      <>
        <ToolHeader toolSlug={slug} initialTitle={toolName} />
        <div className={styles.container}>
          <div className={styles.contentWrapper}>
            <PpfCalculator title={toolName || "PPF Calculator"} />
            <DisclaimerCard toolSlug={slug} />
          </div>
        </div>
      </>
    );
  }

  if (isSsyCalculator) {
    return (
      <>
        <ToolHeader toolSlug={slug} initialTitle={toolName} />
        <div className={styles.container}>
          <div className={styles.contentWrapper}>
            <SsyCalculator title={toolName || "SSY Calculator"} />
            <DisclaimerCard toolSlug={slug} />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.title} style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{toolName || "Calculator"}</div>
        <p className={styles.subtitle}>This tool is currently under development.</p>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.calculatorWrapper} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 2rem', backgroundColor: 'var(--bg-color)', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚧</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-color)' }}>Coming Soon</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '500px' }}>
            We are working hard to build the <strong>{toolName}</strong>. 
            Please check back later or explore our other available calculators.
          </p>
          <Link href="/tools" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
            Back to Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
