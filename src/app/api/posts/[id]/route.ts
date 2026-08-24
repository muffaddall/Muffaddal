import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deletePost, getPost, updatePost } from "@/lib/posts";
import { parsePostInput } from "@/lib/validate";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/posts/[id]">
) {
  const { id } = await ctx.params;
  const post = await getPost(id);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ post });
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/posts/[id]">
) {
  const { id } = await ctx.params;
  try {
    const body = await request.json();
    const input = parsePostInput(body);
    const post = await updatePost(id, input);
    return NextResponse.json({ post });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/posts/[id]">
) {
  const { id } = await ctx.params;
  await deletePost(id);
  return NextResponse.json({ ok: true });
}
