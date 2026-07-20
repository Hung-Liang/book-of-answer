(() => {
  "use strict";

  // ---- Supported locales: add a new entry here + a matching /locales/<code>.json to add a language ----
  const LOCALES = [
    { code: "zh-TW", label: "中" },
    { code: "en",    label: "EN" },
    { code: "ja",    label: "日" }
  ];
  const STORAGE_KEY = "boa-lang";

  const els = {
    book: document.getElementById("book"),
    bookCover: document.getElementById("bookCover"),
    coverTitle: document.getElementById("coverTitle"),
    coverHint: document.getElementById("coverHint"),
    page: document.getElementById("page"),
    answerText: document.getElementById("answerText"),
    actions: document.getElementById("actions"),
    againBtn: document.getElementById("againBtn"),
    closeBtn: document.getElementById("closeBtn"),
    langBtn: document.getElementById("langBtn"),
    langLabel: document.getElementById("langLabel"),
    installToast: document.getElementById("installToast"),
    installBody: document.getElementById("installBody"),
    installLater: document.getElementById("installLater"),
    installConfirm: document.getElementById("installConfirm"),
  };

  const cache = {};      // locale code -> parsed json
  let localeCode = pickInitialLocale();
  let currentIndex = -1; // index into answers[], kept stable across language switches
  let isOpen = false;

  function pickInitialLocale() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LOCALES.some(l => l.code === saved)) return saved;
    const nav = (navigator.language || "en").toLowerCase();
    if (nav.startsWith("zh")) return "zh-TW";
    if (nav.startsWith("ja")) return "ja";
    return "en";
  }

  function nextLocaleCode(code) {
    const i = LOCALES.findIndex(l => l.code === code);
    return LOCALES[(i + 1) % LOCALES.length].code;
  }

  async function loadLocale(code) {
    if (cache[code]) return cache[code];
    const res = await fetch(`locales/${code}.json`);
    const data = await res.json();
    cache[code] = data;
    return data;
  }

  function renderStaticText(data) {
    document.documentElement.lang = data.meta.lang;
    document.title = `${data.meta.name}`;
    els.coverTitle.textContent = data.ui.title;
    els.coverHint.innerHTML = escapeHtml(data.ui.coverHint).replace(/\n/g, "<br/>");
    els.againBtn.textContent = data.ui.askAgain;
    els.closeBtn.textContent = data.ui.close;
    els.installBody.textContent = data.ui.installBody;
    els.installLater.textContent = data.ui.installLater;
    els.installConfirm.textContent = data.ui.installConfirm;
    els.bookCover.setAttribute("aria-label", data.ui.title);
    const localeMeta = LOCALES.find(l => l.code === data.meta.lang) || LOCALES.find(l => l.code === localeCode);
    els.langLabel.textContent = localeMeta ? localeMeta.label : "?";
  }

  function escapeHtml(str) {
    return str.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  function randomIndex(len, avoid) {
    if (len <= 1) return 0;
    let i;
    do { i = Math.floor(Math.random() * len); } while (i === avoid);
    return i;
  }

  function currentAnswerText() {
    const data = cache[localeCode];
    if (!data || currentIndex < 0) return "";
    return data.answers[currentIndex % data.answers.length];
  }

  function openBook() {
    if (isOpen) return;
    isOpen = true;
    currentIndex = randomIndex(cache[localeCode].answers.length, -1);
    els.answerText.textContent = currentAnswerText();
    els.book.classList.add("is-open");
    els.page.hidden = false;
    els.actions.hidden = false;
  }

  function closeBook() {
    isOpen = false;
    els.book.classList.remove("is-open");
    els.page.hidden = true;
    els.actions.hidden = true;
    els.page.classList.remove("is-turning");
  }

  function askAgain() {
    const data = cache[localeCode];
    const nextIdx = randomIndex(data.answers.length, currentIndex);
    els.page.classList.remove("is-turning");
    // force reflow so the animation can retrigger
    void els.page.offsetWidth;
    els.page.classList.add("is-turning");
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const swapDelay = prefersReduced ? 0 : 260; // roughly the midpoint of the .5s flip
    window.setTimeout(() => {
      currentIndex = nextIdx;
      els.answerText.textContent = currentAnswerText();
    }, swapDelay);
  }

  async function setLocale(code) {
    localeCode = code;
    localStorage.setItem(STORAGE_KEY, code);
    const data = await loadLocale(code);
    renderStaticText(data);
    if (isOpen && currentIndex >= 0) {
      // keep the same answer "slot" but show it in the new language
      els.answerText.textContent = currentAnswerText();
    }
  }

  // ---- events ----
  els.bookCover.addEventListener("click", openBook);
  els.bookCover.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openBook(); }
  });
  els.againBtn.addEventListener("click", askAgain);
  els.closeBtn.addEventListener("click", closeBook);
  els.langBtn.addEventListener("click", () => setLocale(nextLocaleCode(localeCode)));

  // ---- install prompt (Android/desktop Chrome-family only; iOS has no beforeinstallprompt) ----
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    els.installToast.hidden = false;
  });
  els.installLater.addEventListener("click", () => { els.installToast.hidden = true; });
  els.installConfirm.addEventListener("click", async () => {
    els.installToast.hidden = true;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    }
  });
  window.addEventListener("appinstalled", () => { els.installToast.hidden = true; });

  // ---- service worker ----
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    });
  }

  // ---- boot ----
  loadLocale(localeCode).then(renderStaticText);
})();
