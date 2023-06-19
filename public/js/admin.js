const tableBody = document.querySelector("#admin-data tbody");

function createTableRow(userData) {
  const row = document.createElement("tr");

  // Create and append table cells for each data field
  const userCell = document.createElement("td");
  userCell.textContent = userData.audioPath.split("/")[1];
  if (userCell.textContent) {
    userCell.textContent = userCell.textContent.split("_")[0];
  }
  row.appendChild(userCell);

  const filenameCell = document.createElement("td");
  filenameCell.textContent = userData.filename;
  row.appendChild(filenameCell);

  const textCell = document.createElement("td");
  textCell.textContent = userData.text;
  row.appendChild(textCell);

  const audioCell = document.createElement("td");
  const audioElement = document.createElement("audio");
  // audioElement.src = serverURL + "/" + userData.item.audioPath;
  if (userData.audioPath) {
    audioElement.src = "/" + userData.audioPath;
  }
  audioElement.controls = true;
  audioCell.appendChild(audioElement);
  row.appendChild(audioCell);

  const createdAtCell = document.createElement("td");
  const audioDate = userData.createdAt
    ? new Date(userData.createdAt).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "";

  createdAtCell.textContent = audioDate;
  row.appendChild(createdAtCell);

  tableBody.appendChild(row);
}

fetch("/admin/get-panel", {
  method: "GET",
  headers: {
    Authorization: "Bearer " + localStorage.getItem("token"),
  },
})
  .then((response) => response.json())
  .then((data) => {
    if (!data) {
      return;
    }
    data.allFiles.forEach((userData) => {
      createTableRow(userData);
    });
    const pages = data.pages;
    updateThePagination(pages, 1);
  })
  .catch((error) => {
    console.log(error);
  });

const pagination = document.getElementById("pagination");

function addButton(text) {
  let button = document.createElement("button");
  button.innerText = text;
  pagination.appendChild(button);

  button.addEventListener("click", function () {
    let url = "/admin/get-panel?page=" + text;
    fetch(url, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data) {
          return;
        }
        tableBody.innerHTML = "";

        data.allFiles.forEach((userData) => {
          createTableRow(userData);
        });
        const pages = data.pages;
        updateThePagination(pages, parseInt(text));
      })
      .catch((error) => {
        // Handle any errors
        console.error(error);
      });
  });
}

function updateThePagination(pages, currentpage) {
  if (currentpage > pages || currentpage < 1 || pages < 0) {
    return;
  }

  pagination.innerHTML = "";
  addButton(1);
  if (pages === 1) {
    return;
  }

  if (pages === 2) {
    addButton(2);
    return;
  }

  if (currentpage === 1) {
    console.log("yes");
    addButton(2);
    addButton(pages);
    return;
  }

  if (currentpage === pages) {
    addButton(currentpage - 1);
    addButton(currentpage);
    return;
  }
  if (currentpage - 1 !== 1) {
    addButton(currentpage - 1);
  }

  addButton(currentpage);

  if (currentpage + 1 !== pages) {
    addButton(currentpage + 1);
  }
  addButton(pages);
}
