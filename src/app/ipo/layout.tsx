import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'IPO Watch',
  description: 'Get the latest IPO news, check your allotment status, and read expert reviews on upcoming Initial Public Offerings in India to make smart investment choices.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
        <h2>Latest IPO Allotment Status, News & Insights | NetProfit</h2>
        <p>
          Keep track of upcoming, ongoing, and recently closed Initial Public Offerings (IPOs) in the Indian
          stock market. Get detailed insights, subscription status, expected listing gains, and expert reviews
          to make informed investment choices in the primary market.
        </p>
      </div>
      {children}
    </>
  );
}

