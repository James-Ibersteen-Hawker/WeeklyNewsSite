"use strict";
const sheet = {
  ENDPOINT:
    "https://script.google.com/macros/s/AKfycby8rg83ZMgLbj94vJBPpc2YrB5CYSpSxmdBruP1BbmtKyusm11uNBKObMTEU3TcSEaR/exec",
  weeks: new Map(),
  Week: class {
    constructor(events) {
      this.events = events
        .map((e) => {
          const obj = JSON.parse(e);
          obj.Date = new Date(obj.Date);
          return obj;
        })
        .sort((a, b) => a.Date - b.Date);
    }
  },
  async load() {
    this.weeks.clear();
    const result = await fetch(this.ENDPOINT);
    return await result.json();
  },
  async getWeeks() {
    let result = null;
    try {
      result = await this.load();
    } catch (error) {
      alert(error);
    }
    const events = result.rows.flatMap((e) => {
      if (!e.DateEnd) {
        e.Date = this.parseDate(e.Date);
        e.filler = false;
        e.eventLength = 1;
        return e;
      }
      const daySize = 24 * 60 * 60 * 1000;
      const [date, dateEnd] = [e.Date, e.DateEnd].map((d) => this.parseDate(d));
      const difference = Math.ceil((dateEnd - date) / daySize);
      return Array.from({ length: difference }, (_, i) => {
        const newFiller = structuredClone(e);
        newFiller.Date = new Date(date.getTime() + daySize * i);
        if (i === 0) {
          newFiller.filler = false;
          newFiller.eventLength = difference;
          return newFiller;
        }
        newFiller.filler = true;
        newFiller.eventLength = 1;
        return newFiller;
      });
    });
    events.forEach((e) => {
      const week = this.weekFromDate(e.Date);
      e.Date = e.Date.getTime();
      const JSONthis = JSON.stringify(e);
      if (!this.weeks.get(week)) this.weeks.set(week, new Set());
      this.weeks.get(week).add(JSONthis);
    });
    const weeks = [...this.weeks].map(([key, value]) => {
      return [key, new this.Week([...value])];
    });
    console.log(weeks);
    return weeks;
  },
  weekFromDate(date, weekStart = 1) {
    const sD = new Date(date);
    const d = new Date(
      Date.UTC(sD.getUTCFullYear(), sD.getUTCMonth(), sD.getUTCDate()),
    );
    const dayOfWeek = d.getUTCDay();
    const normalizedDay = (dayOfWeek - weekStart + 7) % 7;
    const startOfYear = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const dayOfYear = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
    const weekNumber = Math.ceil((dayOfYear - normalizedDay) / 7) + 1;
    const weekKey = `${date.getUTCFullYear()}-W${weekNumber}`;
    return weekKey;
  },
  parseDate(date) {
    const [m, d, y] = date.split("/").map(Number);
    return new Date(y, m - 1, d);
  },
};
document.querySelector("#sheetFetch").onclick = sheet.getWeeks.bind(sheet);
