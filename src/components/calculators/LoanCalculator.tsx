"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import styles from './LoanCalculator.module.css';
import { ChevronDown, ChevronRight, FileDown, PlusSquare, MinusSquare } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LoanCalculatorProps {
  title?: string;
  defaultAmount?: number;
  defaultRate?: number;
  defaultTenure?: number;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

const formatDecimalCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
};

const COLORS = ['#84cc16', '#f97316', '#ef4444']; // Green for Principal, Orange for Interest, Red for Fees

export default function LoanCalculator({ 
  title = "Loan Calculator", 
  defaultAmount = 5000000, 
  defaultRate = 9, 
  defaultTenure = 20 
}: LoanCalculatorProps) {
  const [amount, setAmount] = useState(defaultAmount);
  const [rate, setRate] = useState(defaultRate);
  const [tenure, setTenure] = useState(defaultTenure);
  const [tenureType, setTenureType] = useState<'Yr' | 'Mo'>('Yr');
  const [feesRate, setFeesRate] = useState(2); // 2% default fees
  const [feesType, setFeesType] = useState<"%" | "₹">("%");
  
  const [startMonth, setStartMonth] = useState(new Date().getMonth());
  const [startYear, setStartYear] = useState(new Date().getFullYear());

  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});

  const toggleYear = (year: number) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const calculateAPR = (principal: number, emi: number, tenureMonths: number, totalFees: number): number => {
    if (emi <= 0 || tenureMonths <= 0) return 0;
    const target = principal - totalFees;
    let low = 0.0;
    let high = 1.0; 
    let aprMonthly = 0;
    
    // Binary search for IRR
    for (let i = 0; i < 50; i++) {
      aprMonthly = (low + high) / 2;
      const pv = aprMonthly === 0 ? emi * tenureMonths : emi * (1 - Math.pow(1 + aprMonthly, -tenureMonths)) / aprMonthly;
      if (pv > target) {
        low = aprMonthly;
      } else {
        high = aprMonthly;
      }
    }
    return aprMonthly * 12 * 100;
  };

  const { emi, totalInterest, totalPayment, schedule, totalFees, apr } = useMemo(() => {
    const P = amount;
    const R = rate / 12 / 100;
    const N = tenureType === 'Yr' ? tenure * 12 : tenure;
    
    let calcEmi = 0;
    if (R === 0) {
      calcEmi = N > 0 ? P / N : 0;
    } else {
      calcEmi = N > 0 ? (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1) : 0;
    }

    const tFees = P * (feesRate / 100);
    const totalInt = (calcEmi * N) - P;
    const totalPay = P + totalInt + tFees;
    const calcApr = calculateAPR(P, calcEmi, N, tFees);

    // Amortization Schedule
    const sched = [];
    let balance = P;
    let currentMonth = startMonth;
    let currentYear = startYear;

    let yearPrincipal = 0;
    let yearInterest = 0;
    let yearPayment = 0;
    let monthRows = [];

    for (let i = 1; i <= N; i++) {
      const intForMonth = balance * R;
      let prinForMonth = calcEmi - intForMonth;
      
      // Handle rounding issues on last month
      if (i === N) {
        prinForMonth = balance;
        calcEmi = prinForMonth + intForMonth;
      }

      balance = balance - prinForMonth;
      if (balance < 0) balance = 0;

      yearPrincipal += prinForMonth;
      yearInterest += intForMonth;
      yearPayment += calcEmi;

      monthRows.push({
        monthName: MONTHS[currentMonth],
        principal: prinForMonth,
        interest: intForMonth,
        payment: calcEmi,
        balance: balance,
        paidToDate: ((P - balance) / P) * 100
      });

      currentMonth++;
      if (currentMonth > 11 || i === N) {
        sched.push({
          year: currentYear,
          principal: yearPrincipal,
          interest: yearInterest,
          payment: yearPayment,
          balance: balance,
          paidToDate: ((P - balance) / P) * 100,
          months: monthRows
        });
        
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
        
        yearPrincipal = 0;
        yearInterest = 0;
        yearPayment = 0;
        monthRows = [];
      }
    }

    return { 
      emi: calcEmi, 
      totalInterest: totalInt < 0 ? 0 : totalInt, 
      totalPayment: totalPay,
      schedule: sched,
      totalFees: tFees,
      apr: calcApr
    };
  }, [amount, rate, tenure, tenureType, startMonth, startYear, feesRate]);

  const downloadExcel = async () => {
    // Dynamically import exceljs only on the client when needed
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Amortization Schedule');

    worksheet.columns = [
      { header: 'Year', key: 'year', width: 12 },
      { header: 'Month', key: 'month', width: 12 },
      { header: 'Principal (\u20B9)', key: 'principal', width: 18 },
      { header: 'Interest (\u20B9)', key: 'interest', width: 18 },
      { header: 'Total Payment (\u20B9)', key: 'payment', width: 20 },
      { header: 'Balance (\u20B9)', key: 'balance', width: 18 },
      { header: 'Loan Paid To Date (%)', key: 'paidToDate', width: 22 },
    ];

    // Style Header Row
    const headerRow = worksheet.getRow(1);
    for (let i = 1; i <= 7; i++) {
      const cell = headerRow.getCell(i);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      
      let bgColor = 'FF1E293B'; // Default dark slate
      if (i === 3) bgColor = 'FF84CC16'; // Principal
      else if (i === 4) bgColor = 'FFF97316'; // Interest
      else if (i === 6) bgColor = 'FFBE123C'; // Balance

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    schedule.forEach(y => {
      const yearRow = worksheet.addRow({
        year: y.year,
        month: '',
        principal: Math.round(y.principal),
        interest: Math.round(y.interest),
        payment: Math.round(y.payment),
        balance: Math.round(y.balance),
        paidToDate: `${y.paidToDate.toFixed(2)}%`
      });
      
      for (let i = 1; i <= 7; i++) {
        const cell = yearRow.getCell(i);
        cell.font = { bold: true, color: { argb: 'FF000000' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2E8F0' }
        };
      }

      y.months.forEach(m => {
        worksheet.addRow({
          year: y.year,
          month: m.monthName,
          principal: Math.round(m.principal),
          interest: Math.round(m.interest),
          payment: Math.round(m.payment),
          balance: Math.round(m.balance),
          paidToDate: `${m.paidToDate.toFixed(2)}%`
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Amortization_Schedule.xlsx");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Amortization Schedule", 14, 15);
    
    const formatNumber = (val: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);
    
    const tableData: any[] = [];
    schedule.forEach(y => {
      tableData.push([
        y.year.toString(),
        "",
        formatNumber(y.principal),
        formatNumber(y.interest),
        formatNumber(y.payment),
        formatNumber(y.balance),
        `${y.paidToDate.toFixed(2)}%`
      ]);
      y.months.forEach(m => {
        tableData.push([
          y.year.toString(),
          m.monthName,
          formatNumber(m.principal),
          formatNumber(m.interest),
          formatNumber(m.payment),
          formatNumber(m.balance),
          `${m.paidToDate.toFixed(2)}%`
        ]);
      });
    });

    autoTable(doc, {
      startY: 20,
      head: [['Year', 'Month', 'Principal (Rs)', 'Interest (Rs)', 'Total Payment (Rs)', 'Balance (Rs)', 'Paid (%)']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, textColor: [0, 0, 0] },
      didParseCell: function(data: any) {
        if (data.section === 'head') {
          if (data.column.index === 2) data.cell.styles.fillColor = '#84cc16';
          else if (data.column.index === 3) data.cell.styles.fillColor = '#f97316';
          else if (data.column.index === 5) data.cell.styles.fillColor = '#be123c';
          else data.cell.styles.fillColor = '#1e293b';
          
          data.cell.styles.textColor = '#ffffff';
          data.cell.styles.halign = 'center';
          data.cell.styles.valign = 'middle';
        }
        if (data.section === 'body' && data.row.raw[1] === "") {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [226, 232, 240];
          data.cell.styles.textColor = [0, 0, 0];
        }
      }
    });

    doc.save("Amortization_Schedule.pdf");
  };

  const chartData = [
    { name: 'Principal', value: amount },
    { name: 'Interest', value: totalInterest },
    { name: 'Fees & Charges', value: totalFees }
  ];

  return (
    <div className={styles.container}>
      
      <div className={styles.topSection}>
        {/* Left: Inputs */}
        <div className={styles.inputSection}>
          <h2 className={styles.sectionTitle}>Basic Details</h2>
          
          {/* Amount */}
          <div className={styles.inputGroup}>
            <div className={styles.inputHeader}>
              <label className={styles.label}>Home Loan Amount</label>
              <div style={{display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)'}}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.5rem' }}>₹</span>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className={styles.numberInput}
                  style={{border: 'none', background: 'transparent', width: '120px', padding: 0}}
                />
              </div>
            </div>
            <div className={styles.sliderContainer}>
              <input 
                type="range" 
                min="100000" 
                max="20000000" 
                step="100000"
                value={amount} 
                onChange={(e) => setAmount(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>

          {/* Interest */}
          <div className={styles.inputGroup}>
            <div className={styles.inputHeader}>
              <label className={styles.label}>Interest Rate</label>
              <div style={{display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)'}}>
                <input 
                  type="number" 
                  value={rate} 
                  step="0.1"
                  onChange={(e) => setRate(Number(e.target.value))}
                  className={styles.numberInput}
                  style={{border: 'none', background: 'transparent', width: '80px', padding: 0}}
                />
                <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>%</span>
              </div>
            </div>
            <div className={styles.sliderContainer}>
              <input 
                type="range" 
                min="5" 
                max="20" 
                step="0.1"
                value={rate} 
                onChange={(e) => setRate(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>

          {/* Tenure */}
          <div className={styles.inputGroup}>
            <div className={styles.inputHeader}>
              <label className={styles.label}>Loan Tenure</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  value={tenure} 
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className={styles.numberInput}
                  style={{ width: '80px' }}
                />
                <div className={styles.toggleGroup}>
                  <button type="button" className={`${styles.toggleBtn} ${tenureType === 'Yr' ? styles.active : ''}`} onClick={() => setTenureType('Yr')}>Yr</button>
                  <button type="button" className={`${styles.toggleBtn} ${tenureType === 'Mo' ? styles.active : ''}`} onClick={() => setTenureType('Mo')}>Mo</button>
                </div>
              </div>
            </div>
            <div className={styles.sliderContainer}>
              <input 
                type="range" 
                min="1" 
                max={tenureType === 'Yr' ? 30 : 360} 
                step="1"
                value={tenure} 
                onChange={(e) => setTenure(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>

          {/* Fees & Charges */}
          <div className={styles.inputGroup}>
            <div className={styles.inputHeader}>
              <label className={styles.label}>Fees & Charges</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  value={feesType === '%' ? Number(feesRate.toFixed(2)) : Math.round(amount * (feesRate / 100))} 
                  step={feesType === '%' ? "0.1" : "100"}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (feesType === '%') setFeesRate(val);
                    else setFeesRate(amount > 0 ? (val / amount) * 100 : 0);
                  }}
                  className={styles.numberInput}
                  style={{ width: '90px' }}
                />
                <div className={styles.toggleGroup}>
                  <button type="button" className={`${styles.toggleBtn} ${feesType === '%' ? styles.active : ''}`} onClick={() => setFeesType('%')}>%</button>
                  <button type="button" className={`${styles.toggleBtn} ${feesType === '₹' ? styles.active : ''}`} onClick={() => setFeesType('₹')}>₹</button>
                </div>
              </div>
            </div>
            <div className={styles.sliderContainer}>
              <input 
                type="range" 
                min="0" 
                max="5" 
                step="0.1"
                value={feesRate} 
                onChange={(e) => setFeesRate(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>

        </div>

        {/* Right: Results & Chart */}
        <div className={styles.resultSection}>
          <div className={styles.resultCard} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>Loan EMI</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', paddingBottom: '1.5rem', borderBottom: '1px dashed rgba(255,255,255,0.3)' }}>{formatCurrency(emi)}</div>

            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', marginTop: '1.5rem' }}>Loan APR</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', paddingBottom: '1.5rem', borderBottom: '1px dashed rgba(255,255,255,0.3)' }}>{apr.toFixed(2)} %</div>
            
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', marginTop: '1.5rem' }}>Total Interest Payable</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', paddingBottom: '1.5rem', borderBottom: '1px dashed rgba(255,255,255,0.3)' }}>{formatCurrency(totalInterest)}</div>
            
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', marginTop: '1.5rem' }}>
              Total Payment <br/> <span style={{fontSize: '0.9rem', fontWeight: 400}}>(Principal + Interest + Fees & Charges)</span>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>{formatCurrency(totalPayment)}</div>
          </div>

        </div>
      </div>

      {/* Charts Section: Pie Chart & Bar/Line Chart Side by Side */}
      <div className={`${styles.scheduleSection} ${styles.chartsGrid}`} style={{ padding: '2rem 1.5rem', marginBottom: '2rem' }}>
        
        {/* Left: Pie Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '1rem', textAlign: 'center' }}>Break-up of Total Payment</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Bar + Line Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '1rem', textAlign: 'center' }}>Amortization Graph</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={schedule} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <CartesianGrid stroke="#f5f5f5" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis yAxisId="left" tickFormatter={(v) => `₹ ${v >= 100000 ? (v/100000).toFixed(1) + 'L' : v}`} axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} label={{ value: 'Balance', angle: -90, position: 'insideLeft', offset: -10, style: {fontWeight: 600} }} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `₹ ${v >= 100000 ? (v/100000).toFixed(1) + 'L' : v}`} axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} label={{ value: 'EMI Payment / year', angle: -90, position: 'insideRight', offset: -10, style: {fontWeight: 600} }} />
                <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} />
                <Legend verticalAlign="bottom" height={36}/>
                <Bar yAxisId="right" dataKey="principal" name="Principal" stackId="a" fill="#84cc16" maxBarSize={60} />
                <Bar yAxisId="right" dataKey="interest" name="Interest" stackId="a" fill="#f97316" maxBarSize={60} />
                <Line yAxisId="left" type="monotone" dataKey="balance" name="Balance" stroke="#be123c" strokeWidth={2} dot={{ r: 4, fill: '#be123c' }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Amortization Schedule */}
      <div className={styles.scheduleSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 className={styles.scheduleTitle} style={{ margin: 0 }}>Amortization Schedule</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={downloadExcel}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                <FileDown size={18} /> Excel
              </button>
              <button 
                onClick={downloadPDF}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                <FileDown size={18} /> PDF
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Schedule Start Date:</span>
              <select className={styles.dateSelect} value={startMonth} onChange={(e) => setStartMonth(Number(e.target.value))}>
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select className={styles.dateSelect} value={startYear} onChange={(e) => setStartYear(Number(e.target.value))}>
                {Array.from({length: 20}).map((_, i) => {
                  const y = new Date().getFullYear() - 5 + i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ textAlign: 'center', verticalAlign: 'middle' }}>Year</th>
                <th style={{ background: '#84cc16', color: 'white', textAlign: 'center', verticalAlign: 'middle', opacity: 1 }}>Principal <br/><span style={{fontSize: '0.8rem', fontWeight: 500}}>(A)</span></th>
                <th style={{ background: '#f97316', color: 'white', textAlign: 'center', verticalAlign: 'middle', opacity: 1 }}>Interest <br/><span style={{fontSize: '0.8rem', fontWeight: 500}}>(B)</span></th>
                <th style={{ textAlign: 'center', verticalAlign: 'middle' }}>Total Payment <br/><span style={{fontSize: '0.8rem', fontWeight: 500}}>(A+B)</span></th>
                <th style={{ background: '#be123c', color: 'white', textAlign: 'center', verticalAlign: 'middle', opacity: 1 }}>Balance</th>
                <th style={{ textAlign: 'center', verticalAlign: 'middle' }}>Loan Paid <br/><span style={{fontSize: '0.8rem', fontWeight: 500}}>To Date</span></th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((yearData) => (
                <React.Fragment key={yearData.year}>
                  <tr className={styles.yearRow} onClick={() => toggleYear(yearData.year)}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-color)', fontWeight: 700 }}>
                      {expandedYears[yearData.year] ? <MinusSquare size={16} /> : <PlusSquare size={16} />}
                      {yearData.year}
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatDecimalCurrency(yearData.principal)}</td>
                    <td style={{ textAlign: 'right' }}>{formatDecimalCurrency(yearData.interest)}</td>
                    <td style={{ textAlign: 'right' }}>{formatDecimalCurrency(yearData.payment)}</td>
                    <td style={{ textAlign: 'right' }}>{formatDecimalCurrency(yearData.balance)}</td>
                    <td style={{ textAlign: 'right' }}>{yearData.paidToDate.toFixed(2)}%</td>
                  </tr>
                  
                  {expandedYears[yearData.year] && yearData.months.map((monthData, idx) => (
                    <tr key={`${yearData.year}-${idx}`} className={styles.monthRow}>
                      <td style={{ paddingLeft: '2.5rem' }}>{monthData.monthName}</td>
                      <td style={{ textAlign: 'right' }}>{formatDecimalCurrency(monthData.principal)}</td>
                      <td style={{ textAlign: 'right' }}>{formatDecimalCurrency(monthData.interest)}</td>
                      <td style={{ textAlign: 'right' }}>{formatDecimalCurrency(monthData.payment)}</td>
                      <td style={{ textAlign: 'right' }}>{formatDecimalCurrency(monthData.balance)}</td>
                      <td style={{ textAlign: 'right' }}>{monthData.paidToDate.toFixed(2)}%</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
