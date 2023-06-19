const navbar = document.getElementById("navbar");

const logoutTag = document.getElementById("logoutTag");
const labelTag = document.getElementById("labelTag");
const uploadTag = document.getElementById("uploadTag");

let tokenCheck = localStorage.getItem("token");
const expiryDate = localStorage.getItem("expiryDate");
const isAdmin = localStorage.getItem("isAdmin");

uploadTag.style.display = "none";

if (
  tokenCheck &&
  expiryDate &&
  new Date(expiryDate) > new Date() &&
  (window.location.pathname === "/index.html" ||
    window.location.pathname === "/")
) {
  window.location.pathname = "/label.html";
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
  localStorage.removeItem("isAdmin");
  window.location.pathname = "/index.html";
});

if (isAdmin === "true") {
  let newItem = document.createElement("li");
  newItem.classList.add("nav-item");

  const newLink = document.createElement("a");
  newLink.href = "/upload.html";
  newLink.classList.add("nav-link");
  newLink.id = "uploadTag";
  newLink.textContent = "Upload page";

  newItem.appendChild(newLink);
  navbar.appendChild(newItem);
}
