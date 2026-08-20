import Link from "next/link";
import { VoteButton } from "@/components/VoteButton";

export type FeedItem = {
  /** Public detail route key (Nest slug). */
  id: string;
  /** Nest submission UUID for like/mutations. */
  submissionId?: string;
  title: string;
  category: string;
  status: string;
  yearCreated: number;
  coverUrl?: string | null;
  submitter: string;
  concept?: string;
  votes?: number;
  voted?: boolean;
};

const PLACEHOLDER = "/brand/logo-on-dark.png";

export function FeedCard({ item, index = 0 }: { item: FeedItem; index?: number }) {
  const isWinner = item.status === "winner";
  const isShortlist = item.status === "shortlisted";
  const voteCount = item.votes ?? 0;
  const likeId = item.submissionId || item.id;

  return (
    <Link href={`/showcase/${item.id}`} className="group block">
      <div className="card-media relative aspect-[4/5]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.coverUrl || `${PLACEHOLDER}?tone=${index}`}
          alt={`${item.title} by ${item.submitter}`}
          className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
        />
        {isWinner ? (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            LIVE
          </span>
        ) : null}
        {isShortlist && !isWinner ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Shortlist
          </span>
        ) : null}

        <div className="absolute bottom-3 right-3 z-10">
          <VoteButton
            submissionId={likeId}
            initialVoted={Boolean(item.voted)}
            initialCount={voteCount}
            compact
          />
        </div>
      </div>
      <div className="mt-3">
        <h3 className="truncate font-display text-[16px] font-bold tracking-tight text-ink group-hover:underline">
          {item.title}
        </h3>
        <p className="mt-0.5 truncate text-[13px] text-mute">
          {item.submitter}
          <span className="text-line"> · </span>
          {item.category}
          <span className="text-line"> · </span>
          <span className="tabular-nums">{voteCount} likes</span>
        </p>
      </div>
    </Link>
  );
}

export function FeedGrid({ items, startIndex = 0 }: { items: FeedItem[]; startIndex?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <FeedCard key={item.id} item={item} index={startIndex + i} />
      ))}
    </div>
  );
}
