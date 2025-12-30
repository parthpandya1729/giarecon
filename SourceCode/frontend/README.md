# GIA Reconciliation Agent - React Frontend

A futuristic, cyberpunk-themed web interface for the GIA (Generative Intelligence Agent) reconciliation system built with React, TypeScript, and Tailwind CSS.

## Features

- **Prominent Chat Interface** - ChatGPT-like conversational UI for natural language interactions
- **Real-Time Dashboard** - KPI cards with animated counters and status indicators
- **Advanced Data Visualizations** - Interactive tables, charts, and Sankey diagrams
- **Comprehensive Log Viewer** - Real-time log streaming with filtering and export
- **Configuration Management** - Visual field mapping and validation rule builder
- **Cyberpunk Design** - Glassmorphism, neon effects, and animated gradients

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- React Router v6
- TanStack Table
- Recharts + D3-Sankey
- Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm or yarn

### Installation

```powershell
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The project uses Vite for fast development with HMR (Hot Module Replacement).

Access the app at: `http://localhost:5173`

## Project Structure

```
src/
├── app/                    # Application core (App.tsx, Router.tsx)
├── features/              # Feature modules
│   ├── chat/             # Chat interface
│   ├── dashboard/        # Dashboard components
│   ├── workspaces/       # Workspace management
│   ├── reconciliation/   # Results display
│   ├── logs/             # Log viewer
│   ├── config/           # Configuration management
│   └── visualizations/   # Charts and tables
├── shared/               # Shared components
│   ├── components/      # Reusable components
│   ├── hooks/           # Custom React hooks
│   └── utils/           # Utility functions
├── mocks/               # Mock data infrastructure
│   ├── api/            # Mock API services
│   ├── data/           # Sample datasets
│   └── generators/     # Data generators
├── types/              # TypeScript type definitions
└── styles/             # Global styles
    ├── globals.css     # Tailwind + base styles
    ├── cyberpunk.css   # Cyberpunk effects
    └── animations.css  # Animation utilities
```

## Cyberpunk Design System

### Color Palette

- **Backgrounds**: Deep space blue (#0a0e27, #1a1f3a, #252d4d)
- **Neon Accents**: Cyan (#00f0ff), Purple (#b026ff), Pink (#ff2d95)
- **Success**: Matrix green (#00ff88)

### Visual Effects

- Glassmorphism cards with backdrop blur
- Neon glow text and borders
- Animated gradients
- Holographic shine animations
- Circuit board patterns
- Glitch effects
- Scan lines

### Utility Classes

```css
.glass                 /* Glassmorphism card */
.text-neon-cyan       /* Neon cyan text with glow */
.bg-gradient-cyber    /* Cyberpunk gradient background */
.cyber-grid-bg        /* Circuit board grid pattern */
.holographic-card     /* Holographic shine effect */
.glitch               /* Glitch text effect */
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Environment Variables

Create a `.env` file for any environment-specific configuration (currently not required for mock data setup).

## Contributing

This project follows a feature-sliced architecture. When adding new features:

1. Create feature folder in `src/features/`
2. Organize by: `components/`, `hooks/`, `store/`, `types/`
3. Use the `@/` path alias for imports
4. Follow cyberpunk design system guidelines

## License

MIT

---

Built with ⚡ by GIA Development Team
