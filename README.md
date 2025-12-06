# Baguio Central University Library Management System (BCULMS)

- Desktop application for managing library books, copies, students, and transactions.
- Built with NeutralinoJS, using an embedded SQLite database via SQL.js (WebAssembly).

## Features
- Books management: add, edit, archive, and restore.
- Book copies management with automatic copy ID generation.
- Borrow/return tracking (transaction_borrow) and library change log (transaction_library).
- Students management with department and course linkage.
- Archived books view, including archived copies and historical transactions.

## Tech Stack
- NeutralinoJS runtime and APIs (`neutralino.js`).
- SQLite via SQL.js (`sql-wasm.wasm`, `sql-wasm.js`).
- Vanilla JavaScript and Bootstrap for UI.

## Project Structure
- `resources/html/` user interface pages (e.g., `index.html`, `bookshelf-books.html`, `archived-books.html`).
- `resources/js/` application logic:
  - `app.js` app bootstrap and page-specific initialization.
  - `database-connection.js` DB path, opening, saving, integrity checks, and recovery.
  - `create-table.js` schema creation and migrations.
  - `database-operations.js` CRUD wrapper (`insertDB`, `handleSelect`, etc.).
  - `library-operations.js` domain operations (archive, restore, insert book/copies, transactions).
  - `frontend-operations.js` convenience getters (e.g., `getBooks`, `getArchivedBooks`).
  - `archived-books.js` archived page rendering and actions.
  - `popup.js`, `renderer.js` UI helpers.

## Database
- Location: `Documents/BCULMS/data/library.db` (created automatically on first run).
- Integrity: checked on startup; if corrupt, a timestamped backup is saved and the DB is rebuilt.
- Seeding: departments and courses are created on first run when missing.
- Schema highlights:
  - `books` holds active metadata and status.
  - `book_copy` holds physical copies.
  - `transaction_borrow` records borrow/return per copy.
  - `transaction_library` records library operations (Add, Edit, Archive, Restore, Delete).
  - `archived_books` holds archived book records, including `author` and `publication_date`.
  - `archived_book_copy` holds archived copies.
  - `archived_transaction_borrow` keeps historical transactions after archiving.

## Archiving Flow
- Triggered via `LibraryOperations.archiveBook(bookId)`:
  - Updates `books.status` to `Archived`.
  - Inserts into `archived_books` including `book_title`, `author`, `publication_date`, and `archive_date`.
  - Migrates non-borrowed copies from `book_copy` to `archived_book_copy`.
  - Moves completed borrow transactions into `archived_transaction_borrow` and cleans up.
  - Logs an `Archive` operation in `transaction_library`.
- Restoring uses `LibraryOperations.restoreArchivedBook(bookId)` which reverses the above and logs `Restore`.

## Running
- Packaged app: launch the executable under `dist/BCULMS/`.
- Development (optional): install Neutralino CLI and run locally.
  1. Install Node.js LTS.
  2. Install Neutralino CLI: `npm install -g @neutralinojs/neu`.
  3. From the project directory, run: `neu run`.

## Troubleshooting
- DB not ready on page load:
  - The app waits for the SQLite instance before querying (`waitForDBReady`). If you modified initialization, ensure DB reads only occur after `initDB()`.
- SQLite errors or corruption:
  - On startup, the app performs `PRAGMA integrity_check;` and auto-recovers if needed by backing up and recreating the DB.

## Contributing
- Follow existing code style and patterns in `resources/js/*`.
- Prefer using `insertDB`/`handleSelect` wrappers for DB operations.
- Avoid committing secrets; this project stores only local DB files.

## Credits
- NeutralinoJS: https://github.com/neutralinojs/neutralinojs
