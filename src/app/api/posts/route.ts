import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createPost, getPostsForRange } from "@/lib/posts";
import { parsePostInput } from "@/lib/validate";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json(
      { error: "start and end query params are required" },
      { status: 400 }
    );
  }

  const posts = await getPostsForRange(start, end);
  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = parsePostInput(body);
    const post = await createPost(input);
    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
