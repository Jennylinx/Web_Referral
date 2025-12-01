// Teacher/Adviser StudentProfile.js - FIXED VERSION
document.addEventListener('DOMContentLoaded', async function() {
  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user || user.role !== 'Teacher') {
    window.location.href = '../../pages/LoginForm.html';
    return;
  }

  // Display adviser name
  document.getElementById('adviserName').textContent = user.fullName;

  // Elements
  const studentTable = document.getElementById('studentTable');
  const searchInput = document.getElementById('searchInput');
  const levelFilter = document.getElementById('levelFilter');
  const gradeFilter = document.getElementById('gradeFilter');
  const studentCount = document.getElementById('studentCount');
  const bulkUploadBtn = document.getElementById('bulkUploadBtn');
  const uploadModal = document.getElementById('uploadModal');
  const resultsModal = document.getElementById('resultsModal');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const confirmUploadBtn = document.getElementById('confirmUploadBtn');
  const cancelUploadBtn = document.getElementById('cancelUploadBtn');
  const closeResultsBtn = document.getElementById('closeResultsBtn');
  const uploadProgress = document.getElementById('uploadProgress');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  let allStudents = [];
  let selectedFile = null;

  // Load students
  async function loadStudents() {
    try {
      console.log('📚 Loading students for teacher:', user.fullName);
      
      const response = await apiClient.get('/students');
      
      console.log('📥 Students response:', response);
      
      if (response.success) {
        allStudents = response.data || [];
        displayStudents(allStudents);
        updateStudentCount(allStudents.length);
      } else {
        console.error('Failed to load students:', response.error);
        showCustomAlert(response.error || 'Failed to load students', 'error');
        studentTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #ef4444;">Failed to load students</td></tr>';
      }
    } catch (error) {
      console.error('Error loading students:', error);
      showCustomAlert('Error loading students: ' + error.message, 'error');
      studentTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #ef4444;">Error loading students</td></tr>';
    }
  }

  // Display students in table
  function displayStudents(students) {
    if (students.length === 0) {
      studentTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #6b7280;">No students found. Click "Bulk Upload Students" to add your students.</td></tr>';
      return;
    }

    studentTable.innerHTML = students.map(student => {
      const fullName = student.fullName || 
        `${student.lastName}, ${student.firstName}${student.middleName ? ' ' + student.middleName : ''}`;
      
      return `
        <tr>
          <td>${student.studentId || 'N/A'}</td>
          <td>${fullName}</td>
          <td>${student.level || 'N/A'}</td>
          <td>${student.grade || 'N/A'}</td>
          <td>${student.contactNumber || 'N/A'}</td>
        </tr>
      `;
    }).join('');
  }

  // Update student count
  function updateStudentCount(count) {
    studentCount.textContent = count;
  }

  // Filter students
  function filterStudents() {
    const search = searchInput.value.toLowerCase();
    const level = levelFilter.value;
    const grade = gradeFilter.value;

    const filtered = allStudents.filter(student => {
      const fullName = student.fullName || 
        `${student.firstName} ${student.lastName}`;
      
      const matchesSearch = !search || 
        student.studentId?.toLowerCase().includes(search) ||
        student.firstName?.toLowerCase().includes(search) ||
        student.lastName?.toLowerCase().includes(search) ||
        fullName.toLowerCase().includes(search);
      
      const matchesLevel = !level || student.level === level;
      const matchesGrade = !grade || student.grade === grade;

      return matchesSearch && matchesLevel && matchesGrade;
    });

    displayStudents(filtered);
    updateStudentCount(filtered.length);
  }

  // Event listeners for filters
  searchInput.addEventListener('input', filterStudents);
  levelFilter.addEventListener('change', filterStudents);
  gradeFilter.addEventListener('change', filterStudents);

  // Bulk Upload Modal
  bulkUploadBtn.addEventListener('click', () => {
    uploadModal.style.display = 'block';
    resetUploadModal();
  });

  // Close modals
  const closeButtons = document.querySelectorAll('.close');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      uploadModal.style.display = 'none';
      resultsModal.style.display = 'none';
    });
  });

  cancelUploadBtn.addEventListener('click', () => {
    uploadModal.style.display = 'none';
    resetUploadModal();
  });

  closeResultsBtn.addEventListener('click', () => {
    resultsModal.style.display = 'none';
  });

  // Click outside to close
  window.addEventListener('click', (e) => {
    if (e.target === uploadModal) {
      uploadModal.style.display = 'none';
      resetUploadModal();
    }
    if (e.target === resultsModal) {
      resultsModal.style.display = 'none';
    }
  });

  // Drop zone functionality
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#10b981';
    dropZone.style.background = 'rgba(16, 185, 129, 0.05)';
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#333';
    dropZone.style.background = 'rgba(26, 26, 26, 0.5)';
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#333';
    dropZone.style.background = 'rgba(26, 26, 26, 0.5)';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });

  // Handle file selection
  function handleFileSelect(file) {
    console.log('📎 File selected:', file.name, file.type, file.size);
    
    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    const validExtensions = /\.(xlsx|xls|csv)$/i;
    
    if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
      showCustomAlert('Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.', 'error');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showCustomAlert('File is too large. Maximum size is 10MB.', 'error');
      return;
    }

    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.style.display = 'block';
    confirmUploadBtn.disabled = false;
    
    console.log('✅ File validated successfully');
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Upload file
  confirmUploadBtn.addEventListener('click', async () => {
    if (!selectedFile) {
      showCustomAlert('Please select a file first', 'error');
      return;
    }

    console.log('📤 Starting upload for file:', selectedFile.name);

    // Create FormData
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Show progress
      confirmUploadBtn.disabled = true;
      cancelUploadBtn.disabled = true;
      uploadProgress.style.display = 'block';
      progressBar.style.width = '30%';
      progressText.textContent = 'Uploading file...';

      console.log('📡 Sending request to /students/bulk-upload');

      // Use apiClient upload method
      const response = await apiClient.upload('/students/bulk-upload', formData);

      console.log('📥 Upload response:', response);

      if (!response.success) {
        throw new Error(response.error || response.message || 'Upload failed');
      }

      progressBar.style.width = '100%';
      progressText.textContent = 'Processing complete!';

      // Close upload modal after a short delay
      setTimeout(() => {
        uploadModal.style.display = 'none';
        resetUploadModal();
        
        // Show results
        displayUploadResults(response);
        
        // Reload students
        loadStudents();
      }, 500);

    } catch (error) {
      console.error('❌ Upload error:', error);
      showCustomAlert(error.message || 'Failed to upload file', 'error');
      resetUploadModal();
    }
  });

  // Display upload results
  function displayUploadResults(response) {
    console.log('📊 Displaying results:', response);
    
    const summary = response.summary || { inserted: 0, duplicates: 0, errors: 0, totalRows: 0 };
    const duplicates = response.duplicates || [];
    const errors = response.errors || [];
    
    let html = `
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: #10b981; margin-top: 0;">📊 Upload Summary</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
          <div style="background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid rgba(16, 185, 129, 0.3);">
            <div style="font-size: 2rem; font-weight: bold; color: #10b981;">${summary.inserted}</div>
            <div style="color: #10b981; font-size: 0.9rem;">✅ Added</div>
          </div>
          <div style="background: rgba(251, 191, 36, 0.1); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid rgba(251, 191, 36, 0.3);">
            <div style="font-size: 2rem; font-weight: bold; color: #fbbf24;">${summary.duplicates}</div>
            <div style="color: #fbbf24; font-size: 0.9rem;">⚠️ Duplicates</div>
          </div>
          <div style="background: rgba(239, 68, 68, 0.1); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid rgba(239, 68, 68, 0.3);">
            <div style="font-size: 2rem; font-weight: bold; color: #ef4444;">${summary.errors}</div>
            <div style="color: #ef4444; font-size: 0.9rem;">❌ Errors</div>
          </div>
          <div style="background: rgba(59, 130, 246, 0.1); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid rgba(59, 130, 246, 0.3);">
            <div style="font-size: 2rem; font-weight: bold; color: #3b82f6;">${summary.totalRows}</div>
            <div style="color: #3b82f6; font-size: 0.9rem;">📋 Total Rows</div>
          </div>
        </div>
      </div>
    `;

    // Show duplicates
    if (duplicates.length > 0) {
      html += `
        <div style="margin-bottom: 1.5rem;">
          <h4 style="color: #fbbf24; margin-top: 0;">⚠️ Duplicates Found (${duplicates.length})</h4>
          <div style="max-height: 200px; overflow-y: auto; background: rgba(251, 191, 36, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid rgba(251, 191, 36, 0.3);">
            ${duplicates.map(d => `
              <div style="margin-bottom: 0.5rem; color: #e0e0e0;">
                <strong style="color: #fbbf24;">Row ${d.row}:</strong> ${d.name} (${d.studentId}) - ${d.reason}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Show errors
    if (errors.length > 0) {
      html += `
        <div style="margin-bottom: 1.5rem;">
          <h4 style="color: #ef4444; margin-top: 0;">❌ Errors (${errors.length})</h4>
          <div style="max-height: 200px; overflow-y: auto; background: rgba(239, 68, 68, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3);">
            ${errors.map(e => `
              <div style="margin-bottom: 0.5rem; color: #e0e0e0;">
                <strong style="color: #ef4444;">Row ${e.row}:</strong> ${e.error}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Success message
    if (summary.inserted > 0) {
      html += `
        <div style="background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3);">
          <p style="margin: 0; color: #10b981;">
            ✅ Successfully added ${summary.inserted} student${summary.inserted !== 1 ? 's' : ''} to your class!
          </p>
        </div>
      `;
    }

    document.getElementById('resultsContent').innerHTML = html;
    resultsModal.style.display = 'block';
  }

  // Reset upload modal
  function resetUploadModal() {
    selectedFile = null;
    fileInput.value = '';
    fileInfo.style.display = 'none';
    uploadProgress.style.display = 'none';
    progressBar.style.width = '0%';
    confirmUploadBtn.disabled = true;
    cancelUploadBtn.disabled = false;
    
    // Reset drop zone styling
    dropZone.style.borderColor = '#333';
    dropZone.style.background = 'rgba(26, 26, 26, 0.5)';
  }

  // Profile dropdown
  const profileButton = document.getElementById('profileButton');
  const profileDropdown = document.getElementById('profileDropdown');

  if (profileButton && profileDropdown) {
    profileButton.addEventListener('click', function(e) {
      e.stopPropagation();
      profileDropdown.classList.toggle('active');
    });

    document.addEventListener('click', function(e) {
      if (!profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove('active');
      }
    });
  }

  // Initial load
  console.log('🚀 Initializing student profile page...');
  loadStudents();
});