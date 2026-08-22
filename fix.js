const fs = require('fs');
const files = [
  'server/controllers/pdf.controller.js',
  'server/controllers/convert.controller.js',
  'server/controllers/ai.controller.js'
];
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/downloadUrl:\s*`\/uploads\/\$\{outName\}`/g, 'downloadUrl: outPath');
  fs.writeFileSync(file, content);
  console.log('Processed ' + file);
}
