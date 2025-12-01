// frontend/js/UserManagement.js

document.addEventListener("DOMContentLoaded", () => {
  loadUsers();
  setupSearchFilter();
  setupFormSubmit();
  setupActionDelegation();
});

// Profile Dropdown
const profileButton = document.getElementById("profileButton");
const profileDropdown = document.getElementById("profileDropdown");
if (profileButton && profileDropdown) {
  profileButton.addEventListener("click", e => {
    e.stopPropagation();
    profileDropdown.classList.toggle("show");
  });
  window.addEventListener("click", event => {
    if (!event.target.closest("#profileDropdown")) {
      profileDropdown.classList.remove("show");
    }
  });
}

// Load Users
async function loadUsers() {
  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Loading users...</td></tr>';

  try {
    const response = await apiClient.getAllUsers();
    if (response.success && response.data.length > 0) {
      displayUsers(response.data);
    } else {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No users found</td></tr>';
    }
  } catch (error) {
    console.error(error);
    showAlert("Error", "Failed to load users", "error");
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Error loading users</td></tr>';
  }
}

// Display Users
function displayUsers(users) {
  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.fullName}</td>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td><span class="badge badge-${(user.role || '').toLowerCase()}">${user.role}</span></td>
      <td>${user.department || 'N/A'}</td>
      <td><span class="status-${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
      <td>${new Date(user.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="btn-action" data-action="toggleStatus" data-user-id="${user._id}" data-current-status="${user.isActive}" title="${user.isActive ? 'Deactivate' : 'Activate'}">
          <span class="material-symbols-outlined">${user.isActive ? 'block' : 'check_circle'}</span>
        </button>
        <button class="btn-action" data-action="resetPassword" data-user-id="${user._id}" title="Reset Password">
          <span class="material-symbols-outlined">lock_reset</span>
        </button>
        <button class="btn-action delete" data-action="deleteUser" data-user-id="${user._id}" data-user-name="${user.fullName}" title="Delete User">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </td>
    </tr>
  `).join('');
}

// Search Filter
function setupSearchFilter() {
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll("#usersTableBody tr").forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(term) ? "" : "none";
    });
  });
}

// Form Submit
function setupFormSubmit() {
  const form = document.getElementById("createUserForm");
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const formData = {
      fullName: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      username: document.getElementById("username").value.trim(),
      role: document.getElementById("role").value,
      department: document.getElementById("department").value.trim(),
      password: document.getElementById("temporaryPassword").value,
      requirePasswordChange: true
    };

    if (!formData.fullName || !formData.email || !formData.username || !formData.role || !formData.password) {
      return showAlert("Error", "Please fill in all required fields", "error");
    }

    try {
      const response = await apiClient.createUser(formData);
      if (response.success) {
        let successMessage = "User created successfully! A temporary password email was sent.";
        
        // Show additional message if Teacher was created
        if (formData.role === 'Teacher') {
          successMessage += " This teacher is now available as an adviser in the Counselor portal.";
        }
        
        showAlert("Success", successMessage, "success");
        closeCreateUserModal();
        form.reset();
        await loadUsers();
      } else {
        showAlert("Error", response.message || "Failed to create user", "error");
      }
    } catch (error) {
      console.error(error);
      showAlert("Error", error.message || "Failed to create user", "error");
    }
  });
}

// Modal Functions
function openCreateUserModal() { 
  document.getElementById("createUserModal").classList.add("show"); 
}

function closeCreateUserModal() { 
  document.getElementById("createUserModal").classList.remove("show"); 
  document.getElementById("createUserForm").reset();
}

// Make functions globally available
window.openCreateUserModal = openCreateUserModal;
window.closeCreateUserModal = closeCreateUserModal;

// Action Delegation
function setupActionDelegation() {
  const tbody = document.getElementById("usersTableBody");
  tbody.addEventListener("click", async (event) => {
    const btn = event.target.closest(".btn-action");
    if (!btn) return;
    handleUserAction({ currentTarget: btn });
  });
}

// Handle User Actions
async function handleUserAction(event) {
  const btn = event.currentTarget;
  const action = btn.dataset.action;
  const userId = btn.dataset.userId;

  try {
    switch(action) {
      case "toggleStatus":
        const currentStatus = btn.dataset.currentStatus === 'true';
        const statusAction = currentStatus ? "deactivate" : "activate";
        showConfirm("Confirm Action", `Are you sure you want to ${statusAction} this user?`, async () => {
          const response = await apiClient.toggleUserStatus(userId, !currentStatus);
          if (response.success) {
            showAlert("Success", `User ${statusAction}d successfully`, "success");
            await loadUsers();
          } else {
            showAlert("Error", response.message || response.error || "Failed", "error");
          }
        });
        break;

      case "resetPassword":
        const newPassword = prompt("Enter new temporary password (min 6 characters):");
        if (!newPassword || newPassword.length < 6) {
          return showAlert("Error", "Password must be at least 6 characters", "error");
        }
        const resetResponse = await apiClient.adminResetPassword(userId, newPassword);
        if (resetResponse.success) {
          showAlert("Success", "Password reset successfully. Email sent to user.", "success");
          await loadUsers();
        } else {
          showAlert("Error", resetResponse.message || "Failed to reset password", "error");
        }
        break;

      case "deleteUser":
        const userName = btn.dataset.userName;
        showConfirm(
          "Delete User", 
          `Delete "${userName}"? This action cannot be undone.`, 
          async () => {
            const delResponse = await apiClient.deleteUser(userId);
            if (delResponse.success) {
              showAlert("Success", "User deleted successfully", "success");
              await loadUsers();
            } else {
              showAlert("Error", delResponse.message || "Failed to delete user", "error");
            }
          }, 
          true
        );
        break;
    }
  } catch (error) {
    console.error(error);
    showAlert("Error", error.message || "An unexpected error occurred", "error");
  }
}

// Custom Alert & Confirm
function showAlert(title, msg, type="success") {
  const alertBox = document.getElementById("customAlert");
  const icon = document.getElementById("alertIcon");
  const titleEl = document.getElementById("alertTitle");
  const msgEl = document.getElementById("alertMessage");
  const buttons = document.getElementById("alertButtons");

  icon.textContent = type === "success" ? "✓" : type === "error" ? "✕" : "⚠";
  icon.className = `alert-icon ${type}`;
  titleEl.textContent = title;
  msgEl.textContent = msg;
  buttons.innerHTML = '<button class="alert-button" onclick="closeAlert()">OK</button>';
  alertBox.classList.add("show");
}

function showConfirm(title, msg, onConfirm, isDanger=false) {
  const alertBox = document.getElementById("customAlert");
  const icon = document.getElementById("alertIcon");
  const titleEl = document.getElementById("alertTitle");
  const msgEl = document.getElementById("alertMessage");
  const buttons = document.getElementById("alertButtons");

  icon.textContent = "?";
  icon.className = "alert-icon warning";
  titleEl.textContent = title;
  msgEl.textContent = msg;
  buttons.innerHTML = `
    <button class="alert-button secondary" onclick="closeAlert()">Cancel</button>
    <button class="alert-button ${isDanger ? 'danger' : ''}" onclick="confirmAction()">Confirm</button>
  `;
  window.pendingConfirmAction = onConfirm;
  alertBox.classList.add("show");
}

async function confirmAction() {
  const action = window.pendingConfirmAction;
  closeAlert();
  if (action) {
    try { 
      await action(); 
    } catch (err) {
      console.error("Error executing confirmed action:", err);
      showAlert("Error", "Action failed", "error");
    } finally { 
      window.pendingConfirmAction = null; 
    }
  }
}

function closeAlert() {
  document.getElementById("customAlert").classList.remove("show");
  window.pendingConfirmAction = null;
}

// Make functions globally available
window.closeAlert = closeAlert;
window.confirmAction = confirmAction;

// Close modal/alert on outside click
window.onclick = (e) => {
  if (e.target === document.getElementById("createUserModal")) {
    closeCreateUserModal();
  }
  if (e.target === document.getElementById("customAlert")) {
    closeAlert();
  }
};