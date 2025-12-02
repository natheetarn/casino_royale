# Casino Royale - Project Plan

## 🎯 Project Overview
Private casino website for 3-4 friends. No real money, just fun competition with fake chips. Self-hosted on Vercel with Next.js.

---

## 📋 Phase 1: Core Infrastructure
**Goal:** Get the foundation working - auth, database, admin controls

### Backend Setup
- [ ] Set up Next.js project structure
- [ ] Configure Supabase (or Neon) for PostgreSQL database
- [ ] Create database schema:
  - [ ] Users table (id, username, email, password_hash, chip_balance, created_at)
  - [ ] Transactions table (id, user_id, game_type, amount, balance_after, timestamp)
  - [ ] Game_history table (id, user_id, game_type, bet_amount, result, winnings, timestamp)
- [ ] Set up environment variables (.env.local)

### Authentication System
- [ ] Create login page with form
- [ ] Create register page
- [ ] Implement password hashing (bcrypt)
- [ ] Set up session management (JWT or NextAuth.js)
- [ ] Protected route middleware
- [ ] Logout functionality

### Admin Panel
- [ ] Admin role in database
- [ ] Admin-only route protection
- [ ] Create admin dashboard UI
- [ ] Add chips to user functionality
- [ ] View all users and balances
- [ ] View transaction history
- [ ] Manual chip adjustment with reason logging

### User Dashboard
- [ ] Display current chip balance
- [ ] Show recent game history
- [ ] Navigation to games
- [ ] Profile section

---

## 📋 Phase 2: Solo Games
**Goal:** Build 4 playable solo games with fair odds

### 1. Slots Machine 🎰
- [ ] Design slot UI (3 reels, classic symbols)
- [ ] Implement spin mechanics
- [ ] Define symbol odds and payouts
- [ ] Animated reel spinning
- [ ] Win/loss calculation
- [ ] Balance update on backend
- [ ] Win celebration animations
- [ ] Bet amount selector (10, 50, 100, 500, 1000)

### 2. Landmines 💣
- [ ] Create grid UI (5x5 or customizable)
- [ ] Place random mines (configurable difficulty)
- [ ] Click to reveal tiles
- [ ] Multiplier increases per safe tile
- [ ] Cash out button (anytime)
- [ ] Explode animation on mine hit
- [ ] Progressive multiplier display
- [ ] Game state management

### 3. Road Crossing 🚗
- [ ] Lane-based UI (vertical scroll)
- [ ] Character/token movement
- [ ] Randomized traffic patterns
- [ ] Multiplier per lane crossed
- [ ] Cash out anytime
- [ ] Collision detection = lose
- [ ] Smooth animations
- [ ] Difficulty curve (faster traffic as you progress)

### 4. Baccarat 🃏
- [ ] Card dealing UI
- [ ] Player vs Banker betting
- [ ] Tie bet option
- [ ] Standard baccarat rules implementation
- [ ] Card reveal animations
- [ ] Win condition calculation
- [ ] Betting interface with chip selection
- [ ] Hand history display

---

## 📋 Phase 3: Tedious Tasks System
**Goal:** Punishment mechanics for broke players - earn chips through annoying tasks

### Task Infrastructure
- [ ] Task selection UI when balance = 0
- [ ] Task cooldown system (can't spam same task)
- [ ] Task completion verification
- [ ] Chip reward distribution

### Individual Tasks
- [ ] **CAPTCHA Hell**: Solve 10 captchas → 500 chips
  - [ ] Generate random captcha images or use library
  - [ ] Validation logic
  
- [ ] **Cookie Clicker Grind**: Click 1000 times → 1000 chips
  - [ ] Click counter with visual feedback
  - [ ] Anti-cheat (time-based validation)
  
- [ ] **Trivia Quiz**: Answer 5 questions correctly → 750 chips
  - [ ] Question database (20+ questions)
  - [ ] Random selection
  - [ ] Validation
  
- [ ] **The Waiting Game**: Wait 5 minutes → 2000 chips
  - [ ] Countdown timer
  - [ ] Tab focus detection (must stay on page)
  - [ ] No interaction allowed during wait
  
- [ ] **Math Homework**: Solve 20 arithmetic problems → 1000 chips
  - [ ] Random problem generator
  - [ ] Answer validation
  - [ ] Timer pressure (optional)

---

## 📋 Phase 4: Multiplayer Features (Future)
**Goal:** Real-time poker and competitive features

### Infrastructure
- [ ] WebSocket setup (Socket.io or Pusher as Vercel workaround)
- [ ] Room/lobby system
- [ ] Player matching logic
- [ ] Real-time state synchronization

### Texas Hold'em Poker
- [ ] Game lobby (create/join rooms)
- [ ] 2-6 player support
- [ ] Card dealing system
- [ ] Betting rounds (pre-flop, flop, turn, river)
- [ ] Hand evaluation logic
- [ ] Pot management
- [ ] Player turn management
- [ ] Chat system (optional)
- [ ] Spectator mode (optional)

### Competitive Features
- [ ] Global leaderboard (richest players)
- [ ] Biggest win leaderboard
- [ ] Most games played stats
- [ ] Achievement system
- [ ] Friend challenges

---

## 🎨 Design & UX
**Aesthetic Direction:** Retro Vegas neon + modern dark UI

### Design Tasks
- [ ] Choose distinctive font pairing (display + body)
- [ ] Define color palette (neon accents on dark base)
- [ ] Create consistent component library
- [ ] Design chip/coin visual representation
- [ ] Sound effects for wins/losses (optional)
- [ ] Background music toggle (optional)
- [ ] Responsive design for mobile
- [ ] Loading states and skeletons
- [ ] Error state designs
- [ ] Toast notifications for wins/losses

---

## 🚀 Deployment & DevOps

### Vercel Setup
- [ ] Connect GitHub repository
- [ ] Configure environment variables in Vercel
- [ ] Set up automatic deployments
- [ ] Custom domain (optional)

### Database Hosting
- [ ] Set up Supabase project
- [ ] Configure connection pooling
- [ ] Set up database backups
- [ ] Migration scripts

### Monitoring
- [ ] Error logging (Sentry optional)
- [ ] Analytics (simple event tracking)
- [ ] Performance monitoring

---

## 🧪 Testing & Polish

### Testing
- [ ] Test all game mechanics for fairness
- [ ] Test authentication flows
- [ ] Test admin panel functions
- [ ] Mobile responsiveness testing
- [ ] Cross-browser testing
- [ ] Load testing with 4 concurrent users

### Polish
- [ ] Add loading animations
- [ ] Smooth page transitions
- [ ] Error handling and user feedback
- [ ] Help/rules section for each game
- [ ] FAQ page
- [ ] Terms of service (joke version)

---

## 📦 Nice-to-Have Features

### Fun Extras
- [ ] Daily login bonus (small amount)
- [ ] Spin the wheel (daily free spin)
- [ ] Scratch cards
- [ ] VIP status for highest balance
- [ ] Custom avatar/profile pictures
- [ ] Chat/trash talk system
- [ ] Betting history visualization (charts)
- [ ] "Biggest Loss" hall of shame
- [ ] Easter eggs and hidden bonuses
- [ ] Dark/light theme toggle

---

## 🎯 Current Sprint: Phase 1 - Week 1

### Priority Tasks This Week
1. [ ] Set up Next.js + Supabase
2. [ ] Build authentication system
3. [ ] Create basic dashboard
4. [ ] Implement admin panel for chip management
5. [ ] Design and implement main navigation

### Next Week Preview
- Start Phase 2: Build Slots game
- Refine UI/UX based on initial feedback

---

## 📝 Notes & Decisions

### Technology Choices
- **Frontend:** Next.js 14+ (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js or custom JWT
- **Deployment:** Vercel
- **Future Multiplayer:** Socket.io or Pusher

### Game Balance Guidelines
- House edge should be reasonable (not impossible to win)
- Each game should have ~45-48% player win rate
- Big wins should be rare but possible
- Progressive difficulty in games to keep interesting

### Security Notes
- Never trust client-side game results
- All game logic must run on server
- Validate every transaction
- Rate limit API calls
- Hash passwords with bcrypt (10+ rounds)

---

## 🏆 Success Metrics

- [ ] All 4 solo games playable and fun
- [ ] Zero bugs in chip transactions
- [ ] Friends actually want to play
- [ ] Leaderboard creates friendly competition
- [ ] Going broke is annoying enough to avoid, but recoverable
- [ ] Site loads fast (<2s initial load)
- [ ] Mobile-friendly experience

---

**Last Updated:** December 2025  
**Project Status:** 🟡 Phase 1 In Progress
