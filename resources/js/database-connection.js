//BACKEND FUNCTIONS
let SQL = null;
let db = null;
let docsPath = null;
let dbPath = null;
let dbFile = "library.db";

async function initPath() {
  docsPath = await Neutralino.os.getPath("documents");
  dbPath = docsPath + "/BCULMS/data";
  window.DB_PATH = `${dbPath}/${dbFile}`; // <-- make globally accessible
  console.log("Resolved DB path:", window.DB_PATH);
}

async function initDB() {
  SQL = await initSqlJs({
    locateFile: (file) => "../js/sql-wasm.wasm",
  });

  const fullDbPath = window.DB_PATH.replace(/\\/g, "/");
  console.log("Full DB path:", fullDbPath);

  try {
    let fileData = await Neutralino.filesystem.readBinaryFile(fullDbPath);
    let stats = await Neutralino.filesystem.getStats(fullDbPath);

    db = new SQL.Database(new Uint8Array(fileData));

    console.log("Database Loaded:\n" + JSON.stringify(stats, null, 2));
    console.log("Database file size: " + fileData.byteLength + " bytes");
  } catch (e) {
    console.log("No Database File Found: " + e.message);
    console.log("Creating new database...");

    createDB();

    let stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table'");
    let tables = [];
    while (stmt.step()) {
      tables.push(stmt.getAsObject().name);
    }
    stmt.free();
    console.log("Database Created. Tables: " + tables.join(", "));

    await saveDB("initDB");
  }
}