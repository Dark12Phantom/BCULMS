async function insertBook(bookData, numberOfCopies = 1) {
  const bookResult = await insertDB("insert", "books", bookData);

  const newBookId = bookResult.lastInsertRowid || bookResult.insertId;
  if (!newBookId) {
    throw new Error("No book_id returned from insertDB");
  }

  if (numberOfCopies > 0) {
    for (let i = 1; i <= numberOfCopies; i++) {
      const copyData = {
        copy_id: generateCopyId(bookData.department_id, newBookId, i),
        book_id: newBookId,
        status: "Available",
        condition: "New",
      };
      await insertDB("insert", "book_copy", copyData);
    }
  }

  return bookResult;
}

async function updateBook(bookData, bookId, newNumberOfCopies = null) {
  const bookResult = await insertDB("update", "books", bookData, {
    book_id: bookId,
  });

  if (newNumberOfCopies !== null) {
    const existingCopies = await insertDB("select", "book_copy", "*", {
      book_id: bookId,
    });
    const currentCount = existingCopies.length;

    if (newNumberOfCopies > currentCount) {
      const copiesToAdd = newNumberOfCopies - currentCount;
      const department = bookId.split("-")[0];

      for (let i = 1; i <= copiesToAdd; i++) {
        const copyData = {
          copy_id: generateCopyId(bookId, department, currentCount + i),
          book_id: bookId,
          status: "Available",
          condition: "Good",
        };
        await insertDB("insert", "book_copy", copyData);
      }
    } else if (newNumberOfCopies < currentCount) {
      const copiesToRemove = currentCount - newNumberOfCopies;
      const availableCopies = existingCopies.filter(
        (copy) => copy.status === "Available"
      );

      if (availableCopies.length < copiesToRemove) {
        throw new Error(
          `Cannot remove ${copiesToRemove} copies. Only ${
            availableCopies.length
          } available copies exist. ${
            currentCount - availableCopies.length
          } copies are currently borrowed.`
        );
      }
      for (let i = 0; i < copiesToRemove; i++) {
        await insertDB("delete", "book_copy", null, {
          copy_id: availableCopies[i].copy_id,
        });
      }
    }
  }

  return bookResult;
}

async function deleteBook(bookId) {
  const copies = await insertDB("select", "book_copy", "*", {
    book_id: bookId,
  });
  const borrowedCopies = copies.filter((copy) => copy.status !== "Available");

  if (borrowedCopies.length > 0) {
    throw new Error(
      `Cannot delete book. ${borrowedCopies.length} copy/copies are currently borrowed.`
    );
  }

  for (const copy of copies) {
    await insertDB("delete", "book_copy", null, { copy_id: copy.copy_id });
  }

  return await insertDB("delete", "books", null, { book_id: bookId });
}

function generateCopyId(department, bookId, copyNumber) {
  return `${department}-${bookId}-C${String(copyNumber).padStart(5, "0")}`;
}

async function getBookCopies(whereClause = null) {
  return await insertDB("select", "book_copy", "*", whereClause);
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

async function getCourses(whereClause = null) {
  return await insertDB("select", "course", "*", whereClause);
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

async function getBookCopies(whereClause = null) {
  return await insertDB("select", "book_copy", "*", whereClause);
}

async function getBookCopyNumber() {
  const result = await insertDB(
    "select",
    "book_copy",
    "book_id, COUNT(*) as totalCopies",
    "GROUP BY book_id"
  );
  
  // Convert array of results into an object for easy lookup
  const copyMap = {};
  if (result && result.data && Array.isArray(result.data)) {
    result.data.forEach(row => {
      // Convert book_id to number for consistent lookup
      const bookId = parseInt(row.book_id, 10);
      copyMap[bookId] = row.totalCopies;
    });
  }
  
  return copyMap;
}

async function generateArchiveId() {
  const archives = await insertDB("select", "archived_books", "*", null);

  if (archives.length === 0) {
    return 1;
  }

  const maxId = Math.max(...archives.map((archive) => archive.archive_id));
  return maxId + 1;
}

async function archiveBook(bookId) {
  const books = await insertDB("select", "books", "*", { book_id: bookId });

  if (books.length === 0) {
    throw new Error(`Book with ID ${bookId} not found.`);
  }

  const book = books[0];

  const copies = await insertDB("select", "book_copy", "*", {
    book_id: bookId,
  });
  const borrowedCopies = copies.filter((copy) => copy.status !== "Available");

  if (borrowedCopies.length > 0) {
    throw new Error(
      `Cannot archive book. ${borrowedCopies.length} copy/copies are currently borrowed.`
    );
  }

  const existingArchive = await insertDB("select", "archived_books", "*", {
    book_id: bookId,
  });
  if (existingArchive.length > 0) {
    throw new Error(`Book ${bookId} is already archived.`);
  }

  const archiveData = {
    archive_id: await generateArchiveId(),
    book_id: book.book_id,
    book_title: book.title,
    archive_date: new Date().toISOString(),
  };

  await insertDB("insert", "archived_books", archiveData);

  for (const copy of copies) {
    await insertDB("delete", "book_copy", null, { copy_id: copy.copy_id });
  }

  await insertDB("delete", "books", null, { book_id: bookId });

  return {
    success: true,
    archive_id: archiveData.archive_id,
    book_id: bookId,
    copies_deleted: copies.length,
  };
}

async function getArchivedBooks(whereClause = null) {
  return await insertDB("select", "archived_books", "*", whereClause);
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
