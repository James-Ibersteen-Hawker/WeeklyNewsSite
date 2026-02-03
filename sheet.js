"use strict";
const sheet = {
  weekStart: 1,
  DAYSIZE: 24 * 60 * 60 * 1000,
  ENDPOINT:
    "https://script.google.com/macros/s/AKfycby8rg83ZMgLbj94vJBPpc2YrB5CYSpSxmdBruP1BbmtKyusm11uNBKObMTEU3TcSEaR/exec",
  normalize: (str = "") => str.trim().toLowerCase().replace(/\s+/g, " "),
  Week: class {
    constructor(events, weekstart, dayLength) {
      this.start = weekstart;
      this.dayLength = dayLength;
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
      const daysInWeek = new Map();
      const filter = this.start === 0 ? [0, 6] : [5, 6];
      this.events.forEach((e) => {
        if (e.eventLength >= 5) return;
        const thisDay = (e.Date.getUTCDay() - this.start + 7) % 7;
        if (filter.includes(thisDay)) return;
        const eDate = e.Date.toISOString().slice(0, 10);
        if (!daysInWeek.has(eDate))
          daysInWeek.set(eDate, new this.Day(eDate, []));
        daysInWeek.get(eDate).events.push(e);
      });
      const start = daysInWeek.keys()?.next()?.value ?? this.events[0].Date;
      const monday = this.getMonday(new Date(start), this.start);
      return Array.from({ length: 5 }, (_, i) => {
        const d = new Date(monday);
        d.setUTCDate(monday.getUTCDate() + i);
        const key = d.toISOString().slice(0, 10);
        return [key, daysInWeek.get(key) ?? new this.Day(key, [])];
      });
    }
    buildLongTerm() {
      const longTermEvents = this.events.filter((e) => e.eventLength >= 5);
      return this.unique(longTermEvents);
    }
    unique(events) {
      const IDs = new Set();
      return events.filter((e) => !IDs.has(e.ID) && IDs.add(e.ID));
    }
    getMonday(date, weekStart) {
      const d = new Date(date);
      const day = d.getUTCDay();
      const diff = -((day - weekStart + 7) % 7);
      d.setUTCDate(d.getUTCDate() + diff);
      return d;
    }
  },
  async load(signal) {
    try {
      const result = await fetch(this.ENDPOINT, { signal });
      return await result.json();
    } catch (error) {
      if (error.name === "AbortError") throw error;
      throw new Error("Fetch failure");
    }
  },
  async getWeeks(signal) {
    const result = await this.load(signal);
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
      .map(([k, v]) => [k, new Week([...v], weekStart, this.DAYSIZE)])
      .sort(([kA], [kB]) => {
        const convert = (wk) => gWkSD(...wk.split("-W").map(Number), weekStart);
        return convert(kA) - convert(kB);
      })
      .filter(([_, week]) => {
        const hasDays = week.days.some(([_, { events }]) => events.length > 0);
        const hasTrueEvent = week.trueEvents.some(({ filler }) => !filler);
        return hasDays || hasTrueEvent;
      });
    console.log(Package);
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
