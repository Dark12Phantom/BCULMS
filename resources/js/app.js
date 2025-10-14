Neutralino.events.on("ready", async () => {
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

  } else if (path.endsWith("bookshelf-copies.html")) {
    await renderBookCopies();

  } else if (path.endsWith("transactions.html")) {
    await renderTransactions();

  } else if (path.endsWith("students.html")) {
    await renderStudents();
    await selectDepartments();
  }
});
