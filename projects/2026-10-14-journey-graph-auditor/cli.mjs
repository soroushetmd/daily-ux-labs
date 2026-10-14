import { readFile, writeFile } from 'node:fs/promises';
import { analyze, parseJourney, renderReport } from './auditor.mjs';

const [input, output] = process.argv.slice(2);
if (!input || !output) { console.error('usage: node cli.mjs INPUT.json OUTPUT.html'); process.exit(1); }
try {
  const report = analyze(parseJourney(await readFile(input, 'utf8')));
  await writeFile(output, renderReport(report));
  console.log(`Audited ${report.total} states: ${report.reachable} reachable, ${report.findings.length} review signals`);
} catch (error) { console.error(`error: ${error.message}`); process.exit(1); }
