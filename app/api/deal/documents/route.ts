import { getDocuments } from "@/lib/mock-data/api";
import { DocumentsResponseSchema } from "@/lib/schemas/types";

export async function GET() {
  const data = await getDocuments();
  return Response.json(DocumentsResponseSchema.parse(data));
}
