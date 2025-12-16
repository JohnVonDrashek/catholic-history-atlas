# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive Catholic history atlas built with React, TypeScript, and Vite. Displays saints, councils, and events on a timeline and map view with detailed biographical information. Uses a century-based file organization system where data is stored in JSON files organized by century (century-1 through century-20).

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Data Management Scripts

The project includes numerous Node.js scripts for managing historical data:

```bash
# Data validation and checking
npm run lint:images              # Verify image URLs are accessible
npm run lint:duplicates          # Check for duplicate person entries
npm run lint:centuries           # Verify people are in correct century folders
npm run check:saint <name>       # Check if a saint exists in the database
npm run check:council <name>     # Check if a council exists in the database
npm run check:basilica <name>    # Check if a basilica exists in the database
npm run lint:basilicas           # Check for duplicate basilica entries
npm run lint:newadvent           # Verify New Advent URLs
npm run lint:newadvent:fix       # Remove invalid New Advent URLs
npm run lint:newadvent:add       # Add missing New Advent URLs

# Data modification
npm run add:council              # Interactive script to add a new council
npm run find:images              # Find images for people without them
npm run fix:images               # Fix broken image URLs
npm run fix:images:interactive   # Interactively fix images
npm run fix:pope-images          # Update pope images
npm run fix:wikipedia            # Fix Wikipedia URLs
npm run integrate:mycatholic     # Import data from MyCatholic.Life
npm run find:newadvent           # Find New Advent URLs for entries

# Index generation
npm run generate:indexes         # Regenerate TypeScript index files for all centuries
```

**IMPORTANT**: After adding or removing JSON files in `src/data/people/century-X/` or `src/data/events/century-X/` directories, you MUST run `npm run generate:indexes` to update the corresponding `index.ts` files. The index files import all JSON files and export them as arrays.

## Architecture

### Data Structure

Data is organized in a century-based folder structure:

- **People**: `src/data/people/century-{1-20}/`
- **Events**: `src/data/events/century-{1-20}/`
- **Places**: `src/data/places.json` (single file)
- **Sees**: `src/data/sees.json` (single file)
- **Basilicas**: `src/data/basilicas.json` (single file)

Each century folder contains:

- Individual JSON files (one per person/event)
- An `index.ts` file that imports all JSON files and exports them as an array

The main data aggregation happens in `src/data/index.ts`, which imports all century indexes and combines them into a single dataset.

### Type System

Core types are defined in `src/types/`:

- `person.ts` - Person interface with OrthodoxyStatus type
- `event.ts` - Event interface with EventType union
- `place.ts` - Geographic locations
- `see.ts` - Episcopal sees
- `basilica.ts` - Major churches
- `index.ts` - Aggregated AppData interface

### Orthodoxy Status Frame System

People are visually categorized using colored frames based on their `orthodoxyStatus`:

- `canonized` - Gold frame (canonized saints)
- `blessed` - Silver frame (Blessed/Venerable)
- `orthodox` - Gray frame (Orthodox but not saints)
- `schismatic` - Split frame (Schismatics)
- `heresiarch` - Dark red frame (Heresiarchs)
- `secular` - Thin gray frame (Secular figures)

Martyrs (when `isMartyr: true`) get additional red stripes on their frames.

### Component Structure

- `AtlasView.tsx` - Main view with year selector, timeline/map toggle
- `Timeline.tsx` - Displays people/events for a given year
- `MapView.tsx` - Shows geographic distribution using Leaflet
- `DetailsModal.tsx` - Modal with detailed person/event information
- `FigurePortrait.tsx` - Portrait component with frame styling
- `FrameLegend.tsx` - Legend explaining the frame colors
- `YearSelector.tsx` - Year navigation controls

### Data Loading

The app uses static imports (not dynamic loading) for all data. The `src/data/index.ts` file imports all century indexes and combines them into a single object that is imported by `App.tsx`.

## Adding New Data

### Adding a Person

1. Create JSON file in the appropriate century folder: `src/data/people/century-X/{kebab-case-name}.json`
2. Include required fields: `id`, `name`, `birthYear`, `deathYear`, `orthodoxyStatus`, `locations`, `summary`
3. Run `npm run generate:indexes` to update the index file
4. The TypeScript build will automatically type-check your data

### Adding an Event

1. Create JSON file in the appropriate century folder: `src/data/events/century-X/{kebab-case-name}.json`
2. Include required fields: `id`, `name`, `startYear`, `type`, `summary`
3. Run `npm run generate:indexes` to update the index file

### Adding a Council (Interactive)

Use `npm run add:council` for an interactive wizard that:

- Checks for duplicates
- Validates against existing councils
- Creates the JSON file in the correct century folder
- Automatically runs `npm run generate:indexes`

## Build and Deployment

- Build command: `npm run build` (runs TypeScript compiler then Vite build)
- Output directory: `dist/`
- Base path: Configured in `vite.config.ts` as `/catholic-history-atlas/` for GitHub Pages
  - For custom domain deployments, change to `/`
- GitHub Actions workflow deploys to GitHub Pages on push to `main`

## Key Dependencies

- **React 18** with React Router for navigation
- **Leaflet** with react-leaflet for map visualization
- **date-fns** for date manipulation
- **Vite** as build tool with React plugin
- **TypeScript** for type safety

## Important Notes

- All data files use kebab-case naming (e.g., `thomas-aquinas.json`)
- Person/event IDs should match filename without extension
- The app uses HashRouter for GitHub Pages compatibility
- Images are loaded from Wikipedia/Wikidata URLs (external)
- Century folders use 1-based indexing (century-1 = 1st century AD)
