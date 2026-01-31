// Application data structure
const appData = {
  // Shop settings
  settings: {
    shopName: "Milktea Shop",
    workingHours: {
      start: "09:00",
      end: "18:00",
    },
    overtimeRate: 1.5,
    payPeriod: "monthly", // weekly or monthly
    regularRate: 100, // base hourly rate
  },

  // Users (employees and managers)
  users: [
    {
      id: 1,
      username: "manager",
      password: "1234",
      role: "manager",
      email: "manager@milktea.com",
      fullName: "Manager Admin",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    {
      id: 2,
      username: "employee1",
      password: "1234",
      role: "employee",
      email: "employee1@milktea.com",
      fullName: "Juan Dela Cruz",
      hourlyRate: 100,
      position: "Barista",
      dateHired: "2024-01-15",
      isActive: true,
      avatar: "https://i.pravatar.cc/150?img=33",
    },
    {
      id: 3,
      username: "employee2",
      password: "1234",
      role: "employee",
      email: "employee2@milktea.com",
      fullName: "Maria Santos",
      hourlyRate: 120,
      position: "Senior Barista",
      dateHired: "2023-06-10",
      isActive: true,
      avatar: "https://i.pravatar.cc/150?img=47",
    },
  ],

  // Leave requests
  leaves: [
    {
      id: 1,
      employeeId: 2,
      employeeName: "Juan Dela Cruz",
      type: "Sick Leave",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-01",
      reason: "Not feeling well",
      status: "Pending",
      requestedAt: "2026-01-20T10:30:00",
    },
  ],

  // Attendance records
  attendance: [
    {
      id: 1,
      employeeId: 2,
      employeeName: "Juan Dela Cruz",
      date: "2026-01-24",
      timeIn: "2026-01-24T09:00:00",
      timeOut: "2026-01-24T18:00:00",
      hoursWorked: 9,
      overtimeHours: 1,
      isComplete: true,
    },
  ],

  // Holidays
  holidays: [
    {
      id: 1,
      name: "New Year's Day",
      date: "2026-01-01",
      isPaid: true,
    },
    {
      id: 2,
      name: "Independence Day",
      date: "2026-06-12",
      isPaid: true,
    },
  ],

  // Payroll records
  payroll: [
    {
      id: 1,
      employeeId: 2,
      employeeName: "Juan Dela Cruz",
      period: "January 2026",
      periodStart: "2026-01-01",
      periodEnd: "2026-01-31",
      regularHours: 160,
      overtimeHours: 10,
      regularPay: 16000,
      overtimePay: 1500,
      deductions: 500,
      netPay: 17000,
      generatedAt: "2026-01-25T10:00:00",
      status: "Paid",
    },
  ],

  currentUser: null,
  nextId: {
    user: 4,
    leave: 2,
    attendance: 2,
    holiday: 3,
    payroll: 2,
  },
};

// Initialize data in window object for global access
if (!window.appData) {
  window.appData = JSON.parse(JSON.stringify(appData));
}

// ===== UTILITY FUNCTIONS =====

// Current User
function getCurrentUser() {
  const stored = localStorage.getItem("currentUser");
  return stored ? JSON.parse(stored) : null;
}

function setCurrentUser(user) {
  window.appData.currentUser = user;
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  } else {
    localStorage.removeItem("currentUser");
  }
}
// logout moved to js/utils.js

// Settings
function getSettings() {
  return window.appData.settings;
}

function updateSettings(updates) {
  window.appData.settings = { ...window.appData.settings, ...updates };
}

// Users
function getUsers() {
  return window.appData.users;
}

function getUserById(id) {
  return window.appData.users.find((u) => u.id === id);
}

function addUser(user) {
  user.id = window.appData.nextId.user++;
  window.appData.users.push(user);
  return user;
}

function updateUser(id, updates) {
  const index = window.appData.users.findIndex((u) => u.id === id);
  if (index !== -1) {
    window.appData.users[index] = {
      ...window.appData.users[index],
      ...updates,
    };
    // Keep currentUser in sync if we updated the logged-in user
    if (window.appData.currentUser && window.appData.currentUser.id === id) {
      setCurrentUser(window.appData.users[index]);
    }
    return window.appData.users[index];
  }
  return null;
}

function deleteUser(id) {
  const index = window.appData.users.findIndex((u) => u.id === id);
  if (index !== -1) {
    window.appData.users.splice(index, 1);
    return true;
  }
  return false;
}

function getEmployees() {
  return window.appData.users.filter((u) => u.role === "employee");
}

function getActiveEmployees() {
  return window.appData.users.filter(
    (u) => u.role === "employee" && u.isActive,
  );
}

// Leaves
function getLeaves() {
  return window.appData.leaves;
}

function getLeaveById(id) {
  return window.appData.leaves.find((l) => l.id === id);
}

function addLeave(leave) {
  leave.id = window.appData.nextId.leave++;
  window.appData.leaves.push(leave);
  return leave;
}

function updateLeave(id, updates) {
  const index = window.appData.leaves.findIndex((l) => l.id === id);
  if (index !== -1) {
    window.appData.leaves[index] = {
      ...window.appData.leaves[index],
      ...updates,
    };
    return window.appData.leaves[index];
  }
  return null;
}

function deleteLeave(id) {
  const index = window.appData.leaves.findIndex((l) => l.id === id);
  if (index !== -1) {
    window.appData.leaves.splice(index, 1);
    return true;
  }
  return false;
}

function getLeavesByEmployee(employeeId) {
  return window.appData.leaves.filter((l) => l.employeeId === employeeId);
}

// Attendance
function getAttendance() {
  return window.appData.attendance;
}

function getAttendanceById(id) {
  return window.appData.attendance.find((a) => a.id === id);
}

function addAttendance(record) {
  record.id = window.appData.nextId.attendance++;
  window.appData.attendance.push(record);
  return record;
}

function updateAttendance(id, updates) {
  const index = window.appData.attendance.findIndex((a) => a.id === id);
  if (index !== -1) {
    window.appData.attendance[index] = {
      ...window.appData.attendance[index],
      ...updates,
    };
    return window.appData.attendance[index];
  }
  return null;
}

function deleteAttendance(id) {
  const index = window.appData.attendance.findIndex((a) => a.id === id);
  if (index !== -1) {
    window.appData.attendance.splice(index, 1);
    return true;
  }
  return false;
}

function getAttendanceByEmployee(employeeId) {
  return window.appData.attendance.filter((a) => a.employeeId === employeeId);
}

function getTodayAttendance() {
  const today = new Date().toISOString().split("T")[0];
  return window.appData.attendance.filter((a) => a.date === today);
}

function getActiveAttendance(employeeId) {
  return window.appData.attendance.find(
    (a) => a.employeeId === employeeId && !a.isComplete,
  );
}

// Holidays
function getHolidays() {
  return window.appData.holidays;
}

function getHolidayById(id) {
  return window.appData.holidays.find((h) => h.id === id);
}

function addHoliday(holiday) {
  holiday.id = window.appData.nextId.holiday++;
  window.appData.holidays.push(holiday);
  return holiday;
}

function updateHoliday(id, updates) {
  const index = window.appData.holidays.findIndex((h) => h.id === id);
  if (index !== -1) {
    window.appData.holidays[index] = {
      ...window.appData.holidays[index],
      ...updates,
    };
    return window.appData.holidays[index];
  }
  return null;
}

function deleteHoliday(id) {
  const index = window.appData.holidays.findIndex((h) => h.id === id);
  if (index !== -1) {
    window.appData.holidays.splice(index, 1);
    return true;
  }
  return false;
}

// Payroll
function getPayroll() {
  return window.appData.payroll;
}

function getPayrollById(id) {
  return window.appData.payroll.find((p) => p.id === id);
}

function addPayroll(record) {
  record.id = window.appData.nextId.payroll++;
  window.appData.payroll.push(record);
  return record;
}

function getPayrollByEmployee(employeeId) {
  return window.appData.payroll.filter((p) => p.employeeId === employeeId);
}

// Helper functions
function calculateHoursWorked(timeIn, timeOut) {
  const start = new Date(timeIn);
  const end = new Date(timeOut);
  const diffMs = end - start;
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.round(diffHours * 100) / 100;
}

function calculateOvertime(hoursWorked, regularHours = 8) {
  return Math.max(0, hoursWorked - regularHours);
}

function formatCurrency(amount) {
  return "₱" + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCurrentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (window.appData.settings.payPeriod === "monthly") {
    const periodStart = new Date(year, month, 1);
    const periodEnd = new Date(year, month + 1, 0);
    return {
      start: periodStart.toISOString().split("T")[0],
      end: periodEnd.toISOString().split("T")[0],
      label: periodStart.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      }),
    };
  } else {
    // Weekly logic
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      start: monday.toISOString().split("T")[0],
      end: sunday.toISOString().split("T")[0],
      label: `Week of ${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    };
  }
}
