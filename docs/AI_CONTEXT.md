# Autumn Ascendant - AI Agent Context

## Project Overview
Autumn Ascendant is a Grand Strategy / 4X game set in a fantasy "Spring and Autumn" era. It combines geopolitical play (warfare, diplomacy, economy, philosophy) with a data-driven architecture that strictly separates the Game Engine (logic) from the Render Layer (UI).

## Technical Architecture

### Core Pattern: Web Worker & Commands
- **Game Engine**: Runs entirely inside a Web Worker (`src/workers/game.worker.ts`). It holds the authoritative Redux store.
- **UI Layer**: Runs on the Main Thread (React). It holds a "View Store" that is synced from the Worker.
- **Communication**: 
  - **UI -> Worker**: Sends typed `Command` objects.
  - **Worker -> UI**: Broadcasts full state updates via `STATE_UPDATE` messages.
- **Controller**: `GameController` (Singleton) bridges the UI and Worker.

### Tech Stack
- Language: TypeScript
- Frontend: React + Tailwind CSS
- Map: Canvas-based province renderer in `src/components/VectorMap.tsx` with SVG overlay for roads and interaction
- State: Redux Toolkit (inside Worker)
- Build: Vite

## Data Models (`src/types/`)

### 1. Game State (`GameState`)
- **Date**: `{ year, month, day }` (Year 1000 start).
- **Time**: Fixed 30 days/month, 12 months/year.
- **Tick**: 'Daily' or 'Monthly'.
- **Entities**: `settlements`, `countries`, `armies`.
- **Modes**: `activeBattle` (Mini-game), `activeEventId` (Narrative).

### 2. Settlement (`Settlement`)
- **Location**: `position: { x, y }` (0-1000 coordinate space).
- **Network**: `connections: string[]` (Adjacency list).
- **Economy**: `population` (urban/rural), `development` (urban/rural).
- **Owner**: `ownerId` links to `Country`.

### 3. Country (`Country`)
- Resources:
  - Currency and practice: `gold`, `food`, `metal`, `horse`, `engineering_practice`, `military_practice`
  - Traditions: `tradition: Record<School, number>` for the Hundred Schools
  - Warehouse stockpile: `stockpile: Record<ResourceId, number>` with keys:
    - `grain`, `logs`, `cattle`, `fruit`, `fish`, `wool`, `tea`, `hardwood`, `silk`
    - `gold`, `silver`, `iron`, `copper`, `tin`, `bronze`
    - `ships`, `textiles`, `furniture`, `luxury_furniture`
    - `spirits`, `fruit_wine`
    - `lumber`, `clothes`, `luxury_clothes`, `paper`
- Tech: `researchedTechs: string[]`
- Ideas: `adoptedIdeas: string[]`
- Color: Hex code for map visualization

### 4. Army (`Army`)
- **State**: `IDLE` | `MOVING` | `BATTLE`.
- **Navigation**: `location` (Settlement ID), `destination` (Settlement ID), `arrivalDate`.
- **Troops**: (Currently generated procedurally in battle, moving towards persistent storage).

### 5. Battle (`BattleState`)
- **Type**: Turn-based tactical mini-game.
- **Grid**: 2 rows x 3 cols per side.
- **Units**: `Infantry`, `Archer`, `Cavalry`, `Chariot`.
- **Stats**: HP, Morale, Attack, Defense.
- **Logic**: Simple damage calculation with variance.

## Key Systems (`src/systems/`)

### 1. Modifier System (`ModifierRegistry`)
- **Purpose**: Centralized buff/debuff management.
- **Structure**: `baseValue` -> `Add Flat` -> `Add %` -> `Multiply`.
- **Scopes**: Modifiers are registered to specific scopes (e.g., Country ID).

### 2. Economy (`EconomySystem`)
- Trigger: Monthly tick
- Population-based production:
  - Urban population -> gold, metal
  - Rural population -> food, horse
  - All passed through `ModifierRegistry` using attributes such as `production_gold`, `production_food`, etc.
- Building IO:
  - Per settlement, iterate its `buildings: string[]`
  - For each building, look up definition in `BuildingRegistry`
  - Apply optional `monthlyMaintenance` to `country.resources.gold`
  - If `inputStockpile`/`outputStockpile` are present:
    - Check that all inputs can be paid from `country.resources.stockpile`
    - If yes, subtract inputs and add outputs
  - Example chain (already implemented):
    - Forestry: produces `logs`
    - Lumber Mill: consumes `logs`, produces `lumber`
    - Furniture Workshop: consumes `lumber`, produces `furniture`

### 3. Events (`EventManager`)
- **Trigger**: Daily Tick checks `triggerCondition(state)`.
- **Flow**: Pause Game -> Show Modal -> User Selects Option -> Execute Effect -> Resume.

### 4. Technology (`TechRegistry`)
- **Structure**: Dependency graph (prerequisites).
- **Effect**: Unlocks Modifiers upon completion.
- **Cost**: Deducts resources instantly.

## Interaction API (Commands)
AI Agents should interact **exclusively** via the `Command` interface defined in `src/types/Command.ts`.

```typescript
type CommandType = 
  | "TICK"            // Advance time (usually internal)
  | "MOVE_ARMY"       // { armyId, targetSettlementId }
  | "RESEARCH_TECH"   // { countryId, techId }
  | "SET_PAUSED"      // boolean
  | "RESOLVE_EVENT"   // { eventId, optionIndex }
  | "BATTLE_ACTION"   // { selectedTroopId, targetTroopId }
  | "CLOSE_BATTLE"    // null
```

## Localization
- **System**: `LocManager` singleton.
- **Files**: `src/locales/en.json`, `src/locales/zh.json`.
- **Usage**: `t("key")` in UI components.

## Map Rendering Notes
- Provinces are rendered on an HTML canvas using precomputed `Path2D` shapes for performance.
- Province click detection is done by hit-testing against those same `Path2D` paths on the canvas (no SVG province paths).
- Settlement icons and labels are drawn on the same canvas and do not change every tick.
- Roads and river connections are rendered as SVG paths on a transparent overlay and can be toggled on/off via the "ROADS" button in the top-left UI.
- The currently selected province is highlighted by overdrawing its canvas path with a thicker golden stroke, while preserving the underlying owner/terrain color.

## Current Limitations / TODOs
1. **Troop Persistence**: Army troops are currently generated ad-hoc for battles. Need persistent troop tracking in `Army` struct.
2. **AI Implementation**: No AI agents currently exist. The infrastructure supports them sending commands alongside the player.
3. **Save/Load**: Basic map loading exists (`LOAD_MAP`), but full save state serialization is WIP.
