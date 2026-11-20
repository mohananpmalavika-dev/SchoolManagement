const fs = require('node:fs');
function check(results) {
  for (const key of ['numPassedTests','numPassedTestSuites','numFailedTests','numFailedTestSuites','numPendingTests','numPendingTestSuites'])
    if (!Number.isInteger(results[key]) || results[key] < 0) throw new Error('Invalid Jest report: ' + key);
  const failures = ['numFailedTests','numFailedTestSuites','numPendingTests','numPendingTestSuites','numTodoTests']
    .filter(key => Number(results[key] || 0) !== 0);
  if (results.success !== true || results.numPassedTests < 1 || results.numPassedTestSuites < 1 ||
      (results.numTodoTests !== undefined && (!Number.isInteger(results.numTodoTests) || results.numTodoTests < 0)) || failures.length)
    throw new Error('CI acceptance failed: missing, failed, skipped or TODO tests: ' + failures.join(', '));
  return {passedTests:results.numPassedTests,passedSuites:results.numPassedTestSuites,skippedTests:0};
}
module.exports = {check};
if (require.main === module) {
  try { console.log(JSON.stringify(check(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))))); }
  catch (error) { console.error(error.message);process.exitCode=1; }
}
