import { getClients } from "@/actions/clients";
import { ClientsManager } from "@/components/dashboard/clients";
import { requireRole } from "@/lib/permissions/middleware";
import { UserRole } from "@/app/generated/prisma";

export default async function ClientsPage() {
  const { branchId } = await requireRole(UserRole.ADMIN);

  const clientsResult = await getClients(branchId);
  const clients =
    clientsResult.success && clientsResult.data ? clientsResult.data : [];

  return <ClientsManager branchId={branchId} initialClients={clients} />;
}
