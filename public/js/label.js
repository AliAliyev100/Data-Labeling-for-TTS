let i = 0;

const container = document.getElementById("container");
document.addEventListener("DOMContentLoaded", () => {
    console.log("here")
  fetch("/label")
    .then((response) => response.json())
    .then((data) => {
      data.result.forEach((res) => {
        console.log(res)
        const anchor = document.createElement("a");
        anchor.href = "#";
        anchor.innerHTML = res.filename;

        anchor.addEventListener("click", (event) => {
            console.log("herere")
          event.preventDefault();

          fetch("/gettextvalues", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ filename: res.filename }),
          })
            .then((response) => response.json())
            .then((data) => {
              let currentitems = data.result.fileitems.items;
              while (currentitems[i].audio) {
                i++;
              }
              console.log(data)
              document.getElementById("textinput").innerHTML =
                data.result.fileitems.items[i].text;
            })
            .catch((error) => {
              console.error(
                "An error occurred while sending the POST request:",
                error
              );
            });
        });

        const container = document.getElementById("container");
        container.appendChild(anchor);
        container.innerHTML += "<br>";
      });

      // container.innerHTML = (data.result[0].filename);
    })
    .catch((error) => console.error(error));
});
