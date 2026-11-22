/**
 * R42.3 — the ONLY two identities e2e tests may use (Tron 2026-11-22: "two test users are acceptable,
 * random temp user creation is not").
 *
 * globalSetup signs SystemTester and SystemTester2 up ONCE per isolated data dir through the real
 * welcome + device-enrolment flow (real device keys, no 'e2e-bypass'), and stores each browser's
 * storage state. Every spec then logs in by loading that state: no spec mints its own user.
 */
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Same dir playwright.config.ts gives the isolated server (T100) — server and specs must agree.
export const E2E_DATA_DIR = process.env.E2E_DATA_DIR || path.join(os.tmpdir(), 'rawbin-e2e-data');
const BASE_URL = `https://localhost:${process.env.E2E_LIVE === '1' ? '4444' : '4445'}`;
const ID_FILE = path.join(E2E_DATA_DIR, 'e2e-identities.json');

export interface TestIdentity {
  name: string;
  phone: string;
  token: string;
  code: string;
  storageState: Awaited<ReturnType<BrowserContext['storageState']>>;
}
export const TESTER_1 = { name: 'SystemTester', phone: '+4915100000001' } as const;
export const TESTER_2 = { name: 'SystemTester2', phone: '+4915100000002' } as const;
type Who = 1 | 2;

function knownTokens(): Set<string> {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(E2E_DATA_DIR, 'profiles.json'), 'utf8'));
    const list = Array.isArray(raw) ? raw : Object.values(raw || {});
    return new Set(list.map((p: { token?: string }) => p?.token).filter(Boolean) as string[]);
  } catch { return new Set(); }
}

function readIdentities(): Record<string, TestIdentity> | null {
  try { return JSON.parse(fs.readFileSync(ID_FILE, 'utf8')); } catch { return null; }
}

// Sign up one fixed tester via the real UI (welcome gate + device enrolment).
async function signUp(browser: Browser, who: { name: string; phone: string }): Promise<TestIdentity> {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, baseURL: BASE_URL });
  const page = await ctx.newPage();
  await page.goto('/app');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500); // the app may reload once on first load (service worker activation)
  await page.waitForSelector('#pe-name', { timeout: 15000 });
  const code = await page.locator('#pe-code').inputValue();
  await page.fill('#pe-name', who.name);
  await page.fill('#pe-phone', who.phone);
  await page.click('#pe-save');
  await page.waitForSelector('#pe-name', { state: 'hidden', timeout: 15000 });
  const enroll = page.locator('#de-code');
  if (await enroll.isVisible({ timeout: 3000 }).catch(() => false)) {
    await enroll.fill(code);
    await page.click('#de-submit');
    await page.waitForSelector('#de-code', { state: 'hidden', timeout: 15000 });
  }
  await page.waitForSelector('.lobby', { timeout: 15000 });
  const token = await page.evaluate(() => localStorage.getItem('rawbin-player-id') || '');
  const hasKeys = await page.evaluate(() => {
    const k = localStorage.getItem('rawbin-device-privateKey');
    return !!k && k !== 'e2e-bypass';
  });
  if (!token || !hasKeys) throw new Error(`[identities] sign-up of ${who.name} did not yield a token with real device keys`);
  const storageState = await ctx.storageState();
  await ctx.close();
  return { ...who, token, code, storageState };
}

/** Playwright globalSetup: make sure exactly the two fixed testers exist on the isolated server. */
export default async function globalSetup(): Promise<void> {
  const existing = readIdentities();
  const tokens = knownTokens();
  if (existing?.['1'] && existing?.['2'] && tokens.has(existing['1'].token) && tokens.has(existing['2'].token)) return;
  fs.mkdirSync(E2E_DATA_DIR, { recursive: true });
  const browser = await chromium.launch({
    args: ['--ignore-certificate-errors'],
    ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
  });
  try {
    const ids = { '1': await signUp(browser, TESTER_1), '2': await signUp(browser, TESTER_2) };
    fs.writeFileSync(ID_FILE, JSON.stringify(ids, null, 2));
  } finally {
    await browser.close();
  }
}

export function identity(who: Who = 1): TestIdentity {
  const ids = readIdentities();
  const id = ids?.[String(who)];
  if (!id) throw new Error(`[identities] ${ID_FILE} missing — run through playwright.config.ts (globalSetup)`);
  return id;
}

/** A browser context already logged in as tester 1 or 2 (for tests that need a second person). */
export async function testerContext(browser: Browser, who: Who, opts: Parameters<Browser['newContext']>[0] = {}): Promise<BrowserContext> {
  return browser.newContext({ ignoreHTTPSErrors: true, ...opts, storageState: identity(who).storageState });
}

/** Log the given page's context in as tester 1 or 2 and open the lobby. The identity is put into
 *  localStorage BEFORE the first page load, so the server never sees (or mints) an anonymous visitor. */
export async function loginAs(page: Page, who: Who = 1): Promise<void> {
  const st = identity(who).storageState;
  const origin = st.origins.find((o) => o.origin.includes('localhost')) || st.origins[0];
  const entries = origin ? origin.localStorage : [];
  await page.addInitScript(({ kv, tag }) => {
    if (sessionStorage.getItem('__e2e_identity') === tag) return; // seed once per tab; later app writes stay
    localStorage.clear();
    for (const { name, value } of kv) localStorage.setItem(name, value);
    sessionStorage.setItem('__e2e_identity', tag);
  }, { kv: entries, tag: String(who) });
  await page.goto('/app');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForSelector('.lobby', { timeout: 15000 });
}
