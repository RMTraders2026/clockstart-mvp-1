# ClockStart MVP

Mobile-first MVP for construction/civil/scrap-metal employee clock-in, clock-out, daily pre-starts, GPS capture, admin review, and weekly CSV export.

## Stack

- Next.js App Router
- React and TypeScript
- Supabase Auth and Postgres
- Tailwind CSS
- Vercel-ready

## Project Structure

```text
src/app
  login                 Employee/admin login
  today                 Employee pre-start, clock-in, clock-out
  my-timesheets         Employee history
  admin                 Admin dashboard
  admin/current-clock-ins
  admin/timesheets      Filters, approvals, rejections, corrections
  admin/prestarts
  admin/employees
  admin/workplaces
  admin/export
src/components          Shared shell and UI primitives
src/lib                 Supabase, GPS, date, CSV, audit helpers
supabase/schema.sql     Tables, constraints, triggers, RLS policies
```

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase/schema.sql`.
3. In Supabase Auth, create users for employees and admins.
4. Set the user's metadata before creation if possible:

```json
{
  "full_name": "Alex Worker",
  "role": "employee"
}
```

For an admin:

```json
{
  "full_name": "Sam Supervisor",
  "role": "admin"
}
```

If a profile already exists, update `public.profiles.role` to `admin` in Supabase.

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Key Rules Implemented

- Employee must submit today's pre-start for the selected workplace before clocking in.
- Employee can have only one active timesheet at a time.
- Clock-in and clock-out attempt one browser geolocation capture only.
- GPS is not tracked continuously.
- Clock-out requires break minutes and daily notes.
- Hours are stored as decimal hours.
- Workplace radius is checked and flagged for admin review.
- Admin status changes and corrections are written to `audit_logs`.
- Admin corrections are limited in the UI to break minutes and notes.
- Admins can look up a workplace address to fill latitude and longitude.
- Rural Metal Traders branding is loaded from `public/rural-metal-traders-logo.jpg`.

## Updating An Existing Supabase Project

If the main schema was already run, do not run it again. To add the Roma Yard seed record, run:

```sql
insert into public.workplaces (name, address, latitude, longitude, allowed_radius_meters, active)
values ('Roma Yard', '222 Raglan Street, Roma QLD 4455', -26.5733, 148.7869, 200, true);
```

## Vercel Deployment

1. Push this project to a Git repository.
2. Import the repository in Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy.

## Notes for Production Hardening

- Add server actions or API routes for stronger server-side validation.
- Move admin audit logging into database triggers or RPC functions.
- Add password reset and invite flows.
- Add pagination for large timesheet/pre-start lists.
- Add payroll-specific CSV columns once payroll requirements are known.
