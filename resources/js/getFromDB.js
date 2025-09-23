const departmentFilter = document.querySelector("#departmentFilter");

async function selectDepartments() {
  if (!departmentFilter) {
    console.log("Filter not loaded");
    return;
  }
  try {
    const result = await handleSelect("department");
    console.log("departments:", result);

    departmentFilter.innerHTML = "";

    (result.data || []).forEach((dept) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.classList.add("dropdown-item");
      a.href = "#";
      a.textContent = dept.name;
      a.dataset.value = dept.department_id;
      li.appendChild(a);
      departmentFilter.appendChild(li);
    });
    return result;
  } catch (error) {
    console.error("Failed to get departments:", error);
  }
}

async function getAllBooks() {
  try {
    const result = await getBooks({ status: "In Library" });
    const books = result.data || []; 
    console.log("Books:", books);

    for (let book of books) {
      const copiesResult = await getBookCopyNumber({ book_id: book.book_id });
      const copies = copiesResult.data || [];
      book.totalCopies = copies[0]?.totalCopies || 0;
    }
    return books;
  } catch (error) {
    console.error("Failed to get books:", error);
  }
}
