# Testing and Deployment Plan

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup

#### Required Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth Configuration
NEXTAUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=http://localhost:3000  # Change to production URL for deployment
```

#### For Vercel Deployment

Add these same variables in Vercel Dashboard:
- Settings → Environment Variables
- Add each variable for Production, Preview, and Development environments
- Update `NEXTAUTH_URL` to your production domain (e.g., `https://your-app.vercel.app`)

### 2. Database Setup

#### Run Database Migration

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire contents of `lib/db/schema.sql`
4. Run the SQL script
5. Verify tables were created:
   - `users`
   - `transactions`
   - `game_history`
   - `landmines_sessions`
   - `task_completions`
   - `task_config`

#### Create Admin User

Option 1: Using the script (recommended)
```bash
node scripts/create-admin.js admin admin@example.com yourpassword
```

Option 2: Manual SQL insertion
```sql
-- Hash password first (use bcrypt with 10 rounds)
-- Then insert:
INSERT INTO users (username, email, password_hash, chip_balance, is_admin)
VALUES ('admin', 'admin@example.com', '$2a$10$...hashed_password...', 10000, true);
```

### 3. Build Verification

Test the production build locally:

```bash
# Install dependencies
npm install

# Run production build
npm run build

# Test production server
npm start
```

Verify:
- ✅ Build completes without errors
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Production server starts successfully

---

## 🧪 Testing Checklist

### Authentication & User Management

#### Registration
- [ ] Can register new user with valid email/username
- [ ] Registration fails with duplicate email/username
- [ ] Password is properly hashed (check database)
- [ ] New users start with 10,000 chips
- [ ] New users are not admins by default

#### Login
- [ ] Can login with correct credentials
- [ ] Login fails with incorrect password
- [ ] Login fails with non-existent user
- [ ] Session persists after page refresh
- [ ] Session expires after logout

#### Logout
- [ ] Logout clears session
- [ ] Redirects to home page
- [ ] Cannot access protected routes after logout

### Admin Panel

#### Access Control
- [ ] Non-admin users cannot access `/admin`
- [ ] Admin users can access `/admin`
- [ ] Redirects work correctly

#### Admin Functions
- [ ] Can view all users and balances
- [ ] Can add chips to users
- [ ] Chip addition updates balance correctly
- [ ] Transaction is logged in transactions table
- [ ] Can view transaction history
- [ ] Can view task configurations
- [ ] Can edit task rewards
- [ ] Can edit task cooldowns
- [ ] Changes persist after page refresh

### Games

#### Slots Game
- [ ] Can place bets (preset and custom amounts)
- [ ] Fraction buttons work (1/10, 1/4, 1/2, All In)
- [ ] Cannot bet more than balance
- [ ] Cannot bet 0 or negative amounts
- [ ] Spin animation works (quick and slow modes)
- [ ] Reels stop sequentially (left to right)
- [ ] Win/loss calculations are correct
- [ ] Balance updates correctly after spin
- [ ] Transaction is logged
- [ ] Game history is recorded
- [ ] Error messages display for invalid bets

#### Landmines Game
- [ ] Can configure grid size (slider works)
- [ ] Can configure mine count (slider works)
- [ ] Can place bets
- [ ] Game starts correctly
- [ ] Tiles reveal correctly (safe = green, mine = bomb icon)
- [ ] Multiplier increases with safe tiles
- [ ] Multiplier displays on clicked tile
- [ ] Can cash out anytime
- [ ] Cashout calculates payout correctly
- [ ] Mine hit ends game correctly
- [ ] Balance updates after cashout/mine hit
- [ ] Can start new game after round ends
- [ ] Grid layout is responsive

#### Roulette Game
- [ ] Can select chip amounts (preset and custom)
- [ ] Fraction buttons work
- [ ] Can place bets on numbers
- [ ] Can place outside bets (RED, BLACK, ODD, EVEN, 1-18, 19-36)
- [ ] Chip badges show on bet buttons
- [ ] Can remove bets
- [ ] Spin animation works smoothly
- [ ] Wheel stops on correct number
- [ ] Win/loss calculations are correct
- [ ] Payouts match bet types
- [ ] Result toast displays correctly
- [ ] Balance updates correctly
- [ ] All bets clear after spin

### Tasks System

#### Task Availability
- [ ] Tasks only available when balance = 0
- [ ] Tasks page shows message when balance > 0
- [ ] Navbar shows "Tasks" link when balance = 0
- [ ] Dashboard shows tasks section when balance = 0

#### Task Cooldowns
- [ ] Cooldown timer counts down correctly
- [ ] Cannot start task on cooldown
- [ ] Cooldown persists after page refresh
- [ ] Cooldown resets after completion

#### Math Homework Task
- [ ] Generates random problems correctly
- [ ] Accepts correct answers
- [ ] Rejects incorrect answers
- [ ] Tracks progress (X/20)
- [ ] Requires 20 correct answers
- [ ] Awards chips on completion
- [ ] Updates balance correctly
- [ ] Logs completion

#### Trivia Quiz Task
- [ ] Shows random questions
- [ ] Multiple choice options work
- [ ] Tracks correct/incorrect answers
- [ ] Requires 5 correct answers
- [ ] Awards chips on completion
- [ ] Updates balance correctly

#### CAPTCHA Hell Task
- [ ] Generates math captchas
- [ ] Validates answers correctly
- [ ] Tracks progress (X/10)
- [ ] Requires 10 correct captchas
- [ ] Awards chips on completion
- [ ] Updates balance correctly

#### Typing Test Task
- [ ] Displays target text
- [ ] Real-time typing validation works
- [ ] WPM calculation is accurate
- [ ] Accuracy calculation is correct
- [ ] Progress bar updates
- [ ] Requires 95%+ accuracy
- [ ] Requires minimum time
- [ ] Awards chips on completion
- [ ] Updates balance correctly

#### The Waiting Game Task
- [ ] Starts countdown timer
- [ ] Timer counts down correctly
- [ ] Progress bar updates
- [ ] Detects tab focus/blur
- [ ] Tracks tab switches
- [ ] Fails if tab switched
- [ ] Completes after 5 minutes
- [ ] Awards chips on completion
- [ ] Updates balance correctly

### UI/UX

#### Navigation
- [ ] Navbar displays correctly
- [ ] Balance updates in real-time
- [ ] Links work correctly
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop

#### Dashboard
- [ ] Balance card displays correctly
- [ ] Game cards link correctly
- [ ] Recent games display
- [ ] Recent transactions display
- [ ] Tasks section appears when balance = 0

#### Error Handling
- [ ] Error messages display clearly
- [ ] Invalid inputs show errors
- [ ] Network errors handled gracefully
- [ ] 404 pages work
- [ ] 500 errors handled

### Security

#### Input Validation
- [ ] SQL injection attempts fail
- [ ] XSS attempts are sanitized
- [ ] Invalid bet amounts rejected
- [ ] Negative numbers rejected
- [ ] Non-numeric inputs rejected

#### Authentication
- [ ] Protected routes require login
- [ ] API routes verify sessions
- [ ] Admin routes verify admin status
- [ ] Passwords are hashed
- [ ] Sessions expire correctly

#### Game Logic
- [ ] All game logic runs server-side
- [ ] Client cannot manipulate results
- [ ] Balance updates are atomic
- [ ] Transactions are logged
- [ ] No double-spending possible

---

## 🚀 Deployment Steps

### 1. Prepare Repository

```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Vercel Setup

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub

2. **Import Project**
   - Click "New Project"
   - Import from GitHub repository
   - Select your repository

3. **Configure Project**
   - Framework Preset: Next.js
   - Root Directory: `./` (or leave default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

4. **Add Environment Variables**
   - Go to Settings → Environment Variables
   - Add each variable:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXTAUTH_SECRET` (generate new one for production)
     - `NEXTAUTH_URL` (your Vercel domain, e.g., `https://your-app.vercel.app`)

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Note the deployment URL

### 3. Post-Deployment

#### Update NEXTAUTH_URL
- After first deployment, update `NEXTAUTH_URL` in Vercel to your actual domain
- Redeploy if needed

#### Verify Deployment
- [ ] Site loads correctly
- [ ] Can register new user
- [ ] Can login
- [ ] Games work
- [ ] Tasks work
- [ ] Admin panel accessible

#### Create Production Admin User
```bash
# Set environment variables locally
export NEXT_PUBLIC_SUPABASE_URL="your_production_url"
export SUPABASE_SERVICE_ROLE_KEY="your_production_key"

# Run admin creation script
node scripts/create-admin.js admin admin@example.com yourpassword
```

### 4. Custom Domain (Optional)

1. Go to Vercel Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` to custom domain
5. Redeploy

---

## 🔍 Post-Deployment Testing

### Smoke Tests

Run these tests immediately after deployment:

1. **Homepage**
   - [ ] Loads without errors
   - [ ] Shows login/register buttons

2. **Registration**
   - [ ] Can create new account
   - [ ] Receives 10,000 starting chips

3. **Login**
   - [ ] Can login with new account
   - [ ] Redirects to dashboard

4. **Games**
   - [ ] Can access Slots
   - [ ] Can place a bet
   - [ ] Can spin
   - [ ] Balance updates

5. **Tasks**
   - [ ] Set balance to 0 (via admin)
   - [ ] Tasks page accessible
   - [ ] Can start a task
   - [ ] Can complete a task
   - [ ] Balance updates

6. **Admin Panel**
   - [ ] Admin can access
   - [ ] Can view users
   - [ ] Can add chips

---

## 🐛 Troubleshooting

### Build Errors

**Error: Missing environment variables**
- Solution: Add all required variables in Vercel dashboard

**Error: TypeScript errors**
- Solution: Run `npm run build` locally first, fix errors

**Error: Module not found**
- Solution: Ensure all dependencies are in `package.json`

### Runtime Errors

**Error: Database connection failed**
- Solution: Verify Supabase URL and keys are correct
- Check Supabase project is active

**Error: Authentication not working**
- Solution: Verify `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches deployment URL

**Error: Admin panel not accessible**
- Solution: Verify user has `is_admin = true` in database
- Check session is valid

### Performance Issues

**Slow page loads**
- Check Supabase connection pooling
- Verify indexes are created
- Check Vercel deployment region matches Supabase region

---

## 📊 Monitoring

### Recommended Monitoring

1. **Vercel Analytics** (built-in)
   - Page views
   - Performance metrics
   - Error tracking

2. **Supabase Dashboard**
   - Database performance
   - Query logs
   - Connection pool usage

3. **Error Tracking** (optional)
   - Consider adding Sentry for error tracking
   - Monitor API route errors
   - Track client-side errors

---

## ✅ Final Checklist

Before going live:

- [ ] All tests pass
- [ ] Production build succeeds
- [ ] Environment variables configured
- [ ] Database migrated
- [ ] Admin user created
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Error monitoring set up
- [ ] Documentation updated
- [ ] Team notified of deployment

---

## 📝 Deployment Notes

- **First Deployment**: May take 5-10 minutes
- **Subsequent Deployments**: Usually 2-3 minutes
- **Zero Downtime**: Vercel handles this automatically
- **Rollback**: Available in Vercel dashboard if needed

---

**Last Updated**: [Current Date]
**Deployment Status**: Ready for testing

