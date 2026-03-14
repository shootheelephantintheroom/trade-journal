# TradeBook

A trading journal built for momentum and small cap day traders. Log trades, track missed opportunities, and analyze your performance — all in one place.

## Features

- **Trade Logging** — Record entries, exits, position size, stop loss, setup, tags, and notes
- **Missed Trades** — Track the ones that got away so you can spot hesitation patterns
- **Dashboard** — P&L summary, win rate, streak tracking, and performance at a glance
- **CSV Export** — Download your full trade history as a `.csv` file
- **Auth** — Email/password login via Supabase

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Supabase (auth + database)

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/shootheelephantintheroom/tradebook.git
   cd tradebook
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Run the SQL migration files against your Supabase database (in order):
   - `supabase-schema.sql`
   - `supabase-auth-migration.sql`
   - `supabase-missed-trades-migration.sql`

5. Start the dev server:
   ```bash
   npm run dev
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## License

MIT — see [LICENSE](LICENSE) for details.
