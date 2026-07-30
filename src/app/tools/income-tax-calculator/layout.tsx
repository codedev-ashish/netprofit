import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: "Income Tax Calculator | Free Financial Calculators | NetProfit"
  },
  description: "Use our free Income Tax Calculator to quickly and accurately calculate your financial and business metrics. Expert tools by NetProfit."
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
        <h1>Income Tax Calculator</h1>
      </div>
      {children}
    </>
  );
}
