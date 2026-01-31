// Shared utilities
// logout: clears current user and redirects to login page
function logout() {
  setCurrentUser(null);
  window.location.href = "index.html";
}
window.logout = logout;
