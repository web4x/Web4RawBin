// R42.4: ONE place that says where the server reads and writes scenario units. Default = the repo's scenario/
// (prod and dev unchanged). RAWBIN_SCENARIO_ROOT points it elsewhere: the isolated e2e server runs on a COPY in
// its temp dir, so a test run never writes scenario/index or scenario/alt in the repo.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_SCENARIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../scenario');

export function scenarioRoot(env: NodeJS.ProcessEnv = process.env): string {
  return env.RAWBIN_SCENARIO_ROOT ? path.resolve(env.RAWBIN_SCENARIO_ROOT) : REPO_SCENARIO;
}

export const SCENARIO_ROOT = scenarioRoot();
export const SCENARIO_INDEX_DIR = path.join(SCENARIO_ROOT, 'index');
