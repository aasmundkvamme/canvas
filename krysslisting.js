// ==UserScript==
// @name		akv krysslisting
// @namespace	http://tampermonkey.net/
// @version		3.0
// @description	Krysslister ein seksjon, og legg att melding på heimesida om kvar den er krysslista
// @author		Aasmund Kvamme
// @match		https://hvl.instructure.com/courses/*/sections/*
// @icon		https://www.google.com/s2/favicons?sz=64&domain=instructure.com
// @grant		none
// ==/UserScript==

(function () {
  "use strict";
  // Create a new button element
  var button = document.createElement("button");

  // Set the button's text content
  button.textContent = "Emne eg skal kryssliste til";
  button.style.background = "#f5f5f5";
  button.style.color = "#2d3b45";
  button.style.borderColor = "#c7cdd1";
  button.style.borderRadius = "3px";
  button.style.padding = "8px 14px";
  button.style.border = "1px solid";
  button.style.cursor = "pointer";
  button.style.fontSize = "1rem";
  button.style.lineHeight = "20px";

  // Add a click event listener to the button
  button.addEventListener("click", function () {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2); // Get the last 2 digits of the year
    const month = (today.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
    const day = today.getDate().toString().padStart(2, "0");
    const yymmdd = `${year}${month}${day}`;
    const currentUrl = window.location.href;
    const parts = currentUrl.split("/");
    const emne_frå = parseInt(parts[parts.indexOf("courses") + 1], 10);
    const seksjon_frå = parseInt(parts[parts.indexOf("sections") + 1], 10);
    const emne_til = Number(
      prompt("Nummer på emnet eg skal kryssliste denne seksjonen til: ")
    );
    const baseurl = "https://hvl.instructure.com";

    let requesturl = `${baseurl}/api/v1/sections/${seksjon_frå}/crosslist/${emne_til}`;
    const inputdata = {};
    let csrf_token = decodeURIComponent(
      document.cookie
        .split(";")
        .find((item) => item.trim().startsWith("_csrf_token"))
        .replace(/\s*_csrf_token\s*\=\s*(.*)$/, "$1")
    );
    console.log("Krysslisting: " + csrf_token);
    let hode = {
      "Content-Type": "application/json",
      "x-csrf-token": csrf_token,
    };

    fetch(requesturl, {
      method: "POST",
      headers: hode,
      body: JSON.stringify(inputdata),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        for (const key in response) {
          console.log(key, response[key]);
        }
        console.log("Resultat av krysslisting: " + JSON.stringify(data));
        let requesturl = `${baseurl}/api/v1/courses/${emne_frå}?include[]=syllabus_body`;

        fetch(requesturl, {
          method: "GET",
          headers: hode,
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            const htmlString = data.syllabus_body;
            console.log(
              "Resultat av å lese heimesida: " + JSON.stringify(data)
            );
            const tempElement = document.createElement("p");
            tempElement.innerHTML = htmlString;
            const tekst_no = tempElement.textContent.trim();
            const innhald_heimeside = `<p>${tekst_no}</p><p>Emnet er krysslista til <a href="/courses/${emne_til}" target="_blank" rel="noopener">https://hvl.instructure.com/courses/${emne_til}</a></p> <p>akv, ${yymmdd}</p>`;
            let requesturl = `${baseurl}/api/v1/courses/${emne_frå}`;
            const parametre2 = {
              "course[default_view]": "syllabus",
              "course[syllabus_body]": innhald_heimeside,
              "course[syllabus_course_summary]": false,
            };
            console.log(
              "Skriv dette til syllabus_body: " +
                requesturl +
                " med parametre " +
                JSON.stringify(parametre2)
            );
            const hode = {
                "Content-Type": "application/json",
                "x-csrf-token": csrf_token,
            };

            fetch(requesturl, {
              method: "PUT",
              headers: hode,
              body: JSON.stringify(parametre2),
            })
              .then(response => {
                if (!response.ok) {
                  throw new Error(`HTTP error! Status: ${response.status}`);
                }
                for (const key in response) {
                    console.log(key, response[key]);
                }
                return response.json();
              })
              .then(data => {
                console.log(
                  "Resultat av å skrive til heimesida: " + JSON.stringify(data)
                );
              })
              .catch(error => {
                console.error("Feil ved å skrive til heimesida", error);
              });
          })
          .catch(error => {
            console.error("Feil ved å lese heimesida: ", error);
          });
      })
      .catch(error => {
        console.error("Feil ved krysslistinga: ", error);
      });
  });

  // Get the container element where you want to add the button
  var container = document.getElementById("right-side");
  console.log(container);

  // Append the button to the container
  container.appendChild(button);
})();
