### R19.97: rb-object-item connectedCallback must defer first render (queueMicrotask) to avoid paint-interleave init race.

<details><summary>Tron directive</summary>

> ROOT-CAUSE (case-5, architect-diagnosed) of the OPEN desktop-Chrome 'first-N items render icon-only / not interactive' bug: in headed Chrome, the connectedCallback cascade interleaves with paint, so the first N rb-object-item instances paint before their interactive setup completes. FIX: defer the first render/setup in rb-object-item.connectedCallback via queueMicrotask (or equivalent) so the callback cascade completes before paint — every item initializes fully before it is shown. Complements R19.88 (whenDefined gate) + R19.88.A (diff-render); this addresses the headed-Chrome paint-interleave specifically.

</details>

## Traceability

**Tasks:**
- [🔗 T-object-item-microtask-defer: queueMicrotask in rb-object-item connectedCallback (case-5 paint-interleave fix)](../task/object-item-connectedcallback-queuemicrotask-defer.md)
