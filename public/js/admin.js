const tableBody = document.querySelector("#admin-data tbody");
const urlParams = new URLSearchParams(window.location.search);
const pagination = document.getElementById("pagination");
const adminForm = document.getElementById("panelForm");
const userSelect = document.getElementById("user");

let modal = document.getElementById("time-modal");
let totalTimeBtn = document.getElementById("totalTimeBtn");
let span = document.getElementsByClassName("close")[0];
const modalUserSelect = document.getElementById("modal-user");
const modalForm = document.getElementById("modalForm");

let pageNumber = urlParams.get("page") || 1;
let selectedUser;
let startDate;
let endDate;

onload = () => {
  sendRequestToPanel(pageNumber);
  getUsersAndAppend(userSelect, modalUserSelect);
  let todaysDate = new Date().toISOString().split("T")[0];
  let tomorrowsDate = new Date(todaysDate);
  tomorrowsDate.setDate(tomorrowsDate.getDate() + 1);
  tomorrowsDate = tomorrowsDate.toISOString().split("T")[0];

  document.getElementById("modal-start-date").value = todaysDate;
  document.getElementById("modal-end-date").value = tomorrowsDate;
  document.getElementById("start-date").value = todaysDate;
  document.getElementById("end-date").value = tomorrowsDate;
};

function createTableRow(userData, index) {
  const row = document.createElement("tr");

  const indexCell = document.createElement("td");
  indexCell.textContent = index;
  indexCell.style.fontWeight = "bold";
  row.appendChild(indexCell);

  // Create and append table cells for each data field
  const userCell = document.createElement("td");
  userCell.textContent = userData.audioPath.split("/")[1];
  if (userCell.textContent) {
    userCell.textContent = userCell.textContent.split("_")[0];
  }
  row.appendChild(userCell);

  const textCell = document.createElement("td");
  textCell.textContent = userData.text;
  row.appendChild(textCell);

  const audioCell = document.createElement("td");
  const audioElement = document.createElement("audio");
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

  const editButtonCell = document.createElement("td");
  const editButton = document.createElement("button");
  editButton.textContent = "Edit";
  editButton.setAttribute("data-id", userData.textId);
  editButton.setAttribute("data-textfile-id", userData._id);
  editButtonCell.appendChild(editButton);
  editButton.className = "edit-button";
  editButton.addEventListener("click", function () {
    enableTextEdit(textCell, userData._id, userData.textId);
  });
  row.appendChild(editButtonCell);

  tableBody.appendChild(row);
}

function enableTextEdit(textCell, textfileId, textId) {
  const inputField = document.createElement("input");
  inputField.type = "text";
  inputField.value = textCell.textContent;

  inputField.style.width = "800px";
  inputField.style.height = "40px";

  textCell.textContent = "";
  textCell.appendChild(inputField);

  inputField.focus();

  inputField.addEventListener("blur", function () {
    textCell.textContent = inputField.value;

    fetch("/admin/edit-text", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        content: textCell.textContent,
        textfileId: textfileId,
        textId: textId,
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
      })
      .catch((err) => {
        alert("Failed to delete audio.");
        sendRequestToPanel(pageNumber, selectedUser, startDate, endDate);
      });
  });
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

      data.allFiles.forEach((userData, index) => {
        createTableRow(userData, index + 1 + data.skip);
      });
      const pages = data.pages;
      updateThePagination(pages, parseInt(text));
      history.pushState({}, "", "?page=" + text);
    })
    .catch((error) => {
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
  const confirmed = window.confirm(
    "Are you sure you want to delete the audio?"
  );
  if (confirmed) {
    const button = document.querySelector(`button[data-id="${textId}"]`);
    if (button) {
      const row = button.closest("tr");
      if (row) {
        row.remove();
      }
    }
    fetch(`/admin/delete-audio?textfileId=${textfileId}&textId=${textId}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    })
      .then((response) => {
        if (!response.ok) {
          sendRequestToPanel(pageNumber, selectedUser, startDate, endDate);
          throw new Error("Failed to delete audio.");
        }
      })
      .catch((error) => {
        alert("Failed to delete audio.");
        sendRequestToPanel(pageNumber, selectedUser, startDate, endDate);
      });
  }
}

function getUsersAndAppend(appendPlace1, appendPlace2) {
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
        const option2 = document.createElement("option");
        option2.value = user.id;
        option2.textContent = user.name;
        appendPlace1.appendChild(option);
        appendPlace2.appendChild(option2);
      });
    });
}

adminForm.addEventListener("submit", function (event) {
  event.preventDefault();
  selectedUser = document.getElementById("user").value;
  startDate = document.getElementById("start-date").value;
  endDate = document.getElementById("end-date").value;

  sendRequestToPanel(1, selectedUser, startDate, endDate);
});

totalTimeBtn.addEventListener("click", openModal);
function openModal() {
  modal.style.display = "block";
}

span.addEventListener("click", closeModal);
function closeModal() {
  modal.style.display = "none";
}

window.addEventListener("click", function (event) {
  if (event.target == modal) {
    closeModal();
  }
});

modalForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const selectedModalUser = document.getElementById("modal-user").value;
  const startModalDate = document.getElementById("modal-start-date").value;
  const endModalDate = document.getElementById("modal-end-date").value;

  document.getElementById("totalTimeResult").innerHTML =
    "Please wait few seconds";

  fetch("admin/get-time", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      user: selectedModalUser,
      startDate: startModalDate,
      endDate: endModalDate,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
      document.getElementById("totalTimeResult").innerHTML =
        "Total time: " + result.totalTime.toFixed(2) + " milliseconds";
    })
    .catch((err) => {
      alert("Could not retrieve info");
    });
});
