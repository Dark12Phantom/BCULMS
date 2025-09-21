let SQL = null;
let db = null;
let docsPath = null;
let dbPath = null;
let dbFile = "library.db";

async function initPath() {
  docsPath = await Neutralino.os.getPath("documents");
  dbPath = docsPath + "/BCULMS/data";
  console.log("Resolved DB path: " + dbPath + "/" + dbFile);
}

async function initDB() {
  SQL = await initSqlJs({
    locateFile: (file) => "../js/sql-wasm.wasm",
  });

  const fullDbPath = `${dbPath}/${dbFile}`.replace(/\\/g, "/");
  console.log("Full DB path:", fullDbPath);

  try {
    let fileData;
    let stats;

    try {
      fileData = await Neutralino.filesystem.readBinaryFile(fullDbPath);
      stats = await Neutralino.filesystem.getStats(fullDbPath);
    } catch (e1) {
      console.log("Method 1 failed, trying alternative...", e1.message);

      try {
        fileData = await Neutralino.filesystem.readBinaryFile({
          path: fullDbPath,
        });
        stats = await Neutralino.filesystem.getStats({ path: fullDbPath });
      } catch (e2) {
        console.log("Method 2 failed, trying original format...", e2.message);

        fileData = await Neutralino.filesystem.readBinaryFile({
          directory: dbPath.replace(/\\/g, "/"),
          fileName: dbFile,
        });
        stats = await Neutralino.filesystem.getStats({
          directory: dbPath.replace(/\\/g, "/"),
          fileName: dbFile,
        });
      }
    }

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
    // const result = await handleSelect("department");
    // console.log(result);
}

function createDB() {
  db = new SQL.Database();

  // CREATE TABLES IF DATABASE IS NOT FOUND
  db.run(`CREATE TABLE IF NOT EXISTS "book_copy" (
	"copy_id"	TEXT NOT NULL UNIQUE,
	"book_id"	TEXT NOT NULL,
	"status"	TEXT NOT NULL,
	"condition"	TEXT NOT NULL,
	PRIMARY KEY("copy_id"),
	FOREIGN KEY("book_id") REFERENCES "books"("book_id") ON DELETE CASCADE);`);

  db.run(`CREATE TABLE IF NOT EXISTS "books" (
	"book_id"	INTEGER NOT NULL UNIQUE,
	"title"	TEXT NOT NULL,
	"author"	TEXT NOT NULL,
	"publication_date"	TEXT NOT NULL,
	"type"	TEXT NOT NULL,
	"department_id"	TEXT NOT NULL,
	"status"	TEXT NOT NULL,
	PRIMARY KEY("book_id" AUTOINCREMENT),
	FOREIGN KEY("department_id") REFERENCES "department"("department_id"));`);

  db.run(`CREATE TABLE IF NOT EXISTS "course" (
	"course_id"	TEXT NOT NULL UNIQUE,
	"name"	TEXT NOT NULL,
	"department_id"	TEXT NOT NULL,
	PRIMARY KEY("course_id"),
	FOREIGN KEY("department_id") REFERENCES "department"("department_id"));`);

  db.run(`CREATE TABLE IF NOT EXISTS "department" (
	"department_id"	TEXT NOT NULL UNIQUE,
	"name"	TEXT NOT NULL,
	PRIMARY KEY("department_id"));`);

  db.run(`CREATE TABLE IF NOT EXISTS "students" (
	"student_id"	TEXT NOT NULL UNIQUE,
	"student_name"	TEXT NOT NULL,
	"course_id"	TEXT NOT NULL,
	"student_year"	INTEGER NOT NULL,
	"contact_number"	NUMERIC NOT NULL,
	PRIMARY KEY("student_id"),
	FOREIGN KEY("course_id") REFERENCES "course"("course_id"));`);

  db.run(`CREATE TABLE IF NOT EXISTS "transactions" (
	"transaction_id"	INTEGER NOT NULL,
	"student_id"	TEXT NOT NULL,
	"copy_id"	TEXT NOT NULL,
	"date_borrowed"	TEXT NOT NULL,
	"date_returned"	TEXT,
	"due_date"	TEXT NOT NULL,
	PRIMARY KEY("transaction_id" AUTOINCREMENT),
	FOREIGN KEY("copy_id") REFERENCES "book_copy"("copy_id"),
	FOREIGN KEY("student_id") REFERENCES "students"("student_id"));`);

  // INSERT PREDEFINED DATA
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
}

async function saveDB(source = "") {
  const fullDbPath = `${dbPath}/${dbFile}`.replace(/\\/g, "/");

  // Ensure directory exists
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

// Insert functions for user operations
async function insertDB(operation, table, data, whereClause = null) {
  console.log(`insertDB called: ${operation} on ${table}`, data);

  try {
    let result;
    let hasChanges = false;

    switch (operation.toLowerCase()) {
      case "insert":
        result = await handleInsert(table, data);
        hasChanges = result.changes > 0;
        break;

      case "update":
        if (!whereClause) {
          throw new Error("UPDATE operation requires whereClause parameter");
        }
        result = await handleUpdate(table, data, whereClause);
        hasChanges = result.changes > 0;
        break;

      case "delete":
        if (!whereClause) {
          throw new Error("DELETE operation requires whereClause parameter");
        }
        result = await handleDelete(table, whereClause);
        hasChanges = result.changes > 0;
        break;

      case "select":
        result = await handleSelect(table, data, whereClause);
        // SELECT operations don't modify the database
        hasChanges = false;
        break;

      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    // If there are changes, call updateDB to handle persistence
    if (hasChanges) {
      await updateDB(`${operation} ${table}`, result);
    }

    console.log(`insertDB completed: ${operation} on ${table}`, result);
    return result;
  } catch (error) {
    console.error(`insertDB error: ${operation} on ${table}:`, error);
    throw error;
  }
}

// Handle database updates and persistence
async function updateDB(source = "manual update", operationResult = null) {
  console.log(`updateDB called from: ${source}`);

  try {
    // Log the operation result if provided
    if (operationResult) {
      console.log(`Operation result:`, {
        changes: operationResult.changes || 0,
        lastInsertRowid: operationResult.lastInsertRowid || null,
        rowsAffected: operationResult.changes || 0,
      });
    }

    // Save the database if there were changes
    if (!operationResult || operationResult.changes > 0) {
      await saveDB(source);
      console.log(`Database updated and saved: ${source}`);
      return true;
    } else {
      console.log(`No changes to save: ${source}`);
      return false;
    }
  } catch (error) {
    console.error(`updateDB error from ${source}:`, error);
    throw error;
  }
}

// Helper function to handle INSERT operations
async function handleInsert(table, data) {
  if (!data || typeof data !== "object") {
    throw new Error("Insert data must be an object");
  }

  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map(() => "?").join(", ");

  const query = `INSERT INTO ${table} (${columns.join(
    ", "
  )}) VALUES (${placeholders})`;

  console.log(`Executing INSERT:`, query, values);

  try {
    const stmt = db.prepare(query);
    stmt.run(values);

    const result = {
      changes: db.getRowsModified(),
      lastInsertRowid: stmt.getAsObject().lastInsertRowid || null,
    };

    stmt.free();
    return result;
  } catch (error) {
    console.error("INSERT error:", error);
    throw error;
  }
}

// Helper function to handle UPDATE operations
async function handleUpdate(table, data, whereClause) {
  if (!data || typeof data !== "object") {
    throw new Error("Update data must be an object");
  }

  if (!whereClause || typeof whereClause !== "object") {
    throw new Error("WHERE clause must be an object");
  }

  const setColumns = Object.keys(data);
  const setValues = Object.values(data);
  const whereColumns = Object.keys(whereClause);
  const whereValues = Object.values(whereClause);

  const setClause = setColumns.map((col) => `${col} = ?`).join(", ");
  const whereCondition = whereColumns.map((col) => `${col} = ?`).join(" AND ");

  const query = `UPDATE ${table} SET ${setClause} WHERE ${whereCondition}`;
  const allValues = [...setValues, ...whereValues];

  console.log(`Executing UPDATE:`, query, allValues);

  try {
    const stmt = db.prepare(query);
    stmt.run(allValues);

    const result = {
      changes: db.getRowsModified(),
    };

    stmt.free();
    return result;
  } catch (error) {
    console.error("UPDATE error:", error);
    throw error;
  }
}

// Helper function to handle DELETE operations
async function handleDelete(table, whereClause) {
  if (!whereClause || typeof whereClause !== "object") {
    throw new Error("WHERE clause must be an object");
  }

  const whereColumns = Object.keys(whereClause);
  const whereValues = Object.values(whereClause);
  const whereCondition = whereColumns.map((col) => `${col} = ?`).join(" AND ");

  const query = `DELETE FROM ${table} WHERE ${whereCondition}`;

  console.log(`Executing DELETE:`, query, whereValues);

  try {
    const stmt = db.prepare(query);
    stmt.run(whereValues);

    const result = {
      changes: db.getRowsModified(),
    };

    stmt.free();
    return result;
  } catch (error) {
    console.error("DELETE error:", error);
    throw error;
  }
}

// Helper function to handle SELECT operations
async function handleSelect(table, columns = "*", whereClause = null) {
  let query;
  let values = [];

  // Handle columns parameter
  if (Array.isArray(columns)) {
    query = `SELECT ${columns.join(", ")} FROM ${table}`;
  } else if (typeof columns === "string") {
    query = `SELECT ${columns} FROM ${table}`;
  } else if (columns === null || columns === undefined) {
    query = `SELECT * FROM ${table}`;
  } else {
    query = `SELECT * FROM ${table}`;
  }

  // Handle WHERE clause
  if (whereClause && typeof whereClause === "object") {
    const whereColumns = Object.keys(whereClause);
    const whereValues = Object.values(whereClause);
    const whereCondition = whereColumns
      .map((col) => `${col} = ?`)
      .join(" AND ");

    query += ` WHERE ${whereCondition}`;
    values = whereValues;
  }

  // console.log(`Executing SELECT:`, query, values);

  try {
    const stmt = db.prepare(query);
    const results = [];

    if (values.length > 0) {
      stmt.bind(values);
    }

    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }

    stmt.free();

    return {
      data: results,
      count: results.length,
      changes: 0,
    };
  } catch (error) {
    console.error("SELECT error:", error);
    throw error;
  }
}

// Convenience functions for common operations
async function insertBook(bookData) {
  return await insertDB("insert", "books", bookData);
}

async function updateBook(bookData, bookId) {
  return await insertDB("update", "books", bookData, { book_id: bookId });
}

async function deleteBook(bookId) {
  return await insertDB("delete", "books", null, { book_id: bookId });
}

async function getBooks(whereClause = null) {
  return await insertDB("select", "books", "*", whereClause);
}

async function insertStudent(studentData) {
  return await insertDB("insert", "students", studentData);
}

async function updateStudent(studentData, studentId) {
  return await insertDB("update", "students", studentData, {
    student_id: studentId,
  });
}

async function deleteStudent(studentId) {
  return await insertDB("delete", "students", null, { student_id: studentId });
}

async function getStudents(whereClause = null) {
  return await insertDB("select", "students", "*", whereClause);
}

async function getDepartments(whereClause = null) {
  return await insertDB("select", "department", "*", whereClause);
}

async function insertTransaction(transactionData) {
  return await insertDB("insert", "transactions", transactionData);
}

async function updateTransaction(transactionData, transactionId) {
  return await insertDB("update", "transactions", transactionData, {
    transaction_id: transactionId,
  });
}

async function getTransactions(whereClause = null) {
  return await insertDB("select", "transactions", "*", whereClause);
}

// Example usage functions (you can uncomment these for testing)
/*
// Example: Add a new book
async function addNewBook() {
  try {
    const result = await insertBook({
      title: "Sample Book Title",
      author: "Sample Author",
      publication_date: "2024-01-01",
      type: "Academic",
      department_id: "CBA",
      status: "In Library"
    });
    console.log("Book added:", result);
  } catch (error) {
    console.error("Failed to add book:", error);
  }
}

// Example: Update a book
async function updateExistingBook() {
  try {
    const result = await updateBook({
      title: "Updated Book Title",
      author: "Updated Author",
      status: "In Library"
    }, 1); // Update book with ID 1
    console.log("Book updated:", result);
  } catch (error) {
    console.error("Failed to update book:", error);
  }
}

// Example: Get all books from CBA department
async function getCBABooks() {
  try {
    const result = await getBooks({ department_id: "CBA", status: "In Library" });
    console.log("CBA Books:", result);
  } catch (error) {
    console.error("Failed to get books:", error);
  }
}

async function getArchivedBooks() {
  try {
    const result = await getBooks({ status: "Archived" });
    console.log("CBA Books:", result);
  } catch (error) {
    console.error("Failed to get books:", error);
  }
}
*/
