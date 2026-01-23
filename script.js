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
  console.log(newLinks);
  return response;
}
const vueApp = Vue.createApp({
  async created() {
    this.response = await refresh();
    this.weeks = this.response.weeks;
    this.loadCycle = setInterval(async () => {
      this.response = await refresh();
      this.weeks = this.response.weeks;
    }, timeLoad);
  },
  data() {
    return {};
  },
  methods: {},
  computed: {},
}).mount("#vueApp");
