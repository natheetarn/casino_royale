# Deployment Quick Start Guide

## ✅ Pre-Deployment Status

- ✅ Build passes successfully
- ✅ TypeScript errors resolved
- ✅ All components compile
- ✅ Environment variables documented

## 🚀 Quick Deployment Steps

### 1. Environment Variables

Create `.env.local` (or add to Vercel):

```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=https://your-app.vercel.app
```

### 2. Database Migration

Run `lib/db/schema.sql` in Supabase SQL Editor.

### 3. Create Admin User

```bash
node scripts/create-admin.js admin admin@example.com password
```

### 4. Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### 5. Post-Deployment

1. Update `NEXTAUTH_URL` to production domain
2. Create production admin user
3. Run smoke tests

## 📋 Full Testing Checklist

See `TESTING_AND_DEPLOYMENT.md` for complete testing checklist.

## 🐛 Common Issues

**Build fails**: Check TypeScript errors locally first
**Auth not working**: Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
**Database errors**: Check Supabase connection and schema migration

---

For detailed information, see `TESTING_AND_DEPLOYMENT.md`.

