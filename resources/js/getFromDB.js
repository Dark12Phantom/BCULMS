const departmentFilter = document.querySelector("#departmentFilter");
const departmentLoader = document.querySelector("#departmentSelect");
const courseLoader = document.querySelector("#courseSelect");

async function loadCourses(){
  if (!courseLoader) {
    console.log("Course select not found");
    return;
  }

  try {
    const cresult = await getCourses();
    console.log("courses (for select):", cresult);
    courseLoader.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.textContent = "Select Course";
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.selected = true;
    courseLoader.appendChild(placeholder);

    (cresult.data || []).forEach((course) => {
      const opt = document.createElement("option");
      opt.value = course.course_id;
      opt.textContent = course.name;
      courseLoader.appendChild(opt);
    });
  } catch (error) {
    console.error("Failed to load courses:", error);
    courseLoader.innerHTML = `<option value="">Error loading</option>`;
  }
}

async function selectDepartments() {
  if (!departmentFilter) {
    console.log("Filter not loaded");
    return;
  }
  try {
    const result = await handleSelect("department");

    departmentFilter.innerHTML = "";

    const isStudentsPage = (window.location.pathname || "").endsWith("students.html");

    // Add "All Departments" option
    const allLi = document.createElement("li");
    const allA = document.createElement("a");
    allA.classList.add("dropdown-item");
    allA.href = "#";
    allA.textContent = "All Departments";
    allA.dataset.value = "";
    allA.addEventListener("click", async (e) => {
      e.preventDefault();
      currentDepartmentFilter = null;
      if (isStudentsPage && typeof renderStudents === 'function') {
        await renderStudents(1); // Reset to page 1 with no filter
      } else if (typeof renderBooks === 'function') {
        await renderBooks(1);
      }
      updateFilterButtonText("Filter");
    });
    allLi.appendChild(allA);
    departmentFilter.appendChild(allLi);

    // Add separator
    const separator = document.createElement("li");
    separator.innerHTML = '<hr class="dropdown-divider">';
    departmentFilter.appendChild(separator);

    // Add department options
    (result.data || []).forEach((dept) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.classList.add("dropdown-item");
      a.href = "#";
      a.textContent = dept.name;
      a.dataset.value = dept.department_id;
      
      // Add click event to filter books
      a.addEventListener("click", async (e) => {
        e.preventDefault();
        currentDepartmentFilter = dept.department_id;
        if (isStudentsPage && typeof renderStudents === 'function') {
          await renderStudents(1); // Reset to page 1 with filter
        } else if (typeof renderBooks === 'function') {
          await renderBooks(1);
        }
        updateFilterButtonText(dept.name);
      });
      
      li.appendChild(a);
      departmentFilter.appendChild(li);
    });
    
    return result;
  } catch (error) {
    console.error("Failed to get departments:", error);
  }
}

async function loadDepartments(){
  if (!departmentLoader) {
    console.log("Department select not found");
    return;
  }

  try {
    const result = await handleSelect("department");

    departmentLoader.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.textContent = "Select Department";
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.selected = true;
    departmentLoader.appendChild(placeholder);

    (result.data || []).forEach((dept) => {
      const opt = document.createElement("option");
      opt.value = dept.department_id;
      opt.textContent = dept.name;
      departmentLoader.appendChild(opt);
    });
  } catch (error) {
    console.error("Failed to load departments:", error);
    departmentLoader.innerHTML = `<option value="">Error loading</option>`;
  }
}

async function getAllBooks() {
  try {
    // Apply department filter if set
    const whereClause = currentDepartmentFilter 
      ? { department_id: currentDepartmentFilter, status: "In Library" } 
      : { status: "In Library" };
    
    const result = await getBooks(whereClause);
    const books = result.data || [];

    const copyMap = await getBookCopyNumber();
    for (let book of books) {
      const id = parseInt(book.book_id, 10);
      book.totalCopies = copyMap[id] || 0;
    }
    return books;
  } catch (error) {
    console.error("Failed to get books:", error);
  }
}
