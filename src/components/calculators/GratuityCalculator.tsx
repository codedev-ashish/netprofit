"use client";

import React, { useState, useMemo } from 'react';
import styles from './LoanCalculator.module.css'; // Reusing standard calculator styles

interface GratuityCalculatorProps {
  title?: string;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

export default function GratuityCalculator({ 
  title = "Gratuity Calculator"
}: GratuityCalculatorProps) {
  
  const [salary, setSalary] = useState(60000);
  const [tenure, setTenure] = useState(20);

  // Gratuity calculation (Covered under Payment of Gratuity Act)
  // Formula: (15 * Last drawn salary * Tenure) / 26
  const gratuity = useMemo(() => {
    return Math.round((15 * salary * tenure) / 26);
  }, [salary, tenure]);

  return (
    <div className={styles.container}>
      
      <div className={styles.topSection}>
        {/* Left: Inputs */}
        <div className={styles.inputSection}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          
          {/* Monthly Salary */}
          <div className={styles.inputGroup}>
            <div className={styles.inputHeader}>
              <label htmlFor="salary" className={styles.label}>Monthly Salary (Basic + DA)</label>
              <div style={{display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)'}}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.5rem' }}>₹</span>
                <input 
                  id="salary"
                  name="salary"
                  aria-label="Monthly Salary"
                  type="number" 
                  value={salary} 
                  onChange={(e) => setSalary(Number(e.target.value))}
                  className={styles.numberInput}
                  style={{border: 'none', background: 'transparent', width: '120px', padding: 0}}
                />
              </div>
            </div>
            <div className={styles.sliderContainer}>
              <input 
                id="salarySlider"
                name="salarySlider"
                aria-label="Monthly Salary Slider"
                type="range" 
                min="10000" 
                max="1000000" 
                step="5000"
                value={salary} 
                onChange={(e) => setSalary(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>

          {/* Tenure */}
          <div className={styles.inputGroup}>
            <div className={styles.inputHeader}>
              <label htmlFor="tenure" className={styles.label}>Years of Service</label>
              <div style={{display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)'}}>
                <input 
                  id="tenure"
                  name="tenure"
                  aria-label="Years of Service"
                  type="number" 
                  value={tenure} 
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className={styles.numberInput}
                  style={{border: 'none', background: 'transparent', width: '80px', padding: 0}}
                />
                <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Yrs</span>
              </div>
            </div>
            <div className={styles.sliderContainer}>
              <input 
                id="tenureSlider"
                name="tenureSlider"
                aria-label="Years of Service Slider"
                type="range" 
                min="5" 
                max="50" 
                step="1"
                value={tenure} 
                onChange={(e) => setTenure(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>
          
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)', fontSize: '1.2rem' }}>How is this calculated?</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              For employees covered under the Payment of Gratuity Act, the formula is:<br/>
              <strong>(15 × Last Drawn Salary × Years of Service) / 26</strong><br/><br/>
              <em>Note: The maximum tax-exempt gratuity amount is ₹20 Lakh.</em>
            </p>
          </div>

        </div>

        {/* Right: Results */}
        <div className={styles.resultSection}>
          <div className={styles.resultCard} style={{ textAlign: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>Total Gratuity Payable</div>
            <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#fff', paddingBottom: '1.5rem', borderBottom: '1px dashed rgba(255,255,255,0.3)' }}>{formatCurrency(gratuity)}</div>
            
            {gratuity > 2000000 && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem' }}>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>⚠️ Important Note:</span><br/>
                <span style={{ fontSize: '0.9rem', color: 'white' }}>Your calculated gratuity exceeds the ₹20 Lakh tax-exempt limit. The excess amount may be taxable as per current laws.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
