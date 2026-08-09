import { getCurrentUser, jsonError } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("Authentication required", 401);
  }
  return Response.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
