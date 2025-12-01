//Counselor/Staff ProfileSettings.js

document.addEventListener("DOMContentLoaded", () => {
  // Highlight active nav
  const navItems = document.querySelectorAll(".nav-item");
  const currentPage = window.location.pathname.split("/").pop();
  navItems.forEach((item) => {
    if (item.getAttribute("href") === currentPage) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // --- Dropdown ---
  const profileButton = document.getElementById("profileButton");
  const profileDropdown = document.getElementById("profileDropdown");

  profileButton.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent immediate close
    profileDropdown.classList.toggle("show");
  });

  // close dropdown if clicked outside
  window.addEventListener("click", (event) => {
    if (!event.target.closest("#profileDropdown")) {
      profileDropdown.classList.remove("show");
    }
  });
});

document.getElementById('edit-btn').addEventListener('click', () => {
  alert('Edit profile feature coming soon!');
});