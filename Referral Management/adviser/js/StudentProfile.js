document.addEventListener("DOMContentLoaded", () => {
  // -------------------------- NAV ACTIVE --------------------------
  const navItems = document.querySelectorAll(".nav-item");
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();
  navItems.forEach(item => {
    const itemHref = item.getAttribute("href").split("/").pop().toLowerCase();
    item.classList.toggle("active", itemHref === currentPage);
  });

  // -------------------------- PROFILE DROPDOWN --------------------------
  const profileButton = document.getElementById("profileButton");
  const profileDropdown = document.getElementById("profileDropdown");
  profileButton.addEventListener("click", e => {
    e.stopPropagation();
    profileDropdown.classList.toggle("show");
  });
  window.addEventListener("click", event => {
    if (!event.target.closest("#profileDropdown")) {
      profileDropdown.classList.remove("show");
    }
  });

  // -------------------------- SEARCH & FILTER --------------------------
  const searchInput = document.getElementById("searchInput");
  const gradeFilter = document.getElementById("gradeFilter");
  const studentTableBody = document.getElementById("studentTable");

  function filterStudents() {
    const searchValue = searchInput.value.toLowerCase().trim();
    const gradeValue = gradeFilter.value.toLowerCase().trim();
    const allRows = studentTableBody.querySelectorAll("tr");

    allRows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const grade = row.cells[2]?.textContent.toLowerCase().trim() || "";
      const matchesSearch = text.includes(searchValue);

      let matchesGrade = false;
      if (gradeValue === "all") matchesGrade = true;
      else if (gradeValue === "elem" && grade.includes("elementary")) matchesGrade = true;
      else if (gradeValue === "jhs" && grade.includes("jhs")) matchesGrade = true;
      else if (gradeValue === "shs" && grade.includes("shs")) matchesGrade = true;

      row.style.display = (matchesSearch && matchesGrade) ? "" : "none";
    });
  }

  searchInput.addEventListener("keyup", filterStudents);
  gradeFilter.addEventListener("change", filterStudents);

});