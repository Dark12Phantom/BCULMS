function addBookPopup() {}

function archiveBookPopup() {}

function addStudentPopup() {}

function addBookPopup() {}

function addBookPopup() {}

async function bookContentLoader() {
  const tbody = document.getElementById("booksTableBody");

  // Create proper Bootstrap modal
  const modalHTML = `
    <div class="modal fade" id="bookContextModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-info text-white">
            <h5 class="modal-title">Book Options for <span style="color: #00ff15" id="bookContextTitle"></span></h5>
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

    const titleCell = selectedRow.querySelector("td:first-child");
    document.getElementById("bookContextTitle").textContent = titleCell
      ? titleCell.textContent.trim()
      : "";
    modalInstance.show();
  });

  // Menu actions
  modalElement.querySelector("#viewBook").onclick = () =>
    showBookPopup("view", selectedRow.dataset.bookId);
  modalElement.querySelector("#editBook").onclick = () =>
    showBookPopup("edit", selectedRow.dataset.bookId);
  modalElement.querySelector("#deleteBook").onclick = () =>
    showBookPopup("delete", selectedRow.dataset.bookId);
}

async function bookCopyModalLoader() {
  const tbody = document.getElementById("bookCopiesTableBody");

  // Create proper Bootstrap modal
  const modalHTML = `
    <div class="modal fade" id="bookCopyContextModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-info text-white">
            <h5 class="modal-title">Book Copy Options for <span style="color: #00ff15" id="bookCopyContextTitle"></span></h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-0">
            <ul class="list-group list-group-flush mb-0">
              <li class="list-group-item list-group-item-action" id="setBorrowedBook">Set as Borrowed</li>
              <li class="list-group-item list-group-item-action" id="setReturnedBook">Set as Returned</li>
              <li class="list-group-item list-group-item-action" id="bookCopyDetails">Details</li>
              <li class="list-group-item list-group-item-action text-danger" id="deleteBookCopy">Delete</li>
            </ul>
          </div> 
        `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const modalElement = document.getElementById("bookCopyContextModal");
  const modalInstance = new bootstrap.Modal(modalElement);
  let selectedRow = null;
  tbody.addEventListener("contextmenu", (e) => {
    const row = e.target.closest("tr[data-copy-id]");
    if (!row) return;
    e.preventDefault();

    selectedRow = row;

    const firstCell = selectedRow.querySelector("td:first-child");
    const thirdCell = selectedRow.querySelector("td:nth-child(3)");

    const titleText = [
      firstCell?.textContent.trim(),
      thirdCell?.textContent.trim(),
    ]
      .filter(Boolean)
      .join(" - ");

    document.getElementById("bookCopyContextTitle").textContent = titleText;

    modalInstance.show();
  });

  // Menu actions
  modalElement.querySelector("#setBorrowedBook").onclick = () => {
    const id = selectedRow.dataset.copyId;
    showPopup("Book Copy Details", `Book Copy ID: ${id}`);
    modalInstance.hide();
  };
  modalElement.querySelector("#setReturnedBook").onclick = () => {
    const id = selectedRow.dataset.copyId;
    showPopup("Edit Book Copy", `Editing Book Copy ID: ${id}`);
    modalInstance.hide();
  };
  modalElement.querySelector("#bookCopyDetails").onclick = () => {
    const id = selectedRow.dataset.copyId;
    showPopup("Copy Details for Book Copy ID", `Book Copy ID: ${id}`);
    modalInstance.hide();
  };
  modalElement.querySelector("#deleteBookCopy").onclick = () => {
    const id = selectedRow.dataset.copyId;
    if (confirm(`Delete book copy ID ${id}?`)) {
      selectedRow.remove();
    }
    modalInstance.hide();
  };
}

async function showBookPopup(action, id) {
  switch (action) {
    case "view":
      openModal(
        "Book Details",
        `
        <p><strong>Book ID:</strong> ${id}</p>
        <p>Here be the book details fetched from database...</p>
      `
      );
      break;

    case "edit":
      const row = document.querySelector(`tr[data-book-id="${id}"]`);
      if (!row) {
        alert("Book record not found on the page.");
        return;
      }

      const cells = row.querySelectorAll("td");
      const currentTitle = cells[0]?.textContent.trim() || "";
      const currentAuthor = cells[1]?.textContent.trim() || "";
      
      const existingCopies = await getBookCopies({ book_id: id });
      const currentCopies = existingCopies.length;

      openModal(
        "Edit Book",
        `
    <form id="editBookForm">
      <div class="mb-3">
        <label class="form-label">Book Title</label>
        <input type="text" class="form-control" id="editTitle" value="${currentTitle}">
      </div>
      <div class="mb-3">
        <label class="form-label">Author</label>
        <input type="text" class="form-control" id="editAuthor" value="${currentAuthor}">
      </div>
      <div class="mb-3">
        <label class="form-label">Number of Copies</label>
        <input type="number" class="form-control" id="editCopies" value="${currentCopies}" min="0">
      </div>
      <div class="mb-3">
        <p class="fs-6 text-warning-emphasis">
          <span class="text-danger">*</span> Leave fields blank if no changes necessary.
        </p>
      </div>
      <button type="submit" class="btn btn-primary w-100">Update Book</button>
    </form>
    `
      );

      const form = document.getElementById("editBookForm");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("editTitle").value.trim();
        const author = document.getElementById("editAuthor").value.trim();
        const newCopies = parseInt(
          document.getElementById("editCopies").value.trim(),
          10
        );

        const bookData = {};
        if (title && title !== currentTitle) bookData.title = title;
        if (author && author !== currentAuthor) bookData.author = author;

        const newNumberOfCopies =
          !isNaN(newCopies) && newCopies !== currentCopies ? newCopies : null;

        if (Object.keys(bookData).length === 0 && newNumberOfCopies === null) {
          alert("Must update one field to proceed.");
          return;
        }

        try {
          let bookChanged = false;
          let copiesChanged = false;

          // Update book data if changed
          if (Object.keys(bookData).length > 0) {
            const bookResult = await updateBook(bookData, id);
            bookChanged = bookResult.changes > 0;
          }

          // Update copies if changed
          if (newNumberOfCopies !== null) {
            const copyResult = await updateBookCopies(id, newNumberOfCopies);
            copiesChanged = copyResult.copiesChanged;
          }

          if (bookChanged || copiesChanged) {
            alert("Book updated successfully!");
            closeModal();

            // Reflect updates in frontend table
            if (bookData.title && cells[0]) cells[0].textContent = bookData.title;
            if (bookData.author && cells[1]) cells[1].textContent = bookData.author;
            if (newNumberOfCopies !== null && cells[6]) {
              cells[6].textContent = newNumberOfCopies;
            }
          } else {
            alert("No changes detected or record unchanged.");
          }
        } catch (err) {
          alert("Error updating book: " + err.message);
          console.error("Update error:", err);
        }
      });
      break;

    case "delete":
      const deleteRow = document.querySelector(`tr[data-book-id="${id}"]`);
      if (!deleteRow) {
        alert("Book record not found on the page.");
        return;
      }

      openModal(
        "Confirm Deletion",
        `
        <p>Art thou sure thou wouldst delete book ID <strong>${id}</strong>?</p>
        <button id="confirmDelete" class="btn btn-danger mt-2">Yes, delete it</button>
      `
      );
      
      document.getElementById("confirmDelete").onclick = () => {
        deleteRow.remove();
        closeModal();
      };
      break;

    default:
      console.warn("Unknown popup action:", action);
  }
}
// A generic modal builder using Bootstrap
function openModal(title, bodyHtml) {
  const modal = document.createElement("div");
  modal.className = "modal fade";
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${title}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();

  modal.addEventListener("hidden.bs.modal", () => modal.remove());
}

function closeModal() {
  const openModal = document.querySelector(".modal.show");
  if (openModal) {
    const modalInstance = bootstrap.Modal.getInstance(openModal);
    modalInstance.hide();
  }
}
