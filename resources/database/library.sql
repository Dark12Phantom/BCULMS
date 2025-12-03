BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "archived_books" (
	"archive_id" INTEGER NOT NULL UNIQUE,
	"book_id"	INTEGER NOT NULL UNIQUE,
	"book_title"	TEXT NOT NULL,
	"archive_date"	TEXT NOT NULL,
  "due_date" TEXT,
	PRIMARY KEY("archive_id"),
	FOREIGN KEY("book_id") REFERENCES "books"("book_id") ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS "book_copy" (
	"copy_id"	TEXT NOT NULL UNIQUE,
	"book_id"	TEXT NOT NULL,
	"status"	TEXT NOT NULL,
	"condition"	TEXT NOT NULL,
  "borrowed_date" TEXT,
  "returned_date" TEXT,
  "due_date" TEXT,
	PRIMARY KEY("copy_id"),
	FOREIGN KEY("book_id") REFERENCES "books"("book_id") ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS "books" (
	"book_id"	INTEGER NOT NULL UNIQUE,
	"title"	TEXT NOT NULL,
	"author"	TEXT NOT NULL,
	"publication_date"	TEXT NOT NULL,
	"type"	TEXT NOT NULL,
	"department_id"	TEXT NOT NULL,
	"status"	TEXT NOT NULL,
	PRIMARY KEY("book_id" AUTOINCREMENT),
	FOREIGN KEY("department_id") REFERENCES "department"("department_id"));
CREATE TABLE IF NOT EXISTS "course" (
	"course_id"	TEXT NOT NULL UNIQUE,
	"name"	TEXT NOT NULL,
	"department_id"	TEXT NOT NULL,
	PRIMARY KEY("course_id"),
	FOREIGN KEY("department_id") REFERENCES "department"("department_id"));
CREATE TABLE IF NOT EXISTS "department" (
	"department_id"	TEXT NOT NULL UNIQUE,
	"name"	TEXT NOT NULL,
	PRIMARY KEY("department_id"));
CREATE TABLE IF NOT EXISTS "students" (
	"student_id"	TEXT NOT NULL UNIQUE,
	"student_name"	TEXT NOT NULL,
	"course_id"	TEXT NOT NULL,
	"student_year"	INTEGER NOT NULL,
	"contact_number"	NUMERIC NOT NULL,
	"status"	TEXT,
	PRIMARY KEY("student_id"),
	FOREIGN KEY("course_id") REFERENCES "course"("course_id"));
COMMIT;

-- New normalized transaction tables per updated requirements
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "transaction_borrow" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "book_id" INTEGER NOT NULL,
  "borrower_id" TEXT NOT NULL,
  "transaction_type" TEXT NOT NULL, -- Borrow | Return
  "borrowed_at" TEXT,               -- UTC ISO timestamp
  "due_at" TEXT,                    -- UTC ISO timestamp
  "returned_at" TEXT,               -- UTC ISO timestamp
  "staff_id" TEXT NOT NULL,
  FOREIGN KEY("book_id") REFERENCES "books"("book_id") ON DELETE CASCADE,
  FOREIGN KEY("borrower_id") REFERENCES "students"("student_id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_transaction_borrow_book ON "transaction_borrow"("book_id");
CREATE INDEX IF NOT EXISTS idx_transaction_borrow_borrower ON "transaction_borrow"("borrower_id");
CREATE INDEX IF NOT EXISTS idx_transaction_borrow_type ON "transaction_borrow"("transaction_type");
CREATE INDEX IF NOT EXISTS idx_transaction_borrow_dates ON "transaction_borrow"("borrowed_at", "returned_at", "due_at");

CREATE TABLE IF NOT EXISTS "transaction_library" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "book_id" INTEGER NOT NULL,
  "operation_type" TEXT NOT NULL, -- Add | Edit | Archive | Delete
  "before_values" TEXT,           -- JSON string of previous values
  "after_values" TEXT,            -- JSON string of new values
  "staff_id" TEXT NOT NULL,
  "timestamp" TEXT NOT NULL,      -- UTC ISO timestamp
  FOREIGN KEY("book_id") REFERENCES "books"("book_id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_transaction_library_book ON "transaction_library"("book_id");
CREATE INDEX IF NOT EXISTS idx_transaction_library_type ON "transaction_library"("operation_type");
CREATE INDEX IF NOT EXISTS idx_transaction_library_time ON "transaction_library"("timestamp");
COMMIT;
