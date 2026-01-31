// Check if user is logged in and is an employee
document.addEventListener("DOMContentLoaded", function () {
  const currentUser = getCurrentUser();

  if (!currentUser || currentUser.role !== "employee") {
    window.location.href = "index.html";
    return;
  }

  // Set user info
  document.getElementById("empUsername").textContent = currentUser.fullName;
  const empAvatarEl = document.getElementById("empAvatar");
  if (currentUser.avatar) {
    empAvatarEl.innerHTML = `<img src="${currentUser.avatar}" alt="${currentUser.fullName}" />`;
  } else {
    empAvatarEl.textContent = currentUser.fullName[0].toUpperCase();
  }

  // Set min dates for leave requests
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("leaveDateFrom").min = today;
  document.getElementById("leaveDateTo").min = today;

  // Set default month for attendance filter
  const currentMonth = new Date().toISOString().slice(0, 7);
  document.getElementById("attendanceMonth").value = currentMonth;

  // Start clock
  updateClock();
  setInterval(updateClock, 1000);

  // Load dashboard data
  loadEmployeeDashboard();
});

function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  const clockEl = document.getElementById("currentTime");
  if (clockEl) {
    clockEl.textContent = timeStr;
  }
}

// Show section function
function showSection(sectionId) {
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.add("hidden"));
  document.getElementById(sectionId).classList.remove("hidden");

  document
    .querySelectorAll(".nav-item")
    .forEach((item) => item.classList.remove("active"));
  event.target.classList.add("active");

  // Update page title
  const titles = {
    empDashboard: "Dashboard",
    empAttendance: "Time & Attendance",
    empLeave: "Leave Request",
    empPayslips: "Payslips",
    empProfile: "Profile",
  };
  document.getElementById("pageTitle").textContent =
    titles[sectionId] || "Dashboard";

  // Load data for specific sections
  if (sectionId === "empLeave") loadEmployeeLeaves();
  if (sectionId === "empPayslips") loadPayslips();
  if (sectionId === "empProfile") loadProfile();
  if (sectionId === "empAttendance") loadAttendanceHistory();
}

// ===== DASHBOARD =====
function loadEmployeeDashboard() {
  const currentUser = getCurrentUser();
  const period = getCurrentPeriod();

  // Check if clocked in
  const activeAttendance = getActiveAttendance(currentUser.id);
  const isClockedIn = !!activeAttendance;

  document.getElementById("todayStatus").textContent = isClockedIn
    ? "Clocked In"
    : "Clocked Out";

  // Update quick action button
  const quickBtn = document.getElementById("quickTimeBtn");
  if (isClockedIn) {
    quickBtn.textContent = "Clock Out";
    quickBtn.className = "btn btn-reject";
  } else {
    quickBtn.textContent = "Clock In";
    quickBtn.className = "btn btn-primary";
  }

  // Calculate hours this period
  const attendance = getAttendanceByEmployee(currentUser.id);
  const periodAttendance = attendance.filter(
    (a) => a.date >= period.start && a.date <= period.end && a.isComplete,
  );

  const totalHours = periodAttendance.reduce(
    (sum, a) => sum + (a.hoursWorked || 0),
    0,
  );
  document.getElementById("periodHours").textContent =
    totalHours.toFixed(1) + "h";

  // Next payday
  const settings = getSettings();
  let nextPayday;

  if (settings.payPeriod === "monthly") {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 5);
    nextPayday = formatDate(nextMonth.toISOString());
  } else {
    const today = new Date();
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    nextPayday = formatDate(nextMonday.toISOString());
  }

  document.getElementById("nextPayday").textContent = nextPayday;

  // Leave balance (approved leaves)
  const leaves = getLeavesByEmployee(currentUser.id);
  const approvedLeaves = leaves.filter((l) => l.status === "Approved").length;
  document.getElementById("leaveBalance").textContent = approvedLeaves;

  // Recent activity
  loadRecentActivity();
}

function loadRecentActivity() {
  const currentUser = getCurrentUser();
  const attendance = getAttendanceByEmployee(currentUser.id);
  const leaves = getLeavesByEmployee(currentUser.id);

  const activities = [];

  // Add recent attendance
  attendance
    .slice(-5)
    .reverse()
    .forEach((a) => {
      activities.push({
        date: new Date(a.timeIn),
        text: `Worked ${(a.hoursWorked || 0).toFixed(2)} hours`,
        type: "attendance",
      });
    });

  // Add recent leaves
  leaves
    .slice(-3)
    .reverse()
    .forEach((l) => {
      activities.push({
        date: new Date(l.requestedAt),
        text: `${l.type} - ${l.status}`,
        type: "leave",
        status: l.status,
      });
    });

  // Sort by date
  activities.sort((a, b) => b.date - a.date);

  const list = document.getElementById("recentActivity");

  if (activities.length === 0) {
    list.innerHTML = '<li class="leave-item">No recent activity</li>';
    return;
  }

  list.innerHTML = activities
    .slice(0, 5)
    .map(
      (activity) => `
        <li class="leave-item">
            <div>
                <small>${formatDate(activity.date.toISOString())}</small><br>
                ${activity.text}
            </div>
            ${
              activity.status
                ? `
                <span class="status-badge status-${activity.status.toLowerCase()}">
                    ${activity.status}
                </span>
            `
                : ""
            }
        </li>
    `,
    )
    .join("");
}

function quickTimeAction() {
  const currentUser = getCurrentUser();
  const activeAttendance = getActiveAttendance(currentUser.id);

  if (activeAttendance) {
    timeOut();
  } else {
    timeIn();
  }
}

// ===== TIME & ATTENDANCE =====
function timeIn() {
  const currentUser = getCurrentUser();
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Check if already clocked in
  const activeAttendance = getActiveAttendance(currentUser.id);
  if (activeAttendance) {
    alert("You are already clocked in!");
    return;
  }

  addAttendance({
    employeeId: currentUser.id,
    employeeName: currentUser.fullName,
    date: today,
    timeIn: now.toISOString(),
    timeOut: null,
    hoursWorked: 0,
    overtimeHours: 0,
    isComplete: false,
  });

  document.getElementById("statusMessage").textContent =
    `✓ Clocked in at ${formatTime(now.toISOString())}`;
  document.getElementById("todayStatus").textContent = "Clocked In";

  loadEmployeeDashboard();
  loadAttendanceHistory();
}

function timeOut() {
  const currentUser = getCurrentUser();
  const activeAttendance = getActiveAttendance(currentUser.id);

  if (!activeAttendance) {
    alert("You need to clock in first!");
    return;
  }

  const now = new Date();
  const hoursWorked = calculateHoursWorked(
    activeAttendance.timeIn,
    now.toISOString(),
  );
  const overtimeHours = calculateOvertime(hoursWorked);

  updateAttendance(activeAttendance.id, {
    timeOut: now.toISOString(),
    hoursWorked: hoursWorked,
    overtimeHours: overtimeHours,
    isComplete: true,
  });

  document.getElementById("statusMessage").textContent =
    `✓ Clocked out at ${formatTime(now.toISOString())}. Total hours: ${hoursWorked.toFixed(2)}`;
  document.getElementById("todayStatus").textContent = "Clocked Out";

  loadEmployeeDashboard();
  loadAttendanceHistory();
}

function loadAttendanceHistory() {
  const currentUser = getCurrentUser();
  const attendance = getAttendanceByEmployee(currentUser.id);
  const tbody = document.getElementById("attendanceHistoryBody");

  if (attendance.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align: center;">No attendance records found</td></tr>';
    return;
  }

  tbody.innerHTML = [...attendance]
    .reverse()
    .map(
      (record) => `
        <tr>
            <td>${formatDate(record.date)}</td>
            <td>${formatTime(record.timeIn)}</td>
            <td>${record.timeOut ? formatTime(record.timeOut) : "-"}</td>
            <td>${record.hoursWorked ? record.hoursWorked.toFixed(2) : "-"}</td>
            <td>${record.overtimeHours ? record.overtimeHours.toFixed(2) : "0"}</td>
        </tr>
    `,
    )
    .join("");
}

function filterMyAttendance() {
  const currentUser = getCurrentUser();
  const monthStr = document.getElementById("attendanceMonth").value;

  if (!monthStr) {
    loadAttendanceHistory();
    return;
  }

  const [year, month] = monthStr.split("-");
  const attendance = getAttendanceByEmployee(currentUser.id);

  const filtered = attendance.filter((a) => {
    const recordDate = new Date(a.date);
    return (
      recordDate.getFullYear() === parseInt(year) &&
      recordDate.getMonth() === parseInt(month) - 1
    );
  });

  const tbody = document.getElementById("attendanceHistoryBody");

  if (filtered.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align: center;">No records found for this month</td></tr>';
    return;
  }

  tbody.innerHTML = filtered
    .reverse()
    .map(
      (record) => `
        <tr>
            <td>${formatDate(record.date)}</td>
            <td>${formatTime(record.timeIn)}</td>
            <td>${record.timeOut ? formatTime(record.timeOut) : "-"}</td>
            <td>${record.hoursWorked ? record.hoursWorked.toFixed(2) : "-"}</td>
            <td>${record.overtimeHours ? record.overtimeHours.toFixed(2) : "0"}</td>
        </tr>
    `,
    )
    .join("");
}

// ===== LEAVE REQUEST =====
function submitLeaveRequest(event) {
  event.preventDefault();

  const currentUser = getCurrentUser();
  const type = document.getElementById("leaveType").value;
  const dateFrom = document.getElementById("leaveDateFrom").value;
  const dateTo = document.getElementById("leaveDateTo").value;
  const reason = document.getElementById("leaveReason").value;

  if (new Date(dateTo) < new Date(dateFrom)) {
    alert("End date cannot be before start date!");
    return;
  }

  addLeave({
    employeeId: currentUser.id,
    employeeName: currentUser.fullName,
    type: type,
    dateFrom: dateFrom,
    dateTo: dateTo,
    reason: reason,
    status: "Pending",
    requestedAt: new Date().toISOString(),
  });

  alert("Leave request submitted successfully!");

  // Reset form
  document.getElementById("leaveForm").reset();

  loadEmployeeLeaves();
  loadEmployeeDashboard();
}

function loadEmployeeLeaves() {
  const currentUser = getCurrentUser();
  const leaves = getLeavesByEmployee(currentUser.id);
  const list = document.getElementById("empLeaveList");

  if (leaves.length === 0) {
    list.innerHTML = '<li class="leave-item">No leave requests yet</li>';
    return;
  }

  list.innerHTML = [...leaves]
    .reverse()
    .map(
      (l) => `
        <li class="leave-item">
            <div>
                <strong>${l.type}</strong><br>
                <small>${formatDate(l.dateFrom)} to ${formatDate(l.dateTo)}</small><br>
                <small>Reason: ${l.reason}</small>
            </div>
            <span class="status-badge status-${l.status.toLowerCase()}">
                ${l.status}
            </span>
        </li>
    `,
    )
    .join("");
}

// ===== PAYSLIPS =====
function loadPayslips() {
  const currentUser = getCurrentUser();
  const payroll = getPayrollByEmployee(currentUser.id);
  const tbody = document.getElementById("payslipTableBody");

  if (payroll.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center;">No payroll records found</td></tr>';
    return;
  }

  tbody.innerHTML = [...payroll]
    .reverse()
    .map(
      (record) => `
        <tr>
            <td>${record.period}</td>
            <td>${record.regularHours.toFixed(2)}</td>
            <td>${record.overtimeHours.toFixed(2)}</td>
            <td><strong>${formatCurrency(record.netPay)}</strong></td>
            <td>
                <span class="status-badge status-approved">
                    ${record.status}
                </span>
            </td>
            <td>
                <button class="btn-small btn-approve" onclick="viewMyPayslip(${record.id})">View</button>
            </td>
        </tr>
    `,
    )
    .join("");
}

function viewMyPayslip(id) {
  const currentUser = getCurrentUser();
  const payroll = getPayrollById(id);
  if (!payroll) return;

  const settings = getSettings();

  const payslip = `
        <div class="payslip">
            <div class="payslip-header">
                <h2>${settings.shopName}</h2>
                <h3>PAYSLIP</h3>
            </div>
            <div class="payslip-info">
                <div><strong>Employee:</strong> ${currentUser.fullName}</div>
                <div><strong>Position:</strong> ${currentUser.position}</div>
                <div><strong>Period:</strong> ${payroll.period}</div>
                <div><strong>Pay Date:</strong> ${formatDate(payroll.generatedAt)}</div>
            </div>
            <table class="payslip-table">
                <tr>
                    <th>Description</th>
                    <th>Hours/Amount</th>
                    <th>Amount</th>
                </tr>
                <tr>
                    <td>Regular Hours</td>
                    <td>${payroll.regularHours.toFixed(2)} hrs @ ${formatCurrency(currentUser.hourlyRate)}/hr</td>
                    <td>${formatCurrency(payroll.regularPay)}</td>
                </tr>
                <tr>
                    <td>Overtime Hours</td>
                    <td>${payroll.overtimeHours.toFixed(2)} hrs @ ${formatCurrency(currentUser.hourlyRate * settings.overtimeRate)}/hr</td>
                    <td>${formatCurrency(payroll.overtimePay)}</td>
                </tr>
                <tr>
                    <td colspan="2"><strong>Gross Pay</strong></td>
                    <td><strong>${formatCurrency(payroll.regularPay + payroll.overtimePay)}</strong></td>
                </tr>
                <tr>
                    <td colspan="2">Deductions</td>
                    <td>${formatCurrency(payroll.deductions)}</td>
                </tr>
                <tr class="payslip-total">
                    <td colspan="2"><strong>NET PAY</strong></td>
                    <td><strong>${formatCurrency(payroll.netPay)}</strong></td>
                </tr>
            </table>
        </div>
    `;

  document.getElementById("payslipContent").innerHTML = payslip;
  document.getElementById("payslipModal").style.display = "block";
}

function printPayslip() {
  const content = document.getElementById("payslipContent").innerHTML;
  const printWindow = window.open("", "", "height=600,width=800");
  printWindow.document.write("<html><head><title>Payslip</title>");
  printWindow.document.write("<style>");
  printWindow.document.write(`
        body { font-family: Arial, sans-serif; padding: 20px; }
        .payslip { max-width: 800px; margin: 0 auto; }
        .payslip-header { text-align: center; margin-bottom: 30px; }
        .payslip-info { margin-bottom: 20px; line-height: 1.8; }
        .payslip-table { width: 100%; border-collapse: collapse; }
        .payslip-table th, .payslip-table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
        .payslip-table th { background: #f4f4f4; }
        .payslip-total { background: #f9f9f9; font-size: 1.1em; }
    `);
  printWindow.document.write("</style></head><body>");
  printWindow.document.write(content);
  printWindow.document.write("</body></html>");
  printWindow.document.close();
  printWindow.print();
}

function downloadPayslip() {
  alert(
    "Download feature would require server-side PDF generation. For now, please use Print to save as PDF.",
  );
}

// ===== PROFILE =====
function loadProfile() {
  const currentUser = getCurrentUser();

  document.getElementById("profileName").textContent = currentUser.fullName;
  document.getElementById("profileUsername").textContent = currentUser.username;
  document.getElementById("profileEmail").textContent = currentUser.email;
  document.getElementById("profilePosition").textContent = currentUser.position;
  document.getElementById("profileRate").textContent =
    formatCurrency(currentUser.hourlyRate) + "/hr";
  document.getElementById("profileDateHired").textContent = formatDate(
    currentUser.dateHired,
  );

  // Profile photo
  const profileImg = document.getElementById("profilePhotoImg");
  if (profileImg) {
    if (currentUser.avatar) {
      profileImg.src = currentUser.avatar;
      profileImg.style.display = "block";
    } else {
      profileImg.src = "";
      profileImg.style.display = "none";
    }
  }
}

function changePassword(event) {
  event.preventDefault();

  const currentUser = getCurrentUser();
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (currentPassword !== currentUser.password) {
    alert("Current password is incorrect!");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("New passwords do not match!");
    return;
  }

  if (newPassword.length < 4) {
    alert("Password must be at least 4 characters long!");
    return;
  }

  updateUser(currentUser.id, { password: newPassword });
  setCurrentUser({ ...currentUser, password: newPassword });

  alert("Password changed successfully!");
  document.getElementById("passwordForm").reset();
}

// ===== MODAL FUNCTIONS =====
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Close modal when clicking outside
window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
};
