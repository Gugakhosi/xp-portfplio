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

function isMobileLayout(){
  return mobileMedia.matches;
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
  fitWindowToMobile(w);
  w.classList.add("active");
  w.style.display = "block";
  focusWin(id);
  closeStartMenu();
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
  if (!isMobileLayout()) return;
  $$(".window.active").forEach(fitWindowToMobile);
});

/* ---------- START MENU ---------- */
const startBtn = $("#startBtn");
function toggleStartMenu(){
  startMenu.classList.contains("hidden") ? openStartMenu() : closeStartMenu();
}
function openStartMenu(){
  startMenu.classList.remove("hidden");
  startBtn.classList.add("active");
  playSound("click");
}
function closeStartMenu(){
  startMenu.classList.add("hidden");
  startBtn.classList.remove("active");
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
  openCtxMenuAt(e.clientX, e.clientY);
});
document.addEventListener("click", closeCtxMenu);
function closeCtxMenu(){ ctxMenu.classList.add("hidden"); }
let touchCtxTimer = null;
let touchCtxStart = null;
desktop.addEventListener("touchstart", (e) => {
  if (e.target.closest(".window")) return;
  const touch = e.touches[0];
  if (!touch) return;
  touchCtxStart = { x: touch.clientX, y: touch.clientY };
  clearTimeout(touchCtxTimer);
  touchCtxTimer = setTimeout(() => {
    openCtxMenuAt(touchCtxStart.x, touchCtxStart.y);
    if (navigator.vibrate) navigator.vibrate(18);
  }, 520);
}, { passive: true });
desktop.addEventListener("touchmove", (e) => {
  if (!touchCtxStart || !e.touches[0]) return;
  const dx = Math.abs(e.touches[0].clientX - touchCtxStart.x);
  const dy = Math.abs(e.touches[0].clientY - touchCtxStart.y);
  if (dx > 10 || dy > 10) clearTimeout(touchCtxTimer);
}, { passive: true });
["touchend", "touchcancel"].forEach(type => {
  desktop.addEventListener(type, () => {
    clearTimeout(touchCtxTimer);
    touchCtxTimer = null;
    touchCtxStart = null;
  }, { passive: true });
});
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
  start(args){ const m = { about:"win-about", projects:"win-projects", resume:"win-resume", contact:"win-contact", skills:"win-skills", cmd:"win-cmd", explorer:"win-mycomputer", documents:"win-documents", network:"win-network", links:"win-network", internet:"win-internet", iexplore:"win-internet", browser:"win-internet", viewer:"win-viewer" }; const w = m[(args[0] || "").toLowerCase()]; if (w){ openWin(w); cmdWrite(`Starting ${escapeHtml(args[0])}...`); } else cmdWrite(`Unknown app: ${escapeHtml(args[0] || "")}`); },
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
let selBox = null, selStart = null;
desktop.addEventListener("mousedown", (e) => {
  if (e.target !== desktop) return;
  selStart = { x: e.clientX, y: e.clientY };
  selBox = document.createElement("div");
  selBox.className = "select-box";
  desktop.appendChild(selBox);
});
document.addEventListener("mousemove", (e) => {
  if (!selBox || !selStart) return;
  const x = Math.min(selStart.x, e.clientX);
  const y = Math.min(selStart.y, e.clientY);
  const w = Math.abs(e.clientX - selStart.x);
  const h = Math.abs(e.clientY - selStart.y);
  selBox.style.left = `${x}px`;
  selBox.style.top  = `${y}px`;
  selBox.style.width  = `${w}px`;
  selBox.style.height = `${h}px`;
});
document.addEventListener("mouseup", () => {
  if (selBox) selBox.remove();
  selBox = null; selStart = null;
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
