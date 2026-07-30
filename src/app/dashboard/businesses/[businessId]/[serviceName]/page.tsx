import { redirect } from "next/navigation";

export default async function ServiceRedirectorPage(props: { params: Promise<{ businessId: string, serviceName: string }> }) {
  const params = await props.params;
  redirect(`/dashboard/businesses/${params.businessId}/${params.serviceName}/2026-27`);
}
