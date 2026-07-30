import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Latest Financial News',
  description: 'Stay informed with the latest financial news, tax regulations, GST updates, and business insights in India. Make smarter decisions with NetProfit\'s daily news.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}

