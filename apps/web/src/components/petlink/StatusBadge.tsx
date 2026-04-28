import { cn } from "@/lib/utils";
import { statusCopy, type BookingStatus } from "@/lib/petlink-data";

const tone: Record<BookingStatus, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  confirmed: "bg-info/15 text-info-foreground border-info/30",
  completed: "bg-success/15 text-success-foreground border-success/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold", tone[status])}>{statusCopy[status]}</span>;
}
