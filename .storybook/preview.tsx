import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

const preview: Preview = {
  decorators: [(Story, context) => <div className={`${context.globals.theme === "dark" ? "dark" : ""} min-h-screen bg-background text-foreground ${context.title === 'Cashier/Screens' ? '' : 'p-6'}`}><Story /></div>],
  globalTypes: { theme: { description: "Theme", toolbar: { title: "Theme", items: ["light", "dark"], dynamicTitle: true } } },
  initialGlobals: { theme: "light" },
  parameters: { layout: 'fullscreen', a11y: { test: 'todo' } },
}
export default preview
