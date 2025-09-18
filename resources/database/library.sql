BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "book_copy" (
	"copy_id"	TEXT NOT NULL UNIQUE,
	"book_id"	TEXT NOT NULL,
	"status"	TEXT NOT NULL,
	"condition"	TEXT NOT NULL,
	PRIMARY KEY("copy_id"),
	FOREIGN KEY("book_id") REFERENCES "books"("book_id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "books" (
	"book_id"	INTEGER NOT NULL UNIQUE,
	"title"	TEXT NOT NULL,
	"author"	TEXT NOT NULL,
	"publication_date"	TEXT NOT NULL,
	"type"	TEXT NOT NULL,
	"department_id"	TEXT NOT NULL,
	PRIMARY KEY("book_id" AUTOINCREMENT),
	FOREIGN KEY("department_id") REFERENCES "department"("department_id")
);
CREATE TABLE IF NOT EXISTS "course" (
	"course_id"	TEXT NOT NULL UNIQUE,
	"name"	TEXT NOT NULL,
	"department_id"	TEXT NOT NULL,
	PRIMARY KEY("course_id"),
	FOREIGN KEY("department_id") REFERENCES "department"("department_id")
);
CREATE TABLE IF NOT EXISTS "department" (
	"department_id"	TEXT NOT NULL UNIQUE,
	"name"	INTEGER NOT NULL,
	PRIMARY KEY("department_id")
);
CREATE TABLE IF NOT EXISTS "students" (
	"student_id"	TEXT NOT NULL UNIQUE,
	"student_name"	TEXT NOT NULL,
	"course_id"	TEXT NOT NULL,
	"student_year"	INTEGER NOT NULL,
	"contact_number"	NUMERIC NOT NULL,
	PRIMARY KEY("student_id"),
	FOREIGN KEY("course_id") REFERENCES "course"("course_id")
);
CREATE TABLE IF NOT EXISTS "transactions" (
	"transaction_id"	INTEGER NOT NULL,
	"student_id"	TEXT NOT NULL,
	"copy_id"	TEXT NOT NULL,
	"date_borrowed"	TEXT NOT NULL,
	"date_returned"	TEXT,
	"due_date"	TEXT NOT NULL,
	PRIMARY KEY("transaction_id" AUTOINCREMENT),
	FOREIGN KEY("copy_id") REFERENCES "book_copy"("copy_id"),
	FOREIGN KEY("student_id") REFERENCES "students"("student_id")
);
INSERT INTO "department" ("department_id","name") VALUES ('CBA','College of Business Administration'),
 ('CCJE','College of Criminal Justice Education'),
 ('CoE','College of Engineering'),
 ('CNSM','College of Nursing and School of Midwifery'),
 ('ES','Elementary School'),
 ('JHS','Junior High School'),
 ('SHS','Senior High School'),
 ('CTELA','College of Teacher Education and Liberal Arts'),
 ('CHTM','College of Hospitality and Tourism Management'),
 ('GS','Graduate School'),
 ('RD','Research Department');
COMMIT;
