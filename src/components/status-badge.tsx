import { Badge } from "@/components/ui/badge"

export function StatusBadge({ status }: { status: "pending" | "success" | "failed" | "canceled" | "detected" | "confirming" | "credited" }) {
  const content = {
    pending: { label: "Awaiting confirmation", dot: "bg-warning" },
    success: { label: "Successful", dot: "bg-success" },
    failed: { label: "Failed", dot: "bg-destructive" },
    canceled: { label: "Canceled", dot: "bg-red-500" },
    detected: { label: "Detected", dot: "bg-warning" },
    confirming: { label: "Confirming", dot: "bg-warning" },
    credited: { label: "Credited", dot: "bg-success" },
  }[status]

  return (
    <Badge variant="outline" className="h-auto gap-1.5 px-2 py-0.5 font-medium">
      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${content.dot}`} />
      {content.label}
    </Badge>
  )
}
