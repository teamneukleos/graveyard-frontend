/** Guest voting removed — Nest uses authenticated likes. */
export async function getCurrentVoterVotes(_ids: string[]) {
  return new Set<string>();
}
