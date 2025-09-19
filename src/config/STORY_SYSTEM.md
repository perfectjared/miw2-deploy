# Story System Documentation

## Overview

The game now includes a comprehensive story system using NovelJS that provides interactive Choose Your Own Adventure (CYOA) experiences during driving sequences. Each driving sequence triggers one story event from a randomly selected storyline.

## Storylines

The system includes 7 different storylines, each with 4 events:

1. **fauxchella** - A music festival adventure
2. **marge** - A suburban adventure  
3. **carpool** - A commuting adventure
4. **trapt** - A mysterious adventure
5. **grink** - A quirky adventure
6. **agent** - A professional adventure
7. **label** - A creative adventure

## Story Structure

Each storyline follows this pattern:
- **Event 1**: Initial situation with two choices
- **Event 2**: Consequences of first choice with two new choices
- **Event 3**: Further development with two new choices  
- **Event 4**: Final decision with two choices leading to outcomes

Each choice leads to either outcome "a" or "b", with different endings based on the player's choices throughout the story.

## Technical Implementation

### Files Created/Modified

1. **`src/config/StoryConfig.json`** - Contains all storyline data, events, choices, and outcomes
2. **`src/systems/StoryManager.ts`** - Handles story progression, NovelJS integration, and choice tracking
3. **`src/utils/MenuManager.ts`** - Updated to display NovelJS stories with proper choice handling
4. **`src/scenes/MenuScene.ts`** - Added event listener for NovelJS story display
5. **`src/scenes/GameScene.ts`** - Integrated StoryManager and added story completion handling
6. **`src/systems/CarMechanics.ts`** - Updated to trigger new story system instead of old simple story

### How It Works

1. **Story Triggering**: During driving sequences, CarMechanics randomly selects a storyline and triggers the first event
2. **Story Display**: MenuManager displays the story with title format "storyline-event" (e.g., "fauxchella-1")
3. **Choice Handling**: Player makes choices which are tracked by StoryManager
4. **Progression**: StoryManager automatically progresses through events 1-4 based on choices
5. **Completion**: After event 4, the story completes with an outcome based on final choice
6. **Resume**: Game resumes driving after story completion

### Story Title Format

Stories display with titles like:
- `fauxchella-1` (Fauxchella storyline, event 1)
- `marge-2` (Marge storyline, event 2)
- `carpool-3` (Carpool storyline, event 3)
- `agent-4` (Agent storyline, event 4)

## Usage

The story system is automatically integrated into the existing game flow. Stories will trigger during driving sequences just like the previous CYOA system, but now with:

- Rich, multi-event storylines
- Consistent choice tracking
- Meaningful outcomes based on player decisions
- Professional presentation using NovelJS

## Customization

To add new storylines or modify existing ones:

1. Edit `src/config/StoryConfig.json`
2. Follow the existing structure with 4 events per storyline
3. Each event needs: title, text, and 2 choices with outcomes
4. Each storyline needs outcomes for "a" and "b" paths

The system will automatically pick up new storylines without code changes.
