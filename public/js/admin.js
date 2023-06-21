const tableBody = document.querySelector("#admin-data tbody");
const urlParams = new URLSearchParams(window.location.search);
const pagination = document.getElementById("pagination");
const adminForm = document.getElementById("panelForm");
const userSelect = document.getElementById("user");

let pageNumber = urlParams.get("page") || 1;
let selectedUser;
let startDate;
let endDate;

onload = () => {
  sendRequestToPanel(pageNumber);

  fetch("admin/get-users", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((response) => response.json())
    .then((result) => {
      const users = result.users;
      users.forEach((user) => {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = user.name;
        userSelect.appendChild(option);
      });
    });
};

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

  const deleteButtonCell = document.createElement("td");
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("data-id", userData.textId);
  deleteButton.setAttribute("data-textfile-id", userData._id);
  deleteButtonCell.appendChild(deleteButton);
  deleteButton.className = "delete-button";

  deleteButton.addEventListener("click", function () {
    deleteAudio(userData._id, userData.textId);
  });
  row.appendChild(deleteButtonCell);

  tableBody.appendChild(row);
}

function addButton(text) {
  let button = document.createElement("button");
  button.innerText = text;
  pagination.appendChild(button);

  button.addEventListener("click", function () {
    sendRequestToPanel(text, selectedUser, startDate, endDate);
  });
}

function sendRequestToPanel(text = 1, user, startdate, endDate) {
  let url = "/admin/get-panel?page=" + text;
  url += "&user=" + encodeURIComponent(user || "all");
  url += "&startdate=" + encodeURIComponent(startdate || "");
  url += "&enddate=" + encodeURIComponent(endDate || "");

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
      history.pushState({}, "", "?page=" + text);
    })
    .catch((error) => {
      // Handle any errors
      console.error(error);
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

function deleteAudio(textfileId, textId) {
  fetch(`/admin/delete-audio?textfileId=${textfileId}&textId=${textId}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((response) => {
      sendRequestToPanel(1, selectedUser, startDate, endDate);
    })
    .catch((error) => {
      console.error(error);
    });
}

adminForm.addEventListener("submit", function (event) {
  event.preventDefault();
  selectedUser = document.getElementById("user").value;
  startDate = document.getElementById("start-date").value;
  endDate = document.getElementById("end-date").value;

  sendRequestToPanel(1, selectedUser, startDate, endDate);
});
