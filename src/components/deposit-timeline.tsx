import { CircleCheck, CircleX, Clock } from "lucide-react"
import { blikCopy } from "@/blik-copy"

type CryptoTransfer = { status: "detected" | "confirming" | "credited"; confirmations: number; requiredConfirmations: number }
type FiatStatus = "pending" | "success" | "failed" | "canceled"
type StepState = "complete" | "current" | "failed" | "canceled" | "upcoming"

export function DepositTimelineStep({ title, detail, state, connector = false, connectorComplete = false, current = false }: {
  title: string
  detail: string
  state: StepState
  connector?: boolean
  connectorComplete?: boolean
  current?: boolean
}) {
  return <li aria-current={current ? "step" : undefined} className="relative flex gap-3 pb-4 last:pb-0">
    {connector && <span className={`absolute bottom-0 left-[9px] top-6 w-px ${connectorComplete ? "bg-success/60" : "bg-border"}`} aria-hidden="true" />}
    <span className="relative z-10 flex size-5 shrink-0 items-center justify-center" aria-hidden="true">{state === "complete" ? <CircleCheck className="size-5 text-success" /> : state === "failed" || state === "canceled" ? <CircleX className="size-5 text-destructive" /> : state === "current" ? <Clock className="size-5 text-warning" /> : <span className="size-4 rounded-full border-2 border-border" />}</span>
    <span className="grid min-w-0 gap-0.5"><span className={`text-sm font-medium leading-5 ${state === "upcoming" ? "text-muted-foreground" : "text-foreground"}`}>{title}</span><span className={`text-xs leading-5 ${state === "failed" || state === "canceled" ? "text-destructive" : "text-muted-foreground"}`}>{detail}</span></span>
  </li>
}

export function DepositTimeline(props: { kind: "crypto"; transfer: CryptoTransfer } | { kind: "fiat"; status: FiatStatus; method?: string; chargeState?: "not_charged" | "charged" | "unknown" }) {
  const crypto = props.kind === "crypto"
  const currentIndex = crypto ? { detected: 0, confirming: 1, credited: 2 }[props.transfer.status] : props.status === "success" ? 2 : 1
  const failed = !crypto && props.status === "failed"
  const canceled = !crypto && props.status === "canceled"
  const completed = crypto ? props.transfer.status === "credited" : props.status === "success"
  const steps = crypto ? [
    { title: "Detected", detail: "Transfer found on the network." },
    { title: "Confirming", detail: props.transfer.status === "detected" ? "Waiting for network confirmations." : `${Math.min(props.transfer.confirmations, props.transfer.requiredConfirmations)} of ${props.transfer.requiredConfirmations} network confirmations.` },
    { title: "Credited", detail: completed ? "Funds added to your balance." : "After network confirmation." },
  ] : props.method === "BLIK" ? [
    { title: blikCopy.startedStep, detail: blikCopy.startedDetail },
    { title: canceled ? blikCopy.canceledStep : failed ? blikCopy.failedStep : completed ? blikCopy.confirmedStep : blikCopy.pendingStep, detail: canceled ? props.chargeState === "not_charged" ? blikCopy.canceledNoChargeDetail : blikCopy.canceledDetail : failed ? props.chargeState === "not_charged" ? blikCopy.failedNoChargeDetail : blikCopy.failedDetail : completed ? blikCopy.confirmedDetail : props.chargeState === "not_charged" ? blikCopy.notChargedDetail : blikCopy.pendingDetail },
    { title: blikCopy.balanceStep, detail: completed ? blikCopy.balanceDone : failed || canceled ? blikCopy.notReached : blikCopy.balanceFuture },
  ] : [
    { title: "Deposit started", detail: "Payment started." },
    { title: "Payment", detail: canceled ? props.chargeState === "not_charged" ? "Nothing was charged." : "Deposit canceled." : failed ? props.chargeState === "not_charged" ? "Nothing was charged. You can try again." : "Check the payment status before trying again." : completed ? "Payment confirmed." : props.method === "Card" ? "Confirm the payment if your bank asks." : "Waiting for payment confirmation." },
    { title: "Added to your balance", detail: completed ? "Your deposit is available." : failed || canceled ? "Not reached." : "After payment confirmation." },
  ]

  return <ol className="grid" aria-label="Deposit progress">{steps.map((step, index) => {
    const state = failed && index === currentIndex ? "failed" : canceled && index === currentIndex ? "canceled" : index < currentIndex || completed && index === currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming"
    return <DepositTimelineStep key={step.title} {...step} state={state} current={index === currentIndex} connector={index < steps.length - 1} connectorComplete={index < currentIndex} />
  })}</ol>
}
