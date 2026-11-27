import { redirect } from "next/navigation";
import { AccessForm } from "@/components/access-form";
import { configuration, hasAccess } from "@/lib/server/access";

export default async function AccessPage() {
  const config = configuration();
  if (await hasAccess()) redirect("/");
  return <AccessForm configured={Boolean(config)} />;
}
