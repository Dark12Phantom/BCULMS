/**
 * Archived Books Management Functions
 * Handles loading, searching, filtering, restoring, and permanently deleting archived books
 */

let currentDepartmentFilter = null;
let allArchivedBooks = [];
let filteredArchivedBooks = [];

/**
 * Load all archived books with their department and copy information
 */
async function loadArchivedBooks() {
  try {
    const tbody = document.getElementById('archivedBooksTableBody');
    const noResults = document.getElementById('noResults');
    
    // Show loading state
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">
          <i class="bi bi-archive me-2" aria-hidden="true"></i>
          Loading archived books...
        </td>
      </tr>
    `;

    // Get archived books
    const archivedBooksResult = await getArchivedBooks();
    const archivedBooks = archivedBooksResult?.data || [];
    
    if (archivedBooks.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted">
            <i class="bi bi-archive me-2" aria-hidden="true"></i>
            No archived books found.
          </td>
        </tr>
      `;
      allArchivedBooks = [];
      filteredArchivedBooks = [];
      return;
    }

    // Get department information for all books
    const bookIds = archivedBooks.map(book => book.book_id);
    let books = [];
    
    if (bookIds.length > 0) {
      // Build a WHERE clause for multiple book IDs
      const placeholders = bookIds.map(() => '?').join(', ');
      const query = `SELECT * FROM books WHERE book_id IN (${placeholders})`;
      const stmt = db.prepare(query);
      stmt.run(bookIds);
      
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      books = results;
    }
    
    // Create a map of book details
    const bookDetailsMap = {};
    for (const book of books) {
      bookDetailsMap[book.book_id] = book;
    }

    // Get department names
    const departmentIds = [...new Set(books.map(book => book.department_id))];
    let departments = [];
    
    if (departmentIds.length > 0) {
      // Build a WHERE clause for multiple department IDs
      const placeholders = departmentIds.map(() => '?').join(', ');
      const query = `SELECT * FROM department WHERE department_id IN (${placeholders})`;
      const stmt = db.prepare(query);
      stmt.run(departmentIds);
      
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      departments = results;
    }
    
    const departmentMap = {};
    for (const dept of departments) {
      departmentMap[dept.department_id] = dept.name;
    }

    // Get copy counts for all archived books
    const archivedBooksWithDetails = [];
    for (const archivedBook of archivedBooks) {
      const bookDetails = bookDetailsMap[archivedBook.book_id] || null;
      const copyCountResult = await insertDB("select", "archived_book_copy", "COUNT(*) as count", { book_id: archivedBook.book_id });
      const copyCount = copyCountResult?.data?.[0]?.count || 0;

      const author = archivedBook.author || (bookDetails && bookDetails.author) || 'Unknown';
      const publication_date = archivedBook.publication_date || (bookDetails && bookDetails.publication_date) || null;
      const department_id = (bookDetails && bookDetails.department_id) || null;
      const department_name = department_id ? (departmentMap[department_id] || 'Unknown Department') : 'Unknown Department';

      archivedBooksWithDetails.push({
        ...archivedBook,
        author,
        publication_date,
        department_id,
        department_name,
        archived_copies: copyCount,
      });
    }

    allArchivedBooks = archivedBooksWithDetails;
    filteredArchivedBooks = [...allArchivedBooks];
    
    renderArchivedBooksTable(filteredArchivedBooks);
    
  } catch (error) {
    console.error('Error loading archived books:', error);
    const tbody = document.getElementById('archivedBooksTableBody');
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger">
          <i class="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
          Error loading archived books. Please try again.
        </td>
      </tr>
    `;
  }
}

/**
 * Render archived books table
 */
function renderArchivedBooksTable(books) {
  const tbody = document.getElementById('archivedBooksTableBody');
  const noResults = document.getElementById('noResults');
  
  if (books.length === 0) {
    tbody.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }
  
  noResults.style.display = 'none';
  
  tbody.innerHTML = books.map(book => `
    <tr>
      <td><strong>${escapeHtml(book.book_title)}</strong></td>
      <td>${escapeHtml(book.author)}</td>
      <td>${formatDate(book.publication_date)}</td>
      <td>${escapeHtml(book.department_name)}</td>
      <td>
        <span class="badge bg-secondary">
          <i class="bi bi-box me-1"></i>${book.archived_copies} copies
        </span>
      </td>
      <td>${formatDate(book.archive_date)}</td>
      <td>
        <div class="btn-group btn-group-sm" role="group">
          <button type="button" 
                  class="btn btn-outline-primary" 
                  onclick="viewArchivedBookDetails('${book.book_id}')"
                  title="View Details">
            <i class="bi bi-eye"></i>
          </button>
          <button type="button" 
                  class="btn btn-outline-success" 
                  onclick="showRestoreModal('${book.book_id}', '${escapeHtml(book.book_title)}', '${escapeHtml(book.author)}')"
                  title="Restore Book">
            <i class="bi bi-arrow-counterclockwise"></i>
          </button>
          <button type="button" 
                  class="btn btn-outline-danger" 
                  onclick="showDeleteModal('${book.book_id}', '${escapeHtml(book.book_title)}', '${escapeHtml(book.author)}')"
                  title="Delete Permanently">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

/**
 * Search archived books
 */
function searchArchivedBooks() {
  const searchTerm = document.getElementById('searchArchivedBooks').value.toLowerCase();
  
  if (!searchTerm) {
    filteredArchivedBooks = [...allArchivedBooks];
  } else {
    filteredArchivedBooks = allArchivedBooks.filter(book => 
      book.book_title.toLowerCase().includes(searchTerm) ||
      book.author.toLowerCase().includes(searchTerm) ||
      book.department_name.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply department filter if set
  if (currentDepartmentFilter) {
    filteredArchivedBooks = filteredArchivedBooks.filter(book => 
      book.department_id === currentDepartmentFilter
    );
  }
  
  renderArchivedBooksTable(filteredArchivedBooks);
}

/**
 * Filter archived books by department
 */
async function filterArchivedBooksByDepartment(departmentId, departmentName) {
  currentDepartmentFilter = departmentId;
  
  // Update filter button text
  const filterButtonText = document.getElementById('filterButtonText');
  filterButtonText.textContent = departmentName;
  
  // Apply filter
  if (!departmentId) {
    filteredArchivedBooks = [...allArchivedBooks];
  } else {
    filteredArchivedBooks = allArchivedBooks.filter(book => book.department_id === departmentId);
  }
  
  // Apply search filter if set
  const searchTerm = document.getElementById('searchArchivedBooks').value.toLowerCase();
  if (searchTerm) {
    filteredArchivedBooks = filteredArchivedBooks.filter(book => 
      book.book_title.toLowerCase().includes(searchTerm) ||
      book.author.toLowerCase().includes(searchTerm) ||
      book.department_name.toLowerCase().includes(searchTerm)
    );
  }
  
  renderArchivedBooksTable(filteredArchivedBooks);
}

/**
 * Load departments for filter dropdown
 */
async function loadDepartmentsForFilter() {
  try {
    const result = await handleSelect("department");
    const departments = result?.data || [];
    
    const departmentFilter = document.getElementById('departmentFilter');
    departmentFilter.innerHTML = '';
    
    // Add "All Departments" option
    const allLi = document.createElement('li');
    const allA = document.createElement('a');
    allA.classList.add('dropdown-item');
    allA.href = '#';
    allA.textContent = 'All Departments';
    allA.addEventListener('click', (e) => {
      e.preventDefault();
      filterArchivedBooksByDepartment(null, 'Filter');
    });
    allLi.appendChild(allA);
    departmentFilter.appendChild(allLi);
    
    // Add separator
    const separator = document.createElement('li');
    separator.innerHTML = '<hr class="dropdown-divider">';
    departmentFilter.appendChild(separator);
    
    // Add department options
    departments.forEach(dept => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.classList.add('dropdown-item');
      a.href = '#';
      a.textContent = dept.name;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        filterArchivedBooksByDepartment(dept.department_id, dept.name);
      });
      li.appendChild(a);
      departmentFilter.appendChild(li);
    });
    
  } catch (error) {
    console.error('Error loading departments:', error);
  }
}

/**
 * View archived book details
 */
async function viewArchivedBookDetails(bookId) {
  try {
    // Get archived book details
    const archivedBookResult = await getArchivedBooks({ book_id: bookId });
    const archivedBook = archivedBookResult?.data?.[0];
    
    if (!archivedBook) {
      showModalAlert('Archived book not found.', 'warning');
      return;
    }
    
    // Get original book details
    const bookResult = await insertDB("select", "books", "*", { book_id: bookId });
    const book = bookResult?.data?.[0];
    
    // Get archived copies
    const copiesResult = await insertDB("select", "archived_book_copy", "*", { book_id: bookId });
    const copies = copiesResult?.data || [];
    
    // Show details in a modal or alert
    let detailsHtml = `
      <strong>Title:</strong> ${escapeHtml(archivedBook.book_title)}<br>
      <strong>Archive Date:</strong> ${formatDate(archivedBook.archive_date)}<br>
      <strong>Archived Copies:</strong> ${copies.length}<br>
    `;
    
    if (book) {
      detailsHtml += `
        <strong>Author:</strong> ${escapeHtml(book.author)}<br>
        <strong>Publication Date:</strong> ${formatDate(book.publication_date)}<br>
        <strong>Type:</strong> ${escapeHtml(book.type)}<br>
      `;
    }
    
    if (copies.length > 0) {
      detailsHtml += '<br><strong>Archived Copies Details:</strong><br>';
      copies.forEach(copy => {
        detailsHtml += `
          <div class="border rounded p-2 mb-2">
            <strong>Copy ID:</strong> ${copy.copy_id}<br>
            <strong>Status:</strong> ${copy.status}<br>
            <strong>Condition:</strong> ${copy.condition}<br>
            <strong>Archived At:</strong> ${formatDate(copy.archived_at)}
          </div>
        `;
      });
    }
    
    showModalAlert(detailsHtml, 'info', 'Archived Book Details');
    
  } catch (error) {
    console.error('Error viewing archived book details:', error);
    showModalAlert('Error loading archived book details.', 'danger');
  }
}

/**
 * Show restore book modal
 */
function showRestoreModal(bookId, bookTitle, bookAuthor) {
  document.getElementById('restoreBookTitle').textContent = bookTitle;
  document.getElementById('restoreBookAuthor').textContent = bookAuthor;
  
  const modal = new bootstrap.Modal(document.getElementById('restoreBookModal'));
  modal.show();
  
  // Store book ID for restore operation
  document.getElementById('confirmRestoreBtn').onclick = async () => {
    await restoreArchivedBook(bookId);
    modal.hide();
  };
}

/**
 * Show delete permanently modal
 */
function showDeleteModal(bookId, bookTitle, bookAuthor) {
  document.getElementById('deleteBookTitle').textContent = bookTitle;
  document.getElementById('deleteBookAuthor').textContent = bookAuthor;
  
  const modal = new bootstrap.Modal(document.getElementById('deletePermanentlyModal'));
  modal.show();
  
  // Reset checkbox
  const confirmCheck = document.getElementById('confirmDeleteCheck');
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  confirmCheck.checked = false;
  confirmBtn.disabled = true;
  
  // Enable/disable confirm button based on checkbox
  confirmCheck.onchange = () => {
    confirmBtn.disabled = !confirmCheck.checked;
  };
  
  // Store book ID for delete operation
  confirmBtn.onclick = async () => {
    await deleteArchivedBookPermanently(bookId);
    modal.hide();
  };
}

/**
 * Restore archived book
 */
async function restoreArchivedBook(bookId) {
  try {
    // Check user role
    const user = await requireRole(["Admin", "Librarian"]);
    
    // Get archived book details
    const archivedBookResult = await getArchivedBooks({ book_id: bookId });
    const archivedBook = archivedBookResult?.data?.[0];
    
    if (!archivedBook) {
      showModalAlert('Archived book not found.', 'warning');
      return;
    }
    
    // Restore the book
    const result = await libraryOperations.restoreArchivedBook(bookId);
    
    if (result.success) {
      showModalAlert('Book restored successfully!', 'success');
      // Reload archived books
      await loadArchivedBooks();
    } else {
      showModalAlert('Error restoring book: ' + result.message, 'danger');
    }
    
  } catch (error) {
    console.error('Error restoring archived book:', error);
    showModalAlert('Error restoring archived book.', 'danger');
  }
}

/**
 * Delete archived book permanently
 */
async function deleteArchivedBookPermanently(bookId) {
  try {
    // Check user role
    const user = await requireRole(["Admin", "Librarian"]);
    
    // Get archived book details
    const archivedBookResult = await getArchivedBooks({ book_id: bookId });
    const archivedBook = archivedBookResult?.data?.[0];
    
    if (!archivedBook) {
      showModalAlert('Archived book not found.', 'warning');
      return;
    }
    
    // Delete permanently using transaction
    await runDBTransaction(async () => {
      // Delete from archived_books
      await insertDB("delete", "archived_books", null, { book_id: bookId });
      
      // Delete from archived_book_copy
      await insertDB("delete", "archived_book_copy", null, { book_id: bookId });
      
      // Delete from archived_transaction_borrow
      await insertDB("delete", "archived_transaction_borrow", null, { book_id: bookId });
      
      // Log the deletion
      await insertDB("insert", "transaction_library", {
        book_id: bookId,
        operation_type: "Delete Permanently",
        before_values: JSON.stringify({ title: archivedBook.book_title }),
        after_values: JSON.stringify({ action: "Permanently Deleted" }),
        staff_id: user.id,
        timestamp: libraryOperations.formatPHT12(new Date())
      });
    });
    
    showModalAlert('Book permanently deleted!', 'success');
    // Reload archived books
    await loadArchivedBooks();
    
  } catch (error) {
    console.error('Error deleting archived book permanently:', error);
    showModalAlert('Error deleting archived book permanently.', 'danger');
  }
}

/**
 * Utility function to escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Initialize archived books page
 */
document.addEventListener('DOMContentLoaded', async () => {
  await waitForDBReady();
  await loadArchivedBooks();
  await loadDepartmentsForFilter();
  const searchInput = document.getElementById('searchArchivedBooks');
  searchInput.addEventListener('input', searchArchivedBooks);
  try {
    const user = await getCurrentUser();
    if (user && (user.role === 'Admin' || user.role === 'Librarian')) {
      console.log('User has archived books management access');
    } else {
      console.log('User does not have archived books management access');
    }
  } catch (error) {
    console.error('Error checking user role:', error);
  }
});

// Make functions available globally
window.loadArchivedBooks = loadArchivedBooks;
window.searchArchivedBooks = searchArchivedBooks;
window.viewArchivedBookDetails = viewArchivedBookDetails;
window.showRestoreModal = showRestoreModal;
window.showDeleteModal = showDeleteModal;
window.restoreArchivedBook = restoreArchivedBook;
window.deleteArchivedBookPermanently = deleteArchivedBookPermanently;
