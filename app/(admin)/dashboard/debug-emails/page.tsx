import { requireRole } from "@/lib/permissions/middleware";
import { UserRole } from "@/app/generated/prisma";
import { DebugEmailsClient } from "./debug-emails-client";

export default async function DebugEmailsPage() {
  await requireRole(UserRole.SUPERADMIN);

  const config = {
    hasApiKey: !!process.env.RESEND_API_KEY,
    hasEmailFrom: !!process.env.EMAIL_FROM,
    hasMonitorEmail: !!process.env.RESEND_INTERNAL_MONITOR,
    emailFrom: process.env.EMAIL_FROM ?? "",
    monitorEmail: process.env.RESEND_INTERNAL_MONITOR ?? "",
  };

  return <DebugEmailsClient config={config} />;
}
