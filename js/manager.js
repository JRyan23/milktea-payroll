// Check if user is logged in and is a manager
document.addEventListener("DOMContentLoaded", function () {
  const currentUser = getCurrentUser();

  if (!currentUser || currentUser.role !== "manager") {
    window.location.href = "index.html";
    return;
  }

  // Set manager avatar
  const managerAvatarEl = document.querySelector(".avatar");
  if (managerAvatarEl && currentUser.avatar) {
    managerAvatarEl.innerHTML = `<img src="${currentUser.avatar}" alt="${currentUser.fullName}" />`;
  } else if (managerAvatarEl) {
    managerAvatarEl.textContent = currentUser.fullName[0].toUpperCase();
  }

  // Load dashboard data
  loadManagerDashboard();
});

let currentLeaveFilter = "all";

// ===== NAVIGATION =====
function showSection(sectionId) {
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.add("hidden"));
  document.getElementById(sectionId).classList.remove("hidden");

  document
    .querySelectorAll(".nav-item")
    .forEach((item) => item.classList.remove("active"));
  event.target.classList.add("active");

  const titles = {
    mgrDashboard: "Dashboard",
    mgrEmployees: "Employees",
    mgrAttendance: "Attendance",
    mgrLeave: "Leave Management",
    mgrHolidays: "Holidays",
    mgrPayroll: "Payroll",
    mgrReports: "Reports",
    mgrSettings: "Settings",
  };
  document.getElementById("pageTitle").textContent =
    titles[sectionId] || "Dashboard";

  if (sectionId === "mgrEmployees") loadEmployees();
  if (sectionId === "mgrAttendance") loadAttendanceRecords();
  if (sectionId === "mgrLeave") loadLeaveRequests();
  if (sectionId === "mgrHolidays") loadHolidays();
  if (sectionId === "mgrPayroll") loadPayrollHistory();
  if (sectionId === "mgrSettings") loadSettings();
}

// ===== DASHBOARD =====
function loadManagerDashboard() {
  const employees = getActiveEmployees();
  const todayAttendance = getTodayAttendance();
  const leaves = getLeaves();
  const period = getCurrentPeriod();

  document.getElementById("totalEmployees").textContent = employees.length;
  document.getElementById("todayAttendance").textContent =
    todayAttendance.length;
  document.getElementById("pendingLeave").textContent = leaves.filter(
    (l) => l.status === "Pending",
  ).length;
  document.getElementById("currentPeriod").textContent = period.label;

  loadRecentLeaves();
}

function loadRecentLeaves() {
  const leaves = getLeaves();
  const list = document.getElementById("recentLeaveList");
  const recent = [...leaves].filter((l) => l.status === "Pending").slice(-5);

  if (recent.length === 0) {
    list.innerHTML = '<li class="leave-item">No pending leave requests</li>';
    return;
  }

  list.innerHTML = recent
    .map(
      (l) => `
        <li class="leave-item">
            <div>
                <strong>${l.employeeName}</strong> - ${l.type}<br>
                <small>${formatDate(l.dateFrom)} to ${formatDate(l.dateTo)}</small>
            </div>
            <div>
                <button class="btn-small btn-approve" onclick="approveLeave(${l.id})">Approve</button>
                <button class="btn-small btn-reject" onclick="rejectLeave(${l.id})">Reject</button>
            </div>
        </li>
    `,
    )
    .join("");
}

// ===== EMPLOYEES CRUD =====
function loadEmployees() {
  const employees = getEmployees();
  const tbody = document.getElementById("employeeTableBody");

  if (employees.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align: center;">No employees found</td></tr>';
    return;
  }

  tbody.innerHTML = employees
    .map(
      (emp) => `
        <tr>
            <td>
              <div class="avatar small">
                ${emp.avatar ? '<img src="' + emp.avatar + '" alt="' + emp.fullName + '" />' : emp.fullName[0].toUpperCase()}
              </div>
            </td>
            <td>${emp.fullName}</td>
            <td>${emp.position}</td>
            <td>${formatCurrency(emp.hourlyRate)}</td>
            <td>${formatDate(emp.dateHired)}</td>
            <td>
                <span class="status-badge status-${emp.isActive ? "approved" : "rejected"}">
                    ${emp.isActive ? "Active" : "Inactive"}
                </span>
            </td>
            <td>
                <button class="btn-small btn-approve" onclick="editEmployee(${emp.id})">Edit</button>
                <button class="btn-small ${emp.isActive ? "btn-reject" : "btn-approve"}" 
                    onclick="toggleEmployeeStatus(${emp.id})">
                    ${emp.isActive ? "Deactivate" : "Activate"}
                </button>
            </td>
        </tr>
    `,
    )
    .join("");
}

function showAddEmployeeModal() {
  document.getElementById("employeeModalTitle").textContent = "Add Employee";
  document.getElementById("employeeForm").reset();
  document.getElementById("employeeId").value = "";
  document.getElementById("employeePassword").required = true;
  // Clear avatar input and preview
  const avatarInput = document.getElementById("employeeAvatarInput");
  if (avatarInput) {
    avatarInput.value = "";
    avatarInput.onchange = function () {
      const file = this.files && this.files[0];
      const preview = document.getElementById("employeeAvatarPreview");
      if (file && preview) {
        const reader = new FileReader();
        reader.onload = (e) => (preview.src = e.target.result);
        reader.readAsDataURL(file);
      } else if (preview) {
        preview.src = "";
      }
    };
  }
  const avatarPreview = document.getElementById("employeeAvatarPreview");
  if (avatarPreview) avatarPreview.src = "";

  document.getElementById("employeeModal").style.display = "block";
}

function editEmployee(id) {
  const employee = getUserById(id);
  if (!employee) return;

  document.getElementById("employeeModalTitle").textContent = "Edit Employee";
  document.getElementById("employeeId").value = employee.id;
  document.getElementById("employeeFullName").value = employee.fullName;
  document.getElementById("employeeUsername").value = employee.username;
  document.getElementById("employeeEmail").value = employee.email;
  document.getElementById("employeePosition").value = employee.position;
  document.getElementById("employeeRate").value = employee.hourlyRate;
  document.getElementById("employeeDateHired").value = employee.dateHired;
  document.getElementById("employeePassword").required = false;

  // Set avatar preview if available
  const avatarPreview = document.getElementById("employeeAvatarPreview");
  const avatarInput = document.getElementById("employeeAvatarInput");
  if (avatarPreview) {
    avatarPreview.src = employee.avatar || "";
  }
  if (avatarInput) {
    avatarInput.onchange = function () {
      const file = this.files && this.files[0];
      if (file && avatarPreview) {
        const reader = new FileReader();
        reader.onload = (e) => (avatarPreview.src = e.target.result);
        reader.readAsDataURL(file);
      }
    };
  }

  document.getElementById("employeeModal").style.display = "block";
}

function saveEmployee(event) {
  event.preventDefault();

  const id = document.getElementById("employeeId").value;
  const formData = {
    fullName: document.getElementById("employeeFullName").value,
    username: document.getElementById("employeeUsername").value,
    email: document.getElementById("employeeEmail").value,
    position: document.getElementById("employeePosition").value,
    hourlyRate: parseFloat(document.getElementById("employeeRate").value),
    dateHired: document.getElementById("employeeDateHired").value,
    role: "employee",
    isActive: true,
  };

  const password = document.getElementById("employeePassword").value;
  if (password) {
    formData.password = password;
  }

  const avatarInput = document.getElementById("employeeAvatarInput");
  const file = avatarInput && avatarInput.files && avatarInput.files[0];

  const finalize = (finalData) => {
    if (id) {
      updateUser(parseInt(id), finalData);
      alert("Employee updated successfully!");
    } else {
      finalData.password = finalData.password || "1234";
      addUser(finalData);
      alert("Employee added successfully!");
    }

    closeModal("employeeModal");
    loadEmployees();
    loadManagerDashboard();
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      formData.avatar = e.target.result;
      finalize(formData);
    };
    reader.readAsDataURL(file);
  } else {
    // If editing and no new file, preserve existing avatar
    if (id) {
      const existing = getUserById(parseInt(id));
      if (existing && existing.avatar) formData.avatar = existing.avatar;
    }
    finalize(formData);
  }
}

function toggleEmployeeStatus(id) {
  const employee = getUserById(id);
  if (!employee) return;

  const action = employee.isActive ? "deactivate" : "activate";
  if (confirm(`Are you sure you want to ${action} ${employee.fullName}?`)) {
    updateUser(id, { isActive: !employee.isActive });
    loadEmployees();
    loadManagerDashboard();
  }
}

// ===== ATTENDANCE MANAGEMENT =====
function loadAttendanceRecords() {
  const attendance = getAttendance();
  const tbody = document.getElementById("attendanceTableBody");
  const filterEmployee = document.getElementById("filterEmployee");

  const employees = getEmployees();
  filterEmployee.innerHTML =
    '<option value="">All Employees</option>' +
    employees
      .map((emp) => `<option value="${emp.id}">${emp.fullName}</option>`)
      .join("");

  if (attendance.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align: center;">No attendance records found</td></tr>';
    return;
  }

  tbody.innerHTML = [...attendance]
    .reverse()
    .map(
      (record) => `
        <tr>
            <td>${record.employeeName}</td>
            <td>${formatDate(record.date)}</td>
            <td>${formatTime(record.timeIn)}</td>
            <td>${record.timeOut ? formatTime(record.timeOut) : "-"}</td>
            <td>${record.hoursWorked ? record.hoursWorked.toFixed(2) : "-"}</td>
            <td>${record.overtimeHours ? record.overtimeHours.toFixed(2) : "0"}</td>
            <td>
                <button class="btn-small btn-approve" onclick="editAttendance(${record.id})">Edit</button>
                <button class="btn-small btn-reject" onclick="deleteAttendanceRecord(${record.id})">Delete</button>
            </td>
        </tr>
    `,
    )
    .join("");
}

function filterAttendance() {
  const date = document.getElementById("filterDate").value;
  const employeeId = document.getElementById("filterEmployee").value;

  let attendance = getAttendance();

  if (date) {
    attendance = attendance.filter((a) => a.date === date);
  }

  if (employeeId) {
    attendance = attendance.filter(
      (a) => a.employeeId === parseInt(employeeId),
    );
  }

  const tbody = document.getElementById("attendanceTableBody");

  if (attendance.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align: center;">No records found</td></tr>';
    return;
  }

  tbody.innerHTML = attendance
    .map(
      (record) => `
        <tr>
            <td>${record.employeeName}</td>
            <td>${formatDate(record.date)}</td>
            <td>${formatTime(record.timeIn)}</td>
            <td>${record.timeOut ? formatTime(record.timeOut) : "-"}</td>
            <td>${record.hoursWorked ? record.hoursWorked.toFixed(2) : "-"}</td>
            <td>${record.overtimeHours ? record.overtimeHours.toFixed(2) : "0"}</td>
            <td>
                <button class="btn-small btn-approve" onclick="editAttendance(${record.id})">Edit</button>
                <button class="btn-small btn-reject" onclick="deleteAttendanceRecord(${record.id})">Delete</button>
            </td>
        </tr>
    `,
    )
    .join("");
}

function editAttendance(id) {
  const record = getAttendanceById(id);
  if (!record) return;

  document.getElementById("attendanceId").value = record.id;
  document.getElementById("attendanceEmployee").value = record.employeeName;
  document.getElementById("attendanceDate").value = record.date;

  const timeIn = new Date(record.timeIn);
  const timeOut = record.timeOut ? new Date(record.timeOut) : null;

  document.getElementById("attendanceTimeIn").value =
    `${String(timeIn.getHours()).padStart(2, "0")}:${String(timeIn.getMinutes()).padStart(2, "0")}`;

  if (timeOut) {
    document.getElementById("attendanceTimeOut").value =
      `${String(timeOut.getHours()).padStart(2, "0")}:${String(timeOut.getMinutes()).padStart(2, "0")}`;
  }

  document.getElementById("attendanceModal").style.display = "block";
}

function saveAttendanceEdit(event) {
  event.preventDefault();

  const id = parseInt(document.getElementById("attendanceId").value);
  const date = document.getElementById("attendanceDate").value;
  const timeInStr = document.getElementById("attendanceTimeIn").value;
  const timeOutStr = document.getElementById("attendanceTimeOut").value;

  const timeIn = new Date(`${date}T${timeInStr}:00`);
  const timeOut = new Date(`${date}T${timeOutStr}:00`);

  const hoursWorked = calculateHoursWorked(timeIn, timeOut);
  const overtimeHours = calculateOvertime(hoursWorked);

  updateAttendance(id, {
    date: date,
    timeIn: timeIn.toISOString(),
    timeOut: timeOut.toISOString(),
    hoursWorked: hoursWorked,
    overtimeHours: overtimeHours,
    isComplete: true,
  });

  alert("Attendance updated successfully!");
  closeModal("attendanceModal");
  loadAttendanceRecords();
}

function deleteAttendanceRecord(id) {
  if (confirm("Are you sure you want to delete this attendance record?")) {
    deleteAttendance(id);
    loadAttendanceRecords();
  }
}

// ===== LEAVE MANAGEMENT =====
function loadLeaveRequests() {
  filterLeaves(currentLeaveFilter);
}

function filterLeaves(status) {
  currentLeaveFilter = status;
  const leaves = getLeaves();
  const list = document.getElementById("allLeaveList");

  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  if (event && event.target) {
    event.target.classList.add("active");
  }

  let filtered =
    status === "all" ? leaves : leaves.filter((l) => l.status === status);
  filtered = [...filtered].reverse();

  if (filtered.length === 0) {
    list.innerHTML = '<li class="leave-item">No leave requests found</li>';
    return;
  }

  list.innerHTML = filtered
    .map(
      (l) => `
        <li class="leave-item">
            <div>
                <strong>${l.employeeName}</strong> - ${l.type}<br>
                <small>${formatDate(l.dateFrom)} to ${formatDate(l.dateTo)}</small><br>
                <small>Reason: ${l.reason}</small>
            </div>
            <div>
                <span class="status-badge status-${l.status.toLowerCase()}">
                    ${l.status}
                </span>
                ${
                  l.status === "Pending"
                    ? `
                    <button class="btn-small btn-approve" onclick="approveLeave(${l.id})">Approve</button>
                    <button class="btn-small btn-reject" onclick="rejectLeave(${l.id})">Reject</button>
                `
                    : ""
                }
            </div>
        </li>
    `,
    )
    .join("");
}

function approveLeave(id) {
  updateLeave(id, { status: "Approved" });
  loadManagerDashboard();
  loadLeaveRequests();
  alert("Leave request approved!");
}

function rejectLeave(id) {
  updateLeave(id, { status: "Rejected" });
  loadManagerDashboard();
  loadLeaveRequests();
  alert("Leave request rejected!");
}

// ===== HOLIDAYS CRUD =====
function loadHolidays() {
  const holidays = getHolidays();
  const tbody = document.getElementById("holidayTableBody");

  if (holidays.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" style="text-align: center;">No holidays added</td></tr>';
    return;
  }

  tbody.innerHTML = holidays
    .map(
      (holiday) => `
        <tr>
            <td>${holiday.name}</td>
            <td>${formatDate(holiday.date)}</td>
            <td>
                <span class="status-badge status-${holiday.isPaid ? "approved" : "pending"}">
                    ${holiday.isPaid ? "Paid" : "Unpaid"}
                </span>
            </td>
            <td>
                <button class="btn-small btn-reject" onclick="deleteHolidayRecord(${holiday.id})">Delete</button>
            </td>
        </tr>
    `,
    )
    .join("");
}

function showAddHolidayModal() {
  document.getElementById("holidayForm").reset();
  document.getElementById("holidayModal").style.display = "block";
}

function saveHoliday(event) {
  event.preventDefault();

  const formData = {
    name: document.getElementById("holidayName").value,
    date: document.getElementById("holidayDate").value,
    isPaid: document.getElementById("holidayPaid").checked,
  };

  addHoliday(formData);
  alert("Holiday added successfully!");
  closeModal("holidayModal");
  loadHolidays();
}

function deleteHolidayRecord(id) {
  if (confirm("Are you sure you want to delete this holiday?")) {
    deleteHoliday(id);
    loadHolidays();
  }
}

// ===== PAYROLL =====
function loadPayrollHistory() {
  const payroll = getPayroll();
  const tbody = document.getElementById("payrollTableBody");

  if (payroll.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align: center;">No payroll records found</td></tr>';
    return;
  }

  tbody.innerHTML = [...payroll]
    .reverse()
    .map(
      (record) => `
        <tr>
            <td>${record.employeeName}</td>
            <td>${record.period}</td>
            <td>${formatCurrency(record.regularPay)}</td>
            <td>${formatCurrency(record.overtimePay)}</td>
            <td>${formatCurrency(record.deductions)}</td>
            <td><strong>${formatCurrency(record.netPay)}</strong></td>
            <td>
                <span class="status-badge status-approved">
                    ${record.status}
                </span>
            </td>
            <td>
                <button class="btn-small btn-approve" onclick="viewPayslip(${record.id})">View</button>
            </td>
        </tr>
    `,
    )
    .join("");
}

function showRunPayrollModal() {
  const period = getCurrentPeriod();
  const employees = getActiveEmployees();
  const attendance = getAttendance();

  let preview = `
        <h3>Payroll Preview for ${period.label}</h3>
        <p>Period: ${formatDate(period.start)} to ${formatDate(period.end)}</p>
        <table class="employee-table">
            <thead>
                <tr>
                    <th>Employee</th>
                    <th>Regular Hours</th>
                    <th>OT Hours</th>
                    <th>Regular Pay</th>
                    <th>OT Pay</th>
                    <th>Net Pay</th>
                </tr>
            </thead>
            <tbody>
    `;

  let totalPayout = 0;
  const payrollData = [];

  employees.forEach((emp) => {
    const empAttendance = attendance.filter(
      (a) =>
        a.employeeId === emp.id &&
        a.date >= period.start &&
        a.date <= period.end &&
        a.isComplete,
    );

    const regularHours = empAttendance.reduce(
      (sum, a) => sum + (a.hoursWorked - a.overtimeHours),
      0,
    );
    const overtimeHours = empAttendance.reduce(
      (sum, a) => sum + a.overtimeHours,
      0,
    );

    const regularPay = regularHours * emp.hourlyRate;
    const overtimePay =
      overtimeHours * emp.hourlyRate * getSettings().overtimeRate;
    const deductions = 0;
    const netPay = regularPay + overtimePay - deductions;

    totalPayout += netPay;

    payrollData.push({
      employeeId: emp.id,
      employeeName: emp.fullName,
      period: period.label,
      periodStart: period.start,
      periodEnd: period.end,
      regularHours: Math.round(regularHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      regularPay: regularPay,
      overtimePay: overtimePay,
      deductions: deductions,
      netPay: netPay,
      generatedAt: new Date().toISOString(),
      status: "Paid",
    });

    preview += `
            <tr>
                <td>${emp.fullName}</td>
                <td>${regularHours.toFixed(2)}</td>
                <td>${overtimeHours.toFixed(2)}</td>
                <td>${formatCurrency(regularPay)}</td>
                <td>${formatCurrency(overtimePay)}</td>
                <td><strong>${formatCurrency(netPay)}</strong></td>
            </tr>
        `;
  });

  preview += `
            </tbody>
            <tfoot>
                <tr>
                    <th colspan="5">Total Payout</th>
                    <th><strong>${formatCurrency(totalPayout)}</strong></th>
                </tr>
            </tfoot>
        </table>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal('payrollModal')">Cancel</button>
            <button class="btn btn-primary" onclick='confirmRunPayroll(${JSON.stringify(payrollData)})'>Confirm & Run Payroll</button>
        </div>
    `;

  document.getElementById("payrollPreview").innerHTML = preview;
  document.getElementById("payrollModal").style.display = "block";
}

function confirmRunPayroll(payrollData) {
  payrollData.forEach((record) => {
    addPayroll(record);
  });

  alert("Payroll generated successfully!");
  closeModal("payrollModal");
  loadPayrollHistory();
}

function viewPayslip(id) {
  const payroll = getPayrollById(id);
  if (!payroll) return;

  const employee = getUserById(payroll.employeeId);
  const settings = getSettings();

  const payslip = `
        <div class="payslip">
            <div class="payslip-header">
                <h2>${settings.shopName}</h2>
                <h3>PAYSLIP</h3>
            </div>
            <div class="payslip-info">
                <div><strong>Employee:</strong> ${payroll.employeeName}</div>
                <div><strong>Position:</strong> ${employee?.position || "N/A"}</div>
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
                    <td>${payroll.regularHours.toFixed(2)} hrs @ ${formatCurrency(employee?.hourlyRate || 0)}/hr</td>
                    <td>${formatCurrency(payroll.regularPay)}</td>
                </tr>
                <tr>
                    <td>Overtime Hours</td>
                    <td>${payroll.overtimeHours.toFixed(2)} hrs @ ${formatCurrency((employee?.hourlyRate || 0) * settings.overtimeRate)}/hr</td>
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

// ===== REPORTS =====
function generateAttendanceReport() {
  const period = getCurrentPeriod();
  const attendance = getAttendance().filter(
    (a) => a.date >= period.start && a.date <= period.end,
  );

  const employeeStats = {};

  attendance.forEach((record) => {
    if (!employeeStats[record.employeeId]) {
      employeeStats[record.employeeId] = {
        name: record.employeeName,
        totalHours: 0,
        overtimeHours: 0,
        days: 0,
      };
    }
    employeeStats[record.employeeId].totalHours += record.hoursWorked || 0;
    employeeStats[record.employeeId].overtimeHours += record.overtimeHours || 0;
    employeeStats[record.employeeId].days += 1;
  });

  let report = `
        <h3>Attendance Report - ${period.label}</h3>
        <table class="employee-table">
            <thead>
                <tr>
                    <th>Employee</th>
                    <th>Days Worked</th>
                    <th>Total Hours</th>
                    <th>Overtime Hours</th>
                    <th>Average Hours/Day</th>
                </tr>
            </thead>
            <tbody>
    `;

  Object.values(employeeStats).forEach((stat) => {
    const avgHours = stat.days > 0 ? stat.totalHours / stat.days : 0;
    report += `
            <tr>
                <td>${stat.name}</td>
                <td>${stat.days}</td>
                <td>${stat.totalHours.toFixed(2)}</td>
                <td>${stat.overtimeHours.toFixed(2)}</td>
                <td>${avgHours.toFixed(2)}</td>
            </tr>
        `;
  });

  report += `
            </tbody>
        </table>
    `;

  document.getElementById("reportOutput").innerHTML = report;
}

function generatePayrollReport() {
  const period = getCurrentPeriod();
  const payroll = getPayroll().filter(
    (p) => p.periodStart === period.start && p.periodEnd === period.end,
  );

  let totalRegular = 0,
    totalOvertime = 0,
    totalDeductions = 0,
    totalNet = 0;

  payroll.forEach((p) => {
    totalRegular += p.regularPay;
    totalOvertime += p.overtimePay;
    totalDeductions += p.deductions;
    totalNet += p.netPay;
  });

  let report = `
        <h3>Payroll Summary - ${period.label}</h3>
        <div class="stats-grid" style="margin-bottom: 20px;">
            <div class="stat-card">
                <h3>Total Regular Pay</h3>
                <div class="value">${formatCurrency(totalRegular)}</div>
            </div>
            <div class="stat-card">
                <h3>Total Overtime Pay</h3>
                <div class="value">${formatCurrency(totalOvertime)}</div>
            </div>
            <div class="stat-card">
                <h3>Total Deductions</h3>
                <div class="value">${formatCurrency(totalDeductions)}</div>
            </div>
            <div class="stat-card">
                <h3>Total Payout</h3>
                <div class="value">${formatCurrency(totalNet)}</div>
            </div>
        </div>
        <table class="employee-table">
            <thead>
                <tr>
                    <th>Employee</th>
                    <th>Regular Pay</th>
                    <th>Overtime Pay</th>
                    <th>Deductions</th>
                    <th>Net Pay</th>
                </tr>
            </thead>
            <tbody>
    `;

  payroll.forEach((p) => {
    report += `
            <tr>
                <td>${p.employeeName}</td>
                <td>${formatCurrency(p.regularPay)}</td>
                <td>${formatCurrency(p.overtimePay)}</td>
                <td>${formatCurrency(p.deductions)}</td>
                <td><strong>${formatCurrency(p.netPay)}</strong></td>
            </tr>
        `;
  });

  report += `
            </tbody>
        </table>
    `;

  document.getElementById("reportOutput").innerHTML = report;
}

function generateLeaveReport() {
  const leaves = getLeaves();

  const leaveStats = {};

  leaves.forEach((leave) => {
    if (!leaveStats[leave.employeeId]) {
      leaveStats[leave.employeeId] = {
        name: leave.employeeName,
        approved: 0,
        pending: 0,
        rejected: 0,
      };
    }
    leaveStats[leave.employeeId][leave.status.toLowerCase()]++;
  });

  let report = `
        <h3>Leave Report</h3>
        <table class="employee-table">
            <thead>
                <tr>
                    <th>Employee</th>
                    <th>Approved</th>
                    <th>Pending</th>
                    <th>Rejected</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
    `;

  Object.values(leaveStats).forEach((stat) => {
    const total = stat.approved + stat.pending + stat.rejected;
    report += `
            <tr>
                <td>${stat.name}</td>
                <td>${stat.approved}</td>
                <td>${stat.pending}</td>
                <td>${stat.rejected}</td>
                <td><strong>${total}</strong></td>
            </tr>
        `;
  });

  report += `
            </tbody>
        </table>
    `;

  document.getElementById("reportOutput").innerHTML = report;
}

// ===== SETTINGS =====
function loadSettings() {
  const settings = getSettings();

  document.getElementById("settingShopName").value = settings.shopName;
  document.getElementById("settingWorkStart").value =
    settings.workingHours.start;
  document.getElementById("settingWorkEnd").value = settings.workingHours.end;
  document.getElementById("settingOvertimeRate").value = settings.overtimeRate;
  document.getElementById("settingPayPeriod").value = settings.payPeriod;
  document.getElementById("settingRegularRate").value = settings.regularRate;
}

function saveSettings() {
  const updates = {
    shopName: document.getElementById("settingShopName").value,
    workingHours: {
      start: document.getElementById("settingWorkStart").value,
      end: document.getElementById("settingWorkEnd").value,
    },
    overtimeRate: parseFloat(
      document.getElementById("settingOvertimeRate").value,
    ),
    payPeriod: document.getElementById("settingPayPeriod").value,
    regularRate: parseFloat(
      document.getElementById("settingRegularRate").value,
    ),
  };

  updateSettings(updates);
  alert("Settings saved successfully!");
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
