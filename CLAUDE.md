# Claude AI Assistant Guide

This document provides information about using Claude AI Assistant with this casino_royale project.

## Project Overview

This is a casino games application built with Next.js and React. The project includes various casino games with interactive UI components and animations.

### Current Games
- **Crash Game**: A multiplier-based game with graph visualization
- **Roulette**: Complete roulette game with custom carousel, spin animation, and betting system
- **Phase 3 Tasks**: Additional betting components and features

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run linting
npm run lint
```

### Git Workflow
```bash
# Check current status
git status

# Stage changes
git add .

# Commit changes (follow existing commit message style)
git commit -m "Your commit message here"

# Push to remote
git push
```

## Project Structure

- `/src` - Main source code
  - `/components` - React components
  - `/pages` - Next.js pages
  - `/styles` - CSS and styling files
  - `/utils` - Utility functions
- `/public` - Static assets
- `/docs` - Documentation

## Coding Standards

1. Follow existing code style and patterns
2. Use meaningful variable and function names
3. Add comments for complex logic
4. Ensure responsive design for all components
5. Test thoroughly before committing

## Common Tasks

### Adding New Games
1. Create game component in `/src/components/games/`
2. Add game route in `/src/pages/`
3. Update navigation if needed
4. Add any game-specific assets to `/public/`

### Fixing Bugs
1. Identify the issue location
2. Create a fix following existing patterns
3. Test the fix
4. Commit with descriptive message

### Running Tests
Always run tests before committing to ensure nothing is broken.

## Getting Help

For questions about this project:
1. Check existing code patterns
2. Review similar implementations
3. Use `/help` for Claude Code specific commands
4. Refer to Next.js and React documentation

## Notes

- This project uses patched versions of Next.js and React
- Focus on maintaining existing animations and UI patterns
- Ensure all games follow consistent design patterns