import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Financial & Tax Calculators',
  description: 'Calculate your income tax, HRA exemptions, SIP returns, and GST easily with NetProfit\'s suite of free financial tools designed for individuals and businesses.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
        <h2>Free Financial Calculators & Business Tools | NetProfit</h2>
        <p>
          Explore our comprehensive suite of free financial tools and calculators. Whether you need to calculate 
          your income tax, determine HRA exemptions, plan your SIP investments, or estimate GST, our easy-to-use 
          utilities provide accurate results to help you plan your finances effectively.
        </p>
      </div>
      {children}
    </>
  );
}

