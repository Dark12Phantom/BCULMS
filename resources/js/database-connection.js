//BACKEND FUNCTIONS
let SQL = null;
let db = null;
let docsPath = null;
let dbPath = null;
let dbFile = "library.db";

/**
 * Class responsible for database path initialization, opening, and saving.
 * Preserves Neutralino interactions and maintains existing global APIs.
 */
class DatabaseConnection {
  constructor() {
    this.SQL = SQL;
    this.db = db;
    this.docsPath = docsPath;
    this.dbPath = dbPath;
    this.dbFile = dbFile;
  }
  /**
   * Initialize document and database paths and expose `window.DB_PATH`.
   */
  async initPath() {
    docsPath = await Neutralino.os.getPath("documents");
    dbPath = docsPath + "/BCULMS/data";
    window.DB_PATH = `${dbPath}/${dbFile}`;
    this.docsPath = docsPath;
    this.dbPath = dbPath;
  }

  /**
   * Initialize sql.js and open or create the database file.
   */
  async initDB() {
    SQL = await initSqlJs({
      locateFile: (file) => "../js/sql-wasm.wasm",
    });
    this.SQL = SQL;

    const fullDbPath = window.DB_PATH.replace(/\\/g, "/");

    try {
      let fileData = await Neutralino.filesystem.readBinaryFile(fullDbPath);

      db = new SQL.Database(new Uint8Array(fileData));
      this.db = db;

      let stats = await Neutralino.filesystem.getStats(fullDbPath);
      console.log("Database Loaded:\n" + JSON.stringify(stats, null, 2));
      console.log("Database file size: " + fileData.byteLength + " bytes");
      console.log("Full DB path:", fullDbPath);
    } catch (e) {
      console.log("No Database File Found: " + e.message);
      console.log("Creating new database...");

      await createDB();
      await seedDepartments();
      await seedCourses();
      await this.saveDB("initDB");

      let stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table'");
      let tables = [];
      while (stmt.step()) {
        tables.push(stmt.getAsObject().name);
      }
      stmt.free();
      console.log("Database Created. Tables: " + tables.join(", "));
    }
  }

  /**
   * Persist the current database to disk using Neutralino filesystem.
   * @param {string} source Descriptive source label for logging.
   */
  async saveDB(source = "") {
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
      () => Neutralino.filesystem.writeBinaryFile({ path: fullDbPath, data: dbData }),
      () => Neutralino.filesystem.writeBinaryFile({
        directory: dbPath.replace(/\\/g, "/"),
        fileName: dbFile,
        data: dbData,
      }),
    ];

    for (let i = 0; i < saveAttempts.length; i++) {
      try {
        console.log(`Trying save method ${i + 1}...`);
        await saveAttempts[i]();
        console.log(`${dbFile} [source: ${source}] saved successfully using method ${i + 1}`);
        return;
      } catch (err) {
        console.error(`Save method ${i + 1} failed:`, err);
      }
    }

    console.error("All save methods failed");
  }
}

const databaseConnection = new DatabaseConnection();

async function initPath() { return databaseConnection.initPath(); }
async function initDB() { return databaseConnection.initDB(); }
async function saveDB(source = "") { return databaseConnection.saveDB(source); }
if (typeof window !== "undefined") {
  window.BCULMS = window.BCULMS || {};
  window.BCULMS.DatabaseConnection = DatabaseConnection;
  window.BCULMS.databaseConnection = databaseConnection;
}
