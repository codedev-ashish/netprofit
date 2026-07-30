import { Metadata } from "next";
import DashboardClient from "./page.client";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
