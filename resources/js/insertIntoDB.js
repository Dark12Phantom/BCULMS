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

    // Validation
    if (
      !bookData.title ||
      !bookData.author ||
      !bookData.publication_date ||
      !bookData.type ||
      !bookData.department_id
    ) {
      console.warn("Please fill in all required fields.");
      return;
    }

    // Get number of copies (default 1 if empty or invalid)
    const numberOfCopies = parseInt(copiesInput.value) || 1;

    // Call the insertBook function
    const bookResult = await insertBook(bookData, numberOfCopies);

    console.log("Book added successfully:", bookResult);

    // Optionally reset modal inputs after success
    modal.querySelectorAll('input, select').forEach(el => (el.value = ""));
    const bsModal = bootstrap.Modal.getInstance(modal);
    if (bsModal) bsModal.hide();

  } catch (error) {
    console.error("Error adding book:", error);
  }
}
