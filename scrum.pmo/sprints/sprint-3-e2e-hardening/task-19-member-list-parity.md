[Back to Sprint 3 Planning](./planning.md)

# T19: Room Member List Parity with UpDown

[task:uuid:7051e416-1087-422b-a271-a5575d2475fc]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done


## Traceability
- up
  - [sprint-3-e2e-hardening Planning](./planning.md)
- down
  - None
## Problem

RawBin member list is a plain vertical list with just names and host badges. UpDown had compact horizontal badges with avatars, status indicators, and distinct self-styling. The current UI doesn't look or feel like UpDown.

## Requirements

### 19.1 Avatar display
- Show 24px avatar image per member (rounded)
- Fallback to first letter of name if no avatar
- Source: member's `avatarUrl` from ROOM_JOINED/MEMBER_JOINED messages

### 19.2 Compact badge layout
- Flex-wrap horizontal row of player badges (not vertical list)
- Each badge: `[avatar] [name] [status]`
- Small compact style: ~0.7rem font, 3px vertical padding
- Background tint: light blue for others, green for self
- Self badge: distinct border + "(you)" suffix

### 19.3 Status indicators
- Online: green `●`
- In RawBin context: connected vs disconnected member
- Host: crown or star indicator instead of text "host" badge

### 19.4 Click behavior (already exists)
- Self-click → ProfileEditor (T7, already done)
- Other-click → ProfileSheet/vCard (T11, already done)
- Ensure click targets are large enough on mobile

### 19.5 CSS
Port from QnD `multiplayer.css` lines 167-178:
```css
.mp-players { display: flex; flex-wrap: wrap; gap: 4px; padding: 4px; }
.mp-player { display: flex; align-items: center; gap: 4px; padding: 3px 8px;
  background: rgba(102,126,234,0.1); border-radius: 12px; font-size: 0.7rem; }
.mp-player-self { background: rgba(76,175,80,0.15); border: 1px solid rgba(76,175,80,0.3); }
.mp-player-avatar { width: 24px; height: 24px; border-radius: 50%; }
.mp-clickable { cursor: pointer; text-decoration: underline dotted; }
```

## Source Reference
- QnD: `MultiplayerUI.ts` lines 449-471, `multiplayer.css` lines 167-178


## QA Audit & User Feedback

## Subtasks
None (atomic task).
## Acceptance Criteria
- [x] Members shown as compact horizontal badges with avatars
- [x] Self member has green tint + "(you)"
- [x] Status indicator shows connected/disconnected
- [x] Host indicated with icon (not text badge)
- [x] Clickable names with dotted underline
- [x] Responsive on mobile (flex-wrap)
