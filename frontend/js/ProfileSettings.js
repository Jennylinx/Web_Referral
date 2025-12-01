// Admin ProfileSettings.js

document.addEventListener("DOMContentLoaded", async () => {
  // --------------------------
  // ACTIVE NAV ITEM HIGHLIGHT
  // --------------------------
  const navItems = document.querySelectorAll(".nav-item");
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();

  navItems.forEach(item => {
    const itemHref = item.getAttribute("href").split("/").pop().toLowerCase();
    item.classList.toggle("active", itemHref === currentPage);
  });

  // --------------------------
  // PROFILE DROPDOWN
  // --------------------------
  const profileButton = document.getElementById("profileButton");
  const profileDropdown = document.getElementById("profileDropdown");

  profileButton.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle("show");
  });

  window.addEventListener("click", (event) => {
    if (!event.target.closest("#profileDropdown")) {
      profileDropdown.classList.remove("show");
    }
  });
  try {
    const userProfile = await apiClient.getUserProfile();
    if (userProfile.success && userProfile.data) {
      const welcomeTitle = document.getElementById("welcomeTitle");
      if (welcomeTitle) {
        welcomeTitle.textContent = `Welcome back, ${userProfile.data.fullName || userProfile.data.username}`;
      }
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
  }
  // --------------------------
  // LOAD USER PROFILE
  // --------------------------
  let currentUser = null;
  let isEditMode = false;

  async function loadUserProfile() {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        showAlert("Please login first", "error");
        setTimeout(() => {
          window.location.href = "../html/LoginForm.html";
        }, 2000);
        return;
      }

      const response = await fetch("http://localhost:3000/api/users/profile", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success && data.data) {
        currentUser = data.data;
        displayUserProfile(currentUser);
        updateSidebarForRole(currentUser.role);
      } else {
        showAlert("Failed to load profile", "error");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      showAlert("Error loading profile", "error");
    }

  }

  // --------------------------
  // DISPLAY USER PROFILE
  // --------------------------
  function displayUserProfile(user) {
    // Split full name
    const nameParts = user.fullName.split(" ");

    //Update profile header
    const profileName = document.querySelector(".profile-text h3");
    const profileRole = document.querySelector(".profile-text p");
    
    if (profileName) profileName.textContent = user.username;
    if (profileRole) profileRole.textContent = getRoleDisplayName(user.role);

    // Update profile details inputs
    const inputs = document.querySelectorAll(".profile-details input");
    if (inputs[0]) inputs[0].value = user.fullname; // First Name
    if (inputs[1]) inputs[1].value = user.email;  // Last Name

    // Update account information
    const accountInputs = document.querySelectorAll(".account-info input");
    if (accountInputs[0]) accountInputs[0].value = user.email;
    if (accountInputs[1]) {
      const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never";
      accountInputs[1].value = lastLogin;
    }

    // Update account status
    const statusSpan = document.querySelector(".account-info .status");
    if (statusSpan) {
      statusSpan.textContent = user.isActive ? "ACTIVE" : "INACTIVE";
      statusSpan.className = user.isActive ? "status approved" : "status pending";
    }

    // Make all inputs readonly initially
    setInputsReadonly(true);

    // Show role-specific information
    displayRoleSpecificInfo(user);
  }

  // --------------------------
  // GET ROLE DISPLAY NAME
  // --------------------------
  function getRoleDisplayName(role) {
    const roleNames = {
      "Admin": "Administrator",
      "Teacher": "Teacher / Adviser",
      "Counselor": "Counselor"
    };
    return roleNames[role] || role;
  }

  // --------------------------
  // UPDATE SIDEBAR FOR ROLE
  // --------------------------
  function updateSidebarForRole(role) {
    const logoTitle = document.querySelector(".logo-title");
    
    if (logoTitle) {
      switch(role) {
        case "Admin":
          logoTitle.textContent = "Admin Portal";
          break;
        case "Teacher":
          logoTitle.textContent = "Adviser Portal";
          break;
        case "Counselor":
          logoTitle.textContent = "Counselor Portal";
          break;
        default:
          logoTitle.textContent = "Management System";
      }
    }
  }

  // --------------------------
  // DISPLAY ROLE-SPECIFIC INFO
  // --------------------------
  function displayRoleSpecificInfo(user) {
    // Add department info for teachers
    if (user.role === "Teacher" && user.department) {
      const titleInput = document.querySelectorAll(".profile-details input")[3];
      if (titleInput) {
        titleInput.value = `${user.role} - ${user.department}`;
      }
    }

    // Show additional info based on role
    const profileText = document.querySelector(".profile-text");
    if (profileText && !document.querySelector(".role-badge")) {
      const roleBadge = document.createElement("div");
      roleBadge.className = "role-badge";
      roleBadge.style.cssText = `
        display: inline-block;
        padding: 4px 12px;
        margin-top: 8px;
        background: ${getRoleBadgeColor(user.role)};
        color: white;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      `;
      roleBadge.textContent = user.role.toUpperCase();
      profileText.appendChild(roleBadge);
    }
  }

  // --------------------------
  // GET ROLE BADGE COLOR
  // --------------------------
  function getRoleBadgeColor(role) {
    const colors = {
      "Admin": "#e74c3c",
      "Teacher": "#3498db",
      "Counselor": "#2ecc71"
    };
    return colors[role] || "#95a5a6";
  }

  // --------------------------
  // SET INPUTS READONLY
  // --------------------------
  function setInputsReadonly(readonly) {
    const editableInputs = document.querySelectorAll(".profile-details input");
    editableInputs.forEach((input, index) => {
      // Don't allow editing title/role (index 3)
      if (index !== 3) {
        input.readOnly = readonly;
        input.style.backgroundColor = readonly ? "#f8f9fa" : "white";
        input.style.cursor = readonly ? "not-allowed" : "text";
      } else {
        input.readOnly = true;
        input.style.backgroundColor = "#f8f9fa";
        input.style.cursor = "not-allowed";
      }
    });

    // Account info is always readonly
    const accountInputs = document.querySelectorAll(".account-info input");
    accountInputs.forEach(input => {
      input.readOnly = true;
      input.style.backgroundColor = "#f8f9fa";
      input.style.cursor = "not-allowed";
    });
  }

  // --------------------------
  // EDIT PROFILE BUTTON
  // --------------------------
  const editBtn = document.getElementById("edit-btn");
  
  editBtn.addEventListener("click", async () => {
    if (!currentUser) {
      showAlert("User data not loaded", "error");
      return;
    }

    if (!isEditMode) {
      // Enable edit mode
      isEditMode = true;
      editBtn.textContent = "Save Changes";
      editBtn.style.backgroundColor = "#2ecc71";
      setInputsReadonly(false);
      showAlert("Edit mode enabled", "info");
    } else {
      // Save changes
      await saveProfileChanges();
    }
  });

  // --------------------------
  // SAVE PROFILE CHANGES
  // --------------------------
  async function saveProfileChanges() {
    try {
      const inputs = document.querySelectorAll(".profile-details input");
      const firstName = inputs[0].value.trim();
      const lastName = inputs[1].value.trim();
      const username = inputs[2].value.trim();

      if (!firstName || !lastName || !username) {
        showAlert("Please fill all required fields", "error");
        return;
      }

      const fullName = `${firstName} ${lastName}`.trim();

      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/api/users/${currentUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName,
          username
        })
      });

      const data = await response.json();

      if (data.success) {
        showAlert("Profile updated successfully!", "success");
        isEditMode = false;
        editBtn.textContent = "Edit Profile";
        editBtn.style.backgroundColor = "#007bff";
        
        // Reload profile
        await loadUserProfile();
      } else {
        showAlert(data.error || "Failed to update profile", "error");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      showAlert("Error saving profile", "error");
    }
  }

  // --------------------------
  // ALERT FUNCTION
  // --------------------------
  function showAlert(message, type = "info") {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${type === "success" ? "#4CAF50" : type === "error" ? "#f44336" : "#2196F3"};
      color: white;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
      alertDiv.style.animation = "slideOut 0.3s ease";
      setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
  }

  // --------------------------
  // ADD LOGOUT FUNCTIONALITY
  // --------------------------
  const logoutBtn = document.querySelector('a[href*="LoginForm.html"]');
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      
      // Clear all stored data
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to login
      window.location.href = "../html/LoginForm.html";
    });
  }

  // --------------------------
  // LOAD PROFILE ON PAGE LOAD
  // --------------------------
  loadUserProfile();
});