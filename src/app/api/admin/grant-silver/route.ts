import { handleTierGrant } from "@/lib/tier-admin";

export async function POST(request: Request) {
  return handleTierGrant(request, "SILVER");
}

export async function DELETE(request: Request) {
  return handleTierGrant(request, "SILVER");
}
