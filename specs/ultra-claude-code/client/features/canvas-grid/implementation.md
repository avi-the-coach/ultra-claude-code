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

## Story 6: Window Resize Handling

**Goal**: Make grid responsive to window resize while maintaining layout.

**Tasks**:
- [ ] Add window resize event listener
- [ ] Recalculate grid cell size on window resize
- [ ] Enforce cellMinSize constraint
- [ ] Components maintain grid position (x, y, w, h in cells)
- [ ] Pixel dimensions scale automatically
- [ ] Handle overflow (scrollbars if needed)
- [ ] Debounce resize events for performance

**Acceptance Criteria**:
- ✅ Grid cell size recalculates on window resize
- ✅ Components maintain grid positions (e.g., 2×3 stays 2×3)
- ✅ Components scale proportionally with window
- ✅ Cell size never goes below minimum (50px by default)
- ✅ Scrollbars appear if content exceeds viewport
- ✅ No jank or performance issues during resize

**How to Test**:
1. Resize browser window → verify grid cells scale
2. Verify components maintain grid positions
3. Make window very small → verify cells hit minimum size
4. Make window very large → verify cells grow proportionally
5. Check performance (no lag during resize)
6. Test with components at various positions

**Estimated Time**: 1-2 hours

---

## Story 7: Configuration & Polish

**Goal**: Add configuration support and polish the UX.

**Tasks**:
- [ ] Load all config from config.json (columns, rows, cellMinSize, etc.)
- [ ] Implement grid visibility modes (always/dragging/never)
- [ ] Add smooth transitions for snap (150ms CSS transition)
- [ ] Add fade in/out animations for grid visibility
- [ ] Style ghost outlines properly (blue with transparency)
- [ ] Add hover effects for resize handles
- [ ] Ensure all colors match design spec
- [ ] Add loading states if needed
- [ ] Final CSS polish
- [ ] Remove debug console.logs

**Acceptance Criteria**:
- ✅ All grid settings loaded from config.json
- ✅ Grid visibility mode 'dragging' shows/hides grid appropriately
- ✅ Grid visibility mode 'never' hides grid but snapping works
- ✅ Grid visibility mode 'always' shows grid permanently
- ✅ Smooth 150ms snap animation
- ✅ Ghost outlines styled correctly (blue, semi-transparent)
- ✅ Resize handles visible on hover
- ✅ All styling matches spec
- ✅ No visual glitches or artifacts
- ✅ No unnecessary console logs

**How to Test**:
1. Change `gridVisibility` to each mode → verify behavior
2. Change `columns`, `rows` → verify grid updates
3. Change `cellMinSize` → verify minimum enforced
4. Verify all animations are smooth
5. Verify all colors match spec
6. Test on different browsers (Chrome, Firefox, Safari)
7. Do visual regression testing against spec

**Estimated Time**: 2-3 hours

---

## Testing Strategy

### Manual Testing Checklist
- [ ] All 7 stories pass acceptance criteria
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

Implement stories **in order** (1 → 7):

1. ✅ **Story 1** - Basic Canvas (COMPLETE)
2. ✅ **Story 2** - Drag Components (COMPLETE)
3. ✅ **Story 3** - Resize Components (COMPLETE)
4. **Story 4** - Chat Toggle
5. **Story 5** - Session Persistence
6. **Story 6** - Window Resize
7. **Story 7** - Configuration & Polish

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
- **Story 3**: 2-3 hours
- **Story 4**: 30 minutes
- **Story 5**: 2 hours
- **Story 6**: 1-2 hours
- **Story 7**: 2-3 hours

**Total**: ~10-14 hours of focused work

---

## Current Status

**Completed**: Stories 1-3
**Next**: Story 4 - Chat Toggle
**Progress**: 3/7 stories complete (~43%)
