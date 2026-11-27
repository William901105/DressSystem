import { redirect } from "next/navigation";
import { AccessForm } from "@/components/access-form";
import { configuration, hasAccess } from "@/lib/server/access";

export const dynamic = "force-dynamic";

export default async function AccessPage() {
  const config = configuration();
  if (await hasAccess()) redirect("/");
  return <AccessForm configured={Boolean(config)} />;
}
