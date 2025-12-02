//Counselor/Staff Referral.js - WITH STUDENT ID AUTO-FILL

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

// Store all students for auto-fill
let allStudents = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing Counselor Referral page...');
  
  initializeElements();
  setupEventListeners();
  
  // Load everything in sequence
  Promise.all([
    loadCategories(),
    loadAllStudents()
  ]).then(() => {
    console.log('✅ Categories and students loaded');
    console.log('📊 Total students available:', allStudents.length);
    
    // Show first few students for verification
    if (allStudents.length > 0) {
      console.log('📋 Sample students:', allStudents.slice(0, 3));
    }
    
    loadReferrals();
  }).catch(error => {
    console.error('❌ Initialization error:', error);
  });
  
  // Auto-refresh every 30 seconds
  setInterval(loadReferrals, 30000);
});

// Initialize DOM elements
function initializeElements() {
  searchInput = document.getElementById('searchInput');
  levelFilter = document.getElementById('levelFilter');
  severityFilter = document.getElementById('severityFilter');
  statusFilter = document.getElementById('statusFilter');
  gradeFilter = document.getElementById('gradeFilter');
  
  viewReferralModal = document.getElementById('viewReferralModal');
  closeViewModalBtn = document.getElementById('closeViewModalBtn');
  cancelViewModalBtn = document.getElementById('cancelViewModalBtn');
  
  deleteConfirmModal = document.getElementById('deleteConfirmModal');
  confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
}

// Setup event listeners
function setupEventListeners() {
  if (closeViewModalBtn) {
    closeViewModalBtn.addEventListener('click', closeViewModal);
  }
  
  if (cancelViewModalBtn) {
    cancelViewModalBtn.addEventListener('click', closeViewModal);
  }
  
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', confirmDelete);
  }
  
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  }
  
  window.addEventListener('click', function(event) {
    if (event.target === viewReferralModal) {
      closeViewModal();
    }
    if (event.target === deleteConfirmModal) {
      closeDeleteModal();
    }
  });
  
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
  
  const updateForm = document.getElementById('updateStatusForm');
  if (updateForm) {
    updateForm.addEventListener('submit', handleStatusUpdate);
  }
  
  const statusSelect = document.getElementById('view-status');
  if (statusSelect) {
    statusSelect.addEventListener('change', function() {
      handleStatusChange(this.value);
    });
  }
}

// ====================================
// LOAD ALL STUDENTS FOR AUTO-FILL
// ====================================
async function loadAllStudents() {
  try {
    console.log('📚 Loading ALL students for counselor auto-fill...');
    
    // Use the same endpoint as StudentProfile.js
    const response = await apiClient.getAllStudentsForCounselor();
    
    console.log('📥 Students response:', response);
    
    if (response.success && response.data) {
      allStudents = response.data;
      console.log('✅ Loaded', allStudents.length, 'students for auto-fill');
      console.log('Sample student:', allStudents[0]);
    } else {
      console.error('❌ Failed to load students for auto-fill:', response);
      allStudents = [];
    }
  } catch (error) {
    console.error('❌ Error loading students for auto-fill:', error);
    allStudents = [];
  }
}

// ====================================
// STUDENT ID AUTO-FILL FUNCTIONALITY
// ====================================
function setupStudentIdAutoFill() {
  const studentIdInput = document.getElementById('view-studentId');
  let suggestionBox = document.getElementById('studentIdSuggestions');
  
  if (!studentIdInput) {
    console.warn('⚠️ Student ID input not found');
    return;
  }
  
  // Create suggestion box if it doesn't exist
  if (!suggestionBox) {
    console.log('📦 Creating suggestion box...');
    suggestionBox = document.createElement('div');
    suggestionBox.id = 'studentIdSuggestions';
    suggestionBox.className = 'suggestion-box';
    
    // Insert after the input
    const wrapper = studentIdInput.parentElement;
    if (wrapper.style.position !== 'relative') {
      wrapper.style.position = 'relative';
    }
    wrapper.appendChild(suggestionBox);
  }
  
  console.log('🎯 Setting up auto-fill with', allStudents.length, 'students');
  
  // Remove old event listeners by cloning
  const newInput = studentIdInput.cloneNode(true);
  studentIdInput.parentNode.replaceChild(newInput, studentIdInput);
  
  // Add new input event
  newInput.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    
    if (query.length === 0) {
      suggestionBox.style.display = 'none';
      suggestionBox.innerHTML = '';
      return;
    }
    
    console.log('🔍 Searching for:', query);
    
    // Search for matching students
    const matches = allStudents.filter(student => {
      const studentId = (student.studentId || '').toLowerCase();
      const fullName = (student.fullName || '').toLowerCase();
      const firstName = (student.firstName || '').toLowerCase();
      const lastName = (student.lastName || '').toLowerCase();
      
      return studentId.includes(query) || 
             fullName.includes(query) || 
             firstName.includes(query) || 
             lastName.includes(query);
    }).slice(0, 5);
    
    console.log('📊 Found', matches.length, 'matches');
    
    if (matches.length > 0) {
      displaySuggestions(matches, suggestionBox);
    } else {
      suggestionBox.style.display = 'none';
      suggestionBox.innerHTML = '';
    }
  });
  
  // Close on Escape
  newInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      suggestionBox.style.display = 'none';
    }
  });
  
  // Click outside to close
  const closeHandler = function(e) {
    if (!newInput.contains(e.target) && !suggestionBox.contains(e.target)) {
      suggestionBox.style.display = 'none';
    }
  };
  
  // Remove old listeners
  document.removeEventListener('click', closeHandler);
  document.addEventListener('click', closeHandler);
}

function displaySuggestions(students, suggestionBox) {
  console.log('✨ Displaying suggestions:', students);
  
  if (!suggestionBox) {
    suggestionBox = document.getElementById('studentIdSuggestions');
  }
  
  if (!suggestionBox) {
    console.error('❌ Suggestion box not found!');
    return;
  }
  
  suggestionBox.innerHTML = students.map(student => {
    // Construct full name properly
    const fullName = student.fullName || 
      `${student.lastName || ''}, ${student.firstName || ''}${student.middleName ? ' ' + student.middleName : ''}`;
    
    const studentData = JSON.stringify(student).replace(/"/g, '&quot;');
    
    return `
    <div class="suggestion-item" data-student="${studentData}">
      <div class="suggestion-id">${student.studentId || 'No ID'}</div>
      <div class="suggestion-details">
        <div class="suggestion-name">${fullName}</div>
        <div class="suggestion-info">${student.level || 'N/A'} - ${student.grade || 'N/A'}</div>
      </div>
    </div>
  `;
  }).join('');
  
  suggestionBox.style.display = 'block';
  
  // Add click listeners to suggestions
  suggestionBox.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const studentData = this.getAttribute('data-student').replace(/&quot;/g, '"');
      const student = JSON.parse(studentData);
      
      console.log('🎯 Selected student:', student);
      fillStudentDetails(student);
      suggestionBox.style.display = 'none';
    });
  });
}

function fillStudentDetails(student) {
  console.log('📝 Filling student details:', student);
  
  // Construct full name
  const fullName = student.fullName || 
    `${student.lastName || ''}, ${student.firstName || ''}${student.middleName ? ' ' + student.middleName : ''}`;
  
  // Fill Student ID
  const studentIdField = document.getElementById('view-studentId');
  if (studentIdField) {
    studentIdField.value = student.studentId || '';
    console.log('✅ Student ID set:', studentIdField.value);
  }
  
  // Fill Student Name
  const studentNameField = document.getElementById('view-studentName');
  if (studentNameField && !studentNameField.disabled) {
    studentNameField.value = fullName.trim();
    console.log('✅ Student Name set:', studentNameField.value);
  }
  
  // Fill Level
  const levelField = document.getElementById('view-level');
  if (levelField && !levelField.disabled) {
    levelField.value = student.level || '';
    console.log('✅ Level set:', levelField.value);
    
    // Trigger change event to update grade options
    if (levelField.tagName === 'SELECT') {
      const changeEvent = new Event('change', { bubbles: true });
      levelField.dispatchEvent(changeEvent);
    }
  }
  
  // Fill Grade (after a short delay to ensure grade options are populated)
  setTimeout(() => {
    const gradeField = document.getElementById('view-grade');
    if (gradeField && !gradeField.disabled) {
      gradeField.value = student.grade || '';
      console.log('✅ Grade set:', gradeField.value);
    }
  }, 150);
  
  // Show success feedback
  showAlert('✅ Student details filled automatically!', 'success');
}

// ====================================
// LOAD CATEGORIES DYNAMICALLY
// ====================================
async function loadCategories() {
  try {
    const response = await apiClient.getCategories();
    
    if (response.success) {
      const categories = response.data || response.categories || [];
      availableCategories = categories;
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

function populateCategoryDropdown(categories) {
  const categorySelect = document.getElementById('view-category');
  
  if (!categorySelect) return;
  
  categorySelect.innerHTML = '<option value="">Select Category (Optional)</option>';
  
  if (categories && categories.length > 0) {
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.name;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  }
}

function closeViewModal() {
  if (viewReferralModal) {
    viewReferralModal.style.display = 'none';
    const updateForm = document.getElementById('updateStatusForm');
    if (updateForm) {
      updateForm.reset();
    }
    
    // Hide suggestions
    const suggestionBox = document.getElementById('studentIdSuggestions');
    if (suggestionBox) {
      suggestionBox.style.display = 'none';
      suggestionBox.innerHTML = '';
    }
    
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

function closeDeleteModal() {
  if (deleteConfirmModal) {
    deleteConfirmModal.style.display = 'none';
    referralToDelete = null;
  }
}

// Load referrals with filters
async function loadReferrals() {
  try {
    console.log('Loading referrals...');
    const params = new URLSearchParams();
    
    const search = searchInput ? searchInput.value.trim() : '';
    const level = levelFilter ? levelFilter.value : 'all';
    const severity = severityFilter ? severityFilter.value : 'all';
    const status = statusFilter ? statusFilter.value : 'all';
    const grade = gradeFilter ? gradeFilter.value : 'all';
    
    if (search) params.append('search', search);
    if (level && level !== 'all') params.append('level', level);
    if (severity && severity !== 'all') params.append('severity', severity);
    if (status && status !== 'all') params.append('status', status);
    if (grade && grade !== 'all') params.append('grade', grade);
    
    const queryString = params.toString();
    const url = `/referrals${queryString ? '?' + queryString : ''}`;
    
    console.log('Fetching from:', url);
    const response = await apiClient.get(url);
    console.log('Response:', response);
    
    if (response.success) {
      console.log('Referrals loaded:', response.data.length);
      displayReferrals(response.data);
    } else {
      console.error('Failed to load referrals:', response.error);
      displayError('Failed to load referrals: ' + (response.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error loading referrals:', error);
    displayError('Error loading referrals: ' + error.message);
  }
}

// Display referrals in table - WITH STUDENT ID COLUMN
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
    
    // Handle student submissions vs teacher referrals
    const isStudentSubmission = referral.isStudentSubmitted === true;
    const studentId = referral.studentId || '—';
    const level = isStudentSubmission ? '<span style="color: #888; font-style: italic;">Student Form</span>' : referral.level;
    const grade = isStudentSubmission && !referral.grade ? '—' : referral.grade;
    
    return `
      <tr>
        <td onclick="viewReferral('${referral._id}')" style="cursor: pointer;">${referral.referralId}</td>
        <td onclick="viewReferral('${referral._id}')" style="cursor: pointer;">${studentId}</td>
        <td onclick="viewReferral('${referral._id}')" style="cursor: pointer;">${referral.studentName}</td>
        <td onclick="viewReferral('${referral._id}')" style="cursor: pointer;">${level}</td>
        <td onclick="viewReferral('${referral._id}')" style="cursor: pointer;">${grade}</td>
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

function displayError(message) {
  const tbody = document.getElementById('referralTable');
  if (!tbody) return;
  
  tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: red;">${message}</td></tr>`;
}

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

async function confirmDelete() {
  if (!referralToDelete) return;
  
  try {
    const response = await apiClient.delete(`/referrals/${referralToDelete}`);
    
    if (response.success) {
      showAlert('Referral deleted successfully', 'success');
      closeDeleteModal();
      loadReferrals();
    } else {
      showAlert(response.error || 'Failed to delete referral', 'error');
    }
  } catch (error) {
    console.error('Error deleting referral:', error);
    showAlert('Error deleting referral. Please try again.', 'error');
  }
}

// View referral details
async function viewReferral(referralId) {
  try {
    console.log('👁️ Loading referral details for:', referralId);
    const response = await apiClient.get(`/referrals/${referralId}`);
    
    if (response.success) {
      console.log('📦 Referral data:', response.data);
      populateViewForm(response.data);
      viewReferralModal.style.display = 'block';
      
      // Setup auto-fill after modal is displayed and form is populated
      setTimeout(() => {
        console.log('🔧 Setting up auto-fill functionality...');
        setupStudentIdAutoFill();
        
        // Verify the input field is ready
        const studentIdInput = document.getElementById('view-studentId');
        const suggestionBox = document.getElementById('studentIdSuggestions');
        console.log('Input field:', studentIdInput ? '✅ Found' : '❌ Not found');
        console.log('Suggestion box:', suggestionBox ? '✅ Found' : '❌ Not found');
        console.log('Available students:', allStudents.length);
      }, 100);
    } else {
      showAlert('Failed to load referral details', 'error');
    }
  } catch (error) {
    console.error('Error loading referral details:', error);
    showAlert('Error loading referral details', 'error');
  }
}

// Populate view/update form - LEVEL & GRADE AS DROPDOWNS, REFERRED BY NOT EDITABLE
function populateViewForm(referral) {
  document.getElementById('viewReferralId').value = referral._id;
  document.getElementById('view-referralId-display').value = referral.referralId;
  
  const isStudentSubmission = referral.isStudentSubmitted === true;
  
  // Store whether this is a student submission
  const form = document.getElementById('updateStatusForm');
  if (form) {
    form.dataset.isStudentSubmission = isStudentSubmission;
  }
  
  // Show/hide edit badges for student submissions
  const editBadges = {
    'studentIdEditBadge': isStudentSubmission,
    'studentNameEditBadge': isStudentSubmission,
    'levelEditBadge': isStudentSubmission,
    'gradeEditBadge': isStudentSubmission,
    'adviserEditBadge': false  // NEVER show edit badge for Referred By
  };
  
  Object.keys(editBadges).forEach(badgeId => {
    const badge = document.getElementById(badgeId);
    if (badge) {
      badge.style.display = editBadges[badgeId] ? 'inline' : 'none';
    }
  });
  
  // Student ID - EDITABLE for student submissions
  const studentIdField = document.getElementById('view-studentId');
  if (studentIdField) {
    studentIdField.value = referral.studentId || '';
    studentIdField.disabled = !isStudentSubmission;
  }
  
  // Student Name - EDITABLE for student submissions
  const studentNameField = document.getElementById('view-studentName');
  if (studentNameField) {
    studentNameField.value = referral.studentName;
    studentNameField.disabled = !isStudentSubmission;
    studentNameField.required = isStudentSubmission;
  }
  
  // Level - CONVERT TO DROPDOWN for student submissions
  const levelField = document.getElementById('view-level');
  if (levelField) {
    if (isStudentSubmission) {
      // Store parent and classes
      const parent = levelField.parentNode;
      const classes = levelField.className;
      
      // Create new dropdown
      const newLevelField = document.createElement('select');
      newLevelField.id = 'view-level';
      newLevelField.name = 'level';
      newLevelField.className = classes;
      newLevelField.required = true;
      
      newLevelField.innerHTML = `
        <option value="">Select level</option>
        <option value="Elementary">Elementary</option>
        <option value="JHS">JHS</option>
        <option value="SHS">SHS</option>
      `;
      
      // Replace the field
      parent.replaceChild(newLevelField, levelField);
      
      // Set value
      newLevelField.value = referral.level || '';
      
      // Add change listener to update grade options
      newLevelField.addEventListener('change', function() {
        updateViewGradeOptions(this.value);
      });
    } else {
      // Keep as text input (disabled)
      levelField.value = referral.level || '';
      levelField.disabled = true;
    }
  }
  
  // Grade - CONVERT TO DROPDOWN for student submissions
  const gradeField = document.getElementById('view-grade');
  if (gradeField) {
    if (isStudentSubmission) {
      // Store parent and classes
      const parent = gradeField.parentNode;
      const classes = gradeField.className;
      
      // Create new dropdown
      const newGradeField = document.createElement('select');
      newGradeField.id = 'view-grade';
      newGradeField.name = 'grade';
      newGradeField.className = classes;
      newGradeField.required = true;
      
      newGradeField.innerHTML = '<option value="">Select grade</option>';
      
      // Replace the field
      parent.replaceChild(newGradeField, gradeField);
      
      // Populate grade options based on current level
      updateViewGradeOptions(referral.level || '', referral.grade);
    } else {
      // Keep as text input (disabled)
      gradeField.value = referral.grade || '';
      gradeField.disabled = true;
    }
  }
  
  // Date
  const dateInput = document.getElementById('view-dateOfInterview');
  if (referral.referralDate) {
    const date = new Date(referral.referralDate);
    dateInput.value = date.toISOString().split('T')[0];
  }
  
  // Referred By - ALWAYS DISABLED (NOT EDITABLE)
  const referredByField = document.getElementById('view-adviser');
  if (referredByField) {
    if (isStudentSubmission) {
      const currentReferredBy = referral.referredBy || 'Student Self-Report';
      referredByField.value = currentReferredBy;
      referredByField.disabled = true;  // ALWAYS disabled
    } else {
      const adviserName = referral.createdBy ? 
        (referral.createdBy.fullName || referral.createdBy.username) : 
        'Unknown';
      referredByField.value = adviserName;
      referredByField.disabled = true;
    }
  }
  
  document.getElementById('view-reason').value = referral.reason;
  document.getElementById('view-description').value = referral.description || '';
  document.getElementById('view-severity').value = referral.severity;
  document.getElementById('view-status').value = referral.status;
  
  // Handle category
  const categorySelect = document.getElementById('view-category');
  const referralCategory = referral.category || '';
  
  const categoryContainer = categorySelect.parentElement;
  const existingWarning = categoryContainer.querySelector('.category-warning');
  if (existingWarning) {
    existingWarning.remove();
  }
  
  const categoryExists = availableCategories.some(
    cat => cat.name === referralCategory
  );
  
  if (categoryExists && referralCategory) {
    categorySelect.value = referralCategory;
  } else {
    categorySelect.value = '';
    if (referralCategory) {
      const warningDiv = document.createElement('div');
      warningDiv.className = 'category-warning';
      warningDiv.style.cssText = 'color: #f59e0b; font-size: 12px; margin-top: 4px;';
      warningDiv.innerHTML = `⚠️ Previous category "${referralCategory}" no longer exists. You can leave this empty or select a new category.`;
      categoryContainer.appendChild(warningDiv);
    }
  }
  
  document.getElementById('view-notes').value = referral.notes || '';
  
  handleStatusChange(referral.status);
}

// NEW FUNCTION: Update grade options in view modal
function updateViewGradeOptions(level, selectedGrade = '') {
  const gradeSelect = document.getElementById('view-grade');
  if (!gradeSelect) return;
  
  // Clear existing options
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
    
    // Set selected grade if provided
    if (selectedGrade) {
      gradeSelect.value = selectedGrade;
    }
  } else {
    gradeSelect.disabled = true;
  }
}

function handleStatusChange(status) {
  const notesSection = document.getElementById('notesSection');
  const notesTextarea = document.getElementById('view-notes');
  
  if (status === 'For Consultation' || status === 'Complete') {
    notesSection.style.display = 'block';
    notesTextarea.required = true;
  } else {
    notesSection.style.display = 'none';
    notesTextarea.required = false;
  }
}

// Handle status update - REMOVED REFERRED BY FROM SUBMISSION
async function handleStatusUpdate(e) {
  e.preventDefault();
  
  const referralId = document.getElementById('viewReferralId').value;
  const status = document.getElementById('view-status').value;
  const notes = document.getElementById('view-notes').value.trim();
  const severity = document.getElementById('view-severity').value;
  const category = document.getElementById('view-category').value;
  
  if ((status === 'For Consultation' || status === 'Complete') && !notes) {
    showAlert('Please add consultation notes before setting this status', 'error');
    return;
  }
  
  if (category && category !== '') {
    const categoryExists = availableCategories.some(cat => cat.name === category);
    if (!categoryExists) {
      showAlert('Selected category is not valid. Please select a valid category from the dropdown list.', 'error');
      return;
    }
  }
  
  const formData = {
    status: status,
    severity: severity,
    notes: notes || undefined
  };
  
  if (category && category !== '') {
    formData.category = category;
  } else {
    formData.category = null;
  }
  
  // Check if this is a student submission
  const form = e.target;
  const isStudentSubmission = form.dataset.isStudentSubmission === 'true';
  
  if (isStudentSubmission) {
    // For student submissions, include editable fields
    const studentId = document.getElementById('view-studentId').value.trim();
    const studentName = document.getElementById('view-studentName').value.trim();
    const level = document.getElementById('view-level').value;
    const grade = document.getElementById('view-grade').value;
    
    // Validate required fields
    if (!studentName) {
      showAlert('Student name is required', 'error');
      return;
    }
    
    if (!level) {
      showAlert('Level is required', 'error');
      return;
    }
    
    if (!grade) {
      showAlert('Grade is required', 'error');
      return;
    }
    
    // Add editable fields to formData (excluding referredBy)
    formData.studentId = studentId || null;
    formData.studentName = studentName;
    formData.level = level;
    formData.grade = grade;
  } else {
    // For teacher referrals, only studentId can be edited
    const studentId = document.getElementById('view-studentId').value.trim();
    if (studentId) {
      formData.studentId = studentId;
    }
  }
  
  try {
    const response = await apiClient.put(`/referrals/${referralId}`, formData);
    
    if (response.success) {
      showAlert('Referral updated successfully!', 'success');
      closeViewModal();
      loadReferrals();
    } else {
      showAlert(response.error || 'Failed to update referral', 'error');
    }
  } catch (error) {
    console.error('Error updating referral:', error);
    showAlert('Error updating referral. Please try again.', 'error');
  }
}

function getStatusClass(status) {
  const statusMap = {
    'Pending': 'status-pending',
    'Under Review': 'status-under-review',
    'For Consultation': 'status-for-consultation',
    'Complete': 'status-complete'
  };
  return statusMap[status] || 'status-pending';
}

function getSeverityClass(severity) {
  const severityMap = {
    'Low': 'severity-low',
    'Medium': 'severity-medium',
    'High': 'severity-high'
  };
  return severityMap[severity] || 'severity-medium';
}

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

window.viewReferral = viewReferral;
window.openDeleteModal = openDeleteModal;
window.closeViewModal = closeViewModal;
window.closeDeleteModal = closeDeleteModal;