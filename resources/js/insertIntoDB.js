async function addBookToDB() {
  try {
    const modal = document.querySelector('#addBookContent');

    const titleInput = modal.querySelector('input[name="title"]');
    const authorInput = modal.querySelector('input[name="author"]');
    const publicationDateInput = modal.querySelector('input[name="publication_date"]');
    const typeInput = modal.querySelector('select[name="type"]');
    const departmentSelect = modal.querySelector('select[name="department_id"]');
    const copiesInput = modal.querySelector('input[name="copies"]');

    const bookData = {
      title: titleInput.value.trim(),
      author: authorInput.value.trim(),
      publication_date: publicationDateInput.value,
      type: typeInput.value,
      department_id: departmentSelect.value,
      status: 'In Library'
    };

    if (
      !bookData.title ||
      !bookData.author ||
      !bookData.publication_date ||
      !bookData.type ||
      !bookData.department_id
    ) {
      showModalAlert("Please fill in all required fields.", "warning");
      return;
    }

    const existingBooksResult = await insertDB("select", "books", "*", null);
    const existingBooks = existingBooksResult.data || [];

    if (existingBooks.length > 0) {
      // Find the highest book_id
      const maxBookId = Math.max(...existingBooks.map(book => parseInt(book.book_id) || 0));
      bookData.book_id = maxBookId + 1;
    } else {
      // No books exist, start with 1
      bookData.book_id = 1;
    }

    // Get number of copies (default 1 if empty or invalid)
    const numberOfCopies = parseInt(copiesInput.value) || 1;

    // Call the insertBook function
    const bookResult = await insertBook(bookData, numberOfCopies);

    console.log("Book added successfully:", bookResult);

    // Close modal first
    const bsModal = bootstrap.Modal.getInstance(modal);
    if (bsModal) bsModal.hide();

    // Show success confirmation modal with reload option
    showConfirmationModal(
      "Success",
      `Book "${bookData.title}" with ${numberOfCopies} copy/copies has been added successfully. Reload page to see changes?`,
      () => {
        window.location.reload();
      },
      () => {
        // Reset inputs if they choose not to reload
        modal.querySelectorAll('input, select').forEach(el => (el.value = ""));
      }
    );

  } catch (error) {
    console.error("Error adding book:", error);
    showModalAlert("Error adding book: " + error.message, "danger");
  }
}

// Helper function to show alert in modal
function showModalAlert(message, type = "info") {
  const alertModal = document.createElement('div');
  alertModal.className = 'modal fade';
  alertModal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header bg-${type} text-white">
          <h5 class="modal-title">${type === 'danger' ? 'Error' : type === 'warning' ? 'Warning' : 'Notice'}</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">OK</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(alertModal);
  const bsModal = new bootstrap.Modal(alertModal);
  bsModal.show();
  alertModal.addEventListener('hidden.bs.modal', () => alertModal.remove());
}

// Helper function to show confirmation modal
function showConfirmationModal(title, message, onConfirm, onCancel) {
  const confirmModal = document.createElement('div');
  confirmModal.className = 'modal fade';
  confirmModal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header bg-success text-white">
          <h5 class="modal-title">${title}</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" id="confirmBtn">Okay</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(confirmModal);
  const bsModal = new bootstrap.Modal(confirmModal);
  
  confirmModal.querySelector('#confirmBtn').addEventListener('click', () => {
    bsModal.hide();
    if (onConfirm) onConfirm();
  });
  
  bsModal.show();
  confirmModal.addEventListener('hidden.bs.modal', () => confirmModal.remove());
}