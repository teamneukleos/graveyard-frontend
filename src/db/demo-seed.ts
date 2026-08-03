import { hash } from "bcryptjs";
import { count, eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { CATEGORIES } from "../lib/constants";
import { db } from "./index";
import { assets, reviews, submissions, users, votes } from "./schema";

const AGENCIES = [
  "Wura Collective",
  "Àjọ Studio",
  "Palm & Clay",
  "Eko Type",
  "Danfo Works",
  "Harmattan Co",
  "Sabo Form",
  "Naija Draft",
];

const CREATORS = [
  "Chioma Okeke",
  "Tunde Adeyemi",
  "Amaka Eze",
  "Kofi Mensah",
  "Zainab Bello",
  "Ifeanyi Okafor",
  "Amina Yusuf",
  "Kwame Boateng",
];

const TITLE_A = [
  "Danfo",
  "Harmattan",
  "Owambe",
  "Pepper",
  "Suya",
  "Okada",
  "Jollof",
  "Wahala",
  "Palm",
  "Eko",
  "Gidi",
  "Sabo",
  "Asé",
  "Naija",
  "Mama",
];

const TITLE_B = [
  "Market",
  "Route",
  "Signal",
  "Parade",
  "Draft",
  "Chorus",
  "Archive",
  "Room",
  "Calling",
  "Mirror",
  "Night",
  "Season",
  "Window",
  "Ritual",
  "Broadcast",
];

function titleFor(i: number) {
  return `${TITLE_A[i % TITLE_A.length]} ${TITLE_B[(i * 3) % TITLE_B.length]}`;
}

async function insertPublishedPiece(opts: {
  userId: string;
  judgeId: string;
  title: string;
  category: string;
  submitterType: "agency" | "individual";
  teamMembers: string;
  yearCreated: number;
  concept: string;
  whyNeverLive: string;
  status: "winner" | "shortlisted";
  now: string;
}) {
  const id = uuid();
  await db.insert(submissions).values({
    id,
    userId: opts.userId,
    title: opts.title,
    category: opts.category,
    submitterType: opts.submitterType,
    teamMembers: opts.teamMembers,
    yearCreated: opts.yearCreated,
    concept: opts.concept,
    whyNeverLive: opts.whyNeverLive,
    status: opts.status,
    published: true,
    showcaseYear: 2025,
    createdAt: opts.now,
    updatedAt: opts.now,
    submittedAt: opts.now,
  });

  await db.insert(assets).values({
    id: uuid(),
    submissionId: id,
    filename: `cover-${id.slice(0, 8)}.jpg`,
    originalName: `${opts.title}.jpg`,
    mimeType: "image/jpeg",
    size: 0,
    createdAt: opts.now,
  });

  await db.insert(reviews).values({
    id: uuid(),
    submissionId: id,
    judgeId: opts.judgeId,
    score: opts.status === "winner" ? 9 + Math.random() * 0.8 : 7.5 + Math.random() * 1.4,
    comment:
      opts.status === "winner"
        ? "Rare clarity of idea and craft. This deserved to go live across the continent."
        : "Strong concept with memorable voice. Shortlist material for African audiences.",
    shortlisted: true,
    createdAt: opts.now,
    updatedAt: opts.now,
  });

  return id;
}

async function ensureBulkCatalog(judgeId: string, creatorId: string, agencyId: string) {
  const [{ total }] = await db
    .select({ total: count() })
    .from(submissions)
    .where(eq(submissions.published, true));

  // Leaner catalog on serverless cold starts
  const TARGET = process.env.VERCEL ? 36 : 72;
  if (total >= TARGET) return 0;

  const now = new Date().toISOString();
  const toAdd = TARGET - total;
  let added = 0;

  for (let i = 0; i < toAdd; i++) {
    const n = total + i;
    const isAgency = n % 2 === 0;
    const status = n % 7 === 0 ? "winner" : "shortlisted";
    const agencyLabel = AGENCIES[n % AGENCIES.length];
    await insertPublishedPiece({
      userId: isAgency ? agencyId : creatorId,
      judgeId,
      title: titleFor(n),
      category: CATEGORIES[n % CATEGORIES.length],
      submitterType: isAgency ? "agency" : "individual",
      teamMembers: isAgency
        ? `${CREATORS[n % CREATORS.length]}, ${CREATORS[(n + 2) % CREATORS.length]}`
        : CREATORS[n % CREATORS.length],
      yearCreated: 2020 + (n % 6),
      concept: `A ${CATEGORIES[n % CATEGORIES.length].toLowerCase()} idea rooted in ${TITLE_B[n % TITLE_B.length].toLowerCase()} culture — made for a Nigerian brief that never survived the room. (${agencyLabel})`,
      whyNeverLive:
        n % 3 === 0
          ? "Client priorities shifted mid-development and the work was shelved."
          : n % 3 === 1
            ? "Budget collapsed before production. The concept stayed in the deck."
            : "Stakeholders chose a safer global template. This Naija cut never shipped.",
      status,
      now,
    });
    added += 1;
  }

  return added;
}

async function ensureDemoVotes(voterIds: string[]) {
  const [{ total }] = await db.select({ total: count() }).from(votes);
  if (total > 0 || voterIds.length === 0) return;

  const published = await db.query.submissions.findMany({
    where: eq(submissions.published, true),
    columns: { id: true, category: true },
    limit: 40,
  });

  const now = new Date().toISOString();
  const rows = [];
  for (let i = 0; i < published.length; i++) {
    const piece = published[i];
    const voteCount = 1 + (i % 5);
    for (let v = 0; v < voteCount && v < voterIds.length; v++) {
      rows.push({
        id: uuid(),
        submissionId: piece.id,
        userId: voterIds[v % voterIds.length],
        category: piece.category,
        createdAt: now,
      });
    }
  }

  // Insert in chunks; ignore unique conflicts by unique pairs in construction
  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    const key = `${r.submissionId}:${r.userId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  for (let i = 0; i < unique.length; i += 50) {
    await db.insert(votes).values(unique.slice(i, i + 50));
  }
}

/** Rename legacy shared "placeholder" assets so each piece gets a unique remote cover. */
async function upgradePlaceholderAssets() {
  const rows = await db.select().from(assets).where(eq(assets.filename, "placeholder"));
  for (const row of rows) {
    await db
      .update(assets)
      .set({
        filename: `cover-${row.submissionId.slice(0, 8)}.jpg`,
        mimeType: "image/jpeg",
      })
      .where(eq(assets.id, row.id));
  }
  if (rows.length > 0) {
    console.log(`[demo-seed] upgraded ${rows.length} placeholder covers`);
  }
}

async function ensureDemoAvatars() {
  const creators = await db.query.users.findMany({
    where: eq(users.role, "creator"),
  });
  for (const user of creators) {
    if (user.avatarFilename) continue;
    await db
      .update(users)
      .set({ avatarFilename: `avatar-${user.id.slice(0, 8)}.jpg` })
      .where(eq(users.id, user.id));
  }
  const judge = await db.query.users.findFirst({
    where: eq(users.email, "judge@graveyard.studio"),
  });
  if (judge && !judge.avatarFilename) {
    await db
      .update(users)
      .set({ avatarFilename: `avatar-${judge.id.slice(0, 8)}.jpg` })
      .where(eq(users.id, judge.id));
  }
}

let seeding: Promise<void> | null = null;

async function runDemoSeed() {
  const now = new Date().toISOString();
  const passwordHash = await hash("password123", 10);

  let admin = await db.query.users.findFirst({
    where: eq(users.email, "admin@graveyard.studio"),
  });
  let judge = await db.query.users.findFirst({
    where: eq(users.email, "judge@graveyard.studio"),
  });
  let creator = await db.query.users.findFirst({
    where: eq(users.email, "creator@example.com"),
  });
  let agency = await db.query.users.findFirst({
    where: eq(users.email, "studio@wura.studio"),
  });

  if (!admin) {
    const adminId = uuid();
    const judgeId = uuid();
    const creatorId = uuid();
    const agencyId = uuid();

    await db.insert(users).values([
      {
        id: adminId,
        email: "admin@graveyard.studio",
        passwordHash,
        name: "Graveyard Admin",
        role: "admin",
        agencyName: null,
        agencySlug: null,
        bio: "",
        avatarFilename: null,
        emailVerifiedAt: now,
        googleId: null,
        createdAt: now,
      },
      {
        id: judgeId,
        email: "judge@graveyard.studio",
        passwordHash,
        name: "Funke Adeyemi",
        role: "judge",
        agencyName: null,
        agencySlug: null,
        bio: "",
        avatarFilename: null,
        emailVerifiedAt: now,
        googleId: null,
        createdAt: now,
      },
      {
        id: creatorId,
        email: "creator@example.com",
        passwordHash,
        name: "Chioma Okeke",
        role: "creator",
        agencyName: null,
        agencySlug: null,
        bio: "Independent creator burying briefs that never saw daylight.",
        avatarFilename: `avatar-${creatorId.slice(0, 8)}.jpg`,
        emailVerifiedAt: now,
        googleId: null,
        createdAt: now,
      },
      {
        id: agencyId,
        email: "studio@wura.studio",
        passwordHash,
        name: "Tunde Adeyemi",
        role: "creator",
        agencyName: "Wura Collective",
        agencySlug: "wura-collective",
        bio: "Lagos studio for campaigns that almost went live.",
        avatarFilename: `avatar-${agencyId.slice(0, 8)}.jpg`,
        emailVerifiedAt: now,
        googleId: null,
        createdAt: now,
      },
    ]);

    const heroes = [
      {
        title: "Danfo After Dark",
        category: "Campaign",
        owner: "agency" as const,
        status: "winner" as const,
        concept:
          "A Lagos transit campaign treating yellow danfo buses as moving billboards of belonging after midnight.",
        why: "Client restructured mid-pitch; the brief was cancelled before production.",
      },
      {
        title: "Unsent to Mama",
        category: "Copywriting",
        owner: "creator" as const,
        status: "shortlisted" as const,
        concept:
          "Voice notes never sent home — brand confessions about almost-bought dreams and diaspora guilt.",
        why: "Legal flagged the tone as too intimate for the category.",
      },
      {
        title: "Generator Hours",
        category: "Motion",
        owner: "creator" as const,
        status: "winner" as const,
        concept: "A film about the rhythm of NEPA cuts and the glow that keeps Gidi awake.",
        why: "Agency chose a safer comedy route for the multinational.",
      },
    ];

    for (const hero of heroes) {
      await insertPublishedPiece({
        userId: hero.owner === "agency" ? agencyId : creatorId,
        judgeId,
        title: hero.title,
        category: hero.category,
        submitterType: hero.owner === "agency" ? "agency" : "individual",
        teamMembers:
          hero.owner === "agency" ? "Tunde Adeyemi, Amaka Eze" : "Chioma Okeke",
        yearCreated: 2024,
        concept: hero.concept,
        whyNeverLive: hero.why,
        status: hero.status,
        now,
      });
    }

    await db.insert(submissions).values({
      id: uuid(),
      userId: creatorId,
      title: "The Quiet Product",
      category: "Digital",
      submitterType: "individual",
      teamMembers: "Chioma Okeke",
      yearCreated: 2025,
      concept: "An interface built for low-data moments — disappears until you need it.",
      whyNeverLive: "Still drafting the story.",
      status: "draft",
      published: false,
      showcaseYear: null,
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
    });

    judge = await db.query.users.findFirst({ where: eq(users.email, "judge@graveyard.studio") });
    creator = await db.query.users.findFirst({ where: eq(users.email, "creator@example.com") });
    agency = await db.query.users.findFirst({ where: eq(users.email, "studio@wura.studio") });
    admin = await db.query.users.findFirst({ where: eq(users.email, "admin@graveyard.studio") });

    console.log("[demo-seed] core accounts and hero pieces ready");
  }

  if (judge && creator && agency) {
    const added = await ensureBulkCatalog(judge.id, creator.id, agency.id);
    if (added > 0) console.log(`[demo-seed] added ${added} catalog submissions`);
    await ensureDemoVotes(
      [admin?.id, creator.id, agency.id, judge.id].filter(Boolean) as string[],
    );
  }

  await upgradePlaceholderAssets();
  await ensureDemoAvatars();
}

/** Idempotent demo seed — safe to call on every boot (no-ops when data exists). */
export async function ensureDemoSeed() {
  if (!seeding) {
    seeding = runDemoSeed().catch((err) => {
      seeding = null;
      throw err;
    });
  }
  await seeding;
}
