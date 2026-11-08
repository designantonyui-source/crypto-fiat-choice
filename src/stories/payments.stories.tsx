import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { CardFields, CryptoDeposit, MethodDetails, MethodList, PaymentStatusPanel, methods as cashierMethods } from '@/App'

const meta: Meta = { title: 'Cashier/Payment components' }
export default meta
type Story = StoryObj
const methods = ['blik', 'bank-transfer', 'card'].map(id => cashierMethods.fiat.find(method => method.id === id)!)
function ChoicesExample() { const [selected, setSelected] = useState(''); return <div className="grid max-w-xl gap-3"><MethodList methods={methods} label="Payment methods" onSelect={setSelected} />{selected && <p className="text-sm text-muted-foreground">Selected: {selected}</p>}</div> }
export const MethodChoices: Story = { render: () => <ChoicesExample /> }
function CardExample({ attempted = false }: { attempted?: boolean }) {
  const [details, setDetails] = useState({ number: '', expiry: '', cvc: '', holder: '' })
  return <div className="max-w-xl"><CardFields details={details} attempted={attempted} onChange={(field, value) => setDetails(current => ({ ...current, [field]: value }))} /></div>
}
export const CardDetails: Story = { render: () => <CardExample /> }
export const CardErrors: Story = { render: () => <CardExample attempted /> }
export const CryptoAddress: Story = { render: () => <div className="max-w-xl"><CryptoDeposit asset="USDT" network="Tron (TRC20)" /></div> }
function BlikExample() {
  const [amount, setAmount] = useState('50')
  const [code, setCode] = useState('')
  const [bank, setBank] = useState('')
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', holder: '' })
  return <div className="max-w-xl"><MethodDetails method={{ ...methods[0], flow: 'blik' }} amount={amount} currency="PLN" amountError={null} cardDetails={card} cardAttempted={false} blikCode={code} setBlikCode={setCode} bank={bank} setBank={setBank} onAmountChange={setAmount} onCardChange={(field, value) => setCard(current => ({ ...current, [field]: value }))} /></div>
}
export const BlikAndFeeBreakdown: Story = { render: () => <BlikExample /> }
export const Pending: Story = { render: () => <div className="max-w-xl"><PaymentStatusPanel status="pending" method={methods[0]} amount={50} currency="PLN" onChooseAnother={() => {}} /></div> }
export const Success: Story = { render: () => <div className="max-w-xl"><PaymentStatusPanel status="success" method={methods[0]} amount={50} currency="PLN" transaction={{ id: 1, reference: 'TXN-4F82B1C9', createdAt: '2026-11-07T18:00:00Z', method: 'BLIK', amount: 50, fee: 1.5, currency: 'PLN', status: 'success' }} onChooseAnother={() => {}} onViewTransactions={() => {}} /></div> }
export const Failed: Story = { render: () => <div className="max-w-xl"><PaymentStatusPanel status="failed" method={methods[0]} amount={50} currency="PLN" onChooseAnother={() => {}} /></div> }
