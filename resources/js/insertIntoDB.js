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

    await renderBooks(1);
    showModalAlert(`Book "${bookData.title}" with ${numberOfCopies} copy/copies has been added successfully.`, "success");
    modal.querySelectorAll('input, select').forEach(el => (el.value = ""));

  } catch (error) {
    console.error("Error adding book:", error);
    showModalAlert("Error adding book: " + error.message, "danger");
  }
}

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

function parseBulkBooks(textareaContent, dateFormat) {
  const lines = textareaContent.trim().split('\n').filter(line => line.trim());
  const books = [];
  const errors = [];

  lines.forEach((line, index) => {
    const parts = line.split('|').map(part => part.trim());
    
    if (parts.length !== 6) {
      errors.push(`Line ${index + 1}: Expected 6 fields, got ${parts.length}`);
      return;
    }

    const [title, author, publicationDate, type, department, copiesStr] = parts;
    
    // Validate required fields
    if (!title || !author || !publicationDate || !type || !department) {
      errors.push(`Line ${index + 1}: Missing required fields`);
      return;
    }

    // Validate and parse copies
    const copies = parseInt(copiesStr) || 1;
    if (copies < 1) {
      errors.push(`Line ${index + 1}: Copies must be at least 1`);
      return;
    }

    // Validate date based on format
    let validDate = false;
    if (dateFormat === 'full') {
      validDate = /^\d{4}-\d{2}-\d{2}$/.test(publicationDate);
    } else if (dateFormat === 'month') {
      validDate = /^\d{4}-\d{2}$/.test(publicationDate);
    } else if (dateFormat === 'year') {
      validDate = /^\d{4}$/.test(publicationDate);
    }

    if (!validDate) {
      errors.push(`Line ${index + 1}: Invalid date format for ${dateFormat}`);
      return;
    }

    books.push({
      title,
      author,
      publication_date: publicationDate,
      type,
      department_id: department,
      copies,
      status: 'In Library'
    });
  });

  return { books, errors };
}

async function addBooksToDB() {
  try {
    const modal = document.querySelector('#addBookContent');
    const textarea = document.getElementById('bulkBooksTextarea');
    const dateFormat = document.getElementById('bulkDateFormat').value;
    
    const content = textarea.value.trim();
    if (!content) {
      showModalAlert("Please enter book data in the textarea.", "warning");
      return;
    }

    const { books, errors } = parseBulkBooks(content, dateFormat);
    
    if (errors.length > 0) {
      showModalAlert("Validation errors found:\n" + errors.join('\n'), "danger");
      return;
    }

    if (books.length === 0) {
      showModalAlert("No valid book entries found.", "warning");
      return;
    }

    // Get existing books to determine starting book_id
    const existingBooksResult = await insertDB("select", "books", "*", null);
    const existingBooks = existingBooksResult.data || [];
    let nextBookId = 1;
    
    if (existingBooks.length > 0) {
      const maxBookId = Math.max(...existingBooks.map(book => parseInt(book.book_id) || 0));
      nextBookId = maxBookId + 1;
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each book
    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      book.book_id = nextBookId + i;
      
      try {
        await insertBook(book, book.copies);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Book "${book.title}": ${error.message}`);
      }
    }

    // Close modal
    const bsModal = bootstrap.Modal.getInstance(modal);
    if (bsModal) bsModal.hide();

    // Show results
    let message = `Bulk add completed: ${results.success} books added successfully`;
    if (results.failed > 0) {
      message += `, ${results.failed} books failed.`;
      if (results.errors.length > 0) {
        message += `\n\nErrors:\n${results.errors.join('\n')}`;
      }
    }

    const messageType = results.failed > 0 ? "warning" : "success";
    await renderBooks(1);
    showModalAlert(message, messageType);
    textarea.value = "";

  } catch (error) {
    console.error("Error in bulk add:", error);
    showModalAlert("Error processing bulk add: " + error.message, "danger");
  }
}

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

async function addStudentToDB() {
  try {
    const modal = document.querySelector('#addStudentContent');

    const studentIdInput = modal.querySelector('input[name="student_id"]');
    const studentNameInput = modal.querySelector('input[name="student_name"]');
    const courseSelect = modal.querySelector('select[name="course_id"]');
    const yearInput = modal.querySelector('input[name="student_year"]');
    const contactInput = modal.querySelector('input[name="contact_number"]');

    const studentData = {
      student_id: studentIdInput.value.trim(),
      student_name: studentNameInput.value.trim(),
      course_id: courseSelect.value,
      student_year: parseInt(yearInput.value),
      contact_number: contactInput.value.trim(),
      status: 'Active'
    };

    // Validate required fields
    if (
      !studentData.student_id ||
      !studentData.student_name ||
      !studentData.course_id ||
      !studentData.student_year ||
      !studentData.contact_number
    ) {
      showModalAlert("Please fill in all required fields.", "warning");
      return;
    }

    // Validate student year (1-5)
    if (studentData.student_year < 1 || studentData.student_year > 5) {
      showModalAlert("Year level must be between 1 and 5.", "warning");
      return;
    }

    // Validate contact number (should be 11 digits)
    if (!/^\d{11}$/.test(studentData.contact_number)) {
      showModalAlert("Contact number must be exactly 11 digits.", "warning");
      return;
    }

    // Check if student ID already exists
    const existingStudent = await insertDB("select", "students", "*", { student_id: studentData.student_id });
    if (existingStudent.data && existingStudent.data.length > 0) {
      showModalAlert("Student ID already exists.", "warning");
      return;
    }

    // Insert student using the existing insertStudent function
    const result = await insertStudent(studentData);

    console.log("Student added successfully:", result);

    // Close modal first
    const bsModal = bootstrap.Modal.getInstance(modal);
    if (bsModal) bsModal.hide();

    await renderStudents(1);
    showModalAlert(`Student "${studentData.student_name}" has been added successfully.`, "success");
    modal.querySelectorAll('input, select').forEach(el => (el.value = ""));
    const activeEl = document.getElementById('activeStudents');
    if (activeEl && typeof dashboardTotalStudents === 'function') {
      await dashboardTotalStudents();
    }

  } catch (error) {
    console.error("Error adding student:", error);
    showModalAlert("Error adding student: " + error.message, "danger");
  }
}
