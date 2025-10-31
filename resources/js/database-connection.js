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

// Initialize the database
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
    
    seedDepartments();
    seedCourses();
    await saveDB("initDB");
  }
}

async function saveDB(source = "") {
  const fullDbPath = `${dbPath}/${dbFile}`.replace(/\\/g, "/");

  try {
    await Neutralino.filesystem.getStats(dbPath.replace(/\\/g, "/"));
  } catch (e) {
    console.log("Directory does not exist, creating:", dbPath);
    try {
      await Neutralino.filesystem.createDirectory(dbPath.replace(/\\/g, "/"));
    } catch (createErr) {
      console.error("Failed to create directory:", createErr);
      return;
    }
  }

  const dbData = db.export();
  console.log(`Attempting to save DB [${source}]:`, fullDbPath);
  console.log("Data size:", dbData.byteLength, "bytes");

  const saveAttempts = [
    () => Neutralino.filesystem.writeBinaryFile(fullDbPath, dbData),

    () =>
      Neutralino.filesystem.writeBinaryFile({ path: fullDbPath, data: dbData }),

    () =>
      Neutralino.filesystem.writeBinaryFile({
        directory: dbPath.replace(/\\/g, "/"),
        fileName: dbFile,
        data: dbData,
      }),
  ];

  for (let i = 0; i < saveAttempts.length; i++) {
    try {
      console.log(`Trying save method ${i + 1}...`);
      await saveAttempts[i]();
      console.log(
        `${dbFile} [source: ${source}] saved successfully using method ${i + 1}`
      );
      return;
    } catch (err) {
      console.error(`Save method ${i + 1} failed:`, err);
    }
  }

  console.error("All save methods failed");
}