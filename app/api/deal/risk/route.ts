import { getRisk } from "@/lib/mock-data/api";
import { RiskResponseSchema } from "@/lib/schemas/types";

export async function GET() {
  const data = await getRisk();
  return Response.json(RiskResponseSchema.parse(data));
}
