"use strict";
const sheet = {
  ENDPOINT:
    "https://script.google.com/macros/s/AKfycby8rg83ZMgLbj94vJBPpc2YrB5CYSpSxmdBruP1BbmtKyusm11uNBKObMTEU3TcSEaR/exec",
  async load() {
    const result = await fetch(this.ENDPOINT);
    return await result.json();
  },
  async weeks() {
    const result = await this.load();
    result.rows.forEach((e) => {
      const date = e.Date.split("/");
      const week = this.weekFromDate(date);
      alert([date, week]);
    });
  },
  weekFromDate([mth, dy, yr], weekStart = 1) {
    const sD = new Date(`${yr}-${mth}-${dy}`);
    const d = new Date(
      Date.UTC(sD.getUTCFullYear(), sD.getUTCMonth(), sD.getUTCDate()),
    );
    const dayOfWeek = d.getUTCDay();
    const normalizedDay = (dayOfWeek - weekStart + 7) % 7;
    const startOfYear = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const dayOfYear = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
    const weekNumber = Math.ceil((dayOfYear - normalizedDay) / 7) + 1;
    return weekNumber;
  },
};
document.querySelector("#sheetFetch").onclick = sheet.weeks.bind(sheet);
