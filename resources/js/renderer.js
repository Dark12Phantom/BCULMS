let currentPage = 1;
const rowsPerPage = 25;

async function changePage(page) {
  currentPage = page;
  await renderBooks(currentPage, rowsPerPage);
}

async function renderBooks(page = 1, rowsPerPage = 25) {
  const bookTBody = document.querySelector("#booksTableBody");
  if (!bookTBody) return console.error("Table body #booksTableBody not found");

  bookTBody.innerHTML = "";

  const books = await getAllBooks();
  const bookCopyNumber = await getBookCopyNumber();

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageRows = books.slice(start, end);

  if (pageRows.length > 0) {
    pageRows.forEach((book) => {
      const tr = document.createElement("tr");
      const bookId = parseInt(book.book_id, 10);
      const copies = bookCopyNumber[bookId] || 0;
      tr.dataset.bookId = book.book_id;
      tr.innerHTML = `
            <td>${book.title || "&nbsp;"}</td>
            <td>${book.author || "&nbsp;"}</td>
            <td>${book.publication_date || "&nbsp;"}</td>
            <td>${book.department_id || "&nbsp;"}</td>
            <td>${copies}</td>
        `;
      bookTBody.appendChild(tr);
    });
  } else {
    bookTBody.innerHTML = "No books on the record";
  }

  await renderPager(books.length, rowsPerPage, page, "pager-top");
  await renderPager(books.length, rowsPerPage, page, "pager-bottom");
}

function bookContentLoader() {
  document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.getElementById("booksTableBody");

    // Create proper Bootstrap modal
    const modalHTML = `
    <div class="modal fade" id="bookContextModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-info text-white">
            <h5 class="modal-title">Book Options</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-0">
            <ul class="list-group list-group-flush mb-0">
              <li class="list-group-item list-group-item-action" id="viewBook">View Details</li>
              <li class="list-group-item list-group-item-action" id="editBook">Edit Details</li>
              <li class="list-group-item list-group-item-action text-danger" id="deleteBook">Delete</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const modalElement = document.getElementById("bookContextModal");
    const modalInstance = new bootstrap.Modal(modalElement);
    let selectedRow = null;

    tbody.addEventListener("contextmenu", (e) => {
      const row = e.target.closest("tr[data-book-id]");
      if (!row) return;
      e.preventDefault();
      selectedRow = row;

      modalInstance.show();
    });

    // Menu actions
    modalElement.querySelector("#viewBook").onclick = () => {
      const id = selectedRow.dataset.bookId;
      showPopup("Book Details", `Book ID: ${id}`);
      modalInstance.hide();
    };

    modalElement.querySelector("#editBook").onclick = () => {
      const id = selectedRow.dataset.bookId;
      showPopup("Edit Book", `Editing Book ID: ${id}`);
      modalInstance.hide();
    };

    modalElement.querySelector("#deleteBook").onclick = () => {
      const id = selectedRow.dataset.bookId;
      if (confirm(`Delete book ID ${id}?`)) {
        selectedRow.remove();
      }
      modalInstance.hide();
    };
  });
}

async function renderPager(totalRows, rowsPerPage, currentPage, pagerID) {
  const pager = document.getElementById(pagerID);
  if (!pager) return console.error("Pager element #pager not found");

  pager.innerHTML = "";
  const totalPage = Math.ceil(totalRows / rowsPerPage);
  if (totalPage <= 1) return;

  const ul = document.createElement("ul");
  ul.className = "pagination";

  // Previous
  const previous = document.createElement("li");
  previous.className = "page-item" + (currentPage === 1 ? " disabled" : "");
  const prevBtn = document.createElement("button");
  prevBtn.className = "page-link btn me-2";
  prevBtn.innerText = "Previous";
  prevBtn.onclick = () => {
    if (currentPage > 1) changePage(currentPage - 1);
  };
  previous.appendChild(prevBtn);
  ul.appendChild(previous);

  // Page numbers
  for (let i = 1; i <= totalPage; i++) {
    const li = document.createElement("li");
    li.className = "page-item" + (i === currentPage ? " active" : "");
    const link = document.createElement("a");
    link.className = "page-link";
    link.href = "#";
    link.innerText = i;
    link.onclick = (e) => {
      e.preventDefault();
      changePage(i);
    };
    li.appendChild(link);
    ul.appendChild(li);
  }

  // Next
  const next = document.createElement("li");
  next.className = "page-item" + (currentPage === totalPage ? " disabled" : "");
  const nextBtn = document.createElement("button");
  nextBtn.className = "page-link btn ms-2";
  nextBtn.innerText = "Next";
  nextBtn.onclick = () => {
    if (currentPage < totalPage) changePage(currentPage + 1);
  };
  next.appendChild(nextBtn);
  ul.appendChild(next);

  pager.appendChild(ul);
}
async function renderStudents() {}

async function renderBookCopies(page = 1, rowsPerPage = 25) {
  const bookCopyTBody = document.querySelector("#bookCopiesTableBody");
  if (!bookCopyTBody) return console.error("Table body #bookCopiesTableBody not found");

  bookCopyTBody.innerHTML = "";

  try {
    // Get all book copies
    const copiesResult = await insertDB(
      "select",
      "book_copy",
      "copy_id, book_id, status, condition, borrowed_date, returned_date, due_date",
      null
    );
    
    const copies = copiesResult?.data || [];
    
    // Get all books to map book titles
    const booksResult = await insertDB(
      "select",
      "books",
      "book_id, title",
      null
    );
    
    const books = booksResult?.data || [];
    
    // Create a map of book_id to title for quick lookup
    const bookTitles = {};
    books.forEach(book => {
      bookTitles[book.book_id] = book.title;
    });
    
    // Get borrower information if needed (assuming you have a borrowers table)
    // Adjust this based on your actual database schema
    const borrowersResult = await insertDB(
      "select",
      "borrowers",
      "copy_id, name",
      "WHERE returned_date IS NULL" // Only active borrows
    );
    
    const borrowers = borrowersResult?.data || [];
    
    // Create a map of copy_id to borrower name
    const borrowerNames = {};
    borrowers.forEach(borrower => {
      borrowerNames[borrower.copy_id] = borrower.name;
    });

    // Pagination
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageRows = copies.slice(start, end);

    if (pageRows.length > 0) {
      pageRows.forEach((copy) => {
        const tr = document.createElement("tr");
        const bookId = parseInt(copy.book_id, 10);
        const title = bookTitles[bookId] || "Unknown";
        const borrowedBy = borrowerNames[copy.copy_id] || "—";
        
        tr.dataset.copyId = copy.copy_id;
        tr.innerHTML = `
          <td>${copy.copy_id || "&nbsp;"}</td>
          <td>${copy.book_id || "&nbsp;"}</td>
          <td>${title}</td>
          <td>${copy.status || "&nbsp;"}</td>
          <td>${borrowedBy}</td>
          <td>${copy.condition || "&nbsp;"}</td>
        `;
        bookCopyTBody.appendChild(tr);
      });
    } else {
      bookCopyTBody.innerHTML = '<tr><td colspan="6">No book copies on record</td></tr>';
    }

    await renderPager(copies.length, rowsPerPage, page, "pager-top");
    await renderPager(copies.length, rowsPerPage, page, "pager-bottom");
    
  } catch (error) {
    console.error("Failed to render book copies:", error);
    bookCopyTBody.innerHTML = '<tr><td colspan="6">Error loading book copies</td></tr>';
  }
}

async function renderTransactions() {}
