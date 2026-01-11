# Contributing to Catholic History Atlas

First off, **thank you** for considering contributing! I truly believe in open source and the power of community collaboration. Unlike many repositories, I actively welcome contributions of all kinds - from bug fixes to new features.

## My Promise to Contributors

- **I will respond to every PR and issue** - I guarantee feedback on all contributions
- **Bug fixes are obvious accepts** - If it fixes a bug, it's getting merged
- **New features are welcome** - I'm genuinely open to new ideas and enhancements
- **Direct line of communication** - If I'm not responding to a PR or issue, email me directly at johnvondrashek@gmail.com

## How to Contribute

### Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Open a new issue** with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (browser, OS, Node.js version)

### Suggesting Features

I'm open to new features! When suggesting:

1. Explain the problem you're trying to solve
2. Describe your proposed solution
3. Consider if it fits the project's scope (historical Catholic content, educational value)

### Adding Historical Data

One of the best ways to contribute is by adding or improving historical data:

- **Saints and historical figures** - Add JSON files to `src/data/people/century-X/`
- **Councils and events** - Add JSON files to `src/data/events/century-X/`
- **Corrections** - Fix dates, locations, or biographical details

See the [Data Guidelines](#data-guidelines) section below for specifics.

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Install dependencies: `npm install`
4. Make your changes
5. Run validation: `npm run validate` (runs linting, tests, and data checks)
6. Commit with clear messages
7. Push to your fork
8. Open a Pull Request

That's it! I'll review it and provide feedback.

### Your First Contribution

Never contributed to open source before? No problem! Look for issues labeled `good first issue` or `help wanted`. Resources:

- [How to Make a Pull Request](http://makeapullrequest.com/)
- [First Timers Only](https://www.firsttimersonly.com/)

## Development Setup

### Prerequisites

- Node.js 18+ and npm

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/catholic-history-atlas.git
cd catholic-history-atlas

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run linter
npm run lint
```

### Useful Commands

```bash
# Validate everything before submitting PR
npm run validate

# Check for duplicate entries
npm run lint:duplicates

# Verify century placement
npm run lint:centuries

# Check if a saint exists
npm run check:saint "Thomas Aquinas"

# Regenerate index files after adding data
npm run generate:indexes
```

## Data Guidelines

### File Naming

- Use kebab-case for filenames: `thomas-aquinas.json`, `council-of-nicaea.json`
- IDs should match the filename (without `.json`)

### Adding a Person

1. Create a JSON file in the appropriate century folder: `src/data/people/century-X/name.json`
2. Required fields: `id`, `name`, `birthYear`, `deathYear`, `orthodoxyStatus`, `locations`, `summary`
3. Run `npm run generate:indexes` to update the index file

### Orthodoxy Status

Use one of these values for `orthodoxyStatus`:

- `canonized` - Canonized saints (gold frame)
- `blessed` - Blessed/Venerable (silver frame)
- `orthodox` - Orthodox but not saints (gray frame)
- `schismatic` - Schismatics (split frame)
- `heresiarch` - Heresiarchs (dark red frame)
- `secular` - Secular figures (thin gray frame)

Add `"isMartyr": true` for martyrs (adds red stripes).

### Adding an Event

1. Create a JSON file in the appropriate century folder: `src/data/events/century-X/event-name.json`
2. Required fields: `id`, `name`, `startYear`, `type`, `summary`
3. Run `npm run generate:indexes` to update the index file

### Adding a Council (Interactive)

For councils, use the interactive wizard:

```bash
npm run add:council
```

This handles validation and index generation automatically.

## Code Style

- TypeScript for all source code
- Prettier for formatting (`npm run format`)
- ESLint for linting (`npm run lint`)
- Follow existing patterns in the codebase

## Code of Conduct

This project follows the [Rule of St. Benedict](CODE_OF_CONDUCT.md) as its code of conduct. Please read it - it's been guiding communities for over 1,500 years.

## Questions?

- Open an issue
- Email me: johnvondrashek@gmail.com

I appreciate every contribution, big or small. Thank you for being part of this project!
