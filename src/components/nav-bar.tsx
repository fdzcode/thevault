import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { NavBarClient } from "./nav-bar-client";

export async function NavBar() {
  const session = await auth();
  const user = session
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
    : null;

  return (
    <NavBarClient
      isAuthenticated={!!session}
      userRole={user?.role ?? null}
      userName={session?.user?.name ?? null}
      memberNumber={session?.user?.memberNumber ?? null}
    />
  );
}
