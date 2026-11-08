import { useEffect, useRef, useState, type ComponentType } from "react"
import bitcoinIcon from "simple-icons/icons/bitcoin.svg?url"
import ethereumIcon from "simple-icons/icons/ethereum.svg?url"
import tetherIcon from "simple-icons/icons/tether.svg?url"
import metamaskIcon from "@/assets/metamask.svg"
import { PaymentBlik, PaymentMastercard, PaymentNeteller, PaymentPaypal, PaymentPaysafecard, PaymentSkrill, PaymentVisa } from "@tabler/payments-react"
import { QRCodeSVG } from "qrcode.react"
import { TokenBTC, TokenETH, TokenSOL, TokenUSDT } from "@web3icons/react"
import {
  ArrowUpRight,
  Bitcoin,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleDollarSign,
  CircleX,
  Clock,
  Coins,
  Copy,
  CreditCard,
  History,
  Info,
  Landmark,
  Wallet,
  X,
  type LucideProps,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { DepositTimeline } from "@/components/deposit-timeline"
import { blikCopy } from "@/blik-copy"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Category = "crypto" | "fiat"
type Region = "PL" | "DE"
type Currency = "EUR" | "PLN" | "USD"
type PaymentStatus = "idle" | "pending" | "payment_received" | "success" | "failed" | "canceled" | "expired"
type CryptoTransfer = { asset: string; network: string; amount: string; status: "detected" | "confirming" | "credited"; confirmations: number; requiredConfirmations: number; createdAt: string }
type Transaction = { id: number; reference: string; createdAt: string; method: string; amount: number; fee: number | null; currency: Currency; status: Exclude<PaymentStatus, "idle">; cancellationState?: "requested"; delayed?: boolean; cancelable?: boolean; chargeState?: "not_charged" | "charged" | "unknown"; expiresAt?: string }
type CancellationResult = "requested" | "confirmed_no_charge" | "rejected"
export type SupportContext = { kind: "fiat"; transaction: Transaction } | { kind: "crypto"; asset: string; network: string; transfer?: CryptoTransfer }
type PaymentFlow = "card" | "wallet" | "bank" | "blik"
const sampleBlikCode = "123456"
type CardDetails = {
  number: string
  expiry: string
  cvc: string
  holder: string
}

type Method = {
  id: string
  name: string
  detail: string
  Icon?: ComponentType<LucideProps>
  logo?: string
  logoWide?: boolean
  flow?: PaymentFlow
  regions?: Region[]
}

type MethodGroup = {
  id: "popular" | "regular"
  title: string
  methods: Method[]
}

const emptyCard: CardDetails = { number: "", expiry: "", cvc: "", holder: "" }

function CryptoProgressPanel({ transfer, onReturnToGame, onViewTransaction, onContactSupport }: { transfer: CryptoTransfer; onReturnToGame?: () => void; onViewTransaction?: () => void; onContactSupport?: () => void }) {
  const title = transfer.status === "detected" ? "Deposit detected" : transfer.status === "confirming" ? "Confirming deposit" : "Deposit credited"
  const description = transfer.status === "confirming" ? "You can leave this screen and check History later." : null

  return <section className="grid gap-4" aria-label="Crypto deposit progress">
    <div className="grid gap-1"><h3 className="text-sm font-semibold">{title}</h3>{description && <p className="text-xs leading-5 text-muted-foreground">{description}</p>}</div>
    <DepositTimeline kind="crypto" transfer={transfer} />
    <dl className="grid gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-5">
      <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Amount</dt><dd className="font-medium tabular-nums">{transfer.amount} {transfer.asset}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Network</dt><dd className="text-right font-medium">{transfer.network}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Confirmations</dt><dd className="font-medium tabular-nums">{Math.min(transfer.confirmations, transfer.requiredConfirmations)} of {transfer.requiredConfirmations}</dd></div>
    </dl>
    {transfer.status !== "credited" && <p className="text-xs leading-5 text-muted-foreground">A transfer sent on the network cannot be canceled here.</p>}
    {transfer.status === "credited" && onReturnToGame && <Button type="button" className="min-h-11 w-full" onClick={onReturnToGame}>Back to game</Button>}
    {onViewTransaction && <Button type="button" variant={transfer.status === "credited" ? "outline" : "default"} className="min-h-11 w-full" onClick={onViewTransaction}>View transaction</Button>}
    {transfer.status !== "credited" && onContactSupport && <Button type="button" variant="ghost" className="min-h-11 w-full" onClick={onContactSupport}>Contact support</Button>}
  </section>
}

export function CryptoDeposit({ asset, network, preview = true, onContactSupport }: { asset: string; network: string; preview?: boolean; onContactSupport?: () => void }) {
  const [copyStatus, setCopyStatus] = useState("")
  const [showBuyDemo, setShowBuyDemo] = useState(false)
  const address = preview ? `TEST-ONLY-NOT-AN-ADDRESS-${asset}` : null
  const terms = asset === "BTC"
    ? { minimum: "0.0001 BTC", confirmations: "2", time: "About 20 minutes" }
    : asset === "SOL"
      ? { minimum: "0.05 SOL", confirmations: "Network confirmation", time: "Usually a few minutes" }
      : asset === "ETH"
        ? { minimum: "0.005 ETH", confirmations: "14", time: "About 20 minutes" }
        : network.startsWith("Tron")
          ? { minimum: "5 USDT", confirmations: "20", time: "Usually a few minutes" }
          : { minimum: "5 USDT", confirmations: "14", time: "About 20 minutes" }

  if (showBuyDemo) return (
    <section className="grid gap-4 border-t border-border pt-4" aria-labelledby="buy-crypto-title">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" className="-ml-2 size-9" aria-label="Back to deposit details" onClick={() => setShowBuyDemo(false)}><ArrowLeft aria-hidden="true" /></Button>
        <h3 id="buy-crypto-title" className="text-sm font-medium">Buy {asset}</h3>
      </div>
      <div className="grid gap-2 rounded-lg bg-muted/60 p-4">
        <p className="text-sm font-medium">Provider preview</p>
        <p className="text-sm leading-5 text-muted-foreground">A purchase provider would open separately to help you buy {asset}. This is a demo; no provider is connected and no purchase will be made.</p>
        <p className="text-sm leading-5 text-muted-foreground">Return here to deposit using the {network} network after buying.</p>
      </div>
      <Button type="button" variant="outline" className="min-h-11 w-full" onClick={() => setShowBuyDemo(false)}>Back to deposit details</Button>
    </section>
  )

  return (
    <div className="grid gap-4 border-t border-border pt-4">
      {address ? <section aria-label="Deposit address" className="grid gap-4">
        <div className="flex justify-center"><div className="rounded-md bg-white p-2"><QRCodeSVG value={address} size={112} level="M" title={`QR code for ${asset} on ${network}`} /></div></div>
        <div className="grid gap-1.5">
          <span id="crypto-address-label" className="text-xs font-medium text-muted-foreground">Demo address · Do not send funds</span>
          <div className="flex min-h-11 items-center gap-2 rounded-lg bg-muted/60 pl-3 pr-1">
            <span aria-labelledby="crypto-address-label" className="min-w-0 flex-1 break-all font-mono text-[0.6875rem] leading-4" tabIndex={0}>{address}</span>
            <Button type="button" variant="ghost" size="icon" className="size-10 shrink-0" aria-label="Copy address" onClick={async () => { try { await navigator.clipboard.writeText(address); setCopyStatus("Address copied") } catch { setCopyStatus("Could not copy. Select the address to copy it.") } }}><Copy className="size-4" aria-hidden="true" /></Button>
          </div>
          {copyStatus && <p role="status" className="text-xs text-muted-foreground">{copyStatus}</p>}
        </div>
      </section> : <section className="flex items-start gap-3 rounded-lg bg-muted/60 p-4" aria-label="Deposit details">
        <Wallet className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="grid gap-1"><h3 className="text-sm font-medium">Deposit details unavailable</h3><p className="text-xs leading-5 text-muted-foreground">Contact support for deposit details before sending {asset}.</p></div>
      </section>}
      {!address && onContactSupport && <Button type="button" className="min-h-11 w-full" onClick={onContactSupport}>Contact support</Button>}
      {address && <Alert role="note" className="gap-x-2.5 border-warning/20 bg-warning-surface p-3">
        <Info className="size-4 text-warning" aria-hidden="true" />
        <AlertTitle className="text-xs leading-5">Send only {asset} on {network}</AlertTitle>
        <AlertDescription className="text-xs leading-5 text-foreground/75">Using another asset or network may result in loss of funds.</AlertDescription>
      </Alert>}
      {address && <section className="grid gap-2 rounded-lg border border-border p-4" aria-labelledby="buy-crypto-prompt">
        <h3 id="buy-crypto-prompt" className="text-sm font-medium">Don’t have crypto?</h3>
        <p className="text-xs leading-5 text-muted-foreground">Explore how to buy {asset} with a card or another payment method.</p>
        <Button type="button" variant="outline" className="mt-1 min-h-11 w-full" onClick={() => setShowBuyDemo(true)}>Buy {asset} <ArrowUpRight aria-hidden="true" /></Button>
      </section>}
      {preview && <dl aria-label="Deposit terms" className="grid gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-5">
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Minimum deposit</dt><dd className="text-right font-medium tabular-nums">{terms.minimum}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Confirmations</dt><dd className="text-right font-medium">{terms.confirmations}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Processing time</dt><dd className="text-right font-medium">{terms.time}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Network fee</dt><dd className="text-right font-medium">Set by your wallet</dd></div>
      </dl>}
    </div>
  )
}
const amountPresets = [20, 50, 100, 250]
const demoMin = 10
const demoMax = 5000
const currencySymbols: Record<Currency, string> = { EUR: "€", PLN: "zł", USD: "$" }
const regionNames: Record<Region, string> = { PL: "Poland", DE: "Germany" }
const popularMethods = ["blik", "bank-transfer", "card"]
const demoFeeRates: Record<string, number> = {
  "bank-transfer": 0.02, sepa: 0.02, card: 0.03, blik: 0.03,
  paypal: 0, skrill: 0.025, neteller: 0.025, paysafecard: 0.03,
}

function demoAmounts(amount: string, method: Method) {
  if (!/^\d+(?:[.,]\d{0,2})?$/.test(amount)) return null
  const cents = Math.round(Number(amount.replace(",", ".")) * 100)
  if (cents < demoMin * 100 || cents > demoMax * 100) return null
  const rate = demoFeeRates[method.id]
  return { deposit: cents / 100, fee: rate === undefined ? null : Math.round(cents * rate) / 100 }
}

const onlyDigits = (value: string) => value.replace(/\D/g, "")
const formatCardNumber = (value: string) =>
  onlyDigits(value).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ")
const formatExpiry = (value: string) => {
  const digits = onlyDigits(value).slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}
const formatCurrency = (value: number, currency: Currency) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
const formatTransactionDate = (value: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))

function HistoryReference({ reference }: { reference: string }) {
  const [copyStatus, setCopyStatus] = useState("")
  return <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-sm"><span className="text-muted-foreground">Transaction ID</span><div className="ml-auto flex min-w-0 items-center gap-2"><span className="min-w-0 flex-1 break-all text-xs leading-5">{reference}</span><Button type="button" variant="ghost" size="icon" className="-my-2 size-9 shrink-0" aria-label="Copy transaction ID" onClick={async () => { try { await navigator.clipboard.writeText(reference); setCopyStatus("Transaction ID copied") } catch { setCopyStatus("Could not copy. Select the transaction ID to copy it.") } }}><Copy className="size-4" aria-hidden="true" /></Button></div>{copyStatus && <p role="status" className="basis-full text-xs text-muted-foreground">{copyStatus}</p>}</div>
}

function passesLuhn(value: string) {
  const digits = onlyDigits(value)
  if (digits.length !== 16) return false

  let sum = 0
  let doubleDigit = false
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index])
    if (doubleDigit) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    doubleDigit = !doubleDigit
  }
  return sum % 10 === 0
}

function hasValidExpiry(value: string) {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value)
  if (!match) return false

  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  const now = new Date()
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
}

export const methods: Record<Category, Method[]> = {
  crypto: [
    { id: "usdt", name: "USDT", detail: "Tether · choose a network next", Icon: CircleDollarSign },
    { id: "btc", name: "BTC", detail: "Bitcoin", Icon: Bitcoin },
    { id: "eth", name: "ETH", detail: "Ethereum", Icon: Coins },
    { id: "sol", name: "SOL", detail: "Solana", Icon: Coins },
  ],
  fiat: [
    {
      id: "bank-transfer",
      name: "Bank transfer",
      detail: "Instant · 2% fee",
      Icon: Landmark,
      flow: "bank",
      regions: ["PL"],
    },
    {
      id: "sepa",
      name: "SEPA transfer",
      detail: "Timing varies by bank · 2% fee",
      Icon: Landmark,
      flow: "bank",
      regions: ["DE"],
    },
    {
      id: "card",
      name: "Card",
      detail: "Instant · 3% fee",
      Icon: CreditCard,
      flow: "card",
      regions: ["PL", "DE"],
    },
    {
      id: "blik",
      name: "BLIK",
      detail: "Instant · 3% fee",
      logo: "/payment-logos/blik.jpg",
      logoWide: true,
      flow: "blik",
      regions: ["PL"],
    },
    { id: "paypal", name: "PayPal", detail: "Digital wallet · no fee", flow: "wallet", regions: ["PL"] },
    {
      id: "skrill",
      name: "Skrill",
      detail: "Instant · 2.5% fee",
      logo: "/payment-logos/skrill.svg",
      logoWide: true,
      flow: "wallet",
      regions: ["PL", "DE"],
    },
    {
      id: "neteller",
      name: "Neteller",
      detail: "Instant · 2.5% fee",
      logo: "/payment-logos/neteller.svg",
      logoWide: true,
      flow: "wallet",
      regions: ["PL", "DE"],
    },
    {
      id: "paysafecard",
      name: "Paysafecard",
      detail: "Up to 15 minutes · 3% fee",
      logo: "/payment-logos/paysafecard.svg",
      logoWide: true,
      flow: "wallet",
      regions: ["PL", "DE"],
    },
  ],
}

function getFiatGroups(region: Region): MethodGroup[] {
  const available = methods.fiat.filter((method) => method.regions?.includes(region))
  const popularIds = region === "PL" ? popularMethods : ["sepa", "card"]

  const groups: MethodGroup[] = [
    {
      id: "popular",
      title: "Popular methods",
      methods: popularIds.map((id) => available.find((method) => method.id === id)).filter((method): method is Method => Boolean(method)),
    },
    {
      id: "regular",
      title: "Other methods",
      methods: available.filter((method) => !popularIds.includes(method.id)),
    },
  ]
  return groups.filter((group) => group.methods.length > 0)
}

function MethodMark({ method }: { method: Method }) {
  const coinMarks: Record<string, typeof TokenBTC> = { usdt: TokenUSDT, btc: TokenBTC, eth: TokenETH, sol: TokenSOL }
  const CoinMark = coinMarks[method.id]
  if (CoinMark) return <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-white"><CoinMark variant="background" className="size-7 overflow-hidden rounded-full" aria-hidden="true" /></span>
  const marks: Record<string, typeof PaymentBlik> = {
    blik: PaymentBlik, paypal: PaymentPaypal,
    skrill: PaymentSkrill, neteller: PaymentNeteller, paysafecard: PaymentPaysafecard,
  }
  const Mark = marks[method.id]
  if (method.id === "card") {
    return (
      <span className="flex h-10 w-12 shrink-0 items-center justify-center gap-0.5 rounded-md border border-border bg-white px-1">
        <PaymentVisa variant="light" size={13} className="size-auto h-auto w-5" aria-hidden="true" />
        <PaymentMastercard variant="light" size={13} className="size-auto h-auto w-5" aria-hidden="true" />
      </span>
    )
  }
  if (Mark) return <span className="flex h-10 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white"><Mark variant="light" size={24} className="size-auto h-auto w-10" aria-hidden="true" /></span>
  if (method.logo) {
    return (
      <span className="flex h-10 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white p-2">
        <img src={method.logo} alt="" className="max-h-full max-w-full object-contain" />
      </span>
    )
  }

  const Icon = method.Icon ?? Wallet
  return (
    <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-white text-neutral-700">
      <Icon className="size-6" aria-hidden="true" />
    </span>
  )
}

type HistoryEntry = { kind: "fiat"; transaction: Transaction; createdAt: string; key: string } | { kind: "crypto"; transfer: CryptoTransfer; createdAt: string; key: "crypto" }

function historyInProgress(entry: HistoryEntry) {
  if (entry.kind === "crypto") return entry.transfer.status !== "credited"
  const { status, chargeState } = entry.transaction
  return status === "pending" || status === "payment_received" || ((status === "failed" || status === "canceled") && chargeState !== "not_charged")
}

function historyStatus(entry: HistoryEntry) {
  if (entry.kind === "crypto") {
    const { status, confirmations, requiredConfirmations } = entry.transfer
    return status === "credited" ? { label: "Added to balance", color: "bg-success" } : status === "confirming" ? { label: `Confirming · ${Math.min(confirmations, requiredConfirmations)}/${requiredConfirmations}`, color: "bg-warning" } : { label: "Transfer detected", color: "bg-warning" }
  }
  const { status, method, delayed } = entry.transaction
  if (status === "expired") return { label: "Expired", color: "bg-destructive" }
  if (status === "success") return { label: "Added to balance", color: "bg-success" }
  if (status === "payment_received") return { label: "Payment received", color: "bg-warning" }
  if (entry.transaction.cancellationState === "requested") return { label: "Cancellation requested", color: "bg-warning" }
  if (status === "failed") return entry.transaction.chargeState !== "not_charged" ? { label: "Status unavailable", color: "bg-warning" } : { label: "Failed", color: "bg-destructive" }
  if (status === "canceled") return entry.transaction.chargeState !== "not_charged" ? { label: "Status unavailable", color: "bg-warning" } : { label: "Canceled", color: "bg-destructive" }
  return { label: delayed ? "Taking longer" : method === "BLIK" ? "Confirm in bank" : "Awaiting confirmation", color: "bg-warning" }
}

function HistoryRow({ entry, onOpen }: { entry: HistoryEntry; onOpen: () => void }) {
  const method = entry.kind === "crypto" ? methods.crypto.find((item) => item.name === entry.transfer.asset) : methods.fiat.find((item) => item.name === entry.transaction.method)
  const title = entry.kind === "crypto" ? `${entry.transfer.asset} deposit` : `${entry.transaction.method} deposit`
  const amount = entry.kind === "crypto" ? `${entry.transfer.amount} ${entry.transfer.asset}` : formatCurrency(entry.transaction.amount, entry.transaction.currency)
  const status = historyStatus(entry)
  return (
    <li className="border-b border-border last:border-b-0">
      <button type="button" data-history-id={entry.key} onClick={onOpen} className="flex min-h-20 w-full items-center gap-3 px-1 py-3 text-left hover:bg-accent/50 focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring">
        <span className="shrink-0 [&>span]:size-9 [&>span_svg]:max-h-6 [&>span_svg]:max-w-6">
          {method ? <MethodMark method={method} /> : <span className="flex size-9 items-center justify-center rounded-md border border-border"><Wallet className="size-4" aria-hidden="true" /></span>}
        </span>
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-sm font-medium">{title}</span>
          <span className="text-sm font-semibold tabular-nums sm:hidden">{amount}</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className={`size-1.5 shrink-0 rounded-full ${status.color}`} aria-hidden="true" />{status.label}</span>
          <span className="text-xs text-muted-foreground">{formatTransactionDate(entry.createdAt)}</span>
        </span>
        <span className="hidden shrink-0 self-start pt-0.5 text-sm font-semibold tabular-nums sm:inline">{amount}</span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
    </li>
  )
}

function HistoryReceipt({ entry, onReturnToGame, onChooseAnother, onRetryBlik, onContactSupport, onCancel, onCheckCancel }: { entry: HistoryEntry; onReturnToGame: () => void; onChooseAnother: () => void; onRetryBlik: (transaction: Transaction) => void; onContactSupport?: (context: SupportContext) => void; onCancel?: () => Promise<CancellationResult>; onCheckCancel?: () => Promise<CancellationCheck> }) {
  const fiat = entry.kind === "fiat" ? entry.transaction : null
  const transfer = entry.kind === "crypto" ? entry.transfer : null
  const status = historyStatus(entry)
  const amount = fiat ? formatCurrency(fiat.amount, fiat.currency) : `${transfer!.amount} ${transfer!.asset}`
  const method = fiat?.method ?? transfer!.asset
  const isPending = fiat?.status === "pending" || Boolean(transfer && transfer.status !== "credited")
  const uncertainPayment = fiat && (fiat.status === "failed" || fiat.status === "canceled") && fiat.chargeState !== "not_charged"
  const retryableBlik = fiat?.method === "BLIK" && fiat.currency === "PLN" && (fiat.status === "failed" || fiat.status === "canceled") && fiat.chargeState === "not_charged"
  const cancellationRequested = fiat?.status === "pending" && fiat.cancellationState === "requested"
  const message = transfer
    ? transfer.status === "credited" ? "Your deposit is available to use." : transfer.status === "detected" ? "We found your transfer. Waiting for network confirmations." : "Your transfer is confirming on the network."
    : cancellationRequested ? "We're waiting for confirmation. The payment may still complete. Check this deposit before paying again."
    : fiat?.status === "pending" && fiat.delayed ? "We're checking this payment. Don't pay again until its status is clear."
    : fiat?.status === "payment_received" ? "Your payment was confirmed. We're waiting for the balance update. You can close this screen and check the transaction later."
    : uncertainPayment ? blikCopy.statusUnclearBody
    : fiat?.status === "failed" ? "This deposit did not complete. Nothing was charged."
    : fiat?.status === "canceled" ? "Nothing was charged. You can try again."
    : "Your deposit is available to use."
  const showSupport = fiat ? (fiat.status === "pending" && fiat.delayed) || cancellationRequested || fiat.status === "failed" || uncertainPayment || fiat.status === "payment_received" : transfer?.status !== "credited"

  return (
    <section className="grid gap-5" aria-label="Deposit details">
      <div className="grid gap-2 border-b border-border pb-5 text-center">
        <p className="text-sm text-muted-foreground">{method} deposit</p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{amount}</p>
        <p className="flex items-center justify-center gap-2 text-sm font-medium"><span className={`size-2 rounded-full ${status.color}`} aria-hidden="true" />{status.label}</p>
        <p className="text-xs text-muted-foreground">{formatTransactionDate(entry.createdAt)}</p>
      </div>
      {(!isPending || fiat?.delayed || cancellationRequested) && <p className="text-sm leading-6 text-muted-foreground">{message}</p>}
      {isPending && !fiat?.delayed && !cancellationRequested && <div>{transfer ? <DepositTimeline kind="crypto" transfer={transfer} /> : fiat?.status === "pending" && <DepositTimeline kind="fiat" status="pending" method={fiat.method} chargeState={fiat.chargeState} />}</div>}
      {fiat?.status === "failed" && !uncertainPayment && <div className="border-t border-border pt-4"><DepositTimeline kind="fiat" status="failed" method={fiat.method} chargeState={fiat.chargeState} /></div>}
      <dl className="grid gap-3 border-t border-border pt-4 text-sm">
        {fiat ? <>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Payment method</dt><dd className="font-medium">{fiat.method}</dd></div>
          {fiat.status !== "canceled" && fiat.status !== "failed" && fiat.fee !== null && <>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{fiat.status === "success" || fiat.status === "payment_received" ? blikCopy.feePaid : blikCopy.fee}</dt><dd className="font-medium tabular-nums">{formatCurrency(fiat.fee, fiat.currency)}</dd></div>
            <div className="flex justify-between gap-4 font-medium"><dt>{fiat.status === "success" || fiat.status === "payment_received" ? blikCopy.totalPaid : blikCopy.requestedTotal}</dt><dd className="tabular-nums">{formatCurrency(fiat.amount + fiat.fee, fiat.currency)}</dd></div>
          </>}
        </> : <>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Network</dt><dd className="text-right font-medium">{transfer!.network}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Confirmations</dt><dd className="font-medium tabular-nums">{Math.min(transfer!.confirmations, transfer!.requiredConfirmations)} of {transfer!.requiredConfirmations}</dd></div>
        </>}
      </dl>
      {fiat && <HistoryReference reference={fiat.reference} />}
      <div className="grid gap-2">
        {retryableBlik && fiat && <Button type="button" className="min-h-11 w-full" onClick={() => onRetryBlik(fiat)}>{blikCopy.retry}</Button>}
        {fiat?.status === "failed" && !retryableBlik && !uncertainPayment && <Button type="button" className="min-h-11 w-full" onClick={onChooseAnother}>Choose another method</Button>}
        {(retryableBlik || fiat?.status === "canceled" && !uncertainPayment) && <Button type="button" variant={retryableBlik ? "outline" : "default"} className="min-h-11 w-full sm:min-h-10" onClick={onChooseAnother}>Choose another method</Button>}
        {(fiat?.status === "success" || transfer?.status === "credited") && <Button type="button" className="min-h-11 w-full" onClick={onReturnToGame}>Back to game</Button>}
        {fiat?.status === "pending" && !fiat.cancellationState && fiat.cancelable === true && fiat.chargeState === "not_charged" && onCancel && onCheckCancel && <CancelDepositAction onCheck={onCheckCancel} onConfirm={onCancel} />}
        {onContactSupport && showSupport && <Button type="button" variant="outline" className="min-h-11 w-full" onClick={() => onContactSupport(transfer ? { kind: "crypto", asset: transfer.asset, network: transfer.network, transfer } : { kind: "fiat", transaction: fiat! })}>Contact support</Button>}
      </div>
    </section>
  )
}

export function CardFields({
  details,
  attempted,
  onChange,
}: {
  details: CardDetails
  attempted: boolean
  onChange: (field: keyof CardDetails, value: string) => void
}) {
  const cardDigits = onlyDigits(details.number)
  const cardPrefix = Number(cardDigits.slice(0, 4))
  const cardBrand = cardDigits.startsWith("4") ? "Visa" : /^5[1-5]/.test(cardDigits) || (cardDigits.length >= 4 && cardPrefix >= 2221 && cardPrefix <= 2720) ? "Mastercard" : null
  const numberValid = passesLuhn(details.number)
  const expiryValid = hasValidExpiry(details.expiry)
  const cvcValid = details.cvc.length === 3
  const holderValid = details.holder.trim().length >= 2

  return (
    <form
      className="grid gap-3 border-t border-border pt-4"
      aria-label="Card details"
      onSubmit={(event) => event.preventDefault()}
    >
      <h3 className="text-base font-semibold">Card details</h3>
      <div className="grid gap-1.5">
        <Label htmlFor="card-number">Card number</Label>
        <div className="relative">
        <Input
          id="card-number"
          inputMode="numeric"
          autoComplete="off"
          maxLength={19}
          aria-invalid={attempted && !numberValid}
          aria-describedby={attempted && !numberValid ? "card-number-error" : undefined}
          placeholder="0000 0000 0000 0000"
          value={details.number}
          onChange={(event) => onChange("number", formatCardNumber(event.target.value))}
          className="h-11 border-input bg-background pr-16 text-foreground placeholder:text-muted-foreground sm:h-10"
        />
        {cardBrand && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center" aria-hidden="true">{cardBrand === "Visa" ? <PaymentVisa variant="light" size={18} className="rounded-sm" /> : <PaymentMastercard variant="light" size={18} className="rounded-sm" />}</span>}
        </div>
        <span className="sr-only" aria-live="polite">{cardBrand ? `${cardBrand} card detected` : ""}</span>
        {attempted && !numberValid && (
          <p id="card-number-error" className="text-xs text-destructive" role="alert">
            Check your card number.
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 items-start gap-3">
        <div className="grid gap-1.5">
          <div className="flex h-6 items-center"><Label htmlFor="card-expiry">Expiry date</Label></div>
          <Input
            id="card-expiry"
            inputMode="numeric"
            autoComplete="off"
            maxLength={5}
            aria-invalid={attempted && !expiryValid}
            aria-describedby={attempted && !expiryValid ? "card-expiry-error" : undefined}
            placeholder="MM/YY"
            value={details.expiry}
            onChange={(event) => onChange("expiry", formatExpiry(event.target.value))}
            className="h-11 border-input bg-background text-foreground placeholder:text-muted-foreground sm:h-10"
          />
          {attempted && !expiryValid && (
            <p id="card-expiry-error" className="text-xs text-destructive" role="alert">
              Enter a valid date (MM/YY).
            </p>
          )}
        </div>
        <div className="grid gap-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="card-cvc">CVC</Label>
            <Popover><PopoverTrigger render={<Button type="button" variant="ghost" size="icon-xs" aria-label="What is CVC?" className="-my-2.5 size-11 text-muted-foreground sm:my-0 sm:size-6" />}><Info className="size-4" aria-hidden="true" /></PopoverTrigger><PopoverContent side="top" className="w-56"><PopoverTitle>What is CVC?</PopoverTitle><PopoverDescription>The 3-digit security code on the back of your card.</PopoverDescription></PopoverContent></Popover>
          </div>
          <Input
            id="card-cvc"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={3}
            aria-invalid={attempted && !cvcValid}
            aria-describedby={attempted && !cvcValid ? "card-cvc-error" : undefined}
            placeholder="•••"
            value={details.cvc}
            onChange={(event) => onChange("cvc", onlyDigits(event.target.value).slice(0, 3))}
            className="h-11 border-input bg-background text-foreground placeholder:text-muted-foreground sm:h-10"
          />
          {attempted && !cvcValid && (
            <p id="card-cvc-error" className="text-xs text-destructive" role="alert">
              Enter the 3-digit code.
            </p>
          )}
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="card-holder">Name on card</Label>
        <Input
          id="card-holder"
          autoComplete="off"
          aria-invalid={attempted && !holderValid}
          aria-describedby={attempted && !holderValid ? "card-holder-error" : undefined}
          placeholder="As shown on your card"
          value={details.holder}
          onChange={(event) => onChange("holder", event.target.value)}
          className="h-11 border-input bg-background text-foreground placeholder:text-muted-foreground sm:h-10"
        />
        {attempted && !holderValid && (
          <p id="card-holder-error" className="text-xs text-destructive" role="alert">
            Enter the name on your card.
          </p>
        )}
      </div>
    </form>
  )
}

export function AmountPicker({
  amount,
  currency,
  error,
  onChange,
}: {
  amount: string
  currency: Currency
  error: string | null
  onChange: (value: string) => void
}) {
  const amountRef = useRef<HTMLInputElement>(null)
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="deposit-amount">Deposit amount · {currency}</Label>
        <div className="relative">
          <Input
            id="deposit-amount"
            ref={amountRef}
            inputMode="decimal"
            autoComplete="off"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "deposit-amount-error" : "deposit-amount-hint"}
            placeholder="50.00"
            value={amount}
            onChange={(event) => {
              const next = event.target.value
              if (/^\d*(?:[.,]\d{0,2})?$/.test(next)) onChange(next)
            }}
            className="h-10 border-input bg-background pl-10 pr-10 text-left tabular-nums text-foreground placeholder:text-muted-foreground"
          />
          {amount && (
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Clear deposit amount" onClick={() => { onChange(""); amountRef.current?.focus() }} className="absolute inset-y-0 right-2 my-auto text-muted-foreground">
              <X className="size-4" aria-hidden="true" />
            </Button>
          )}
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
            {currencySymbols[currency]}
          </span>
        </div>
        {error ? (
          <p id="deposit-amount-error" className="text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : (
          <p id="deposit-amount-hint" className="text-xs text-muted-foreground">
            Limit: 10–5,000 {currencySymbols[currency]}
          </p>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2" role="group" aria-label="Quick amounts">
        {amountPresets.map((preset) => (
          <Button
            key={preset}
            type="button"
            variant={Number(amount.replace(",", ".")) === preset ? "secondary" : "outline"}
            aria-pressed={Number(amount.replace(",", ".")) === preset}
            onClick={() => onChange(String(preset))}
            className={`h-11 px-1 tabular-nums sm:h-9 sm:px-2 ${Number(amount.replace(",", ".")) === preset ? "border-foreground/50 bg-accent text-foreground" : "border-border bg-transparent text-foreground hover:bg-accent"}`}
          >
            {preset} {currencySymbols[currency]}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function MethodList({ methods: options, label, onSelect }: { methods: Method[]; label: string; onSelect: (id: string) => void }) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((method) => (
        <Button key={method.id} type="button" variant="ghost" onClick={() => onSelect(method.id)} className="h-auto min-h-[58px] w-full justify-start gap-3 rounded-xl bg-muted/60 px-3 py-2.5 text-left hover:bg-accent">
          <MethodMark method={method} />
          <span className="min-w-0 flex-1 whitespace-normal"><span className="block break-words text-sm font-medium text-foreground">{method.name}</span><span className="block break-words text-xs leading-4 text-muted-foreground">{method.detail}</span></span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      ))}
    </div>
  )
}

export function MethodDetails({
  method,
  amount,
  currency,
  amountError,
  cardDetails,
  cardAttempted,
  onAmountChange,
  onCardChange,
  blikCode, setBlikCode, bank, setBank,
}: {
  method: Method
  amount: string
  currency: Currency
  amountError: string | null
  cardDetails: CardDetails
  cardAttempted: boolean
  onAmountChange: (value: string) => void
  onCardChange: (field: keyof CardDetails, value: string) => void
  blikCode: string
  setBlikCode: (value: string) => void
  bank: string
  setBank: (value: string) => void
}) {
  const amounts = demoAmounts(amount, method)
  return (
    <>
      <AmountPicker amount={amount} currency={currency} error={amountError} onChange={onAmountChange} />
      {method.flow === "card" && (
        <CardFields details={cardDetails} attempted={cardAttempted} onChange={onCardChange} />
      )}
      {method.flow === "wallet" && (
        <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
          You’ll continue to {method.name} to complete your payment.
        </p>
      )}
      {method.flow === "bank" && (
        <div className="grid gap-1.5 border-t border-border pt-4">
          <Label htmlFor="bank-choice">Choose your bank</Label>
          <NativeSelect id="bank-choice" value={bank} onChange={(event) => setBank(event.target.value)} className="w-full [&_select]:h-10"><NativeSelectOption value="">Choose your bank</NativeSelectOption>{["PKO Bank Polski", "Bank Pekao", "mBank", "ING", "Santander", "Other bank"].map((name) => <NativeSelectOption key={name}>{name}</NativeSelectOption>)}</NativeSelect>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Continue to your bank to confirm your payment.
          </p>
        </div>
      )}
      {method.flow === "blik" && (
        <div className="grid gap-1.5 border-t border-border pt-4">
          <Label htmlFor="blik-code">6-digit BLIK code</Label>
          <Input id="blik-code" inputMode="numeric" autoComplete="off" placeholder="000000" aria-describedby="blik-code-hint" value={blikCode} onChange={(event) => setBlikCode(onlyDigits(event.target.value).slice(0, 6))} className="h-10 border-input bg-background text-foreground" />
          <p id="blik-code-hint" className="text-xs leading-relaxed text-muted-foreground">Find the code in your banking app.</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Confirm the payment in your banking app.
          </p>
          {/* Temporary portfolio test instructions; remove before production. */}
          <p className="text-xs leading-relaxed text-muted-foreground">Demo only. No payment is processed. Test codes: 123456 succeeds, 000000 is declined, 111111 stays pending.</p>
        </div>
      )}
      {amounts && (
        <Collapsible defaultOpen className="rounded-lg bg-muted/60 px-4 text-sm">
          <CollapsibleTrigger className="group flex min-h-11 w-full items-center justify-between gap-3 text-left font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            Payment summary <ChevronDown className="size-4 shrink-0 transition-transform group-data-[panel-open]:rotate-180" aria-hidden="true" />
          </CollapsibleTrigger>
          <CollapsibleContent className="grid gap-3 pb-4">
          <div className="flex justify-between gap-3"><span className="text-muted-foreground">Deposit amount</span><span className="tabular-nums">{formatCurrency(amounts.deposit, currency)}</span></div>
          <div className="flex justify-between gap-3"><span className="text-muted-foreground">Fee</span><span className="text-right tabular-nums">{amounts.fee === null ? "Determined by provider" : formatCurrency(amounts.fee, currency)}</span></div>
          <div className="flex justify-between gap-3 border-t border-border pt-3 font-semibold"><span>Total to pay</span><span className="text-right tabular-nums">{amounts.fee === null ? "Determined by provider" : formatCurrency(amounts.deposit + amounts.fee, currency)}</span></div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {demoFeeRates[method.id] === undefined
                ? "The payment provider determines the fee."
                : demoFeeRates[method.id] === 0
                  ? "There is no processing fee for this payment method."
                  : `Processing fee: ${demoFeeRates[method.id] * 100}% of the amount you receive. The fee is added to your payment.`}
            </p>
          </CollapsibleContent>
        </Collapsible>
      )}
    </>
  )
}

type CancellationCheck = "available" | "unavailable" | "updated"

function BlikCountdown({ expiresAt, onExpire }: { expiresAt?: string; onExpire?: () => void }) {
  // Placeholder duration for the portfolio flow when no provider expiry exists.
  const [fallbackExpiry] = useState(() => Date.now() + 120_000)
  const parsedExpiry = expiresAt ? Date.parse(expiresAt) : NaN
  const expiry = Number.isFinite(parsedExpiry) ? parsedExpiry : fallbackExpiry
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const seconds = Math.max(0, Math.ceil((expiry - now) / 1000))
  useEffect(() => { if (seconds === 0) onExpire?.() }, [seconds, onExpire])
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
  return <><span role="timer" className="shrink-0 text-sm text-muted-foreground">Time left <span className="font-medium tabular-nums text-foreground">{time}</span></span><span className="sr-only" aria-live="polite">{seconds === 60 || seconds === 30 ? `${seconds} seconds left` : ""}</span></>
}

function CancelDepositAction({ onCheck, onConfirm }: { onCheck: () => Promise<CancellationCheck>; onConfirm: () => Promise<CancellationResult> }) {
  const copy = blikCopy
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [checkState, setCheckState] = useState<"checking" | "available" | "unavailable" | "error">("checking")
  const [canceling, setCanceling] = useState(false)
  const [error, setError] = useState(false)
  const check = async () => {
    setCheckState("checking")
    setError(false)
    try {
      const result = await onCheck()
      if (result === "updated") dialogRef.current?.close()
      else setCheckState(result)
    } catch {
      setCheckState("error")
    }
  }
  const open = () => {
    dialogRef.current?.showModal()
    void check()
  }
  return <>
    <Button type="button" variant="ghost" className="min-h-11 w-full text-muted-foreground sm:min-h-9" onClick={open}>{copy.cancelOpen}</Button>
    <dialog ref={dialogRef} aria-labelledby="cancel-deposit-title" onCancel={(event) => { if (canceling) event.preventDefault() }} className="fixed inset-0 m-auto w-[calc(100%-32px)] max-w-sm rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl backdrop:bg-black/60">
      <div className="grid gap-4">
        <div className="grid gap-2"><h2 id="cancel-deposit-title" className="text-base font-semibold">{checkState === "checking" ? copy.cancelChecking : checkState === "available" ? copy.cancelTitle : checkState === "error" ? copy.cancelCheckError : copy.cancelBlocked}</h2><p className="text-sm leading-5 text-muted-foreground">{checkState === "checking" ? copy.cancelCheckingBody : checkState === "available" ? copy.cancelBody : checkState === "error" ? copy.cancelCheckErrorBody : copy.cancelBlockedBody}</p></div>
        {error && <p role="alert" className="text-sm leading-5 text-destructive">{copy.cancelError}</p>}
        <div className="grid gap-2 sm:grid-cols-2"><Button type="button" className="min-h-11" disabled={canceling} onClick={() => dialogRef.current?.close()}>{checkState === "unavailable" ? copy.cancelGotIt : copy.cancelKeep}</Button>{(checkState === "error" || error) && <Button type="button" variant="outline" className="min-h-11" onClick={() => void check()}>{copy.cancelCheckRetry}</Button>}{checkState === "available" && !error && <Button type="button" variant="outline" className="min-h-11 text-destructive" disabled={canceling} onClick={async () => { setCanceling(true); try { if (await onConfirm() !== "rejected") dialogRef.current?.close(); else setError(true) } catch { setError(true) } finally { setCanceling(false) } }}>{canceling ? copy.cancelProgress : copy.cancelConfirm}</Button>}</div>
      </div>
    </dialog>
  </>
}

export function PaymentStatusPanel({
  status,
  method,
  amount,
  currency,
  onChooseAnother,
  delayed = false,
  onViewTransactions,
  onContactSupport,
  transaction,
  onCancel,
  onCheckCancel,
  onExpire,
}: {
  status: Exclude<PaymentStatus, "idle">
  method: Method | undefined
  amount: number
  currency: Currency
  onChooseAnother: () => void
  delayed?: boolean
  onViewTransactions?: () => void
  onContactSupport?: () => void
  transaction?: Transaction
  onCancel?: () => Promise<CancellationResult>
  onCheckCancel?: () => Promise<CancellationCheck>
  onExpire?: () => void
}) {
  const [copyStatus, setCopyStatus] = useState("")
  const copy = blikCopy
  const isBlik = method?.flow === "blik"
  const isBlikConfirmation = isBlik && status === "pending" && !delayed && transaction?.cancellationState !== "requested"
  const uncertainPayment = (status === "failed" || status === "canceled") && transaction?.chargeState !== "not_charged"
  const cancellationRequested = status === "pending" && transaction?.cancellationState === "requested"
  const content = {
    expired: { Icon: Clock, color: "bg-warning-surface text-warning", title: copy.expiredTitle, description: copy.expiredBody },
    pending: {
      Icon: Clock,
      color: "bg-warning-surface text-warning",
      title: cancellationRequested ? copy.cancellationRequestedTitle : delayed ? method?.flow === "blik" ? copy.delayedTitle : copy.cardDelayedTitle : method?.flow === "blik" ? copy.pendingTitle : "Awaiting confirmation",
      description: cancellationRequested ? copy.cancellationRequestedBody : delayed ? method?.flow === "blik" ? copy.delayedBody : copy.cardDelayedBody : null,
    },
    payment_received: {
      Icon: CircleCheck,
      color: "bg-success-surface text-success",
      title: "Payment received",
      description: null,
    },
    success: {
      Icon: CircleCheck,
      color: "bg-success-surface text-success",
      title: copy.successTitle,
      description: null,
    },
    failed: {
      Icon: uncertainPayment ? Clock : CircleX,
      color: uncertainPayment ? "bg-warning-surface text-warning" : "bg-error-surface text-destructive",
      title: uncertainPayment ? copy.statusUnclearTitle : copy.failedTitle,
      description: uncertainPayment ? copy.statusUnclearBody : null,
    },
    canceled: {
      Icon: uncertainPayment ? Clock : CircleX,
      color: uncertainPayment ? "bg-warning-surface text-warning" : "bg-error-surface text-destructive",
      title: uncertainPayment ? copy.statusUnclearTitle : copy.canceledTitle,
      description: uncertainPayment ? copy.statusUnclearBody : null,
    },
  }[status]
  const Icon = content.Icon

  return (
    <div className="grid gap-4">
      <div className={`flex ${isBlik && status === "pending" && !delayed && !cancellationRequested ? "flex-col items-center gap-2" : "items-start gap-3"}`}>
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full sm:size-10 ${content.color}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="grid min-w-0 flex-1 gap-1 pt-0.5" role="status" aria-live="polite">
          <h2 className={`text-base font-semibold leading-snug ${isBlik && status === "pending" && !delayed && !cancellationRequested ? "text-center" : ""}`}>{content.title}</h2>
          {isBlik && status === "success" && <p className="text-sm leading-5 text-muted-foreground">{formatCurrency(amount, currency)} added to your balance.</p>}
          {status === "payment_received" && <p className="text-sm leading-5 text-muted-foreground">Balance update pending · {formatCurrency(amount, currency)}</p>}
          {content.description && <p className="text-sm leading-5 text-muted-foreground sm:leading-relaxed">{content.description}</p>}
        </div>
        {isBlik && status === "pending" && !cancellationRequested && <BlikCountdown key={transaction?.id} expiresAt={transaction?.expiresAt} onExpire={onExpire} />}
      </div>
      {!uncertainPayment && !cancellationRequested && status !== "payment_received" && status !== "expired" && !(isBlik && (status === "success" || status === "pending" && delayed)) && <DepositTimeline kind="fiat" status={status} method={method?.name} chargeState={transaction?.chargeState} />}
      <dl className="grid gap-3 rounded-lg bg-muted/60 p-4 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{isBlikConfirmation ? "Deposit" : status === "success" ? copy.creditedAmount : status === "canceled" ? copy.requestedAmount : copy.amount}</dt><dd className="shrink-0 text-right font-medium tabular-nums">{formatCurrency(amount, currency)}</dd></div>
        {!isBlikConfirmation && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{copy.method}</dt><dd className="shrink-0 text-right font-medium">{method?.name ?? "—"}</dd></div>}
        {status !== "canceled" && status !== "failed" && transaction?.fee !== null && transaction?.fee !== undefined && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{isBlikConfirmation ? "Fee" : status === "success" || status === "payment_received" ? copy.feePaid : copy.fee}</dt><dd className="shrink-0 text-right font-medium tabular-nums">{formatCurrency(transaction.fee, currency)}</dd></div>}
        {status !== "canceled" && status !== "failed" && transaction?.fee !== null && transaction?.fee !== undefined && <div className="flex justify-between gap-3 border-t border-border pt-3 font-semibold"><dt>{isBlikConfirmation ? "Total" : status === "success" || status === "payment_received" ? copy.totalPaid : copy.requestedTotal}</dt><dd className="text-right tabular-nums">{formatCurrency(amount + transaction.fee, currency)}</dd></div>}
        {status === "success" && transaction && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{copy.date}</dt><dd className="text-right font-medium">{formatTransactionDate(transaction.createdAt)}</dd></div>}
        {transaction && <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border pt-3"><dt className="text-muted-foreground">{copy.reference}</dt><dd className="ml-auto flex min-w-0 items-center gap-2"><span className="min-w-0 flex-1 break-all text-xs leading-5">{transaction.reference}</span><Button type="button" variant="ghost" size="icon" className="-my-2 size-9 shrink-0" aria-label={copy.copyReference} onClick={async () => { try { await navigator.clipboard.writeText(transaction.reference); setCopyStatus(copy.copiedReference) } catch { setCopyStatus(copy.copyFailed) } }}><Copy className="size-4" aria-hidden="true" /></Button></dd>{copyStatus && <p role="status" className="basis-full text-xs text-muted-foreground">{copyStatus}</p>}</div>}
      </dl>
      {status === "pending" && !cancellationRequested && onViewTransactions && <Button type="button" variant="outline" className="min-h-11 sm:min-h-10" onClick={onViewTransactions}>View transaction</Button>}
      {status === "pending" && !cancellationRequested && transaction?.cancelable === true && transaction.chargeState === "not_charged" && onCancel && onCheckCancel && <CancelDepositAction onCheck={onCheckCancel} onConfirm={onCancel} />}
      {status === "expired" && <Button type="button" className="min-h-11" onClick={onChooseAnother}>{copy.startNewDeposit}</Button>}
      {status === "payment_received" && onViewTransactions && <Button type="button" variant="outline" className="min-h-11 sm:min-h-10" onClick={onViewTransactions}>View transaction</Button>}
      {status === "success" && transaction && onViewTransactions && <Button type="button" variant="outline" className="min-h-11 sm:min-h-10" onClick={onViewTransactions}>{copy.viewTransaction}</Button>}
      {status === "failed" && !uncertainPayment && <Button type="button" variant="outline" className="min-h-11 sm:min-h-10" onClick={onChooseAnother}>{copy.chooseMethod}</Button>}
      {status === "canceled" && !uncertainPayment && isBlik && <Button type="button" variant="outline" className="min-h-11 sm:min-h-10" onClick={onChooseAnother}>{copy.chooseMethod}</Button>}
      {(status === "failed" && !uncertainPayment || uncertainPayment || status === "payment_received" || cancellationRequested) && onContactSupport && <Button type="button" variant="outline" className="min-h-11 sm:min-h-10" onClick={onContactSupport}>{copy.contactSupport}</Button>}
    </div>
  )
}

export default function App({ initialCategory = "fiat", initialMethod = null, initialStatus = "idle", initialDelayed = false, initialChargeState, initialTransactions, initialView = "deposit", cryptoPreview = true, initialCryptoTransfer, initialCryptoBalance, onReturnToGame, onContactSupport, onCancelDeposit, onCheckCancelDeposit }: { initialCategory?: Category; initialMethod?: string | null; initialStatus?: PaymentStatus; initialDelayed?: boolean; initialChargeState?: Transaction["chargeState"]; initialTransactions?: Transaction[]; initialView?: "deposit" | "transactions"; cryptoPreview?: boolean; initialCryptoTransfer?: CryptoTransfer; initialCryptoBalance?: string; onReturnToGame?: () => void; onContactSupport?: (context: SupportContext) => void; onCancelDeposit?: (transaction: Transaction) => Promise<CancellationResult>; onCheckCancelDeposit?: (transaction: Transaction) => Promise<Transaction> } = {}) {
  const [category, setCategory] = useState<Category>(initialCategory)
  const region: Region = "PL"
  const currency: Currency = "PLN"
  const [blikCode, setBlikCode] = useState(initialMethod === "blik" ? sampleBlikCode : "")
  const [bank, setBank] = useState("")
  const [network, setNetwork] = useState("Tron (TRC20)")
  const [selected, setSelected] = useState<string | null>(initialMethod)
  const [isOpen, setIsOpen] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialStatus)
  const [view, setView] = useState<"deposit" | "transactions">(initialView)
  const hasInitialTransaction = initialStatus !== "idle"
  const [transactions, setTransactions] = useState<Transaction[]>(() => initialTransactions ?? (hasInitialTransaction ? [{ id: 1, reference: "TXN-4F82B1C9", createdAt: "2026-11-07T18:00:00Z", method: initialMethod === "card" ? "Card" : "BLIK", amount: 50, fee: 1.5, currency: "PLN", status: initialStatus as Exclude<PaymentStatus, "idle">, delayed: initialDelayed, chargeState: initialChargeState, cancelable: initialStatus === "pending" && Boolean(onCancelDeposit && onCheckCancelDeposit) }] : []))
  const transactionsRef = useRef(transactions)
  useEffect(() => { transactionsRef.current = transactions }, [transactions])
  const balanceCurrency = currency
  const balance = transactions.filter((transaction) => transaction.status === "success" && transaction.currency === balanceCurrency).reduce((total, transaction) => total + transaction.amount, 0)
  const [activeTransaction, setActiveTransaction] = useState<number | null>(hasInitialTransaction ? 1 : null)
  const [detailTransaction, setDetailTransaction] = useState<number | null>(null)
  const [cryptoExpanded, setCryptoExpanded] = useState(false)
  const historyPanelRef = useRef<HTMLDivElement>(null)
  const historyScrollRef = useRef(0)
  const historyFocusRef = useRef<string | null>(null)
  const activeTransactionRef = useRef<number | null>(hasInitialTransaction ? 1 : null)
  const nextTransactionId = useRef(Math.max(hasInitialTransaction ? 1 : 0, ...(initialTransactions ?? []).map((transaction) => transaction.id)))
  const paymentTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (paymentTimer.current) clearTimeout(paymentTimer.current) }, [])
  const [amount, setAmount] = useState("50")
  const [cardDetails, setCardDetails] = useState<CardDetails>(emptyCard)
  const [cardAttempted, setCardAttempted] = useState(false)
  const historyEntries: HistoryEntry[] = [
    ...transactions.map((transaction) => ({ kind: "fiat" as const, transaction, createdAt: transaction.createdAt, key: `fiat-${transaction.id}` })),
    ...(initialCryptoTransfer ? [{ kind: "crypto" as const, transfer: initialCryptoTransfer, createdAt: initialCryptoTransfer.createdAt, key: "crypto" as const }] : []),
  ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  const selectedHistoryEntry = cryptoExpanded ? historyEntries.find((entry) => entry.kind === "crypto") : historyEntries.find((entry) => entry.kind === "fiat" && entry.transaction.id === detailTransaction)
  const activeHistoryEntries = historyEntries.filter(historyInProgress)
  const pastHistoryEntries = historyEntries.filter((entry) => !historyInProgress(entry))
  const openHistoryEntry = (entry: HistoryEntry) => {
    historyScrollRef.current = historyPanelRef.current?.scrollTop ?? 0
    historyFocusRef.current = entry.key
    if (entry.kind === "crypto") { setCryptoExpanded(true); setDetailTransaction(null) }
    else { setDetailTransaction(entry.transaction.id); setCryptoExpanded(false) }
  }
  const closeHistoryEntry = () => { setDetailTransaction(null); setCryptoExpanded(false) }
  useEffect(() => {
    if (view !== "transactions") return
    if (detailTransaction !== null || cryptoExpanded) { historyPanelRef.current?.scrollTo(0, 0); return }
    if (historyFocusRef.current) {
      historyPanelRef.current?.scrollTo(0, historyScrollRef.current)
      historyPanelRef.current?.querySelector<HTMLButtonElement>(`[data-history-id="${historyFocusRef.current}"]`)?.focus({ preventScroll: true })
      historyFocusRef.current = null
    }
  }, [view, detailTransaction, cryptoExpanded])
  const availableMethods =
    category === "crypto"
      ? methods.crypto
      : methods.fiat.filter((method) => method.regions?.includes(region))
  const selectedMethod = availableMethods.find((method) => method.id === selected)
  const selectedCryptoNetwork = initialCryptoTransfer && selectedMethod?.name === initialCryptoTransfer.asset ? initialCryptoTransfer.network : selectedMethod?.id === "usdt" ? network : selectedMethod?.id === "btc" ? "Bitcoin" : selectedMethod?.id === "sol" ? "Solana" : "Ethereum"
  const fiatGroups = getFiatGroups(region)
  const parsedAmount = Number(amount.replace(",", "."))
  const amountSyntaxValid = /^\d+(?:[.,]\d{0,2})?$/.test(amount)
  const amountValid = amountSyntaxValid && parsedAmount >= demoMin && parsedAmount <= demoMax
  const amountError = (() => {
    if (amount.length === 0) return null
    if (!amountSyntaxValid) return "Enter an amount with up to two decimal places."
    if (parsedAmount < demoMin) return `The minimum is ${demoMin} ${currencySymbols[currency]}.`
    if (parsedAmount > demoMax) {
      return `The maximum is ${new Intl.NumberFormat("en-GB").format(demoMax)} ${currencySymbols[currency]}.`
    }
    return null
  })()
  const cardReady =
    passesLuhn(cardDetails.number) &&
    hasValidExpiry(cardDetails.expiry) &&
    cardDetails.cvc.length === 3 &&
    cardDetails.holder.trim().length >= 2

  const resetSelection = () => {
    setSelected(null)
    setPaymentStatus("idle")
    setCardDetails(emptyCard)
    setCardAttempted(false)
    setBlikCode("")
    setBank("")
    setActiveTransaction(null)
    activeTransactionRef.current = null
  }

  const selectMethod = (id: string) => {
    setSelected(id)
    setBlikCode("")
    setBank("")
    setPaymentStatus("idle")
    setCardAttempted(false)
    setCardDetails(emptyCard)
  }

  const startPayment = () => {
    if (category === "crypto") return
    if (!selectedMethod || !amountValid) return
    if (selectedMethod.flow === "blik" && blikCode.length !== 6) return
    if (selectedMethod.id === "bank-transfer" && !bank) return
    if (selectedMethod.flow === "card" && !cardReady) {
      setCardAttempted(true)
      const firstInvalid = !passesLuhn(cardDetails.number) ? "card-number" : !hasValidExpiry(cardDetails.expiry) ? "card-expiry" : cardDetails.cvc.length !== 3 ? "card-cvc" : "card-holder"
      document.getElementById(firstInvalid)?.focus()
      return
    }
    setPaymentStatus("pending")
    const id = ++nextTransactionId.current
    const amounts = demoAmounts(amount, selectedMethod)
    setTransactions((current) => [{ id, reference: `TXN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, createdAt: new Date().toISOString(), method: selectedMethod.name, amount: parsedAmount, fee: amounts?.fee ?? null, currency, status: "pending", chargeState: selectedMethod.flow === "blik" ? "not_charged" : "unknown", cancelable: selectedMethod.flow === "blik", expiresAt: selectedMethod.flow === "blik" ? new Date(Date.now() + 120_000).toISOString() : undefined }, ...current])
    setActiveTransaction(id)
    activeTransactionRef.current = id
    if (selectedMethod.flow === "blik" || selectedMethod.flow === "card") {
      const delayed = selectedMethod.flow === "blik" && blikCode === "111111"
      const result = selectedMethod.flow === "blik" ? (blikCode === "000000" ? "failed" : "success") : (onlyDigits(cardDetails.number) === "4000000000000002" ? "failed" : "success")
      paymentTimer.current = setTimeout(() => {
        if (!delayed && activeTransactionRef.current === id) setPaymentStatus(result)
        setTransactions((current) => current.map((transaction) => transaction.id === id && transaction.status === "pending" ? delayed ? { ...transaction, delayed: true } : { ...transaction, status: result, chargeState: result === "failed" ? "not_charged" : "charged", cancelable: false } : transaction))
        paymentTimer.current = null
      }, delayed ? 5000 : 3000)
    }
    setBlikCode("")
    setCardDetails(emptyCard)
    setCardAttempted(false)
  }

  const cancelPayment = async (id: number): Promise<CancellationResult> => {
    const transaction = transactionsRef.current.find((item) => item.id === id)
    if (transaction?.status !== "pending" || transaction.cancellationState || !transaction.cancelable) return "rejected"
    const result = onCancelDeposit ? await onCancelDeposit(transaction) : transaction.method === "BLIK" ? "confirmed_no_charge" : "rejected"
    if (result === "rejected" || transactionsRef.current.find((item) => item.id === id)?.status !== "pending") return "rejected"
    if (result === "confirmed_no_charge" && activeTransactionRef.current === id) {
      if (paymentTimer.current) clearTimeout(paymentTimer.current)
      paymentTimer.current = null
      activeTransactionRef.current = null
      setPaymentStatus("canceled")
    }
    setTransactions((current) => current.map((item) => item.id === id && item.status === "pending" ? result === "confirmed_no_charge" ? { ...item, status: "canceled", chargeState: "not_charged", cancelable: false } : { ...item, cancellationState: "requested", cancelable: false } : item))
    return result
  }

  const checkCancellation = async (id: number): Promise<CancellationCheck> => {
    const transaction = transactionsRef.current.find((item) => item.id === id)
    if (!transaction) return "unavailable"
    const refreshed = onCheckCancelDeposit ? await onCheckCancelDeposit(transaction) : transaction
    if (refreshed.id !== id) throw new Error("Cancellation status did not match the deposit")
    transactionsRef.current = transactionsRef.current.map((item) => item.id === id ? refreshed : item)
    setTransactions(transactionsRef.current)
    if (activeTransactionRef.current === id && refreshed.status !== "pending") setPaymentStatus(refreshed.status)
    if (refreshed.status !== "pending") return "updated"
    return !refreshed.cancellationState && refreshed.cancelable === true && refreshed.chargeState === "not_charged" ? "available" : "unavailable"
  }

  const expirePayment = (id: number) => {
    const transaction = transactionsRef.current.find((item) => item.id === id)
    if (!transaction || transaction.status !== "pending" || transaction.cancellationState) return
    if (activeTransactionRef.current === id) {
      if (paymentTimer.current) clearTimeout(paymentTimer.current)
      paymentTimer.current = null
      setPaymentStatus("expired")
    }
    setTransactions((current) => current.map((item) => item.id === id && item.status === "pending" ? { ...item, status: "expired", chargeState: "not_charged", cancelable: false } : item))
  }

  const returnToGame = () => { onReturnToGame?.(); setIsOpen(false) }
  const activeTransactionRecord = transactions.find((transaction) => transaction.id === activeTransaction)
  const activeExpiry = activeTransactionRecord?.expiresAt
  const activePendingBlik = activeTransactionRecord?.method === "BLIK" && activeTransactionRecord.status === "pending" && !activeTransactionRecord.cancellationState
  useEffect(() => {
    if (!activePendingBlik || activeTransaction === null || !activeExpiry) return
    const expiresAt = Date.parse(activeExpiry)
    if (!Number.isFinite(expiresAt)) return
    const timer = window.setTimeout(() => {
      if (activeTransactionRef.current !== activeTransaction) return
      if (paymentTimer.current) clearTimeout(paymentTimer.current)
      paymentTimer.current = null
      setTransactions((current) => current.map((item) => item.id === activeTransaction && item.status === "pending" && !item.cancellationState ? { ...item, status: "expired", chargeState: "not_charged", cancelable: false } : item))
      setPaymentStatus((current) => current === "pending" ? "expired" : current)
    }, Math.max(0, expiresAt - Date.now()))
    return () => window.clearTimeout(timer)
  }, [activeExpiry, activePendingBlik, activeTransaction])
  const isDelayedPending = paymentStatus === "pending" && Boolean(activeTransactionRecord?.delayed)
  const isCancellationRequested = paymentStatus === "pending" && activeTransactionRecord?.cancellationState === "requested"
  const isBlikOutcome = selectedMethod?.flow === "blik" && (paymentStatus === "failed" || paymentStatus === "canceled")
  const isUncertainPayment = (paymentStatus === "failed" || paymentStatus === "canceled") && activeTransactionRecord?.chargeState !== "not_charged"
  const canRetryBlik = isBlikOutcome && activeTransactionRecord?.chargeState === "not_charged"
  const copy = blikCopy
  const retryBlik = () => {
    setPaymentStatus("idle")
    setBlikCode("")
    setActiveTransaction(null)
    activeTransactionRef.current = null
  }
  const retryBlikFromHistory = (transaction: Transaction) => {
    resetSelection()
    setCategory("fiat")
    setAmount(String(transaction.amount))
    setSelected("blik")
    closeHistoryEntry()
    setView("deposit")
  }

  const primaryLabel = (() => {
    if (category === "crypto") return "Continue"
    if (isUncertainPayment) return "View transaction"
    if (isCancellationRequested) return "View transaction"
    if (paymentStatus === "pending") return (isDelayedPending || isCancellationRequested) && onContactSupport ? copy.contactSupport : "Awaiting confirmation"
    if (paymentStatus === "payment_received") return copy.backToGame
    if (paymentStatus === "success") return copy.backToGame
    if (canRetryBlik) return copy.retry
    if (paymentStatus === "canceled") return copy.chooseMethod
    if (paymentStatus === "failed") return selectedMethod?.flow === "blik" ? copy.retry : selectedMethod?.name ? `Try ${selectedMethod.name} again` : "Try again"
    if (!selectedMethod) return "Choose a payment method"
    if (selectedMethod.flow === "wallet") return `Continue to ${selectedMethod.name}`
    if (selectedMethod.flow === "bank" || selectedMethod.flow === "blik") {
      return "Continue"
    }
    return "Deposit"
  })()

  const primaryDisabled =
    category === "crypto"
      ? !selected
      : (paymentStatus === "pending" && !isDelayedPending && !isCancellationRequested) || (paymentStatus === "idle" && (!selectedMethod || !amountValid || (selectedMethod.flow === "blik" && blikCode.length !== 6) || (selectedMethod.id === "bank-transfer" && !bank)))


  if (!isOpen) {
    return (
      <main lang="en" className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted/40 px-4 text-foreground">
        <h1 className="text-lg font-semibold">Game</h1>
        <Button type="button" onClick={() => setIsOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">Open payment methods</Button>
      </main>
    )
  }

  return (
    <main lang="en" className="flex min-h-svh items-center justify-center bg-muted/40 px-3 py-3 text-foreground sm:px-6">
      <Card className="flex min-h-[min(460px,calc(100svh-24px))] max-h-[calc(100svh-24px)] w-full max-w-[660px] flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 text-card-foreground shadow-xl">
        <header className={`relative flex h-[54px] shrink-0 items-center border-b border-border ${view === "transactions" ? "justify-center px-12" : "justify-start px-4 sm:justify-center sm:px-12"}`}>
          <h1 className="text-lg font-semibold tracking-tight">{view === "transactions" ? selectedHistoryEntry ? "Deposit details" : "Deposit history" : "Payment methods"}</h1>
          {view === "transactions" ? (
            <Button type="button" variant="ghost" size="icon" aria-label={selectedHistoryEntry ? "Back to deposit history" : activeTransaction !== null ? "Back to payment status" : "Back to payment methods"} onClick={() => selectedHistoryEntry ? closeHistoryEntry() : setView("deposit")} className="absolute left-1 top-1/2 size-11 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground sm:left-2 sm:size-9"><ArrowLeft className="size-5" aria-hidden="true" /></Button>
          ) : (
            <Button type="button" variant="ghost" aria-label="Transaction history" onClick={() => { setDetailTransaction(null); setView("transactions") }} className="absolute right-12 top-1/2 size-11 -translate-y-1/2 rounded-full p-0 text-muted-foreground hover:bg-accent hover:text-foreground sm:right-12 sm:h-9 sm:w-auto sm:gap-2 sm:rounded-md sm:px-3"><History className="size-5" aria-hidden="true" /><span className="hidden sm:inline">History</span></Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close payment methods"
            onClick={returnToGame}
            className="absolute right-1 top-1/2 size-11 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground sm:right-2 sm:size-9"
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </header>

        {view === "deposit" && <nav aria-label="Cashier sections" className="flex items-center justify-between gap-3 border-b border-border px-4 sm:gap-4 sm:px-6">
          <Button type="button" variant="ghost" aria-current="page" className="h-auto shrink-0 rounded-none border-0 border-b-2 border-b-foreground px-0 py-3 text-foreground">Deposit</Button>
          <div className="flex min-w-0 items-center gap-2 text-xs sm:gap-3 sm:text-sm">
            <div className="flex min-w-0 items-baseline gap-1.5 sm:gap-2">
              <span className="text-muted-foreground">Balance</span>
              <span className="font-semibold tabular-nums">{category === "crypto" && initialCryptoTransfer && initialCryptoBalance && selectedMethod?.name === initialCryptoTransfer.asset ? `${initialCryptoBalance} ${initialCryptoTransfer.asset}` : formatCurrency(balance, balanceCurrency)}</span>
            </div>
          </div>
        </nav>}
        <div ref={historyPanelRef} className={`min-h-0 flex-1 overflow-y-auto ${view === "deposit" && selectedMethod && category === "crypto" ? "px-4 py-2 sm:px-6 sm:py-3" : "px-4 py-4 sm:px-6 sm:py-5"}`}>
          {view === "transactions" ? (
            selectedHistoryEntry ? <HistoryReceipt entry={selectedHistoryEntry} onReturnToGame={returnToGame} onChooseAnother={() => { resetSelection(); setCategory("fiat"); closeHistoryEntry(); setView("deposit") }} onRetryBlik={retryBlikFromHistory} onContactSupport={onContactSupport} onCancel={selectedHistoryEntry.kind === "fiat" && onCancelDeposit ? () => cancelPayment(selectedHistoryEntry.transaction.id) : undefined} onCheckCancel={selectedHistoryEntry.kind === "fiat" && onCheckCancelDeposit ? () => checkCancellation(selectedHistoryEntry.transaction.id) : undefined} /> :
            <section aria-label="Deposit history">
              {historyEntries.length === 0 ? <div className="flex flex-col items-center rounded-lg bg-muted/60 px-5 py-9 text-center"><span className="mb-4 flex size-11 items-center justify-center rounded-full bg-background text-muted-foreground"><History className="size-5" aria-hidden="true" /></span><h2 className="text-sm font-semibold">No deposits yet</h2><p className="mt-1 max-w-64 text-sm leading-5 text-muted-foreground">Your deposits and their status will appear here.</p><Button type="button" variant="outline" className="mt-5 min-h-11 sm:min-h-9" onClick={() => setView("deposit")}>Choose a payment method</Button></div> : <div className="grid gap-5">{activeHistoryEntries.length > 0 && <div><h2 className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">In progress</h2><ul>{activeHistoryEntries.map((entry) => <HistoryRow key={entry.key} entry={entry} onOpen={() => openHistoryEntry(entry)} />)}</ul></div>}{pastHistoryEntries.length > 0 && <div><h2 className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Earlier</h2><ul>{pastHistoryEntries.map((entry) => <HistoryRow key={entry.key} entry={entry} onOpen={() => openHistoryEntry(entry)} />)}</ul></div>}</div>}
            </section>
          ) : selectedMethod ? (
            <div className={category === "crypto" ? "grid gap-3" : "grid gap-4"}>
              {paymentStatus === "idle" && category !== "crypto" && (
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <Button type="button" variant="ghost" size="icon" aria-label="Back to payment methods" onClick={resetSelection}><ArrowLeft aria-hidden="true" /></Button>
                  <MethodMark method={selectedMethod} />
                  <h2 className="text-base font-medium">{selectedMethod.name}</h2>
                </div>
              )}
              {paymentStatus !== "idle" ? (
                <PaymentStatusPanel status={paymentStatus} method={selectedMethod} amount={parsedAmount} currency={currency} onChooseAnother={resetSelection} transaction={transactions.find((transaction) => transaction.id === activeTransaction)} delayed={transactions.find((transaction) => transaction.id === activeTransaction)?.delayed} onViewTransactions={() => { setDetailTransaction(activeTransaction); setView("transactions") }} onContactSupport={onContactSupport && activeTransaction !== null ? () => { const transaction = transactions.find((item) => item.id === activeTransaction); if (transaction) onContactSupport({ kind: "fiat", transaction }) } : undefined} onCancel={activeTransaction !== null && (onCancelDeposit || selectedMethod?.flow === "blik") ? () => cancelPayment(activeTransaction) : undefined} onCheckCancel={activeTransaction !== null && (onCheckCancelDeposit || selectedMethod?.flow === "blik") ? () => checkCancellation(activeTransaction) : undefined} onExpire={activeTransaction !== null ? () => expirePayment(activeTransaction) : undefined} />
              ) : category === "crypto" ? (
                <div className="grid gap-2">
                  <div className="grid gap-1">
                    <div className="flex h-9 items-center gap-1"><Button type="button" variant="ghost" size="icon" className="-ml-2 size-9" aria-label="Back to payment methods" onClick={resetSelection}><ArrowLeft aria-hidden="true" /></Button><h2 className="text-sm font-medium">{selectedMethod.name}</h2></div>
                    <div className="flex items-center justify-between gap-3">
                    {selectedMethod.id === "usdt" && !initialCryptoTransfer ? <Label htmlFor="crypto-network" className="shrink-0 text-sm text-muted-foreground">Network</Label> : <span className="shrink-0 text-sm text-muted-foreground">Network</span>}
                    {selectedMethod.id === "usdt" && !initialCryptoTransfer ? (
                      <NativeSelect id="crypto-network" value={network} onChange={(event) => setNetwork(event.target.value)} aria-describedby="network-hint" className="w-48 max-w-[72%] [&_select]:h-11 [&_select]:text-sm"><NativeSelectOption>Tron (TRC20)</NativeSelectOption><NativeSelectOption>Ethereum (ERC20)</NativeSelectOption></NativeSelect>
                    ) : (
                      <div className="flex h-11 w-48 max-w-[72%] items-center rounded-md border border-input px-3 text-sm">{initialCryptoTransfer && selectedMethod.name === initialCryptoTransfer.asset ? initialCryptoTransfer.network : selectedMethod.id === "btc" ? "Bitcoin" : selectedMethod.id === "sol" ? "Solana" : "Ethereum"}</div>
                    )}
                    <span id="network-hint" className="sr-only">Select the same network in your wallet or exchange.</span>
                    </div>
                  </div>
                  {initialCryptoTransfer && selectedMethod.name === initialCryptoTransfer.asset ? <div className="border-t border-border pt-4"><CryptoProgressPanel transfer={initialCryptoTransfer} onReturnToGame={returnToGame} onViewTransaction={() => { setCryptoExpanded(true); setView("transactions") }} onContactSupport={onContactSupport && initialCryptoTransfer.status !== "credited" ? () => onContactSupport({ kind: "crypto", asset: initialCryptoTransfer.asset, network: initialCryptoTransfer.network, transfer: initialCryptoTransfer }) : undefined} /></div> : <CryptoDeposit key={`${selectedMethod.id}-${selectedCryptoNetwork}`} asset={selectedMethod.name} network={selectedCryptoNetwork} preview={cryptoPreview} onContactSupport={onContactSupport && !cryptoPreview ? () => onContactSupport({ kind: "crypto", asset: selectedMethod.name, network: selectedCryptoNetwork }) : undefined} />}
                </div>
              ) : (
                <MethodDetails method={selectedMethod} amount={amount} currency={currency} amountError={amountError} cardDetails={cardDetails} cardAttempted={cardAttempted} blikCode={blikCode} setBlikCode={setBlikCode} bank={bank} setBank={setBank} onAmountChange={setAmount} onCardChange={(field, value) => setCardDetails((current) => ({ ...current, [field]: value }))} />
              )}
            </div>
          ) : (
            <Tabs value={category} onValueChange={(value) => { setCategory(value as Category); resetSelection() }} className="gap-4">
              <TabsList aria-label="Deposit type" className="h-11 w-full rounded-full bg-muted p-[2px] sm:h-9">
                <TabsTrigger value="crypto" className="h-full rounded-full border-0 text-sm font-medium text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm dark:data-active:border-0 dark:data-active:bg-background">Crypto</TabsTrigger>
                <TabsTrigger value="fiat" className="h-full rounded-full border-0 text-sm font-medium text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm dark:data-active:border-0 dark:data-active:bg-background">Fiat</TabsTrigger>
              </TabsList>
              <TabsContent value="crypto" className="mt-0">
                <h2 className="mb-3 text-sm font-medium text-foreground">Choose a cryptocurrency</h2>
                <MethodList methods={methods.crypto} label="Cryptocurrency" onSelect={selectMethod} />
                <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                  <div className="grid gap-1"><p className="text-sm font-medium">Don’t have crypto?</p><p className="text-xs leading-5 text-muted-foreground">Choose a currency to explore how to buy it.</p></div>
                  <AvatarGroup className="shrink-0 -space-x-1.5 *:data-[slot=avatar]:ring-card *:data-[slot=avatar]:after:border-0" aria-label="Crypto and wallet examples">
                    <Avatar size="sm" className="items-center justify-center bg-[#f7931a]"><AvatarImage src={bitcoinIcon} alt="Bitcoin" className="size-4 brightness-0 invert" /><AvatarFallback>₿</AvatarFallback></Avatar>
                    <Avatar size="sm" className="items-center justify-center bg-[#627eea]"><AvatarImage src={ethereumIcon} alt="Ethereum" className="size-4 brightness-0 invert" /><AvatarFallback>ETH</AvatarFallback></Avatar>
                    <Avatar size="sm" className="items-center justify-center bg-[#26a17b]"><AvatarImage src={tetherIcon} alt="Tether" className="size-4 brightness-0 invert" /><AvatarFallback>₮</AvatarFallback></Avatar>
                    <Avatar size="sm" className="items-center justify-center bg-white"><AvatarImage src={metamaskIcon} alt="MetaMask" className="size-5" /><AvatarFallback>MM</AvatarFallback></Avatar>
                  </AvatarGroup>
                </div>
              </TabsContent>
              <TabsContent value="fiat" className="mt-0">
                <div className="grid gap-5">
                  {fiatGroups.map((group) => (
                    <section key={group.id} aria-labelledby={`fiat-group-${group.id}`}>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <h2 id={`fiat-group-${group.id}`} className="text-sm font-medium text-foreground">{group.title}</h2>
                          {group.id === "popular" && <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-medium text-muted-foreground">Recommended for {regionNames[region]}</span>}
                        </div>
                      </div>
                      <MethodList methods={group.methods} label={`${group.title} · ${regionNames[region]}`} onSelect={selectMethod} />
                    </section>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {view === "deposit" && category === "fiat" && paymentStatus !== "expired" && (paymentStatus !== "pending" || isCancellationRequested || isDelayedPending && Boolean(onContactSupport)) && (selected !== null || paymentStatus !== "idle") && (
          <>
            <footer className="shrink-0 border-t border-border bg-card px-4 py-4 sm:px-6">
              <Button
                type="button"
                disabled={primaryDisabled}
                onClick={() => {
                  if (paymentStatus === "success" || paymentStatus === "payment_received") {
                    returnToGame()
                  } else if (isCancellationRequested || isUncertainPayment) {
                    setDetailTransaction(activeTransaction)
                    setView("transactions")
                  } else if (isDelayedPending) {
                    if (onContactSupport && activeTransactionRecord) onContactSupport({ kind: "fiat", transaction: activeTransactionRecord })
                  } else if (canRetryBlik) {
                    retryBlik()
                  } else if (paymentStatus === "canceled") {
                    resetSelection()
                  } else if (paymentStatus === "failed") {
                    setPaymentStatus("idle")
                    setCardAttempted(false)
                    if (selectedMethod?.flow === "blik") setBlikCode("")
                  } else {
                    startPayment()
                  }
                }}
                className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:h-10"
              >
                {primaryLabel}
                {paymentStatus === "success" || paymentStatus === "payment_received" || paymentStatus === "failed" || paymentStatus === "canceled" ? (
                  <ChevronRight className="size-4" aria-hidden="true" />
                ) : paymentStatus === "idle" && selectedMethod?.flow === "wallet" ? (
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                ) : null}
              </Button>
            </footer>
          </>
        )}
      </Card>
    </main>
  )
}
