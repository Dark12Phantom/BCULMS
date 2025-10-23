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

async function loadDepartments(){
  if (!departmentLoader) {
    console.log("Department select not found");
    return;
  }

  try {
    const result = await handleSelect("department");
    console.log("departments (for select):", result);

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
