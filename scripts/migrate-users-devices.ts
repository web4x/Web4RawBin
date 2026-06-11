/**
// [impl:uuid:766fd217-0059-441d-a012-85dcbc5e8717] User.deviceAssociation
 * User/Device migration: profiles.json → User units, devices.json → Device units.
 *
 * Usage: npx tsx scripts/migrate-users-devices.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, type ScenarioUnit } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const SCENARIO_INDEX = path.join(__dirname, '../scenario/index');
const idx = new ScenarioIndex(SCENARIO_INDEX);

let created = 0, skipped = 0;

// Phase 1: RawBin system user
const SYSTEM_UUID = '00000000-0000-4000-8000-000000000001';
if (!idx.has(SYSTEM_UUID)) {
  const unit: ScenarioUnit = {
    ior: 'ior:class:User',
    model: { uuid: SYSTEM_UUID, name: 'RawBin System', displayName: 'RawBin System', token: SYSTEM_UUID, avatarHash: '', deviceId: '', sshPubKey: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), unitLinks: [] },
    ownerIor: null,
  };
  idx.put(SYSTEM_UUID, unit);
  console.log(`Phase 1: Created system user ${SYSTEM_UUID}`);
  created++;
} else { console.log('Phase 1: System user exists'); skipped++; }

// Phase 2: User units from profiles.json
const profilesPath = path.join(DATA_DIR, 'profiles.json');
if (fs.existsSync(profilesPath)) {
  fs.copyFileSync(profilesPath, profilesPath + '.bak');
  const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));
  for (const [token, profile] of Object.entries(profiles) as [string, any][]) {
    if (idx.has(token)) { skipped++; continue; }
    const unit: ScenarioUnit = {
      ior: 'ior:class:User',
      model: {
        uuid: token,
        name: profile.name || '',
        displayName: profile.name || '',
        token,
        phone: profile.phone || '',
        url: profile.url || '',
        avatar: profile.avatar || '',
        secretCode: profile.secretCode || '',
        profileCommitted: profile.profileCommitted ?? false,
        sshKeysGenerated: profile.sshKeysGenerated ?? false,
        bugReports: profile.bugReports || [],
        createdAt: profile.createdAt || '',
        unitLinks: [],
      },
      ownerIor: null,
    };
    idx.put(token, unit);
    created++;
  }
  console.log(`Phase 2: ${Object.keys(profiles).length} profiles processed`);
} else { console.log('Phase 2: profiles.json not found'); }

// Phase 3: Device units from devices.json
const devicesPath = path.join(DATA_DIR, 'devices.json');
if (fs.existsSync(devicesPath)) {
  fs.copyFileSync(devicesPath, devicesPath + '.bak');
  const devices = JSON.parse(fs.readFileSync(devicesPath, 'utf-8'));
  for (const [deviceId, device] of Object.entries(devices) as [string, any][]) {
    if (idx.has(deviceId)) { skipped++; continue; }
    const unit: ScenarioUnit = {
      ior: 'ior:class:Device',
      model: {
        uuid: deviceId,
        deviceId,
        name: device.name || deviceId.slice(0, 8),
        ownerToken: device.ownerToken || '',
        publicKey: device.publicKey || '',
        signature: device.signature || '',
        challenge: device.challenge || '',
        enrolledAt: device.enrolledAt || '',
        lastAuthAt: device.lastAuthAt || '',
        userAgent: device.userAgent || '',
        unitLinks: [],
      },
      ownerIor: device.ownerToken ? `ior:instance:${device.ownerToken}` : null,
    };
    idx.put(deviceId, unit);
    created++;
  }
  console.log(`Phase 3: ${Object.keys(devices).length} devices processed`);
} else { console.log('Phase 3: devices.json not found'); }

console.log(`\nDone: ${created} created, ${skipped} skipped (already exist)`);
console.log(`Total units in index: ${idx.list().length}`);
