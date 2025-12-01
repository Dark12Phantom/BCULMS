BCULMS JavaScript Refactor Overview

Classes

- DatabaseConnection: Initializes document paths, opens/creates the SQLite database via `sql.js`, and saves using Neutralino filesystem. Methods: `initPath`, `initDB`, `saveDB`.
- DatabaseOperations: Encapsulates CRUD operations with parameter binding. Methods: `insertDB`, `updateDB`, `handleInsert`, `handleUpdate`, `handleDelete`, `handleSelect`.
- LibraryOperations: Domain operations for books, copies, students, and archives. Methods include `archiveBook`, `insertBook`, `updateBook`, `updateBookCopies`, `deleteBook`, `insertStudent`, `updateStudent`, `deleteStudent`, `generateArchiveId`, `generateCopyId`.
- DatabaseSchema: Creates core tables on first run. Method: `createDB`.
- DatabaseSeeder: Seeds departments and courses. Methods: `seedDepartments`, `seedCourses`.

Backward Compatibility

- Original global functions (`initDB`, `saveDB`, `insertDB`, `handleSelect`, `createDB`, `seedDepartments`, etc.) remain available as thin wrappers calling the new classes.
- Global `db` and Neutralino interactions remain unchanged.

Notes

- All classes and methods include JSDoc for maintainability.
- Neutralino-related files and behaviors were not modified.
