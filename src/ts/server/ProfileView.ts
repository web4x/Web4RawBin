// R31.8c round-4 FIX-B: the ONE shared server-side full-profile-data builder. NEUTRAL 3rd module — imports neither
// server.ts nor FeatureManager (server.ts imports FeatureManager, so this avoids a circular dep). BOTH callers use it
// (FeatureManager.grantedUserProfile for the FM drawer + server.ts for the /profile PROFILE-ws feed) → because the
// shared <rb-profile-view> is data-driven, same feed = same render → the drawer's granted-user view === /profile BY
// CONSTRUCTION. Real full data (devices INLINE + token/secretCode/bugReports) — INV-F7: the owner (root-of-trust)
// sees real data; a non-owner is 403'd at the caller and never reaches this builder. NOT the client RbProfileView.

export interface ServerProfileRecord {
  token?: string;
  name?: string;
  avatar?: string;
  secretCode?: string;
  devices?: { userAgent?: string; deviceId?: string; ip?: string; screenSize?: string; platform?: string; name?: string; connectionCount?: number; lastSeen?: number }[];
  bugReports?: { status?: string; date?: number; text?: string }[];
}

// Mirrors the client ProfileViewData (rb-profile-view.ts) — structural (JSON over the wire, no cross-bundle type link).
export interface ProfileViewData {
  name?: string;
  avatar?: string;
  profileUuid?: string;
  token?: string;
  secretCode?: string;
  connectedDeviceIds?: string[];
  devices?: ServerProfileRecord['devices'];
  bugReports?: ServerProfileRecord['bugReports'];
}

export class ProfileView {
  // [impl:uuid:c3e6a2b4-9d1f-4e82-b7a3-5f2c8e1d6a40] ProfileView.profileViewData (Method 86738972, Class e20de5f6) —
  // R31.8c round-4 FIX-B: map a server profile record → the full ProfileViewData the shared <rb-profile-view> renders
  // (devices INLINE, plus token/secretCode/bugReports; NO summary identifiers/deviceCount). ONE builder for /profile AND
  // the FM granted-user drawer → identical render by construction. Real full data (INV-F7 owner root-of-trust). Pure.
  static profileViewData(profile: ServerProfileRecord, opts?: { connectedDeviceIds?: string[]; profileUuid?: string }): ProfileViewData {
    const p = profile || {};
    return {
      name: p.name,
      ...(p.avatar && p.avatar.indexOf('/api/avatar/') === 0 ? { avatar: p.avatar } : {}), // real avatar only
      ...(opts?.profileUuid ? { profileUuid: opts.profileUuid } : {}),
      ...(p.token ? { token: p.token } : {}),
      ...(p.secretCode ? { secretCode: p.secretCode } : {}),
      devices: Array.isArray(p.devices) ? p.devices : [],
      bugReports: Array.isArray(p.bugReports) ? p.bugReports : [],
      ...(opts?.connectedDeviceIds ? { connectedDeviceIds: opts.connectedDeviceIds } : {}),
    };
  }
}
