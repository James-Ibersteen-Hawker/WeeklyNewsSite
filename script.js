"use strict";
const EventBox = {
  props: {
    event: {
      type: Object,
      required: true,
    },
    id: {
      type: String,
      default: "",
    },
    longTerm: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      dBG: "#fff",
      dHSize: "20px",
      dHFont: "'Times New Roman', serif",
      dBSize: "18px",
      dBFont: "'Arial', sans-serif",
    };
  },
  methods: {
    ISOtoDate(ISO) {
      const myISO = new Date(ISO).toISOString();
      const [yy, mm, dd] = myISO.slice(0, 10).split("-");
      return `${Number(mm)}/${Number(dd)}/${Number(yy)}`;
    },
    createBG(BG) {
      if (typeof BG !== "string") return "";
      if (BG.includes("http")) return `url(${BG})`;
      else if (BG) return BG;
      else return this.dBG;
    },
  },
  computed: {
    bgStyle() {
      return { background: this.createBG(this.event.BG) };
    },
    headingStyle() {
      return {
        fontSize: this.event.HeadingSize || this.dHSize,
        fontFamily: this.event.NameFont || this.dHFont,
      };
    },
    bodyStyle() {
      return {
        fontSize: this.event.BodySize || this.dBSize,
        fontFamily: this.event.TextFont || this.dBFont,
      };
    },
  },
  template: `<div class="event" :style="bgStyle" :id="id">
            <div class="date" v-if="longTerm">{{ISOtoDate(event.Date)}} - {{event.DateEnd}}</div>
              <h1 v-if="event.Name" class="eName" :style="headingStyle">
                {{event.Name}}
              </h1>
              <p v-if="event.Text" class="eBody" :style="bodyStyle">
                {{event.Text}}
              </p>
              <p class="metaText d-none" v-if="event.METATEXT">
                {{event.METATEXT}}
              </p>
            </div>`,
};
const navBar = {
  props: {
    name: { type: String, default: "", required: true },
    customClasses: { type: Array, default: () => [] },
    headings: { type: Array, default: () => [], required: true },
    for: { type: String, required: true },
    fixedHeight: { type: String, default: 0 },
  },
  data() {
    return { position: "relative", top: "0" };
  },
  methods: {
    scrollTo(name, i) {
      const identifier = this.idSyntax(name, i);
      const destination = document.querySelector(`#${identifier}`);
      const elemDown = destination.getBoundingClientRect().top;
      const pageDown = document.body.getBoundingClientRect().top;
      const total = elemDown - pageDown - 35;
      window.scrollTo({
        top: Math.floor(total),
        left: 0,
        behavior: "smooth",
      });
    },
    idSyntax(id, i = 0) {
      return `q-${id.split(" ").join("-")}${i}`;
    },
    toFix() {
      if (this.for !== "events") return;
      const split = document.querySelector("#split");
      if (split.getBoundingClientRect().top <= Number(this.fixedHeight)) {
        this.position = "fixed";
        this.top = `${this.fixedHeight}px`;
        split.setAttribute(
          "style",
          `margin-bottom: ${this.$el.offsetHeight}px`,
        );
      } else {
        this.position = "relative";
        this.top = "0";
        split.setAttribute("style", `margin-bottom: 0px`);
      }
    },
  },
  computed: {
    navName() {
      return `nav${this.name}`;
    },
    positionStyle() {
      if (this.for !== "events") return;
      return { position: this.position, top: this.top };
    },
  },
  mounted() {
    window.addEventListener("scroll", this.toFix)
    this.$nextTick(() => {
      const navBarCollapse = this.$el.querySelector(
        ".collapse.navbar-collapse",
      );
      const links = Array.from(this.$el.querySelectorAll(".nav-link"));
      links.forEach((link) => {
        link.addEventListener("click", () => {
          const bsCollapse =
            bootstrap.Collapse.getOrCreateInstance(navBarCollapse);
          bsCollapse.hide();
        });
      });
    });
  },
  template: `<nav class="navbar navbar-expand-lg" :class="customClasses" :style="positionStyle">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">Navbar</a>
          <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            :data-bs-target="'#' + navName"
            :aria-controls="navName"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" :id="navName">
            <div class="navbar-nav">
              <a
                class="nav-link"
                aria-current="page"
                v-for="(heading, i) in headings"
                @click="scrollTo(heading, i)"
                >{{heading}}</a
              >
            </div>
          </div>
        </div>
      </nav>`,
};
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
      const myISO = new Date(ISO).toISOString();
      const [yy, mm, dd] = myISO.slice(0, 10).split("-");
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
    idSyntax(id, i = 0) {
      return `q-${id.split(" ").join("-")}${i}`;
    },
    scrollTop() {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    },
  },
  async mounted() {
    const cacheData = this.DataStorage(null, this.responseKey, "get");
    if (!cacheData) {
      this.response = await this.refresh();
      this.DataStorage(this.response, this.responseKey, "set");
    } else this.response = cacheData;
    this.weeks = this.response.weeks;
    this.loadCycle = setInterval(this.loadCycleFunc, this.timeLoad);
    this.$nextTick(() => {
      if (window.makeCarousel) window.makeCarousel();
      else throw new Error("makeCarousel is not defined");
    });
    this.makeLinks(this.response.fontPreconnectLinks);
    console.log(this.response);
    this.setWeek(4);
    hideloadingscreen();
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
  components: {
    EventBox,
    navBar,
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