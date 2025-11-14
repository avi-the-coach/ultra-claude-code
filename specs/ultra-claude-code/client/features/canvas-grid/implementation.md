# Canvas Grid - Implementation Stories

This document breaks down the Canvas Grid feature into incremental, testable user stories.

---

## Story 1: Basic Canvas with Static Grid Layout ✅

**Goal**: Set up Canvas component infrastructure with components displayed in grid positions (no interaction yet).

**Status**: COMPLETE

**Tasks**:
- [x] Create `Canvas.jsx` component
- [x] Create `GridComponent.jsx` wrapper
- [x] Create `ComponentRegistry.js` mapping
- [x] Update `config.json` with canvasGrid settings
- [x] Implement grid calculation (columns, rows, cell size)
- [x] Render grid background (SVG/CSS)
- [x] Display Editor and Chat in default grid positions
- [x] Update `App.jsx` to use Canvas instead of direct components

---

## Story 2: Drag Components ✅

**Goal**: Enable dragging components by their headers with snap-to-grid behavior.

**Status**: COMPLETE

**Tasks**:
- [x] Add drag handle to GridComponent header
- [x] Implement `onMouseDown`, `onMouseMove`, `onMouseUp` handlers
- [x] Calculate mouse position → grid coordinates conversion
- [x] Implement snap-to-grid algorithm
- [x] Show ghost outline during drag
- [x] Update component position on drop
- [x] Add cursor feedback (grab/grabbing)
- [x] Increase z-index while dragging

---

## Story 3: Resize Components ✅

**Goal**: Enable resizing components by dragging borders and corners.

**Status**: COMPLETE

**Tasks**:
- [x] Add 8 resize handles to GridComponent (4 corners + 4 edges)
- [x] Style handles (8px hit area, visible on hover)
- [x] Implement resize handlers (onMouseDown, onMouseMove, onMouseUp)
- [x] Calculate new size based on handle type (corner vs edge)
- [x] Snap resize to grid cell boundaries
- [x] Enforce min/max size constraints
- [x] Update component gridPos (w, h) on resize end
- [x] Change cursor based on handle direction
- [x] Fix CSS conflict with old .resize-handle class in App.css

**Acceptance Criteria**:
- ✅ 8 resize handles visible on component hover
- ✅ Can drag corners to resize both width and height
- ✅ Can drag edges to resize one dimension
- ✅ Resize snaps to grid cells
- ✅ Cannot resize below minSize
- ✅ Cannot resize above maxSize (if set)
- ✅ Cursor changes appropriately (nwse-resize, nesw-resize, etc.)
- ✅ Can resize beyond canvas bounds (constrained)

**How to Test**:
1. Hover over Editor → verify 8 handles appear
2. Drag bottom-right corner → verify resizes both dimensions
3. Drag right edge → verify only width changes
4. Try to resize Editor below 4×4 → verify stops at minimum
5. Verify resize snaps to grid cells
6. Test all 8 handles

**Estimated Time**: 2-3 hours

---

## Story 4: Chat Toggle ✅

**Goal**: Make chat toggle work with Canvas system.

**Status**: COMPLETE

**Tasks**:
- [x] Update chat toggle in App.jsx to set `visible` property
- [x] Canvas filters invisible components when rendering
- [x] Preserve gridPos when hiding component
- [x] Restore to saved position when showing

**Acceptance Criteria**:
- ✅ Chat toggle button hides/shows Chat component
- ✅ When hiding: Chat disappears, position saved
- ✅ When showing: Chat restores to saved position
- ✅ Layout preserved when hidden

**How to Test**:
1. Toggle Chat off → verify Chat disappears
2. Toggle Chat on → verify Chat returns to same position
3. Move Chat → toggle off → toggle on → verify returns to new position

**Estimated Time**: 30 minutes

---

## Story 5: Session Persistence

**Goal**: Save layout to localStorage and restore on browser refresh.

**Tasks**:
- [ ] Implement save to localStorage (debounced, 500ms after change)
- [ ] Save component positions and visibility
- [ ] Add schema version to saved data
- [ ] Implement load from localStorage on mount
- [ ] Merge saved layout with defaults (handle new components)
- [ ] Validate saved data (bounds check)
- [ ] Fall back to defaults if validation fails
- [ ] Make persistence configurable via config.json

**Acceptance Criteria**:
- ✅ Layout saves automatically after drag/resize/toggle
- ✅ Layout restores on browser refresh
- ✅ Saved data includes component positions and visibility
- ✅ Invalid saved data falls back to defaults gracefully
- ✅ Persistence can be disabled via config
- ✅ Console logs when loading/saving layout

**How to Test**:
1. Drag Editor and Chat to new positions
2. Refresh browser → verify positions preserved
3. Toggle Chat off, refresh → verify Chat stays hidden
4. Resize components, refresh → verify sizes preserved
5. Manually corrupt localStorage data → verify falls back to defaults
6. Set `enablePersistence: false` in config → verify no saving/loading

**Estimated Time**: 2 hours

---

## Story 6: Configuration & Polish

**Goal**: Implement Settings modal to manage config.json settings and polish the UX.

**Tasks**:

### Settings Modal Redesign
- [ ] Remove obsolete settings from SettingsModal.jsx:
  - [ ] Chat Width (pixels) - obsolete, managed by grid
  - [ ] Default Prompt Height (pixels) - obsolete, managed by grid
  - [ ] Chat Position (Left/Right) - obsolete, components positioned on grid
- [ ] Implement config management system:
  - [ ] Create `useConfig` hook to load config.json
  - [ ] Merge config.json with localStorage overrides on app load
  - [ ] Export merged config for app to use
- [ ] Add Canvas Grid settings to Settings modal:
  - [ ] Grid Columns (number input, 6-24 range)
  - [ ] Grid Rows (number input, 4-16 range)
  - [ ] Cell Min Size (number input, 30-100px range)
  - [ ] Grid Visibility (dropdown: always/dragging/never)
  - [ ] Snap Threshold (number input, 10-50px range)
  - [ ] Enable Persistence (checkbox)
- [ ] Add App settings to Settings modal:
  - [ ] Server URL (text input)
  - [ ] Reconnection Attempts (number input, 1-10 range)
  - [ ] Reconnection Delay (number input, 500-5000ms range)
- [ ] Implement Save Settings:
  - [ ] Save changes to localStorage as config overrides
  - [ ] Show "Settings saved. Reloading page..." message
  - [ ] Auto-reload page after 1 second to apply changes
- [ ] Implement Reset to Defaults:
  - [ ] Add "Reset to Defaults" button
  - [ ] Clear localStorage overrides
  - [ ] Reload page to apply defaults from config.json

### Grid Visibility Modes Implementation
- [ ] Implement 'always' mode: grid always visible
- [ ] Implement 'dragging' mode: grid visible only during drag/resize
- [ ] Implement 'never' mode: grid hidden but snapping still works
- [ ] Add state to track when dragging/resizing is active
- [ ] Toggle grid visibility based on mode and drag/resize state

### Code Cleanup
- [ ] Remove unnecessary console.logs:
  - [ ] Canvas.jsx: "Drag started", "Drag ended"
  - [ ] Canvas.jsx: "Resize started", "Resize ended"
  - [ ] Canvas.jsx: "Mouse left canvas" messages
  - [ ] Canvas.jsx: "Rendering grid" (very noisy)
  - [ ] Chat.jsx: Stream event logs (start, chunk, end, response)
- [ ] Keep useful console.logs:
  - [ ] Socket connection/disconnection
  - [ ] Layout persistence messages
  - [ ] Session registration
- [ ] Final CSS polish
- [ ] Ensure all colors consistent

**Acceptance Criteria**:
- ✅ Settings modal loads current config (config.json + localStorage overrides)
- ✅ All canvas grid settings editable in UI
- ✅ All app settings editable in UI
- ✅ Save Settings → updates localStorage → reloads page
- ✅ Settings persist after page reload
- ✅ Reset to Defaults → clears overrides → restores config.json defaults
- ✅ Grid visibility mode 'always' shows grid permanently
- ✅ Grid visibility mode 'dragging' shows grid only during drag/resize
- ✅ Grid visibility mode 'never' hides grid but snapping works
- ✅ Changing columns/rows/cellMinSize → rebuilds grid after reload
- ✅ Debug console.logs removed (only keep useful ones)
- ✅ No visual glitches or artifacts
- ✅ Settings modal has clear, organized sections

**How to Test**:

### Settings Modal
1. Open Settings → verify shows current config values
2. Change Grid Columns to 16 → Save → verify page reloads → verify grid has 16 columns
3. Change Grid Visibility to 'dragging' → Save → reload → verify grid appears only when dragging
4. Change Grid Visibility to 'never' → Save → reload → verify grid hidden, snapping works
5. Change Server URL → Save → reload → verify socket connects to new URL
6. Click "Reset to Defaults" → verify shows config.json defaults → verify localStorage cleared

### Grid Visibility Modes
1. Set 'always' → verify grid always visible
2. Set 'dragging' → verify grid hidden → start dragging → verify grid appears → release → verify grid hides
3. Set 'never' → verify grid never visible → verify components still snap to grid

### Console Output
1. Open browser console → verify no drag/resize logs
2. Verify no "Rendering grid" spam
3. Verify no stream chunk logs in chat
4. Verify connection messages still appear

### Cross-browser
1. Test on Chrome → verify settings work
2. Test on Firefox → verify settings work
3. Test on Edge → verify settings work

**Estimated Time**: 3-4 hours

---

## Testing Strategy

### Manual Testing Checklist
- [ ] All 6 stories pass acceptance criteria
- [ ] Works on Chrome, Firefox, Safari
- [ ] Works on different screen sizes
- [ ] No console errors or warnings
- [ ] Performance is acceptable (no lag)
- [ ] Visual design matches spec
- [ ] Chat toggle integration works
- [ ] Persistence survives refresh
- [ ] Configuration changes work
- [ ] Components can overlap elegantly
- [ ] Dragged components appear above others

---

## Implementation Order

Implement stories **in order** (1 → 6):

1. ✅ **Story 1** - Basic Canvas (COMPLETE)
2. ✅ **Story 2** - Drag Components (COMPLETE)
3. ✅ **Story 3** - Resize Components (COMPLETE)
4. ✅ **Story 4** - Chat Toggle (COMPLETE)
5. ✅ **Story 5** - Session Persistence (COMPLETE)
6. **Story 6** - Configuration & Polish

Each story should be:
- ✅ Fully implemented
- ✅ Tested (manual + automated if applicable)
- ✅ Committed to git with clear message

**Do not start Story N+1 until Story N is complete and tested.**

---

## Definition of Done (Each Story)

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] Manual testing checklist passed
- [ ] No console errors
- [ ] Code reviewed (self-review at minimum)
- [ ] Git commit with descriptive message
- [ ] Ready for next story

---

## Estimated Timeline

- ✅ **Story 1**: 2-3 hours (COMPLETE)
- ✅ **Story 2**: 2-3 hours (COMPLETE)
- ✅ **Story 3**: 2-3 hours (COMPLETE)
- ✅ **Story 4**: 30 minutes (COMPLETE)
- ✅ **Story 5**: 2 hours (COMPLETE)
- **Story 6**: 2-3 hours

**Total**: ~10-14 hours of focused work

---

## Current Status

**Completed**: Stories 1-5
**Next**: Story 6 - Configuration & Polish
**Progress**: 5/6 stories complete (~83%)
