import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ComponentProps } from 'react'
import App, { type SupportContext } from '@/App'

function SupportDestinationStory(props: ComponentProps<typeof App>) {
  const [context, setContext] = useState<SupportContext | null>(null)
  return <>
    <div className={context ? 'hidden' : undefined}><App {...props} onContactSupport={setContext} /></div>
    {context && <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4 text-foreground"><div className="grid w-full max-w-sm gap-3 rounded-xl border border-border bg-card p-5"><h1 className="text-base font-semibold">Support destination</h1><p className="text-sm text-muted-foreground">{context.kind === 'fiat' ? `${context.transaction.method} · ${context.transaction.reference}` : `${context.asset} · ${context.network}`}</p><button type="button" className="min-h-11 rounded-md border border-border px-4 text-sm" onClick={() => setContext(null)}>Back to cashier</button></div></main>}
  </>
}

const meta = { title: 'Cashier/Screens', component: App, render: (args) => <App key={`${args?.initialCategory}-${args?.initialMethod}-${args?.initialStatus}-${args?.initialDelayed}-${args?.initialView}-${args?.cryptoPreview}-${args?.initialCryptoTransfer?.status}`} {...args} />, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof App>
export default meta
type Story = StoryObj<typeof meta>
export const Cashier: Story = {}
export const BlikDeposit: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik' } }
export const CardDeposit: Story = { args: { initialCategory: 'fiat', initialMethod: 'card' } }
export const CardAwaitingConfirmation: Story = { args: { initialCategory: 'fiat', initialMethod: 'card', initialStatus: 'pending' } }
export const CardSuccessful: Story = { args: { initialCategory: 'fiat', initialMethod: 'card', initialStatus: 'success', initialChargeState: 'charged' } }
export const CardFailed: Story = { args: { initialCategory: 'fiat', initialMethod: 'card', initialStatus: 'failed', initialChargeState: 'not_charged' } }
export const CardCanceled: Story = { args: { initialCategory: 'fiat', initialMethod: 'card', initialStatus: 'canceled', initialChargeState: 'not_charged' } }
export const CardCanceledHistory: Story = { args: { initialView: 'transactions', initialTransactions: [{ id: 1, reference: 'TXN-4F82B1C9', createdAt: '2026-11-07T18:00:00Z', method: 'Card', amount: 50, fee: 1.5, currency: 'PLN', status: 'canceled', chargeState: 'not_charged' }] } }
export const CryptoDeposit: Story = { args: { initialCategory: 'crypto', initialMethod: 'usdt', cryptoPreview: true } }
export const CryptoDetailsUnavailable: Story = { args: { initialCategory: 'crypto', initialMethod: 'usdt', cryptoPreview: false }, render: (args) => <SupportDestinationStory {...args} />, parameters: { docs: { description: { story: 'The support button opens a Storybook destination with the selected asset and network. Production needs a real support route.' } } } }
const cryptoTransfer = { asset: 'USDT', network: 'Tron (TRC20)', amount: '50.00', requiredConfirmations: 20, createdAt: '2026-11-08T10:00:00Z' } as const
export const CryptoDetected: Story = { args: { initialCategory: 'crypto', initialMethod: 'usdt', initialCryptoBalance: '0.00', initialCryptoTransfer: { ...cryptoTransfer, status: 'detected', confirmations: 0 } }, parameters: { docs: { description: { story: 'Illustrative status fixture. No transfer is monitored by Storybook.' } } } }
export const CryptoConfirming: Story = { args: { initialCategory: 'crypto', initialMethod: 'usdt', initialCryptoBalance: '0.00', initialCryptoTransfer: { ...cryptoTransfer, status: 'confirming', confirmations: 8 } }, parameters: { docs: { description: { story: 'Illustrative status fixture. No transfer is monitored by Storybook.' } } } }
export const CryptoCredited: Story = { args: { initialCategory: 'crypto', initialMethod: 'usdt', initialCryptoBalance: '50.00', initialCryptoTransfer: { ...cryptoTransfer, status: 'credited', confirmations: 20 } }, parameters: { docs: { description: { story: 'Illustrative status fixture. No transfer is monitored by Storybook.' } } } }
export const BlikAwaitingConfirmation: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'pending', initialChargeState: 'not_charged' }, render: (args) => <App {...args} onCheckCancelDeposit={async (transaction) => transaction} onCancelDeposit={async () => 'confirmed_no_charge'} />, parameters: { docs: { description: { story: 'Cancellation and the not-charged state are simulated for this portfolio story. A real integration must obtain them from the payment provider.' } } } }
export const BlikCancellation: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'pending', initialChargeState: 'not_charged' }, render: (args) => <App {...args} onCheckCancelDeposit={async (transaction) => transaction} onCancelDeposit={async () => { await new Promise(resolve => setTimeout(resolve, 500)); return 'confirmed_no_charge' }} />, parameters: { docs: { description: { story: 'A simulated status check allows cancellation; the fixture explicitly confirms cancellation with no charge. No real payment is canceled.' } } } }
export const BlikCancellationRequested: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'pending', initialChargeState: 'not_charged' }, render: (args) => <App {...args} onCheckCancelDeposit={async (transaction) => transaction} onCancelDeposit={async () => { await new Promise(resolve => setTimeout(resolve, 500)); return 'requested' }} />, parameters: { docs: { description: { story: 'The cancellation request is accepted, but the payment outcome remains unresolved. Retry is withheld.' } } } }
export const BlikCancellationRejected: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'pending', initialChargeState: 'not_charged' }, render: (args) => <App {...args} onCheckCancelDeposit={async (transaction) => transaction} onCancelDeposit={async () => { await new Promise(resolve => setTimeout(resolve, 500)); return 'rejected' }} />, parameters: { docs: { description: { story: 'A simulated provider rejects the cancellation; the payment remains pending.' } } } }
export const BlikCancellationUnavailable: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'pending', initialChargeState: 'not_charged' }, render: (args) => <App {...args} onCheckCancelDeposit={async (transaction) => ({ ...transaction, cancelable: false })} onCancelDeposit={async () => 'rejected'} />, parameters: { docs: { description: { story: 'The status refresh reports that cancellation is no longer available; the confirmation action is withheld.' } } } }
export const BlikCancellationCheckFailed: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'pending', initialChargeState: 'not_charged' }, render: (args) => <App {...args} onCheckCancelDeposit={async () => { throw new Error('Status check unavailable') }} onCancelDeposit={async () => 'rejected'} />, parameters: { docs: { description: { story: 'A failed status check shows a retry action and never offers cancellation.' } } } }
export const BlikConfirmedDuringCancellationCheck: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'pending', initialChargeState: 'not_charged' }, render: (args) => <App {...args} onCheckCancelDeposit={async (transaction) => ({ ...transaction, status: 'payment_received', chargeState: 'charged', cancelable: false })} onCancelDeposit={async () => 'rejected'} />, parameters: { docs: { description: { story: 'The simulated refresh returns a confirmed payment with wallet credit pending, so cancellation is withheld.' } } } }
export const BlikCanceled: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'canceled', initialChargeState: 'not_charged' } }
export const BlikDelayed: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'pending', initialDelayed: true } }
export const BlikDelayedWithSupport: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'pending', initialDelayed: true }, render: (args) => <SupportDestinationStory {...args} />, parameters: { docs: { description: { story: 'Contact support opens a Storybook destination with this transaction reference. Production needs a real support route.' } } } }
export const BlikSuccessful: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'success', initialChargeState: 'charged' } }
export const BlikPaymentReceived: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'payment_received', initialChargeState: 'charged' }, parameters: { docs: { description: { story: 'The payment is confirmed, but wallet credit is still pending. The balance stays at zero.' } } } }
export const BlikFailed: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'failed', initialChargeState: 'not_charged' } }
export const BlikStatusUnclear: Story = { args: { initialCategory: 'fiat', initialMethod: 'blik', initialStatus: 'failed', initialChargeState: 'unknown' }, render: (args) => <SupportDestinationStory {...args} />, parameters: { docs: { description: { story: 'The charge state is unknown, so retry and choosing another method are withheld.' } } } }
export const UnresolvedDepositHistory: Story = { args: { initialView: 'transactions', initialTransactions: [
  { id: 1, reference: 'TXN-UNKNOWN', createdAt: '2026-11-08T10:00:00Z', method: 'BLIK', amount: 50, fee: 1.5, currency: 'PLN', status: 'failed', chargeState: 'unknown' },
  { id: 2, reference: 'TXN-CANCELED', createdAt: '2026-11-08T09:00:00Z', method: 'Card', amount: 100, fee: 3, currency: 'PLN', status: 'canceled', chargeState: 'unknown' },
  { id: 3, reference: 'TXN-FINAL', createdAt: '2026-11-08T08:00:00Z', method: 'BLIK', amount: 75, fee: 2.25, currency: 'PLN', status: 'failed', chargeState: 'not_charged' },
] }, render: (args) => <SupportDestinationStory {...args} />, parameters: { docs: { description: { story: 'Unresolved outcomes remain in progress; a confirmed no-charge failure appears under earlier deposits.' } } } }
export const EmptyTransactionHistory: Story = { args: { initialView: 'transactions', initialTransactions: [] } }
export const MixedDepositHistory: Story = { args: { initialView: 'transactions', initialCryptoTransfer: { ...cryptoTransfer, status: 'confirming', confirmations: 8 }, initialTransactions: [
  { id: 1, reference: 'TXN-4F82B1C9', createdAt: '2026-11-07T18:00:00Z', method: 'BLIK', amount: 50, fee: 1.5, currency: 'PLN', status: 'pending', cancelable: true },
  { id: 2, reference: 'TXN-38A91F02', createdAt: '2026-11-06T14:30:00Z', method: 'Card', amount: 250, fee: 7.5, currency: 'PLN', status: 'success' },
  { id: 3, reference: 'TXN-7B42D301', createdAt: '2026-11-05T09:15:00Z', method: 'BLIK', amount: 100, fee: 3, currency: 'PLN', status: 'failed', chargeState: 'not_charged' },
] }, parameters: { docs: { description: { story: 'Illustrative crypto and fiat transactions for comparing the shared progress pattern.' } } } }
export const TransactionHistory: Story = { args: { initialView: 'transactions', initialTransactions: [
  { id: 1, reference: 'TXN-4F82B1C9', createdAt: '2026-11-07T18:00:00Z', method: 'BLIK', amount: 50, fee: 1.5, currency: 'PLN', status: 'pending', delayed: true, cancelable: true },
  { id: 2, reference: 'TXN-38A91F02', createdAt: '2026-11-06T14:30:00Z', method: 'Card', amount: 250, fee: 7.5, currency: 'PLN', status: 'success' },
  { id: 3, reference: 'TXN-7B42D301', createdAt: '2026-11-05T09:15:00Z', method: 'BLIK', amount: 100, fee: 3, currency: 'PLN', status: 'failed', chargeState: 'not_charged' },
  { id: 4, reference: 'TXN-9A10C678-ABCD-1234-9876-LONGREFERENCE', createdAt: '2026-10-29T12:00:00Z', method: 'Card', amount: 4999.99, fee: 150, currency: 'PLN', status: 'success' },
  { id: 5, reference: 'TXN-4D37E2AB', createdAt: '2026-10-15T10:00:00Z', method: 'Card', amount: 20, fee: 0.6, currency: 'PLN', status: 'success' },
] } }
