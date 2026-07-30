import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: "Term Loan Calculator | Free Financial Calculators | NetProfit"
  },
  description: "Use our free Term Loan Calculator to quickly and accurately calculate your financial and business metrics. Expert tools by NetProfit."
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
        <h1>Term Loan Calculator</h1>
      </div>
      {children}
    </>
  );
}
