import { handlePlanAdmin } from "@/lib/tier-admin";

export const dynamic = "force-dynamic";

// Manual plan grant/revoke (admin). See handlePlanAdmin for the contract.
export async function POST(request: Request) {
  return handlePlanAdmin(request);
}

export async function DELETE(request: Request) {
  return handlePlanAdmin(request);
}