const { CodeQualityAnalyzer } = require('./dist/utils/codeQualityAnalyzer');
const { generateCodeQualityReport } = require('./dist/utils/qualityReporter');

async function verify() {
  console.log('Running quality analysis...\n');
  
  const analyzer = new CodeQualityAnalyzer('.');
  const metrics = await analyzer.analyze();
  
  console.log(generateCodeQualityReport(metrics));
  
  console.log('\n📝 Documentation Status:');
  console.log('  Has docs folder:', metrics.bestPractices.hasDocs ? '✅ YES' : '❌ NO');
  console.log('  Overall Score:', metrics.overallScore);
  console.log('  Grade:', metrics.grade);
}

verify().catch(console.error);
