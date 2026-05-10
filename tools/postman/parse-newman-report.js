const fs = require('fs');
const path = require('path');

const REPORT_JSON = path.join(__dirname, '..', '..', 'postman', 'order-module-report.json');
const OUT_CSV = path.join(__dirname, '..', '..', 'postman', 'testcase-results.csv');
const CATALOG_CSV = path.join(__dirname, '..', '..', 'postman', 'testcase-catalog.csv');

function esc(s) {
  if (s === undefined || s === null) return '';
  return '"' + String(s).replace(/"/g, '""') + '"';
}

function main() {
  if (!fs.existsSync(REPORT_JSON)) {
    console.error('Report JSON not found:', REPORT_JSON);
    console.error('Run the npm script `npm run postman:order:report` to generate the report first.');
    process.exit(2);
  }

  const raw = fs.readFileSync(REPORT_JSON, 'utf8');
  let report;
  try { report = JSON.parse(raw); } catch (e) { console.error('Invalid JSON report'); process.exit(3); }

  const rows = [];
  // Header matching user's table roughly
  rows.push([
    'Test Case ID','L1','L2','L3','Tên Folder/File','Tên hàm','Mục tiêu của testcase','Input/Request tương ứng','Expected output','Script Test','Test Result','Ghi chú'
  ].map(esc).join(','));

  const seenIds = new Set();
  let total = 0, passed = 0, failed = 0;

  (report.run && report.run.executions || []).forEach(exec => {
    const folder = (exec.item && exec.item.name) || '';
    const requestName = (exec.item && exec.item.request && exec.item.request.url && exec.item.request.url.raw) || '';
    (exec.assertions || []).forEach(assertion => {
      total++;
      const assertionName = assertion.assertion || '';
      const pass = !assertion.error;
      if (pass) passed++; else failed++;

      // Try to extract test case ID from assertion name like [TC_LOGIN_001]
      const idMatch = assertionName.match(/\[([A-Z0-9_\-]+)\]/i);
      const tcid = idMatch ? idMatch[1] : (exec.item && exec.item.name) ? exec.item.name.replace(/\s+/g,'_') : 'UNMAPPED';
      seenIds.add(tcid);

      const scriptTest = assertionName;
      const note = assertion.error ? (assertion.error.message || JSON.stringify(assertion.error)) : '';

      const row = [
        tcid,'','','', folder, '', '', requestName, '', scriptTest, (pass? 'P':'F'), note
      ].map(esc).join(',');
      rows.push(row);
    });
  });

  // Write CSV with UTF-8 BOM to help Excel display Vietnamese correctly
  const csvContent = '\uFEFF' + rows.join('\n');

  function sleepMs(ms) {
    const start = Date.now();
    while (Date.now() - start < ms) {}
  }

  function writeFileSafe(filePath, content) {
    const maxAttempts = 6;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        fs.writeFileSync(filePath, content, 'utf8');
        return;
      } catch (err) {
        if (err && (err.code === 'EBUSY' || err.code === 'EACCES' || err.code === 'EPERM')) {
          if (attempt === maxAttempts) {
            // final attempt: write to temp and rename
            const tmp = filePath + '.tmp';
            try {
              fs.writeFileSync(tmp, content, 'utf8');
              fs.renameSync(tmp, filePath);
              return;
            } catch (e) {
              throw e;
            }
          }
          // wait a bit and retry
          sleepMs(200);
          continue;
        }
        throw err;
      }
    }
  }

  try {
    writeFileSafe(OUT_CSV, csvContent);
    console.log('Wrote testcase CSV:', OUT_CSV);
  } catch (e) {
    console.error('Failed writing CSV:', e.message || e);
    console.error('Tip: close Excel or any program locking the file and retry.');
    process.exit(4);
  }
  console.log(`Assertions: total=${total} passed=${passed} failed=${failed} uniqueTestIDs=${seenIds.size}`);

  // exit with non-zero if any failed (useful for CI)
  // If a testcase catalog exists, compute coverage
  if (fs.existsSync(CATALOG_CSV)) {
    const catRaw = fs.readFileSync(CATALOG_CSV, 'utf8');
    const lines = catRaw.split(/\r?\n/).filter(Boolean);
    const catalogIds = new Set();
    // assume first line header
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      const id = parts[0] && parts[0].replace(/"/g,'').trim();
      if (id) catalogIds.add(id);
    }
    const matched = [...catalogIds].filter(id => seenIds.has(id)).length;
    const coverage = catalogIds.size ? (matched / catalogIds.size) * 100 : 0;
    console.log(`Testcase catalog: total=${catalogIds.size} matched=${matched} coverage=${coverage.toFixed(1)}%`);
    if (coverage < 100) {
      console.warn('Coverage < 100% — some designed testcases are not mapped to assertions.');
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
