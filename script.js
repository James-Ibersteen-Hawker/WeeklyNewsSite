"use strict";
const Carousel = {
  props: {
    images: { type: Array, required: true, default: () => [] },
  },
  computed: {
    colName() {
      return `col-${12 / (this.trueImages.length - 1)}`;
    },
    trueImages() {
      return this.images.filter((e) => e !== "");
    },
  },
  methods: {
    setModal(img) {
      const modal = document.querySelector("#modalTarget");
      modal.src = img;
    },
  },
  template: `
      <div class="imgCarousel row">
        <div class="mainImg col-12" @click="setModal(images[0], 0)" :class="{oneImage: trueImages.length === 1}">
          <img :src="trueImages[0]" class="img-fluid" data-bs-toggle="modal" data-bs-target="#imgModal"/>
        </div>
        <div class="subImg" :class="colName" v-for="(image, i) in trueImages.slice(1)" @click="setModal(image)" data-bs-toggle="modal" data-bs-target="#imgModal">
          <img :src="image" class="img-fluid" v-if="image"/>
        </div>
      </div>`,
};
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
    floatStyle(style) {
      if (["Above", "Below"].includes(style) || !style) return;
      return { float: style.split(" ")?.[1].toLowerCase(), width: "40%" };
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
    images() {
      const { IMAGE1, IMAGE2, IMAGE3, IMAGE4 } = this.event;
      return [IMAGE1, IMAGE2, IMAGE3, IMAGE4];
    },
  },
  components: {
    Carousel,
  },
  template: `<div class="event" :style="bgStyle" :id="id">
            <div class="date" v-if="longTerm">{{ISOtoDate(event.Date)}} - {{event.DateEnd}}</div>
              <h1 v-if="event.Name" class="eName" :style="headingStyle">
                {{event.Name}}
              </h1>
              <carousel 
                v-if="images.length && ['Top Right', 'Top Left', 'Above'].includes(event.ImagePosition)"
                :images="images" 
                :style="floatStyle(event.ImagePosition)">
              </carousel>
              <p v-if="event.Text" class="eBody" :style="bodyStyle">
                {{event.Text}}
              </p>
              <carousel 
                v-if="images.length && ['Bottom Right', 'Bottom Left', 'Below'].includes(event.ImagePosition)"
                :images="images" 
                :style="floatStyle(event.ImagePosition)">
              </carousel>
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
    fixedHeight: { default: 0 },
    functionBindings: { type: Object, required: true },
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
    bindingHas(h) {
      return this.bindings.find((e) => e[0] === h);
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
    bindings() {
      return this.functionBindings;
    },
  },
  mounted() {
    window.addEventListener("scroll", this.toFix);
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
  template: `<nav class="navbar navbar-expand-md" :class="customClasses" :style="positionStyle">
        <div class="container-fluid">
          <a class="navbar-brand" ></a>
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
                :id="heading.split(' ').join('-') + 'nav'"
                >
                <div @click="scrollTo(heading, i)" v-if="!bindings[heading]">{{heading}}</div>
                <div @click="bindings[heading]" v-if="bindings[heading]">{{heading}}</div>
                </a>
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
      returnTimeout: 5,
      weeks: [],
      response: {},
      currentWeek: null,
      resized: false,
      searchString: "",
      searchResults: [],
      fuse: null,
      abortMessage: "",
      searchOptions: {
        keys: ["Date", "DateEnd", "Name", "Text", "METATEXT"],
        ignoreDiacritics: true,
        includeScore: true,
        includeMatches: true,
        minMatchCharLength: 2,
        ignoreLocation: true,
        threshold: 0.5,
      },
    };
  },
  methods: {
    async clearData() {
      if (this.refreshAble === false) return;
      this.refreshAble = false;
      document.querySelector("#Refreshnav").classList.add("disabled");
      const sections = Array.from(document.querySelectorAll("section"));
      const item = localStorage.getItem(this.responseKey);
      try {
        localStorage.removeItem(this.responseKey);
        sections.forEach((e) => e.classList.add("refreshing"));
        await this.loadCycleFunc();
      } catch (error) {
        if (item) localStorage.setItem(this.responseKey, item);
        else localStorage.removeItem(this.responseKey);
        if (error.name === "AbortError") {
          this.abortMessage =
            "Connection timed out. You can try again in 10 seconds.";
        } else this.abortMessage = "Alternative error";
        alert(this.abortMessage);
      } finally {
        this.setWeek(this.index);
        sections.forEach((e) => e.classList.remove("refreshing"));
        setTimeout(() => {
          this.refreshAble = true;
          document.querySelector("#Refreshnav").classList.remove("disabled");
        }, this.refreshTimeout);
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
      const controller = new AbortController();
      const signal = controller.signal;
      const timer = this.withTimeout(this.returnTimeout * 1000, controller);
      try {
        this.response = await this.refresh(signal);
        this.weeks = this.response.weeks;
        this.DataStorage(this.response, this.responseKey, "set");
      } catch (err) {
        if (err.name === "AbortError") throw err;
        throw new Error("Error in loading");
      } finally {
        clearTimeout(timer);
      }
    },
    async refresh(signal) {
      const response = await sheet.getWeeks(signal);
      this.makeLinks(response.fontPreconnectLinks);
      return response;
    },
    withTimeout(ms, controller) {
      return setTimeout(() => controller.abort(), ms);
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
      this.closeTimeMachine();
    },
    getWeek(weekNum) {
      const week = this.weeks.find(([num, _]) => num === weekNum)[1];
      return {
        week,
        index: this.weeks.findIndex(([num, _]) => num === weekNum),
        wNum: weekNum,
        startDate: week.days[0][0],
      };
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
    async UpdateCardsHeight() {
      if (this.resized) return;
      this.resized = true;
      const carouselCards = Array.from(
        document.querySelectorAll(".card-carousel .card"),
      );
      carouselCards.forEach((card) => (card.style.height = "auto"));
      await Promise.all(
        carouselCards.map(async (card) => {
          const imgs = Array.from(card.querySelectorAll("img"));
          await Promise.all(
            imgs.map(async (img) =>
              img.complete
                ? Promise.resolve()
                : new Promise((res) => img.addEventListener("load", res)),
            ),
          );
        }),
      );
      const heights = carouselCards.map((e) => e.scrollHeight + 20);
      heights.sort((a, b) => b - a);
      document.querySelector(".card-carousel").style.height = `${heights[0]}px`;
      carouselCards.forEach((card) => (card.style.height = `${heights[0]}px`));
      this.resized = false;
    },
    openTimeMachine() {
      const offcanvasEl = document.getElementById("timeMachineOff");
      const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
      offcanvas.show();
    },
    closeTimeMachine() {
      const offcanvasEl = document.getElementById("timeMachineOff");
      const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
      offcanvas.hide();
    },
    toggleLongTerm() {
      const dropDown = document.querySelector(
        `#${this.idSyntax("Long Term", 1)}`,
      );
      const bsCollapse = new bootstrap.Collapse(dropDown);
      bsCollapse.toggle();
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
      this.UpdateCardsHeight();
    });
    this.resizeObserver = new ResizeObserver(async () => {
      if (!this.resized) await this.UpdateCardsHeight();
    });
    window.addEventListener("resize", this.UpdateCardsHeight);
    const carouselCards = Array.from(
      document.querySelectorAll(".card-carousel .card"),
    );
    carouselCards.forEach((card) => {
      this.resizeObserver.observe(card);
    });
    console.log(this.response);
    this.makeLinks(this.response.fontPreconnectLinks);
    this.setWeek(this.weeks.length - 1);
    hideloadingscreen();
    this.flattenWeek = this.weeks.flatMap(([wNum, week]) => {
      return week.trueEvents.map((e) => ({
        ...e,
        week: wNum,
      }));
    });
    this.fuse = new Fuse(this.flattenWeek, this.searchOptions);
    this.UpdateCardsHeight();
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
    weekOf() {
      const date = this.timeMachine[this.index];
      if (date) return `Week Of ${this.ISOtoDate(date)}`;
    },
  },
  components: {
    EventBox,
    navBar,
  },
  watch: {
    weeks: {
      handler(newWeeks) {
        this.flattenWeek = newWeeks.flatMap(([wNum, week]) => {
          return week.trueEvents.map((e) => ({
            ...e,
            week: wNum,
          }));
        });
        this.fuse.setCollection(this.flattenWeek);
        if (this.searchString) {
          const result = new Set(
            this.fuse
              .search(this.searchString)
              .map((r) => JSON.stringify(this.getWeek(r.item.week))),
          );
          this.searchResults = [...result].map((r) => JSON.parse(r));
        }
      },
      deep: true,
    },
    searchString: {
      handler(newVal) {
        if (!newVal) this.searchResults = [];
        else if (this.fuse) {
          const result = new Set(
            this.fuse
              .search(this.searchString)
              .map((r) => JSON.stringify(this.getWeek(r.item.week)))
              .sort((a, b) => {
                const { startDate: aST } = JSON.parse(a);
                const { startDate: bST } = JSON.parse(b);
                return new Date(aST) - new Date(bST);
              }),
          );
          this.searchResults = [...result].map((r) => JSON.parse(r));
        }
      },
      deep: true,
    },
    currentWeek: {
      async handler() {
        await this.$nextTick();
        this.UpdateCardsHeight();
      },
      deep: true,
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
  document.querySelector("#loadingscreen").classList.add("hiding");
  setTimeout(
    () => document.querySelector("#loadingscreen").classList.add("d-none"),
    5000,
  );
}
