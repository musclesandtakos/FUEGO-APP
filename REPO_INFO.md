# Repository Information

## 1️⃣ Repo Name
**musclesandtakos/FUEGO-APP**

## 2️⃣ Repo Type

### **Next.js Web Application** (React-based)

This is **NOT** an:
- ❌ Expo / React Native mobile app
- ❌ iOS-Swift / Android-Kotlin native app
- ❌ Design-only repository

### Technology Stack

**Framework & Runtime:**
- **Next.js 14** - React framework for web applications
- **React 18.2** - UI library
- **TypeScript 5.3** - Type-safe JavaScript
- **Node.js** - Runtime environment

**Database & Backend:**
- **Supabase** - PostgreSQL database with authentication
- **PostgreSQL with pgvector** - Vector similarity search for AI matching
- **Supabase Client (@supabase/supabase-js)** - Database operations

**AI Integration:**
- **OpenAI API** - Embeddings and AI-powered matching
- **Anthropic Claude API** - AI completions and chat features

**Development Tools:**
- **ESLint** - Code linting
- **npm** - Package manager

## Application Type

**Web Application** - This is a full-stack web application that runs in the browser, not a mobile app.

### Key Characteristics:

1. **Next.js Pages Router** - Uses `pages/` directory for routing
2. **API Routes** - Server-side API endpoints in `pages/api/`
3. **React Components** - TSX components for the frontend
4. **No Mobile Native Code** - No Swift, Kotlin, Java, or Objective-C files
5. **No Expo Configuration** - No `app.json` or Expo-specific setup
6. **Web-Only** - Designed to run in web browsers, not mobile devices

## Project Purpose

FUEGO-APP (version 14) is a **matching application** that uses:
- AI-powered semantic similarity
- Vector embeddings for interest matching
- PostgreSQL with pgvector extension
- Supabase for database and authentication
- Claude/OpenAI APIs for intelligent features

Users can create profiles with their interests and find matches based on semantic similarity using vector embeddings.

## Running the Application

```bash
# Development
npm run dev
# Runs on http://localhost:3000

# Production
npm run build
npm start
```

## Repository Structure

```
FUEGO-APP/
├── components/          # React components (TSX)
├── lib/                # Utility libraries
│   ├── claude.ts       # Claude API client
│   ├── supabase.ts     # Supabase client
│   └── embeddings.ts   # Vector embeddings
├── pages/              # Next.js pages
│   ├── _app.tsx        # App wrapper
│   ├── index.tsx       # Home page
│   └── api/           # API endpoints
├── scripts/           # Database scripts
├── sql/               # SQL migrations
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript config
└── next.config.js     # Next.js config
```

## Summary

**This is a web application built with Next.js and React, not a mobile app.** It's designed to run in web browsers and provides a full-stack solution with API routes, database integration, and AI-powered features.
