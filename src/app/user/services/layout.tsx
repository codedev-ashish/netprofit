import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buy Services",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
