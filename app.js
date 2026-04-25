/* =====================================================
   Guga Khosiauri — XP Portfolio
   Built on top of xp.css for authentic window chrome.
   ===================================================== */

const $  = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];

/* ---------- BOOT → LOGIN → DESKTOP ---------- */
const bootScreen  = $("#bootScreen");
const loginScreen = $("#loginScreen");
const desktop     = $("#desktop");
const taskbar     = $("#taskbar");
const startMenu   = $("#startMenu");
const logoffDialog = $("#logoffDialog");
const powerDialog = $("#powerDialog");
document.title = "Guga Khosiauri - Windows XP";
const debugParams = new URLSearchParams(window.location.search);
const debugDesktopMode =
  debugParams.has("desktop") ||
  window.location.hash === "#desktop";
const debugOpenWindow = debugParams.get("open");
const debugShowStart = debugParams.has("start");
const debugShowPower = debugParams.has("power");
const mobileMedia = window.matchMedia("(max-width: 768px)");
const coarseMedia = window.matchMedia("(pointer: coarse)");
const hoverNoneMedia = window.matchMedia("(hover: none)");
const resumePdfUrl = "assets/Guga_Khosiauri_Resume_Visual.pdf";
let resumePdfDoc = null;
let resumePdfBytes = null;
let resumePdfLibPromise = null;
let resumeRenderToken = 0;

function isMobileLayout(){
  const likelyPhone = Math.min(window.innerWidth, window.innerHeight) <= 900;
  return mobileMedia.matches || (likelyPhone && (coarseMedia.matches || hoverNoneMedia.matches || navigator.maxTouchPoints > 0));
}
function syncMobileClass(){
  document.documentElement.classList.toggle("is-mobile-layout", isMobileLayout());
  document.getElementById("win-resume")?.classList.toggle("resume-mobile-fallback", isMobileLayout());
  if (isMobileLayout() && document.getElementById("win-resume")?.classList.contains("active")) {
    renderResumePdfPreview();
  }
}
syncMobileClass();

async function renderPdfPageToCanvas(page, canvas, cssWidth){
  if (!page || !canvas || !cssWidth) return;
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = cssWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });
  const ratio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  canvas.style.width = `${Math.round(viewport.width)}px`;
  canvas.style.height = `${Math.round(viewport.height)}px`;
  canvas.width = Math.floor(viewport.width * ratio);
  canvas.height = Math.floor(viewport.height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  await page.render({ canvasContext: ctx, viewport }).promise;
}

async function renderResumePdfPreview(){
  if (!isMobileLayout()) return;
  const viewer = document.querySelector("#win-resume .resume-mobile-viewer");
  const pageCanvas = document.getElementById("resumePageCanvas");
  const thumbCanvas = document.getElementById("resumeThumbCanvas");
  const pagePane = document.querySelector("#win-resume .resume-page-pane");
  const thumbPane = document.querySelector("#win-resume .resume-thumb-pane");
  if (!viewer || !pageCanvas || !thumbCanvas || !pagePane || !thumbPane) return;
  const token = ++resumeRenderToken;
  try {
    viewer.dataset.pdfStatus = "loading";
    const pdfjs = window.pdfjsLib || await (resumePdfLibPromise ||= import("./assets/pdfjs/pdf.min.js"));
    pdfjs.GlobalWorkerOptions.workerSrc = "./assets/pdfjs/pdf.worker.min.js";
    if (!resumePdfBytes) {
      resumePdfBytes = await fetch(resumePdfUrl, { cache: "no-store" }).then(r => r.arrayBuffer());
    }
    resumePdfDoc = resumePdfDoc || await pdfjs.getDocument({ data: resumePdfBytes, disableWorker: true }).promise;
    if (token !== resumeRenderToken) return;
    const page = await resumePdfDoc.getPage(1);
    if (token !== resumeRenderToken) return;
    const pageWidth = Math.max(260, pagePane.clientWidth - 24);
    const thumbWidth = Math.max(80, Math.min(150, thumbPane.clientWidth * 0.62));
    await renderPdfPageToCanvas(page, pageCanvas, pageWidth);
    if (token !== resumeRenderToken) return;
    await renderPdfPageToCanvas(page, thumbCanvas, thumbWidth);
    viewer.dataset.pdfStatus = "rendered";
  } catch (err) {
    viewer.dataset.pdfStatus = "failed";
    console.warn("Resume PDF preview failed", err);
  }
}

function fitWindowToMobile(win){
  if (!win || !isMobileLayout()) return;
  win.classList.remove("maximized");
  win.style.left = "8px";
  win.style.right = "8px";
  win.style.top = "60px";
  win.style.width = "calc(100vw - 16px)";
  win.style.height = "";
}

window.addEventListener("load", () => {
  if (debugDesktopMode) {
    bootScreen.classList.add("hidden");
    loginScreen.classList.add("hidden");
    desktop.classList.remove("hidden");
    taskbar.classList.remove("hidden");
    if (debugOpenWindow) openWin(debugOpenWindow);
    if (debugShowStart) openStartMenu();
    if (debugShowPower) openPowerDialog();
    return;
  }
  setTimeout(() => {
    bootScreen.classList.add("fade-out");
    setTimeout(() => {
      bootScreen.classList.add("hidden");
      loginScreen.classList.remove("hidden");
      playSound("logon");
    }, 400);
  }, 2400);
});

function showWelcomeScreen(){
  closePowerDialog();
  closeLogoffDialog();
  closeRunDialog();
  closeStartMenu();
  closeCtxMenu();
  [...openWindows].forEach(closeWin);
  desktop.classList.add("hidden");
  taskbar.classList.add("hidden");
  loginScreen.classList.remove("hidden", "fade-out");
}

$("#loginBtn").addEventListener("click", () => {
  const welcomeScreen = $("#welcomeScreen");
  loginScreen.classList.add("fade-out");
  setTimeout(() => {
    loginScreen.classList.add("hidden");
    loginScreen.classList.remove("fade-out");
    welcomeScreen.classList.remove("hidden");
    playSound("startup");
    setTimeout(() => {
      welcomeScreen.classList.add("fade-out");
      setTimeout(() => {
        welcomeScreen.classList.add("hidden");
        welcomeScreen.classList.remove("fade-out");
        desktop.classList.remove("hidden");
        taskbar.classList.remove("hidden");
      }, 400);
    }, 1800);
  }, 400);
});

/* ---------- SOUND ---------- */
let audioCtx;
const startupAudio = new Audio("assets/startup.mp3");
startupAudio.preload = "auto";
function playSound(kind){
  if (kind === "startup") {
    try {
      startupAudio.currentTime = 0;
      startupAudio.play().catch(() => {});
    } catch(e) {}
    return;
  }
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    if (kind === "click") {
      tone(800, now, 0.03, 0.02);
    } else if (kind === "error") {
      tone(200, now, 0.2, 0.08);
    } else if (kind === "logon") {
      tone(523, now, 0.08, 0.03);
      tone(659, now + 0.08, 0.08, 0.03);
    }
  }catch(e){}
}
function tone(freq, start, dur, vol){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.frequency.value = freq;
  o.type = "triangle";
  g.gain.value = 0;
  g.gain.setTargetAtTime(vol, start, 0.01);
  g.gain.setTargetAtTime(0, start + dur - 0.02, 0.02);
  o.connect(g).connect(audioCtx.destination);
  o.start(start);
  o.stop(start + dur + 0.1);
}

/* ---------- WINDOW MANAGER ---------- */
let z = 100;
const openWindows = new Set();
const prevGeometry = {};

function focusWin(id){
  $$(".window").forEach(w => w.classList.add("inactive-focus"));
  const w = document.getElementById(id);
  if (!w) return;
  w.classList.remove("inactive-focus");
  w.style.zIndex = ++z;
  $$(".taskbar-item").forEach(t => t.classList.toggle("active", t.dataset.win === id));
}

function openWin(id){
  const w = document.getElementById(id);
  if (!w) return;
  if (!openWindows.has(id)) {
    const n = openWindows.size;
    if (isMobileLayout()) {
      fitWindowToMobile(w);
    } else {
      if (!w.style.top || w.style.top === "60px") w.style.top  = `${40 + n*28}px`;
      if (!w.style.left || w.style.left === "150px") w.style.left = `${160 + n*32}px`;
    }
    addTaskbarItem(id);
    openWindows.add(id);
  }
  if (id === "win-resume") {
    w.classList.toggle("resume-mobile-fallback", isMobileLayout());
    renderResumePdfPreview();
  }
  fitWindowToMobile(w);
  w.classList.add("active");
  w.style.display = "block";
  focusWin(id);
  closeStartMenu();
  closeAllPrograms();
  closeCtxMenu();
}

function closeWin(id){
  const w = document.getElementById(id);
  if (!w) return;
  w.classList.remove("active", "maximized");
  w.style.display = "none";
  removeTaskbarItem(id);
  openWindows.delete(id);
  delete prevGeometry[id];
}

function minimizeWin(id){
  const w = document.getElementById(id);
  if (!w) return;
  w.classList.add("minimize-anim");
  setTimeout(() => {
    w.style.display = "none";
    w.classList.remove("minimize-anim");
  }, 180);
  const item = document.querySelector(`.taskbar-item[data-win="${id}"]`);
  if (item) item.classList.remove("active");
}

function restoreWin(id){
  const w = document.getElementById(id);
  if (!w) return;
  w.style.display = "block";
  focusWin(id);
}

function maximizeWin(id){
  const w = document.getElementById(id);
  if (!w) return;
  if (w.classList.contains("maximized")) {
    w.classList.remove("maximized");
    const g = prevGeometry[id];
    if (g){ w.style.top = g.top; w.style.left = g.left; w.style.width = g.width; w.style.height = g.height; }
  } else {
    prevGeometry[id] = { top: w.style.top, left: w.style.left, width: w.style.width, height: w.style.height };
    w.classList.add("maximized");
  }
}

/* ---------- TASKBAR ITEMS ---------- */
const taskbarItems = $("#taskbarItems");

function addTaskbarItem(id){
  const w = document.getElementById(id);
  if (!w) return;
  const title = w.dataset.title || id;
  const iconId = w.dataset.icon || "i-user";
  const btn = document.createElement("button");
  btn.className = "taskbar-item active";
  btn.dataset.win = id;
  btn.innerHTML = `${renderTaskbarIcon(iconId)}<span>${escapeHtml(title)}</span>`;
  btn.addEventListener("click", () => {
    const win = document.getElementById(id);
    if (!win) return;
    const visible = win.style.display !== "none" && win.classList.contains("active");
    const focused = !win.classList.contains("inactive-focus");
    if (visible && focused) minimizeWin(id);
    else restoreWin(id);
  });
  taskbarItems.appendChild(btn);
}
function removeTaskbarItem(id){
  const item = document.querySelector(`.taskbar-item[data-win="${id}"]`);
  if (item) item.remove();
}

function renderTaskbarIcon(icon){
  if (!icon) return "";
  if (icon.includes("/") || icon.includes(".")) {
    return `<img src="${escapeHtml(icon)}" alt="">`;
  }
  return `<svg><use href="#${escapeHtml(icon)}"/></svg>`;
}

/* ---------- OPEN HANDLERS (data-open) ---------- */
document.addEventListener("click", (e) => {
  const opener = e.target.closest("[data-open]");
  if (!opener) return;
  if (opener.matches(".icon, .file-item")) return;
  e.preventDefault();
  openWin(opener.dataset.open);
  if (opener.dataset.modeOpen && typeof setMediaMode === "function") setMediaMode(opener.dataset.modeOpen);
  playSound("click");
});

/* ---------- DESKTOP / EXPLORER ITEMS ---------- */
function bindSelectableLaunchers(selector, groupSelector = selector){
  $$(selector).forEach(item => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      $$(groupSelector).forEach(node => node.classList.remove("selected"));
      item.classList.add("selected");
      if (isMobileLayout() && item.dataset.open) {
        openWin(item.dataset.open);
        playSound("click");
      }
    });
    item.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      if (!item.dataset.open) return;
      openWin(item.dataset.open);
      playSound("click");
    });
    item.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && item.dataset.open) {
        e.preventDefault();
        openWin(item.dataset.open);
        playSound("click");
      }
    });
  });
}

bindSelectableLaunchers(".icon", ".icon");
bindSelectableLaunchers(".file-item[data-open]", ".file-item");

desktop.addEventListener("click", (e) => {
  if (e.target === desktop) {
    $$(".icon").forEach(i => i.classList.remove("selected"));
    $$(".file-item").forEach(i => i.classList.remove("selected"));
  }
});

/* ---------- WINDOW CONTROLS (xp.css exposes data-minimize/maximize/close on buttons in .title-bar-controls; we added them) ---------- */
$$(".window").forEach(win => {
  win.addEventListener("mousedown", () => focusWin(win.id));

  // control buttons
  win.querySelectorAll(".title-bar-controls button").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (btn.hasAttribute("data-close"))         closeWin(win.id);
      else if (btn.hasAttribute("data-minimize")) minimizeWin(win.id);
      else if (btn.hasAttribute("data-maximize")) maximizeWin(win.id);
      else if (btn.getAttribute("aria-label") === "Close") closeWin(win.id);
    });
  });

  // double-click titlebar = toggle maximize
  const tb = win.querySelector(".title-bar");
  if (tb) tb.addEventListener("dblclick", (e) => {
    if (e.target.closest("button")) return;
    maximizeWin(win.id);
  });
});

/* ---------- DRAGGING ---------- */
let drag = null, offsetX = 0, offsetY = 0;
document.addEventListener("mousedown", (e) => {
  const bar = e.target.closest("[data-drag]");
  if (!bar) return;
  if (e.target.closest("button")) return;
  const win = bar.closest(".window");
  if (!win || win.classList.contains("maximized")) return;
  if (isMobileLayout()) {
    fitWindowToMobile(win);
    return;
  }
  drag = win;
  const rect = win.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  focusWin(win.id);
  e.preventDefault();
});
document.addEventListener("mousemove", (e) => {
  if (!drag) return;
  const maxX = Math.max(0, window.innerWidth - Math.min(100, drag.offsetWidth));
  const maxY = Math.max(0, window.innerHeight - 60);
  const x = Math.max(-drag.offsetWidth + 100, Math.min(e.clientX - offsetX, maxX));
  const y = Math.max(0, Math.min(e.clientY - offsetY, maxY));
  drag.style.left = `${x}px`;
  drag.style.top  = `${y}px`;
});
document.addEventListener("mouseup", () => drag = null);
mobileMedia.addEventListener?.("change", () => {
  syncMobileClass();
  if (!isMobileLayout()) return;
  $$(".window.active").forEach(fitWindowToMobile);
  renderResumePdfPreview();
});
coarseMedia.addEventListener?.("change", syncMobileClass);
hoverNoneMedia.addEventListener?.("change", syncMobileClass);
window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    syncMobileClass();
    if (isMobileLayout()) $$(".window.active").forEach(fitWindowToMobile);
    renderResumePdfPreview();
  }, 120);
});

/* ---------- START MENU ---------- */
const startBtn = $("#startBtn");
function toggleStartMenu(){
  startMenu.classList.contains("hidden") ? openStartMenu() : closeStartMenu();
}
function openStartMenu(){
  closeCtxMenu();
  startMenu.classList.remove("hidden");
  startBtn.classList.add("active");
  playSound("click");
}
function closeStartMenu(){
  startMenu.classList.add("hidden");
  startBtn.classList.remove("active");
  closeAllPrograms();
}
function openLogoffDialog(){
  closePowerDialog();
  closeStartMenu();
  logoffDialog?.classList.remove("hidden");
}
function closeLogoffDialog(){
  logoffDialog?.classList.add("hidden");
}
function openPowerDialog(){
  closeLogoffDialog();
  powerDialog?.classList.remove("hidden");
}
function closePowerDialog(){
  powerDialog?.classList.add("hidden");
}
function logoffSequence(mode = "logoff"){
  const overlay = $("#shutdownOverlay");
  const text = $("#shutdownText");
  closeLogoffDialog();
  closePowerDialog();
  closeStartMenu();
  overlay.classList.remove("hidden");
  text.textContent = "Saving your settings...";
  setTimeout(() => {
    text.textContent = mode === "switch"
      ? "Windows is switching users..."
      : "Windows is logging off...";
  }, 900);
  setTimeout(() => {
    overlay.classList.add("hidden");
    showWelcomeScreen();
    playSound("logon");
  }, 2200);
}
function shutdownSequence(mode){
  const overlay = $("#shutdownOverlay");
  const text = $("#shutdownText");
  closeLogoffDialog();
  closePowerDialog();
  closeStartMenu();
  overlay.classList.remove("hidden");
  if (mode === "restart") {
    text.textContent = "Windows is restarting...";
    setTimeout(() => location.reload(), 2200);
    return;
  }
  text.textContent = "Saving your settings...";
  setTimeout(() => text.textContent = "Windows is shutting down...", 900);
  setTimeout(() => text.textContent = "It is now safe to turn off your computer.", 2200);
  setTimeout(() => location.reload(), 3800);
}
function standbySequence(){
  const overlay = $("#shutdownOverlay");
  const text = $("#shutdownText");
  closePowerDialog();
  text.textContent = "Windows is preparing to stand by...";
  overlay.classList.remove("hidden");
  setTimeout(() => overlay.classList.add("hidden"), 1400);
}
startBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleStartMenu(); });
document.addEventListener("click", (e) => {
  if (!startMenu.contains(e.target) && e.target !== startBtn && !startBtn.contains(e.target)) {
    closeStartMenu();
  }
});
logoffDialog?.addEventListener("click", (e) => {
  if (e.target === logoffDialog) closeLogoffDialog();
});
powerDialog?.addEventListener("click", (e) => {
  if (e.target === powerDialog) closePowerDialog();
});

$("#logOffBtn").addEventListener("click", openLogoffDialog);
$("#switchUserBtn")?.addEventListener("click", () => logoffSequence("switch"));
$("#confirmLogOffBtn")?.addEventListener("click", () => logoffSequence("logoff"));
$("#logoffCancelBtn")?.addEventListener("click", closeLogoffDialog);
$("#loginPowerBtn").addEventListener("click", openPowerDialog);
$("#shutDownBtn").addEventListener("click", () => {
  closeStartMenu();
  openPowerDialog();
});
$("#powerCancelBtn")?.addEventListener("click", closePowerDialog);
$("#powerOffBtn")?.addEventListener("click", () => shutdownSequence("poweroff"));
$("#powerRestartBtn")?.addEventListener("click", () => shutdownSequence("restart"));
$("#standbyBtn")?.addEventListener("click", standbySequence);

$("#helpBtn").addEventListener("click", () => { closeStartMenu(); openWin("win-about"); });
$("#searchBtn").addEventListener("click", () => { closeStartMenu(); openWin("win-mycomputer"); });

/* ---------- RUN DIALOG ---------- */
const runDialog = $("#runDialog");
const runInput  = $("#runInput");
$("#runBtn").addEventListener("click", () => { closeStartMenu(); openRunDialog(); });
function openRunDialog(){
  runDialog.classList.remove("hidden");
  runInput.value = "";
  setTimeout(() => runInput.focus(), 50);
}
function closeRunDialog(){ runDialog.classList.add("hidden"); }
$("#runClose").addEventListener("click", closeRunDialog);
$("#runCancel").addEventListener("click", closeRunDialog);
$("#runOk").addEventListener("click", runExecute);
runInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runExecute();
  if (e.key === "Escape") closeRunDialog();
});
function runExecute(){
  const cmd = (runInput.value || "").trim().toLowerCase();
  const map = {
    cmd: "win-cmd", command: "win-cmd",
    explorer: "win-mycomputer", mycomputer: "win-mycomputer", "my computer": "win-mycomputer",
    documents: "win-documents", mydocs: "win-documents", "my documents": "win-documents",
    network: "win-network", links: "win-network", favorites: "win-network", "my network places": "win-network",
    about: "win-about", projects: "win-projects", iexplore: "win-internet", ie: "win-internet",
    "iexplore.exe": "win-internet", internet: "win-internet", browser: "win-internet",
    resume: "win-resume", notepad: "win-resume",
    contact: "win-contact", mail: "win-contact",
    skills: "win-skills", control: "win-skills", "control panel": "win-skills",
    viewer: "win-viewer", picture: "win-viewer", pictures: "win-viewer", mspaint: "win-viewer",
    recycle: "win-recycle",
    wmplayer: "win-media", mplayer: "win-media", mplayer2: "win-media",
    music: "win-media", video: "win-media", media: "win-media",
    notepad: "win-notepad", paint: "win-paint", calc: "win-calculator", calculator: "win-calculator",
    solitaire: "win-solitaire", minesweeper: "win-minesweeper",
  };
  if (!cmd) {
    closeRunDialog();
  } else if (map[cmd]) { closeRunDialog(); openWin(map[cmd]); }
  else if (cmd === "exit" || cmd === "logoff") { closeRunDialog(); openLogoffDialog(); }
  else {
    playSound("error");
    alert(`Windows cannot find '${runInput.value}'. Make sure you typed the name correctly.`);
  }
}

/* ---------- CLOCK ---------- */
const clock = $("#clock");
function tick(){
  const d = new Date();
  clock.textContent = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  clock.title = d.toLocaleDateString(undefined, { weekday:"long", year:"numeric", month:"long", day:"numeric" });
}
tick(); setInterval(tick, 1000);

/* ---------- CONTEXT MENU ---------- */
const ctxMenu = $("#ctxMenu");
let suppressNativeContextMenuUntil = 0;
let suppressNextContextClick = false;
function openCtxMenuAt(x, y){
  const menuWidth = Math.min(220, window.innerWidth - 8);
  const menuHeight = 285;
  x = Math.max(4, Math.min(x, window.innerWidth - menuWidth - 4));
  y = Math.max(4, Math.min(y, window.innerHeight - menuHeight - 36));
  ctxMenu.style.left = `${x}px`;
  ctxMenu.style.top  = `${y}px`;
  ctxMenu.classList.remove("hidden");
}
desktop.addEventListener("contextmenu", (e) => {
  if (e.target.closest(".window")) return;
  e.preventDefault();
  if (Date.now() < suppressNativeContextMenuUntil) return;
  openCtxMenuAt(e.clientX, e.clientY);
});
document.addEventListener("pointerdown", (e) => {
  if (ctxMenu.classList.contains("hidden")) return;
  if (ctxMenu.contains(e.target)) return;
  closeCtxMenu();
}, { capture: true });
document.addEventListener("click", (e) => {
  if (suppressNextContextClick) {
    suppressNextContextClick = false;
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  if (ctxMenu.classList.contains("hidden")) return;
  if (ctxMenu.contains(e.target)) return;
  closeCtxMenu();
}, { capture: true });
function closeCtxMenu(){ ctxMenu.classList.add("hidden"); }
let ctxPressTimer = null;
let ctxPressStart = null;
function clearCtxPress(){
  clearTimeout(ctxPressTimer);
  ctxPressTimer = null;
  ctxPressStart = null;
}
desktop.addEventListener("pointerdown", (e) => {
  if (!isMobileLayout() || e.pointerType === "mouse") return;
  if (e.target !== desktop) return;
  clearCtxPress();
  ctxPressStart = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
  ctxPressTimer = setTimeout(() => {
    if (!ctxPressStart || activeSelection?.moved) return;
    if (activeSelection) {
      activeSelection.box.remove();
      activeSelection = null;
    }
    suppressNativeContextMenuUntil = Date.now() + 900;
    suppressNextContextClick = true;
    openCtxMenuAt(ctxPressStart.x, ctxPressStart.y);
    if (navigator.vibrate) navigator.vibrate(18);
  }, 560);
}, { passive: true });
desktop.addEventListener("pointermove", (e) => {
  if (!ctxPressStart || e.pointerId !== ctxPressStart.pointerId) return;
  const dx = Math.abs(e.clientX - ctxPressStart.x);
  const dy = Math.abs(e.clientY - ctxPressStart.y);
  if (dx > 10 || dy > 10) clearCtxPress();
}, { passive: true });
["pointerup", "pointercancel", "pointerleave"].forEach(type => {
  desktop.addEventListener(type, clearCtxPress, { passive: true });
});
document.addEventListener("contextmenu", (e) => {
  if (e.target.closest("video, .wmp-window, .desktop, .ctx-menu")) {
    e.preventDefault();
  }
}, { capture: true });
const desktopWallpapers = [
  'url("assets/bliss.jpg")',
  'url("assets/gallery/xp-green-hills.svg")',
  'url("assets/gallery/xp-blue-lake.svg")',
  'url("assets/gallery/xp-sunset-field.svg")'
];
let wallpaperIdx = 0;
function setDesktopWallpaper(index){
  wallpaperIdx = (index + desktopWallpapers.length) % desktopWallpapers.length;
  desktop.style.backgroundImage = desktopWallpapers[wallpaperIdx];
}
function nextDesktopWallpaper(){
  setDesktopWallpaper(wallpaperIdx + 1);
}
function arrangeDesktopIcons(){
  const recycleIcon = $(".icon[data-open='win-recycle']");
  const icons = $$(".icon")
    .filter(icon => icon !== recycleIcon)
    .sort((a, b) => a.textContent.trim().localeCompare(b.textContent.trim()));
  icons.forEach((icon, index) => {
    const row = index % 6;
    const col = Math.floor(index / 6);
    icon.style.left = `${14 + col * 96}px`;
    icon.style.top = `${14 + row * 94}px`;
    icon.style.right = "auto";
  });
  if (recycleIcon) {
    recycleIcon.style.left = "auto";
    recycleIcon.style.right = "14px";
    recycleIcon.style.top = "14px";
  }
}
ctxMenu.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const a = btn.dataset.ctx;
  if (a === "arrange") {
    arrangeDesktopIcons();
  } else if (a === "refresh") {
    tick();
    $$(".icon").forEach(i => { i.style.opacity = 0; setTimeout(() => i.style.opacity = 1, 120); });
  } else if (a === "icons-large") {
    desktop.classList.remove("small-icons");
  } else if (a === "icons-small") {
    desktop.classList.add("small-icons");
  } else if (a === "wallpaper") {
    nextDesktopWallpaper();
  } else if (a === "internet") {
    openWin("win-internet");
  } else if (a === "viewer")    openWin("win-viewer");
  else if (a === "cmd")         openWin("win-cmd");
  else if (a === "properties")  openWin("win-mycomputer");
  else if (a === "new")         openRunDialog();
  closeCtxMenu();
});

/* ---------- COMMAND PROMPT ---------- */
const cmdInput = $("#cmdInput");
const cmdLog   = $("#cmdLog");
const cmdHistory = [];
let cmdHistIdx = -1;

function cmdWrite(text){
  const line = document.createElement("div");
  line.className = "cmd-out";
  line.innerHTML = text;
  cmdLog.appendChild(line);
  const body = $("#cmdBody");
  body.scrollTop = body.scrollHeight;
}

const COMMANDS = {
  help(){
    cmdWrite("Available commands:");
    cmdWrite("  help, cls, dir, tree, cd, type &lt;file&gt;, whoami, hostname");
    cmdWrite("  date, time, ver, echo &lt;text&gt;, ipconfig, ping &lt;host&gt;");
    cmdWrite("  systeminfo, tasklist, wallpaper, icons small|large");
    cmdWrite("  about, projects, resume, contact, skills, documents, links");
    cmdWrite("  internet, viewer, mycomputer, recycle, github, linkedin");
    cmdWrite("  start &lt;app&gt;, open &lt;url&gt;, color &lt;0a|07&gt;, exit");
  },
  cls(){ cmdLog.innerHTML = ""; },
  clear(){ COMMANDS.cls(); },
  dir(){
    cmdWrite(" Volume in drive C has no label.");
    cmdWrite(" Volume Serial Number is G46A-XXXX");
    cmdWrite("");
    cmdWrite(" Directory of C:\\Guga\\Portfolio");
    cmdWrite("");
    cmdWrite(" 04/23/2026  10:00 AM    &lt;DIR&gt;          .");
    cmdWrite(" 04/23/2026  10:00 AM    &lt;DIR&gt;          ..");
    cmdWrite(" 04/23/2026  10:00 AM             2,048 about.txt");
    cmdWrite(" 04/23/2026  10:00 AM    &lt;DIR&gt;          my documents");
    cmdWrite(" 04/24/2026  09:42 PM             4,505 Resume.pdf");
    cmdWrite(" 04/23/2026  10:00 AM             1,024 contact.vcf");
    cmdWrite(" 04/23/2026  10:00 AM             1,024 skills.inf");
    cmdWrite("               4 File(s)          7,168 bytes");
    cmdWrite("               3 Dir(s)   1,337,420,000 bytes free");
  },
  tree(){
    cmdWrite("C:\\Guga\\Portfolio");
    cmdWrite("|-- about.txt");
    cmdWrite("|-- Resume.pdf");
    cmdWrite("|-- contact.vcf");
    cmdWrite("|-- skills.inf");
    cmdWrite("|-- My Documents");
    cmdWrite("|   |-- Projects");
    cmdWrite("|   |-- Pictures");
    cmdWrite("|   `-- Web Links");
    cmdWrite("`-- Desktop");
  },
  cd(args){
    const path = args.join(" ") || "C:\\Guga";
    cmdWrite(`C:\\Guga&gt;cd ${escapeHtml(path)}`);
    cmdWrite("The portfolio command prompt stays in C:\\Guga.");
  },
  type(args){
    const file = (args.join(" ") || "").toLowerCase();
    if (file.includes("about")) {
      cmdWrite("Hi, I'm Guga - a field computer technician who enjoys solving real-world tech problems.");
      cmdWrite("I work with Windows systems, POS devices, printers, networking, hardware diagnostics, and user support.");
    } else if (file.includes("contact")) {
      cmdWrite("Email: gugaxosiauri@gmail.com");
      cmdWrite("GitHub: github.com/GugaKhosiauri");
      cmdWrite("LinkedIn: linkedin.com/in/guga-khosiauri");
    } else if (file.includes("skill")) {
      cmdWrite("Windows support, POS devices, printers, networking, diagnostics, HTML, CSS, JavaScript, Flutter learning.");
    } else if (file.includes("resume")) {
      openWin("win-resume");
      cmdWrite("Opening Resume.pdf...");
    } else {
      cmdWrite("The system cannot find the file specified.");
    }
  },
  whoami(){ cmdWrite("GUGA-PC\\Guga"); },
  hostname(){ cmdWrite("GUGA-PC"); },
  date(){ cmdWrite("The current date is: " + new Date().toDateString()); },
  time(){ cmdWrite("The current time is: " + new Date().toLocaleTimeString()); },
  ver(){  cmdWrite("Microsoft Windows XP [Version 5.1.2600]"); },
  echo(args){ cmdWrite(args.join(" ") || "ECHO is on."); },
  ipconfig(){
    cmdWrite("Windows IP Configuration");
    cmdWrite("");
    cmdWrite("Ethernet adapter Local Area Connection:");
    cmdWrite("   Connection-specific DNS Suffix  . : portfolio.local");
    cmdWrite("   IP Address. . . . . . . . . . . . : 192.168.1.24");
    cmdWrite("   Subnet Mask . . . . . . . . . . . : 255.255.255.0");
    cmdWrite("   Default Gateway . . . . . . . . . : 192.168.1.1");
  },
  ping(args){
    const host = escapeHtml(args[0] || "guga.local");
    cmdWrite(`Pinging ${host} [127.0.0.1] with 32 bytes of data:`);
    cmdWrite(`Reply from 127.0.0.1: bytes=32 time&lt;1ms TTL=128`);
    cmdWrite(`Reply from 127.0.0.1: bytes=32 time&lt;1ms TTL=128`);
    cmdWrite(`Reply from 127.0.0.1: bytes=32 time&lt;1ms TTL=128`);
    cmdWrite(`Reply from 127.0.0.1: bytes=32 time&lt;1ms TTL=128`);
    cmdWrite("");
    cmdWrite(`Ping statistics for 127.0.0.1: Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`);
  },
  systeminfo(){
    cmdWrite("Host Name:                 GUGA-PC");
    cmdWrite("OS Name:                   Microsoft Windows XP Professional");
    cmdWrite("System Type:               Portfolio Desktop");
    cmdWrite("Registered Owner:          Guga Khosiauri");
    cmdWrite("Role:                      Field Computer Technician");
  },
  tasklist(){
    cmdWrite("Image Name                 PID Session Name     Mem Usage");
    cmdWrite("========================= ==== ================ =========");
    cmdWrite("explorer.exe              1337 Console          24,576 K");
    cmdWrite("iexplore.exe              2600 Console          18,432 K");
    cmdWrite("cmd.exe                   1998 Console           4,096 K");
  },
  about(){     openWin("win-about");    cmdWrite("Opening About Me..."); },
  projects(){  openWin("win-projects"); cmdWrite("Opening My Projects..."); },
  resume(){    openWin("win-resume");   cmdWrite("Opening Resume..."); },
  contact(){   openWin("win-contact");  cmdWrite("Opening Contact..."); },
  skills(){    openWin("win-skills");   cmdWrite("Opening Control Panel..."); },
  internet(){  openWin("win-internet"); cmdWrite("Opening Internet Explorer..."); },
  documents(){ openWin("win-documents"); cmdWrite("Opening My Documents..."); },
  network(){   openWin("win-network");  cmdWrite("Opening Web Links..."); },
  links(){     openWin("win-network");  cmdWrite("Opening Web Links..."); },
  viewer(){    openWin("win-viewer");   cmdWrite("Opening Picture Viewer..."); },
  mycomputer(){ openWin("win-mycomputer"); cmdWrite("Opening My Computer..."); },
  recycle(){   openWin("win-recycle");  cmdWrite("Opening Recycle Bin..."); },
  github(){ window.open("https://github.com/GugaKhosiauri", "_blank", "noopener"); cmdWrite("Opening GitHub..."); },
  linkedin(){ window.open("https://linkedin.com/in/guga-khosiauri", "_blank", "noopener"); cmdWrite("Opening LinkedIn..."); },
  wallpaper(){ nextDesktopWallpaper(); cmdWrite("Desktop background changed."); },
  icons(args){
    if ((args[0] || "").toLowerCase() === "small") {
      desktop.classList.add("small-icons");
      cmdWrite("Desktop icons set to small.");
    } else {
      desktop.classList.remove("small-icons");
      cmdWrite("Desktop icons set to large.");
    }
  },
  open(args){
    const raw = args.join(" ");
    if (!raw) return cmdWrite("Usage: open &lt;url&gt;");
    const url = raw.includes("://") ? raw : `https://${raw}`;
    window.open(url, "_blank", "noopener");
    cmdWrite(`Opening ${escapeHtml(url)}...`);
  },
  start(args){ const m = { about:"win-about", projects:"win-projects", resume:"win-resume", contact:"win-contact", skills:"win-skills", cmd:"win-cmd", explorer:"win-mycomputer", documents:"win-documents", network:"win-network", links:"win-network", internet:"win-internet", iexplore:"win-internet", browser:"win-internet", viewer:"win-viewer", notepad:"win-notepad", paint:"win-paint", calc:"win-calculator", calculator:"win-calculator", solitaire:"win-solitaire", minesweeper:"win-minesweeper" }; const w = m[(args[0] || "").toLowerCase()]; if (w){ openWin(w); cmdWrite(`Starting ${escapeHtml(args[0])}...`); } else cmdWrite(`Unknown app: ${escapeHtml(args[0] || "")}`); },
  color(args){
    const value = (args[0] || "").toLowerCase();
    if (value === "0a") {
      $("#cmdBody").style.color = "#00ff00";
      cmdWrite("Color set to green.");
    } else if (value === "07" || !value) {
      $("#cmdBody").style.color = "#fff";
      cmdWrite("Color set to default.");
    } else {
      cmdWrite("Supported colors: 0a, 07");
    }
  },
  exit(){ closeWin("win-cmd"); }
};

if (cmdInput) {
  cmdInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const raw = cmdInput.value;
      cmdWrite(`C:\\Guga&gt;${escapeHtml(raw)}`);
      const [name, ...args] = raw.trim().split(/\s+/);
      if (name) {
        cmdHistory.push(raw); cmdHistIdx = cmdHistory.length;
        const fn = COMMANDS[name.toLowerCase()];
        if (fn) fn(args);
        else cmdWrite(`'${escapeHtml(name)}' is not recognized as an internal or external command,`), cmdWrite(`operable program or batch file.`);
      }
      cmdInput.value = "";
    } else if (e.key === "ArrowUp") {
      if (cmdHistIdx > 0) cmdInput.value = cmdHistory[--cmdHistIdx] || "";
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      if (cmdHistIdx < cmdHistory.length - 1) cmdInput.value = cmdHistory[++cmdHistIdx] || "";
      else { cmdHistIdx = cmdHistory.length; cmdInput.value = ""; }
      e.preventDefault();
    }
  });
  const cmdWin = document.getElementById("win-cmd");
  cmdWin.addEventListener("click", () => cmdInput.focus());
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }

/* ---------- IMAGE VIEWER ---------- */
const gallery = [
  { src: "assets/bliss.jpg",                         name: "Bliss.jpg" },
  { src: "assets/gallery/xp-green-hills.svg",        name: "Green Hills.jpg" },
  { src: "assets/gallery/xp-blue-lake.svg",          name: "Blue Lake.jpg" },
  { src: "assets/gallery/xp-sunset-field.svg",       name: "Sunset Field.jpg" },
  { src: "assets/avatar.png",                        name: "Guga.png" },
];
let galleryIdx = 0;
let viewerScale = 1;
const viewerImg  = $("#viewerImg");
const viewerName = $("#viewerName");
const viewerPrev = $("#viewerPrev");
const viewerNext = $("#viewerNext");
if (viewerPrev) viewerPrev.textContent = "<";
if (viewerNext) viewerNext.textContent = ">";
function showImage(){
  const it = gallery[galleryIdx];
  viewerImg.src = it.src;
  viewerScale = 1;
  viewerImg.style.transform = `scale(1)`;
  viewerName.textContent = `${it.name}  (${galleryIdx+1}/${gallery.length})`;
}
viewerPrev?.addEventListener("click", () => {
  galleryIdx = (galleryIdx - 1 + gallery.length) % gallery.length;
  showImage();
});
viewerNext?.addEventListener("click", () => {
  galleryIdx = (galleryIdx + 1) % gallery.length;
  showImage();
});
$("#viewerZoomIn") ?.addEventListener("click", () => { viewerScale = Math.min(3, viewerScale + 0.25); viewerImg.style.transform = `scale(${viewerScale})`; });
$("#viewerZoomOut")?.addEventListener("click", () => { viewerScale = Math.max(0.25, viewerScale - 0.25); viewerImg.style.transform = `scale(${viewerScale})`; });
showImage();

/* ---------- CONTACT FORM ---------- */
$("#contactForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#cf-n").value, email = $("#cf-e").value, msg = $("#cf-m").value;
  const body = encodeURIComponent(`Hi Guga,\n\n${msg}\n\n— ${name} (${email})`);
  const subj = encodeURIComponent(`Hello from ${name}`);
  window.location.href = `mailto:gugaxosiauri@gmail.com?subject=${subj}&body=${body}`;
});

/* ---------- INTERNET EXPLORER WINDOWS ---------- */
function setInternetStatus(text){
  const status = $("#internetStatus");
  if (status) status.textContent = text;
}
function renderInternetHome(){
  const page = $("#internetPage");
  if (!page) return;
  page.innerHTML = `
    <div class="ie-header">
      <h1>GugaNet Home</h1>
      <p>A tiny Internet Explorer-style launcher for this portfolio.</p>
    </div>
    <div class="internet-shortcuts">
      <button data-open="win-about"><img src="assets/desktop/about.webp" alt=""><span>About Me</span></button>
      <button data-open="win-projects"><img src="assets/desktop/projects.webp" alt=""><span>Projects</span></button>
      <button data-open="win-resume"><img src="assets/desktop/resume.webp" alt=""><span>Resume</span></button>
      <a href="https://github.com/GugaKhosiauri" target="_blank" rel="noreferrer"><img src="assets/xp/network-places.ico" alt=""><span>GitHub</span></a>
      <a href="https://linkedin.com/in/guga-khosiauri" target="_blank" rel="noreferrer"><img src="assets/xp/internet-explorer.ico" alt=""><span>LinkedIn</span></a>
      <a href="https://www.google.com/search?q=Guga+Khosiauri" target="_blank" rel="noreferrer"><img src="assets/xp/search.ico" alt=""><span>Search Web</span></a>
    </div>`;
}
function navigateInternet(raw){
  const input = $("#internetAddress");
  const page = $("#internetPage");
  const value = (raw || input?.value || "").trim();
  if (!value) return;
  setInternetStatus("Loading...");
  if (/^(home|about:home|https:\/\/guga\.local\/home)$/i.test(value)) {
    if (input) input.value = "https://guga.local/home";
    renderInternetHome();
    setInternetStatus("Done");
    return;
  }
  const localMap = {
    about: "win-about",
    projects: "win-projects",
    resume: "win-resume",
    contact: "win-contact",
    pictures: "win-viewer",
  };
  const local = localMap[value.toLowerCase()];
  if (local) {
    openWin(local);
    setInternetStatus("Done");
    return;
  }
  const url = value.includes("://") ? value : `https://${value}`;
  if (page) {
    page.innerHTML = `
      <div class="ie-header">
        <h1>Opening external page</h1>
        <p>Modern sites often block being embedded inside old-style frames. Internet Explorer will open this address in a new tab.</p>
      </div>
      <p><a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a></p>`;
  }
  window.open(url, "_blank", "noopener");
  setInternetStatus("Opened in new tab");
}
$("#internetGo")?.addEventListener("click", () => navigateInternet());
$("#internetAddress")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") navigateInternet();
});
$$("[data-browser]").forEach(btn => btn.addEventListener("click", () => {
  const action = btn.dataset.browser;
  if (action === "home") navigateInternet("home");
  else if (action === "search") navigateInternet("https://www.google.com/search?q=Guga+Khosiauri");
  else if (action === "favorites") openWin("win-network");
  else if (action === "refresh") navigateInternet($("#internetAddress")?.value || "home");
  else setInternetStatus(action === "stop" ? "Stopped" : "Done");
}));

/* ---------- IE toolbar stub ---------- */
$$(".ie-btn:not([data-browser])").forEach(b => b.addEventListener("click", () => {
  const status = $("#ieStatus");
  if (!status) return;
  status.textContent = "Loading...";
  setTimeout(() => status.textContent = "Done", 400);
}));

/* ---------- KEYBOARD ---------- */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!runDialog.classList.contains("hidden")) { closeRunDialog(); return; }
    if (logoffDialog && !logoffDialog.classList.contains("hidden")) { closeLogoffDialog(); return; }
    if (powerDialog && !powerDialog.classList.contains("hidden")) { closePowerDialog(); return; }
    if (!startMenu.classList.contains("hidden")) { closeStartMenu(); return; }
    if (!ctxMenu.classList.contains("hidden"))   { closeCtxMenu();   return; }
    const top = topVisibleWindow();
    if (top) closeWin(top.id);
  }
  if (e.ctrlKey && e.key === "Escape") { e.preventDefault(); toggleStartMenu(); }
  if (e.altKey && e.key === "F4") {
    e.preventDefault();
    const top = topVisibleWindow();
    if (top) closeWin(top.id);
  }
  // Win + R style (Ctrl+R in browser conflicts with reload; use Alt+R)
  if (e.altKey && (e.key === "r" || e.key === "R")) { e.preventDefault(); openRunDialog(); }
});

function topVisibleWindow(){
  const wins = $$(".window").filter(w => w.style.display !== "none" && w.classList.contains("active"));
  wins.sort((a,b) => (+a.style.zIndex || 0) - (+b.style.zIndex || 0));
  return wins.pop();
}

/* ---------- DESKTOP SELECTION BOX ---------- */
let activeSelection = null;
let suppressNextSelectionClick = false;

function rectsIntersect(a, b){
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
}

function beginSelection(e, container, itemSelector, groupSelector){
  if (e.button !== undefined && e.button !== 0) return;
  if (e.target !== container) return;
  closeCtxMenu();
  closeAllPrograms();

  const box = document.createElement("div");
  box.className = "select-box";
  container.appendChild(box);

  activeSelection = {
    container,
    itemSelector,
    groupSelector,
    box,
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    moved: false,
  };
  container.setPointerCapture?.(e.pointerId);
  e.preventDefault();
}

function updateSelection(e){
  if (!activeSelection || e.pointerId !== activeSelection.pointerId) return;
  const s = activeSelection;
  const dx = Math.abs(e.clientX - s.startX);
  const dy = Math.abs(e.clientY - s.startY);
  if (dx > 4 || dy > 4) {
    s.moved = true;
    clearCtxPress();
  }

  const viewportRect = {
    left: Math.min(s.startX, e.clientX),
    top: Math.min(s.startY, e.clientY),
    right: Math.max(s.startX, e.clientX),
    bottom: Math.max(s.startY, e.clientY),
  };
  const containerRect = s.container.getBoundingClientRect();
  s.box.style.left = `${viewportRect.left - containerRect.left + s.container.scrollLeft}px`;
  s.box.style.top = `${viewportRect.top - containerRect.top + s.container.scrollTop}px`;
  s.box.style.width = `${viewportRect.right - viewportRect.left}px`;
  s.box.style.height = `${viewportRect.bottom - viewportRect.top}px`;

  $$(s.groupSelector).forEach(item => {
    item.classList.toggle("selected", rectsIntersect(viewportRect, item.getBoundingClientRect()));
  });
}

function finishSelection(e){
  if (!activeSelection || e.pointerId !== activeSelection.pointerId) return;
  const s = activeSelection;
  s.container.releasePointerCapture?.(e.pointerId);
  if (s.moved) suppressNextSelectionClick = true;
  s.box.remove();
  activeSelection = null;
}

desktop.addEventListener("pointerdown", (e) => beginSelection(e, desktop, ".icon", ".icon"));
document.addEventListener("pointermove", updateSelection);
document.addEventListener("pointerup", finishSelection);
document.addEventListener("pointercancel", finishSelection);
document.addEventListener("click", (e) => {
  if (!suppressNextSelectionClick) return;
  suppressNextSelectionClick = false;
  e.preventDefault();
  e.stopPropagation();
}, { capture: true });

$$(".file-grid").forEach(grid => {
  grid.addEventListener("pointerdown", (e) => beginSelection(e, grid, ".file-item", ".file-item"));
});

/* ---------- CRT EFFECT TOGGLE ---------- */
const crtToggleBtn = $("#crtToggleBtn");
if (crtToggleBtn) {
  crtToggleBtn.addEventListener("click", () => {
    if (isMobileLayout()) {
      document.body.classList.remove("crt-on");
      return;
    }
    document.body.classList.toggle("crt-on");
  });
}

/* ---------- FULLSCREEN TOGGLE ---------- */
const fullscreenBtn = $("#fullscreenBtn");
if (fullscreenBtn) {
  fullscreenBtn.addEventListener("click", () => {
    if (isMobileLayout()) return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });
}

/* ---------- COMING SOON DIALOG ---------- */
const comingSoonDialog = $("#comingSoonDialog");
function showComingSoon(name){
  if (!comingSoonDialog) return;
  const heading = $("#csHeading");
  const message = $("#csMessage");
  const title   = $("#csTitleText");
  if (name) {
    if (heading) heading.textContent = `${name} — Coming Soon`;
    if (message) message.textContent = `${name} isn't available yet. I'm still working on it — check back in a future update.`;
    if (title)   title.textContent   = `${name}`;
  } else {
    if (heading) heading.textContent = "Coming Soon";
    if (message) message.textContent = "This feature isn't available yet. Check back in a future update.";
    if (title)   title.textContent   = "Coming Soon";
  }
  comingSoonDialog.classList.remove("hidden");
  playSound("click");
}
function hideComingSoon(){ comingSoonDialog?.classList.add("hidden"); }
$("#csClose")?.addEventListener("click", hideComingSoon);
$("#csOk")?.addEventListener("click", hideComingSoon);
comingSoonDialog?.addEventListener("click", (e) => {
  if (e.target === comingSoonDialog) hideComingSoon();
});

/* ---------- ALL PROGRAMS FLYOUT ---------- */
const allProgramsBtn = $("#allProgramsBtn");
const allProgramsFlyout = $("#allProgramsFlyout");
function positionAllProgramsFlyout(){
  if (!allProgramsFlyout || !allProgramsBtn) return;
  const startRect = startMenu.getBoundingClientRect();
  if (isMobileLayout()){
    const inset = 8;
    const top = Math.max(8, startRect.top + 64);
    const bottom = Math.max(40, window.innerHeight - startRect.bottom + 48);
    allProgramsFlyout.style.left = `${startRect.left + inset}px`;
    allProgramsFlyout.style.right = `${Math.max(inset, window.innerWidth - startRect.right + inset)}px`;
    allProgramsFlyout.style.top = `${top}px`;
    allProgramsFlyout.style.bottom = `${bottom}px`;
    allProgramsFlyout.style.maxHeight = "none";
  } else {
    const btnRect = allProgramsBtn.getBoundingClientRect();
    allProgramsFlyout.style.left = `${startRect.right - 4}px`;
    allProgramsFlyout.style.right = "auto";
    allProgramsFlyout.style.top = "auto";
    allProgramsFlyout.style.bottom = `${window.innerHeight - btnRect.bottom}px`;
    allProgramsFlyout.style.maxHeight = `${Math.min(window.innerHeight - 60, 480)}px`;
  }
}
function openAllPrograms(){
  if (!allProgramsFlyout) return;
  allProgramsFlyout.classList.remove("hidden");
  allProgramsBtn?.setAttribute("aria-expanded", "true");
  positionAllProgramsFlyout();
}
function closeAllPrograms(){
  allProgramsFlyout?.classList.add("hidden");
  allProgramsBtn?.setAttribute("aria-expanded", "false");
}
allProgramsBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (allProgramsFlyout?.classList.contains("hidden")) openAllPrograms();
  else closeAllPrograms();
});
allProgramsBtn?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    allProgramsBtn.click();
  }
});
allProgramsFlyout?.addEventListener("click", (e) => {
  const btn = e.target.closest(".xp-fly-item");
  if (!btn) return;
  if (btn.dataset.coming) {
    closeAllPrograms();
    closeStartMenu();
    showComingSoon(btn.dataset.coming);
    return;
  }
  if (btn.dataset.open) {
    closeAllPrograms();
    closeStartMenu();
    openWin(btn.dataset.open);
    if (btn.dataset.modeOpen) setMediaMode(btn.dataset.modeOpen);
    playSound("click");
  }
});
document.addEventListener("click", (e) => {
  if (allProgramsFlyout && !allProgramsFlyout.classList.contains("hidden")) {
    if (!allProgramsFlyout.contains(e.target) && e.target !== allProgramsBtn && !allProgramsBtn.contains(e.target)) {
      closeAllPrograms();
    }
  }
});
window.addEventListener("resize", () => {
  if (allProgramsFlyout && !allProgramsFlyout.classList.contains("hidden")) positionAllProgramsFlyout();
  if (document.getElementById("win-resume")?.classList.contains("active")) {
    window.clearTimeout(window.resumeResizeTimer);
    window.resumeResizeTimer = window.setTimeout(renderResumePdfPreview, 120);
  }
});

/* ---------- WINDOWS MEDIA PLAYER (unified audio + video) ---------- */
const mediaPlaylists = {
  audio: [
    { title: "50 Cent - In Da Club", sub: "Local MP3 - 128k", src: "assets/media/music/50-cent-in-da-club.mp3" },
    { title: "Eminem - Lose Yourself", sub: "Local MP3 - 128k", src: "assets/media/music/eminem-lose-yourself.mp3" },
    { title: "Nelly - Hot In Herre", sub: "Local MP3 - 64k", src: "assets/media/music/nelly-hot-in-herre.mp3" },
    { title: "50 Cent ft. Olivia - Candy Shop", sub: "Local MP3 - 128k", src: "assets/media/music/50-cent-candy-shop.mp3" },
    { title: "Survivor - Eye Of The Tiger", sub: "Local MP3 - 128k", src: "assets/media/music/survivor-eye-of-the-tiger.mp3" },
  ],
  video: [
    { title: "Khvicha Kvaratskhelia - The Georgian Magic", sub: "Local MP4 - 720p", src: "assets/media/videos/khvicha-kvaratskhelia-highlights.mp4" },
    { title: "Ilia Topuria - HIGHLIGHTS EL MATADOR", sub: "Local MP4 - 1080p", src: "assets/media/videos/ilia-topuria-highlights.mp4" },
    { title: "Merab Dvalishvili Highlights - THE MACHINE", sub: "Local MP4 - 1080p", src: "assets/media/videos/merab-dvalishvili-highlights.mp4" },
  ],
};
const mediaState = { mode: "audio", idx: { audio: -1, video: -1 } };
const mediaAudio = $("#wmpAudioEl");
const mediaVideo = $("#wmvVideo");
if (mediaAudio) mediaAudio.volume = 0.7;
if (mediaVideo) { mediaVideo.volume = 0.7; mediaVideo.preload = "metadata"; }

function fmtTime(s){
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}
function mediaEl(mode){ return mode === "video" ? mediaVideo : mediaAudio; }
function currentMedia(){ return mediaEl(mediaState.mode); }
function currentList(){  return mediaPlaylists[mediaState.mode]; }
function currentIdx(){   return mediaState.idx[mediaState.mode]; }
function setCurrentIdx(i){ mediaState.idx[mediaState.mode] = i; }

function renderMediaList(){
  const list = $("#wmpList");
  if (!list) return;
  const items  = currentList();
  const active = currentIdx();
  const playing = currentMedia() && !currentMedia().paused && active >= 0;
  list.innerHTML = items.map((t, i) => `
    <button class="wmp-row ${i === active ? "playing" : ""}" data-idx="${i}" role="option">
      <span class="wmp-row-n">${i+1}</span>
      <span class="wmp-row-meta">
        <span class="wmp-row-title">${escapeHtml(t.title)}</span>
        <span class="wmp-row-sub">${escapeHtml(t.sub)}</span>
      </span>
      <span class="wmp-row-play">${i === active && playing ? "\u25B6" : ""}</span>
    </button>
  `).join("");
  list.querySelectorAll(".wmp-row").forEach(row => {
    row.addEventListener("click", () => mediaPlayIndex(+row.dataset.idx));
  });
}

function setMediaMode(mode){
  if (mode !== "audio" && mode !== "video") return;
  const sameMode = mediaState.mode === mode;
  // pause current element before switching
  const prev = currentMedia();
  if (!sameMode && prev && !prev.paused) prev.pause();
  mediaState.mode = mode;
  $("#win-media")?.classList.toggle("audio-mode", mode === "audio");
  $("#win-media")?.classList.toggle("video-mode", mode === "video");
  const windowTitle = mode === "video" ? "Media Player" : "Music Player";
  const titleNode = $("#mediaWindowTitle");
  if (titleNode) titleNode.textContent = windowTitle;
  const win = $("#win-media");
  if (win) win.dataset.title = windowTitle;
  const taskLabel = document.querySelector('.taskbar-item[data-win="win-media"] span');
  if (taskLabel) taskLabel.textContent = windowTitle;
  $$(".wmp-tab").forEach(t => {
    const on = t.dataset.mode === mode;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", on ? "true" : "false");
  });
  const visual = $("#wmpVisual");
  const stage  = $("#wmvStage");
  if (mode === "audio") {
    visual?.classList.remove("hidden");
    stage?.classList.add("hidden");
  } else {
    visual?.classList.add("hidden");
    stage?.classList.remove("hidden");
  }
  const modeLabel = $("#wmpMode");
  if (modeLabel) modeLabel.textContent = mode === "video" ? "Video" : "Music";
  // restore display state of the now-active element
  const active = currentMedia();
  if (active) {
    updateMediaProgress();
    $("#wmpDuration").textContent = fmtTime(active.duration || 0);
    $("#wmpPlay").textContent = active.paused ? "\u25B6" : "\u23F8";
    if (mode === "video") {
      const idx = currentIdx();
      $("#wmvVideo").style.display = idx >= 0 ? "block" : "none";
      $("#wmvEmpty").style.display = idx >= 0 ? "none" : "flex";
      $("#wmpArt")?.classList.remove("spinning");
    } else {
      if (!active.paused) $("#wmpArt")?.classList.add("spinning");
      else $("#wmpArt")?.classList.remove("spinning");
      const idx = currentIdx();
      if (idx >= 0) {
        const t = currentList()[idx];
        $("#wmpTitle").textContent = t.title;
        $("#wmpSub").textContent   = t.sub;
      }
    }
  }
  if (currentIdx() < 0) {
    $("#wmpCurrent").textContent = "0:00";
    $("#wmpDuration").textContent = "0:00";
    $("#wmpPlay").textContent = "\u25B6";
    $("#wmpStatus").textContent = "Ready";
    if (mode === "audio") {
      $("#wmpTitle").textContent = "Nothing playing";
      $("#wmpSub").textContent = "Select a track from the playlist";
    }
  } else {
    const t = currentList()[currentIdx()];
    $("#wmpStatus").textContent = active && !active.paused ? `Playing - ${t.title}` : "Ready";
  }
  renderMediaList();
}

function mediaPlayIndex(i){
  const el = currentMedia();
  const items = currentList();
  if (!el || i < 0 || i >= items.length) return;
  setCurrentIdx(i);
  const t = items[i];
  el.src = t.src;
  $("#wmpStatus").textContent = "Buffering...";
  if (mediaState.mode === "audio") {
    $("#wmpTitle").textContent = t.title;
    $("#wmpSub").textContent   = t.sub;
  } else {
    $("#wmvVideo").style.display = "block";
    $("#wmvVideo").classList.add("playing");
    $("#wmvEmpty").style.display = "none";
  }
  el.play().then(() => {
    $("#wmpStatus").textContent = `Playing - ${t.title}`;
    $("#wmpPlay").textContent = "\u23F8";
    if (mediaState.mode === "audio") $("#wmpArt")?.classList.add("spinning");
  }).catch(() => {
    $("#wmpStatus").textContent = "Unable to play — check connection";
  });
  renderMediaList();
}

function mediaTogglePlay(){
  const el = currentMedia();
  if (!el) return;
  if (currentIdx() < 0) { mediaPlayIndex(0); return; }
  if (el.paused) {
    el.play().catch(() => {});
  } else {
    el.pause();
  }
}

function updateMediaProgress(){
  const el = currentMedia();
  const seek = $("#wmpSeek");
  if (!el || !seek || seek.dataset.seeking === "1") return;
  const pct = (el.currentTime / (el.duration || 1)) * 100;
  seek.value = isFinite(pct) ? pct : 0;
  $("#wmpCurrent").textContent = fmtTime(el.currentTime);
}

$$(".wmp-tab").forEach(tab => {
  tab.addEventListener("click", () => setMediaMode(tab.dataset.mode));
});
$("#wmpPlay")?.addEventListener("click", mediaTogglePlay);
$("#wmpPrev")?.addEventListener("click", () => {
  const n = currentList().length;
  mediaPlayIndex((currentIdx() - 1 + n) % n);
});
$("#wmpNext")?.addEventListener("click", () => {
  const n = currentList().length;
  mediaPlayIndex((currentIdx() + 1) % n);
});

[mediaAudio, mediaVideo].forEach(el => {
  if (!el) return;
  el.addEventListener("timeupdate", () => { if (el === currentMedia()) updateMediaProgress(); });
  el.addEventListener("loadedmetadata", () => {
    if (el === currentMedia()) $("#wmpDuration").textContent = fmtTime(el.duration);
  });
  el.addEventListener("ended", () => {
    if (el !== currentMedia()) return;
    const n = currentList().length;
    mediaPlayIndex((currentIdx() + 1) % n);
  });
  el.addEventListener("play", () => {
    if (el !== currentMedia()) return;
    $("#wmpPlay").textContent = "\u23F8";
    if (mediaState.mode === "audio") $("#wmpArt")?.classList.add("spinning");
  });
  el.addEventListener("pause", () => {
    if (el !== currentMedia()) return;
    $("#wmpPlay").textContent = "\u25B6";
    $("#wmpArt")?.classList.remove("spinning");
  });
  el.addEventListener("error", () => {
    if (el === currentMedia()) $("#wmpStatus").textContent = "Error loading media";
  });
});

const wmpSeek = $("#wmpSeek");
wmpSeek?.addEventListener("input", () => {
  const el = currentMedia();
  wmpSeek.dataset.seeking = "1";
  if (el && isFinite(el.duration)) {
    $("#wmpCurrent").textContent = fmtTime((wmpSeek.value / 100) * el.duration);
  }
});
wmpSeek?.addEventListener("change", () => {
  const el = currentMedia();
  if (el && isFinite(el.duration)) el.currentTime = (wmpSeek.value / 100) * el.duration;
  wmpSeek.dataset.seeking = "0";
});
const wmpVol = $("#wmpVol");
wmpVol?.addEventListener("input", () => {
  const v = +wmpVol.value;
  if (mediaAudio) { mediaAudio.volume = v; mediaAudio.muted = false; }
  if (mediaVideo) { mediaVideo.volume = v; mediaVideo.muted = false; }
  $("#wmpMute").textContent = v === 0 ? "\uD83D\uDD07" : "\uD83D\uDD0A";
});
$("#wmpMute")?.addEventListener("click", () => {
  const el = currentMedia();
  if (!el) return;
  el.muted = !el.muted;
  if (mediaAudio) mediaAudio.muted = el.muted;
  if (mediaVideo) mediaVideo.muted = el.muted;
  $("#wmpMute").textContent = el.muted ? "\uD83D\uDD07" : "\uD83D\uDD0A";
});
$("#wmpFs")?.addEventListener("click", () => {
  if (mediaState.mode !== "video" || !mediaVideo) {
    setMediaMode("video");
    return;
  }
  if (mediaVideo.requestFullscreen)        mediaVideo.requestFullscreen();
  else if (mediaVideo.webkitEnterFullscreen) mediaVideo.webkitEnterFullscreen();
});

renderMediaList();
setMediaMode("audio");

/* Pause media when the window closes/minimizes */
function pauseAllMedia(){
  if (mediaAudio && !mediaAudio.paused) mediaAudio.pause();
  if (mediaVideo && !mediaVideo.paused) mediaVideo.pause();
}
const _origClose = closeWin;
closeWin = function(id){ if (id === "win-media") pauseAllMedia(); _origClose(id); };
const _origMin = minimizeWin;
minimizeWin = function(id){ if (id === "win-media") pauseAllMedia(); _origMin(id); };

/* ---------- CLASSIC ACCESSORIES ---------- */
$("#notepadText")?.addEventListener("input", () => {
  const text = $("#notepadText").value;
  $("#notepadStatus").textContent = `${text.length} chars`;
});

const calcDisplay = $("#calcDisplay");
let calcExpr = "";
function updateCalc(value){ if (calcDisplay) calcDisplay.value = value || "0"; }
$("#calcGrid")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-calc]");
  if (!btn) return;
  const v = btn.dataset.calc;
  if (v === "C") calcExpr = "";
  else if (v === "back") calcExpr = calcExpr.slice(0, -1);
  else if (v === "=") {
    try {
      calcExpr = String(Function(`"use strict";return (${calcExpr || "0"})`)());
      if (!/^-?\d+(\.\d+)?$/.test(calcExpr)) calcExpr = "Error";
    } catch {
      calcExpr = "Error";
    }
  } else {
    if (calcExpr === "Error") calcExpr = "";
    if (/^[0-9+\-*/.]$/.test(v)) calcExpr += v;
  }
  updateCalc(calcExpr);
});

const paintCanvas = $("#paintCanvas");
const paintCtx = paintCanvas?.getContext("2d");
let paintColor = "#000000";
let painting = false;
function initPaint(){
  if (!paintCtx || paintCanvas.dataset.ready) return;
  paintCtx.fillStyle = "#ffffff";
  paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
  paintCtx.lineCap = "round";
  paintCtx.lineJoin = "round";
  paintCanvas.dataset.ready = "1";
  $("#paintColors button")?.classList.add("active");
}
function paintPoint(e){
  const r = paintCanvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * paintCanvas.width,
    y: ((e.clientY - r.top) / r.height) * paintCanvas.height,
  };
}
paintCanvas?.addEventListener("pointerdown", (e) => {
  initPaint();
  painting = true;
  paintCanvas.setPointerCapture(e.pointerId);
  const p = paintPoint(e);
  paintCtx.beginPath();
  paintCtx.moveTo(p.x, p.y);
});
paintCanvas?.addEventListener("pointermove", (e) => {
  if (!painting) return;
  const p = paintPoint(e);
  paintCtx.strokeStyle = paintColor;
  paintCtx.lineWidth = +$("#paintSize").value || 6;
  paintCtx.lineTo(p.x, p.y);
  paintCtx.stroke();
});
["pointerup", "pointercancel", "pointerleave"].forEach(type => {
  paintCanvas?.addEventListener(type, () => { painting = false; });
});
$("#paintColors")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-color]");
  if (!btn) return;
  paintColor = btn.dataset.color;
  $$("#paintColors button").forEach(b => b.classList.toggle("active", b === btn));
});
$("#paintClear")?.addEventListener("click", () => {
  initPaint();
  paintCtx.fillStyle = "#ffffff";
  paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
});
initPaint();

function dealSolitaire(){
  const table = $("#solitaireTable");
  if (!table) return;
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck = suits.flatMap(s => ranks.map(r => ({ r, s, red: s === "♥" || s === "♦" })));
  deck.sort(() => Math.random() - 0.5);
  table.innerHTML = "";
  for (let c = 0; c < 7; c++) {
    const col = document.createElement("div");
    col.className = "sol-col";
    for (let n = 0; n <= c; n++) {
      const card = deck.pop();
      const el = document.createElement("div");
      const faceUp = n === c;
      el.className = `sol-card ${faceUp && card.red ? "red" : ""} ${faceUp ? "" : "back"}`;
      el.textContent = faceUp ? `${card.r}${card.s}` : "";
      col.appendChild(el);
    }
    table.appendChild(col);
  }
  $("#solStatus").textContent = "New deal ready.";
}
$("#solDeal")?.addEventListener("click", dealSolitaire);
dealSolitaire();

const mine = { rows: 9, cols: 9, bombs: 10, cells: [], started: false, done: false, timer: 0, int: null };
function resetMines(){
  mine.cells = Array.from({ length: mine.rows * mine.cols }, (_, i) => ({ i, bomb: false, open: false, flag: false, n: 0 }));
  mine.started = false; mine.done = false; mine.timer = 0;
  clearInterval(mine.int); mine.int = null;
  $("#mineTimer").textContent = "000";
  $("#mineCount").textContent = String(mine.bombs).padStart(3, "0");
  $("#mineReset").textContent = ":)";
  renderMines();
}
function neighbors(i){
  const r = Math.floor(i / mine.cols), c = i % mine.cols, out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < mine.rows && cc >= 0 && cc < mine.cols) out.push(rr * mine.cols + cc);
  }
  return out;
}
function placeMines(safe){
  const pool = mine.cells.map(c => c.i).filter(i => i !== safe);
  pool.sort(() => Math.random() - 0.5);
  pool.slice(0, mine.bombs).forEach(i => { mine.cells[i].bomb = true; });
  mine.cells.forEach(c => { c.n = neighbors(c.i).filter(n => mine.cells[n].bomb).length; });
}
function renderMines(){
  const grid = $("#mineGrid");
  if (!grid) return;
  grid.innerHTML = mine.cells.map(c => {
    const text = c.open ? (c.bomb ? "*" : (c.n || "")) : (c.flag ? "!" : "");
    return `<button class="mine-cell ${c.open ? "open" : ""} ${c.flag ? "flag" : ""} ${c.open && c.n ? `n${c.n}` : ""}" data-mine="${c.i}">${text}</button>`;
  }).join("");
}
function openMine(i){
  const c = mine.cells[i];
  if (!c || c.open || c.flag || mine.done) return;
  if (!mine.started) {
    mine.started = true;
    placeMines(i);
    mine.int = setInterval(() => {
      mine.timer = Math.min(999, mine.timer + 1);
      $("#mineTimer").textContent = String(mine.timer).padStart(3, "0");
    }, 1000);
  }
  c.open = true;
  if (c.bomb) {
    mine.done = true;
    clearInterval(mine.int);
    mine.cells.forEach(cell => { if (cell.bomb) cell.open = true; });
    $("#mineReset").textContent = ":(";
    renderMines();
    return;
  }
  if (c.n === 0) neighbors(i).forEach(openMine);
  const won = mine.cells.every(cell => cell.bomb || cell.open);
  if (won) {
    mine.done = true;
    clearInterval(mine.int);
    $("#mineReset").textContent = "B)";
  }
  renderMines();
}
$("#mineGrid")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-mine]");
  if (btn) openMine(+btn.dataset.mine);
});
$("#mineGrid")?.addEventListener("contextmenu", (e) => {
  const btn = e.target.closest("[data-mine]");
  if (!btn || mine.done) return;
  e.preventDefault();
  const c = mine.cells[+btn.dataset.mine];
  if (!c.open) c.flag = !c.flag;
  const flags = mine.cells.filter(cell => cell.flag).length;
  $("#mineCount").textContent = String(Math.max(0, mine.bombs - flags)).padStart(3, "0");
  renderMines();
});
$("#mineReset")?.addEventListener("click", resetMines);
resetMines();

/* ---------- CATCHCASH SCREENSHOT LIGHTBOX ---------- */
const ccLightbox = $("#ccLightbox");
function openCcLightbox(src, caption){
  if (!ccLightbox) return;
  $("#ccLbImg").src = src;
  $("#ccLbCaption").textContent = caption || "";
  ccLightbox.classList.remove("hidden");
}
function closeCcLightbox(){ ccLightbox?.classList.add("hidden"); }
$("#ccLbClose")?.addEventListener("click", closeCcLightbox);
ccLightbox?.addEventListener("click", (e) => {
  if (e.target === ccLightbox) closeCcLightbox();
});
document.addEventListener("click", (e) => {
  const shot = e.target.closest(".cc-shot");
  if (!shot) return;
  e.preventDefault();
  openCcLightbox(shot.dataset.shot, shot.dataset.caption);
});

/* APK download: if the file doesn't exist, explain politely */
$("#ccApkBtn")?.addEventListener("click", (e) => {
  fetch("assets/catchcash/catchcash.apk", { method: "HEAD" })
    .then(r => {
      if (!r.ok) throw new Error("missing");
    })
    .catch(() => {
      e.preventDefault();
      showComingSoon("CatchCash APK");
      const note = $("#ccApkNote");
      if (note) note.textContent = "Build pending — the APK will be available once the next release is ready.";
    });
});
