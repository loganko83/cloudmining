# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Xphere Mining Cloud is a React-based cloud mining simulation platform. It demonstrates a cryptocurrency mining dashboard where users can purchase virtual ASIC mining machines, track mining rewards in real-time, and manage their XP token balance.

**Note:** This is a demo/simulation app using mock data. Web3 wallet connections and blockchain transactions are simulated locally.

## Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run preview  # Preview production build
```

## Architecture

### Tech Stack
- React 19 with TypeScript
- Vite for bundling
- React Router (HashRouter) for navigation
- Tailwind CSS (via CDN in index.html)
- Recharts for data visualization
- Lucide React for icons

### Project Structure (flat, no src directory)
```
/                  # Root contains all source files
├── App.tsx        # Main app with routing configuration
├── index.tsx      # React entry point
├── types.ts       # TypeScript interfaces (User, MiningPlan, Transaction, etc.)
├── constants.ts   # Mock data (MOCK_PLANS, MOCK_TRANSACTIONS, CHART_DATA)
├── context/       # React Context providers
│   ├── AuthContext.tsx    # User authentication state
│   ├── Web3Context.tsx    # Simulated wallet connection
│   ├── MiningContext.tsx  # Mining state, machine ownership, transactions
│   └── ToastContext.tsx   # Toast notifications
├── components/    # Reusable UI components
│   ├── Layout.tsx         # Main layout with sidebar navigation
│   └── Button.tsx         # Button component
└── pages/         # Route components
    ├── Landing.tsx, Login.tsx
    ├── Dashboard.tsx, Market.tsx, Wallet.tsx
    ├── Dex.tsx, Staking.tsx, Calculator.tsx
    ├── About.tsx, FAQ.tsx
```

### Context Provider Hierarchy
```
Router > ToastProvider > AuthProvider > Web3Provider > MiningProvider > Routes
```

### Key Contexts
- **AuthContext**: Mock login/logout, stores user in localStorage under `xphere_user`
- **Web3Context**: Simulated MetaMask-style wallet, stores address in `mock_web3_address`
- **MiningContext**: Real-time mining simulation with 1-second accumulation ticks and 30-second reward distribution cycles

### Path Aliases
The `@/` alias maps to the project root (configured in both tsconfig.json and vite.config.ts).

## Environment Variables

Create `.env.local` with:
```
GEMINI_API_KEY=your_api_key_here
```

The API key is exposed to the client via `process.env.GEMINI_API_KEY` (see vite.config.ts).

## Styling

- Uses Tailwind CSS loaded via CDN (not installed as npm dependency)
- Dark theme with slate color palette (bg-slate-900 base)
- Noto Sans KR font for Korean text support
