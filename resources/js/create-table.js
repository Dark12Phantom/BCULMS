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
	PRIMARY KEY("student_id"),
	FOREIGN KEY("course_id") REFERENCES "course"("course_id"));`);

    db.run(`CREATE TABLE IF NOT EXISTS "transactions_borrow" (
	"transaction_id"	INTEGER NOT NULL,
	"student_id"	TEXT NOT NULL,
	"copy_id"	TEXT NOT NULL,
	"date_borrowed"	TEXT NOT NULL,
	"date_returned"	TEXT,
	"due_date"	TEXT NOT NULL,
	PRIMARY KEY("transaction_id" AUTOINCREMENT),
	FOREIGN KEY("copy_id") REFERENCES "book_copy"("copy_id"),
	FOREIGN KEY("student_id") REFERENCES "students"("student_id"));`);

    db.run(`CREATE TABLE IF NOT EXISTS "transactions_library" (
	"transaction_id"	INTEGER NOT NULL,
	"transaction_name"	TEXT NOT NULL,
	"transaction_type"	TEXT NOT NULL,
	"made_by"	TEXT NOT NULL,
	"date"	TEXT NOT NULL,
	PRIMARY KEY("transaction_id" AUTOINCREMENT));`);
  }
}

const databaseSchema = new DatabaseSchema();

async function createDB() { return databaseSchema.createDB(); }
if (typeof window !== "undefined") {
  window.BCULMS = window.BCULMS || {};
  window.BCULMS.DatabaseSchema = DatabaseSchema;
  window.BCULMS.databaseSchema = databaseSchema;
}
