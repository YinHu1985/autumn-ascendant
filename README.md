# Autumn Ascendant

A Grand Strategy Game set in a fantasy "Spring and Autumn" era, inspired by Paradox Interactive titles. Built with TypeScript, React, and a custom HTML5 Canvas engine.

## 🌟 Features

- **Grand Strategy Map**: A procedural (or static) world map with settlements, connections, and political boundaries.
- **Deep Economy**: Manage Urban and Rural populations to produce Gold, Food, Metal, and Horses.
- **Technology Tree**: Research new technologies like "Iron Working" and "Standing Army" to unlock powerful modifiers.
- **Tactical Battles**: Turn-based mini-game for resolving conflicts. Command Infantry, Archers, Cavalry, and Chariots.
- **Narrative Events**: Dynamic events that pause the game and require decisions (e.g., "A New Era").
- **Localization**: Full English and Chinese (中文) support with instant switching.
- **High Performance**: Game logic runs in a separate Web Worker to ensure a smooth UI even during complex calculations.

## 🛠 Tech Stack

- **Language**: TypeScript
- **Frontend**: React 18 + Tailwind CSS
- **Game Engine**: Redux Toolkit (Running in Web Worker)
- **Renderer**: HTML5 Canvas (Custom implementation with Pan/Zoom)
- **Build Tool**: Vite
- **Testing**: Vitest

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/autumn-ascendant.git

# Enter directory
cd autumn-ascendant

# Install dependencies
npm install
```

### Running the Game

```bash
# Start development server
npm run dev
```
Open http://localhost:5173 to play.

### Building for Production

```bash
npm run build
```

### Running Tests

```bash
npm test
```

## 🎮 Controls

- **Map Navigation**: 
  - Drag to Pan.
  - Scroll to Zoom.
- **Top Bar**: 
  - Play/Pause Time.
  - Switch Language.
- **Interaction**:
  - Click Armies to select (WIP).
  - Battles open automatically when armies meet enemies.

## 🏗 Architecture

The project follows a strict **Logic/UI Separation**:

1.  **Main Thread (UI)**: React components render the current state. It sends **Commands** (e.g., `MOVE_ARMY`) to the Worker.
2.  **Web Worker (Engine)**: Holds the authoritative `GameState`. Processes ticks, economy, and AI logic. Broadcasts state updates back to the UI.

For more technical details, see [docs/AI_CONTEXT.md](docs/AI_CONTEXT.md).

## 📄 License

MIT
