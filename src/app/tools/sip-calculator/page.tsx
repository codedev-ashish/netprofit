"use client";

import { useState, useMemo, useEffect } from "react";
import styles from "./page.module.css";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import DisclaimerCard from "../../../components/DisclaimerCard";
import ToolHeader from "../../../components/ToolHeader";

export default function SipCalculator() {
  const [mode, setMode] = useState<"SIP" | "LUMPSUM">("SIP");

  // Inputs
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(25000);
  const [lumpsumInvestment, setLumpsumInvestment] = useState<number>(100000);
  const [returnRate, setReturnRate] = useState<number>(12);
  const [timePeriod, setTimePeriod] = useState<number>(10);

  // Ensure component is mounted to avoid Recharts hydration error
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Formatting currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(val));
  };

  // Calculations
  const results = useMemo(() => {
    let invested = 0;
    let totalValue = 0;

    if (mode === "SIP") {
      invested = monthlyInvestment * 12 * timePeriod;
      // Formula: M = P × ({[1 + i]^n – 1} / i) × (1 + i)
      const i = returnRate / 12 / 100;
      const n = timePeriod * 12;
      totalValue = monthlyInvestment * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    } else {
      invested = lumpsumInvestment;
      // Formula: M = P × (1 + r/100)^n
      const r = returnRate / 100;
      totalValue = lumpsumInvestment * Math.pow(1 + r, timePeriod);
    }

    const estReturns = totalValue - invested;

    return {
      invested,
      estReturns,
      totalValue
    };
  }, [mode, monthlyInvestment, lumpsumInvestment, returnRate, timePeriod]);

  // Chart Data
  const chartData = [
    { name: "Invested amount", value: results.invested, color: "#dbeafe" }, // light blue
    { name: "Est. returns", value: results.estReturns, color: "var(--accent-color)" }
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
      <ToolHeader toolSlug="sip-calculator" />
      <div className={styles.container}>
        <div className={styles.calculatorWrapper}>
        {/* Left Side: Inputs */}
        <div className={styles.inputSection}>
          <div className={styles.toggleContainer}>
            <button 
              className={`${styles.toggleBtn} ${mode === "SIP" ? styles.active : ""}`}
              onClick={() => setMode("SIP")}
            >
              SIP
            </button>
            <button 
              className={`${styles.toggleBtn} ${mode === "LUMPSUM" ? styles.active : ""}`}
              onClick={() => setMode("LUMPSUM")}
            >
              Lumpsum
            </button>
          </div>

          {mode === "SIP" ? (
            <div className={styles.inputGroup}>
              <div className={styles.inputHeader}>
                <span className={styles.inputLabel}>Monthly investment</span>
                <div className={styles.inputFieldWrapper}>
                  <span className={styles.inputPrefix}>₹</span>
                  <input 
                    type="number" 
                    className={styles.inputField} 
                    value={monthlyInvestment}
                    onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                  />
                </div>
              </div>
              <input 
                type="range" 
                min="500" 
                max="1000000" 
                step="500"
                className={styles.slider}
                value={monthlyInvestment}
                onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
              />
            </div>
          ) : (
            <div className={styles.inputGroup}>
              <div className={styles.inputHeader}>
                <span className={styles.inputLabel}>Total investment</span>
                <div className={styles.inputFieldWrapper}>
                  <span className={styles.inputPrefix}>₹</span>
                  <input 
                    type="number" 
                    className={styles.inputField} 
                    value={lumpsumInvestment}
                    onChange={(e) => setLumpsumInvestment(Number(e.target.value))}
                  />
                </div>
              </div>
              <input 
                type="range" 
                min="500" 
                max="10000000" 
                step="500"
                className={styles.slider}
                value={lumpsumInvestment}
                onChange={(e) => setLumpsumInvestment(Number(e.target.value))}
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <div className={styles.inputHeader}>
              <span className={styles.inputLabel}>Expected return rate (p.a)</span>
              <div className={styles.inputFieldWrapper}>
                <input 
                  type="number" 
                  className={styles.inputField} 
                  value={returnRate}
                  onChange={(e) => setReturnRate(Number(e.target.value))}
                />
                <span className={styles.inputSuffix}>%</span>
              </div>
            </div>
            <input 
              type="range" 
              min="1" 
              max="30" 
              step="0.1"
              className={styles.slider}
              value={returnRate}
              onChange={(e) => setReturnRate(Number(e.target.value))}
            />
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.inputHeader}>
              <span className={styles.inputLabel}>Time period</span>
              <div className={styles.inputFieldWrapper}>
                <input 
                  type="number" 
                  className={styles.inputField} 
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(Number(e.target.value))}
                />
                <span className={styles.inputSuffix}>Yr</span>
              </div>
            </div>
            <input 
              type="range" 
              min="1" 
              max="40" 
              step="1"
              className={styles.slider}
              value={timePeriod}
              onChange={(e) => setTimePeriod(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Right Side: Outputs & Chart */}
        <div className={styles.outputSection}>
          <div className={styles.resultsGrid}>
            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>
                <div className={styles.colorDot} style={{ background: "#dbeafe" }}></div>
                Invested amount
              </span>
              <span className={styles.resultValue}>{formatCurrency(results.invested)}</span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>
                <div className={styles.colorDot} style={{ background: "var(--accent-color)" }}></div>
                Est. returns
              </span>
              <span className={styles.resultValue}>{formatCurrency(results.estReturns)}</span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.resultLabel} style={{ fontWeight: 600 }}>Total value</span>
              <span className={styles.resultValue} style={{ color: "var(--accent-color)", fontSize: "1.5rem" }}>
                {formatCurrency(results.totalValue)}
              </span>
            </div>
          </div>

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
          
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', fontSize: '1.1rem' }}>
            INVEST NOW
          </button>
        </div>
        </div>
        <DisclaimerCard toolSlug="sip-calculator" />
      </div>
    </>
  );
}
