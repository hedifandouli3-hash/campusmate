import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/data/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  const { enrollmentReference: _hidden, ...safeUser } = user;
  void _hidden;
  return NextResponse.json({ user: safeUser });
}
