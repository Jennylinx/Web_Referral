//Counselor/Staff Referral.js - WITH DYNAMIC CATEGORIES - FIXED UPDATE

document.addEventListener("DOMContentLoaded", async () => {
  // Highlight active nav item
  const navItems = document.querySelectorAll(".nav-item");
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();

  navItems.forEach(item => {
    const itemHref = item.getAttribute("href").split("/").pop().toLowerCase();
    if (itemHref === currentPage) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Profile dropdown functionality
  const profileButton = document.getElementById("profileButton");
  const profileDropdown = document.getElementById("profileDropdown");
  
  if (profileButton && profileDropdown) {
    profileButton.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle("show");
    });

    window.addEventListener("click", (event) => {
      if (!event.target.closest("#profileDropdown")) {
        profileDropdown.classList.remove("show");
      }
    });
  }

  // Load user profile and display welcome message
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
});

// ====================================
// COUNSELOR/STAFF REFERRAL MANAGEMENT
// ====================================

// DOM Elements
let searchInput, levelFilter, severityFilter, statusFilter, gradeFilter;
let viewReferralModal, closeViewModalBtn, cancelViewModalBtn;
let deleteConfirmModal, confirmDeleteBtn, cancelDeleteBtn;
let referralToDelete = null;

// Store loaded categories for validation
let availableCategories = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeElements();
  setupEventListeners();
  loadCategories(); // Load categories first
  loadReferrals();
  
  // Auto-refresh every 30 seconds to get real-time updates
  setInterval(loadReferrals, 30000);
});

// Initialize DOM elements
function initializeElements() {
  // Filter elements
  searchInput = document.getElementById('searchInput');
  levelFilter = document.getElementById('levelFilter');
  severityFilter = document.getElementById('severityFilter');
  statusFilter = document.getElementById('statusFilter');
  gradeFilter = document.getElementById('gradeFilter');
  
  // View/Edit modal elements
  viewReferralModal = document.getElementById('viewReferralModal');
  closeViewModalBtn = document.getElementById('closeViewModalBtn');
  cancelViewModalBtn = document.getElementById('cancelViewModalBtn');
  
  // Delete confirmation modal elements
  deleteConfirmModal = document.getElementById('deleteConfirmModal');
  confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
}

// Setup event listeners
function setupEventListeners() {
  // Close modal buttons
  if (closeViewModalBtn) {
    closeViewModalBtn.addEventListener('click', closeViewModal);
  }
  
  if (cancelViewModalBtn) {
    cancelViewModalBtn.addEventListener('click', closeViewModal);
  }
  
  // Delete confirmation modal buttons
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', confirmDelete);
  }
  
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  }
  
  // Click outside modal to close
  window.addEventListener('click', function(event) {
    if (event.target === viewReferralModal) {
      closeViewModal();
    }
    if (event.target === deleteConfirmModal) {
      closeDeleteModal();
    }
  });
  
  // Filters
  if (searchInput) {
    searchInput.addEventListener('input', debounce(loadReferrals, 300));
  }
  
  if (levelFilter) {
    levelFilter.addEventListener('change', loadReferrals);
  }
  
  if (severityFilter) {
    severityFilter.addEventListener('change', loadReferrals);
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', loadReferrals);
  }
  if (gradeFilter) {
    gradeFilter.addEventListener('change', loadReferrals);
  }
  
  // Status update form submission
  const updateForm = document.getElementById('updateStatusForm');
  if (updateForm) {
    updateForm.addEventListener('submit', handleStatusUpdate);
  }
  
  // Status change handler
  const statusSelect = document.getElementById('view-status');
  if (statusSelect) {
    statusSelect.addEventListener('change', function() {
      handleStatusChange(this.value);
    });
  }
}

// ====================================
// LOAD CATEGORIES DYNAMICALLY
// ====================================
async function loadCategories() {
  try {
    const response = await apiClient.getCategories();
    
    console.log('Categories loaded:', response); // Debug log
    
    if (response.success) {
      const categories = response.data || response.categories || [];
      availableCategories = categories; // Store for validation
      populateCategoryDropdown(categories);
    } else {
      console.error('Failed to load categories:', response.error);
      availableCategories = [];
    }
  } catch (error) {
    console.error('Error loading categories:', error);
    availableCategories = [];
  }
}

// Populate category dropdown with fetched categories
function populateCategoryDropdown(categories) {
  const categorySelect = document.getElementById('view-category');
  
  if (!categorySelect) return;
  
  // Clear existing options except the first one (placeholder)
  categorySelect.innerHTML = '<option value="">Select Category (Optional)</option>';
  
  // Add categories from backend
  if (categories && categories.length > 0) {
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.name;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
    
    console.log(`Loaded ${categories.length} categories into dropdown`);
  } else {
    console.log('No categories available');
  }
}

// Close view modal
function closeViewModal() {
  if (viewReferralModal) {
    viewReferralModal.style.display = 'none';
    const updateForm = document.getElementById('updateStatusForm');
    if (updateForm) {
      updateForm.reset();
    }
    
    // Remove any category warnings
    const categorySelect = document.getElementById('view-category');
    if (categorySelect) {
      const categoryContainer = categorySelect.parentElement;
      const warningDiv = categoryContainer.querySelector('.category-warning');
      if (warningDiv) {
        warningDiv.remove();
      }
    }
  }
}

// Close delete confirmation modal
function closeDeleteModal() {
  if (deleteConfirmModal) {
    deleteConfirmModal.style.display = 'none';
    referralToDelete = null;
  }
}

// Load referrals with filters
async function loadReferrals() {
  try {
    const params = new URLSearchParams();
    
    // Get filter values
    const search = searchInput ? searchInput.value.trim() : '';
    const level = levelFilter ? levelFilter.value : 'all';
    const severity = severityFilter ? severityFilter.value : 'all';
    const status = statusFilter ? statusFilter.value : 'all';
    const grade = gradeFilter ? gradeFilter.value : 'all';
    
    // Add params if they have values
    if (search) params.append('search', search);
    if (level && level !== 'all') params.append('level', level);
    if (severity && severity !== 'all') params.append('severity', severity);
    if (status && status !== 'all') params.append('status', status);
    if (grade && grade !== 'all') params.append('grade', grade);
    
    const queryString = params.toString();
    const url = `/referrals${queryString ? '?' + queryString : ''}`;
    
    const response = await apiClient.get(url);
    
    if (response.success) {
      displayReferrals(response.data);
    } else {
      console.error('Failed to load referrals');
      displayError('Failed to load referrals');
    }
  } catch (error) {
    console.error('Error loading referrals:', error);
    displayError('Error loading referrals');
  }
}

// Display referrals in table
function displayReferrals(referrals) {
  const tbody = document.getElementById('referralTable');
  if (!tbody) return;
  
  if (referrals.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No referrals found</td></tr>';
    return;
  }
  
  tbody.innerHTML = referrals.map(referral => {
    const statusClass = getStatusClass(referral.status);
    const severityClass = getSeverityClass(referral.severity);
    const date = new Date(referral.referralDate).toLocaleDateString();
    const referredBy = referral.createdBy ? 
      (referral.createdBy.fullName || referral.createdBy.username) : 
      'Unknown';
    
    return `
      <tr>
        <td onclick="viewReferral('${referral._id}')" style="cursor: pointer;">${referral.referralId}</td>
        <td onclick="viewReferral('${referral._id}')" style="cursor: pointer;">${referral.studentName}</td>
        <td onclick="viewReferral('${referral._id}')" style="cursor: pointer;">${referral.level}</td>
        <td onclick="viewReferral('${referral._id}')" style="cursor: pointer;">${referral.grade}</td>
        <td onclick="viewReferral('${referral._id}')" style="cursor: pointer;"><span class="status-badge ${statusClass}">${referral.status}</span></td>
        <td onclick="viewReferral('${referral._id}')" style="cursor: pointer;"><span class="severity-badge ${severityClass}">${referral.severity}</span></td>
        <td onclick="viewReferral('${referral._id}')" style="cursor: pointer;">${date}</td>
        <td>
          <button class="btn-delete" onclick="openDeleteModal('${referral._id}', '${referral.studentName}', '${referral.referralId}')" title="Delete Referral">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Display error message
function displayError(message) {
  const tbody = document.getElementById('referralTable');
  if (!tbody) return;
  
  tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: red;">${message}</td></tr>`;
}

// Open delete confirmation modal
function openDeleteModal(referralId, studentName, referralIdDisplay) {
  referralToDelete = referralId;
  
  const deleteMessage = document.getElementById('deleteMessage');
  if (deleteMessage) {
    deleteMessage.innerHTML = `Are you sure you want to delete the referral for <strong>${studentName}</strong> (ID: ${referralIdDisplay})?<br><br>This action cannot be undone.`;
  }
  
  if (deleteConfirmModal) {
    deleteConfirmModal.style.display = 'block';
  }
}

// Confirm and execute delete
async function confirmDelete() {
  if (!referralToDelete) return;
  
  try {
    const response = await apiClient.delete(`/referrals/${referralToDelete}`);
    
    if (response.success) {
      showAlert('Referral deleted successfully', 'success');
      closeDeleteModal();
      loadReferrals(); // Reload the table
    } else {
      showAlert(response.error || 'Failed to delete referral', 'error');
    }
  } catch (error) {
    console.error('Error deleting referral:', error);
    showAlert('Error deleting referral. Please try again.', 'error');
  }
}

// View referral details and allow status updates
async function viewReferral(referralId) {
  try {
    const response = await apiClient.get(`/referrals/${referralId}`);
    
    if (response.success) {
      populateViewForm(response.data);
      viewReferralModal.style.display = 'block';
    } else {
      showAlert('Failed to load referral details', 'error');
    }
  } catch (error) {
    console.error('Error loading referral details:', error);
    showAlert('Error loading referral details', 'error');
  }
}

// Populate view/update form with referral data
function populateViewForm(referral) {
  // Set hidden ID
  document.getElementById('viewReferralId').value = referral._id;
  
  // Set read-only fields
  document.getElementById('view-referralId-display').value = referral.referralId;
  document.getElementById('view-studentName').value = referral.studentName;
  document.getElementById('view-level').value = referral.level;
  document.getElementById('view-grade').value = referral.grade;
  
  // Set date
  const dateInput = document.getElementById('view-dateOfInterview');
  if (referral.referralDate) {
    const date = new Date(referral.referralDate);
    dateInput.value = date.toISOString().split('T')[0];
  }
  
  // Set adviser name (referred by)
  const adviserName = referral.createdBy ? 
    (referral.createdBy.fullName || referral.createdBy.username) : 
    'Unknown';
  document.getElementById('view-adviser').value = adviserName;
  
  document.getElementById('view-reason').value = referral.reason;
  document.getElementById('view-description').value = referral.description || '';
  document.getElementById('view-severity').value = referral.severity;
  
  // Set editable fields for counselor
  document.getElementById('view-status').value = referral.status;
  
  // Handle category - check if it exists in dropdown, if not, reset to empty
  const categorySelect = document.getElementById('view-category');
  const referralCategory = referral.category || '';
  
  // Remove any existing warning first
  const categoryContainer = categorySelect.parentElement;
  const existingWarning = categoryContainer.querySelector('.category-warning');
  if (existingWarning) {
    existingWarning.remove();
  }
  
  // Check if the referral's category exists in current categories list
  const categoryExists = availableCategories.some(
    cat => cat.name === referralCategory
  );
  
  if (categoryExists && referralCategory) {
    categorySelect.value = referralCategory;
  } else {
    // Category doesn't exist in current list or is empty, reset to empty
    categorySelect.value = '';
    if (referralCategory) {
      console.warn(`Category "${referralCategory}" not found in current categories list.`);
      // Show a warning to the user
      const warningDiv = document.createElement('div');
      warningDiv.className = 'category-warning';
      warningDiv.style.cssText = 'color: #f59e0b; font-size: 12px; margin-top: 4px;';
      warningDiv.innerHTML = `⚠️ Previous category "${referralCategory}" no longer exists. You can leave this empty or select a new category.`;
      categoryContainer.appendChild(warningDiv);
    }
  }
  
  document.getElementById('view-notes').value = referral.notes || '';
  
  // Show/hide notes section based on status
  handleStatusChange(referral.status);
}

// Handle status change to show/hide notes field
function handleStatusChange(status) {
  const notesSection = document.getElementById('notesSection');
  const notesTextarea = document.getElementById('view-notes');
  
  // Show notes field when status is "For Consultation" or "Complete"
  if (status === 'For Consultation' || status === 'Complete') {
    notesSection.style.display = 'block';
    notesTextarea.required = true;
  } else {
    notesSection.style.display = 'none';
    notesTextarea.required = false;
  }
}

// Handle status update form submission - FIXED VERSION
async function handleStatusUpdate(e) {
  e.preventDefault();
  
  const referralId = document.getElementById('viewReferralId').value;
  const status = document.getElementById('view-status').value;
  const notes = document.getElementById('view-notes').value.trim();
  const severity = document.getElementById('view-severity').value;
  const category = document.getElementById('view-category').value;
  
  // Validate notes if status requires it
  if ((status === 'For Consultation' || status === 'Complete') && !notes) {
    showAlert('Please add consultation notes before setting this status', 'error');
    return;
  }
  
  // FIXED: Only validate category if user actively selected one
  // If category dropdown is empty (value is ""), don't validate - just don't send it
  if (category && category !== '') {
    const categoryExists = availableCategories.some(cat => cat.name === category);
    if (!categoryExists) {
      showAlert('Selected category is not valid. Please select a valid category from the dropdown list.', 'error');
      return;
    }
  }
  
  // Build form data - only include fields that are being updated
  const formData = {
    status: status,
    severity: severity,
    notes: notes || undefined
  };
  
  // IMPORTANT: Only include category if a valid one is selected
  // If empty, don't send category field at all (keeps existing value or sets to null)
  if (category && category !== '') {
    formData.category = category;
  } else {
    // If category is empty, explicitly set to null to clear old invalid categories
    formData.category = null;
  }
  
  try {
    const response = await apiClient.put(`/referrals/${referralId}`, formData);
    
    if (response.success) {
      showAlert('Referral updated successfully! Adviser will see these changes.', 'success');
      closeViewModal();
      loadReferrals(); // Reload the table
    } else {
      showAlert(response.error || 'Failed to update referral', 'error');
    }
  } catch (error) {
    console.error('Error updating referral:', error);
    showAlert('Error updating referral. Please try again.', 'error');
  }
}

// Get status CSS class
function getStatusClass(status) {
  const statusMap = {
    'Pending': 'status-pending',
    'Under Review': 'status-under-review',
    'For Consultation': 'status-for-consultation',
    'Complete': 'status-complete'
  };
  return statusMap[status] || 'status-pending';
}

// Get severity CSS class
function getSeverityClass(severity) {
  const severityMap = {
    'Low': 'severity-low',
    'Medium': 'severity-medium',
    'High': 'severity-high'
  };
  return severityMap[severity] || 'severity-medium';
}

// Debounce function for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Show alert message
function showAlert(message, type = 'info') {
  // Check if custom alert exists
  if (typeof customAlert !== 'undefined') {
    // Map type to customAlert methods
    switch(type) {
      case 'success':
        customAlert.success(message);
        break;
      case 'error':
        customAlert.error(message);
        break;
      case 'warning':
        customAlert.warning(message);
        break;
      default:
        customAlert.info(message);
    }
    return;
  }
  
  // Fallback to regular alert
  alert(message);
}

// Make functions globally accessible
window.viewReferral = viewReferral;
window.openDeleteModal = openDeleteModal;
window.closeViewModal = closeViewModal;
window.closeDeleteModal = closeDeleteModal;