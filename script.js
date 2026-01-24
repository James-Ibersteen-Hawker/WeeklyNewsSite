"use strict";
const vueApp = Vue.createApp({
  async created() {
    const cacheData = this.DataStorage(null, this.responseKey, "get");
    if (!cacheData) {
      this.response = await this.refresh();
      this.DataStorage(this.response, this.responseKey, "set");
    } else this.response = cacheData;
    this.weeks = this.response.weeks;
    this.loadCycle = setInterval(this.loadCycleFunc, this.timeLoad);
    this.trackReload(this.refresh);
  },
  data() {
    return {
      index: 0,
      timeLoad: 300000,
      responseKey: "response",
    };
  },
  methods: {
    clearData() {
      console.log(this.Data(null, "response", "get"));
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
      keyMap.set("control+shift+r", callback);
      keyMap.set("meta+r", callback);
      keyMap.set("meta+shift+r", callback);
      window.addEventListener("keydown", (e) => {
        if (e.repeat) return;
        keys.add(e.key.toLowerCase());
        const combo = [...keys].join("+");
        const func = keyMap.get(combo);
        if (func) (e.preventDefault(), func());
      });
      window.addEventListener("keyup", (e) => {
        keys.delete(e.key.toLowerCase());
      });
    },
  },
  computed: {},
}).mount("#vueApp");
