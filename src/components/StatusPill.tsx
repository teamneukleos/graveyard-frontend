import { STATUS_LABELS, type SubmissionStatus } from "@/lib/constants";

export function StatusPill({ status }: { status: string }) {
  return (
    <span className="status-pill" data-status={status}>
      {STATUS_LABELS[status as SubmissionStatus] ?? status}
    </span>
  );
}
