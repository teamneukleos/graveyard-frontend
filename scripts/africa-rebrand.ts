#!/usr/bin/env npx tsx
/**
 * Rebrand existing DB content for Nigerian / African creators.
 */
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { submissions, users } from "../src/db/schema";
import { CATEGORIES } from "../src/lib/constants";

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

async function main() {
  const allUsers = await db.query.users.findMany();
  for (const user of allUsers) {
    if (user.email === "admin@graveyard.studio") {
      await db.update(users).set({ name: "Graveyard Admin", agencyName: null }).where(eq(users.id, user.id));
    } else if (user.email === "judge@graveyard.studio") {
      await db.update(users).set({ name: "Funke Adeyemi", agencyName: null }).where(eq(users.id, user.id));
    } else if (user.email === "creator@example.com") {
      await db
        .update(users)
        .set({ name: "Chioma Okeke", agencyName: null })
        .where(eq(users.id, user.id));
    } else if (user.email === "studio@northline.com" || user.email === "studio@wura.studio") {
      await db
        .update(users)
        .set({
          name: "Tunde Adeyemi",
          agencyName: "Wura Collective",
          email: "studio@wura.studio",
        })
        .where(eq(users.id, user.id));
    }
  }

  const published = await db.query.submissions.findMany({
    where: eq(submissions.published, true),
    orderBy: (s, { asc }) => [asc(s.createdAt)],
  });

  const heroes = [
    {
      title: "Danfo After Dark",
      concept:
        "A Lagos transit campaign treating yellow danfo buses as moving billboards of belonging after midnight.",
      why: "Client restructured mid-pitch; the brief was cancelled before production.",
      team: "Tunde Adeyemi, Amaka Eze",
    },
    {
      title: "Unsent to Mama",
      concept:
        "Voice notes never sent home — brand confessions about almost-bought dreams and diaspora guilt.",
      why: "Legal flagged the tone as too intimate for the category.",
      team: "Chioma Okeke",
    },
    {
      title: "Generator Hours",
      concept: "A film about the rhythm of NEPA cuts and the glow that keeps Gidi awake.",
      why: "Agency chose a safer comedy route for the multinational.",
      team: "Chioma Okeke",
    },
  ];

  for (let i = 0; i < published.length; i++) {
    const piece = published[i];
    const agencyLabel = AGENCIES[i % AGENCIES.length];
    const isAgency = piece.submitterType === "agency";

    if (i < heroes.length) {
      const hero = heroes[i];
      await db
        .update(submissions)
        .set({
          title: hero.title,
          concept: hero.concept,
          whyNeverLive: hero.why,
          teamMembers: hero.team,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(submissions.id, piece.id));
      continue;
    }

    await db
      .update(submissions)
      .set({
        title: titleFor(i),
        category: CATEGORIES[i % CATEGORIES.length],
        teamMembers: isAgency
          ? `${CREATORS[i % CREATORS.length]}, ${CREATORS[(i + 2) % CREATORS.length]}`
          : CREATORS[i % CREATORS.length],
        concept: `A ${CATEGORIES[i % CATEGORIES.length].toLowerCase()} idea rooted in ${TITLE_B[i % TITLE_B.length].toLowerCase()} culture — made for a Nigerian brief that never survived the room. (${agencyLabel})`,
        whyNeverLive:
          i % 3 === 0
            ? "Client priorities shifted mid-development and the work was shelved."
            : i % 3 === 1
              ? "Budget collapsed before production. The concept stayed in the deck."
              : "Stakeholders chose a safer global template. This Naija cut never shipped.",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(submissions.id, piece.id));
  }

  // Drafts / unpublished
  const drafts = await db.query.submissions.findMany({
    where: eq(submissions.published, false),
  });
  for (const draft of drafts) {
    await db
      .update(submissions)
      .set({
        teamMembers: "Chioma Okeke",
        concept:
          draft.concept.includes("Lagos") || draft.concept.includes("Naija")
            ? draft.concept
            : "An interface built for low-data moments across Lagos — disappears until you need it.",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(submissions.id, draft.id));
  }

  console.log(`Rebranded ${allUsers.length} users and ${published.length} published pieces.`);
  console.log("Demo agency login is now studio@wura.studio / password123");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
