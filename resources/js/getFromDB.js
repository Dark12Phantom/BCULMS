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
