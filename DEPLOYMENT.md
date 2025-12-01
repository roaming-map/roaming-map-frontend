# Deployment Guide - Roaming Map to roamingmap.com

This guide will walk you through deploying your Roaming Map application to Vercel and connecting your custom domain `roamingmap.com`.

## Prerequisites

- ✅ Domain purchased: `roamingmap.com`
- ✅ GitHub repository (recommended for Vercel)
- ✅ Neon database account (production database)
- ✅ Clerk account (for authentication)

---

## Step 1: Prepare Your Code

### 1.1 Push to GitHub (if not already done)

```bash
# Make sure all changes are committed
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 1.2 Test Build Locally

```bash
npm run build
```

If the build succeeds, you're ready to deploy!

---

## Step 2: Set Up Vercel

### 2.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with your GitHub account
3. Click "Add New Project"

### 2.2 Import Your Repository

1. Select your `roaming-map-frontend` repository
2. Vercel will auto-detect Next.js settings
3. **DO NOT** click "Deploy" yet - we need to set environment variables first

---

## Step 3: Configure Environment Variables

### 3.1 Required Environment Variables

Before deploying, add these environment variables in Vercel:

#### **Database (Neon)**
```
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
```
- Get this from your Neon dashboard → Connection String
- Use your **production** database (create one if you only have dev)

#### **Clerk Authentication**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```
- Get these from [Clerk Dashboard](https://dashboard.clerk.com)
- Go to: API Keys → Copy both keys
- For production, use production keys (not test keys)

#### **Clerk URLs (Important for Production)**
```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### 3.2 Add Environment Variables in Vercel

1. In your Vercel project settings:
   - Go to **Settings** → **Environment Variables**
   - Add each variable above
   - Select **Production**, **Preview**, and **Development** environments
   - Click "Save"

---

## Step 4: Deploy to Vercel

### 4.1 Initial Deployment

1. After adding environment variables, go back to **Deployments**
2. Click "Deploy" (or push to main branch to trigger auto-deploy)
3. Wait for build to complete (~2-3 minutes)

### 4.2 Verify Deployment

1. Check the deployment logs for any errors
2. Visit the Vercel-provided URL (e.g., `your-app.vercel.app`)
3. Test:
   - Sign up/Sign in
   - Create a question
   - Post an answer
   - Check if data persists

---

## Step 5: Set Up Production Database

### 5.1 Create Production Database in Neon

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project (or use existing)
3. Copy the connection string
4. Update `DATABASE_URL` in Vercel with production connection string

### 5.2 Run Migrations on Production

**Option A: Using Neon Console**
1. Go to Neon Console → SQL Editor
2. Run all migration files from `drizzle/` folder in order
3. Or use `drizzle-kit push` (see below)

**Option B: Using Drizzle Kit (Recommended)**
```bash
# Set production DATABASE_URL locally
export DATABASE_URL="your-production-connection-string"

# Push schema to production
npm run db:push
```

### 5.3 Seed Categories

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-connection-string"

# Seed categories
npm run db:seed
```

---

## Step 6: Configure Custom Domain (roamingmap.com)

### 6.1 Add Domain in Vercel

1. Go to your project → **Settings** → **Domains**
2. Enter: `roamingmap.com`
3. Click "Add"
4. Vercel will show DNS configuration instructions

### 6.2 Configure DNS at Your Domain Registrar

You need to add DNS records at your domain registrar (where you bought the domain):

#### **Option A: Apex Domain (roamingmap.com)**

Add these records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | Auto |
| A | @ | 76.223.126.42 | Auto |
| AAAA | @ | 2606:4700:3034::ac43:92a5 | Auto |
| AAAA | @ | 2606:4700:3036::ac43:92a6 | Auto |

#### **Option B: CNAME (www.roamingmap.com)**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | cname.vercel-dns.com | Auto |

**Note:** Vercel will provide exact values - use those!

### 6.3 Update Clerk Allowed Origins

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to: **Settings** → **Domains**
3. Add `roamingmap.com` to allowed origins
4. Add `https://roamingmap.com` to allowed redirect URLs

### 6.4 Wait for DNS Propagation

- DNS changes can take 24-48 hours to propagate
- Usually works within 1-2 hours
- Check status in Vercel dashboard

---

## Step 7: Final Verification

### 7.1 Test Production Site

Visit `https://roamingmap.com` and test:

- [ ] Homepage loads
- [ ] Sign up works
- [ ] Sign in works
- [ ] Can create questions
- [ ] Can post answers
- [ ] Categories display correctly
- [ ] User profiles show correctly
- [ ] All data persists

### 7.2 Check SSL Certificate

- Vercel automatically provisions SSL certificates
- Should be active within minutes of DNS propagation
- Check for 🔒 lock icon in browser

---

## Step 8: Post-Deployment Checklist

### 8.1 Performance

- [ ] Test page load speed (should be < 3 seconds)
- [ ] Check mobile responsiveness
- [ ] Verify images load correctly

### 8.2 Functionality

- [ ] All API endpoints work
- [ ] Database queries execute correctly
- [ ] Authentication flows work
- [ ] Error handling works

### 8.3 Monitoring (Optional but Recommended)

Consider setting up:
- **Vercel Analytics** (free tier available)
- **Sentry** for error tracking
- **Google Analytics** for user insights

---

## Troubleshooting

### Build Fails

**Error: Environment variable not found**
- Check all required env vars are set in Vercel
- Make sure they're set for Production environment

**Error: Database connection failed**
- Verify `DATABASE_URL` is correct
- Check if database allows connections from Vercel IPs
- Neon should allow all IPs by default

### Domain Not Working

**DNS not resolving**
- Wait 24-48 hours for propagation
- Check DNS records are correct
- Use `dig roamingmap.com` to verify

**SSL Certificate issues**
- Vercel auto-provisions SSL
- Wait a few minutes after DNS propagation
- Check Vercel dashboard for certificate status

### Authentication Issues

**Clerk errors**
- Verify domain is added to Clerk allowed origins
- Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is correct
- Ensure production keys are used (not test keys)

---

## Environment Variables Summary

```bash
# Database
DATABASE_URL=postgresql://...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

---

## Quick Deploy Commands

```bash
# 1. Test build locally
npm run build

# 2. Push to GitHub (triggers Vercel auto-deploy)
git push origin main

# 3. Or deploy manually via Vercel CLI
npm i -g vercel
vercel --prod
```

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Check database connection
5. Verify Clerk configuration

---

**Ready to deploy?** Follow the steps above and your app will be live at `roamingmap.com`! 🚀

