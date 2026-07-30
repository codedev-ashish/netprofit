import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Services",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
