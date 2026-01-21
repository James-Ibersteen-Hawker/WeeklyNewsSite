"use strict";
const sheet = {
  weekStart: 0,
  ENDPOINT:
    "https://script.google.com/macros/s/AKfycby8rg83ZMgLbj94vJBPpc2YrB5CYSpSxmdBruP1BbmtKyusm11uNBKObMTEU3TcSEaR/exec",
  weeks: new Map(),
  Week: class {
    constructor(events, weekstart) {
      this.start = weekstart;
      this.events = events
        .map((e) => {
          const obj = JSON.parse(e);
          return { ...obj, Date: new Date(obj.Date) };
        })
        .sort((a, b) => a.Date - b.Date);
      this.Day = class {
        constructor(date, events) {
          this.events = events;
          this.date = date;
        }
      };
      this.days = this.buildDays();
      this.longTerm = this.buildLongTerm();
      this.trueEvents = this.unique(this.events);
    }
    buildDays() {
      const dayMap = new Map();
      const filter = this.start === 0 ? [0, 6] : [5, 6];
      this.events.forEach((e) => {
        if (e.eventLength >= 5) return;
        const thisDay = (e.Date.getUTCDay() - this.start + 7) % 7;
        if (filter.includes(thisDay)) return;
        const eDate = e.Date.toISOString().slice(0, 10);
        (dayMap.get(eDate) || dayMap.set(eDate, []).get(eDate)).push(e);
      });
      return new Map([...dayMap].map(([k, v]) => new this.Day(k, v)));
    }
    buildLongTerm() {
      const longTermEvents = this.events.filter((e) => e.eventLength >= 5);
      return this.unique(longTermEvents);
    }
    unique(events) {
      const IDs = new Set();
      return events.filter((e) => {
        if (!IDs.has(e.ID)) return (IDs.add(e.ID), true);
      });
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
    const events = result.rows.flatMap((e, i) => {
      const IDDate = this.normalize(e.Date);
      const IDText = this.normalize(e.Name);
      const IDMT = this.normalize(e.METATEXT);
      const ID = `D:${IDDate}-T:${IDText}-MT:${IDMT}-i:${i}`;
      if (!e.DateEnd || e.DateEnd === e.Date) {
        e.Date = this.parseDate(e.Date);
        return { ...e, filler: false, eventLength: 1, ID: ID };
      }
      const daySize = 24 * 60 * 60 * 1000;
      const [date, dateEnd] = [e.Date, e.DateEnd].map((d) => this.parseDate(d));
      const difference = Math.ceil((dateEnd - date) / daySize) + 1;
      return Array.from({ length: difference }, (_, a) => ({
        ...e,
        Date: new Date(date.getTime() + daySize * a),
        eventLength: difference,
        ID: ID,
        fillter: a !== 0,
      }));
    });
    events.forEach((e) => {
      const week = this.weekFromDate(e.Date, this.weekStart);
      e.Date = e.Date.getTime();
      const JSONthis = JSON.stringify(e);
      if (!this.weeks.get(week)) this.weeks.set(week, new Set());
      this.weeks.get(week).add(JSONthis);
    });
    const weeks = [...this.weeks].map(([k, v]) => {
      return [k, new this.Week([...v], this.weekStart)];
    });
    console.log(weeks);
    const Package = {
      fontPreconnectLinks: result.fontPreconnectLinks,
      data: weeks,
    };
    return Package;
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
  normalize(str = "") {
    return str.trim().toLowerCase().replace(/\s+/g, " ");
  },
};
document.querySelector("#sheetFetch").onclick = sheet.getWeeks.bind(sheet);
