Neutralino.events.on("ready", async () => {
  await initPath();
  await initDB();
  await selectDepartments();
  const path = window.location.pathname;
  if (path.endsWith("index.html")) {
    await dashboardTotalBooks();
  } else {
    await renderBooks();
  }
});
