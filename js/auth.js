// Login function
function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("loginError");

  // Validate input
  if (!username || !password) {
    errorMsg.textContent = "Please enter username and password";
    return;
  }

  const users = getUsers();
  const user = users.find(
    (u) => u.username === username && u.password === password,
  );

  if (!user) {
    errorMsg.textContent = "Invalid username or password";
    return;
  }

  // Set current user
  setCurrentUser(user);
  errorMsg.textContent = "";

  // Redirect to appropriate dashboard
  if (user.role === "manager") {
    window.location.href = "manager.html";
  } else {
    window.location.href = "employee.html";
  }
}

// logout moved to js/utils.js

// Enable enter key for login
document.addEventListener("DOMContentLoaded", function () {
  const passwordField = document.getElementById("password");
  if (passwordField) {
    passwordField.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        login();
      }
    });
  }

  const usernameField = document.getElementById("username");
  if (usernameField) {
    usernameField.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        login();
      }
    });
  }
});
