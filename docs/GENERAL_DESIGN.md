# **Game Design Document: Project "Autumn Ascendant"**

**Genre:** Grand Strategy / 4X

**Setting:** Fantasy "Spring and Autumn" Era

**Version:** MVP 1.0

## ---

**1\. Core Concept & Setting**

**The Vision:** A grand strategy game combining the geopolitical complexity of the Chinese "Spring and Autumn" period with high-fantasy elements and anachronistic technology.

* **The World:** An alternate history China.  
  * **Fantasy Elements:** Taoist magic, *Wuxia*\-level martial arts, and creatures from the *Classic of Mountains and Seas (Shanhaijing)*.  
  * **Historical Mashup:** Famous historical figures from different centuries co-exist in the same timeline.  
  * **Tech Level:** Ranges from Bronze/Iron Age extended into early Gunpowder application.  
* **The Goal:** Lead a country to hegemony through warfare, diplomacy, economic management, and philosophical development.

## ---

**2\. Technical Architecture & Data (Platform Agnostic)**

### **2.1 Engine / UI Split**

The implementation uses a strict separation between the Game Engine and the Render Layer.

* **Game Engine:** Runs in a Web Worker (`src/workers/game.worker.ts`) and owns the Redux store (`GameState`).  
* **UI Layer:** React components on the main thread render state and dispatch **Command** objects.  
* **Controller:** `GameController` is a singleton that sends typed command objects from UI to the worker and listens for `STATE_UPDATE` messages.  
* **Command Dispatch:** Inside the worker, a command handler map routes each `Command.type` to a specific handler, which receives `{ dispatch, getState, handleCommand }` so that commands can trigger additional commands (e.g. events spawning new countries).

### **2.2 The Data Core**

The game relies on an ID-based data structure.

* **GameState:** Holds date/time, list of `settlements`, `countries`, `armies`, current `activeBattle`, and `activeEventId`.  
* **Country:** Owns resources, technology and ideas:
  * Scalar resources: `gold`, `food`, `metal`, `horse`, `engineering_practice`, `military_practice`.  
  * Traditions: `tradition: Record<School, number>` (Hundred Schools).  
  * Warehouse stockpile: `stockpile: Record<ResourceId, number>` for goods such as grain, logs, lumber, furniture, etc.  
* **Settlement:** Owns population, development and a list of `buildings` (building IDs).  
* **Building:** Defined in data, registered via `BuildingRegistry`, can carry both modifiers and stockpile-based IO (inputs/outputs).  

### **2.3 Time System**

The game utilizes a **Pausable Real-Time** loop with a custom calendar system.

* **Calendar Class:**  
  * **Start Date:** Year 1000\.  
  * **Structure:** Fixed 30 days per month, 12 months per year.  
  * **Abstraction:** Logic wrapped in a generic TimeManager class to allow switching to a Gregorian calendar later if needed.  
* **Tick Logic:**  
  * **Daily Tick:** Military movement, battles, event triggers.  
  * **Monthly Tick:** Economic calculation (income, consumption), population growth.

### **2.4 The Modifier System (Core Mechanic)**

A flexible registry system that decouples values from logic. This is the engine of the game's complexity.

* **Structure:**  
  * ModifierRegistry: A global dictionary of defined modifiers.  
  * ModifierInstance: { Name: "good\_weapon", Target: "army\_combat\_ability", Value: 0.05, Operation: "AddPercent" }  
* **Implementation:**  
  * Code does not check hard numbers; it asks: GetValue("army\_combat\_ability").  
  * The system collects all active modifiers (from Tech, Ideas, Buildings, Events) applicable to that ID and calculates the final sum.  
  * **Scope:** Modifiers can be global, country-wide, or settlement-specific.

### **2.5 Interface Abstraction**

To ensure fair AI:

* **Input Layer:** A distinct layer processes commands (e.g., `MOVE_ARMY`, `CONSTRUCT_BUILDING`, `RESOLVE_EVENT`, `SPAWN_COUNTRY`).  
* **Parity:** Both the Human UI and the AI Agent send the exact same command objects to the Game Engine. The UI is merely a visualization of the state the AI also sees. Event effects also emit commands through this same interface rather than mutating state directly.

## ---

**3\. The Game World (The Map)**

### **3.1 Topography**

* **Visuals:** A large, zoomable, pannable 2D world map rendered primarily on an HTML canvas for performance.  
* **Provinces:** Each settlement owns a province polygon; provinces are drawn on the canvas using precomputed vector paths.  
* **Settlements (Nodes):** The map is populated by Settlements (Cities/Towns), drawn as icons and labels on the same canvas.  
* **Connections (Edges):** Settlements are linked by a network graph (Roads/Passes), drawn as SVG paths on a transparent overlay. A "ROADS" toggle in the top-left UI can hide/show them for performance or clarity.  
* **Selection Highlight:** The currently selected province is highlighted by overdrawing its border in a thicker golden stroke while preserving the underlying owner/terrain color.  
  * *MVP Implementation:* Procedurally generate random nodes and connections.  
  * *Future:* Manual placement of historical geography.

## ---

**4\. Economic & Settlement Management**

### **4.1 Resources**

Each Country manages a pool of four global resources:

1. **Gold:** Currency for upkeep and bribes.  
2. **Food:** Required for population growth and army supplies.  
3. **Metal:** Required for equipment and buildings.  
4. **Horse:** Required for cavalry and chariots.

### **4.2 Settlement Attributes**

Settlements are the primary economic engines.

* **Population:** Divided into Urban Population and Rural Population.  
* **Development:** Urban Dev and Rural Dev. Acts as a soft cap for population and a multiplier for efficiency.  
* **Support Rate:** Local stability/loyalty.  
* **Production Logic:**  
  * *Rural:* Produces **Food** and **Horse**. (Horses require specific modifiers/terrain tags).  
  * *Urban:* Produces **Gold** and **Metal**. (Metal requires specific resource nodes).

### **4.3 Buildings**

* **Slots:** Each settlement has limited building slots ($N$).  
* **Function:** Buildings are essentially permanent **Modifier Containers** (e.g., "Market: \+10% Gold Income").

## ---

**5\. Progression Systems**

### **5.1 Technology Tree**

* A Directed Acyclic Graph (DAG) of technologies.  
* **Content:** Mix of ancient tech (Iron Casting) and fantasy tech (Gunpowder Alchemy).  
* **Rewards:** Unlocks Units, Buildings, or applies Global Modifiers.

### **5.2 Hundred Schools of Thought (Idea Trees)**

Similar to *Civ V* Social Policies or *Stellaris* Traditions.

* **Structure:** distinct trees (e.g., Confucianism, Mohism, Legalism, Taoism, Military Strategy).  
* **Asymmetry:** Trees are not identical in size.  
* **Mechanic:** Players spend "Culture/Influence" (TBD) to adopt ideas, unlocking powerful modifiers.

## ---

**6\. The Event System**

The narrative engine driving the game.

### **6.1 Triggers**

1. **Action-Based:** Triggered immediately by a player action (e.g., "Upon declaring war...").  
2. **Pulse-Based (MTTH):** The system checks periodically (daily/monthly).  
   * **Mean Time To Happen (MTTH):** A base probability (e.g., "Once every 10 years").  
   * **Factors:** Conditions that multiply the MTTH (e.g., "If Stability \< 50, reduce MTTH by 0.5" \-\> happens twice as fast).

### **6.2 Structure**

* **Conditions:** `triggerCondition(state)` checks (Date, Resource, Tech requirements).  
* **Options:** Events present 1 to $N$ choices.  
* **Effects:** Each choice executes a script, but instead of mutating `GameState` directly it emits **Commands** via the same `Command` interface used by UI/AI (e.g. resolving an event that dispatches a `SPAWN_COUNTRY` command for a local independence uprising).  
* **AI Logic:** AI weights are assigned to choices (e.g., "Aggressive AI: 90% chance to choose War").

## ---

**7\. Military System**

### **7.1 Strategic Layer**

* **Armies:** Composed of Troops. Stationed at the Capital during peace.  
* **Movement (MVP):**  
  * **Teleport-Delay:** Units do not physically crawl across the map pixels.  
  * *Logic:* Calculate travel time based on distance/road network. Army enters state "Moving." After $T$ days, Army appears at destination.  
* **Siege:**  
  * Upon arrival at hostile settlement, enter "Siege" state.  
  * Siege progress ticks daily based on Defense vs. Siege Ability modifiers.  
* **Interception:**  
  * If a hostile army moves to a location where you have an army (or you move to them), a **Battle** is initiated upon arrival.

### **7.2 Tactical Battle System (Turn-Based Sub-system)**

When an engagement occurs, the game opens a battle instance.

* **Formation:**  
  * **Grid:** 2 Rows (Front/Back) x 3 Columns \= 6 Slots max per army.  
  * **Troop Placement:** Melee/Tanks in Front, Ranged/Support in Back.  
* **Unit Types:**  
  * *Infantry / Heavy Infantry* (High Def, Frontline)  
  * *Archers / Crossbowman* (Ranged, Backline)  
  * *Horseman* (Flanking)  
  * *Chariot* (High Shock, Expensive)  
* **Stats:** HP, Organization (Morale), Attack, Defense.  
* **Loop:**  
  1. Player selects a unit.  
  2. Unit performs action (Attack, Defend, Skill).  
  3. Opponent turn.  
  4. Repeat until one side retreats or acts (HP/Org hits 0).  
* **Resolution:** Winner stays, Loser retreats (teleport delay back to friendly territory), Siege accelerates if Defender loses.

## ---

**8\. Localization System**

* **Architecture:** All text strings are stored in external JSON/YAML files referenced by Keys.  
* **Languages:**  
  * en\_US (English)  
  * zh\_CN (Simplified Chinese)  
* **Format:** {"event\_01\_title": "The Comet Sighted", "event\_01\_desc": "..."}

## ---

**9\. Web-Based MVP Requirements**

*These are specific technical constraints for the browser-based version.*

1. **Frontend Framework:** React or Vue.js for UI overlay (Economy/Tech screens).  
2. **Game View:** HTML5 Canvas API or WebGL (Pixi.js / Phaser) for the Map and Battle rendering to ensure smooth zooming/panning performance.  
3. **State Management:**  
   * The "Game Loop" must run in a Web Worker to prevent UI freezing during calculations.  
   * Use Redux/Pinia or a custom State Store for the "Global Registry."  
4. **Data Persistence:** Save game data to localStorage or IndexedDB (Browser database) as a serialized JSON string.  
5. **Responsiveness:**  
   * Desktop-first design (mouse hover tooltips are vital for Strategy games).  
   * Minimum resolution target: 1280x720.
