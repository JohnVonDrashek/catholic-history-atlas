# Catholic History Atlas

An interactive Catholic history atlas that allows you to explore the Christian world through time, with timeline and map views showing saints, councils, and major events.

## Features

- **Year Navigation**: Navigate through history with left/right controls or click the year to jump to a specific date
- **Timeline View**: See all people and events active in a given year
- **Map View**: Visualize the geographical distribution of saints and events
- **Detail Modals**: Click on any person or event to see detailed information, including:
  - Images from Wikipedia
  - Links to New Advent and Wikipedia
  - Curated summaries and key quotes
- **Visual Categorization**: Frame-based system to distinguish:
  - Gold frame = Canonized saints
  - Gold + red stripes = Martyrs
  - Silver = Blessed/Venerable
  - Gray = Orthodox but not saints
  - Split frame = Schismatics
  - Dark red = Heresiarchs
  - Thin gray = Secular figures

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Deployment

This project is configured for GitHub Pages deployment via GitHub Actions. 

1. Push your code to a GitHub repository
2. In your repository settings, go to Pages and set the source to "GitHub Actions"
3. The workflow will automatically deploy on every push to `main`

### Custom Domain

To use a custom domain:
1. Buy a domain from any registrar
2. In GitHub Pages settings, add your custom domain
3. Configure DNS records as instructed by GitHub
4. Update `vite.config.ts` to set `base: '/'` instead of the repo path

## Project Structure

```
src/
├── components/      # React components
├── data/          # JSON data files
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── styles/        # CSS files
```

## Data Model

The project uses a simple JSON structure for data:
- **People**: Saints, theologians, popes, bishops with orthodoxy status
- **Events**: Councils, schisms, persecutions, reforms
- **Places**: Locations with coordinates

## Future Enhancements

- More comprehensive dataset
- Enhanced timeline visualization
- Multiple map layers
- Search functionality
- Filtering by tradition, role, etc.
- Auto-play through history

## License

MIT
