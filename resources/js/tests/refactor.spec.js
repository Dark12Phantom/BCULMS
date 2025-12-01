const fs = require('fs');
const path = require('path');

function read(fp){ return fs.readFileSync(fp,'utf8'); }
function assert(name, cond){ if(!cond){ throw new Error('FAIL: '+name); } else { console.log('PASS:', name); } }

const base = path.resolve(__dirname, '..');

// DatabaseConnection
const dbConn = read(path.join(base, 'database-connection.js'));
assert('DatabaseConnection class exists', /class\s+DatabaseConnection\b/.test(dbConn));
assert('initDB wrapper exists', /async\s+function\s+initDB\s*\(/.test(dbConn));
assert('saveDB wrapper exists', /async\s+function\s+saveDB\s*\(/.test(dbConn));

// DatabaseOperations
const dbOps = read(path.join(base, 'database-operations.js'));
assert('DatabaseOperations class exists', /class\s+DatabaseOperations\b/.test(dbOps));
assert('insertDB wrapper exists', /async\s+function\s+insertDB\s*\(/.test(dbOps));
assert('handleSelect wrapper exists', /async\s+function\s+handleSelect\s*\(/.test(dbOps));

// LibraryOperations
const libOps = read(path.join(base, 'library-operations.js'));
assert('LibraryOperations class exists', /class\s+LibraryOperations\b/.test(libOps));
assert('archiveBook wrapper exists', /async\s+function\s+archiveBook\s*\(/.test(libOps));
assert('insertBook wrapper exists', /async\s+function\s+insertBook\s*\(/.test(libOps));

// Schema and Seeder
const schema = read(path.join(base, 'create-table.js'));
assert('DatabaseSchema class exists', /class\s+DatabaseSchema\b/.test(schema));
assert('createDB wrapper exists', /async\s+function\s+createDB\s*\(/.test(schema));

const seeder = read(path.join(base, 'seed-tables.js'));
assert('DatabaseSeeder class exists', /class\s+DatabaseSeeder\b/.test(seeder));
assert('seedDepartments wrapper exists', /async\s+function\s+seedDepartments\s*\(/.test(seeder));
assert('seedCourses wrapper exists', /async\s+function\s+seedCourses\s*\(/.test(seeder));

// Neutralino files remain untouched (basic heuristic)
const neutralinoJs = read(path.join(base, 'neutralino.js'));
assert('neutralino.js contains Neutralino references', /Neutralino/.test(neutralinoJs));
assert('neutralino.js has no refactor classes', !/class\s+/.test(neutralinoJs));

const neutralinoDts = read(path.join(base, 'neutralino.d.ts'));
assert('neutralino.d.ts present', neutralinoDts.length > 0);
assert('neutralino.d.ts has no refactor classes', !/class\s+/.test(neutralinoDts));

console.log('All checks passed');
