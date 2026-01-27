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
    };
  },
  methods: {
    //sheet computational methods
    clearData() {
      localStorage.removeItem(this.responseKey);
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
      console.log(this.weeks);
      this.DataStorage(this.response, this.responseKey, "set");
    },
    async refresh() {
      const response = await sheet.getWeeks();
      const newLinks = response.fontPreconnectLinks.map(
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
          link.href = href;
          document.head.appendChild(link);
        }
      });
      return response;
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
    //site utiliy methods
  },
  async mounted() {
    const cacheData = this.DataStorage(null, this.responseKey, "get");
    if (!cacheData) {
      this.response = await this.refresh();
      this.DataStorage(this.response, this.responseKey, "set");
    } else this.response = cacheData;
    this.weeks = this.response.weeks;
    this.loadCycle = setInterval(this.loadCycleFunc, this.timeLoad);
    this.trackReload(this.loadCycleFunc);
    //ok. Comments time: The system loads the sheet first, and caches it. If there is already cached data, it loads that instead of the sheet. Then, it creates a timer to pull the data every 5 minutes, and then makes a custom reload function which also pulls the data, but with a 10 second cooldown to prevent spamming.
  },
  computed: {
    days() {
      if (!this.weeks[this.index]) return [];
      return this.weeks[this.index][1].days;
    },
    longTerm() {
      if (!this.weeks[this.index]) return [];
      return this.weeks[this.index][1].longTerm;
    },
  },
}).mount("#vueApp");

//Nicks stuff
let mybutton = document.getElementById("topBtn");
window.onscroll = function () {
  scrollFunction();
};
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
