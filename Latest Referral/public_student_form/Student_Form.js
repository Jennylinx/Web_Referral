//Student Student_Form.js - FIXED WITH BETTER ERROR HANDLING

// Proceed from Instructions to Form
document.getElementById('proceedBtn').addEventListener('click', () => {
  document.getElementById('instructionsScreen').style.display = 'none';
  document.getElementById('formScreen').style.display = 'block';
});

// Back to Instructions from Form
document.getElementById('backToInstructionsBtn').addEventListener('click', () => {
  document.getElementById('formScreen').style.display = 'none';
  document.getElementById('instructionsScreen').style.display = 'block';
});

// Submit Another Concern - Reset to Form
document.getElementById('submitAnotherBtn').addEventListener('click', () => {
  document.getElementById('confirmationScreen').style.display = 'none';
  document.getElementById('formScreen').style.display = 'block';
  document.getElementById('complaintForm').reset();
  document.getElementById('nameInputGroup').style.display = 'none';
});

// ==================== Name Option Handling ====================

document.getElementById('nameOption').addEventListener('change', function() {
  const nameInputGroup = document.getElementById('nameInputGroup');
  const studentNameInput = document.getElementById('studentName');
  const nameLabel = document.getElementById('nameLabel');
  const selectedOption = this.value;
  
  if (selectedOption === 'realName') {
    // Show name input for real name
    nameInputGroup.style.display = 'block';
    nameLabel.textContent = 'Your Name';
    studentNameInput.placeholder = 'Enter your full name';
    studentNameInput.required = true;
    studentNameInput.value = '';
  } else if (selectedOption === 'anonymous') {
    // Show name input for anonymous name
    nameInputGroup.style.display = 'block';
    nameLabel.textContent = 'Anonymous Name (Optional)';
    studentNameInput.placeholder = 'e.g., Worried Student, Student123, etc.';
    studentNameInput.required = false;
    studentNameInput.value = '';
  } else if (selectedOption === 'preferNot') {
    // Hide name input
    nameInputGroup.style.display = 'none';
    studentNameInput.required = false;
    studentNameInput.value = 'Anonymous';
  }
});

// ==================== Form Submission ====================

document.getElementById('complaintForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Show loading state
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Submitting...';
  submitBtn.disabled = true;

  try {
    // Get form data
    const nameOption = document.getElementById('nameOption').value;
    let studentName = 'Anonymous';
    
    if (nameOption === 'realName') {
      studentName = document.getElementById('studentName').value.trim();
      if (!studentName) {
        showError('Please enter your name');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }
    } else if (nameOption === 'anonymous') {
      const anonymousName = document.getElementById('studentName').value.trim();
      studentName = anonymousName || 'Anonymous';
    } else if (nameOption === 'preferNot') {
      studentName = 'Prefer not to say';
    }

    const concern = document.getElementById('concern').value.trim();
    
    if (!concern) {
      showError('Please describe your concern');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      return;
    }

    const formData = {
      studentName: studentName,
      concern: concern,
      nameOption: nameOption,
      isStudentSubmitted: true  // Flag to mark as student submission
    };

    console.log("Submitting Concern:", formData);
      
    // Submit to backend using apiClient
    let response;
    
    // Check if apiClient is available (for internal use)
    if (typeof apiClient !== 'undefined') {
      response = await apiClient.post('/public-referrals', formData);
    } else {
      // Fallback to direct fetch for public form
      const fetchResponse = await fetch('http://localhost:3000/api/public-referrals', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      response = await fetchResponse.json();
      
      // Normalize response format
      if (!fetchResponse.ok) {
        response.success = false;
        response.error = response.error || response.message || 'Failed to submit concern';
      } else {
        response.success = true;
      }
    }

    console.log("Server Response:", response);

    if (response.success) {
      // Show confirmation with the generated referral ID
      const referralId = response.data?.referralId || response.referralId || 'N/A';
      showConfirmation(referralId);
      
      // Reset form
      document.getElementById('complaintForm').reset();
      document.getElementById('nameInputGroup').style.display = 'none';
    } else {
      // Show error message
      const errorMessage = response.error || response.message || 'Failed to submit concern. Please try again.';
      console.error('Submission failed:', errorMessage);
      showError(errorMessage);
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  } catch (error) {
    console.error('Error submitting concern:', error);
    
    // Provide more detailed error message
    let errorMessage = 'Network error. Please check your connection and try again.';
    
    if (error.message) {
      errorMessage = `Error: ${error.message}`;
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Cannot connect to server. Please make sure the server is running on http://localhost:3000';
    }
    
    showError(errorMessage);
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// ==================== Show Confirmation Screen ====================

function showConfirmation(referralId) {
  // Hide form, show confirmation
  document.getElementById('formScreen').style.display = 'none';
  document.getElementById('confirmationScreen').style.display = 'block';
  
  // Display the referral ID
  document.getElementById('displayReferralId').textContent = referralId;
  
  // Reset submit button
  const submitBtn = document.querySelector('#complaintForm button[type="submit"]');
  submitBtn.textContent = 'Submit Concern';
  submitBtn.disabled = false;
}

// ==================== Show Error Message ====================

function showError(message) {
  // Create error alert div if it doesn't exist
  let errorDiv = document.getElementById('errorAlert');
  
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.id = 'errorAlert';
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #fee;
      color: #c33;
      padding: 15px 20px;
      border-radius: 8px;
      border-left: 4px solid #c33;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    document.body.appendChild(errorDiv);
  }
  
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  
  // Auto-hide after 7 seconds
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 7000);
}

// Add CSS animation for error alert
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);