# Phaser Farming Game Build Plan

## Overview

This plan is for building a 2D farming web game inside `greentruth` using:

- Phaser
- Vite
- JavaScript
- Arcade Physics
- Tiled tilemaps

The goal is to keep development incremental so every phase ends with a playable checkpoint instead of a pile of unfinished systems.

## Technical Direction

### Core stack

- `Phaser` for rendering, scenes, input, and gameplay systems
- `Vite` for fast local development and bundling
- `JavaScript` for fast iteration
- `Arcade Physics` for simple top-down movement and lightweight collisions
- `Tiled` for farm map layout and tile/object metadata

### Why this setup

- Farming games are system-heavy, but not physics-heavy, so Arcade Physics is the right fit.
- Tilemaps are ideal for soil tiles, blocked paths, water sources, props, and interaction markers.
- Vite keeps the project fast and simple while the game grows.
- Vanilla JS is enough for v1 and avoids slowing down early prototyping.

## Recommended Project Structure

```text
greentruth/
  index.html
  package.json
  vite.config.js
  public/
    assets/
      images/
      audio/
      tilemaps/
      ui/
  src/
    main.js
    config/
      gameConfig.js
      balance.js
    scenes/
      BootScene.js
      PreloadScene.js
      MainMenuScene.js
      FarmScene.js
      UIScene.js
    entities/
      Player.js
      CropPlot.js
      Interactable.js
    systems/
      InputSystem.js
      CropSystem.js
      InventorySystem.js
      TimeSystem.js
      SaveSystem.js
    data/
      crops.js
      tools.js
```

## Phase 1 - Foundation

### Goals

- Confirm the `greentruth` Vite project is clean and runnable
- Set up the Phaser boot flow
- Create base config and constants

### Work

- Add `BootScene`, `PreloadScene`, and `MainMenuScene`
- Create `src/config/gameConfig.js`
- Define shared constants such as:
  - tile size
  - base resolution
  - player speed
  - day length
  - tool ids
- Add placeholder assets and a loading screen
- Set up scaling rules for desktop-first web play with responsive support

### Deliverable

- Game launches and reaches a main menu reliably

## Phase 2 - World and Movement

### Goals

- Build the first playable farm map
- Add player movement and camera behavior

### Work

- Create the farm map in Tiled
- Add layers such as:
  - `Background`
  - `Ground`
  - `Collision`
  - `Props`
  - `Interactables`
- Add tile properties such as:
  - `blocked`
  - `soil`
  - `water`
  - `spawn`
- Implement `FarmScene`
- Add 8-direction movement
- Add collision against blocked tiles
- Add camera follow and world bounds
- Add idle and walk animations

### Deliverable

- Player can move around the farm smoothly with proper collisions

## Phase 3 - Interaction Framework

### Goals

- Create a reusable interaction model for tiles and world objects

### Work

- Build `InputSystem` for:
  - movement
  - action
  - tool switching
  - pause
- Add facing-direction-aware interaction targeting
- Add `Interactable` support for:
  - signs
  - planting beds
  - water source
  - shipping bin
- Show contextual prompts near valid targets

### Deliverable

- Player can target nearby objects and trigger correct actions

## Phase 4 - Farming Core Loop

### Goals

- Implement the first complete farming loop

### Work

- Create `CropSystem`
- Create `CropPlot`
- Create crop data definitions in `src/data/crops.js`
- Support these player actions:
  - till soil
  - plant seeds
  - water crops
  - harvest crops
- Track plot states:
  - `untilled`
  - `tilled`
  - `planted`
  - `watered`
  - `grown`
  - `harvested`
- Render crop visuals by growth stage
- Keep growth logic data-driven instead of hardcoded into scene flow

### Deliverable

- Player can till, plant, water, wait, and harvest successfully

## Phase 5 - Inventory and HUD

### Goals

- Make the farming loop readable and manageable in moment-to-moment play

### Work

- Build `InventorySystem`
- Launch `UIScene` in parallel with `FarmScene`
- Show HUD data for:
  - selected tool
  - current day or time
  - energy
  - seed counts
  - harvested items
- Add quick slots or simple cycling for tool switching

### Deliverable

- Player can manage tools and items during play without leaving the scene

## Phase 6 - Time, Energy, and Progression

### Goals

- Add pacing and a sense of in-game progression

### Work

- Build `TimeSystem`
- Add a day cycle using either:
  - morning/day/evening phases, or
  - a continuous clock
- Advance crop growth on day transitions or timed intervals
- Add player energy costs for actions
- Add end-of-day or sleep flow
- Reset daily watering state when a new day begins

### Deliverable

- Gameplay has a meaningful rhythm instead of infinite action spam

## Phase 7 - Economy and Reward Loop

### Goals

- Turn farming actions into a sustainable gameplay loop

### Work

- Add a shipping bin or market interaction
- Define sell values for harvested crops
- Add money or points balance
- Add a simple seed purchase flow
- Tune the loop so the player can:
  - plant
  - grow
  - harvest
  - sell
  - buy more seeds

### Deliverable

- Core economy loop is functional and replayable

## Phase 8 - Persistence

### Goals

- Let players leave and return without losing progress

### Work

- Build `SaveSystem`
- Save to local storage first
- Persist:
  - player position
  - day count
  - inventory
  - currency
  - crop plot states
  - watered state
- Add save versioning so schema changes are easier to handle later

### Deliverable

- Game state restores correctly after refresh or return visit

## Phase 9 - Polish

### Goals

- Make the game feel finished instead of merely functional

### Work

- Add sound effects for tools, watering, planting, and harvesting
- Add particles and visual feedback for interactions
- Improve UI transitions and feedback clarity
- Tune camera lerp, movement feel, and action timing
- Replace placeholder art with final sprite sheets
- Verify sprite frame dimensions carefully before animation setup

### Deliverable

- Game looks and feels cohesive, readable, and satisfying

## Phase 10 - Expansion Hooks

### Goals

- Prepare for future growth without bloating v1

### Work

- Add extra scenes like:
  - house interior
  - shop or market
  - storage shed
- Add NPCs, quests, or dialogue
- Add seasonal crop rules
- Add animals or automation only after the crop loop is solid
- Add map transitions and object-layer triggers

### Deliverable

- Project is ready to grow from a strong core

## Recommended Real-World Build Order

Use this order even though some phases are conceptually related:

1. Foundation
2. World and Movement
3. Interaction Framework
4. Farming Core Loop
5. Inventory and HUD
6. Time, Energy, and Progression
7. Economy and Reward Loop
8. Persistence
9. Polish
10. Expansion Hooks

This sequence gets a visible, testable gameplay loop in place earlier.

## Definition of a Good V1

The first solid version should include:

- one farm map
- one controllable player
- 3 crop types
- 4 tools
- a day cycle
- inventory
- crop selling
- save and load

That is enough to prove the game works without overbuilding the design.

## Suggested Model and Reasoning Use

### Best model choice

- `GPT-5` for planning, architecture, implementation, and debugging

### Reasoning level by phase

- Phases 1 to 3: medium reasoning is usually enough
- Phases 4 to 8: high reasoning is better because systems begin interacting heavily
- Phases 9 to 10: medium for implementation, high for balancing or debugging

### Practical workflow

1. Use high reasoning for architecture and data model decisions
2. Use medium reasoning for file-by-file implementation passes
3. Use high reasoning again for bugs involving save state, crop progression, or scene interactions

## Key Design Rules

- Keep scenes focused and avoid monolithic scene logic
- Keep persistent game state out of globals
- Use tile properties and object layers instead of hardcoding map behavior
- Keep crop behavior data-driven
- Prefer overlap and interaction zones over complex physics tricks
- Build a small, fun loop before adding content breadth

## Immediate Next Step

Start by finishing Phase 1 and make sure the project can boot into a clean menu before touching farming logic.
