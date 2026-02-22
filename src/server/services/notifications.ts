import type { db as dbClient } from "~/server/db";

export async function createNotification(
  db: typeof dbClient,
  params: {
    userId: string;
    type: string;
    title: string;
    body: string;
    link?: string;
    metadata?: Record<string, unknown>;
  },
) {
  return db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
      metadata: params.metadata ? JSON.stringify(params.metadata) : "{}",
    },
  });
}
