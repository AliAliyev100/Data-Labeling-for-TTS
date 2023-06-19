const loginButton = document.getElementById("submitLogin");
loginButton.addEventListener("click", function (event) {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const password = document.getElementById("password").value;

  fetch("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: name,
      password: password,
    }),
  })
    .then((response) => {
      if (response.status === 401) {
        window.location.pathname = "/index.html";
        return 0;
      }
      return response.json();
    })
    .then((data) => {
      if (data === 0) {
        return;
      }
      window.location.pathname = "/label.html";
      localStorage.setItem("token", data.loginToken);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("expiryDate", data.expiryDate);
      localStorage.setItem("isAdmin", data.isAdmin);
    })
    .catch((error) => {
      console.error("An error occurred while sending the POST request:", error);
    });
});
