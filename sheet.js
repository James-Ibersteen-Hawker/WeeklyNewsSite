"use strict";
const ENDPOINT =
  "https://script.google.com/macros/s/AKfycby8rg83ZMgLbj94vJBPpc2YrB5CYSpSxmdBruP1BbmtKyusm11uNBKObMTEU3TcSEaR/exec";

async function LOAD(url) {}
function getScriptURL(options = null) {
  if (options) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options)) {
      if (typeof value === "object" && value !== null)
        params.set(key, JSON.stringify(value));
      else params.set(key, value);
    }
    return `${ENDPOINT}?${params.toString()}`;
  } else return ENDPOINT;
}

async function loadData() {
  const elem = document.querySelector("#output");
  elem.setAttribute("style", "background-color: rgb(255,0,0);");
  const img = document.querySelector("#imgOutput");
  elem.textContent = "output loading";
  img.src = "";
  try {
    const response = await fetch(ENDPOINT);
    const data = await response.json();
    elem.textContent = JSON.stringify(data);
    const makeBG = (BG) => {
      if (BG.includes("http")) return `url(${BG})`;
      else return BG || "rgb(0,255,0)";
    };
    convertToEvents(data.rows);
  } catch (err) {
    elem.textContent = `Error: ${err}`;
  }
}
function convertToEvents(eventArr) {
  class Week {
    constructor(id, events) {
      this.ID = id;
      this.events = events;
      this.days = new Array(5).fill(null);
      this.init();
    }
    init() {
      console.log(this.events);
    }
  }
  eventArr.sort((a, b) => {
    const [aMn, aDay, aYr] = a.Date.split("/").map(Number);
    const [bMn, bDay, bYr] = b.Date.split("/").map(Number);
    return aYr - bYr || aMn - bMn || aDay - bDay;
  });
  const weeksList = [];
  eventArr.forEach((e) => {
    const [Mn, Day, Yr] = e.Date.split("/").map(Number);
    const date = new Date(Yr, Mn - 1, Day);
    console.log(getWeekOfMonth(date), `${Yr}-${Mn}-${Day}`);
  });
}
function getWeekOfMonth(date) {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayWeekDay = firstDayOfMonth.getDay();
  const dayOfMonth = date.getDate();
  return Math.ceil((dayOfMonth + firstDayWeekDay) / 7);
}
