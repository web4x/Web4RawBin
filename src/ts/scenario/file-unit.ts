// T-file-unit R19.14: files become unique scenario units.
// Storage: scenario/index/<5-deep>/<uuid>.content + <uuid>.scenario.json + unitLinks[].
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

// [impl:uuid:c546c877-9907-4f17-b61a-1157b0902765] FileUnit.upload
// Create file scenario unit + content sidecar; put() auto-syncs unitLinks symlinks.
export function createFileUnit(idx: ScenarioIndex, input: FileUnitInput): ScenarioUnit {
  const uuid = input.uuid || crypto.randomUUID();
  const buf = Buffer.isBuffer(input.content) ? input.content : Buffer.from(String(input.content), 'utf-8');
  const indexFilePath = idx.filePath(uuid);
  const indexDir = path.dirname(indexFilePath);
  fs.mkdirSync(indexDir, { recursive: true });
  const contentFilePath = path.join(indexDir, uuid + '.content');
  fs.writeFileSync(contentFilePath, buf);
  const contentPath = path.relative(idx.scenarioRoot, contentFilePath);

  const unitLinks: string[] = [];
  if (input.roomUuid) {
    unitLinks.push('rooms/' + input.roomUuid + '/files/' + uuid + '.scenario.json');
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
      unitLinks,
    },
    ownerIor: input.roomUuid ? iorInstance(input.roomUuid) : null,
  });
  idx.put(uuid, unit);
  if (input.roomUuid && input.uploaderToken) {
    const dataDir = process.env.DATA_DIR || path.join(path.dirname(idx.scenarioRoot), 'data');
    const roomFilesDir = path.join(dataDir, 'users', input.uploaderToken, 'rooms', input.roomUuid, 'files');
    fs.mkdirSync(roomFilesDir, { recursive: true });
    const roomFsLink = path.join(roomFilesDir, uuid + '.scenario.json');
    const target = path.relative(path.dirname(roomFsLink), idx.filePath(uuid));
    try { fs.symlinkSync(target, roomFsLink); } catch { try { fs.symlinkSync(target, roomFsLink, 'junction'); } catch {} }
  }
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

