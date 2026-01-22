"use strict";
// const timeLoad = 300000;
const timeLoad = 5000;
async function refresh() {
  const response = await sheet.getWeeks();
  const fontPreconnectLinks = response.fontPreconnectLinks.map((e) => e.trim());
  const head = document.head.querySelectorAll("link").map((e) => e.outerHTML);
  const links = fontPreconnectLinks.filter((link) => !head.includes(link));
  document.head.insertAdjacentHTML("beforeend", links.join(""));
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
  data() {},
  methods: {},
  computed: {},
}).mount("#vueApp");
