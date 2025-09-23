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

  pageRows.forEach((book) => {
    const tr = document.createElement("tr");
    const copies = bookCopyNumber[book.book_id] || 0;
    tr.innerHTML = `
            <td>${book.title || "&nbsp;"}</td>
            <td>${book.author || "&nbsp;"}</td>
            <td>${book.publication_date || "&nbsp;"}</td>
            <td>${book.department_id || "&nbsp;"}</td>
            <td>${copies}</td>
        `;
    bookTBody.appendChild(tr);
  });

  await renderPager(books.length, rowsPerPage, page, "pager-top");
  await renderPager(books.length, rowsPerPage, page, "pager-bottom");
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
async function renderBookCopies() {}
async function renderTransactions() {}
