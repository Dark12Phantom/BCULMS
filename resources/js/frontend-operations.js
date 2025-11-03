async function getBookCopies(whereClause = null) {
  return await insertDB("select", "book_copy", "*", whereClause);
}

async function getBooks(whereClause = null) {
  return await insertDB("select", "books", "*", whereClause);
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

async function getTransactions(whereClause = null) {
  return await insertDB("select", "transactions", "*", whereClause);
}

async function getBookCopies(whereClause = null) {
  const result = await insertDB("select", "book_copy", "*", whereClause);
  return result.data || [];
}

async function getBookCopyNumber() {
  const result = await insertDB(
    "select",
    "book_copy",
    "book_id",
    null
  );
  
  const copyMap = {};
  if (result && result.data && Array.isArray(result.data)) {
    result.data.forEach(row => {
      const bookId = parseInt(row.book_id, 10);
      copyMap[bookId] = (copyMap[bookId] || 0) + 1; // Increment count
    });
  }
  
  return copyMap;
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
