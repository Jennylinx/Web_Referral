// Teacher/Adviser Referral.js - FIXED VERSION WITH GRADE FILTER

// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing...');
  
  // Initialize everything
  initializePage();
});

// Main initialization function
async function initializePage() {
  try {
    // Load categories first
    await loadCategories();
    
    // Load referrals
    await loadReferrals();
    
    // Setup all event listeners
    setupAddButton();
    setupFilters();
    setupGradeDropdown();
    setupProfileDropdown();
    
    console.log('Initialization complete');
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// ====================================
// CATEGORY MANAGEMENT
// ====================================

// Store loaded categories
let availableCategories = [];

// Load categories from backend
async function loadCategories() {
  try {
    const response = await apiClient.getCategories();
    
    console.log('Categories loaded:', response);
    
    if (response.success) {
      const categories = response.data || response.categories || [];
      availableCategories = categories;
      populateCategoryDropdowns(categories);
    } else {
      console.error('Failed to load categories:', response.error);
      availableCategories = [];
    }
  } catch (error) {
    console.error('Error loading categories:', error);
    availableCategories = [];
  }
}

// Populate all category dropdowns
function populateCategoryDropdowns(categories) {
  // Teachers/Advisers don't have category dropdown in add form
  // Category is only visible in edit/view form as read-only
  console.log('Categories loaded for display:', categories.length);
}

// ====================================
// MODAL SETUP
// ====================================

// Setup Add Button - CRITICAL FIX
function setupAddButton() {
  const addBtn = document.getElementById('addReferralBtn');
  const modal = document.getElementById('referralModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelModalBtn');
  const form = document.getElementById('referralForm');
  
  console.log('Setting up add button...', { addBtn, modal, form });
  
  if (!addBtn) {
    console.error('Add button not found!');
    return;
  }
  
  if (!modal) {
    console.error('Modal not found!');
    return;
  }
  
  // Add click event to button
  addBtn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Add button clicked!');
    openAddModal();
  };
  
  // Close button
  if (closeBtn) {
    closeBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeAddModal();
    };
  }
  
  // Cancel button
  if (cancelBtn) {
    cancelBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeAddModal();
    };
  }
  
  // Click outside to close
  modal.onclick = function(e) {
    if (e.target === modal) {
      closeAddModal();
    }
  };
  
  // Form submit
  if (form) {
    form.onsubmit = handleAddReferral;
  }
  
  // Setup edit modal
  setupEditModal();
}

// Open add modal
function openAddModal() {
  console.log('Opening modal...');
  const modal = document.getElementById('referralModal');
  const dateInput = document.getElementById('dateOfInterview');
  
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('show');
    
    // Set today's date
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
    }
    
    // Reset form
    const form = document.getElementById('referralForm');
    if (form) {
      form.reset();
      // Set default severity
      const severitySelect = document.getElementById('severity');
      if (severitySelect) {
        severitySelect.value = 'Medium';
      }
    }
    
    console.log('Modal opened');
  }
}

// Close add modal
function closeAddModal() {
  console.log('Closing modal...');
  const modal = document.getElementById('referralModal');
  const form = document.getElementById('referralForm');
  
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
  }
  
  if (form) {
    form.reset();
  }
}

// Setup edit modal
function setupEditModal() {
  const editModal = document.getElementById('editReferralModal');
  const closeEditBtn = document.getElementById('closeEditModalBtn');
  const cancelEditBtn = document.getElementById('cancelEditModalBtn');
  const editForm = document.getElementById('editReferralForm');
  
  if (closeEditBtn) {
    closeEditBtn.onclick = function(e) {
      e.preventDefault();
      closeEditModal();
    };
  }
  
  if (cancelEditBtn) {
    cancelEditBtn.onclick = function(e) {
      e.preventDefault();
      closeEditModal();
    };
  }
  
  if (editModal) {
    editModal.onclick = function(e) {
      if (e.target === editModal) {
        closeEditModal();
      }
    };
  }
  
  if (editForm) {
    editForm.onsubmit = handleEditReferral;
  }
}

// Close edit modal
function closeEditModal() {
  const editModal = document.getElementById('editReferralModal');
  const editForm = document.getElementById('editReferralForm');
  
  if (editModal) {
    editModal.style.display = 'none';
    editModal.classList.remove('show');
  }
  
  if (editForm) {
    editForm.reset();
  }
}

// ====================================
// LOAD REFERRALS
// ====================================

// Load referrals - FIXED ENDPOINT
async function loadReferrals() {
  try {
    console.log('Loading referrals...');
    // FIXED: Use correct endpoint without /api prefix
    const response = await apiClient.get('/referrals/my-referrals');
    
    console.log('Referrals response:', response);
    
    if (response.success) {
      const referrals = response.data;
      window.allReferrals = referrals;
      displayReferrals(referrals);
      console.log('Referrals loaded:', referrals.length);
    } else {
      console.error('Failed to load referrals:', response.error);
      displayError('Failed to load referrals');
    }
  } catch (error) {
    console.error('Error loading referrals:', error);
    displayError('Failed to load referrals. Please check your connection and try again.');
  }
}

// Display referrals in table
function displayReferrals(referrals) {
  const tbody = document.getElementById('studentTable');
  
  if (!tbody) {
    console.error('Table body not found');
    return;
  }
  
  if (!referrals || referrals.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center;">No referrals found</td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = referrals.map(referral => {
    const statusClass = getStatusClass(referral.status);
    const severityClass = getSeverityClass(referral.severity);
    const date = new Date(referral.referralDate || referral.createdAt).toLocaleDateString();
    
    return `
      <tr>
        <td>${referral.referralId || 'N/A'}</td>
        <td>${referral.studentId || 'N/A'}</td>
        <td>${referral.studentName}</td>
        <td>${referral.level}</td>
        <td>${referral.grade}</td>
        <td><span class="status-badge ${statusClass}">${referral.status}</span></td>
        <td><span class="severity-badge ${severityClass}">${referral.severity}</span></td>
        <td>${date}</td>
        <td>
          <button class="action-btn" onclick="viewReferral('${referral._id}')">
            View
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Display error message
function displayError(message) {
  const tbody = document.getElementById('studentTable');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; color: #ef4444;">
          ${message}
        </td>
      </tr>
    `;
  }
}

// Get status class
function getStatusClass(status) {
  const statusMap = {
    'Pending': 'status-pending',
    'Under Review': 'status-under-review',
    'For Consultation': 'status-for-consultation',
    'Complete': 'status-complete'
  };
  return statusMap[status] || '';
}

// Get severity class
function getSeverityClass(severity) {
  const severityMap = {
    'Low': 'severity-low',
    'Medium': 'severity-medium',
    'High': 'severity-high'
  };
  return severityMap[severity] || '';
}

// ====================================
// FILTERS - UPDATED WITH GRADE FILTER
// ====================================

// Setup filters
function setupFilters() {
  const searchInput = document.getElementById('searchInput');
  const levelFilter = document.getElementById('levelFilter');
  const severityFilter = document.getElementById('severityFilter');
  const statusFilter = document.getElementById('statusFilter');
  const gradeFilter = document.getElementById('GradeFilter');
  
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (severityFilter) severityFilter.addEventListener('change', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
  if (gradeFilter) gradeFilter.addEventListener('change', applyFilters);
  
  // Level filter needs special handling to update grade filter
  if (levelFilter) {
    levelFilter.addEventListener('change', function() {
      updateFilterGradeOptions(this.value);
      applyFilters();
    });
  }
  
  // Initialize grade filter with "All Grades" option
  initializeGradeFilter();
}

// Initialize grade filter on page load
function initializeGradeFilter() {
  const gradeFilter = document.getElementById('GradeFilter');
  if (gradeFilter) {
    gradeFilter.innerHTML = '<option value="all">All Grades</option>';
  }
}

// Update grade filter options based on selected level
function updateFilterGradeOptions(level) {
  const gradeFilter = document.getElementById('GradeFilter');
  if (!gradeFilter) return;
  
  // Reset to "All Grades"
  gradeFilter.innerHTML = '<option value="all">All Grades</option>';
  
  const gradeOptions = {
    'Elementary': ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
    'JHS': ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
    'SHS': ['Grade 11', 'Grade 12']
  };
  
  // If a specific level is selected, add its grade options
  if (level && level !== 'all' && gradeOptions[level]) {
    gradeOptions[level].forEach(grade => {
      const option = document.createElement('option');
      option.value = grade;
      option.textContent = grade;
      gradeFilter.appendChild(option);
    });
  }
  
  // Reset selection to "All Grades"
  gradeFilter.value = 'all';
}

// Apply filters - UPDATED TO INCLUDE GRADE
function applyFilters() {
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const levelFilter = document.getElementById('levelFilter')?.value || 'all';
  const severityFilter = document.getElementById('severityFilter')?.value || 'all';
  const statusFilter = document.getElementById('statusFilter')?.value || 'all';
  const gradeFilter = document.getElementById('GradeFilter')?.value || 'all';
  
  let filtered = window.allReferrals || [];
  
  if (searchTerm) {
    filtered = filtered.filter(r => 
      r.studentName.toLowerCase().includes(searchTerm) ||
      (r.studentId && r.studentId.toLowerCase().includes(searchTerm)) ||
      (r.referralId && r.referralId.toLowerCase().includes(searchTerm))
    );
  }
  
  if (levelFilter !== 'all') {
    filtered = filtered.filter(r => r.level === levelFilter);
  }
  
  if (gradeFilter !== 'all') {
    filtered = filtered.filter(r => r.grade === gradeFilter);
  }
  
  if (severityFilter !== 'all') {
    filtered = filtered.filter(r => r.severity === severityFilter);
  }
  
  if (statusFilter !== 'all') {
    filtered = filtered.filter(r => r.status === statusFilter);
  }
  
  displayReferrals(filtered);
}

// ====================================
// GRADE DROPDOWN (FOR FORMS)
// ====================================

// Setup grade dropdown
function setupGradeDropdown() {
  const levelSelect = document.getElementById('level');
  const gradeSelect = document.getElementById('grade');
  const editLevelSelect = document.getElementById('edit-level');
  const editGradeSelect = document.getElementById('edit-grade');
  
  if (levelSelect && gradeSelect) {
    levelSelect.addEventListener('change', function() {
      updateGradeOptions(this.value, gradeSelect);
    });
  }
  
  if (editLevelSelect && editGradeSelect) {
    editLevelSelect.addEventListener('change', function() {
      updateGradeOptions(this.value, editGradeSelect);
    });
  }
}

// Update grade options
function updateGradeOptions(level, gradeSelect) {
  if (!gradeSelect) return;
  
  gradeSelect.innerHTML = '<option value="">Select grade</option>';
  
  const gradeOptions = {
    'Elementary': ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
    'JHS': ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
    'SHS': ['Grade 11', 'Grade 12']
  };
  
  if (level && gradeOptions[level]) {
    gradeOptions[level].forEach(grade => {
      const option = document.createElement('option');
      option.value = grade;
      option.textContent = grade;
      gradeSelect.appendChild(option);
    });
    gradeSelect.disabled = false;
  } else {
    gradeSelect.disabled = true;
  }
}

// ====================================
// ADD REFERRAL
// ====================================

// Handle add referral - NO CATEGORY FOR TEACHERS
async function handleAddReferral(e) {
  e.preventDefault();
  console.log('Submitting referral...');
  
  const studentName = document.getElementById('studentName').value.trim();
  const studentId = document.getElementById('studentId').value.trim();
  const level = document.getElementById('level').value;
  const grade = document.getElementById('grade').value;
  const dateOfInterview = document.getElementById('dateOfInterview').value;
  const reason = document.getElementById('reason').value.trim();
  const description = document.getElementById('description').value.trim();
  const severity = document.getElementById('severity').value || 'Medium';
  
  // Validate required fields
  if (!studentId) {
    showAlert('Student ID is required', 'error');
    return;
  }
  
  const data = {
    studentName,
    studentId,
    level,
    grade,
    referralDate: dateOfInterview,
    reason,
    description,
    severity
  };
  
  // NOTE: Teachers cannot set category - only counselors can
  
  console.log('Referral data:', data);
  
  try {
    // FIXED: Use correct endpoint
    const response = await apiClient.post('/referrals', data);
    
    if (response.success) {
      showAlert('Referral added successfully', 'success');
      closeAddModal();
      await loadReferrals();
    } else {
      showAlert(response.error || 'Failed to add referral', 'error');
    }
  } catch (error) {
    console.error('Failed to add referral:', error);
    showAlert('Failed to add referral. Please try again.', 'error');
  }
}

// ====================================
// VIEW & EDIT REFERRAL
// ====================================

// View referral - FIXED ENDPOINT
async function viewReferral(id) {
  try {
    console.log('Loading referral:', id);
    // FIXED: Use correct endpoint
    const response = await apiClient.get(`/referrals/${id}`);
    
    if (response.success) {
      const referral = response.data;
      populateEditForm(referral);
      
      // Show modal
      const editModal = document.getElementById('editReferralModal');
      if (editModal) {
        editModal.style.display = 'flex';
        editModal.classList.add('show');
      }
    } else {
      showAlert('Failed to load referral details', 'error');
    }
  } catch (error) {
    console.error('Failed to load referral:', error);
    showAlert('Failed to load referral details', 'error');
  }
}

// Populate edit form
function populateEditForm(referral) {
  document.getElementById('editReferralId').value = referral._id;
  document.getElementById('edit-referralId-display').value = referral.referralId || 'N/A';
  document.getElementById('edit-studentName').value = referral.studentName;
  document.getElementById('edit-studentId').value = referral.studentId || '';
  
  document.getElementById('edit-level').value = referral.level;
  
  // Update grade options and set value
  updateGradeOptions(referral.level, document.getElementById('edit-grade'));
  document.getElementById('edit-grade').value = referral.grade;
  
  // Severity is READ-ONLY for teachers
  const severityInput = document.getElementById('edit-severity');
  if (severityInput) {
    severityInput.value = referral.severity;
  }
  
  document.getElementById('edit-status').value = referral.status;
  document.getElementById('edit-reason').value = referral.reason;
  document.getElementById('edit-description').value = referral.description || '';
  
  // Set date
  if (referral.referralDate) {
    const date = new Date(referral.referralDate).toISOString().split('T')[0];
    document.getElementById('edit-dateOfInterview').value = date;
  }
  
  // Set adviser name
  const adviserInput = document.getElementById('edit-adviser');
  if (adviserInput) {
    if (referral.createdBy) {
      adviserInput.value = referral.createdBy.fullName || referral.createdBy.username || 'Unknown';
    } else {
      adviserInput.value = 'Unknown';
    }
  }
  
  // Handle category visibility based on status
  const categorySection = document.getElementById('categorySection');
  const categoryInput = document.getElementById('edit-category');
  
  // Only show category if status is NOT "Pending"
  if (referral.status !== 'Pending') {
    if (categorySection) {
      categorySection.style.display = 'block';
    }
    
    if (categoryInput) {
      if (referral.category) {
        categoryInput.value = referral.category;
        categoryInput.placeholder = '';
      } else {
        categoryInput.value = '';
        categoryInput.placeholder = 'Not yet assigned';
      }
    }
  } else {
    // Hide category section for Pending status
    if (categorySection) {
      categorySection.style.display = 'none';
    }
  }
  
  // Show notes if available AND status is not Pending
  const notesSection = document.getElementById('notesSection');
  const notesInput = document.getElementById('edit-notes');
  
  if (referral.status !== 'Pending' && referral.notes) {
    if (notesInput) {
      notesInput.value = referral.notes;
    }
    if (notesSection) {
      notesSection.style.display = 'block';
    }
  } else {
    if (notesSection) {
      notesSection.style.display = 'none';
    }
  }
}

// Handle edit referral - SEVERITY AND CATEGORY CANNOT BE EDITED BY TEACHERS
async function handleEditReferral(e) {
  e.preventDefault();
  console.log('Updating referral...');
  
  const id = document.getElementById('editReferralId').value;
  const studentName = document.getElementById('edit-studentName').value.trim();
  const studentId = document.getElementById('edit-studentId').value.trim();
  const level = document.getElementById('edit-level').value;
  const grade = document.getElementById('edit-grade').value;
  const dateOfInterview = document.getElementById('edit-dateOfInterview').value;
  const reason = document.getElementById('edit-reason').value.trim();
  const description = document.getElementById('edit-description').value.trim();
  
  // Validate required fields
  if (!studentId) {
    showAlert('Student ID is required', 'error');
    return;
  }
  
  const data = {
    studentName,
    studentId,
    level,
    grade,
    referralDate: dateOfInterview,
    reason,
    description
  };
  
  // NOTE: Teachers cannot edit severity or category - fields are read-only
  
  try {
    // FIXED: Use correct endpoint
    const response = await apiClient.put(`/referrals/${id}`, data);
    
    if (response.success) {
      showAlert('Referral updated successfully', 'success');
      closeEditModal();
      await loadReferrals();
    } else {
      showAlert(response.error || 'Failed to update referral', 'error');
    }
  } catch (error) {
    console.error('Failed to update referral:', error);
    showAlert('Failed to update referral. Please try again.', 'error');
  }
}

// ====================================
// UTILITIES
// ====================================

// Setup profile dropdown
function setupProfileDropdown() {
  const profileButton = document.getElementById('profileButton');
  const profileDropdown = document.getElementById('profileDropdown');

  if (profileButton && profileDropdown) {
    profileButton.addEventListener('click', function(e) {
      e.stopPropagation();
      profileDropdown.classList.toggle('show');
    });

    document.addEventListener('click', function() {
      profileDropdown.classList.remove('show');
    });
  }
}

// Show alert message
function showAlert(message, type = 'info') {
  if (typeof customAlert !== 'undefined') {
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
  
  alert(message);
}

// Make functions globally accessible
window.viewReferral = viewReferral;