import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createGroup, getGroups } from "@/lib/groups";

export async function GET() {
  const groups = await getGroups();
  return NextResponse.json({ groups });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) throw new Error("Group name is required");

    const group = await createGroup(name);
    return NextResponse.json({ group }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
