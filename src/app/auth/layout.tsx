import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Log in or register to access your secure NetProfit dashboard. Manage tax filings, track corporate compliance, and seamlessly request expert CA services.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
        <h2>Secure Login and Registration</h2>
        <p>
          Sign in to your NetProfit account or register a new account to manage your tax filings, track your 
          service requests, access premium tools, and communicate with our professional advisors. We prioritize 
          your data security and privacy at every step.
        </p>
      </div>
      {children}
    </>
  );
}

