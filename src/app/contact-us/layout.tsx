import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with NetProfit\'s expert CAs for assistance with GST, ITR, company registration, and legal compliance. We offer 100% human-led reliable support.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
        <h2>Contact Us For Tax & Registration Support | NetProfit</h2>
        <p>
          Reach out to NetProfit for reliable, human-led support regarding your tax filing, business registration,
          and compliance requirements. Our experts are ready to assist you.
        </p>
      </div>
      {children}
    </>
  );
}

