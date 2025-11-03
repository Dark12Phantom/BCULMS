let currentDepartmentFilter = null;

function updateFilterButtonText(text) {
  const filterButton = document.querySelector('.btn-group .btn-secondary');
  if (filterButton) {
    filterButton.innerHTML = text;
  }
}

function getCurrentDepartmentFilter() {
  return currentDepartmentFilter;
}