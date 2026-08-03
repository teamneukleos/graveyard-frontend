import Link from "next/link";
import { VoteButton } from "@/components/VoteButton";

export type FeedItem = {
  id: string;
  title: string;
  category: string;
  status: string;
  yearCreated: number;
  coverFilename?: string | null;
  submitter: string;
  concept?: string;
  votes?: number;
  voted?: boolean;
};

export function FeedCard({ item, index = 0 }: { item: FeedItem; index?: number }) {
  const isWinner = item.status === "winner";
  const isShortlist = item.status === "shortlisted";
  const voteCount = item.votes ?? 0;

  return (
    <Link href={`/showcase/${item.id}`} className="group block">
      <div className="card-media relative aspect-[4/5]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/uploads/${item.coverFilename || "placeholder"}?tone=${index}`}
          alt=""
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

        <div className="absolute bottom-3 right-3 z-10 opacity-100 transition duration-300 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          <VoteButton
            submissionId={item.id}
            initialVoted={Boolean(item.voted)}
            initialCount={voteCount}
            compact
            className="shadow-lg"
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
          <span className="tabular-nums">{voteCount} votes</span>
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
