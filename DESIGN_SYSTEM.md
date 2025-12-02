# 🎨 Design System - Modern Minimal Casino

## Aesthetic Direction

**Philosophy:** Refined minimalism with purposeful contrast. Clean, sophisticated, and timeless. Think luxury watch brand meets modern fintech app, but for gambling.

**Key Principles:**
- Let content breathe with generous white space
- Use motion sparingly but meaningfully
- Trust typography hierarchy over decoration
- One bold accent (crimson red) for maximum impact

---

## Color Palette

### Primary Colors
```css
Background: #0A0A0A (casino-black)
Surface: #141414 (casino-black-lighter)
Elevated: #1A1A1A (casino-gray-darker)
```

**Usage:** 
- Main background: `bg-casino-black`
- Cards/containers: `bg-casino-black-lighter`
- Hover states: `bg-casino-gray-darker`

### Accent Colors
```css
Primary Action: #DC2626 (casino-accent-primary) - Crimson Red
Success: #16A34A (casino-accent-secondary) - Emerald Green
Special: #D4AF37 (casino-accent-gold) - Muted Gold
```

**Usage:**
- Crimson: Bet buttons, wins, CTAs
- Emerald: Success states, positive balance changes
- Gold: VIP badges, special rewards, jackpots

### Text Colors
```css
Primary: #FAFAFA (casino-white)
Secondary: #A3A3A3 (casino-gray-light)
Tertiary: #525252 (casino-gray)
```

---

## Typography

### Font Stack
```css
Display: 'DM Serif Display' (headings, game titles)
Body: 'Inter' (UI text, descriptions)
Mono: 'JetBrains Mono' (chip amounts, numbers)
```

### Type Scale
```css
Hero: text-6xl font-display (game titles)
H1: text-4xl font-display
H2: text-2xl font-display
H3: text-xl font-sans font-semibold
Body: text-base font-sans
Small: text-sm font-sans
Tiny: text-xs font-sans
Numbers: font-mono (all chip amounts)
```

**Example Usage:**
```jsx
<h1 className="text-4xl font-display text-casino-white">Blackjack</h1>
<p className="text-base text-casino-gray-light">Place your bets</p>
<span className="font-mono text-2xl text-casino-accent-gold">$10,000</span>
```

---

## Spacing System

Use Tailwind's default spacing, but favor larger gaps:

```css
Tight: space-y-2 (related items)
Normal: space-y-4 (sections within cards)
Loose: space-y-8 (between major sections)
Extra: space-y-16 (page sections)
```

**Component Padding:**
- Cards: `p-6` or `p-8`
- Buttons: `px-6 py-3`
- Page margins: `px-4 md:px-8 lg:px-16`

---

## Components

### Buttons

**Primary (Bet/Action):**
```jsx
<button className="
  px-6 py-3 
  bg-casino-accent-primary 
  text-casino-white font-semibold
  rounded-lg
  hover:bg-red-700
  active:scale-95
  transition-all duration-150
  shadow-lg shadow-casino-accent-primary/20
">
  Place Bet
</button>
```

**Secondary (Cash Out):**
```jsx
<button className="
  px-6 py-3
  bg-casino-gray-darker
  text-casino-white font-semibold
  rounded-lg
  hover:bg-casino-gray-dark
  border border-casino-gray
  transition-all duration-150
">
  Cash Out
</button>
```

**Success (Claim Win):**
```jsx
<button className="
  px-6 py-3
  bg-casino-accent-secondary
  text-casino-white font-semibold
  rounded-lg
  hover:bg-green-700
  transition-all duration-150
  shadow-lg shadow-casino-accent-secondary/20
">
  Claim Win
</button>
```

### Cards

**Game Card:**
```jsx
<div className="
  bg-casino-black-lighter
  border border-casino-gray-darker
  rounded-xl p-6
  hover:border-casino-gray-dark
  transition-all duration-300
  hover:-translate-y-1
">
  {/* Card content */}
</div>
```

**Stats Card:**
```jsx
<div className="
  bg-casino-gray-darker
  rounded-lg p-4
  border-l-4 border-casino-accent-primary
">
  <p className="text-sm text-casino-gray-light">Balance</p>
  <p className="text-2xl font-mono text-casino-white">10,000</p>
</div>
```

### Inputs

```jsx
<input className="
  w-full px-4 py-3
  bg-casino-gray-darker
  border border-casino-gray
  rounded-lg
  text-casino-white
  placeholder:text-casino-gray-light
  focus:outline-none
  focus:border-casino-accent-primary
  transition-colors duration-200
" />
```

---

## Animation Guidelines

### Entrance Animations
```jsx
// Fade in
<div className="animate-fade-in">

// Slide up
<div className="animate-slide-up">

// Scale in (modals, cards)
<div className="animate-scale-in">
```

### Interaction Animations
```jsx
// Hover lift
<div className="transition-transform hover:-translate-y-1">

// Press down
<button className="active:scale-95 transition-transform">

// Smooth color change
<div className="transition-colors duration-200">
```

### Win/Loss Feedback
```jsx
// Win: scale + glow
<div className="
  animate-scale-in
  shadow-lg shadow-casino-accent-primary/50
  ring-2 ring-casino-accent-primary
">

// Loss: subtle shake (use Framer Motion)
<motion.div animate={{ x: [0, -10, 10, -10, 10, 0] }}>
```

---

## Layout Patterns

### Page Layout
```jsx
<main className="
  min-h-screen 
  bg-casino-black
  px-4 md:px-8 lg:px-16
  py-8
">
  <div className="max-w-7xl mx-auto space-y-8">
    {/* Content */}
  </div>
</main>
```

### Game Layout
```jsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* Left sidebar: Game info */}
  <aside className="lg:col-span-1">
    {/* Stats, history */}
  </aside>
  
  {/* Center: Game area */}
  <main className="lg:col-span-2">
    {/* Game component */}
  </main>
</div>
```

### Grid of Games
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Game cards */}
</div>
```

---

## Special Elements

### Chip Balance Display
```jsx
<div className="
  bg-gradient-to-br from-casino-gray-darker to-casino-black-lighter
  rounded-xl p-6
  border border-casino-gray
">
  <p className="text-sm text-casino-gray-light uppercase tracking-wide">
    Your Balance
  </p>
  <p className="text-4xl font-mono text-casino-accent-gold mt-2">
    25,000
  </p>
  <p className="text-xs text-casino-gray-light mt-1">chips</p>
</div>
```

### Win Notification
```jsx
<div className="
  bg-casino-accent-primary/10
  border border-casino-accent-primary
  rounded-lg p-4
  backdrop-blur-sm
">
  <p className="text-casino-accent-primary font-semibold">
    🎉 You won!
  </p>
  <p className="text-2xl font-mono text-casino-white mt-1">
    +5,000
  </p>
</div>
```

### Leaderboard Entry
```jsx
<div className="
  flex items-center justify-between
  bg-casino-black-lighter
  border border-casino-gray-darker
  rounded-lg p-4
  hover:border-casino-gray-dark
  transition-colors
">
  <div className="flex items-center gap-4">
    <span className="text-2xl font-mono text-casino-gray-light">#1</span>
    <span className="text-casino-white font-semibold">PlayerName</span>
  </div>
  <span className="font-mono text-xl text-casino-accent-gold">100,000</span>
</div>
```

---

## Do's and Don'ts

### ✅ Do:
- Use generous spacing between elements
- Let typography create hierarchy
- Use subtle shadows and borders
- Keep animations smooth and quick (150-300ms)
- Use mono font for ALL numbers/chip amounts
- Maintain consistent border radius (lg or xl)

### ❌ Don't:
- Add gradients everywhere (use sparingly)
- Use more than 2 colors in one component
- Add unnecessary decorative elements
- Make animations longer than 500ms
- Mix rounded corners (stick to lg/xl)
- Use emojis in UI (only in notifications)

---

## Responsive Breakpoints

```css
sm: 640px   (mobile landscape)
md: 768px   (tablet)
lg: 1024px  (desktop)
xl: 1280px  (large desktop)
```

**Mobile-first approach:**
```jsx
<div className="
  text-2xl md:text-4xl lg:text-5xl
  p-4 md:p-6 lg:p-8
  grid-cols-1 md:grid-cols-2 lg:grid-cols-3
">
```

---

## Example: Complete Slot Machine UI

```jsx
<div className="min-h-screen bg-casino-black p-8">
  <div className="max-w-4xl mx-auto space-y-8">
    
    {/* Header */}
    <div className="flex items-center justify-between">
      <h1 className="text-4xl font-display text-casino-white">
        Slots
      </h1>
      <div className="text-right">
        <p className="text-sm text-casino-gray-light">Balance</p>
        <p className="text-2xl font-mono text-casino-accent-gold">
          25,000
        </p>
      </div>
    </div>

    {/* Game Area */}
    <div className="
      bg-casino-black-lighter
      border border-casino-gray-darker
      rounded-xl p-8
      space-y-6
    ">
      {/* Reels */}
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(reel => (
          <div key={reel} className="
            aspect-square
            bg-casino-gray-darker
            rounded-lg
            flex items-center justify-center
            text-6xl
          ">
            🍒
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm text-casino-gray-light">Bet Amount</p>
          <div className="flex gap-2">
            {[10, 50, 100, 500].map(amount => (
              <button key={amount} className="
                px-4 py-2
                bg-casino-gray-darker
                hover:bg-casino-gray-dark
                text-casino-white font-mono
                rounded-lg
                transition-colors
              ">
                {amount}
              </button>
            ))}
          </div>
        </div>

        <button className="
          px-8 py-4
          bg-casino-accent-primary
          text-casino-white font-semibold text-lg
          rounded-xl
          hover:bg-red-700
          active:scale-95
          transition-all
          shadow-lg shadow-casino-accent-primary/30
        ">
          SPIN
        </button>
      </div>
    </div>

    {/* History */}
    <div className="
      bg-casino-gray-darker
      rounded-lg p-6
      space-y-4
    ">
      <h3 className="text-xl font-sans font-semibold text-casino-white">
        Recent Spins
      </h3>
      {/* History items */}
    </div>

  </div>
</div>
```

---

## Font Loading

Add to your `layout.js`:

```jsx
import { DM_Serif_Display, Inter, JetBrains_Mono } from 'next/font/google'

const dmSerif = DM_Serif_Display({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display'
})

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans'
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSerif.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans bg-casino-black text-casino-white">
        {children}
      </body>
    </html>
  )
}
```

Update `tailwind.config.js` font family:
```js
fontFamily: {
  display: ['var(--font-display)', 'serif'],
  sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
  mono: ['var(--font-mono)', 'monospace'],
}
```

---

**Remember:** This is minimal design. When in doubt, remove decoration rather than add it. Trust white space, typography, and subtle motion to create elegance.
