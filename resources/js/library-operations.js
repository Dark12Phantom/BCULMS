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

async function insertTransaction(transactionData) {
  return await insertDB("insert", "transactions", transactionData);
}

async function updateTransaction(transactionData, transactionId) {
  return await insertDB("update", "transactions", transactionData, {
    transaction_id: transactionId,
  });
}

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

async function updateBook(bookData, bookId) {
  let bookResult = { changes: 0 };

  // Only run UPDATE if bookData has content
  if (Object.keys(bookData).length > 0) {
    bookResult = await insertDB("update", "books", bookData, { book_id: bookId });
  }

  return bookResult;
}

async function updateBookCopies(bookId, newNumberOfCopies) {
  const result = await insertDB("select", "book_copy", "*", { book_id: bookId });
  
  // Ensure we have an array
  const existingCopies = Array.isArray(result) ? result : (result.rows || []);
  const currentCount = existingCopies.length;

  if (newNumberOfCopies === currentCount) {
    return { copiesChanged: false };
  }

  // Get book info for department
  const bookResult = await insertDB("select", "books", "*", { book_id: bookId });
  const bookInfo = Array.isArray(bookResult) ? bookResult : (bookResult.rows || []);
  const department = bookInfo[0]?.department_id || "UNKNOWN";

  if (newNumberOfCopies > currentCount) {
    // Add new copies (append to existing)
    const copiesToAdd = newNumberOfCopies - currentCount;

    for (let i = 1; i <= copiesToAdd; i++) {
      const copyData = {
        copy_id: generateCopyId(department, bookId, currentCount + i),
        book_id: bookId,
        status: "Available",
        condition: "Good",
        borrowed_date: null,
        returned_date: null,
        due_date: null
      };
      await insertDB("insert", "book_copy", copyData);
    }
    
    return { copiesChanged: true, copiesAdded: copiesToAdd };
  } else {
    // Remove copies - delete the highest numbered ones
    const copiesToRemove = currentCount - newNumberOfCopies;
    
    // Sort all copies by copy number (descending - highest first)
    const sortedCopies = existingCopies.sort((a, b) => {
      const numA = parseInt(a.copy_id.split('-C')[1]);
      const numB = parseInt(b.copy_id.split('-C')[1]);
      return numB - numA; // Descending order
    });

    // Check if the highest numbered copies can be deleted (must be Available)
    const copiesToDelete = sortedCopies.slice(0, copiesToRemove);
    const unavailableCopies = copiesToDelete.filter(copy => copy.status !== "Available");
    
    if (unavailableCopies.length > 0) {
      const unavailableIds = unavailableCopies.map(c => c.copy_id).join(', ');
      throw new Error(
        `Cannot remove ${copiesToRemove} copies. Some of the highest numbered copies are currently borrowed: ${unavailableIds}`
      );
    }
    
    // Delete the highest numbered copies
    for (let i = 0; i < copiesToRemove; i++) {
      await insertDB("delete", "book_copy", null, { copy_id: sortedCopies[i].copy_id });
    }
    
    return { copiesChanged: true, copiesRemoved: copiesToRemove };
  }
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

async function updateStudent(studentData, studentId) {
  return await insertDB("update", "students", studentData, {
    student_id: studentId,
  });
}

async function deleteStudent(studentId) {
  return await insertDB("delete", "students", null, { student_id: studentId });
}

async function generateArchiveId() {
  const archives = await insertDB("select", "archived_books", "*", null);

  if (archives.length === 0) {
    return 1;
  }

  const maxId = Math.max(...archives.map((archive) => archive.archive_id));
  return maxId + 1;
}

async function insertStudent(studentData) {
  return await insertDB("insert", "students", studentData);
}
