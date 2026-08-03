import { count, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { eventRsvps, events, reviews, submissions, votes } from "@/db/schema";

export async function getAdminAnalytics() {
  const allSubs = await db.query.submissions.findMany({
    columns: { id: true, status: true, published: true, category: true },
  });

  const byStatus: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  let published = 0;
  for (const s of allSubs) {
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
    byCategory[s.category] = (byCategory[s.category] || 0) + 1;
    if (s.published) published += 1;
  }

  const voteDays = await db
    .select({
      day: sql<string>`substr(${votes.createdAt}, 1, 10)`,
      total: count(),
    })
    .from(votes)
    .groupBy(sql`substr(${votes.createdAt}, 1, 10)`)
    .orderBy(sql`substr(${votes.createdAt}, 1, 10)`);

  const [{ reviewCount }] = await db.select({ reviewCount: count() }).from(reviews);
  const [{ voteCount }] = await db.select({ voteCount: count() }).from(votes);
  const [{ rsvpCount }] = await db.select({ rsvpCount: count() }).from(eventRsvps);

  const eventRows = await db.query.events.findMany({
    orderBy: [desc(events.startsAt)],
    with: { rsvps: true },
  });

  const eventFill = eventRows.map((e) => ({
    id: e.id,
    title: e.title,
    capacity: e.capacity,
    rsvps: e.rsvps.length,
    fill: e.capacity > 0 ? Math.round((e.rsvps.length / e.capacity) * 100) : 0,
  }));

  const reviewedIds = new Set(
    (await db.query.reviews.findMany({ columns: { submissionId: true } })).map(
      (r) => r.submissionId,
    ),
  );
  const reviewableRows = allSubs.filter((s) => s.status !== "draft");
  const coveredCount = reviewableRows.filter((s) => reviewedIds.has(s.id)).length;

  return {
    funnel: {
      total: allSubs.length,
      published,
      byStatus,
    },
    byCategory: Object.entries(byCategory)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total),
    votesOverTime: voteDays.map((d) => ({ day: d.day, total: Number(d.total) })),
    totals: {
      votes: Number(voteCount),
      reviews: Number(reviewCount),
      rsvps: Number(rsvpCount),
    },
    judgeCoverage: {
      reviewable: reviewableRows.length,
      covered: coveredCount,
      percent:
        reviewableRows.length > 0
          ? Math.round((coveredCount / reviewableRows.length) * 100)
          : 0,
    },
    eventFill,
  };
}
