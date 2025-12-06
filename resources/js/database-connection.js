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
  async getTableCount(table) {
    try {
      const stmt = db.prepare(`SELECT COUNT(*) AS c FROM ${table}`);
      let count = 0;
      if (stmt.step()) {
        const row = stmt.getAsObject();
        count = row.c || 0;
      }
      stmt.free();
      return count;
    } catch (_) {
      return 0;
    }
  }
  async seedBase() {
    // Departments
    db.run(`INSERT OR IGNORE INTO "department" ("department_id","name") VALUES 
      ('CBA','College of Business Administration'),
      ('CCJE','College of Criminal Justice Education'),
      ('CoE','College of Engineering'),
      ('CNSM','College of Nursing and School of Midwifery'),
      ('ES','Elementary School'),
      ('JHS','Junior High School'),
      ('SHS','Senior High School'),
      ('CTELA','College of Teacher Education and Liberal Arts'),
      ('CHTM','College of Hospitality and Tourism Management'),
      ('GS','Graduate School'),
      ('RD','Research Department');`);
    // Courses
    db.run(`INSERT OR IGNORE INTO "course" ("course_id","name","department_id") VALUES 
      ('BSBA-FM','Bachelor of Science in Business Administration Major in Financial Management','CBA'),
      ('BSBA-HRDM','Bachelor of Science in Business Administration Major in Human Resource Development Management','CBA'),
      ('BSCS','Bachelor of Science in Computer Science','CBA'),
      ('BSOA','Bachelor of Science in Office Administration','CBA'),
      ('BSPA','Bachelor of Science in Public Administration','CBA')`);
    db.run(`INSERT OR IGNORE INTO "course" ("course_id","name","department_id") VALUES 
      ('BEED','Bachelor of Elementary Education','CTELA'),
      ('BSED-ENG','Bachelor of Secondary Education Major in English','CTELA'),
      ('BSED-FIL','Bachelor of Secondary Education Major in Filipino','CTELA'),
      ('BSED-MATH','Bachelor of Secondary Education Major in Mathematics','CTELA'),
      ('BSED-GS','Bachelor of Secondary Education Major in General Science','CTELA'),
      ('BSED-VE','Bachelor of Secondary Education Major in Values Education','CTELA'),
      ('BCAED','Bachelor of Culture & Arts Education','CTELA'),
      ('BPED','Bachelor of Physical Education','CTELA'),
      ('BECE','Bachelor of Early Childhood Education','CTELA'),
      ('ABE','Bachelor of Arts in English','CTELA'),
      ('ABPS','Bachelor of Arts in Political Science','CTELA')`);
    db.run(`INSERT OR IGNORE INTO "course" ("course_id","name","department_id") VALUES 
      ('AHM','Associate in Hospitality Management','CHTM'),
      ('BSHM','Bachelor of Science in Hospitality Management','CHTM'),
      ('BSTM','Bachelor of Science in Tourism Management','CHTM')`);
    db.run(`INSERT OR IGNORE INTO "course" ("course_id","name","department_id") VALUES 
      ('BSCE','Bachelor of Science in Civil Engineering','CoE'),
      ('BSGE','Bachelor of Science in Geodetic Engineering','CoE')`);
    db.run(`INSERT OR IGNORE INTO "course" ("course_id","name","department_id") VALUES 
      ('BSCRIM','Bachelor of Science in Criminology','CCJE')`);
    db.run(`INSERT OR IGNORE INTO "course" ("course_id","name","department_id") VALUES 
      ('BSN','Bachelor of Science in Nursing','CNSM'),
      ('DIPMID','Diploma in Midwifery','CNSM')`);
    db.run(`INSERT OR IGNORE INTO "course" ("course_id","name","department_id") VALUES 
      ('PhDAS','Doctor of Philosophy in Administration and Supervision','GS'),
      ('Ed.D Educ Mgt','Doctor of Education in Educational Management','GS'),
      ('MAAS','Master of Arts in Administration and Supervision','GS'),
      ('MAEE','Master of Arts in Elementary Education','GS'),
      ('MAEng','Master of Arts in English','GS'),
      ('MAFil','Master of Arts in Filipino','GS'),
      ('MAGC','Master of Arts in Guidance Counseling','GS'),
      ('MAMath','Master of Arts in Mathematics','GS'),
      ('MAEd-Pre-Elem','Master of Arts in Pre-Elementary Education','GS'),
      ('MAHE','Master of Arts in Home Economics','GS'),
      ('MBA','Master in Business Administration','GS'),
      ('MPA','Master in Public Administration','GS')`);
    db.run(`INSERT OR IGNORE INTO "course" ("course_id","name","department_id") VALUES 
      ('ELEMENTARY','Elementary Level','ES'),
      ('JUNIOR HIGH','Junior High School Level','JHS'),
      ('SENIOR HIGH','Senior High School Level','SHS')`);
  }
  async maybeSeed() {
    const deptCount = await this.getTableCount('department');
    const courseCount = await this.getTableCount('course');
    if (deptCount === 0 || courseCount === 0) {
      if (typeof seedDepartments === 'function' && typeof seedCourses === 'function') {
        try { await seedDepartments(); } catch (_) {}
        try { await seedCourses(); } catch (_) {}
      } else {
        await this.seedBase();
      }
      await this.saveDB('maybeSeed');
    }
  }
  async checkIntegrity() {
    try {
      const res = db.exec("PRAGMA integrity_check;");
      const val = res && res[0] && res[0].values && res[0].values[0] && res[0].values[0][0];
      return val === "ok";
    } catch (_) {
      return false;
    }
  }
  async backupCorruptDB(tag) {
    const ts = new Date();
    const yyyy = ts.getFullYear();
    const mm = String(ts.getMonth() + 1).padStart(2, "0");
    const dd = String(ts.getDate()).padStart(2, "0");
    const hh = String(ts.getHours()).padStart(2, "0");
    const mi = String(ts.getMinutes()).padStart(2, "0");
    const ss = String(ts.getSeconds()).padStart(2, "0");
    const stamp = `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
    const fullDbPath = window.DB_PATH.replace(/\\/g, "/");
    const backupName = `library-corrupt-${stamp}-${tag || "auto"}.db`;
    const backupPath = `${this.dbPath}/${backupName}`.replace(/\\/g, "/");
    try {
      const data = await Neutralino.filesystem.readBinaryFile(fullDbPath);
      await Neutralino.filesystem.writeBinaryFile(backupPath, data);
      return backupPath;
    } catch (e) {
      return null;
    }
  }
  async recoverCorruptDB() {
    await this.backupCorruptDB("recover");
    await createDB();
    try { await applyAdditionalSchema(); } catch (_) {}
    await this.maybeSeed();
    await this.saveDB("recoverCorruptDB");
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
      // Ensure new schema objects exist for upgraded installations
      if (typeof applyAdditionalSchema === 'function') {
        try {
          await applyAdditionalSchema();
          await this.saveDB('applyAdditionalSchema');
        } catch (schemaErr) {
          console.error('Failed to apply additional schema:', schemaErr);
        }
      }
      const ok = await this.checkIntegrity();
      if (!ok) {
        await this.recoverCorruptDB();
      } else {
        await this.maybeSeed();
      }
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
async function waitForDBReady(timeoutMs = 8000) {
  const start = Date.now();
  while (!db) {
    if (Date.now() - start >= timeoutMs) break;
    await new Promise(r => setTimeout(r, 50));
  }
  return !!db;
}
if (typeof window !== "undefined") {
  window.BCULMS = window.BCULMS || {};
  window.BCULMS.DatabaseConnection = DatabaseConnection;
  window.BCULMS.databaseConnection = databaseConnection;
  window.waitForDBReady = waitForDBReady;
}
