"use client";

import { useState, useMemo, useEffect } from "react";
import styles from "./page.module.css";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import DisclaimerCard from "../../../components/DisclaimerCard";
import ToolHeader from "../../../components/ToolHeader";

export default function HRACalculator({ initialTitle }: { initialTitle?: string }) {
  // Inputs (Annual values)
  const [basicSalary, setBasicSalary] = useState<number>(600000);
  const [hraReceived, setHraReceived] = useState<number>(240000);
  const [rentPaid, setRentPaid] = useState<number>(240000);
  const [isMetro, setIsMetro] = useState<boolean>(true);

  // Ensure component is mounted to avoid Recharts hydration error
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    document.title = "HRA Exemption Calculator | NetProfit";
  }, []);

  // Formatting currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(val));
  };

  // Calculations
  const results = useMemo(() => {
    // Bound 1: Actual HRA received
    const bound1 = hraReceived;
    
    // Bound 2: Actual rent paid minus 10% of basic salary
    const bound2 = Math.max(0, rentPaid - (0.1 * basicSalary));
    
    // Bound 3: 50% (Metro) or 40% (Non-Metro) of basic salary
    const bound3 = isMetro ? 0.5 * basicSalary : 0.4 * basicSalary;

    const exemptHRA = Math.max(0, Math.min(bound1, bound2, bound3));
    const taxableHRA = Math.max(0, hraReceived - exemptHRA);

    return {
      bound1,
      bound2,
      bound3,
      exemptHRA,
      taxableHRA,
      totalHRA: hraReceived
    };
  }, [basicSalary, hraReceived, rentPaid, isMetro]);

  // Chart Data
  const chartData = [
    { name: "Exempt HRA", value: results.exemptHRA, color: "#10b981" }, // green
    { name: "Taxable HRA", value: results.taxableHRA, color: "#ef4444" }  // red
  ];
  
  // Custom Tooltip for Chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)' }}>
          <p style={{ margin: '0 0 4px 0', color: data.color, fontWeight: 700 }}>{data.name}</p>
          <p style={{ margin: 0, color: 'var(--text-color)', fontWeight: 600 }}>
            {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <ToolHeader toolSlug="hra-calculator" initialTitle="HRA Calculator" />
      <div className={styles.container}>
        <div className={styles.calculatorWrapper}>
        {/* Left Side: Inputs */}
        <div className={styles.inputSection}>
          <div className={styles.toggleContainer}>
            <button 
              className={`${styles.toggleBtn} ${isMetro ? styles.active : ""}`}
              onClick={() => setIsMetro(true)}
            >
              Metro City
            </button>
            <button 
              className={`${styles.toggleBtn} ${!isMetro ? styles.active : ""}`}
              onClick={() => setIsMetro(false)}
            >
              Non-Metro City
            </button>
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.inputHeader}>
              <label htmlFor="basicSalary" className={styles.inputLabel}>Basic Salary + DA (Annual)</label>
              <div className={styles.inputFieldWrapper}>
                <span className={styles.inputPrefix}>₹</span>
                <input 
                  id="basicSalary"
                  name="basicSalary"
                  aria-label="Basic Salary"
                  type="number" 
                  className={styles.inputField} 
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(Number(e.target.value))}
                />
              </div>
            </div>
            <input 
              id="basicSalarySlider"
              name="basicSalarySlider"
              aria-label="Basic Salary Slider"
              type="range" 
              min="100000" 
              max="10000000" 
              step="10000"
              className={styles.slider}
              value={basicSalary}
              onChange={(e) => setBasicSalary(Number(e.target.value))}
            />
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.inputHeader}>
              <label htmlFor="hraReceived" className={styles.inputLabel}>HRA Received (Annual)</label>
              <div className={styles.inputFieldWrapper}>
                <span className={styles.inputPrefix}>₹</span>
                <input 
                  id="hraReceived"
                  name="hraReceived"
                  aria-label="HRA Received"
                  type="number" 
                  className={styles.inputField} 
                  value={hraReceived}
                  onChange={(e) => setHraReceived(Number(e.target.value))}
                />
              </div>
            </div>
            <input 
              id="hraReceivedSlider"
              name="hraReceivedSlider"
              aria-label="HRA Received Slider"
              type="range" 
              min="0" 
              max="5000000" 
              step="5000"
              className={styles.slider}
              value={hraReceived}
              onChange={(e) => setHraReceived(Number(e.target.value))}
            />
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.inputHeader}>
              <label htmlFor="rentPaid" className={styles.inputLabel}>Total Rent Paid (Annual)</label>
              <div className={styles.inputFieldWrapper}>
                <span className={styles.inputPrefix}>₹</span>
                <input 
                  id="rentPaid"
                  name="rentPaid"
                  aria-label="Total Rent Paid"
                  type="number" 
                  className={styles.inputField} 
                  value={rentPaid}
                  onChange={(e) => setRentPaid(Number(e.target.value))}
                />
              </div>
            </div>
            <input 
              id="rentPaidSlider"
              name="rentPaidSlider"
              aria-label="Total Rent Paid Slider"
              type="range" 
              min="0" 
              max="5000000" 
              step="5000"
              className={styles.slider}
              value={rentPaid}
              onChange={(e) => setRentPaid(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Right Side: Outputs & Chart */}
        <div className={styles.outputSection}>
          <div className={styles.resultsGrid}>
            <div className={styles.resultItem}>
              <span className={styles.resultLabel} style={{ fontWeight: 600 }}>
                <div className={styles.colorDot} style={{ background: "#10b981" }}></div>
                Exempt HRA (Tax Free)
              </span>
              <span className={styles.resultValue} style={{ color: "#10b981", fontSize: "1.75rem", fontWeight: 800 }}>
                {formatCurrency(results.exemptHRA)}
              </span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>
                <div className={styles.colorDot} style={{ background: "#ef4444" }}></div>
                Taxable HRA
              </span>
              <span className={styles.resultValue}>{formatCurrency(results.taxableHRA)}</span>
            </div>
          </div>

          {results.totalHRA > 0 && (
            <div style={{ width: "100%", height: 250 }}>
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
          
          <div style={{ marginTop: '1.5rem', width: '100%', fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-color)' }}>Exemption is least of:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>1. Actual HRA:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(results.bound1)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>2. Rent - 10% of Basic:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(results.bound2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>3. {isMetro ? '50%' : '40%'} of Basic:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(results.bound3)}</span>
            </div>
          </div>
        </div>
        </div>
        <DisclaimerCard toolSlug="hra-calculator" />
      </div>
    </>
  );
}
