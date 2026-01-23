"use strict";
const timeLoad = 300000;
async function refresh() {
  const response = await sheet.getWeeks();
  const newLinks = response.fontPreconnectLinks.map(
    (e) => new URL(e.trim(), document.baseURI).href,
  );
  const links = new Set(
    Array.from(document.head.querySelectorAll('link[rel="preconnect"]')).map(
      (e) => e.href,
    ),
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
}
function Data(obj, key, setGet) {
  if (setGet === "set") localStorage.setItem(key, JSON.stringify(obj));
  else if (setGet === "get") {
    const response = localStorage.getItem(key);
    if (response) return JSON.parse(response);
    else return false;
  }
}
const vueApp = Vue.createApp({
  async created() {
    if (!Data(null, "response", "get")) {
      this.response = await refresh();
      this.weeks = this.response.weeks;
      Data(this.response, "response", "set");
    }
    this.loadCycle = setInterval(async () => {
      this.response = await refresh();
      this.weeks = this.response.weeks;
      Data(this.response, "response", "set");
    }, timeLoad);
  },
  data() {
    return {};
  },
  methods: {
    clearData() {
      console.log(Data(null, "response", "get"));
      localStorage.clear();
    },
  },
  computed: {},
}).mount("#vueApp");
