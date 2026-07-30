"use client";

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import styles from './LoanCalculator.module.css'; // Reusing standard calculator styles

interface PpfCalculatorProps {
  title?: string;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

const COLORS = ['#e2e8f0', '#2563eb']; // Gray for Investment, Blue for Interest

export default function PpfCalculator({ 
  title = "PPF Calculator"
}: PpfCalculatorProps) {
  
  const [yearlyInvestment, setYearlyInvestment] = useState(10000);
  const [timePeriod, setTimePeriod] = useState(15);
  const rateOfInterest = 7.1;

  const { investedAmount, totalInterest, maturityValue } = useMemo(() => {
    let closingBalance = 0;
    const P = yearlyInvestment;
    const i = rateOfInterest / 100;
    const n = timePeriod;

    for (let year = 1; year <= n; year++) {
      let opening = closingBalance;
      let interest = Math.round((opening + P) * i);
      closingBalance = opening + P + interest;
    }

    const invested = P * n;
    const interestEarned = closingBalance - invested;

    return {
      investedAmount: invested,
      totalInterest: interestEarned,
      maturityValue: closingBalance
    };
  }, [yearlyInvestment, timePeriod]);

  const chartData = [
    { name: 'Total Investment', value: investedAmount },
    { name: 'Total Interest', value: totalInterest }
  ];

  return (
    <div className={styles.container}>
      
      <div className={styles.topSection}>
        {/* Left: Inputs */}
        <div className={styles.inputSection}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          
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
                min="500" 
                max="150000" 
                step="500"
                value={yearlyInvestment} 
                onChange={(e) => setYearlyInvestment(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>

          {/* Time Period */}
          <div className={styles.inputGroup}>
            <div className={styles.inputHeader}>
              <label htmlFor="timePeriod" className={styles.label}>Time period (in years)</label>
              <div style={{display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)'}}>
                <input 
                  id="timePeriod"
                  name="timePeriod"
                  aria-label="Time period"
                  type="number" 
                  value={timePeriod} 
                  onChange={(e) => setTimePeriod(Number(e.target.value))}
                  className={styles.numberInput}
                  style={{border: 'none', background: 'transparent', width: '80px', padding: 0}}
                />
                <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Yr</span>
              </div>
            </div>
            <div className={styles.sliderContainer}>
              <input 
                id="timePeriodSlider"
                name="timePeriodSlider"
                aria-label="Time period Slider"
                type="range" 
                min="15" 
                max="50" 
                step="1"
                value={timePeriod} 
                onChange={(e) => setTimePeriod(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>

          {/* Rate of Interest */}
          <div className={styles.inputGroup}>
            <div className={styles.inputHeader}>
              <label htmlFor="rateOfInterest" className={styles.label} style={{ color: 'var(--text-muted)' }}>Rate of interest</label>
              <div style={{display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', opacity: 0.6}}>
                <input 
                  id="rateOfInterest"
                  name="rateOfInterest"
                  aria-label="Rate of interest"
                  type="number" 
                  value={rateOfInterest} 
                  disabled
                  className={styles.numberInput}
                  style={{border: 'none', background: 'transparent', width: '80px', padding: 0}}
                />
                <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>%</span>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)', fontSize: '1.2rem' }}>How is this calculated?</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              PPF interest is calculated annually on the lowest balance between the close of the 5th day and the end of the month. This calculator assumes you deposit the entire yearly investment at the start of the financial year (April) to maximize interest returns.
            </p>
          </div>

        </div>

        {/* Right: Results & Chart */}
        <div className={styles.resultSection}>
          <div className={styles.resultCard} style={{ textAlign: 'center', justifyContent: 'flex-start', overflowY: 'auto' }}>
            
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>Invested Amount</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', paddingBottom: '1.5rem', borderBottom: '1px dashed rgba(255,255,255,0.3)' }}>{formatCurrency(investedAmount)}</div>

            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', marginTop: '1.5rem' }}>Total Interest</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', paddingBottom: '1.5rem', borderBottom: '1px dashed rgba(255,255,255,0.3)' }}>{formatCurrency(totalInterest)}</div>
            
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', marginTop: '1.5rem' }}>Maturity Value</div>
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
