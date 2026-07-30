"use client";

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import styles from './LoanCalculator.module.css'; // Reusing standard calculator styles

interface SsyCalculatorProps {
  title?: string;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

const COLORS = ['#e2e8f0', '#8b5cf6']; // Gray for Investment, Purple for Interest

export default function SsyCalculator({ 
  title = "Sukanya Samriddhi Yojana Calculator"
}: SsyCalculatorProps) {
  
  const [yearlyInvestment, setYearlyInvestment] = useState(10000);
  const [girlsAge, setGirlsAge] = useState(5);
  const [startPeriod, setStartPeriod] = useState(new Date().getFullYear());
  const rateOfInterest = 8.2;

  const { investedAmount, totalInterest, maturityValue, maturityYear } = useMemo(() => {
    let closingBalance = 0;
    const P = yearlyInvestment;
    const i = rateOfInterest / 100;
    
    // SSY accounts mature after 21 years from opening
    const tenure = 21;

    for (let year = 1; year <= tenure; year++) {
      // Deposits are only made for the first 15 years
      let deposit = year <= 15 ? P : 0;
      let opening = closingBalance;
      let interest = Math.round((opening + deposit) * i);
      closingBalance = opening + deposit + interest;
    }

    const invested = P * 15;
    const interestEarned = closingBalance - invested;

    return {
      investedAmount: invested,
      totalInterest: interestEarned,
      maturityValue: closingBalance,
      maturityYear: startPeriod + tenure
    };
  }, [yearlyInvestment, startPeriod]);

  const chartData = [
    { name: 'Total Investment', value: investedAmount },
    { name: 'Total Interest', value: totalInterest }
  ];

  return (
    <div className={styles.container}>
      
      <div className={styles.topSection}>
        {/* Left: Inputs */}
        <div className={styles.inputSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h2 className={styles.sectionTitle} style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>{title}</h2>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem' }}>
              Latest SSY Rate = {rateOfInterest}%
            </div>
          </div>
          
          {/* Yearly Investment */}
          <div className={styles.inputGroup}>
            <div className={styles.inputHeader}>
              <label htmlFor="yearlyInvestment" className={styles.label}>Yearly investment</label>
              <div style={{display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)'}}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.5rem' }}>₹</span>
                <input 
                  id="yearlyInvestment"
                  name="yearlyInvestment"
                  aria-label="Yearly investment"
                  type="number" 
                  value={yearlyInvestment} 
                  onChange={(e) => setYearlyInvestment(Number(e.target.value))}
                  className={styles.numberInput}
                  style={{border: 'none', background: 'transparent', width: '120px', padding: 0}}
                />
              </div>
            </div>
            <div className={styles.sliderContainer}>
              <input 
                id="yearlyInvestmentSlider"
                name="yearlyInvestmentSlider"
                aria-label="Yearly investment Slider"
                type="range" 
                min="250" 
                max="150000" 
                step="250"
                value={yearlyInvestment} 
                onChange={(e) => setYearlyInvestment(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>

          {/* Girl's Age */}
          <div className={styles.inputGroup}>
            <div className={styles.inputHeader}>
              <label htmlFor="girlsAge" className={styles.label}>Girl's age</label>
              <div style={{display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)'}}>
                <input 
                  id="girlsAge"
                  name="girlsAge"
                  aria-label="Girl's age"
                  type="number" 
                  value={girlsAge} 
                  onChange={(e) => setGirlsAge(Number(e.target.value))}
                  className={styles.numberInput}
                  style={{border: 'none', background: 'transparent', width: '80px', padding: 0}}
                />
                <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Yr</span>
              </div>
            </div>
            <div className={styles.sliderContainer}>
              <input 
                id="girlsAgeSlider"
                name="girlsAgeSlider"
                aria-label="Girl's age Slider"
                type="range" 
                min="1" 
                max="10" 
                step="1"
                value={girlsAge} 
                onChange={(e) => setGirlsAge(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>

          {/* Start Period */}
          <div className={styles.inputGroup}>
            <div className={styles.inputHeader}>
              <label htmlFor="startPeriod" className={styles.label}>Start period (Year)</label>
              <div style={{display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)'}}>
                <input 
                  id="startPeriod"
                  name="startPeriod"
                  aria-label="Start period (Year)"
                  type="number" 
                  value={startPeriod} 
                  onChange={(e) => setStartPeriod(Number(e.target.value))}
                  className={styles.numberInput}
                  style={{border: 'none', background: 'transparent', width: '100px', padding: 0}}
                />
              </div>
            </div>
            <div className={styles.sliderContainer}>
              <input 
                id="startPeriodSlider"
                name="startPeriodSlider"
                aria-label="Start period Slider"
                type="range" 
                min="2015" 
                max={new Date().getFullYear() + 5} 
                step="1"
                value={startPeriod} 
                onChange={(e) => setStartPeriod(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>
          
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)', fontSize: '1.2rem' }}>How is this calculated?</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Under the SSY scheme, you make deposits for the first <strong>15 years</strong> only. However, the account continues to earn interest until maturity at <strong>21 years</strong> from the date of opening. The maximum tax-exempt deposit is ₹1.5 Lakh per year under Section 80C.
            </p>
          </div>

        </div>

        {/* Right: Results & Chart */}
        <div className={styles.resultSection}>
          <div className={styles.resultCard} style={{ textAlign: 'center', justifyContent: 'flex-start', overflowY: 'auto', background: '#4c1d95', borderColor: '#5b21b6' }}>
            
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>Total Investment</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', paddingBottom: '1.5rem', borderBottom: '1px dashed rgba(255,255,255,0.2)' }}>{formatCurrency(investedAmount)}</div>

            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', marginTop: '1.5rem' }}>Total Interest</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', paddingBottom: '1.5rem', borderBottom: '1px dashed rgba(255,255,255,0.2)' }}>{formatCurrency(totalInterest)}</div>
            
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', marginTop: '1.5rem' }}>Maturity Year: <span style={{color: '#fff', fontWeight: 800}}>{maturityYear}</span></div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', marginTop: '1rem' }}>Maturity Value</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>{formatCurrency(maturityValue)}</div>

            {/* Pie Chart */}
            <div style={{ width: '100%', height: 250, marginTop: '2rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} wrapperStyle={{ outline: 'none' }} itemStyle={{ color: '#0f172a', fontWeight: 600 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.9rem', fontWeight: 500 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
