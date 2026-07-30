import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Professional Services',
  description: 'Discover complete corporate solutions, GST filing, legal services, and licensing with NetProfit. Secure and expert-led compliance for your business.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}

