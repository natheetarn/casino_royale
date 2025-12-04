# 🎰 Casino Royale

A private casino website for friends - no real money, just fun competition with fake chips. Built with Next.js, Supabase, and deployed on Vercel.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works fine)
- npm or yarn

### Setup Instructions

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the schema from `lib/db/schema.sql`
   - Get your project URL and anon key from Settings > API

3. **Configure environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     ```
   - Generate a NextAuth secret:
     ```bash
     openssl rand -base64 32
     ```
   - Add it to `.env.local`:
     ```
     NEXTAUTH_SECRET=your_generated_secret
     NEXTAUTH_URL=http://localhost:3000
     ```

4. **Create your first admin user:**
   - Run the database migration (schema.sql) in Supabase SQL Editor
   - Use the provided script to create an admin user:
     ```bash
     node scripts/create-admin.js admin admin@example.com yourpassword
     ```
   - Or manually insert an admin user in Supabase SQL Editor (you'll need to hash the password with bcrypt)

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
cc/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   └── admin/        # Admin endpoints
│   ├── dashboard/        # User dashboard
│   ├── admin/            # Admin panel
│   ├── login/            # Login page
│   └── register/         # Registration page
├── components/            # React components
│   ├── Navbar.tsx        # Navigation bar
│   └── AdminPanel.tsx    # Admin panel component
├── lib/                   # Utility libraries
│   ├── supabase.ts       # Supabase client setup
│   ├── auth.ts           # Authentication helpers
│   ├── session.ts        # Session management
│   └── db/               # Database schema
└── middleware.ts          # Route protection
```

## 🎮 Features

### Phase 1 (Completed) ✅
- ✅ User authentication (login/register)
- ✅ Session management
- ✅ User dashboard with balance display
- ✅ Admin panel for chip management
- ✅ Transaction history
- ✅ Game history tracking

### Phase 2 (Completed) ✅
- ✅ Slots Machine - Classic 3-reel slots with animated reels
- ✅ Landmines - Grid-based risk/reward game with multipliers
- ✅ Roulette - European roulette with custom carousel wheel
- 🚗 Road Crossing (Planned)
- 🃏 Baccarat (Planned)

### Phase 3 (Completed) ✅
- ✅ Tedious tasks system for broke players (balance = 0)
- ✅ Math Homework - Solve 20 arithmetic problems
- ✅ Trivia Quiz - Answer 5 questions correctly
- ✅ CAPTCHA Hell - Solve 10 math captchas
- ✅ Typing Test - Type text accurately with WPM tracking
- ✅ The Waiting Game - Wait 5 minutes without switching tabs
- ✅ Admin-configurable rewards and cooldowns

### Phase 4 (Future)
- Multiplayer Texas Hold'em Poker
- Leaderboards
- Achievements

## 🔒 Security Notes

- All game logic runs on the server
- Client-side results are never trusted
- Passwords are hashed with bcrypt (10 rounds)
- Admin routes are protected
- Session management via secure cookies

## 🎨 Design

- Retro Vegas neon aesthetic
- Dark theme with neon accents
- Responsive design
- Modern UI with Tailwind CSS

## 📝 Database Schema

The database includes three main tables:
- **users**: User accounts with chip balances
- **transactions**: All chip transactions
- **game_history**: Game play records

See `lib/db/schema.sql` for the full schema.

## 🚢 Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## 📄 License

ISC

---

**Status:** Phase 1 Complete ✅ | Phase 2 Complete ✅ | Phase 3 Complete ✅

