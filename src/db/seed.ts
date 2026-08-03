import { ensureDemoSeed } from "./demo-seed";

async function seed() {
  await ensureDemoSeed();
  console.log("Accounts (password: password123):");
  console.log("  admin@graveyard.studio");
  console.log("  judge@graveyard.studio");
  console.log("  creator@example.com");
  console.log("  studio@wura.studio");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
