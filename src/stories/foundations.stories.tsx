import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowLeft, ChevronDown, ChevronRight, Copy, Info, X } from 'lucide-react'

const meta: Meta = { title: 'Cashier/Foundations' }
export default meta
type Story = StoryObj
const tokens = [ ['Background', 'bg-background'], ['Card', 'bg-card'], ['Muted', 'bg-muted'], ['Border', 'bg-border'], ['Primary', 'bg-primary'], ['Success', 'bg-success'], ['Success surface', 'bg-success-surface'], ['Warning', 'bg-warning'], ['Warning surface', 'bg-warning-surface'], ['Destructive / error', 'bg-destructive'], ['Error surface', 'bg-error-surface'] ]
export const Colours: Story = { render: () => <div className="grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">{tokens.map(([name, colour]) => <div key={name} className="grid gap-2"><div className={`h-20 rounded-lg border border-border ${colour}`} /><span className="text-sm">{name}</span></div>)}</div> }
export const Typography: Story = { render: () => <div className="grid max-w-md gap-6">
  <div className="grid gap-1"><span className="text-xs text-muted-foreground">Page title · 18px / semibold</span><h1 className="text-lg font-semibold tracking-tight">Deposit</h1></div>
  <div className="grid gap-1"><span className="text-xs text-muted-foreground">Section title · 16px / semibold</span><h2 className="text-base font-semibold leading-snug">Payment is taking longer than expected</h2></div>
  <div className="grid gap-1"><span className="text-xs text-muted-foreground">Body and labels · 14px</span><p className="text-sm leading-5 text-muted-foreground sm:leading-relaxed">Check your banking app for the confirmation. You can also check the status in Transactions.</p></div>
  <div className="grid gap-1"><span className="text-xs text-muted-foreground">Supporting text · 12px</span><p className="text-xs text-muted-foreground">Find the code in your banking app.</p></div>
  <div className="grid gap-1"><span className="text-xs text-muted-foreground">Mobile form text · 16px</span><p className="text-base md:text-sm">123456</p></div>
</div> }
export const MobileLayout: Story = { render: () => <div className="grid max-w-md gap-4 text-sm"><h2 className="text-base font-semibold">Mobile foundations</h2><p className="text-muted-foreground">The cashier uses 12px outer spacing and 16px content padding on narrow screens. Primary actions and quick amounts have a 44px minimum touch target.</p><div className="flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 font-medium text-primary-foreground">Primary action · 44px</div><p className="text-muted-foreground">Open a cashier screen and select a mobile viewport to see these foundations in context.</p></div> }
export const Icons: Story = { render: () => <div className="flex flex-wrap gap-6">{[ArrowLeft, ChevronDown, ChevronRight, Copy, Info, X].map((Icon, index) => <Icon key={index} className="size-5" aria-hidden="true" />)}</div> }
