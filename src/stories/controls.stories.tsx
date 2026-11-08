import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { Info } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AmountPicker } from '@/App'

const meta: Meta = { title: 'Cashier/Controls', parameters: { layout: 'fullscreen' } }
export default meta
type Story = StoryObj

export const Buttons: Story = { render: () => <div className="flex flex-wrap gap-3"><Button>Continue</Button><Button variant="outline">Back</Button><Button disabled>Continue</Button></div> }
export const PaymentStatuses: Story = { render: () => <div className="flex flex-wrap gap-3"><StatusBadge status="pending" /><StatusBadge status="success" /><StatusBadge status="failed" /><StatusBadge status="canceled" /></div> }
export const NativeSelection: Story = { render: () => <div className="grid max-w-xs gap-2"><Label htmlFor="story-network">Network</Label><NativeSelect id="story-network" className="w-full [&_select]:h-10"><NativeSelectOption>Tron (TRC20)</NativeSelectOption><NativeSelectOption>Ethereum (ERC20)</NativeSelectOption></NativeSelect></div> }
export const SecurityHelp: Story = { render: () => <Popover><PopoverTrigger render={<Button type="button" variant="outline" />}>What is CVC?</PopoverTrigger><PopoverContent><PopoverTitle>What is CVC?</PopoverTitle><PopoverDescription>The 3-digit security code on the back of your card.</PopoverDescription></PopoverContent></Popover> }
export const DepositNotice: Story = { render: () => <Alert role="note" className="max-w-md"><Info aria-hidden="true" /><AlertTitle>Send only USDT on Tron (TRC20)</AlertTitle><AlertDescription>Use the same network in your wallet or exchange.</AlertDescription></Alert> }
export const TextField: Story = { render: () => <div className="grid max-w-md gap-2"><Label htmlFor="story-name">Name on card</Label><Input id="story-name" placeholder="As shown on your card" /></div> }
export const DepositTabs: Story = { render: () => <Tabs defaultValue="fiat" className="max-w-md"><TabsList className="w-full"><TabsTrigger value="crypto">Crypto</TabsTrigger><TabsTrigger value="fiat">Fiat</TabsTrigger></TabsList></Tabs> }
function AmountExample() { const [amount, setAmount] = useState('50'); return <div className="max-w-xl"><AmountPicker amount={amount} currency="PLN" error={amount && Number(amount) < 10 ? 'The minimum is 10 zł.' : null} onChange={setAmount} /></div> }
export const DepositAmount: Story = { render: () => <AmountExample /> }
