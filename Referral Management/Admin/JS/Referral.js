document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 Referral.js loaded")

  // Grade limitations based on level
  const gradeLimits = {
    "Elementary": [1, 2, 3, 4, 5, 6],
    "High School": [7, 8, 9, 10],
    "Senior High School": [11, 12]
  }

// Highlight active nav item
const navItems = document.querySelectorAll(".nav-item");

// Get current page filename
const currentPage = window.location.pathname.split("/").pop().toLowerCase();

navItems.forEach(item => {
  // Extract only the filename from href
  const itemHref = item.getAttribute("href").split("/").pop().toLowerCase();

  if (itemHref === currentPage) {
    item.classList.add("active");
  } else {
    item.classList.remove("active");
  }
})

  const searchInput = document.getElementById("searchInput")
  const gradeFilter = document.getElementById("gradeFilter")
  const tableBody = document.getElementById("studentTable")
  const addReferralBtn = document.getElementById("addReferralBtn")
  const modal = document.getElementById("referralModal")
  const closeModalBtn = document.getElementById("closeModalBtn")
  const referralForm = document.getElementById("referralForm")

  // Add modal level and grade elements
  const levelSelect = document.getElementById("level")
  const gradeSelect = document.getElementById("grade")

  // Edit modal elements
  const editModal = document.getElementById("editReferralModal")
  const closeEditModalBtn = document.getElementById("closeEditModalBtn")
  const cancelEditModalBtn = document.getElementById("cancelEditModalBtn")
  const editReferralForm = document.getElementById("editReferralForm")
  const deleteReferralBtn = document.getElementById("deleteReferralBtn")
  const editLevelSelect = document.getElementById("editLevel")
  const editGradeSelect = document.getElementById("editGrade")

  // Setup grade dropdown listeners
  setupGradeDropdown(levelSelect, gradeSelect)
  setupGradeDropdown(editLevelSelect, editGradeSelect)

  // Load referrals on page load
  loadReferrals()

  // Event listeners for filters
  if (searchInput) searchInput.addEventListener("keyup", debounce(filterReferrals, 300))
  if (gradeFilter) gradeFilter.addEventListener("change", filterReferrals)

  // ========== GRADE DROPDOWN SETUP ==========
  function setupGradeDropdown(levelDropdown, gradeDropdown) {
    if (!levelDropdown || !gradeDropdown) return

    levelDropdown.addEventListener("change", function() {
      const selectedLevel = this.value
      gradeDropdown.innerHTML = '<option value="">Select grade</option>'
      
      if (selectedLevel && gradeLimits[selectedLevel]) {
        gradeDropdown.disabled = false
        gradeLimits[selectedLevel].forEach(grade => {
          const option = document.createElement("option")
          option.value = grade
          option.textContent = `Grade ${grade}`
          gradeDropdown.appendChild(option)
        })
      } else {
        gradeDropdown.disabled = true
        gradeDropdown.innerHTML = '<option value="">Select level first</option>'
      }
    })
  }

  // ========== LOAD REFERRALS ==========
  async function loadReferrals(filters = {}) {
    try {
      tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Loading referrals...</td></tr>'
      
      const response = await apiClient.getReferrals(filters)

      if (response.success) {
        displayReferrals(response.data)
      } else {
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No referrals found</td></tr>'
      }
    } catch (error) {
      console.error("Error loading referrals:", error)
      tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Error loading referrals</td></tr>'
    }
  }

  // ========== DISPLAY REFERRALS ==========
  function displayReferrals(referrals) {
    if (referrals.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No referrals found</td></tr>'
      return
    }

    tableBody.innerHTML = referrals
      .map((referral) => {
        const date = new Date(referral.createdAt).toLocaleDateString()
        const fullName = `${referral.firstName} ${referral.middleName} ${referral.lastName}`
        
        // Status badge colors
        let statusClass = 'status-pending'
        if (referral.status === 'Complete') statusClass = 'status-complete'
        else if (referral.status === 'In Progress') statusClass = 'status-progress'
        
        return `
        <tr data-id="${referral._id}" style="cursor: pointer;">
          <td>${fullName}</td>
          <td>${referral.studentId || "N/A"}</td>
          <td>${referral.level}</td>
          <td>Grade ${referral.grade}</td>
          <td>${referral.reason}</td>
          <td><span class="status-badge ${statusClass}">${referral.status}</span></td>
          <td>${date}</td>
        </tr>
      `
      })
      .join("")

    // Add click handlers to rows
    const rows = tableBody.querySelectorAll("tr")
    rows.forEach((row) => {
      row.addEventListener("click", () => {
        const id = row.getAttribute("data-id")
        openEditModal(id)
      })
    })
  }

  // ========== FILTER REFERRALS ==========
  function filterReferrals() {
    const searchValue = searchInput.value.toLowerCase().trim()
    const levelValue = gradeFilter.value

    const filters = {}

    if (searchValue) {
      filters.search = searchValue
    }

    if (levelValue !== "all") {
      filters.level = levelValue
    }

    loadReferrals(filters)
  }

  // ========== DEBOUNCE ==========
  function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

    /* =============================
     PROFILE DROPDOWN
  ============================= */
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


  // ========== ADD REFERRAL MODAL ==========
  function openAddModal() {
    modal.classList.add("show")
    document.body.style.overflow = "hidden"
    // Set today's date as default
    document.getElementById("dateOfInterview").valueAsDate = new Date()
  }

  function closeAddModal() {
    modal.classList.remove("show")
    document.body.style.overflow = ""
    referralForm.reset()
    gradeSelect.disabled = true
    gradeSelect.innerHTML = '<option value="">Select level first</option>'
  }

  if (addReferralBtn) {
    addReferralBtn.addEventListener("click", (e) => {
      e.preventDefault()
      openAddModal()
    })
  }

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeAddModal)

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (modal && modal.classList.contains("show")) closeAddModal()
      if (editModal && editModal.classList.contains("show")) closeEditModal()
    }
  })

  // ========== ADD REFERRAL FORM SUBMIT ==========
  if (referralForm) {
    referralForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      // Safely read values; some optional fields (like priority) may be absent in the markup
      const getValue = (id) => {
        const el = document.getElementById(id)
        return el && typeof el.value === 'string' ? el.value.trim() : ''
      }

      const getNumber = (id) => {
        const el = document.getElementById(id)
        return el && el.value ? parseInt(el.value, 10) : undefined
      }

      const formData = {
        studentName: getValue("studentName"),
        adviser: getValue("adviser"),
        level: getValue("level"),
        grade: getValue("grade"),
        dateOfInterview: getValue("dateOfInterview"),
        reason: getValue("reason"),
        description: getValue("description"),
      }

      if (!formData.studentId) delete formData.studentId

      // Show confirmation dialog
      customAlert.confirm(
        "Are you sure you want to submit this referral?",
        async () => {
          try {
            const response = await apiClient.createReferral(formData)

            if (response.success) {
              customAlert.success("Referral successfully submitted!")
              closeAddModal()
              loadReferrals()
            }
          } catch (error) {
            console.error("Error creating referral:", error)
            customAlert.error("Error adding referral: " + error.message)
          }
        },
        "Submit Referral"
      )
    })
  }

  // ========== EDIT REFERRAL MODAL ==========
  async function openEditModal(referralId) {
    try {
      const response = await apiClient.getReferralById(referralId)

      if (response.success) {
        const referral = response.data
        const isComplete = referral.status === 'Complete'

        // Populate form
        document.getElementById("editstudentName").value = referral.studentName
        document.getElementById("edit-adviser").value = referral.adviser || ""
        document.getElementById("edit-level").value = referral.level
        document.getElementById("edit-dateOfInterview").value = referral.dateOfInterview
        document.getElementById("edit-status").value = referral.status       
        document.getElementById("edit-severity").value = referral.severity
        
        // Trigger level change to populate grades
        const event = new Event('change')
        editLevelSelect.dispatchEvent(event)
        
        // Wait a bit for grades to populate, then set the value
        setTimeout(() => {
          document.getElementById("edit-grade").value = referral.grade
        }, 50)
        
        document.getElementById("edit-reason").value = referral.reason
        document.getElementById("edit-description").value = referral.description || ""

        // Handle form fields for complete status
        const formFields = editReferralForm.querySelectorAll('input, select, textarea');
        formFields.forEach(field => {
          if (field.id !== 'edit-status') {  // Allow status to be changed
            field.disabled = isComplete;
          }
        });

        // Hide description field when complete
        const descriptionGroup = document.querySelector('.form-group:has(#edit-description)');
        if (descriptionGroup) {
          descriptionGroup.style.display = isComplete ? 'none' : 'block';
        }

        // Convert date input to text display when complete
        const dateInput = document.getElementById('edit-dateOfInterview');
        if (isComplete && dateInput) {
          const dateValue = new Date(dateInput.value);
          const formattedDate = dateValue.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          const dateLabel = dateInput.previousElementSibling;
          if (dateLabel) {
            dateLabel.textContent = 'Date Completed';
          }
          dateInput.type = 'text';
          dateInput.value = formattedDate;
        }

        // Hide or show action buttons based on status
        const submitBtn = editReferralForm.querySelector('button[type="submit"]');
        const deleteBtn = document.getElementById('deleteReferralBtn');
        if (isComplete) {
          submitBtn.style.display = 'none';
          deleteBtn.style.display = 'none';
          editReferralForm.classList.add('view-only');
          document.querySelector('.modal-header h2').textContent = 'View Referral Details';
        } else {
          submitBtn.style.display = 'block';
          deleteBtn.style.display = 'block';
          editReferralForm.classList.remove('view-only');
          document.querySelector('.modal-header h2').textContent = 'Edit Referral';
        }

        editModal.classList.add("show");
        document.body.style.overflow = "hidden";
      }
    } catch (error) {
      console.error("Error loading referral:", error)
      customAlert.error("Error loading referral details")
    }
  }

  function closeEditModal() {
    editModal.classList.remove("show")
    document.body.style.overflow = ""
    editReferralForm.reset()
    editGradeSelect.disabled = true
    editGradeSelect.innerHTML = '<option value="">Select level first</option>'
    
    // Reset form state
    editReferralForm.classList.remove('view-only')
    const formFields = editReferralForm.querySelectorAll('input, select, textarea')
    console.groupCollapsed('closeEditModal: resetting edit modal')
    formFields.forEach(field => {
      console.debug('reset field:', field.id, 'value(before):', field.value, 'disabled(before):', field.disabled)
      field.disabled = false
      // Reset date input type and value
      if (field.id === 'editDateOfInterview') {
        try { field.type = 'date' } catch (e) {}
        // Restore date input value from data attribute if present, otherwise clear
        const orig = field.getAttribute('data-original-date')
        field.value = orig || ''
        field.removeAttribute('data-original-date')
        const dateLabel = field.previousElementSibling
        if (dateLabel) { dateLabel.textContent = 'Date of Interview *' }
        console.debug('reset date field to:', field.value)
      }
      console.debug('reset field done:', field.id, 'value(after):', field.value, 'disabled(after):', field.disabled)
    })
    console.groupEnd()
    
    // Show description field
    const descriptionGroup = document.querySelector('.form-group:has(#editDescription)')
    if (descriptionGroup) {
      descriptionGroup.style.display = 'block'
    }
    
    // Reset buttons
    const submitBtn = editReferralForm.querySelector('button[type="submit"]')
    const deleteBtn = document.getElementById('deleteReferralBtn')
    if (submitBtn) submitBtn.style.display = 'block'
    if (deleteBtn) deleteBtn.style.display = 'block'
    
    // Reset modal header
    document.querySelector('.modal-header h2').textContent = 'Edit Referral'
  }

  if (closeEditModalBtn) closeEditModalBtn.addEventListener("click", closeEditModal)
  if (cancelEditModalBtn) cancelEditModalBtn.addEventListener("click", closeEditModal)

  // ========== EDIT REFERRAL FORM SUBMIT ==========
  if (editReferralForm) {
    editReferralForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const referralId = document.getElementById("editReferralId").value
        const getValueEdit = (id) => {
          const el = document.getElementById(id)
          return el && typeof el.value === 'string' ? el.value.trim() : ''
        }

        const getNumberEdit = (id) => {
          const el = document.getElementById(id)
          return el && el.value ? parseInt(el.value, 10) : undefined
        }

        const formData = {
        studentName: getValue("edit-studentName"),
        adviser: getValue("edit-adviser"),
        level: getValue("edit-level"),
        grade: getValue("edit-grade"),
        dateOfInterview: getValue("edit-dateOfInterview"),
        reason: getValue("edit-reason"),
        description: getValue("edit-description"),
      }

      if (!formData.studentId) delete formData.studentId

      // Show confirmation dialog
      customAlert.confirm(
        "Are you sure you want to update this referral?",
        async () => {
          try {
            const response = await apiClient.updateReferral(referralId, formData)

            if (response.success) {
              customAlert.success("Referral successfully updated!")
              closeEditModal()
              loadReferrals()
            }
          } catch (error) {
            console.error("Error updating referral:", error)
            customAlert.error("Error updating referral: " + error.message)
          }
        },
        "Update Referral"
      )
    })
  }

  // ========== DELETE REFERRAL ==========
  if (deleteReferralBtn) {
    deleteReferralBtn.addEventListener("click", () => {
      const referralId = document.getElementById("editReferralId").value
      
      customAlert.confirm(
        "Are you sure you want to delete this referral? This action cannot be undone.",
        async () => {
          try {
            const response = await apiClient.deleteReferral(referralId)
            
            if (response.success) {
              customAlert.success("Referral deleted successfully!")
              closeEditModal()
              loadReferrals()
            }
          } catch (error) {
            console.error("Error deleting referral:", error)
            customAlert.error("Error deleting referral: " + error.message)
          }
        },
        "Delete Referral"
      )
    })
  }
})