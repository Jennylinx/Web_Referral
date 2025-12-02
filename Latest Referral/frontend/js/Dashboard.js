// Admin Dashboard.js with 

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🟢 Dashboard.js loaded");

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

  // Load categories first
  await loadCategories();

  // Load referral statistics
  loadReferralStats();

  // Load recent referrals
  loadRecentReferrals();

  // Load charts
  loadStatusChart();
  loadSeverityChart();
  loadGradeChart();
  loadCategoryChart();
  loadQuarterlyChart();

  // Filter change listeners
  document.getElementById("statusFilter")?.addEventListener("change", loadStatusChart);
  document.getElementById("priorityFilter")?.addEventListener("change", loadSeverityChart);
  document.getElementById("categoryFilter")?.addEventListener("change", loadCategoryChart);

  // ========== LOAD CATEGORIES FOR FILTERS ==========
  async function loadCategories() {
    try {
      const response = await apiClient.getCategories();
      
      if (response.success) {
        const categories = response.data || response.categories || [];
        populateCategoryFilter(categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  // Populate category filter dropdown
  function populateCategoryFilter(categories) {
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (!categoryFilter) return;
    
    // Keep the "All Categories" option
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    
    // Add categories from backend
    if (categories && categories.length > 0) {
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
      });
    }
  }

  // ========== LOAD RECENT REFERRALS ==========
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
      const tbody = document.getElementById('recentReferralsTable');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Error loading referrals</td></tr>';
      }
    }
  }

  // Display recent referrals in table
  function displayRecentReferrals(referrals) {
    const tbody = document.getElementById('recentReferralsTable');
    if (!tbody) return;

    if (referrals.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No recent referrals</td></tr>';
      return;
    }

    tbody.innerHTML = referrals.map(referral => `
      <tr>
        <td>${referral.referralId}</td>
        <td>${referral.studentName}</td>
        <td>${referral.level}</td>
        <td>${referral.grade}</td>
        <td>${new Date(referral.createdAt).toLocaleDateString()}</td>
        <td><span class="status-badge status-${referral.status.replace(/\s+/g, '-').toLowerCase()}">${referral.status}</span></td>
        <td><span class="severity-badge severity-${referral.severity.toLowerCase()}">${referral.severity}</span></td>
      </tr>
    `).join('');
  }

  // ========== LOAD REFERRAL STATISTICS ==========
  async function loadReferralStats() {
    try {
      const response = await apiClient.getReferralStats();
      
      if (response.success) {
        const stats = response.data;
        
        // Update stat cards
        document.getElementById("totalReferrals").textContent = stats.total || 0;
        document.getElementById("elementaryCount").textContent = stats.byLevel.elementary || 0;
        document.getElementById("juniorHighCount").textContent = stats.byLevel.juniorHigh || 0;
        document.getElementById("seniorHighCount").textContent = stats.byLevel.seniorHigh || 0;
      }
    } catch (error) {
      console.error("Error loading referral stats:", error);
      document.getElementById("totalReferrals").textContent = "Error";
    }
  }

  // ========== LOAD STATUS PIE CHART ==========
  let statusChart = null;
  async function loadStatusChart() {
    try {
      const filter = document.getElementById("statusFilter")?.value;
      const filters = filter && filter !== "all" ? { level: filter } : {};
      
      const response = await apiClient.getReferrals(filters);
      
      if (response.success) {
        const referrals = response.data;
        
        // Count by status - Updated to match new enum values
        const statusCounts = {
          'Pending': 0,
          'Under Review': 0,
          'For Consultation': 0,
          'Complete': 0
        };
        
        referrals.forEach(ref => {
          if (statusCounts.hasOwnProperty(ref.status)) {
            statusCounts[ref.status]++;
          }
        });

        const ctx = document.getElementById("statusPieChart")?.getContext("2d");
        if (!ctx) return;
        
        if (statusChart) {
          statusChart.destroy();
        }

        statusChart = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: Object.keys(statusCounts),
            datasets: [{
              data: Object.values(statusCounts),
              backgroundColor: [
                "rgba(251, 191, 36, 0.8)",  // Pending - Yellow
                "rgba(59, 130, 246, 0.8)",   // Under Review - Blue
                "rgba(147, 51, 234, 0.8)",   // For Consultation - Purple
                "rgba(16, 185, 129, 0.8)"    // Complete - Green
              ],
              borderColor: [
                "rgba(251, 191, 36, 1)",
                "rgba(59, 130, 246, 1)",
                "rgba(147, 51, 234, 1)",
                "rgba(16, 185, 129, 1)"
              ],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
                labels: {
                  color: '#e0e0e0',
                  padding: 15,
                  font: {
                    size: 12
                  }
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleColor: '#fff',
                bodyColor: '#fff',
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.parsed || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
    } catch (error) {
      console.error("Error loading status chart:", error);
    }
  }

  // ========== LOAD SEVERITY PIE CHART ==========
  let severityChart = null;
  async function loadSeverityChart() {
    try {
      const filter = document.getElementById("priorityFilter")?.value;
      const filters = filter && filter !== "all" ? { level: filter } : {};
      
      const response = await apiClient.getReferrals(filters);
      
      if (response.success) {
        const referrals = response.data;
        
        // Count by severity
        const severityCounts = {
          'Low': 0,
          'Medium': 0,
          'High': 0
        };
        
        referrals.forEach(ref => {
          if (severityCounts.hasOwnProperty(ref.severity)) {
            severityCounts[ref.severity]++;
          }
        });

        const ctx = document.getElementById("priorityPieChart")?.getContext("2d");
        if (!ctx) return;
        
        if (severityChart) {
          severityChart.destroy();
        }

        severityChart = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: Object.keys(severityCounts),
            datasets: [{
              data: Object.values(severityCounts),
              backgroundColor: [
                "rgba(16, 185, 129, 0.8)",  // Low - Green
                "rgba(251, 191, 36, 0.8)",   // Medium - Yellow
                "rgba(239, 68, 68, 0.8)"     // High - Red
              ],
              borderColor: [
                "rgba(16, 185, 129, 1)",
                "rgba(251, 191, 36, 1)",
                "rgba(239, 68, 68, 1)"
              ],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
                labels: {
                  color: '#e0e0e0',
                  padding: 15,
                  font: {
                    size: 12
                  }
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleColor: '#fff',
                bodyColor: '#fff',
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.parsed || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
    } catch (error) {
      console.error("Error loading severity chart:", error);
    }
  }

  // ========== LOAD INCIDENT CATEGORY BAR CHART (NEW) ==========
  let categoryChart = null;
  async function loadCategoryChart() {
    try {
      const filter = document.getElementById("categoryFilter")?.value;
      
      // Build filters - if a specific category is selected, filter by that category
      let apiUrl = '/referrals';
      if (filter && filter !== "all") {
        apiUrl += `?category=${encodeURIComponent(filter)}`;
      }
      
      const response = await apiClient.get(apiUrl);
      
      if (response.success) {
        const referrals = response.data;
        
        // Count by incident category
        const categoryCounts = {};
        referrals.forEach(ref => {
          if (ref.incidentCategory) {
            // Handle both object and string category formats
            const categoryName = typeof ref.incidentCategory === 'object' 
              ? ref.incidentCategory.name 
              : ref.incidentCategory;
            
            if (categoryName) {
              categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
            }
          } else if (ref.category) {
            // Fallback to category field if incidentCategory doesn't exist
            const categoryName = typeof ref.category === 'object' 
              ? ref.category.name 
              : ref.category;
            
            if (categoryName) {
              categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
            }
          }
        });

        // Check if we have any categories
        const ctx = document.getElementById("categoryChart")?.getContext("2d");
        if (!ctx) return;
        
        if (categoryChart) {
          categoryChart.destroy();
        }

        if (Object.keys(categoryCounts).length === 0) {
          console.log("No incident categories found in referrals");
          // Show empty chart message
          displayEmptyCategoryChart(ctx);
          return;
        }

        // Sort by count (descending) and take top 10
        const sortedCategories = Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        // Generate vibrant colors for each category
        const colorPalette = [
          "rgba(239, 68, 68, 0.8)",   // Red
          "rgba(251, 191, 36, 0.8)",  // Yellow
          "rgba(16, 185, 129, 0.8)",  // Green
          "rgba(59, 130, 246, 0.8)",  // Blue
          "rgba(147, 51, 234, 0.8)",  // Purple
          "rgba(236, 72, 153, 0.8)",  // Pink
          "rgba(249, 115, 22, 0.8)",  // Orange
          "rgba(20, 184, 166, 0.8)",  // Teal
          "rgba(139, 92, 246, 0.8)",  // Violet
          "rgba(34, 197, 94, 0.8)"    // Emerald
        ];

        const colors = sortedCategories.map((_, i) => 
          colorPalette[i % colorPalette.length]
        );
        const borderColors = colors.map(color => color.replace('0.8', '1'));

        categoryChart = new Chart(ctx, {
          type: "bar",
          data: {
            labels: sortedCategories.map(([name]) => name),
            datasets: [{
              label: "Number of Referrals",
              data: sortedCategories.map(([, count]) => count),
              backgroundColor: colors,
              borderColor: borderColors,
              borderWidth: 2,
              borderRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y', // Horizontal bar chart for better category name visibility
            scales: {
              x: {
                beginAtZero: true,
                ticks: {
                  color: '#e0e0e0',
                  stepSize: 1
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                },
                title: {
                  display: true,
                  text: 'Number of Incidents',
                  color: '#e0e0e0'
                }
              },
              y: {
                ticks: {
                  color: '#e0e0e0',
                  font: {
                    size: 11
                  }
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              }
            },
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleColor: '#fff',
                bodyColor: '#fff',
                callbacks: {
                  label: function(context) {
                    const value = context.parsed.x || 0;
                    const total = sortedCategories.reduce((sum, [, count]) => sum + count, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return `Incidents: ${value} (${percentage}%)`;
                  }
                }
              },
              title: {
                display: true,
                text: filter && filter !== 'all' ? `${filter} - Top Incident Categories` : 'Top Incident Categories',
                color: '#e0e0e0',
                font: {
                  size: 14,
                  weight: 'normal'
                },
                padding: {
                  bottom: 10
                }
              }
            }
          }
        });
      }
    } catch (error) {
      console.error("Error loading incident category chart:", error);
    }
  }

  // Display empty chart message
  function displayEmptyCategoryChart(ctx) {
    categoryChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ['No Data'],
        datasets: [{
          label: "Number of Referrals",
          data: [0],
          backgroundColor: "rgba(100, 100, 100, 0.3)",
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'No Incident Categories Found',
            color: '#e0e0e0'
          }
        }
      }
    });
  }

  // ========== LOAD GRADE LEVEL BAR CHART ==========
  let gradeChart = null;
  async function loadGradeChart() {
    try {
      const response = await apiClient.getReferrals();
      
      if (response.success) {
        const referrals = response.data;
        
        // Count by grade
        const gradeCounts = {};
        referrals.forEach(ref => {
          gradeCounts[ref.grade] = (gradeCounts[ref.grade] || 0) + 1;
        });

        // Sort grades
        const sortedGrades = Object.keys(gradeCounts).sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)) || 0;
          const numB = parseInt(b.match(/\d+/)) || 0;
          return numA - numB;
        });

        const ctx = document.getElementById("gradeChart")?.getContext("2d");
        if (!ctx) return;
        
        if (gradeChart) {
          gradeChart.destroy();
        }

        gradeChart = new Chart(ctx, {
          type: "bar",
          data: {
            labels: sortedGrades,
            datasets: [{
              label: "Number of Referrals",
              data: sortedGrades.map(grade => gradeCounts[grade]),
              backgroundColor: "rgba(59, 130, 246, 0.8)",
              borderColor: "rgba(59, 130, 246, 1)",
              borderWidth: 2,
              borderRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  color: '#e0e0e0',
                  stepSize: 1
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              },
              x: {
                ticks: {
                  color: '#e0e0e0'
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              }
            },
            plugins: {
              legend: {
                display: true,
                labels: {
                  color: '#e0e0e0'
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleColor: '#fff',
                bodyColor: '#fff'
              }
            }
          }
        });
      }
    } catch (error) {
      console.error("Error loading grade chart:", error);
    }
  }

  // ========== LOAD QUARTERLY TRENDS LINE CHART ==========
  let quarterlyChart = null;
  async function loadQuarterlyChart() {
    try {
      const response = await apiClient.getReferrals();
      
      if (response.success) {
        const referrals = response.data;
        
        // Group by month
        const monthCounts = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        referrals.forEach(ref => {
          const date = new Date(ref.createdAt);
          const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
        });

        // Get last 12 months
        const sortedMonths = Object.keys(monthCounts).sort((a, b) => {
          const dateA = new Date(a);
          const dateB = new Date(b);
          return dateA - dateB;
        }).slice(-12);

        const ctx = document.getElementById("monthlyChart")?.getContext("2d");
        if (!ctx) return;
        
        if (quarterlyChart) {
          quarterlyChart.destroy();
        }

        quarterlyChart = new Chart(ctx, {
          type: "line",
          data: {
            labels: sortedMonths,
            datasets: [{
              label: "Referrals",
              data: sortedMonths.map(month => monthCounts[month]),
              backgroundColor: "rgba(147, 51, 234, 0.1)",
              borderColor: "rgba(147, 51, 234, 1)",
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: "rgba(147, 51, 234, 1)",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  color: '#e0e0e0',
                  stepSize: 1
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              },
              x: {
                ticks: {
                  color: '#e0e0e0'
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              }
            },
            plugins: {
              legend: {
                display: true,
                labels: {
                  color: '#e0e0e0'
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleColor: '#fff',
                bodyColor: '#fff'
              }
            }
          }
        });
      }
    } catch (error) {
      console.error("Error loading quarterly chart:", error);
    }
  }
});