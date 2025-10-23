Neutralino.events.on("ready", async () => {
  try {
    await initPath();

    await initDB();

    const path = window.location.pathname;

    if (path.endsWith("index.html")) {
      await dashboardTotalBooks();
    } else if (path.endsWith("bookshelf-books.html")) {
      await renderBooks();
      bookContentLoader();
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
    } else if (path.endsWith("transactions.html")) {
      await renderTransactions();
    } else if (path.endsWith("students.html")) {
      await renderStudents();
      await selectDepartments();
      await loadCourses();
    }

  } catch (err) {
    console.error("App initialization error:", err);
  }
});