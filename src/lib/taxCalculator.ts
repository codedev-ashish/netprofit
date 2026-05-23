export interface TaxParams {
  age: "below60" | "60to79" | "80plus";
  grossSalary: number;
  houseProperty: number;
  capitalGains: number;
  otherSources: number;
  deduction80C: number;
  deduction80D: number;
  deduction80G: number;
  deductionOther: number;
  applicableAct: string;
  taxpayerCategory: string;
  residentialStatus: string;
  period: string;
}

export interface TaxResult {
  taxableIncome: number;
  baseTax: number;
  rebate87A: number;
  surcharge: number;
  cess: number;
  totalTax: number;
}

export function calculateOldRegime(params: TaxParams): TaxResult {
  // Standard deduction for salary (max 50,000)
  const stdDeduction = params.grossSalary > 0 ? Math.min(params.grossSalary, 50000) : 0;
  
  const grossIncome = 
    Math.max(0, params.grossSalary - stdDeduction) + 
    params.houseProperty + 
    params.capitalGains + 
    params.otherSources;

  // Cap 80C at 1,50,000
  const max80C = Math.min(params.deduction80C, 150000);
  const totalDeductions = max80C + params.deduction80D + params.deduction80G + params.deductionOther;
  
  let taxableIncome = Math.max(0, grossIncome - totalDeductions);
  let exemptionLimit = 250000;
  
  if (params.age === "60to79") exemptionLimit = 300000;
  if (params.age === "80plus") exemptionLimit = 500000;

  let baseTax = 0;
  let remaining = taxableIncome;

  if (remaining > 1000000) {
    baseTax += (remaining - 1000000) * 0.30;
    remaining = 1000000;
  }
  if (remaining > 500000) {
    baseTax += (remaining - 500000) * 0.20;
    remaining = 500000;
  }
  if (remaining > exemptionLimit) {
    baseTax += (remaining - exemptionLimit) * 0.05;
  }

  // Rebate 87A for Old Regime (Income up to 5L)
  let rebate87A = 0;
  if (taxableIncome <= 500000) {
    rebate87A = Math.min(baseTax, 12500);
  }

  const taxAfterRebate = Math.max(0, baseTax - rebate87A);

  // Surcharge (Simplified: 10% above 50L, 15% above 1Cr, etc.)
  let surcharge = 0;
  if (taxableIncome > 50000000) surcharge = taxAfterRebate * 0.37;
  else if (taxableIncome > 20000000) surcharge = taxAfterRebate * 0.25;
  else if (taxableIncome > 10000000) surcharge = taxAfterRebate * 0.15;
  else if (taxableIncome > 5000000) surcharge = taxAfterRebate * 0.10;

  const taxBeforeCess = taxAfterRebate + surcharge;
  const cess = taxBeforeCess * 0.04;
  const totalTax = taxBeforeCess + cess;

  return { taxableIncome, baseTax, rebate87A, surcharge, cess, totalTax };
}

export function calculateNewRegime(params: TaxParams): TaxResult {
  const isBudget2025 = params.period === "2026-27" || params.applicableAct === "2025";
  
  const maxStdDeduction = isBudget2025 ? 75000 : 50000;
  const stdDeduction = params.grossSalary > 0 ? Math.min(params.grossSalary, maxStdDeduction) : 0;
  
  let taxableIncome = 
    Math.max(0, params.grossSalary - stdDeduction) + 
    params.houseProperty + 
    params.capitalGains + 
    params.otherSources;
    
  let baseTax = 0;
  let remaining = taxableIncome;

  if (isBudget2025) {
    if (remaining > 2400000) {
      baseTax += (remaining - 2400000) * 0.30;
      remaining = 2400000;
    }
    if (remaining > 2000000) {
      baseTax += (remaining - 2000000) * 0.25;
      remaining = 2000000;
    }
    if (remaining > 1600000) {
      baseTax += (remaining - 1600000) * 0.20;
      remaining = 1600000;
    }
    if (remaining > 1200000) {
      baseTax += (remaining - 1200000) * 0.15;
      remaining = 1200000;
    }
    if (remaining > 800000) {
      baseTax += (remaining - 800000) * 0.10;
      remaining = 800000;
    }
    if (remaining > 400000) {
      baseTax += (remaining - 400000) * 0.05;
    }
  } else {
    // Old logic for AY 2024-25 / 2025-26
    if (remaining > 1500000) {
      baseTax += (remaining - 1500000) * 0.30;
      remaining = 1500000;
    }
    if (remaining > 1200000) {
      baseTax += (remaining - 1200000) * 0.20;
      remaining = 1200000;
    }
    if (remaining > 900000) {
      baseTax += (remaining - 900000) * 0.15;
      remaining = 900000;
    }
    if (remaining > 600000) {
      baseTax += (remaining - 600000) * 0.10;
      remaining = 600000;
    }
    if (remaining > 300000) {
      baseTax += (remaining - 300000) * 0.05;
    }
  }

  let rebate87A = 0;
  if (isBudget2025) {
    if (taxableIncome <= 1200000) {
      rebate87A = Math.min(baseTax, 60000);
    } else {
      // Marginal relief
      let extraIncome = taxableIncome - 1200000;
      if (baseTax > extraIncome && extraIncome > 0) {
        rebate87A = baseTax - extraIncome;
      }
    }
  } else {
    if (taxableIncome <= 700000) {
      rebate87A = Math.min(baseTax, 25000);
    } else {
      // Marginal relief
      let extraIncome = taxableIncome - 700000;
      if (baseTax > extraIncome && extraIncome > 0) {
        rebate87A = baseTax - extraIncome;
      }
    }
  }

  const taxAfterRebate = Math.max(0, baseTax - rebate87A);

  let surcharge = 0;
  if (taxableIncome > 20000000) surcharge = taxAfterRebate * 0.25;
  else if (taxableIncome > 10000000) surcharge = taxAfterRebate * 0.15;
  else if (taxableIncome > 5000000) surcharge = taxAfterRebate * 0.10;

  const taxBeforeCess = taxAfterRebate + surcharge;
  const cess = taxBeforeCess * 0.04;
  const totalTax = taxBeforeCess + cess;

  return { taxableIncome, baseTax, rebate87A, surcharge, cess, totalTax };
}
