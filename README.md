<<<<<<< HEAD
# Tetris Game

A modern, beautifully designed Tetris game built with React and Vite.

## Features

- Classic Tetris gameplay
- Hold piece functionality
- Next piece preview
- Score tracking and leveling system
- Smooth animations and neon design
- Pause functionality
- Keyboard controls

## Prerequisites

Before running this project, make sure you have:
- Node.js (version 14 or higher)
- npm (comes with Node.js)

## Installation

1. Navigate to the project directory:
```bash
cd "c:\BIXI 2.0\TETRIES"
```

2. Install dependencies:
```bash
npm install
```

## Running Locally

### Development Mode
To run the game in development mode with hot-reload:
```bash
npm run dev
```

The game will automatically open in your browser at `http://localhost:3000`

### Network Access
To access the game from other devices on your network:
```bash
npm run host
```

This will show you the network URL (e.g., `http://192.168.x.x:3000`)

## Building for Production

To create a production build:
```bash
npm run build
```

The optimized files will be in the `dist` folder.

To preview the production build locally:
```bash
npm run preview
```

## Deployment

### Deploy to Vercel
1. Install Vercel CLI: `npm install -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Deploy to Netlify
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Run: `netlify deploy`
3. For production: `netlify deploy --prod`

### Deploy to GitHub Pages
1. Install: `npm install --save-dev gh-pages`
2. Add to package.json scripts:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
3. Add to vite.config.js:
   ```javascript
   base: '/your-repo-name/'
   ```
4. Run: `npm run deploy`

## Game Controls

- **Arrow Left/Right**: Move piece horizontally
- **Arrow Up / W**: Rotate piece
- **Arrow Down**: Soft drop (faster fall)
- **Space**: Hard drop (instant fall)
- **C**: Hold piece
- **P**: Pause/Resume game

## Project Structure

```
TETRIES/
├── index.html          # HTML entry point
├── index.jsx           # React entry point
├── tetris.jsx          # Main game component
├── vite.config.js      # Vite configuration
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

## Technologies Used

- React 18
- Vite (Fast build tool)
- Modern JavaScript (ES6+)

## Troubleshooting

### Port already in use
If port 3000 is already in use, you can specify a different port:
```bash
npm run dev -- --port 3001
```

### Dependencies not installing
Try clearing npm cache:
```bash
npm cache clean --force
npm install
```

## License

This project is open source and available for personal and educational use.
=======
# TETRIES
>>>>>>> 8ada516d753c095e1ef3212278fd73f30ba68351
