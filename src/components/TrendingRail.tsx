"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type TrendingItem = {
  submissionId: string;
  title: string;
  category: string;
  votes: number;
  coverFilename?: string | null;
  submitter?: string;
};

const CARD_WIDTH = 240;
const GAP = 16;
const STEP = CARD_WIDTH + GAP;
const AUTO_MS = 4000;
const DRAG_THRESHOLD = 8;

export function TrendingRail({
  items,
  title = "Trending",
}: {
  items: TrendingItem[];
  title?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimer = useRef<number | null>(null);
  const drag = useRef({
    active: false,
    moved: false,
    startX: 0,
    startScroll: 0,
    pointerId: -1,
  });
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);

  const pauseForUser = useCallback(() => {
    pausedRef.current = true;
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      pausedRef.current = false;
    }, 5000);
  }, []);

  const scrollByCards = useCallback(
    (direction: -1 | 1) => {
      const el = scrollerRef.current;
      if (!el) return;
      pauseForUser();
      el.scrollBy({ left: direction * STEP * 2, behavior: "smooth" });
    },
    [pauseForUser],
  );

  const syncActiveFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / STEP);
    setActive(Math.max(0, Math.min(items.length - 1, index)));
  }, [items.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => syncActiveFromScroll();
    el.addEventListener("scroll", onScroll, { passive: true });

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      pauseForUser();
      el.scrollBy({ left: e.deltaY, behavior: "auto" });
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("button")) return;
      drag.current = {
        active: true,
        moved: false,
        startX: e.clientX,
        startScroll: el.scrollLeft,
        pointerId: e.pointerId,
      };
      pauseForUser();
      // Don't capture yet  -  capturing immediately blocks Link clicks
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!drag.current.active || drag.current.pointerId !== e.pointerId) return;
      const dx = e.clientX - drag.current.startX;
      if (Math.abs(dx) <= DRAG_THRESHOLD) return;

      if (!drag.current.moved) {
        drag.current.moved = true;
        setDragging(true);
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      el.scrollLeft = drag.current.startScroll - dx;
    };

    const endDrag = (e: PointerEvent) => {
      if (!drag.current.active || drag.current.pointerId !== e.pointerId) return;
      const wasDragging = drag.current.moved;
      drag.current.active = false;
      setDragging(false);
      try {
        if (wasDragging) el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onClickCapture = (e: MouseEvent) => {
      // Suppress navigation only after an actual drag
      if (!drag.current.moved) return;
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, [pauseForUser, syncActiveFromScroll]);

  useEffect(() => {
    if (items.length < 2) return;
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      const el = scrollerRef.current;
      if (!el) return;
      setActive((prev) => {
        const next = (prev + 1) % items.length;
        const maxScroll = el.scrollWidth - el.clientWidth;
        el.scrollTo({
          left: next === 0 ? 0 : Math.min(next * STEP, Math.max(0, maxScroll)),
          behavior: "smooth",
        });
        return next;
      });
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [items.length]);

  useEffect(() => {
    return () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    };
  }, []);

  if (!items.length) return null;

  return (
    <section className="trending-boxes border-b border-line bg-paper py-8 md:py-10">
      <div className="mx-auto flex max-w-[1440px] items-end justify-between gap-4 px-4 md:px-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-mute">Now</p>
          <h2 className="mt-2 font-display text-[28px] font-bold tracking-[-0.04em] text-ink md:text-[40px]">
            {title}
          </h2>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-mute md:text-[16px]">
            The loudest graves right now. Drag to browse. Tap to open.
          </p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollByCards(-1)}
            className="trend-chevron"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollByCards(1)}
            className="trend-chevron"
          >
            ›
          </button>
        </div>
      </div>

      <div className="relative mt-6">
        <div
          ref={scrollerRef}
          className={`trending-track ${dragging ? "is-dragging" : ""}`}
        >
          {items.map((piece, i) => (
            <Link
              key={piece.submissionId}
              href={`/showcase/${piece.submissionId}`}
              data-trend-card
              className="group shrink-0"
              style={{ flex: `0 0 ${CARD_WIDTH}px`, width: CARD_WIDTH }}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            >
              <div className="card-media relative aspect-[4/5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/uploads/${piece.coverFilename || "placeholder"}?tone=${i}`}
                  alt=""
                  className="story-ken pointer-events-none"
                  style={{ animationDelay: `${(i % 5) * -2.4}s` }}
                  draggable={false}
                />
                <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="mt-3">
                <p className="truncate font-display text-[15px] font-bold tracking-tight text-ink group-hover:underline">
                  {piece.title}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-mute">
                  {piece.submitter ? `${piece.submitter} · ` : ""}
                  {piece.votes} votes
                </p>
                <p className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-wide text-mute/80">
                  {piece.category}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div
        className="mx-auto mt-5 flex max-w-[1440px] items-center justify-center gap-2 px-4 md:px-6"
        aria-hidden="true"
      >
        {items.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? "w-5 bg-ink" : "w-1.5 bg-line"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
