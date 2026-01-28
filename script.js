"use strict";
const vueApp = Vue.createApp({
  data() {
    return {
      index: 1,
      timeLoad: 300000,
      responseKey: "response",
      refreshTimeout: 10000,
      refreshAble: true,
      weeks: [],
      response: {},
      DefaultHSize: "20px",
      DefaultBSize: "18px",
      DefaultHFont: "'Times New Roman', serif",
      DefaultBFont: "'Arial', sans-serif",
      DefaultBG: "#FFFFFF",
      currentWeek: null,
    };
  },
  methods: {
    async clearData() {
      localStorage.removeItem(this.responseKey);
      if (this.refreshAble === true) {
        this.refreshAble = false;
        await this.loadCycleFunc();
        setTimeout(() => (this.refreshAble = true), this.refreshTimeout);
      }
    },
    DataStorage(obj, key, setGet) {
      if (setGet === "set") localStorage.setItem(key, JSON.stringify(obj));
      else if (setGet === "get") {
        const response = localStorage.getItem(key);
        if (response) return JSON.parse(response);
        else return false;
      }
    },
    async loadCycleFunc() {
      this.response = await this.refresh();
      this.weeks = this.response.weeks;
      this.DataStorage(this.response, this.responseKey, "set");
    },
    async refresh() {
      const response = await sheet.getWeeks();
      this.makeLinks(response.fontPreconnectLinks);
      return response;
    },
    makeLinks(linksParam) {
      const urls = linksParam.map((link) => {
        const match = link.match(/href="([^"]+)"/); // regex to grab the href value
        return match ? match[1] : null; // return the URL or null if not found
      });
      const newLinks = urls.map(
        (e) => new URL(e.trim(), document.baseURI).href,
      );
      const links = new Set(
        Array.from(
          document.head.querySelectorAll('link[rel="preconnect"]'),
        ).map((e) => e.href),
      );
      newLinks.forEach((href) => {
        if (!links.has(href)) {
          links.add(href);
          const link = document.createElement("link");
          link.rel = "preconnect";
          if (href.includes("css2")) link.rel = "stylesheet";
          if (href.includes("gstatic")) link.crossOrigin = "anonymous";
          link.href = href;
          document.head.appendChild(link);
        }
      });
    },
    trackReload(callback) {
      const keys = new Set();
      const keyMap = new Map();
      keyMap.set("control+r", callback);
      // keyMap.set("control+shift+r", callback);
      keyMap.set("meta+r", callback);
      // keyMap.set("meta+shift+r", callback);
      window.addEventListener("keydown", (e) => {
        e.preventDefault();
        if (e.repeat) return;
        keys.add(e.key.toLowerCase());
        const combo = [...keys].join("+");
        const func = keyMap.get(combo);
        if (func && this.refreshAble) {
          console.log("reloaded", `timeout = ${this.refreshAble}`);
          func();
          this.refreshAble = false;
          setTimeout(
            (() => (this.refreshAble = true)).bind(this),
            this.refreshTimeout,
          );
        }
      });
      window.addEventListener("keyup", (e) => {
        keys.delete(e.key.toLowerCase());
      });
    },
    findDayNow() {
      const today = new Date().toISOString().slice(0, 10);
      const nowWeek = this.weeks[this.index];
      let currentDay = nowWeek[1].days.findIndex(([date]) => date === today);
      if (currentDay === -1) currentDay = 0;
      const midDist = 2 - currentDay;
      const temp = nowWeek[1].days.slice(-midDist);
      if (midDist > 0) {
        this.currentWeek = [
          nowWeek[0],
          { days: [...temp, ...nowWeek[1].days.slice(0, 5 - midDist)] },
        ];
      } else if (midDist < 0) {
        this.currentWeek = [
          nowWeek[0],
          { days: [...nowWeek[1].days.slice(midDist, 6), ...temp] },
        ];
      } else if (midDist === 0) this.currentWeek = nowWeek;
    },
    ISOtoDate(ISO) {
      const [yy, mm, dd] = ISO.slice(0, 10).split("-");
      return `${Number(mm)}/${Number(dd)}/${Number(yy)}`;
    },
    createBG(BG) {
      if (BG.includes("http")) return `url(${BG})`;
      else if (BG) return BG;
      else return tis.DefaultBG;
    },
    setWeek(i) {
      this.index = i;
      this.findDayNow();
    },
    long() {
      document.querySelector(".shortTerm").classList.add("d-none");
      document.querySelector(".longTerm").classList.remove("d-none");
    },
    short() {
      document.querySelector(".longTerm").classList.add("d-none");
      document.querySelector(".shortTerm").classList.remove("d-none");
    },
    scrollTo(name, i) {
      const identifier = `q-${name.split(" ").join("-")}${i}`;
      const destination = document.querySelector(`#${identifier}`);
      const navBar = document.querySelector("#longHeadings");
      const elemDown = destination.getBoundingClientRect().top;
      const pageDown = document.body.getBoundingClientRect().top;
      const total = elemDown - pageDown - navBar.offsetHeight;
      window.scrollTo({
        top: Math.floor(total),
        left: 0,
        behavior: "smooth",
      });
    },
  },
  async mounted() {
    localStorage.clear();
    const cacheData = this.DataStorage(null, this.responseKey, "get");
    if (!cacheData) {
      this.response = await this.refresh();
      this.DataStorage(this.response, this.responseKey, "set");
    } else this.response = cacheData;
    this.weeks = this.response.weeks;
    this.loadCycle = setInterval(this.loadCycleFunc, this.timeLoad);
    // this.trackReload(() => this.loadCycleFunc());
    this.$nextTick(() => {
      if (window.makeCarousel) window.makeCarousel();
      else throw new Error("makeCarousel is not defined");
    });
    this.makeLinks(this.response.fontPreconnectLinks);
    console.log(this.response);
    this.setWeek(4);
    alert("loaded")
    hideloadingscreen();
    //ok. Comments time: The system loads the sheet first, and caches it. If there is already cached data, it loads that instead of the sheet. Then, it creates a timer to pull the data every 5 minutes, and then makes a custom reload function which also pulls the data, but with a 10 second cooldown to prevent spamming.
  },
  computed: {
    days() {
      try {
        if (!this.currentWeek?.[1]?.days) return [];
        return this.currentWeek[1].days;
      } catch (error) {
        alert(error);
      }
    },
    longTerm() {
      if (!this.weeks[this.index]) return [];
      return this.weeks[this.index][1].longTerm;
    },
    timeMachine() {
      if (!this.weeks) return [];
      else return this.weeks.map(([_, { days }]) => days[0][0]);
    },
    dayNow() {
      return new Date().toISOString().slice(0, 10);
    },
  },
}).mount("#vueApp");

//Nicks stuff
let mybutton = document.getElementById("topBtn");
window.onscroll = scrollFunction;
function scrollFunction() {
  if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}
function topFunction() {
  document.documentElement.scrollTop = 0;
}
function hideloadingscreen() {
  document.querySelector('#loadingscreen').classList.add('hiding')
  setTimeout(() => document.querySelector('#loadingscreen').classList.add("d-none"), 5000)
}