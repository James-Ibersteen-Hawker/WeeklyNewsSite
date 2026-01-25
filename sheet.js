"use strict";
const sheet = {
  weekStart: 0,
  DAYSIZE: 24 * 60 * 60 * 1000,
  ENDPOINT:
    "https://script.google.com/macros/s/AKfycby8rg83ZMgLbj94vJBPpc2YrB5CYSpSxmdBruP1BbmtKyusm11uNBKObMTEU3TcSEaR/exec",
  normalize: (str = "") => str.trim().toLowerCase().replace(/\s+/g, " "),
  Week: class {
    constructor(events, weekstart) {
      this.start = weekstart;
      this.events = events
        .map((e) => ({ ...e, Date: new Date(e.Date) }))
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
      return [...dayMap].map(([k, v]) => [k, new this.Day(k, v)]);
    }
    buildLongTerm() {
      const longTermEvents = this.events.filter((e) => e.eventLength >= 5);
      return this.unique(longTermEvents);
    }
    unique(events) {
      const IDs = new Set();
      return events.filter((e) =>
        !IDs.has(e.ID) ? (IDs.add(e.ID), true) : false,
      );
    }
  },
  async load() {
    const result = await fetch(this.ENDPOINT);
    return await result.json();
  },
  async getWeeks() {
    let result = null;
    try {
      result = await this.load();
    } catch (error) {
      return new Error("failed to fetch");
    }
    const Package = {
      fontPreconnectLinks: result.fontPreconnectLinks,
      weeks: new Map(),
    };
    result.rows = result.rows.filter((e) => Boolean(e.Date));
    const {
      normalize: norm,
      parseDate,
      DAYSIZE,
      weekFromDate,
      Week,
      weekStart,
      gWkSD,
    } = this;
    const events = result.rows.flatMap((e, i) => {
      const ID = `D:${norm(e.Date)}-T:${norm(e.Name)}-MT:${norm(e.METATEXT)}-i:${i}`;
      const start = parseDate(e.Date);
      const startTime = start.getTime();
      const end = e.DateEnd ? parseDate(e.DateEnd) : start;
      const diff = end <= start ? 1 : Math.ceil((end - start) / DAYSIZE) + 1;
      return Array.from({ length: diff }, (_, a) => ({
        ...e,
        Date: new Date(startTime + DAYSIZE * a),
        eventLength: diff,
        ID,
        filler: a !== 0,
      }));
    });
    events.forEach((e) => {
      const week = weekFromDate(e.Date, weekStart);
      const event = { ...e, Date: e.Date.getTime() };
      if (!Package.weeks.has(week)) Package.weeks.set(week, []);
      Package.weeks.get(week).push(event);
    });
    Package.weeks = [...Package.weeks]
      .map(([k, v]) => [k, new Week([...v], weekStart)])
      .sort(([kA], [kB]) => {
        const convert = (wk) => gWkSD(...wk.split("-W").map(Number), weekStart);
        return convert(kA) - convert(kB);
      });
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
    return `${date.getUTCFullYear()}-W${weekNumber}`;
  },
  parseDate(date) {
    const [m, d, y] = date.split("/").map(Number);
    return new Date(y, m - 1, d);
  },
  gWkSD(yr, weekNum, start) {
    const jan1 = new Date(Date.UTC(yr, 0, 1));
    const jan1Day = jan1.getUTCDay();
    const offset = (jan1Day - start + 7) % 7;
    const week1Start = new Date(jan1);
    week1Start.setUTCDate(jan1.getUTCDate() - offset);
    const result = new Date(week1Start);
    result.setUTCDate(week1Start.getUTCDate() + (weekNum - 1) * 7);
    return result;
  },
};
