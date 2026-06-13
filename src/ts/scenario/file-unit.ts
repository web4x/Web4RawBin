// T-file-unit R19.14: files become unique scenario units.
// [impl:uuid:7aea186a-1564-4bc3-902c-31d1532c346c] FileUnit.linkToRoom
// Storage: scenario/index/<5-deep>/<uuid>.content + <uuid>.scenario.json + unitLinks[].
// [impl:uuid:50106c13-c538-47e5-b902-a7cb0feda61a] R19.14 (split for FileUnit.reuseByContentHash)
// [impl:uuid:148740b9-b87c-422f-8b38-53caab1294ac] R19.14 (split for FileUnit.versionByName)
// [impl:uuid:6ec25cdc-d6af-4361-87f7-631840c56779] R19.14 (split for FileUnit.computeContentHash)
// [impl:uuid:6390d695-0ecc-486e-a28e-6e33451a02a1] R19.14 (split for FileUnit.dedupByContentHash)
// [impl:uuid:36a3b677-dc4d-415c-9eee-ffc62fff0f76] R19.14
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { iorClass, iorInstance, type ScenarioUnit } from './types.js';
import { ScenarioIndex } from './index-store.js';
import { FileLoader } from './classes.js';

export interface FileUnitInput {
  name: string;
  content: Buffer | string;
  mimeType?: string;
  uploaderToken?: string;
  roomUuid?: string;
  uuid?: string;
  extraUnitLinks?: string[];
}

// [impl:uuid:c546c877-9907-4f17-b61a-1157b0902765] createFileUnit
// [impl:uuid:5fdcefe4-5404-4e0a-86d4-7979ec1a425c] R19.51 indexByContentHash
export function createFileUnit(idx: ScenarioIndex, input: FileUnitInput): ScenarioUnit {
  const buf = Buffer.isBuffer(input.content) ? input.content : Buffer.from(String(input.content), 'utf-8');
  const contentHash = crypto.createHash('sha256').update(buf).digest('hex');

  // O(1) dedup via content-index symlink (atomic lock to prevent race)
  const contentIndexLink = `content/${contentHash}.file.scenario.json`;
  const contentIndexPath = path.join(idx.scenarioRoot, contentIndexLink);
  const lockPath = contentIndexPath + '.lock';
  if (fs.existsSync(contentIndexPath)) {
    try {
      const resolvedPath = fs.realpathSync(contentIndexPath);
      const existing = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
      if (existing.model?.uuid) {
        console.log(`[file-unit] dedup hit: hash=${contentHash.slice(0, 12)} → uuid=${existing.model.uuid.slice(0, 8)}`);
        return existing;
      }
    } catch (e: any) {
      console.error(`[file-unit] dedup read failed: ${e?.message}`);
    }
  }
  // Atomic lock: writeFileSync with wx flag fails if file exists (race guard)
  try { fs.writeFileSync(lockPath, process.pid.toString(), { flag: 'wx' }); }
  catch {
    // Check if lock holder is still alive (stale lock detection)
    try {
      const lockPid = parseInt(fs.readFileSync(lockPath, 'utf-8'));
      if (lockPid && lockPid !== process.pid) {
        try { process.kill(lockPid, 0); } catch { fs.unlinkSync(lockPath); /* stale — reclaim */ }
      }
    } catch {}
    // Re-check dedup after potential stale reclaim
    try { const rp = fs.realpathSync(contentIndexPath); const ex = JSON.parse(fs.readFileSync(rp, 'utf-8')); if (ex.model?.uuid) return ex; } catch {}
  }

  const uuid = input.uuid || crypto.randomUUID();
  const indexFilePath = idx.filePath(uuid);
  const indexDir = path.dirname(indexFilePath);
  fs.mkdirSync(indexDir, { recursive: true });
  const contentFilePath = path.join(indexDir, uuid + '.content');
  fs.writeFileSync(contentFilePath, buf);
  const contentPath = path.relative(idx.scenarioRoot, contentFilePath);

  // Build unitLinks: content-index + room-FS link (all via syncLinks)
  const unitLinks: string[] = [contentIndexLink];
  if (input.roomUuid && input.uploaderToken) {
    const dataDir = process.env.DATA_DIR || path.join(path.dirname(idx.scenarioRoot), 'data');
    const roomFsLink = path.join('..', 'data', 'users', input.uploaderToken, 'rooms', input.roomUuid, 'files', uuid + '.scenario.json');
    unitLinks.push(roomFsLink);
  }
  if (input.extraUnitLinks) unitLinks.push(...input.extraUnitLinks);

  const unit: ScenarioUnit = FileLoader.create({
    ior: iorClass('File'),
    model: {
      uuid,
      name: input.name,
      contentPath,
      size: buf.byteLength,
      mimeType: input.mimeType || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      uploaderToken: input.uploaderToken || '',
      roomUuid: input.roomUuid || '',
      contentHash,
      unitLinks,
    },
    ownerIor: input.roomUuid ? iorInstance(input.roomUuid) : null,
  });
  idx.put(uuid, unit);  // syncLinks handles all symlink creation
  try { fs.unlinkSync(lockPath); } catch {}
  console.log(`[file-unit] created: uuid=${uuid.slice(0, 8)} hash=${contentHash.slice(0, 12)} links=${unitLinks.length}`);
  return unit;
}

// Read file content sidecar (returns null if missing).
export function readFileUnitContent(idx: ScenarioIndex, uuid: string): Buffer | null {
  const unit = idx.get(uuid);
  if (!unit) return null;
  const contentPath = (unit.model as Record<string, unknown>).contentPath as string;
  if (!contentPath) return null;
  const full = path.join(idx.scenarioRoot, contentPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full);
}
