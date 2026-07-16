// Vendored diff3 — faithful TypeScript port of node-diff3 (MIT, Bryan Housel; github.com/bhousel/node-diff3),
// the LCS + diff3MergeRegions + diff3Merge core only. Pure & DOM-free. R30.9 base-aware 3-way merge (Tron: IntelliJ
// fidelity). VENDORED (not an npm dep) so it bundles via esbuild with NO prod node_modules step / no worker.
// diff3Merge(a,o,b): 3-way merge of a=local, b=remote against o=base → chunks {ok:[…]} | {conflict:{a,o,b,…}}.
// Algorithm: Hunt & McIlroy 1976 LCS + Khanna/Kunal/Pierce diff3 (validated vs VS Code mergeEditor per design note).

interface Candidate { buffer1index: number; buffer2index: number; chain: Candidate | null }

function LCS(buffer1: string[], buffer2: string[]): Candidate {
  const equivalenceClasses: Record<string, number[]> = Object.create(null);
  for (let j = 0; j < buffer2.length; j++) {
    const item = buffer2[j];
    if (equivalenceClasses[item]) equivalenceClasses[item].push(j);
    else equivalenceClasses[item] = [j];
  }
  const NULLRESULT: Candidate = { buffer1index: -1, buffer2index: -1, chain: null };
  const candidates: Candidate[] = [NULLRESULT];
  for (let i = 0; i < buffer1.length; i++) {
    const buffer2indices = equivalenceClasses[buffer1[i]] || [];
    let r = 0;
    let c = candidates[0];
    for (const j of buffer2indices) {
      let s: number;
      for (s = r; s < candidates.length; s++) {
        if ((candidates[s].buffer2index < j) && ((s === candidates.length - 1) || (candidates[s + 1].buffer2index > j))) break;
      }
      if (s < candidates.length) {
        const newCandidate: Candidate = { buffer1index: i, buffer2index: j, chain: candidates[s] };
        if (r === candidates.length) candidates.push(c); else candidates[r] = c;
        r = s + 1; c = newCandidate;
        if (r === candidates.length) break;
      }
    }
    candidates[r] = c;
  }
  return candidates[candidates.length - 1];
}

interface DiffIndex { buffer1: [number, number]; buffer2: [number, number] }

// Offsets + LENGTHS of mismatched chunks (buffer[0]=start, buffer[1]=length).
// Exported for R30.12 2-way take-over (LCS local-vs-remote hunks; same faithful LCS as diff3Merge).
export function diffIndices(buffer1: string[], buffer2: string[]): DiffIndex[] {
  const lcs = LCS(buffer1, buffer2);
  const result: DiffIndex[] = [];
  let tail1 = buffer1.length;
  let tail2 = buffer2.length;
  for (let candidate: Candidate | null = lcs; candidate !== null; candidate = candidate.chain) {
    const mismatchLength1 = tail1 - candidate.buffer1index - 1;
    const mismatchLength2 = tail2 - candidate.buffer2index - 1;
    tail1 = candidate.buffer1index;
    tail2 = candidate.buffer2index;
    if (mismatchLength1 || mismatchLength2) {
      result.push({ buffer1: [tail1 + 1, mismatchLength1], buffer2: [tail2 + 1, mismatchLength2] });
    }
  }
  result.reverse();
  return result;
}

interface Hunk { ab: 'a' | 'b'; oStart: number; oLength: number; abStart: number; abLength: number }
// R30.23: exported so RbDiffEditor.computeMergedCenter can read the per-region `buffer` origin tag
// ('o'=stable/base, 'a'=local-only change, 'b'=repo-only change) and surface diff3-auto-applied one-sided
// changes as visible change-blocks. diff3Merge() collapses these into flat {ok:[…]}, losing origin.
export type StableRegion = { stable: true; buffer: 'o' | 'a' | 'b'; bufferStart: number; bufferLength: number; bufferContent: string[] };
export type ConflictRegion = { stable: false; aStart: number; aLength: number; aContent: string[]; oStart: number; oLength: number; oContent: string[]; bStart: number; bLength: number; bContent: string[] };
export type Region = StableRegion | ConflictRegion;

export function diff3MergeRegions(a: string[], o: string[], b: string[]): Region[] {
  const hunks: Hunk[] = [];
  const addHunk = (h: DiffIndex, ab: 'a' | 'b') => {
    hunks.push({ ab, oStart: h.buffer1[0], oLength: h.buffer1[1], abStart: h.buffer2[0], abLength: h.buffer2[1] });
  };
  diffIndices(o, a).forEach(item => addHunk(item, 'a'));
  diffIndices(o, b).forEach(item => addHunk(item, 'b'));
  hunks.sort((x, y) => x.oStart - y.oStart);

  const results: Region[] = [];
  let currOffset = 0;
  const advanceTo = (endOffset: number) => {
    if (endOffset > currOffset) {
      results.push({ stable: true, buffer: 'o', bufferStart: currOffset, bufferLength: endOffset - currOffset, bufferContent: o.slice(currOffset, endOffset) });
      currOffset = endOffset;
    }
  };

  while (hunks.length) {
    let hunk = hunks.shift()!;
    const regionStart = hunk.oStart;
    let regionEnd = hunk.oStart + hunk.oLength;
    const regionHunks: Hunk[] = [hunk];
    advanceTo(regionStart);
    while (hunks.length) {
      const nextHunk = hunks[0];
      if (nextHunk.oStart > regionEnd) break; // no overlap
      regionEnd = Math.max(regionEnd, nextHunk.oStart + nextHunk.oLength);
      regionHunks.push(hunks.shift()!);
    }

    if (regionHunks.length === 1) {
      // Single hunk → one side inserts into an o-region the other left unchanged: NO conflict.
      if (hunk.abLength > 0) {
        const buffer = hunk.ab === 'a' ? a : b;
        results.push({ stable: true, buffer: hunk.ab, bufferStart: hunk.abStart, bufferLength: hunk.abLength, bufferContent: buffer.slice(hunk.abStart, hunk.abStart + hunk.abLength) });
      }
    } else {
      const bounds: Record<'a' | 'b', [number, number, number, number]> = { a: [a.length, -1, o.length, -1], b: [b.length, -1, o.length, -1] };
      while (regionHunks.length) {
        hunk = regionHunks.shift()!;
        const oStart = hunk.oStart, oEnd = oStart + hunk.oLength, abStart = hunk.abStart, abEnd = abStart + hunk.abLength;
        const bd = bounds[hunk.ab];
        bd[0] = Math.min(abStart, bd[0]); bd[1] = Math.max(abEnd, bd[1]);
        bd[2] = Math.min(oStart, bd[2]); bd[3] = Math.max(oEnd, bd[3]);
      }
      const aStart = bounds.a[0] + (regionStart - bounds.a[2]);
      const aEnd = bounds.a[1] + (regionEnd - bounds.a[3]);
      const bStart = bounds.b[0] + (regionStart - bounds.b[2]);
      const bEnd = bounds.b[1] + (regionEnd - bounds.b[3]);
      results.push({
        stable: false,
        aStart, aLength: aEnd - aStart, aContent: a.slice(aStart, aEnd),
        oStart: regionStart, oLength: regionEnd - regionStart, oContent: o.slice(regionStart, regionEnd),
        bStart, bLength: bEnd - bStart, bContent: b.slice(bStart, bEnd),
      });
    }
    currOffset = regionEnd;
  }
  advanceTo(o.length);
  return results;
}

export type Diff3Region =
  | { ok: string[] }
  | { conflict: { a: string[]; aIndex: number; o: string[]; oIndex: number; b: string[]; bIndex: number } };

const isFalseConflict = (a: string[], b: string[]): boolean => a.length === b.length && a.every((x, i) => x === b[i]);

// excludeFalseConflicts = true (both sides changed identically → not a conflict), matching node-diff3 default.
export function diff3Merge(a: string[], o: string[], b: string[]): Diff3Region[] {
  const results: Diff3Region[] = [];
  const regions = diff3MergeRegions(a, o, b);
  let okBuffer: string[] = [];
  const flushOk = () => { if (okBuffer.length) results.push({ ok: okBuffer }); okBuffer = []; };
  for (const region of regions) {
    if (region.stable) {
      okBuffer.push(...region.bufferContent);
    } else if (isFalseConflict(region.aContent, region.bContent)) {
      okBuffer.push(...region.aContent);
    } else {
      flushOk();
      results.push({ conflict: { a: region.aContent, aIndex: region.aStart, o: region.oContent, oIndex: region.oStart, b: region.bContent, bIndex: region.bStart } });
    }
  }
  flushOk();
  return results;
}

export const hasConflict = (regions: Diff3Region[]): boolean => regions.some(r => 'conflict' in r);
