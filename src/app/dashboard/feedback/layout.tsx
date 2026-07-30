import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback & Support",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
