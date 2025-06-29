# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on port 8080
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode  
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Project Architecture

This is a React-based PC builder configurator application with the following key architecture:

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom gradients and animations
- **State Management**: React hooks (useState) for local state
- **Data Fetching**: TanStack React Query for async state management
- **Routing**: React Router v6
- **Backend**: Supabase (currently minimal schema)
- **Build Tool**: Vite with SWC for fast compilation

### Key Application Features
- **Budget-based PC building**: Users select budget presets or custom amounts
- **Component selection**: 8 categories (CPU, GPU, Motherboard, RAM, Storage, PSU, Case, Cooling)
- **Real-time budget tracking**: Visual progress bar and budget status warnings
- **Build summary**: Sticky sidebar showing selected components and total price
- **Responsive design**: Mobile-first approach with gradient UI themes

### Project Structure
- `src/pages/Index.tsx` - Main PC builder interface with all functionality
- `src/components/ui/` - shadcn/ui component library
- `src/integrations/supabase/` - Supabase client and type definitions
- `src/hooks/` - Custom React hooks
- `src/lib/utils.ts` - Utility functions (mainly for Tailwind class merging)

### Data Model
Currently uses hardcoded sample data in `Index.tsx` for PC components. The Supabase integration is configured but has an empty schema (no tables defined yet).

### Development Notes
- Uses path aliases (`@/` maps to `src/`)
- ESLint configured with React and TypeScript rules
- Component development enhanced with lovable-tagger in dev mode
- Server runs on `::` (all interfaces) port 8080 for accessibility