Neutralino.events.on("ready", async () => {
  try {
    await initPath();

    await initDB();

    const path = window.location.pathname;

    if (path.endsWith("index.html")) {
      await dashboardTotalBooks();
      await dashboardTotalStudents();

    } else if (path.endsWith("bookshelf-books.html")) {
      await renderBooks();
      await bookContentLoader();
      await selectDepartments();
      await loadDepartments();

      const saveBookBtn = document.querySelector("#saveBookBtn");
      if (saveBookBtn) {
        saveBookBtn.addEventListener("click", async () => {
          await addBookToDB();
        });
      }

    } else if (path.endsWith("bookshelf-copies.html")) {
      await renderBookCopies();
      await bookCopyModalLoader();
      
    } else if (path.endsWith("transaction_borrow.html")) {
      await renderBorrowTransactions();

    } else if (path.endsWith("transaction_library.html")) {
      await renderLibraryTransactions();

    } else if (path.endsWith("students.html")) {
      await renderStudents();
      await selectDepartments();
      await loadCourses();
      await addStudentPopup();
    }

  } catch (err) {
    console.error("App initialization error:", err);
  }
});