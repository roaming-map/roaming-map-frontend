# Roaming Map

**Roaming Map** is a real-time, mobile-first Q&A platform designed to be a "local buddy in your pocket" for tourists. It provides instant, trustworthy guidance from verified locals, helping travelers navigate new places with confidence and clarity.

## The Problem

Tourists often face a fragmented and unreliable experience when seeking information abroad. The current landscape is defined by:
* **Price Confusion**: Uncertainty about fair prices for transport, food, and attractions.
* **Scattered Information**: Valuable travel tips are buried in outdated guidebooks or scattered across social media platforms like Reddit and Facebook.
* **Trust Issues**: Answers often come from other tourists or random users, not from people with genuine local knowledge.
* **Slow Responses**: Social platforms are not built for urgent, real-time help.

This uncertainty leads to stress, inefficiency, and negative travel experiences.

## The Solution

Roaming Map provides a dedicated, streamlined platform to solve these problems by connecting tourists directly with a community of **verified locals**.

* **Real-time Q&A**: Get instant answers to your questions, from "How much should a tuk-tuk cost to the airport?" to "Where is the best place for authentic street food?"
* **Verified Local Experts**: Build trust with answers from locals who are vetted by the platform, such as students, tour guides, and hostel staff.
* **Actionable Insights**: The platform aggregates community data to provide helpful trends and insights, such as "Average tuk-tuk fare in Colombo this week" or "Guesthouses offering discounts."
* **No Language Barrier**: Questions and answers are automatically translated between English and Sinhala, ensuring seamless communication.

---

## Tech Stack

This project is built using a modern, scalable tech stack to ensure a fast and responsive user experience.

**Frontend:**
* **Next.js**: A React-based framework for a fast, SEO-friendly frontend.
* **UI**: ShadCN and Tailwind CSS for a modern, mobile-first design system.

**Backend:**
* **Next.js API Routes**: A lightweight and efficient way to handle server-side logic and APIs within the Next.js framework.
* **Database**: PostgreSQL hosted on **Neon** for a scalable and reliable relational database.
* **ORM**: **Drizzle ORM** for type-safe, efficient database interactions.

**Deployment:**
* **Frontend Hosting**: **Vercel** for seamless deployment of the Next.js application.
* **Database Hosting**: **Neon** for the PostgreSQL database.

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
