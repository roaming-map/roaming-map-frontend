# 🚀 Quick Deployment Checklist

Use this checklist to deploy Roaming Map to roamingmap.com

## Pre-Deployment

- [ ] **Code is ready**
  - [ ] All features tested locally
  - [ ] `npm run build` succeeds without errors
  - [ ] Code pushed to GitHub

- [ ] **Production Database Setup**
  - [ ] Created production database in Neon
  - [ ] Copied production `DATABASE_URL`
  - [ ] Tested connection to production database

- [ ] **Clerk Setup**
  - [ ] Have production Clerk keys ready
  - [ ] Know where to find: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - [ ] Know where to find: `CLERK_SECRET_KEY`

## Vercel Deployment

- [ ] **Create Vercel Project**
  - [ ] Signed up/Logged into Vercel
  - [ ] Connected GitHub account
  - [ ] Imported `roaming-map-frontend` repository

- [ ] **Set Environment Variables** (Settings → Environment Variables)
  - [ ] `DATABASE_URL` = Production Neon connection string
  - [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = Production publishable key
  - [ ] `CLERK_SECRET_KEY` = Production secret key
  - [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
  - [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
  - [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` = `/`
  - [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` = `/`

- [ ] **Deploy**
  - [ ] Clicked "Deploy" in Vercel
  - [ ] Build completed successfully
  - [ ] Tested on Vercel URL (e.g., `your-app.vercel.app`)

## Database Setup

- [ ] **Run Migrations**
  - [ ] All tables created in production database
  - [ ] Schema matches local development

- [ ] **Seed Data**
  - [ ] Categories seeded (`npm run db:seed`)
  - [ ] Verified categories appear in production

## Domain Configuration

- [ ] **Add Domain in Vercel**
  - [ ] Added `roamingmap.com` in Vercel Settings → Domains
  - [ ] Got DNS configuration from Vercel

- [ ] **Configure DNS at Registrar**
  - [ ] Added A records (or CNAME) as instructed by Vercel
  - [ ] Saved DNS changes

- [ ] **Update Clerk**
  - [ ] Added `roamingmap.com` to Clerk allowed origins
  - [ ] Added `https://roamingmap.com` to redirect URLs

- [ ] **Wait for DNS**
  - [ ] Waited 1-2 hours (or up to 48 hours)
  - [ ] Verified DNS propagated (check in Vercel dashboard)

## Testing

- [ ] **Functionality Tests**
  - [ ] Homepage loads at `https://roamingmap.com`
  - [ ] Sign up works
  - [ ] Sign in works
  - [ ] Can create questions
  - [ ] Can post answers
  - [ ] Categories display
  - [ ] User profiles show
  - [ ] Edit/Delete questions works
  - [ ] "My Questions" filter works
  - [ ] Search works
  - [ ] Filters work

- [ ] **Performance**
  - [ ] Page loads quickly (< 3 seconds)
  - [ ] Mobile responsive
  - [ ] Images load correctly

- [ ] **Security**
  - [ ] SSL certificate active (🔒 lock icon)
  - [ ] HTTPS working
  - [ ] No console errors

## Post-Deployment

- [ ] **Monitor**
  - [ ] Check Vercel analytics
  - [ ] Monitor error logs
  - [ ] Check database performance

- [ ] **Documentation**
  - [ ] Update README with production URL
  - [ ] Document any production-specific notes

---

## 🎉 You're Live!

Once all items are checked, your app is live at **roamingmap.com**!

---

## Quick Reference

**Vercel Dashboard:** https://vercel.com/dashboard  
**Neon Console:** https://console.neon.tech  
**Clerk Dashboard:** https://dashboard.clerk.com  

**Environment Variables Needed:**
```
DATABASE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
```

