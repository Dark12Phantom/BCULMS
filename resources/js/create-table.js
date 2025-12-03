/**
 * Class managing schema creation for a fresh database.
 */
class DatabaseSchema {
  /**
   * Create all required tables if they do not exist.
   */
  async createDB() {
    db = new SQL.Database();

    db.run(`CREATE TABLE IF NOT EXISTS "archived_books" (
	"archive_id" INTEGER NOT NULL UNIQUE,
	"book_id"	INTEGER NOT NULL UNIQUE,
	"book_title"	TEXT NOT NULL,
	"archive_date"	TEXT NOT NULL,
  "due_date" TEXT,
	PRIMARY KEY("archive_id"),
	FOREIGN KEY("book_id") REFERENCES "books"("book_id") ON DELETE CASCADE);`);

    db.run(`CREATE TABLE IF NOT EXISTS "book_copy" (
	"copy_id"	TEXT NOT NULL UNIQUE,
	"book_id"	TEXT NOT NULL,
	"status"	TEXT NOT NULL,
	"condition"	TEXT NOT NULL,
  "borrowed_date" TEXT,
  "returned_date" TEXT,
  "due_date" TEXT,
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
	"status"	TEXT,
	PRIMARY KEY("student_id"),
	FOREIGN KEY("course_id") REFERENCES "course"("course_id"));`);

    // New normalized transaction tables per updated requirements
    db.run(`CREATE TABLE IF NOT EXISTS "transaction_borrow" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "book_id" INTEGER NOT NULL,
      "borrower_id" TEXT NOT NULL,
      "transaction_type" TEXT NOT NULL,
      "borrowed_at" TEXT,
      "due_at" TEXT,
      "returned_at" TEXT,
      "staff_id" TEXT NOT NULL,
      FOREIGN KEY("book_id") REFERENCES "books"("book_id") ON DELETE CASCADE,
      FOREIGN KEY("borrower_id") REFERENCES "students"("student_id") ON DELETE CASCADE
    );`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_borrow_book ON "transaction_borrow"("book_id");`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_borrow_borrower ON "transaction_borrow"("borrower_id");`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_borrow_type ON "transaction_borrow"("transaction_type");`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_borrow_dates ON "transaction_borrow"("borrowed_at", "returned_at", "due_at");`);

    db.run(`CREATE TABLE IF NOT EXISTS "transaction_library" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "book_id" INTEGER NOT NULL,
      "operation_type" TEXT NOT NULL,
      "before_values" TEXT,
      "after_values" TEXT,
      "staff_id" TEXT NOT NULL,
      "timestamp" TEXT NOT NULL,
      FOREIGN KEY("book_id") REFERENCES "books"("book_id") ON DELETE CASCADE
    );`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_library_book ON "transaction_library"("book_id");`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_library_type ON "transaction_library"("operation_type");`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_library_time ON "transaction_library"("timestamp");`);
  }
}

const databaseSchema = new DatabaseSchema();

async function createDB() { return databaseSchema.createDB(); }
async function applyAdditionalSchema() {
  // Ensure new normalized transaction tables exist for existing databases
  db.run(`CREATE TABLE IF NOT EXISTS "transaction_borrow" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "book_id" INTEGER NOT NULL,
    "borrower_id" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "borrowed_at" TEXT,
    "due_at" TEXT,
    "returned_at" TEXT,
    "staff_id" TEXT NOT NULL,
    FOREIGN KEY("book_id") REFERENCES "books"("book_id") ON DELETE CASCADE,
    FOREIGN KEY("borrower_id") REFERENCES "students"("student_id") ON DELETE CASCADE
  );`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_borrow_book ON "transaction_borrow"("book_id");`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_borrow_borrower ON "transaction_borrow"("borrower_id");`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_borrow_type ON "transaction_borrow"("transaction_type");`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_borrow_dates ON "transaction_borrow"("borrowed_at", "returned_at", "due_at");`);

  db.run(`CREATE TABLE IF NOT EXISTS "transaction_library" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "book_id" INTEGER NOT NULL,
    "operation_type" TEXT NOT NULL,
    "before_values" TEXT,
    "after_values" TEXT,
    "staff_id" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    FOREIGN KEY("book_id") REFERENCES "books"("book_id") ON DELETE CASCADE
  );`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_library_book ON "transaction_library"("book_id");`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_library_type ON "transaction_library"("operation_type");`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_library_time ON "transaction_library"("timestamp");`);
}
if (typeof window !== "undefined") {
  window.BCULMS = window.BCULMS || {};
  window.BCULMS.DatabaseSchema = DatabaseSchema;
  window.BCULMS.databaseSchema = databaseSchema;
  window.applyAdditionalSchema = applyAdditionalSchema;
}
