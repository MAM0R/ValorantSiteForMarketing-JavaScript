/* ==========================================================================
   1. ЗВУКОВОЙ ДВИЖОК UI (WEB AUDIO API)
   ========================================================================== */
let soundEnabled = true;
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playUiSound(type = "click") {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === "beep") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(750, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "rankup") {
      const freqs = [440, 554.37, 659.25, 880];
      freqs.forEach((freq, idx) => {
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = "sine";
        subOsc.frequency.setValueAtTime(freq, now + idx * 0.07);
        subGain.gain.setValueAtTime(0.15, now + idx * 0.07);
        subGain.gain.exponentialRampToValueAtTime(
          0.001,
          now + idx * 0.07 + 0.18,
        );
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now + idx * 0.07);
        subOsc.stop(now + idx * 0.07 + 0.18);
      });
    }
  } catch (e) {}
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const onIcon = document.getElementById("soundOnIcon");
  const offIcon = document.getElementById("soundOffIcon");
  if (onIcon && offIcon) {
    if (soundEnabled) {
      onIcon.classList.remove("hidden");
      offIcon.classList.add("hidden");
    } else {
      onIcon.classList.add("hidden");
      offIcon.classList.remove("hidden");
    }
  }
  if (soundEnabled) {
    playUiSound("click");
    showToast("Звуковые эффекты включены");
  } else {
    showToast("Звуковые эффекты отключены");
  }
}

/* ==========================================================================
   2. 3D TILT PARALLAX НА КАРТОЧКАХ (ГОЛОГРАФИЧЕСКИЙ ЭФФЕКТ)
   ========================================================================== */
function initTiltEffect() {
  const cards = document.querySelectorAll(".card-hover");
  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -9;
      const rotateY = ((x - centerX) / centerX) * 9;
      card.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

/* ==========================================================================
   3. АНИМАЦИЯ СЧЁТЧИКОВ (COUNT-UP)
   ========================================================================== */
function initCounters() {
  const counters = document.querySelectorAll(".counter");
  let animated = false;

  function run() {
    if (animated) return;
    const hero = document.getElementById("hero");
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom >= 0) {
      animated = true;
      counters.forEach((counter) => {
        const target = parseInt(counter.getAttribute("data-target"), 10) || 0;
        const prefix = counter.getAttribute("data-prefix") || "";
        const suffix = counter.getAttribute("data-suffix") || "";
        let current = 0;
        const step = Math.max(1, Math.ceil(target / 25));
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          counter.textContent = `${prefix}${current}${suffix}`;
        }, 30);
      });
    }
  }

  window.addEventListener("scroll", run, { passive: true });
  run();
}

/* ==========================================================================
   4. SCROLLSPY (ПОДСВЕТКА АКТИВНОГО ПУНКТА МЕНЮ)
   ========================================================================== */
function initScrollSpy() {
  const sections = ["kovaak", "range", "deathmatch", "progress"];
  const links = document.querySelectorAll("#topNav a[data-nav]");

  window.addEventListener(
    "scroll",
    () => {
      let current = "";
      const scrollPos = window.scrollY + 160;

      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          current = id;
        }
      });

      links.forEach((link) => {
        if (link.getAttribute("data-nav") === current) {
          link.classList.add(
            "text-white",
            "border-b-2",
            "border-[#ff4655]",
            "pb-1",
          );
        } else {
          link.classList.remove(
            "text-white",
            "border-b-2",
            "border-[#ff4655]",
            "pb-1",
          );
        }
      });
    },
    { passive: true },
  );
}

/* ==========================================================================
   5. ИНТЕРАКТИВНЫЙ ХОЛСТ ПРИЦЕЛА (LIVE CROSSHAIR CANVAS)
   ========================================================================== */
const proCrosshairs = {
  TenZ: {
    color: "#00f0ff",
    innerLen: 4,
    innerOffset: 2,
    innerThick: 2,
    dot: false,
    label: "TenZ Style (Cyan 1-4-2-2)",
  },
  Aspas: {
    color: "#00f0ff",
    innerLen: 0,
    innerOffset: 0,
    innerThick: 0,
    dot: true,
    dotSize: 3,
    label: "Aspas Style (Cyan Dot)",
  },
  Demon1: {
    color: "#ffffff",
    innerLen: 0,
    innerOffset: 0,
    innerThick: 0,
    dot: true,
    dotSize: 2.5,
    label: "Demon1 Style (Clean White Dot)",
  },
  Chronicle: {
    color: "#10b981",
    innerLen: 4,
    innerOffset: 0,
    innerThick: 2,
    dot: false,
    label: "Chronicle Style (Green Box)",
  },
};

let currentCrosshairProfile = "TenZ";

function drawCrosshair() {
  const canvas = document.getElementById("crosshairCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.fillStyle = "#080b12";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 35, 0, Math.PI * 2);
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, canvas.height);
  ctx.moveTo(0, cy);
  ctx.lineTo(canvas.width, cy);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 70, 85, 0.2)";
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();

  const cfg = proCrosshairs[currentCrosshairProfile] || proCrosshairs.TenZ;
  ctx.fillStyle = cfg.color;
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;

  if (cfg.dot) {
    const s = cfg.dotSize || 3;
    ctx.strokeRect(cx - s / 2, cy - s / 2, s, s);
    ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
  } else {
    const l = cfg.innerLen;
    const o = cfg.innerOffset;
    const t = cfg.innerThick;

    ctx.strokeRect(cx - t / 2, cy - o - l, t, l);
    ctx.fillRect(cx - t / 2, cy - o - l, t, l);
    ctx.strokeRect(cx - t / 2, cy + o, t, l);
    ctx.fillRect(cx - t / 2, cy + o, t, l);
    ctx.strokeRect(cx - o - l, cy - t / 2, l, t);
    ctx.fillRect(cx - o - l, cy - t / 2, l, t);
    ctx.strokeRect(cx + o, cy - t / 2, l, t);
    ctx.fillRect(cx + o, cy - t / 2, l, t);
  }

  const lbl = document.getElementById("crosshairLabel");
  if (lbl) lbl.textContent = cfg.label;
}

/* ==========================================================================
   6. ТЕСТ РЕАКЦИИ (VALORANT REACTION BENCHMARK)
   ========================================================================== */
let reactionState = "idle";
let reactionTimer = null;
let reactionStartTime = 0;
let bestReactionTime = null;

function openReactionModal() {
  playUiSound("click");
  const modal = document.getElementById("reactionModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
    resetReactionState();
  }
}

function closeReactionModal() {
  playUiSound("click");
  clearTimeout(reactionTimer);
  resetReactionState();
  const modal = document.getElementById("reactionModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.style.overflow = "";
  }
}

function resetReactionState() {
  clearTimeout(reactionTimer);
  reactionState = "idle";
  const box = document.getElementById("reactionBox");
  const icon = document.getElementById("reactionIcon");
  const main = document.getElementById("reactionMainText");
  const sub = document.getElementById("reactionSubText");
  if (!box) return;

  box.className =
    "cursor-pointer select-none rounded-xl border-2 border-dashed border-neutral-700 bg-[#161a26] py-14 px-4 transition-all hover:border-[#00f0ff]";
  if (icon) icon.textContent = "🎯";
  if (main) {
    main.className = "font-heading text-lg font-bold text-white";
    main.textContent = "Кликните сюда для старта";
  }
  if (sub) {
    sub.className = "mt-1 text-xs text-neutral-400";
    sub.textContent =
      "Когда экран станет зелёным — кликайте как можно быстрее!";
  }
}

function handleReactionBoxClick() {
  const box = document.getElementById("reactionBox");
  const icon = document.getElementById("reactionIcon");
  const main = document.getElementById("reactionMainText");
  const sub = document.getElementById("reactionSubText");
  if (!box) return;

  if (reactionState === "idle" || reactionState === "clicked") {
    reactionState = "waiting";
    playUiSound("click");
    box.className =
      "cursor-pointer select-none rounded-xl border-2 border-[#ff4655] bg-[#ff4655]/20 py-14 px-4 transition-all";
    icon.textContent = "✋";
    main.className = "font-heading text-lg font-bold text-white";
    main.textContent = "ЖДИТЕ ЗЕЛЁНЫЙ СИГНАЛ...";
    sub.className = "mt-1 text-xs text-neutral-300";
    sub.textContent = "Не нажимайте раньше времени!";

    const delay = 1500 + Math.random() * 2500;
    reactionTimer = setTimeout(() => {
      reactionState = "ready";
      reactionStartTime = performance.now();
      playUiSound("beep");
      box.className =
        "cursor-pointer select-none rounded-xl border-2 border-emerald-400 bg-emerald-500 text-black py-14 px-4 transition-all shadow-2xl";
      icon.textContent = "⚡";
      main.textContent = "КЛИКАЙ СЕЙЧАС!";
      main.className = "font-heading text-2xl font-extrabold text-black";
      sub.textContent = "Быстрее!";
      sub.className = "mt-1 text-xs text-black/80 font-bold";
    }, delay);
  } else if (reactionState === "waiting") {
    clearTimeout(reactionTimer);
    reactionState = "idle";
    playUiSound("click");
    box.className =
      "cursor-pointer select-none rounded-xl border-2 border-amber-500 bg-amber-500/20 py-14 px-4 transition-all";
    icon.textContent = "⚠️";
    main.className = "font-heading text-lg font-bold text-amber-400";
    main.textContent = "Слишком рано! Фальстарт";
    sub.className = "mt-1 text-xs text-neutral-300";
    sub.textContent = "Кликните, чтобы попробовать ещё раз.";
  } else if (reactionState === "ready") {
    const ms = Math.round(performance.now() - reactionStartTime);
    reactionState = "clicked";
    playUiSound("rankup");
    triggerConfetti();

    if (!bestReactionTime || ms < bestReactionTime) {
      bestReactionTime = ms;
      const bEl = document.getElementById("reactionBestScore");
      if (bEl) bEl.textContent = `${ms} мс`;
    }

    let tier = "Iron/Bronze";
    if (ms < 175) tier = "Radiant / Pro VCT 👑";
    else if (ms < 195) tier = "Immortal ⚡";
    else if (ms < 220) tier = "Ascendant 🔥";
    else if (ms < 250) tier = "Diamond / Platinum ✨";
    else tier = "Gold / Silver";

    box.className =
      "cursor-pointer select-none rounded-xl border-2 border-[#00f0ff] bg-[#00f0ff]/10 py-14 px-4 transition-all";
    icon.textContent = "🏆";
    main.className = "font-heading text-xl font-extrabold text-white";
    main.textContent = `${ms} мс — Ранг: ${tier}`;
    sub.className = "mt-1 text-xs text-neutral-400";
    sub.textContent = "Отличный результат! Кликните, чтобы повторить замер.";
  }
}

/* ==========================================================================
   7. СЕРВИСНЫЕ ФУНКЦИИ (ТОАСТЫ, СКРОЛЛ, КОПИРОВАНИЕ, КОНФЕТТИ)
   ========================================================================== */
window.addEventListener(
  "scroll",
  () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    const bar = document.getElementById("scrollProgress");
    if (bar) bar.style.transform = `scaleX(${progress})`;
  },
  { passive: true },
);

let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toastMessage");
  if (!toast || !msg) return;
  msg.textContent = message;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(24px)";
  }, 3200);
}

function copyText(text, btnElement) {
  playUiSound("click");
  const onCopied = () => {
    showToast(`Скопировано: ${text}`);
    if (btnElement) {
      const originalText = btnElement.innerHTML;
      btnElement.classList.add("bg-emerald-600", "text-white");
      setTimeout(() => {
        btnElement.innerHTML = originalText;
        btnElement.classList.remove("bg-emerald-600", "text-white");
      }, 1800);
    }
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(text)
      .then(onCopied)
      .catch(() => {
        fallbackCopy(text, onCopied);
      });
  } else {
    fallbackCopy(text, onCopied);
  }
}

function fallbackCopy(text, cb) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    if (cb) cb();
  } catch (e) {
    showToast("Не удалось скопировать");
  }
}

const videoStates = {
  kovaakVideoIframe: { id: "Md9kkTt8o3s", muted: true },
  rangeVideoIframe: { id: "Md9kkTt8o3s", muted: true },
  dmVideoIframe: { id: "Md9kkTt8o3s", muted: true },
};

function copyCurrentVideoUrl(iframeId, btn) {
  playUiSound("click");
  const vidId = videoStates[iframeId]
    ? videoStates[iframeId].id
    : "Md9kkTt8o3s";
  const url = `https://www.youtube.com/watch?v=${vidId}`;
  copyText(url, btn);
}

function toggleMobileMenu() {
  playUiSound("click");
  const menu = document.getElementById("mobileMenu");
  if (menu) menu.classList.toggle("hidden");
}

function triggerConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  if (!canvas) return;
  canvas.classList.remove("hidden");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");
  const pieces = [];
  const colors = ["#ff4655", "#00f0ff", "#10b981", "#facc15", "#a855f7"];

  for (let i = 0; i < 70; i++) {
    pieces.push({
      x: canvas.width * (0.3 + Math.random() * 0.4),
      y: canvas.height * 0.6,
      w: 8 + Math.random() * 6,
      h: 12 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 14,
      vy: -10 - Math.random() * 10,
      angle: Math.random() * Math.PI * 2,
      va: (Math.random() - 0.5) * 0.2,
      alpha: 1,
    });
  }

  let animationFrame;
  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;
    for (let p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;
      p.angle += p.va;
      p.alpha -= 0.012;

      if (p.alpha > 0) {
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    }
    if (alive > 0) {
      animationFrame = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(animationFrame);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.classList.add("hidden");
    }
  }
  update();
}

/* ==========================================================================
   8. ИНТЕРАКТИВНЫЙ КАЛЕНДАРЬ И ПРОГРЕСС
   ========================================================================== */
const daysMeta = [
  { id: "mon", name: "Понедельник", short: "ПН", date: "День 1" },
  { id: "tue", name: "Вторник", short: "ВТ", date: "День 2" },
  { id: "wed", name: "Среда", short: "СР", date: "День 3" },
  { id: "thu", name: "Четверг", short: "ЧТ", date: "День 4" },
  { id: "fri", name: "Пятница", short: "ПТ", date: "День 5" },
  { id: "sat", name: "Суббота", short: "СБ", date: "День 6" },
  { id: "sun", name: "Воскресенье", short: "ВС", date: "День 7" },
];

let selectedDayId = "mon";
let calendarData = {
  mon: { kovaak: true, range: true, deathmatch: true },
  tue: { kovaak: true, range: true, deathmatch: true },
  wed: { kovaak: true, range: false, deathmatch: false },
  thu: { kovaak: false, range: false, deathmatch: false },
  fri: { kovaak: false, range: false, deathmatch: false },
  sat: { kovaak: false, range: false, deathmatch: false },
  sun: { kovaak: false, range: false, deathmatch: false },
};

try {
  const saved = localStorage.getItem("valorant_student_calendar");
  if (saved) calendarData = JSON.parse(saved);
} catch (e) {}

function saveCalendar() {
  try {
    localStorage.setItem(
      "valorant_student_calendar",
      JSON.stringify(calendarData),
    );
  } catch (e) {}
}

function renderCalendar() {
  const container = document.getElementById("calendarDaysList");
  if (!container) return;
  container.innerHTML = "";

  let fullyCompletedDays = 0;
  let streak = 0;
  let maxStreak = 0;
  let totalCompleted = 0;

  daysMeta.forEach((day) => {
    const d = calendarData[day.id] || {
      kovaak: false,
      range: false,
      deathmatch: false,
    };
    const count =
      (d.kovaak ? 1 : 0) + (d.range ? 1 : 0) + (d.deathmatch ? 1 : 0);
    totalCompleted += count;
    if (count === 3) {
      fullyCompletedDays++;
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else {
      streak = 0;
    }

    const isSelected = day.id === selectedDayId;
    const dotColor =
      count === 3
        ? "bg-emerald-400 animate-pulse"
        : count > 0
          ? "bg-amber-400"
          : "bg-neutral-600";
    const borderClass = isSelected
      ? "border-[#ff4655] bg-[#ff4655]/15 text-white ring-2 ring-[#ff4655]/40 shadow-lg"
      : "border-neutral-800 bg-[#0c0e14] text-neutral-400 hover:border-neutral-700 hover:text-white";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `flex flex-col items-center justify-center rounded-xl border p-3 transition-all ${borderClass}`;
    btn.onclick = () => selectCalendarDay(day.id);
    btn.innerHTML = `
      <span class="font-heading text-xs font-bold text-white">${day.short}</span>
      <span class="text-[11px] text-neutral-400">${day.date}</span>
      <div class="mt-2.5 flex items-center gap-1.5">
        <span class="h-2 w-2 rounded-full ${dotColor}"></span>
        <span class="font-mono text-[11px] font-bold text-neutral-300">${count}/3</span>
      </div>
    `;
    container.appendChild(btn);
  });

  const streakEl = document.getElementById("streakCount");
  const compEl = document.getElementById("completedDaysCount");
  const pctEl = document.getElementById("completedPct");
  if (streakEl) streakEl.textContent = maxStreak;
  if (compEl) compEl.textContent = fullyCompletedDays;
  if (pctEl) pctEl.textContent = Math.round((totalCompleted / 21) * 100);

  const currentMeta =
    daysMeta.find((d) => d.id === selectedDayId) || daysMeta[0];
  const curDrills = calendarData[selectedDayId] || {
    kovaak: false,
    range: false,
    deathmatch: false,
  };
  const curDone =
    (curDrills.kovaak ? 1 : 0) +
    (curDrills.range ? 1 : 0) +
    (curDrills.deathmatch ? 1 : 0);

  const titleEl = document.getElementById("selectedDayTitle");
  const progEl = document.getElementById("selectedDayProgress");
  if (titleEl)
    titleEl.textContent = `${currentMeta.name} (${currentMeta.date})`;
  if (progEl) progEl.textContent = `${curDone} из 3`;

  updateDrillCard("checkCardKovaak", "checkIconKovaak", curDrills.kovaak);
  updateDrillCard("checkCardRange", "checkIconRange", curDrills.range);
  updateDrillCard("checkCardDm", "checkIconDm", curDrills.deathmatch);
}

function updateDrillCard(cardId, iconId, isDone) {
  const card = document.getElementById(cardId);
  const icon = document.getElementById(iconId);
  if (!card || !icon) return;
  if (isDone) {
    card.className =
      "flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all border-emerald-500/50 bg-emerald-500/10 text-white shadow-md";
    icon.className =
      "h-5 w-5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs font-bold";
    icon.innerHTML = "✓";
  } else {
    card.className =
      "flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all border-neutral-800 bg-[#131622] text-neutral-400 hover:border-neutral-700";
    icon.className =
      "h-5 w-5 rounded-full border border-neutral-600 flex items-center justify-center";
    icon.innerHTML = "";
  }
}

function selectCalendarDay(dayId) {
  playUiSound("click");
  selectedDayId = dayId;
  renderCalendar();
}

function toggleDrill(drillKey) {
  playUiSound("click");
  if (!calendarData[selectedDayId]) {
    calendarData[selectedDayId] = {
      kovaak: false,
      range: false,
      deathmatch: false,
    };
  }
  calendarData[selectedDayId][drillKey] =
    !calendarData[selectedDayId][drillKey];
  saveCalendar();
  renderCalendar();
  const d = calendarData[selectedDayId];
  if (d.kovaak && d.range && d.deathmatch) {
    playUiSound("rankup");
    triggerConfetti();
    showToast("🔥 Все 3 этапа на день выполнены!");
  }
}

function completeAllDayDrills() {
  playUiSound("rankup");
  calendarData[selectedDayId] = { kovaak: true, range: true, deathmatch: true };
  saveCalendar();
  renderCalendar();
  triggerConfetti();
  showToast("🎉 Все 3 этапа на сегодня закрыты!");
}

function resetDayDrills() {
  playUiSound("click");
  calendarData[selectedDayId] = {
    kovaak: false,
    range: false,
    deathmatch: false,
  };
  saveCalendar();
  renderCalendar();
  showToast("День сброшен");
}

/* ==========================================================================
   9. ГРАФИК HEADSHOT RATE (%)
   ========================================================================== */
let hsData = [15, 19, 23, 27, 31, 36];

function renderHsChart() {
  const areaPath = document.getElementById("chartAreaPath");
  const linePath = document.getElementById("chartLinePath");
  const pointsGroup = document.getElementById("chartPointsGroup");
  if (!areaPath || !linePath || !pointsGroup) return;
  pointsGroup.innerHTML = "";

  const maxVal = Math.max(50, ...hsData);
  const points = hsData.map((val, idx) => {
    const x = 50 + idx * (500 / Math.max(1, hsData.length - 1));
    const y = 165 - (val / maxVal) * 135;
    return { x, y, val, day: idx * 5 + 1 };
  });

  const lineD = points.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`,
    "",
  );
  const areaD = `${lineD} L ${points[points.length - 1].x} 175 L ${points[0].x} 175 Z`;

  linePath.setAttribute("d", lineD);
  areaPath.setAttribute("d", areaD);

  points.forEach((p) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.innerHTML = `
      <circle cx="${p.x}" cy="${p.y}" r="5" fill="#0c0e14" stroke="#ff4655" stroke-width="3"></circle>
      <text x="${p.x}" y="${p.y - 12}" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="bold" font-family="monospace">${p.val}%</text>
      <text x="${p.x}" y="190" text-anchor="middle" fill="#71717a" font-size="10" font-family="monospace">День ${p.day}</text>
    `;
    pointsGroup.appendChild(g);
  });

  const recEl = document.getElementById("bestHsRecord");
  if (recEl) recEl.textContent = `${Math.max(...hsData)}% Headshot Rate`;
}

function addHsRecord(e) {
  e.preventDefault();
  playUiSound("rankup");
  const input = document.getElementById("newHsInput");
  if (!input) return;
  const val = parseFloat(input.value);
  if (!isNaN(val) && val >= 5 && val <= 100) {
    hsData.push(val);
    renderHsChart();
    triggerConfetti();
    showToast(`Добавлен новый замер: ${val}% HS Rate!`);
  }
}

/* ==========================================================================
   10. КАЛЬКУЛЯТОР SENS / eDPI
   ========================================================================== */
let currentDpi = 800;
let currentSens = 0.32;

function updateSensCalculations() {
  const edpi = Math.round(currentDpi * currentSens * 100) / 100;
  const cm360 =
    Math.round((360 / (currentDpi * currentSens * 0.07)) * 2.54 * 10) / 10;

  const edpiEl = document.getElementById("edpiResult");
  const cmEl = document.getElementById("cm360Result");
  const lbl = document.getElementById("sensValueLabel");
  const slider = document.getElementById("sensSlider");
  const customDpi = document.getElementById("customDpiInput");

  if (edpiEl) edpiEl.textContent = edpi;
  if (cmEl) cmEl.textContent = cm360;
  if (lbl) lbl.textContent = currentSens.toFixed(2);
  if (slider) slider.value = currentSens;
  if (customDpi && document.activeElement !== customDpi)
    customDpi.value = currentDpi;

  const catBadge = document.getElementById("edpiCategoryBadge");
  const verdict = document.getElementById("edpiVerdictText");
  const pad = document.getElementById("padRecommendation");
  if (!catBadge || !verdict || !pad) return;

  if (edpi < 180) {
    catBadge.textContent = "Ультра-низкая (Demon1 style)";
    verdict.textContent =
      "Феноменальная точность первой пули. Требует большой ковер (48x40+ см) и активную работу плечом.";
    pad.textContent =
      "Обязателен сверхбольшой ковер (XL: 48×40 см или Deskmat).";
  } else if (edpi <= 260) {
    catBadge.textContent = "Золотой стандарт VCT Pro (TenZ / Chronicle)";
    verdict.textContent =
      "Идеальный баланс между скоростью микро-фликов кистью и контролем прицела. Рекомендуется 70% игроков.";
    pad.textContent =
      "Подойдет стандартный игровой ковер (L: 40×35 см или XL: 48×40 см).";
  } else if (edpi <= 320) {
    catBadge.textContent = "Сбалансированная средне-высокая (Aspas style)";
    verdict.textContent =
      "Быстрые развороты на 180°, отличная динамика при стрейфах. Требует развитого пальцевого контроля.";
    pad.textContent = "Подойдет стандартный ковер (L: 40×35 см).";
  } else if (edpi <= 420) {
    catBadge.textContent = "Высокая чувствительность";
    verdict.textContent =
      "Быстрые флики, но выше риск промаха на дистанциях свыше 25 метров. Рекомендуется плотный коврик.";
    pad.textContent = "Хватит среднего коврика (M / L).";
  } else {
    catBadge.textContent = "Критически высокая чувствительность";
    verdict.textContent =
      "Чрезмерная сенса вызывает дрожание перекрестия. Настоятельно рекомендуем понизить до ~250 eDPI.";
    pad.textContent = "Рекомендуется понизить сенсу для стабильного прогресса.";
  }

  drawCrosshair();
}

function setDpi(val) {
  playUiSound("click");
  currentDpi = val;
  document.querySelectorAll(".dpi-btn").forEach((btn) => {
    if (parseInt(btn.textContent) === val) {
      btn.className =
        "dpi-btn active rounded-lg py-2 text-xs font-bold border border-[#ff4655] bg-[#ff4655]/20 text-white shadow";
    } else {
      btn.className =
        "dpi-btn rounded-lg py-2 text-xs font-bold border border-neutral-800 bg-[#0c0e14] text-neutral-400 hover:text-white";
    }
  });
  const customDpi = document.getElementById("customDpiInput");
  if (customDpi) customDpi.value = currentDpi;
  updateSensCalculations();
}

function onCustomDpiInput(val) {
  currentDpi = Math.max(100, parseInt(val) || 800);
  updateSensCalculations();
}

function onSensSliderInput(val) {
  currentSens = parseFloat(val);
  updateSensCalculations();
}

function applyProPreset(dpi, sens, proName = "TenZ") {
  playUiSound("click");
  currentCrosshairProfile = proName;
  setDpi(dpi);
  currentSens = sens;
  updateSensCalculations();
  showToast(`Применен пресет ${proName}: ${dpi} DPI, Sens ${sens}`);
}

/* ==========================================================================
   11. ТРЕНИРОВОЧНЫЙ ТАЙМЕР (35 МИНУТ)
   ========================================================================== */
const timerStages = [
  {
    title: "Этап 1: KovaaK Aim Trainer",
    time: 900,
    focus: "Кучность > 92%, без резких рывков",
    desc: "Изолированная отработка Pasu Small Reload и 1wall6targets TE. 100% фокус на точности и микро-доворотах.",
  },
  {
    title: "Этап 2: Стрельбище Valorant",
    time: 600,
    focus: "Стрельба только в полной остановке (0 velocity)",
    desc: "Отработка Counter-strafing (A-D) + 50 ботов со стрейфом + 30 ботов на Medium. Стрельба строго одиночными.",
  },
  {
    title: "Этап 3: Deathmatch БЕЗ звука",
    time: 600,
    focus: "Визуальный контакт и Crosshair Placement",
    desc: "2 игры в DM с выключенным звуком в наушниках. Только Sheriff и Vandal One-Taps. Прицел строго на высоте головы.",
  },
];

let currentTimerStage = 0;
let timerRemaining = timerStages[0].time;
let timerRunning = false;
let timerInterval = null;

function renderTimer() {
  const st = timerStages[currentTimerStage];
  const m = Math.floor(timerRemaining / 60);
  const s = timerRemaining % 60;
  const timeStr = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  const disp = document.getElementById("timerDisplay");
  const badge = document.getElementById("timerStageBadge");
  const focus = document.getElementById("timerStageFocus");
  const desc = document.getElementById("timerStageDesc");
  const maxLbl = document.getElementById("timerMaxLabel");
  const bar = document.getElementById("timerProgressBar");
  const pctLbl = document.getElementById("timerPctLabel");
  const toggleLbl = document.getElementById("timerToggleLabel");
  const btn = document.getElementById("timerToggleBtn");

  if (disp) disp.textContent = timeStr;
  if (badge) badge.textContent = st.title;
  if (focus) focus.textContent = st.focus;
  if (desc) desc.textContent = st.desc;
  if (maxLbl) maxLbl.textContent = `${Math.floor(st.time / 60)}:00`;

  const pct = Math.round(((st.time - timerRemaining) / st.time) * 100);
  if (bar) bar.style.width = `${pct}%`;
  if (pctLbl) pctLbl.textContent = `${pct}% завершено`;

  if (toggleLbl) toggleLbl.textContent = timerRunning ? "Пауза" : "Старт";
  if (btn) {
    if (timerRunning) {
      btn.className =
        "flex items-center gap-2 rounded-xl bg-amber-600 px-7 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg hover:bg-amber-500 transition-all";
    } else {
      btn.className =
        "flex items-center gap-2 rounded-xl bg-[#ff4655] px-7 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg hover:bg-[#ff5866] transition-all";
    }
  }

  for (let i = 0; i < 3; i++) {
    const tab = document.getElementById(`timerTab${i}`);
    if (tab) {
      if (i === currentTimerStage) {
        tab.className =
          "timer-tab active flex-1 min-w-[120px] rounded-lg border py-2 px-3 text-left transition-all border-[#ff4655] bg-[#ff4655]/10 text-white";
      } else {
        tab.className =
          "timer-tab flex-1 min-w-[120px] rounded-lg border py-2 px-3 text-left transition-all border-neutral-800 bg-[#141722] text-neutral-400 hover:border-neutral-700";
      }
    }
  }
}

function toggleTimer() {
  playUiSound("beep");
  timerRunning = !timerRunning;
  if (timerRunning) {
    timerInterval = setInterval(() => {
      if (timerRemaining > 0) {
        timerRemaining--;
        renderTimer();
      } else {
        clearInterval(timerInterval);
        timerRunning = false;
        playUiSound("rankup");
        triggerConfetti();
        if (currentTimerStage < 2) {
          showToast(
            `Этап ${currentTimerStage + 1} завершен! Переход к следующему`,
          );
          switchTimerStage(currentTimerStage + 1);
        } else {
          showToast("🏆 Тренировочный протокол 35 минут полностью завершен!");
          renderTimer();
        }
      }
    }, 1000);
  } else {
    clearInterval(timerInterval);
  }
  renderTimer();
}

function switchTimerStage(stageIdx) {
  playUiSound("click");
  clearInterval(timerInterval);
  timerRunning = false;
  currentTimerStage = stageIdx;
  timerRemaining = timerStages[stageIdx].time;
  renderTimer();
}

function resetTimer() {
  playUiSound("click");
  clearInterval(timerInterval);
  timerRunning = false;
  timerRemaining = timerStages[currentTimerStage].time;
  renderTimer();
  showToast("Таймер сброшен");
}

/* ==========================================================================
   12. МОДАЛЬНЫЕ ОКНА
   ========================================================================== */
function openModal(id) {
  playUiSound("click");
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove("hidden");
    el.classList.add("flex");
    document.body.style.overflow = "hidden";
  }
}

function closeModal(id) {
  playUiSound("click");
  if (id === "reactionModal") resetReactionState();
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("hidden");
    el.classList.remove("flex");
    document.body.style.overflow = "";
  }
}

function openSurveyModal() {
  openModal("surveyModal");
  const form = document.getElementById("surveyForm");
  const okView = document.getElementById("surveySuccessView");
  if (form) form.classList.remove("hidden");
  if (okView) okView.classList.add("hidden");
}
function closeSurveyModal() {
  closeModal("surveyModal");
}

function openSensModal() {
  openModal("sensModal");
  updateSensCalculations();
}
function closeSensModal() {
  closeModal("sensModal");
}

function openTimerModal() {
  openModal("timerModal");
  renderTimer();
}
function closeTimerModal() {
  closeModal("timerModal");
}

function handleSurveySubmit(e) {
  e.preventDefault();
  playUiSound("rankup");
  triggerConfetti();
  const form = document.getElementById("surveyForm");
  const okView = document.getElementById("surveySuccessView");
  if (form) form.classList.add("hidden");
  if (okView) okView.classList.remove("hidden");
  showToast("Анкета успешно принята!");
}

/* ==========================================================================
   13. ЭКСПОРТ В WINDOW И ИНИЦИАЛИЗАЦИЯ
   ========================================================================== */
window.toggleSound = toggleSound;
window.playUiSound = playUiSound;
window.openModal = openModal;
window.closeModal = closeModal;

window.openReactionModal = openReactionModal;
window.closeReactionModal = closeReactionModal;
window.handleReactionBoxClick = handleReactionBoxClick;

window.openSurveyModal = openSurveyModal;
window.closeSurveyModal = closeSurveyModal;
window.handleSurveySubmit = handleSurveySubmit;

window.openSensModal = openSensModal;
window.closeSensModal = closeSensModal;
window.setDpi = setDpi;
window.onCustomDpiInput = onCustomDpiInput;
window.onSensSliderInput = onSensSliderInput;
window.applyProPreset = applyProPreset;

window.openTimerModal = openTimerModal;
window.closeTimerModal = closeTimerModal;
window.switchTimerStage = switchTimerStage;
window.toggleTimer = toggleTimer;
window.resetTimer = resetTimer;

window.toggleMobileMenu = toggleMobileMenu;
window.copyText = copyText;
window.copyCurrentVideoUrl = copyCurrentVideoUrl;

window.selectCalendarDay = selectCalendarDay;
window.toggleDrill = toggleDrill;
window.completeAllDayDrills = completeAllDayDrills;
window.resetDayDrills = resetDayDrills;
window.addHsRecord = addHsRecord;

function initApp() {
  renderCalendar();
  renderHsChart();
  updateSensCalculations();
  renderTimer();
  initTiltEffect();
  initCounters();
  initScrollSpy();

  ["surveyModal", "sensModal", "timerModal", "reactionModal"].forEach((id) => {
    const modal = document.getElementById(id);
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal(id);
      });
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSurveyModal();
      closeSensModal();
      closeTimerModal();
      closeReactionModal();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
