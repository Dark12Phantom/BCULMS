let currentSearchQuery = "";

function getCurrentSearchQuery() {
  return currentSearchQuery;
}

function setSearchQuery(q) {
  currentSearchQuery = (q || "").toString();
}

function triggerRenderForPage() {
  const path = window.location.pathname || "";
  if (path.endsWith("students.html")) {
    if (typeof renderStudents === "function") renderStudents(1);
  } else if (path.endsWith("bookshelf-copies.html")) {
    if (typeof renderBookCopies === "function") renderBookCopies(1);
  } else if (path.endsWith("transactions_borrow.html")) {
    if (typeof renderBorrowTransactions === "function") renderBorrowTransactions();
  } else if (path.endsWith("transaction_library.html")) {
    if (typeof renderLibraryTransactions === "function") renderLibraryTransactions();
  }
}

function bindSearchBars() {
  const form = document.querySelector("form.d-flex");
  const input = form ? form.querySelector('input[type="search"]') : null;
  if (!input) return;
  input.addEventListener("input", (e) => {
    setSearchQuery(e.target.value || "");
    triggerRenderForPage();
  });
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      setSearchQuery(input.value || "");
      triggerRenderForPage();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  bindSearchBars();
});

if (typeof window !== "undefined") {
  window.getCurrentSearchQuery = getCurrentSearchQuery;
}
