const form = document.querySelector(".product-form");

form.addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent default form submission
  token = localStorage.getItem("token");

  const formData = new FormData(this);
  const headers = new Headers();
  headers.append("Authorization", "Bearer " + token);

  fetch("admin/add-item-text", {
    method: "POST",
    headers: headers,
    body: formData,
  })
    .then((response) => {
      if (response.status === 401) {
        window.location.pathname = "/label.html";
      } else {
        window.location.pathname = "/upload.html";
      }
    })
    .catch((error) => {
      console.log(error);
    });
});
