import { NextResponse } from "next/server";
import { ensureStoreHydrated, persistStore, requireUser } from "@/lib/data/store";

export async function GET() {
  try {
    const user = await requireUser();
    const store = await ensureStoreHydrated();
    const notifications = store.notifications.filter((n) => n.userId === user.id);
    return NextResponse.json({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const store = await ensureStoreHydrated();

    if (body.markAll) {
      for (const n of store.notifications) {
        if (n.userId === user.id) n.isRead = true;
      }
    } else if (body.id) {
      const target = store.notifications.find((n) => n.id === body.id && n.userId === user.id);
      if (target) target.isRead = true;
    }

    await persistStore(store);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}
