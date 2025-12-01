//Teacher/Adviser Home.js

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
  };
  loadRecentReferrals();
});

// Load recent referrals
async function loadRecentReferrals() {
  try {
    const response = await apiClient.get('/referrals/recent');
    
    if (response.success) {
      displayRecentReferrals(response.data);
    } else {
      console.error('Failed to load recent referrals');
    }
  } catch (error) {
    console.error('Error loading recent referrals:', error);
    const tbody = document.getElementById('studentTable');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Error loading referrals</td></tr>';
    }
  }
}

// Display recent referrals in table
function displayRecentReferrals(referrals) {
  const tbody = document.getElementById('studentTable');
  if (!tbody) return;

  if (referrals.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No referrals yet</td></tr>';
    return;
  }

  tbody.innerHTML = referrals.map(referral => `
    <tr>
      <td>${referral.referralId}</td>
      <td>${referral.studentName}</td>
      <td>${new Date(referral.createdAt).toLocaleDateString()}</td>
      <td><span class="btn-view-status status-${referral.status.replace(/\s+/g, '-').toLowerCase()}">${referral.status}</span></td>
    </tr>
  `).join('');
}