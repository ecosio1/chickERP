# ChickERP - Claude Code Guidelines

## Project Overview
ChickERP is a poultry/game bird breeding management system built with:
- Next.js 14 (App Router)
- Supabase (Auth + Database)
- TypeScript
- Tailwind CSS + shadcn/ui
- Vitest for testing

## Development Guidelines

### After Every Implementation, Create a Test
When implementing new features or fixing bugs:
1. Write the implementation code
2. Create corresponding test(s) in the `__tests__` directory
3. Run tests with `npm test` to verify

Test files should be placed in:
- `src/__tests__/` - mirrors the src directory structure
- Name format: `*.test.ts` or `*.test.tsx`

### Database
- Uses Supabase PostgreSQL with Row Level Security (RLS)
- Database types: `src/types/database.types.ts`
- Snake_case in database, camelCase in API responses
- Self-referential joins (like bird parents) should be fetched separately to avoid PostgREST issues

### API Routes
- Located in `src/app/api/`
- Use `createClient()` from `@/lib/supabase/server` for database access
- Use `requireAuth()` from `@/lib/api-utils` for authentication
- Transform snake_case DB fields to camelCase in responses

### Components
- UI components in `src/components/ui/` (shadcn)
- Feature components in `src/components/{feature}/`
- Use `useLanguage()` hook for translations (English/Tagalog)

### Key Features
- Bird management with breed composition tracking
- Breed percentages calculated from parents (50% from each)
- Egg tracking, health records, weight records
- Conditioning and fight records for game birds
- Import/export functionality

## Commands
- `npm run dev` - Start development server
- `npm test` - Run tests
- `npm run build` - Build for production
