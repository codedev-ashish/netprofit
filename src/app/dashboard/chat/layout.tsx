import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat with Admin",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
