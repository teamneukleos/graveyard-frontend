import { relations } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("creator"),
  agencyName: text("agency_name"),
  agencySlug: text("agency_slug"),
  bio: text("bio").notNull().default(""),
  avatarFilename: text("avatar_filename"),
  emailVerifiedAt: text("email_verified_at"),
  googleId: text("google_id"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  colorBg: text("color_bg").notNull().default("#111111"),
  colorFg: text("color_fg").notNull().default("#ffffff"),
  createdAt: text("created_at").notNull(),
});

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  category: text("category").notNull(),
  submitterType: text("submitter_type").notNull().default("individual"),
  teamMembers: text("team_members").notNull().default(""),
  yearCreated: integer("year_created").notNull(),
  concept: text("concept").notNull().default(""),
  whyNeverLive: text("why_never_live").notNull().default(""),
  status: text("status").notNull().default("draft"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  showcaseYear: integer("showcase_year"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  submittedAt: text("submitted_at"),
});

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  submissionId: text("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  createdAt: text("created_at").notNull(),
});

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  submissionId: text("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  judgeId: text("judge_id")
    .notNull()
    .references(() => users.id),
  score: real("score").notNull(),
  comment: text("comment").notNull().default(""),
  shortlisted: integer("shortlisted", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const votes = sqliteTable("votes", {
  id: text("id").primaryKey(),
  submissionId: text("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id),
  guestName: text("guest_name"),
  guestEmail: text("guest_email"),
  ipHash: text("ip_hash"),
  voterSessionId: text("voter_session_id"),
  category: text("category").notNull(),
  createdAt: text("created_at").notNull(),
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  city: text("city").notNull(),
  venue: text("venue").notNull(),
  startsAt: text("starts_at").notNull(),
  format: text("format").notNull(),
  capacity: integer("capacity").notNull(),
  blurb: text("blurb").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const eventRsvps = sqliteTable(
  "event_rsvps",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("event_rsvps_event_user_idx").on(table.eventId, table.userId)],
);

export const authTokens = sqliteTable("auth_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  submissions: many(submissions),
  reviews: many(reviews),
  votes: many(votes),
  eventRsvps: many(eventRsvps),
  authTokens: many(authTokens),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
  assets: many(assets),
  reviews: many(reviews),
  votes: many(votes),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  submission: one(submissions, {
    fields: [assets.submissionId],
    references: [submissions.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  submission: one(submissions, {
    fields: [reviews.submissionId],
    references: [submissions.id],
  }),
  judge: one(users, {
    fields: [reviews.judgeId],
    references: [users.id],
  }),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  submission: one(submissions, {
    fields: [votes.submissionId],
    references: [submissions.id],
  }),
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  rsvps: many(eventRsvps),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  user: one(users, {
    fields: [eventRsvps.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [eventRsvps.eventId],
    references: [events.id],
  }),
}));

export const authTokensRelations = relations(authTokens, ({ one }) => ({
  user: one(users, {
    fields: [authTokens.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type AuthToken = typeof authTokens.$inferSelect;
