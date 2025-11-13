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

  // -------------------------- BULK UPLOAD --------------------------
  const bulkUploadBtn = document.getElementById("bulkUploadBtn");
  const bulkPopup = document.getElementById("bulkUploadPopup");
  const closeBulkPopup = document.getElementById("closeBulkPopup");
  const cancelBulkUpload = document.getElementById("cancelBulkUpload");
  const studentFileInput = document.getElementById("studentFileInput");
  const fileNameDisplay = document.getElementById("fileNameDisplay");

  bulkUploadBtn.addEventListener("click", () => {
    bulkPopup.classList.add("show");
  });

  closeBulkPopup.addEventListener("click", () => bulkPopup.classList.remove("show"));
  cancelBulkUpload.addEventListener("click", () => bulkPopup.classList.remove("show"));

  studentFileInput.addEventListener("change", () => {
    fileNameDisplay.textContent = studentFileInput.files.length > 0 ? studentFileInput.files[0].name : "";
  });

  const uploadStudentsBtn = document.getElementById("uploadStudentsBtn");

  uploadStudentsBtn.addEventListener("click", () => {
    if (!studentFileInput.files.length) return alert("Please select a file.");

    const file = studentFileInput.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const students = XLSX.utils.sheet_to_json(sheet);

      displayStudents(students);
      bulkPopup.classList.remove("show");
      studentFileInput.value = "";
      fileNameDisplay.textContent = "";
    };

    reader.readAsArrayBuffer(file);
  });

  function displayStudents(students) {
    studentTableBody.innerHTML = "";
    if (!students.length) {
      studentTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No students uploaded yet</td></tr>`;
      return;
    }

    students.forEach(student => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${student.firstName || student["Student Name"] || ""} ${student.middleName || ""} ${student.lastName || ""}</td>
        <td>${student.level || ""}</td>
        <td>${student.grade || ""}</td>
        <td>${student.contactNumber || student["Contact Number"] || ""}</td>
        <td>${student.adviser || student["Adviser"] || ""}</td>
      `;
      studentTableBody.appendChild(row);
    });

    filterStudents();
  }
});
