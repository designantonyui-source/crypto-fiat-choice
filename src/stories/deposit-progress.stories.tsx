import type { Meta, StoryObj } from '@storybook/react-vite'
import { DepositTimeline, DepositTimelineStep } from '@/components/deposit-timeline'

const meta: Meta = { title: 'Cashier/Deposit progress' }
export default meta
type Story = StoryObj

function Step({ title, detail, state }: { title: string; detail: string; state: 'complete' | 'canceled' | 'upcoming' }) {
  return <ol className="grid max-w-sm" aria-label="Deposit progress step"><DepositTimelineStep title={title} detail={detail} state={state} current={state === 'canceled'} /></ol>
}

export const Requested: Story = { render: () => <Step title="Requested" detail="Deposit request created." state="complete" /> }
export const PaymentCanceled: Story = { render: () => <Step title="Payment" detail="Request canceled before confirmation." state="canceled" /> }
export const CreditedNotReached: Story = { render: () => <Step title="Credited" detail="Not reached." state="upcoming" /> }
export const CanceledSequence: Story = { render: () => <div className="max-w-sm"><DepositTimeline kind="fiat" status="canceled" method="BLIK" /></div> }
export const AwaitingPayment: Story = { render: () => <div className="max-w-sm"><DepositTimeline kind="fiat" status="pending" method="BLIK" /></div> }
export const Credited: Story = { render: () => <div className="max-w-sm"><DepositTimeline kind="fiat" status="success" method="BLIK" /></div> }
export const PaymentFailed: Story = { render: () => <div className="max-w-sm"><DepositTimeline kind="fiat" status="failed" method="BLIK" /></div> }
export const CryptoConfirming: Story = { render: () => <div className="max-w-sm"><DepositTimeline kind="crypto" transfer={{ status: 'confirming', confirmations: 3, requiredConfirmations: 20 }} /></div> }
