# Testing Tedious Tasks Guide

## Quick Setup for Testing

### Option 1: Use Admin Panel (Recommended)

1. **Login as Admin**
   - Go to `/admin`
   - You should see the admin panel

2. **Set User Balance to 0**
   - In the "Add Chips to User" section
   - Select a test user
   - Enter a **negative amount** equal to their current balance
   - Example: If user has 10,000 chips, enter `-10000`
   - Add reason: "Testing tasks"
   - Click "Add Chips"
   - Balance should now be 0

3. **Access Tasks**
   - Logout and login as the test user (or use a different browser/incognito)
   - Navigate to `/tasks` or click "Tasks" in navbar
   - You should see all available tasks

### Option 2: Direct Database Update

If you have direct database access:

```sql
-- Set a user's balance to 0
UPDATE users 
SET chip_balance = 0 
WHERE username = 'testuser';
```

### Option 3: Create a New Test User with 0 Balance

```sql
-- Create a test user with 0 balance
INSERT INTO users (username, email, password_hash, chip_balance, is_admin)
VALUES (
  'testuser',
  'test@example.com',
  '$2a$10$...', -- Hash a password first
  0,
  false
);
```

## Testing Each Task

### 1. Math Homework Task 📐

**Expected Behavior:**
- Shows random arithmetic problems (addition, subtraction, multiplication, division)
- Requires 20 correct answers
- Progress shows "X / 20"
- Cannot proceed with incorrect answers
- Awards chips on completion (default: 1000)

**Test Steps:**
1. Click "Start Task" on Math Homework card
2. Solve 20 problems correctly
3. Verify balance updates after completion
4. Check cooldown appears (1 hour default)
5. Try to start again immediately - should be blocked

**What to Check:**
- ✅ Problems are random and varied
- ✅ Correct answers are accepted
- ✅ Incorrect answers show error
- ✅ Progress updates correctly
- ✅ Balance increases by reward amount
- ✅ Cooldown timer appears
- ✅ Cannot start during cooldown

### 2. Trivia Quiz Task 🧠

**Expected Behavior:**
- Shows random trivia questions
- Multiple choice format
- Requires 5 correct answers
- Shows progress
- Awards chips on completion (default: 750)

**Test Steps:**
1. Click "Start Task" on Trivia Quiz card
2. Answer 5 questions correctly
3. Verify balance updates
4. Check cooldown

**What to Check:**
- ✅ Questions are random
- ✅ Multiple choice options work
- ✅ Correct/incorrect feedback
- ✅ Progress tracking
- ✅ Balance updates correctly
- ✅ Cooldown works

### 3. CAPTCHA Hell Task 🤖

**Expected Behavior:**
- Shows math captchas (simple arithmetic)
- Requires 10 correct captchas
- Shows progress "X / 10"
- Awards chips on completion (default: 500)

**Test Steps:**
1. Click "Start Task" on CAPTCHA Hell card
2. Solve 10 captchas correctly
3. Verify balance updates
4. Check cooldown

**What to Check:**
- ✅ Captchas are random math problems
- ✅ Correct answers proceed
- ✅ Incorrect answers show error and regenerate
- ✅ Progress updates
- ✅ Balance updates correctly
- ✅ Cooldown works

### 4. Typing Test Task ⌨️

**Expected Behavior:**
- Shows target text to type
- Real-time typing validation
- Shows WPM and accuracy
- Requires 95%+ accuracy
- Requires minimum time (10 seconds)
- Awards chips on completion (default: 800)

**Test Steps:**
1. Click "Start Task" on Typing Test card
2. Type the text accurately
3. Wait at least 10 seconds
4. Maintain 95%+ accuracy
5. Click "Complete Task" when done
6. Verify balance updates

**What to Check:**
- ✅ Text displays correctly
- ✅ Real-time validation works
- ✅ WPM calculation is accurate
- ✅ Accuracy calculation is correct
- ✅ Progress bar updates
- ✅ Cannot complete before minimum time
- ✅ Cannot complete with < 95% accuracy
- ✅ Balance updates correctly
- ✅ Cooldown works

### 5. The Waiting Game Task ⏳

**Expected Behavior:**
- 5-minute countdown timer
- Tracks tab focus/blur
- Fails if tab is switched
- Progress bar shows time remaining
- Awards chips on completion (default: 2000)

**Test Steps:**
1. Click "Start Task" on The Waiting Game card
2. Click "Start Waiting"
3. Keep tab active for 5 minutes
4. Do NOT switch tabs
5. Click "Complete Task" when timer reaches 0
6. Verify balance updates

**Test with Tab Switch:**
1. Start the task
2. Switch to another tab
3. Switch back
4. Verify tab switch count increases
5. Complete the wait
6. Should fail if tab was switched

**What to Check:**
- ✅ Timer counts down correctly
- ✅ Progress bar updates
- ✅ Tab focus detection works
- ✅ Tab switch tracking works
- ✅ Task fails if tabs switched
- ✅ Can complete after full wait
- ✅ Balance updates correctly
- ✅ Cooldown works

## Testing Task System Features

### Cooldown System

1. Complete a task
2. Check cooldown timer appears
3. Try to start same task - should be blocked
4. Wait for cooldown (or adjust in admin panel)
5. Verify task becomes available again

### Balance Requirement

1. Set balance to 0 - tasks should be available
2. Set balance to > 0 - tasks should NOT be available
3. Navbar "Tasks" link should appear/disappear
4. Dashboard tasks section should appear/disappear

### Admin Configuration

1. Login as admin
2. Go to `/admin`
3. Find "Task Rewards & Cooldowns" section
4. Edit a task's reward amount
5. Edit a task's cooldown
6. Verify changes save
7. Test task - should use new reward/cooldown

### Multiple Tasks

1. Complete one task
2. Verify other tasks are still available (if not on cooldown)
3. Complete multiple different tasks
4. Verify each has its own cooldown

## Common Issues & Solutions

### Tasks Not Showing

**Problem:** Tasks page shows "Tasks Unavailable"
- **Solution:** Check user balance is exactly 0 (not negative, not positive)

### Cooldown Not Working

**Problem:** Can start task immediately after completion
- **Solution:** Check database - verify `task_completions` table has entry
- Check API response - verify cooldown is calculated correctly

### Balance Not Updating

**Problem:** Completed task but balance didn't increase
- **Solution:** Check browser console for errors
- Check network tab - verify API call succeeded
- Check database - verify transaction was logged
- Refresh page - balance should update

### Tab Detection Not Working

**Problem:** Waiting game doesn't detect tab switches
- **Solution:** Check browser allows focus/blur events
- Try in different browser
- Check console for errors

## Quick Test Script

Run this in browser console on `/tasks` page (when balance = 0):

```javascript
// Check if tasks are available
fetch('/api/tasks/list')
  .then(r => r.json())
  .then(data => {
    console.log('Tasks available:', data.available);
    console.log('Tasks:', data.tasks);
  });

// Check current user balance
fetch('/api/auth/me')
  .then(r => r.json())
  .then(data => {
    console.log('Balance:', data.user?.chip_balance);
  });
```

## Test Checklist

- [ ] Can access tasks page when balance = 0
- [ ] Cannot access tasks page when balance > 0
- [ ] All 5 tasks appear in task list
- [ ] Math Homework: Complete 20 problems
- [ ] Trivia Quiz: Answer 5 questions correctly
- [ ] CAPTCHA Hell: Solve 10 captchas
- [ ] Typing Test: Type text with 95%+ accuracy
- [ ] The Waiting Game: Wait 5 minutes without switching tabs
- [ ] Cooldown appears after each task
- [ ] Cannot start task during cooldown
- [ ] Balance updates after each task
- [ ] Admin can edit task rewards
- [ ] Admin can edit task cooldowns
- [ ] Changes persist after refresh

---

**Note:** To quickly reset cooldowns for testing, you can delete entries from `task_completions` table or adjust cooldown to 0 in admin panel temporarily.

