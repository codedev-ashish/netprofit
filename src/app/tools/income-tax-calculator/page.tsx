"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { calculateOldRegime, calculateNewRegime, TaxParams, TaxResult } from "../../../lib/taxCalculator";
import DisclaimerCard from "../../../components/DisclaimerCard";
import ToolHeader from "../../../components/ToolHeader";

export default function ToolsPage() {
  const [params, setParams] = useState<TaxParams>({
    age: "below60",
    grossSalary: 0,
    houseProperty: 0,
    capitalGains: 0,
    otherSources: 0,
    deduction80C: 0,
    deduction80D: 0,
    deduction80G: 0,
    deductionOther: 0,
    applicableAct: "1961",
    taxpayerCategory: "Individual",
    residentialStatus: "RES",
    period: "2024-25",
  });

  const [oldTax, setOldTax] = useState<TaxResult | null>(null);
  const [newTax, setNewTax] = useState<TaxResult | null>(null);

  const handleInputChange = (field: keyof TaxParams, value: any) => {
    setParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-calculate on change
  useEffect(() => {
    setOldTax(calculateOldRegime(params));
    setNewTax(calculateNewRegime(params));
  }, [params]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(val));
  };

  const isNewRegimeBetter = newTax && oldTax && newTax.totalTax <= oldTax.totalTax;
  const isOldRegimeBetter = newTax && oldTax && oldTax.totalTax < newTax.totalTax;

  return (
    <>
      <ToolHeader toolSlug="income-tax-calculator" initialTitle="Income Tax Calculator" />
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
        <div className={styles.calculatorWrapper}>
          <div className={styles.calculatorCard}>

            <h2 className={styles.sectionTitle}>Basic Details</h2>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label htmlFor="applicableAct">Applicable Act</label>
                <select
                  id="applicableAct"
                  name="applicableAct"
                  aria-label="Applicable Act"
                  className={styles.inputField}
                  value={(params as any).applicableAct || "1961"}
                  onChange={(e) => handleInputChange('applicableAct' as any, e.target.value)}
                >
                  <option value="2025">Income Tax Act 2025 </option>
                  <option value="1961">Income Tax Act 1961 </option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="period">{(params as any).applicableAct === "2025" ? "Tax Year" : "Assessment Year"}</label>
                <select
                  id="period"
                  name="period"
                  aria-label="Assessment Year"
                  className={styles.inputField}
                  value={(params as any).period}
                  onChange={(e) => handleInputChange('period' as any, e.target.value)}
                >
                  {(params as any).applicableAct === "2025" ? (
                    <>
                      <option value="2026-27">2026-27</option>
                    </>
                  ) : (
                    <>
                      <option value="2026-27">2026-27</option>
                    </>
                  )}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="taxpayerCategory">Taxpayer Category</label>
                <select
                  id="taxpayerCategory"
                  name="taxpayerCategory"
                  aria-label="Taxpayer Category"
                  className={styles.inputField}
                  value={(params as any).taxpayerCategory || "Individual"}
                  onChange={(e) => handleInputChange('taxpayerCategory' as any, e.target.value)}
                >
                  <option value="Individual">Individual</option>
                  <option value="HUF">HUF</option>
                  <option value="Firm">Firm</option>
                  <option value="LLP">LLP</option>
                  <option value="Domestic Company">Domestic Company</option>
                  <option value="Foreign Company">Foreign Company</option>
                  <option value="Trust">Trust</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="age">Age Status</label>
                <select
                  id="age"
                  name="age"
                  aria-label="Age Status"
                  className={styles.inputField}
                  value={params.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                >
                  <option value="below60">Below 60 Years</option>
                  <option value="60to79">60 - 79 Years (Senior)</option>
                  <option value="80plus">80+ Years (Super Senior)</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="residentialStatus">Residential Status</label>
                <select
                  id="residentialStatus"
                  name="residentialStatus"
                  aria-label="Residential Status"
                  className={styles.inputField}
                  value={(params as any).residentialStatus || "RES"}
                  onChange={(e) => handleInputChange('residentialStatus' as any, e.target.value)}
                >
                  <option value="RES">RES (Resident)</option>
                  <option value="RNOR">RNOR (Resident but not ordinarily Resident)</option>
                  <option value="NR">NR (Non Resident)</option>
                </select>
              </div>
            </div>

            <h2 className={styles.sectionTitle}>Income Details (₹)</h2>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label htmlFor="grossSalary">Gross Salary</label>
                <input id="grossSalary" name="grossSalary" aria-label="Gross Salary" type="number" min="0" className={styles.inputField} value={params.grossSalary || ''} onChange={(e) => handleInputChange('grossSalary', Number(e.target.value))} placeholder="0" />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="houseProperty">Income from House Property</label>
                <input id="houseProperty" name="houseProperty" aria-label="Income from House Property" type="number" min="0" className={styles.inputField} value={params.houseProperty || ''} onChange={(e) => handleInputChange('houseProperty', Number(e.target.value))} placeholder="0" />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="capitalGains">Income from Capital Gains</label>
                <input id="capitalGains" name="capitalGains" aria-label="Income from Capital Gains" type="number" min="0" className={styles.inputField} value={params.capitalGains || ''} onChange={(e) => handleInputChange('capitalGains', Number(e.target.value))} placeholder="0" />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="otherSources">Income from Other Sources</label>
                <input id="otherSources" name="otherSources" aria-label="Income from Other Sources" type="number" min="0" className={styles.inputField} value={params.otherSources || ''} onChange={(e) => handleInputChange('otherSources', Number(e.target.value))} placeholder="0" />
              </div>
            </div>

            <h2 className={styles.sectionTitle}>Deductions (₹) - Applicable to Old Regime</h2>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label htmlFor="deduction80C">Basic Deductions (80C, 80CCC, 80CCD)</label>
                <input id="deduction80C" name="deduction80C" aria-label="Basic Deductions" type="number" min="0" className={styles.inputField} value={params.deduction80C || ''} onChange={(e) => handleInputChange('deduction80C', Number(e.target.value))} placeholder="0 (Max ₹1.5L)" />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="deduction80D">Medical Insurance (80D)</label>
                <input id="deduction80D" name="deduction80D" aria-label="Medical Insurance" type="number" min="0" className={styles.inputField} value={params.deduction80D || ''} onChange={(e) => handleInputChange('deduction80D', Number(e.target.value))} placeholder="0" />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="deduction80G">Donations (80G)</label>
                <input id="deduction80G" name="deduction80G" aria-label="Donations" type="number" min="0" className={styles.inputField} value={params.deduction80G || ''} onChange={(e) => handleInputChange('deduction80G', Number(e.target.value))} placeholder="0" />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="deductionOther">Other Deductions (Chapter VI-A)</label>
                <input id="deductionOther" name="deductionOther" aria-label="Other Deductions" type="number" min="0" className={styles.inputField} value={params.deductionOther || ''} onChange={(e) => handleInputChange('deductionOther', Number(e.target.value))} placeholder="0" />
              </div>
            </div>

          </div>

          {/* Results Panel */}
          <div className={styles.resultsContainer}>
            {/* New Regime Card */}
            <div className={styles.resultCard} style={{ border: isNewRegimeBetter ? '2px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.2)' }}>
              {isNewRegimeBetter && <span className={styles.winnerBadge}>Recommended</span>}
              <div className={styles.regimeTitle}>New Tax Regime</div>
              <div className={styles.taxAmount}>{formatCurrency(newTax?.totalTax || 0)}</div>

              <div className={styles.breakdownList}>
                <div className={styles.breakdownItem}>
                  <span>Taxable Income</span>
                  <span className={styles.breakdownValue}>{formatCurrency(newTax?.taxableIncome || 0)}</span>
                </div>
                <div className={styles.breakdownItem}>
                  <span>Basic Tax Computed</span>
                  <span className={styles.breakdownValue}>{formatCurrency(newTax?.baseTax || 0)}</span>
                </div>
                {newTax?.rebate87A ? (
                  <div className={styles.breakdownItem}>
                    <span>Rebate u/s 87A</span>
                    <span className={styles.breakdownValue} style={{ color: 'var(--accent-color)' }}>- {formatCurrency(newTax.rebate87A)}</span>
                  </div>
                ) : null}
                {newTax?.surcharge ? (
                  <div className={styles.breakdownItem}>
                    <span>Surcharge</span>
                    <span className={styles.breakdownValue}>{formatCurrency(newTax.surcharge)}</span>
                  </div>
                ) : null}
                <div className={styles.breakdownItem}>
                  <span>Health & Education Cess (4%)</span>
                  <span className={styles.breakdownValue}>{formatCurrency(newTax?.cess || 0)}</span>
                </div>
              </div>
            </div>

            {/* Old Regime Card */}
            <div className={styles.resultCard} style={{ border: isOldRegimeBetter ? '2px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.2)' }}>
              {isOldRegimeBetter && <span className={styles.winnerBadge}>Recommended</span>}
              <div className={styles.regimeTitle}>Old Tax Regime</div>
              <div className={styles.taxAmount}>{formatCurrency(oldTax?.totalTax || 0)}</div>

              <div className={styles.breakdownList}>
                <div className={styles.breakdownItem}>
                  <span>Taxable Income (After Deductions)</span>
                  <span className={styles.breakdownValue}>{formatCurrency(oldTax?.taxableIncome || 0)}</span>
                </div>
                <div className={styles.breakdownItem}>
                  <span>Basic Tax Computed</span>
                  <span className={styles.breakdownValue}>{formatCurrency(oldTax?.baseTax || 0)}</span>
                </div>
                {oldTax?.rebate87A ? (
                  <div className={styles.breakdownItem}>
                    <span>Rebate u/s 87A</span>
                    <span className={styles.breakdownValue} style={{ color: 'var(--accent-color)' }}>- {formatCurrency(oldTax.rebate87A)}</span>
                  </div>
                ) : null}
                {oldTax?.surcharge ? (
                  <div className={styles.breakdownItem}>
                    <span>Surcharge</span>
                    <span className={styles.breakdownValue}>{formatCurrency(oldTax.surcharge)}</span>
                  </div>
                ) : null}
                <div className={styles.breakdownItem}>
                  <span>Health & Education Cess (4%)</span>
                  <span className={styles.breakdownValue}>{formatCurrency(oldTax?.cess || 0)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
          <DisclaimerCard toolSlug="income-tax-calculator" />
        </div>
      </div>
    </>
  );
}
