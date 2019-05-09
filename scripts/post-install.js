/**
 * @file post-install
 * @author imcuttle <moyuyc95@gmail.com>
 * @date 2019/5/9
 *
 */

const glob = require('glob')
const nps = require('path')
const cp = require('child_process')

const CWD = nps.join(__dirname, '../__tests__')
const files = glob.sync('**/package.json', {
  ignore: ['**/node_modules/**'],
  cwd: CWD
})

console.log('Files', files)
files.forEach(filename => {
  const dir = nps.dirname(nps.join(CWD, filename))
  console.log('Installing in %s', dir)
  cp.execSync('npm install', { cwd: dir, stdio: 'inherit' })
})
