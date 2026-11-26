import { NextResponse } from "next/server";
import { clearServerSessionCookie } from "@/lib/security/session";

export async function POST() {
  await clearServerSessionCookie();
  return NextResponse.json({ ok: true });
}
