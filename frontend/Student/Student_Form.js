//Student Student_Form.js

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

  // Generate Referral ID
  const storedCount = localStorage.getItem('referralCount') || 0;
  const newCount = parseInt(storedCount) + 1;
  const formattedNum = String(newCount).padStart(4, '0');
  const referralId = `REF-${formattedNum}`;
  
  // Save the new count
  localStorage.setItem('referralCount', newCount);

  // Get form data
  const nameOption = document.getElementById('nameOption').value;
  let studentName = 'Anonymous';
  
  if (nameOption === 'realName') {
    studentName = document.getElementById('studentName').value;
  } else if (nameOption === 'anonymous') {
    const anonymousName = document.getElementById('studentName').value.trim();
    studentName = anonymousName || 'Anonymous';
  }

  const formData = {
    referralId: referralId,
    nameOption: nameOption,
    studentName: studentName,
    concern: document.getElementById('concern').value,
    timestamp: new Date().toISOString()
  };

  console.log("Submitting Concern:", formData);

  // 📌 Optional: Connect to backend (update URL when ready)
  try {
    const response = await fetch('/submit-concern', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      showConfirmation(referralId);
    } else {
      // Even if backend fails, show confirmation (for demo purposes)
      showConfirmation(referralId);
    }
  } catch (error) {
    console.log('Backend not connected, showing confirmation anyway');
    // Show confirmation even without backend
    showConfirmation(referralId);
  }
});

// ==================== Show Confirmation Screen ====================

function showConfirmation(referralId) {
  // Hide form, show confirmation
  document.getElementById('formScreen').style.display = 'none';
  document.getElementById('confirmationScreen').style.display = 'block';
  
  // Display the referral ID
  document.getElementById('displayReferralId').textContent = referralId;
}
