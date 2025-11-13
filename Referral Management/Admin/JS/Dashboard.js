document.addEventListener("DOMContentLoaded", () => {

  // --------------------------
  // ACTIVE NAV ITEM HIGHLIGHT
  // --------------------------
  const navItems = document.querySelectorAll(".nav-item");
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();

  navItems.forEach(item => {
    const itemHref = item.getAttribute("href").split("/").pop().toLowerCase();
    item.classList.toggle("active", itemHref === currentPage);
  });

  // --------------------------
  // PROFILE DROPDOWN
  // --------------------------
  const profileButton = document.getElementById("profileButton");
  const profileDropdown = document.getElementById("profileDropdown");

  if (profileButton && profileDropdown) {
    profileButton.addEventListener("click", e => {
      e.stopPropagation();
      profileDropdown.classList.toggle("show");
    });

    window.addEventListener("click", e => {
      if (!e.target.closest("#profileDropdown")) profileDropdown.classList.remove("show");
    });
  }

  // --------------------------
  // STATISTICS & REFERRALS
  // --------------------------
  updateStats();
  loadRecentReferrals();
  loadReferralChart();
  loadDoughnut();

  // --------------------------
  // UPDATE STATS
  // --------------------------
  async function updateStats() {
    try {
      const response = await apiClient.getReferralStats();
      if (!response.success) throw new Error("Failed to fetch stats");

      const stats = response.data;
      const statValues = document.querySelectorAll(".stat-value");

      if (statValues.length >= 4) {
        statValues[0].textContent = stats.total || 0;
        statValues[1].textContent = stats.byLevel.elementary || 0;
        statValues[2].textContent = stats.byLevel.highSchool || 0;
        statValues[3].textContent = stats.byLevel.seniorHighSchool || 0;
      }

      // Quick status summary
      document.getElementById('totalReferrals').innerText = stats.total || 0;
      document.getElementById('statusPending').innerText = stats.status.Pending || 0;
      document.getElementById('statusReview').innerText = stats.status["Under Review"] || 0;
      document.getElementById('statusConsultation').innerText = stats.status["For Consultation"] || 0;
      document.getElementById('statusResolved').innerText = stats.status.Resolved || 0;

    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }

  // --------------------------
  // LOAD RECENT REFERRALS
  // --------------------------
  async function loadRecentReferrals(filter = "all") {
    const referralsContent = document.querySelector(".referrals-content");
    referralsContent.innerHTML = '<p class="empty-state">Loading referrals...</p>';

    try {
      const levelMap = {
        elementary: "Elementary",
        "high school": "High School",
        "senior high school": "Senior High School",
      };
      const filters = filter !== "all" ? { level: levelMap[filter.toLowerCase()] } : {};
      const response = await apiClient.getReferrals(filters);

      if (response.success && response.data.length) {
        const recent = response.data.slice(0, 10);
        referralsContent.innerHTML = recent.map(ref => {
          const date = new Date(ref.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          const fullName = [ref.firstName, ref.middleName, ref.lastName].filter(Boolean).join(" ") || ref.studentName || 'Unknown';
          return `
            <div class="referral-item" onclick="window.location.href='Referral.html'">
              <div class="referral-main">
                <div class="referral-name">${fullName}</div>
                <div class="referral-meta">
                  <span class="referral-level">${ref.level}</span>
                  <span class="referral-separator">•</span>
                  <span class="referral-grade">Grade ${ref.grade}</span>
                </div>
              </div>
              <div class="referral-reason">${ref.reason}</div>
              <div class="referral-date">${date}</div>
            </div>`;
        }).join("");
      } else {
        referralsContent.innerHTML = '<p class="empty-state">No referrals found</p>';
      }
    } catch (error) {
      console.error("Error loading referrals:", error);
      referralsContent.innerHTML = '<p class="empty-state">Error loading referrals</p>';
    }
  }

  // --------------------------
  // REFERRAL CHART (LINE)
  // --------------------------
  let referralChart = null;

  function buildTimeLabels(granularity = "month") {
    const labels = [];
    const now = new Date();
    if (granularity === "month") {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(d.toLocaleString("en-US", { month: "short", year: "numeric" }));
      }
    } else {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
      }
    }
    return labels;
  }

  function labelForDate(dateObj, granularity) {
    return granularity === "month"
      ? dateObj.toLocaleString("en-US", { month: "short", year: "numeric" })
      : dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  async function loadReferralChart(granularity = "month") {
    try {
      const response = await apiClient.getReferrals();
      if (!response.success) return;

      const labels = buildTimeLabels(granularity);
      const counts = { elementary: Array(labels.length).fill(0), highSchool: Array(labels.length).fill(0), seniorHighSchool: Array(labels.length).fill(0) };

      response.data.forEach(r => {
        if (!r.createdAt) return;
        const idx = labels.indexOf(labelForDate(new Date(r.createdAt), granularity));
        if (idx === -1) return;

        switch(r.level) {
          case "Elementary": counts.elementary[idx]++; break;
          case "High School": counts.highSchool[idx]++; break;
          case "Senior High School": counts.seniorHighSchool[idx]++; break;
        }
      });

      const ctx = document.getElementById("referralChart").getContext("2d");
      const datasets = [
        { label: "Elementary", data: counts.elementary, borderColor: "#27AE60", backgroundColor: "rgba(39,174,96,0.08)", tension: 0.3, pointRadius: 3 },
        { label: "High School", data: counts.highSchool, borderColor: "#E74C3C", backgroundColor: "rgba(231,76,60,0.08)", tension: 0.3, pointRadius: 3 },
        { label: "Senior High School", data: counts.seniorHighSchool, borderColor: "#8E44AD", backgroundColor: "rgba(142,68,173,0.08)", tension: 0.3, pointRadius: 3 }
      ];

      if (referralChart) {
        referralChart.data.labels = labels;
        referralChart.data.datasets.forEach((ds, i) => ds.data = datasets[i].data);
        referralChart.update();
      } else {
        referralChart = new Chart(ctx, {
          type: "line",
          data: { labels, datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "top" }, tooltip: { mode: "index", intersect: false } },
            interaction: { mode: "nearest", axis: "x", intersect: false },
            scales: { x: { display: true }, y: { display: true, beginAtZero: true, ticks: { precision: 0 } } },
          },
        });
      }
    } catch (error) {
      console.error("Error loading referral chart:", error);
    }
  }

  // --------------------------
  // DOUGHNUT CHART (STATUS)
  // --------------------------
  let doughnutChart = null;
  async function loadDoughnut(status = "all") {
    try {
      const response = await apiClient.getReferrals();
      if (!response.success) return;

      const referrals = response.data;
      const ctx = document.getElementById("referralDoughnut").getContext('2d');
      let labels = [], data = [], backgroundColor = [];

      if (status === "all") {
        labels = ['Pending', 'In Progress', 'Complete'];
        data = labels.map(l => referrals.filter(r => r.status === l).length);
        backgroundColor = ['#F59E0B', '#3B82F6', '#10B981'];
      } else {
        labels = ['Elementary', 'High School', 'Senior High School'];
        data = labels.map((level, i) => referrals.filter(r => r.status === status && r.level === levelMap[level.toLowerCase()]).length);
        backgroundColor = ['#27AE60', '#E74C3C', '#8E44AD'];
      }

      if (doughnutChart) {
        doughnutChart.data.labels = labels;
        doughnutChart.data.datasets[0].data = data;
        doughnutChart.data.datasets[0].backgroundColor = backgroundColor;
        doughnutChart.update();
      } else {
        doughnutChart = new Chart(ctx, {
          type: 'doughnut',
          data: { labels, datasets: [{ data, backgroundColor, hoverOffset: 8 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } } }
        });
      }
    } catch (error) {
      console.error('Error loading doughnut chart:', error);
    }
  }

  // --------------------------
  // FILTER TABS
  // --------------------------
  const filterTabs = document.querySelectorAll(".filter-tab");
  filterTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      filterTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      loadRecentReferrals(tab.dataset.filter);
    });
  });

  // --------------------------
// PIE CHARTS - QUICK STATUS & SEVERITY
// --------------------------

const statusData = {
  all: [0,0,0,0], // Pending, Under Review, For Consultation, Resolved
  elementary: [0,0,0,0],
  juniorHigh: [0,0,0,0],
  seniorHigh: [0,0,0,0]
};

const severityData = {
  all: [0,0,0,0], // Low, Medium, High, Critical
  elementary: [0,0,0,0],
  juniorHigh: [0,0,0,0],
  seniorHigh: [0,0,0,0]
};

// Initialize Status Pie Chart
const statusCtx = document.getElementById('statusPieChart').getContext('2d');
let statusPie = new Chart(statusCtx, {
  type: 'pie',
  data: {
    labels: ['Pending', 'Under Review', 'For Consultation', 'Complete'],
    datasets: [{
      data: statusData.all,
      backgroundColor: ['#F59E0B', '#3B82F6', '#6B7280', '#10B981']
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } }
  }
});

// Initialize Severity Pie Chart
const severityCtx = document.getElementById('severityPieChart').getContext('2d');
let severityPie = new Chart(severityCtx, {
  type: 'pie',
  data: {
    labels: ['Low', 'Medium', 'High'],
    datasets: [{
      data: severityData.all,
      backgroundColor: ['#28a745', '#ffc107','#dc3545']
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } }
  }
});

// Dropdown filter events
document.getElementById('statusFilter').addEventListener('change', (e) => {
  const val = e.target.value;
  statusPie.data.datasets[0].data = statusData[val];
  statusPie.update();
});

document.getElementById('severityFilter').addEventListener('change', (e) => {
  const val = e.target.value;
  severityPie.data.datasets[0].data = severityData[val];
  severityPie.update();
});

// Example: Update data dynamically after fetching stats
function updatePieCharts(stats) {
  // stats.status = { Pending, 'Under Review', 'For Consultation', Resolved }
  // stats.severity = { Low, Medium, High, Critical }
  statusData.all = [
    stats.status.Pending || 0,
    stats.status["Under Review"] || 0,
    stats.status["For Consultation"] || 0,
    stats.status.Resolved || 0
  ];
  severityData.all = [
    stats.severity.Low || 0,
    stats.severity.Medium || 0,
    stats.severity.High || 0,
    stats.severity.Critical || 0
  ];
  statusPie.update();
  severityPie.update();
}

  // --------------------------
  // CHART GRANULARITY SELECT
  // --------------------------
  const granSelect = document.getElementById("chartGranularity");
  if (granSelect) {
    granSelect.addEventListener("change", () => loadReferralChart(granSelect.value));
  }

  // --------------------------
  // DOUGHNUT STATUS FILTER
  // --------------------------
  const doughnutFilter = document.getElementById('doughnutStatusFilter');
  if (doughnutFilter) {
    doughnutFilter.addEventListener('change', () => loadDoughnut(doughnutFilter.value));
  }

  // --------------------------
  // EXAMPLE STATIC CHARTS
  // --------------------------
  const gradeChart = new Chart(document.getElementById('gradeChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Elementary', 'Junior High', 'Senior High'],
      datasets: [{ label: 'Referrals', data: [5,7,8,10,6,9], backgroundColor: 'rgba(0,123,255,0.7)', borderColor: 'rgba(0,123,255,1)', borderWidth: 1 }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  const quarterChart = new Chart(document.getElementById('quarterChart').getContext('2d'), {
    type: 'line',
    data: {
      labels: ['Q1','Q2','Q3','Q4'],
      datasets: [{ label:'Referrals per Quarter', data:[12,9,15,9], fill:false, borderColor:'rgba(40,167,69,1)', tension:0.3 }]
    },
    options: { responsive:true, scales:{ y:{ beginAtZero:true } } }
  });

});


