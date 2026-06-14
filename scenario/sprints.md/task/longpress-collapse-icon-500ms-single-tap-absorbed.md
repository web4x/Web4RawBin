# T-longpress-collapse: icon collapse via 500ms long-press, single-tap absorbed
[task:uuid:b476df5f-1eb8-44ca-9125-42b16e052a0c]

## Traceability

**UseCases:**
- [🔗 objectItem.longPressCollapse](../usecase/objectitem-longpresscollapse.md)


## Task Description

R19.92 impl spec:

1. Add private fields to RbObjectItem:
   private _collapseTimer: number | null = null;
   private _collapseStartXY: [number, number] = [0, 0];

2. In connectedCallback (after _initialized guard):
   this.querySelector('.oi-icon')?.addEventListener('touchstart', this.onIconTouchStart, { passive: true });
   this.querySelector('.oi-icon')?.addEventListener('touchmove', this.onIconTouchCancel, { passive: true });
   this.querySelector('.oi-icon')?.addEventListener('touchend', this.onIconTouchCancel);

3. onIconTouchStart = (e: TouchEvent): void => {
   const t = e.touches[0];
   this._collapseStartXY = [t.clientX, t.clientY];
   this._collapseTimer = window.setTimeout(() => {
     this._collapseTimer = null;
     this.toggleAttribute('collapsed');
     if (navigator.vibrate) navigator.vibrate(50);
   }, 500);
};

4. onIconTouchCancel = (): void => {
   if (this._collapseTimer !== null) {
     clearTimeout(this._collapseTimer);
     this._collapseTimer = null;
   }
};

5. In onClickDelegate, REMOVE the icon-click → collapse branch (lines 110-113). Icon click now does nothing (absorbed). The expander branch (lines 115-119) and navigate fallback (lines 121-122) stay.

6. In disconnectedCallback: this.onIconTouchCancel() to clear any pending timer.

7. dragstart on .oi-icon: add this.onIconTouchCancel() at start of onDragStart to cancel collapse timer if drag begins.

RESULT: single-tap on icon = no action. Long-press 500ms = collapse + haptic. Drag = unaffected (touchmove/dragstart cancel timer). Scroll = unaffected (touchmove cancels timer).

## Subtasks


