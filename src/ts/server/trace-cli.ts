/**
 * T102 CLI — traceability matrix check/fix.
 *   tsx src/ts/server/trace-cli.ts check   # report-only, exits 1 on error-level drift (CI)
 *   tsx src/ts/server/trace-cli.ts fix     # regenerate the generated region in the matrix
 *
 * [impl:uuid:102b1c2d-3e4f-4051-9728-b02020202102] AC5 check (non-zero) / AC3 fix
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanRepo, validate, formatReport, fixMatrix } from './TraceConsistency.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPRINTS_DIR = path.join(__dirname, '../../../scrum.pmo/sprints');
const SRC_DIR = path.join(__dirname, '../../../src');
const TEST_DIR = path.join(__dirname, '../../../test');
const MATRIX_PATH = path.join(__dirname, '../../../scrum.pmo/traceability-matrix.md');

const mode = (process.argv[2] || 'check').toLowerCase();
const { graph, coverage } = scanRepo(SPRINTS_DIR, SRC_DIR, TEST_DIR);
const issues = validate(graph, coverage);

console.log(formatReport(issues));
console.log(`Scanned ${coverage.length} task(s), ${graph.size} graph object(s).`);

if (mode === 'fix') {
  const { changed } = fixMatrix(MATRIX_PATH, coverage);
  console.log(changed ? 'Matrix generated region UPDATED.' : 'Matrix already consistent — no change.');
  process.exit(0);
}

// check (report-only): non-zero exit if any error-level issue (warnings do not fail CI)
const errors = issues.filter(i => i.level === 'error').length;
process.exit(errors > 0 ? 1 : 0);
