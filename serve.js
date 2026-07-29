const { spawn } = require('child_process');
const child = spawn('node', ['node_modules/@angular/cli/bin/ng.js', 'serve', '--no-hmr', '--port=3873'], {
  stdio: ['inherit', 'inherit', 'pipe'],
});
child.stderr.on('data', (data) => {
  const str = data.toString();
  const lines = str.split(/\r?\n/).filter(line => !line.includes('cannot be analyzed by Vite'));
  if (lines.length > 0) process.stderr.write(lines.join('\n'));
});
child.on('exit', (code) => process.exit(code ?? 0));
