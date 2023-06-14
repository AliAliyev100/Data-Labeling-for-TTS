//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;
var gumStream; //stream from getUserMedia()
var rec; //Recorder.js object
var input; //MediaStreamAudioSourceNode we'll be recording
let audioUrl;

let text;
let textId;
let filename;

let token;

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //audio context to help us record

let recordButton = document.getElementById("recordButton");
let stopButton = document.getElementById("stopButton");
let submitButton = document.getElementById("submitButton");
let deleteButton = document.getElementById("deleteButton");
let skipButton = document.getElementById("skipButton");
let currentRecording = document.querySelector("#audioElement");

recordButton.disabled = true;

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
submitButton.addEventListener("click", testRecording);
deleteButton.addEventListener("click", deleteRecording);

function testRecording() {}

function deleteRecording() {
  console.log("delete");
  recordingsList.innerHTML = "";
  recordButton.disabled = false;
  submitButton.style.display = "none";
  deleteButton.style.display = "none";
}

submitButton.style.display = "none";
deleteButton.style.display = "none";

function startRecording() {
  console.log("recordButton clicked");
  var constraints = { audio: true, video: false };

  recordButton.disabled = true;
  stopButton.disabled = false;
  skipButton.disabled = true;

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      console.log(
        "getUserMedia() success, stream created, initializing Recorder.js ..."
      );

      audioContext = new AudioContext();
      gumStream = stream;

      input = audioContext.createMediaStreamSource(stream);

      rec = new Recorder(input, { numChannels: 1 });

      rec.record();

      console.log("Recording started");
    })
    .catch(function (err) {
      recordButton.disabled = false;
      stopButton.disabled = true;
    });
}

// function pauseRecording() {
//   console.log("pauseButton clicked rec.recording=", rec.recording);
//   if (rec.recording) {
//     rec.stop();
//     pauseButton.innerHTML = "Resume";
//   } else {
//     rec.record();
//     pauseButton.innerHTML = "Pause";
//   }
// }

function stopRecording() {
  console.log("stopButton clicked");

  stopButton.disabled = true;
  recordButton.disabled = true;
  skipButton.disabled = false;

  console.log(rec);

  rec.stop();

  gumStream.getAudioTracks()[0].stop();

  rec.exportWAV(createDownloadLink);

  submitButton.style.display = "block";
  deleteButton.style.display = "block";
}

submitButton.addEventListener("click", sendToNodeJs);

function createDownloadLink(blob) {
  var url = URL.createObjectURL(blob);
  var au = document.createElement("audio");
  var li = document.createElement("li");
  var link = document.createElement("a");

  var filename = new Date().toISOString();

  au.controls = true;
  au.src = url;
  audioUrl = au.src;
  au.id = "audioElement";

  link.href = url;
  // link.innerHTML = "Save voice to disk from here";

  li.appendChild(au);

  li.appendChild(link);

  var upload = document.createElement("a");
  upload.href = "#";
  // upload.innerHTML = "Upload";
  upload.addEventListener("click", function (event) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function (e) {
      if (this.readyState === 4) {
        console.log("Server returned: ", e.target.responseText);
      }
    };
    var fd = new FormData();
    fd.append("audio_data", blob, filename);
    xhr.open("POST", "upload.php", true);
    xhr.send(fd);
  });
  li.appendChild(document.createTextNode(" ")); //add a space in between
  li.appendChild(upload); //add the upload link to li

  recordingsList.appendChild(li);
}

async function sendToNodeJs(e) {
  e.preventDefault();
  const baseURL = "/create-audio";
  const audioFile = document.querySelector("audio").src;
  const formData = new FormData();

  submitButton.style.display = "none";
  deleteButton.style.display = "none";
  token = localStorage.getItem("token");

  fetch(audioFile)
    .then((response) => response.blob())
    .then((blob) => {
      const audioBlob = new File([blob], textId, { type: "audio/wav" });

      formData.append("audio", audioBlob);
      formData.append("textId", textId);
      formData.append("filename", filename);

      fetch("/audio" + baseURL, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
        },
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          text = data.result;
          textId = data.fileName;
          document.getElementById("textinput").value = text;
          recordButton.disabled = false;
          currentRecording = document.querySelector("#audioElement");
          currentRecording.parentNode.removeChild(currentRecording);

          if (text.trim() === "Tebrikler! Butun Cumleleri Bitirdiniz!") {
            recordButton.disabled = true;
            skipButton.disabled = true;
          }
        })
        .catch((error) => {
          console.error(
            "An error occurred while sending the POST request:",
            error
          );
        });
    })
    .catch((error) => console.error(error));
}

const container = document.getElementById("container");
token = localStorage.getItem("token");

document.addEventListener("DOMContentLoaded", () => {
  getTextValues();
});

function getTextValues() {
  token = localStorage.getItem("token");

  fetch("/files/gettextvalues", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  })
    .then((response) => {
      console.log(response);
      if (response.status === 401) {
        return (window.location.pathname = "/index.html");
      }
      return response.json();
    })
    .then((data) => {
      text = data.result;
      textId = data.fileName;
      document.getElementById("textinput").value = text;
      recordButton.disabled = false;
      skipButton.disabled = false;
      if (text.trim() === "Tebrikler! Butun Cumleleri Bitirdiniz!") {
        recordButton.disabled = true;
        skipButton.disabled = true;
        ``;
      }
    })
    .catch((error) => {
      console.error("An error occurred while sending the POST request:", error);
    });
}

skipButton.addEventListener("click", (event) => {
  submitButton.style.display = "none";
  deleteButton.style.display = "none";
  token = localStorage.getItem("token");

  fetch("/audio/skip", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  })
    .then((response) => {
      console.log(response);
      if (response.status === "401") {
        return (window.location.pathname = "/index.html");
      }

      return response.json();
    })
    .then((data) => {
      text = data.result;
      textId = data.fileName;
      document.getElementById("textinput").value = text;
      recordButton.disabled = false;
      currentRecording = document.querySelector("#audioElement");
      currentRecording.parentNode.removeChild(currentRecording);

      if (text.trim() === "Tebrikler! Butun Cumleleri Bitirdiniz!") {
        recordButton.disabled = true;
        skipButton.disabled = true;
      }
    })
    .catch((error) => {
      console.error("An error occurred while sending the POST request:", error);
    });
});
