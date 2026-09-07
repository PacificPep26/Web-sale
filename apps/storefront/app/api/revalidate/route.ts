import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

/**
 * Called by a Medusa subscriber on product / price / category changes:
 *   POST /api/revalidate?secret=…&tag=products
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const tags = searchParams.getAll("tag");
  for (const t of tags.length ? tags : ["products", "categories", "regions"]) {
    revalidateTag(t, "max");
  }
  return NextResponse.json({ ok: true, revalidated: tags });
}
