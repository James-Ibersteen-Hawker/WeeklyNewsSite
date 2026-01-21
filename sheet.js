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
          obj.Date = new Date(obj.Date);
          return obj;
        })
        .sort((a, b) => a.Date - b.Date);
      this.trueEvents = this.events.filter((e) => !e.filler);
      this.Day = class {
        constructor(date, events) {
          this.events = events;
          this.date = date;
        }
      };
      this.days = this.buildDays();
      this.longTerm = this.buildLongTerm();
    }
    buildDays() {
      const dayMap = new Map();
      const filter = this.start === 0 ? [0, 6] : [5, 6];
      this.events.forEach((e) => {
        const date = e.Date;
        const [y, m, d] = [
          date.getUTCFullYear(),
          date.getUTCMonth() + 1,
          date.getUTCDate(),
        ];
        const thisDay = (date.getUTCDay() - this.start + 7) % 7;
        if (filter.includes(thisDay)) return;
        const eDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (!dayMap.has(eDate)) dayMap.set(eDate, []);
        dayMap.get(eDate).push(e);
      });
      return new Map(
        [...dayMap].map(([key, value]) => [key, new this.Day(key, value)]),
      );
    }
    buildLongTerm() {
      const longTermEvents = this.events.filter((e) => e.eventLength >= 5);
      const longSet = new Set();
      longTermEvents.forEach((e) => {
        const date = e.Date;
        const clone = JSON.parse(JSON.stringify(e));
        clone.Date = new Date(date);
        const jsonThis = JSON.stringify(clone);
        if (!longSet.has(jsonThis)) longSet.add(jsonThis);
      });
      return [...longSet].map((e) => {
        const result = JSON.parse(e);
        result.Date = new Date(result.Date);
        return result;
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
        const newFiller = JSON.parse(JSON.stringify(e));
        newFiller.Date = new Date(date.getTime() + daySize * i);
        newFiller.eventLength = difference;
        if (i === 0) {
          newFiller.filler = false;
          return newFiller;
        }
        newFiller.filler = true;
        return newFiller;
      });
    });
    events.forEach((e) => {
      const week = this.weekFromDate(e.Date, this.weekStart);
      e.Date = e.Date.getTime();
      const JSONthis = JSON.stringify(e);
      if (!this.weeks.get(week)) this.weeks.set(week, new Set());
      this.weeks.get(week).add(JSONthis);
    });
    const weeks = [...this.weeks]
      .map(([key, value]) => {
        return [key, new this.Week([...value], this.weekStart)];
      })
      .sort(([kA], [kB]) => {
        const week1 = kA.split("-W").map(Number);
        const week1Date = this.getWeekStartDate(
          week1[0],
          week1[1],
          this.weekStart,
        );
        const week2 = kB.split("-W").map(Number);
        const week2Date = this.getWeekStartDate(
          week2[0],
          week2[1],
          this.weekStart,
        );
        return week2Date - week1Date;
      });
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
  getWeekStartDate(yr, weekNum, start) {
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
document.querySelector("#sheetFetch").onclick = sheet.getWeeks.bind(sheet);
