import { redirect } from "next/navigation";
import { EventsManager } from "@/components/EventsManager";
import { YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { requireSession } from "@/lib/auth";
import { getAllEventsAdmin } from "@/lib/events";

export default async function AdminEventsPage() {
  const session = await requireSession(["admin"]);
  if (!session) redirect("/login");

  const events = await getAllEventsAdmin();

  return (
    <YardPage>
      <YardHeader
        eyebrow="Admin"
        title="Events"
        description="Create and manage meetups, salons, screenings, and workshops."
      />
      <YardContainer>
        <div className="overflow-hidden rounded-[24px] border border-line bg-white/90 p-5 md:p-8">
          <EventsManager initialEvents={events} />
        </div>
      </YardContainer>
    </YardPage>
  );
}
