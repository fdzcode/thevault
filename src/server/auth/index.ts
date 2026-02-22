import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";
import { db } from "~/server/db";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const devAuth = cache(async () => {
  const user = await db.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) return null;
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      memberNumber: user.memberNumber,
      role: user.role,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
});

const auth =
  process.env.NODE_ENV === "development" ? devAuth : cache(uncachedAuth);

export { auth, handlers, signIn, signOut };
