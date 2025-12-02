/**
 * Class encapsulating library domain operations while preserving global function APIs.
 */
class LibraryOperations {
  /**
   * Archive a book if no copies are borrowed and remove from active tables.
   * @param {number|string} bookId Book identifier
   */
  async archiveBook(bookId) {
    const user = await requireRole(["Admin", "Librarian"]);
    const booksRes = await insertDB("select", "books", "*", { book_id: bookId });
    const books = booksRes?.data || [];
    if (books.length === 0) {
      throw new Error(`Book with ID ${bookId} not found.`);
    }
    const book = books[0];

    const copiesRes = await insertDB("select", "book_copy", "*", { book_id: bookId });
    const copies = copiesRes?.data || [];
    const borrowedCopies = copies.filter((copy) => copy.status !== "Available");
    if (borrowedCopies.length > 0) {
      throw new Error(`Cannot archive book. ${borrowedCopies.length} copy/copies are currently borrowed.`);
    }

    const existingArchiveRes = await insertDB("select", "archived_books", "*", { book_id: bookId });
    const existingArchive = existingArchiveRes?.data || [];
    if (existingArchive.length > 0) {
      throw new Error(`Book ${bookId} is already archived.`);
    }

    const archiveData = {
      archive_id: await this.generateArchiveId(),
      book_id: book.book_id,
      book_title: book.title,
      archive_date: new Date().toISOString(),
    };

    await runDBTransaction(async () => {
      await insertDB("insert", "archived_books", archiveData);
      for (const copy of copies) {
        await insertDB("delete", "book_copy", null, { copy_id: copy.copy_id });
      }
      await insertDB("delete", "books", null, { book_id: bookId });
      await insertDB("insert", "transaction_library", {
        book_id: bookId,
        operation_type: "Archive",
        before_values: JSON.stringify({ title: book.title, author: book.author }),
        after_values: JSON.stringify({ reason: "Archived" }),
        staff_id: user.id,
        timestamp: archiveData.archive_date,
      });
    });
    return {
      success: true,
      archive_id: archiveData.archive_id,
      book_id: bookId,
      copies_deleted: copies.length,
    };
  }

  /**
   * Insert a generic library transaction record.
   * @param {object} transactionData Transaction fields
   */
  async insertTransaction(transactionData) {
    return await insertDB("insert", "transaction_library", transactionData);
  }

  /**
   * Update a library transaction by id.
   * @param {object} transactionData Transaction fields
   * @param {number} transactionId Transaction identifier
   */
  async updateTransaction(transactionData, transactionId) {
    return await insertDB("update", "transaction_library", transactionData, { id: transactionId });
  }

  /**
   * Insert a book and create initial copies.
   * @param {object} bookData Book fields
   * @param {number} numberOfCopies Number of copies to create
   */
  async insertBook(bookData, numberOfCopies = 1) {
    const user = await requireRole(["Admin", "Librarian"]);
    return await runDBTransaction(async () => {
      const bookResult = await insertDB("insert", "books", bookData);
      const newBookId = bookResult.lastInsertRowid || bookResult.insertId;
      if (!newBookId) {
        throw new Error("No book_id returned from insertDB");
      }
      if (numberOfCopies > 0) {
        for (let i = 1; i <= numberOfCopies; i++) {
          const copyData = {
            copy_id: this.generateCopyId(bookData.department_id, newBookId, i),
            book_id: newBookId,
            status: "Available",
            condition: "New",
          };
          await insertDB("insert", "book_copy", copyData);
        }
      }
      await insertDB("insert", "transaction_library", {
        book_id: newBookId,
        operation_type: "Add",
        before_values: null,
        after_values: JSON.stringify({ title: bookData.title, author: bookData.author, quantity: numberOfCopies }),
        staff_id: user.id,
        timestamp: new Date().toISOString(),
      });
      return bookResult;
    });
  }

  /**
   * Update a book by id.
   * @param {object} bookData Book fields to update
   * @param {number|string} bookId Book identifier
   */
  async updateBook(bookData, bookId) {
    const user = await requireRole(["Admin", "Librarian"]);
    let bookResult = { changes: 0 };
    if (Object.keys(bookData).length > 0) {
      const beforeRes = await insertDB("select", "books", "*", { book_id: bookId });
      const before = beforeRes?.data?.[0] || null;
      bookResult = await runDBTransaction(async () => {
        const res = await insertDB("update", "books", bookData, { book_id: bookId });
        await insertDB("insert", "transaction_library", {
          book_id: bookId,
          operation_type: "Edit",
          before_values: before ? JSON.stringify(before) : null,
          after_values: JSON.stringify(bookData),
          staff_id: user.id,
          timestamp: new Date().toISOString(),
        });
        return res;
      });
    }
    return bookResult;
  }

  /**
   * Adjust number of copies for a book.
   * @param {number|string} bookId Book identifier
   * @param {number} newNumberOfCopies Desired copies count
   */
  async updateBookCopies(bookId, newNumberOfCopies) {
    const user = await requireRole(["Admin", "Librarian"]);
    const existingCopies = await getBookCopies({ book_id: bookId });
    const currentCount = existingCopies.length;
    if (newNumberOfCopies === currentCount) {
      return { copiesChanged: false };
    }

    const bookQuery = db.prepare("SELECT department_id FROM books WHERE book_id = ?");
    bookQuery.bind([bookId]);
    let department = "UNKNOWN";
    if (bookQuery.step()) {
      const row = bookQuery.getAsObject();
      department = row.department_id || "UNKNOWN";
    }
    bookQuery.free();

    let copiesChanged = false;
    if (newNumberOfCopies > currentCount) {
      const copiesToAdd = newNumberOfCopies - currentCount;
      for (let i = 0; i < copiesToAdd; i++) {
        const copyNumber = currentCount + i + 1;
        const copyId = this.generateCopyId(department, bookId, copyNumber);
        const copyData = {
          copy_id: copyId,
          book_id: bookId,
          status: "Available",
          condition: "Good",
          borrowed_date: null,
          returned_date: null,
          due_date: null,
        };
        await insertDB("insert", "book_copy", copyData);
      }
      copiesChanged = true;
    } else if (newNumberOfCopies < currentCount) {
      const copiesToRemove = currentCount - newNumberOfCopies;
      const sortedCopies = existingCopies.sort((a, b) => {
        const numA = parseInt(a.copy_id.split('-C')[1]);
        const numB = parseInt(b.copy_id.split('-C')[1]);
        return numB - numA;
      });
      for (let i = 0; i < copiesToRemove; i++) {
        await insertDB("delete", "book_copy", null, { copy_id: sortedCopies[i].copy_id });
      }
      copiesChanged = true;
    }
    if (copiesChanged) {
      await insertDB("insert", "transaction_library", {
        book_id: bookId,
        operation_type: "Edit",
        before_values: JSON.stringify({ copies: currentCount }),
        after_values: JSON.stringify({ copies: newNumberOfCopies }),
        staff_id: user.id,
        timestamp: new Date().toISOString(),
      });
    }
    return { copiesChanged };
  }

  /**
   * Delete a book if none of its copies are borrowed.
   * @param {number|string} bookId Book identifier
   */
  async deleteBook(bookId) {
    const user = await requireRole(["Admin"]);
    const copiesResult = await insertDB("select", "book_copy", "*", { book_id: bookId });
    const copies = copiesResult.data || [];
    console.log("All copies:", copies);
    if (copies.length > 0) {
      console.log("First copy keys:", Object.keys(copies[0]));
      console.log("First copy:", copies[0]);
    }
    const borrowedCopies = copies.filter((copy) => {
      const status = (copy.status || "").toString().trim().toLowerCase();
      return status !== "available" && status !== "";
    });
    if (borrowedCopies.length > 0) {
      throw new Error(`Cannot delete book. ${borrowedCopies.length} copy/copies are currently borrowed.`);
    }
    return await runDBTransaction(async () => {
      for (const copy of copies) {
        await insertDB("delete", "book_copy", null, { copy_id: copy.copy_id });
      }
      const res = await insertDB("delete", "books", null, { book_id: bookId });
      await insertDB("insert", "transaction_library", {
        book_id: bookId,
        operation_type: "Delete",
        before_values: null,
        after_values: JSON.stringify({ reason: "User initiated" }),
        staff_id: user.id,
        timestamp: new Date().toISOString(),
      });
      return res;
    });
  }

  /**
   * Generate deterministic copy id.
   * @param {string} department Department code
   * @param {number|string} bookId Book id
   * @param {number} copyNumber Sequential copy number
   */
  generateCopyId(department, bookId, copyNumber) {
    return `${department}-${bookId}-C${String(copyNumber).padStart(5, "0")}`;
  }

  /**
   * Update a student by id.
   * @param {object} studentData Student fields
   * @param {string} studentId Student identifier
   */
  async updateStudent(studentData, studentId) {
    return await insertDB("update", "students", studentData, { student_id: studentId });
  }

  /**
   * Delete a student by id.
   * @param {string} studentId Student identifier
   */
  async deleteStudent(studentId) {
    return await insertDB("delete", "students", null, { student_id: studentId });
  }

  /**
   * Generate next archive id.
   */
  async generateArchiveId() {
    const archives = await insertDB("select", "archived_books", "*", null);
    if (archives.length === 0) {
      return 1;
    }
    const maxId = Math.max(...archives.map((archive) => archive.archive_id));
    return maxId + 1;
  }

  /**
   * Insert a new student.
   * @param {object} studentData Student fields
   */
  async insertStudent(studentData) {
    return await insertDB("insert", "students", studentData);
  }
}

const libraryOperations = new LibraryOperations();

async function archiveBook(bookId) { return libraryOperations.archiveBook(bookId); }
async function insertTransaction(transactionData) { return libraryOperations.insertTransaction(transactionData); }
async function updateTransaction(transactionData, transactionId) { return libraryOperations.updateTransaction(transactionData, transactionId); }
async function insertBook(bookData, numberOfCopies = 1) { return libraryOperations.insertBook(bookData, numberOfCopies); }
async function updateBook(bookData, bookId) { return libraryOperations.updateBook(bookData, bookId); }
async function updateBookCopies(bookId, newNumberOfCopies) { return libraryOperations.updateBookCopies(bookId, newNumberOfCopies); }
async function deleteBook(bookId) { return libraryOperations.deleteBook(bookId); }
function generateCopyId(department, bookId, copyNumber) { return libraryOperations.generateCopyId(department, bookId, copyNumber); }
async function updateStudent(studentData, studentId) { return libraryOperations.updateStudent(studentData, studentId); }
async function deleteStudent(studentId) { return libraryOperations.deleteStudent(studentId); }
async function generateArchiveId() { return libraryOperations.generateArchiveId(); }
async function insertStudent(studentData) { return libraryOperations.insertStudent(studentData); }
if (typeof window !== "undefined") {
  window.BCULMS = window.BCULMS || {};
  window.BCULMS.LibraryOperations = LibraryOperations;
  window.BCULMS.libraryOperations = libraryOperations;
}
