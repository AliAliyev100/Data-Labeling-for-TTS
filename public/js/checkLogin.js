const logoutTag = document.getElementById("logoutTag");
const labelTag = document.getElementById("labelTag");

let tokenCheck = localStorage.getItem("token");
const expiryDate = localStorage.getItem("expiryDate");

if (
  tokenCheck &&
  expiryDate &&
  new Date(expiryDate) > new Date() &&
  window.location.pathname === "/login.html"
) {
  window.location.pathname = "/index.html";
}

if (tokenCheck && expiryDate && new Date(expiryDate) > new Date()) {
  document.getElementById("loginTag").style.display = "none";
  logoutTag.style.display = "block";
} else {
  labelTag.style.display = "none";
}

logoutTag.addEventListener("click", function (event) {
  event.preventDefault();
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("expiryDate");
  window.location.pathname = "/index.html";
});
