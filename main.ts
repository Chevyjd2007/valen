type DragState = {
  active: boolean;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
};

const body = document.body;
const pookieName = body.dataset.pookie ?? "Pookie";
const nameTargets = document.querySelectorAll<HTMLElement>("[data-pookie-name]");
nameTargets.forEach((el) => {
  el.textContent = pookieName;
});

const overlay = document.querySelector<HTMLElement>(".overlay");
const yesButton = document.querySelector<HTMLButtonElement>("[data-yes]");
const noButton = document.querySelector<HTMLButtonElement>("[data-no]");
const closeButton = document.querySelector<HTMLButtonElement>("[data-close]");

const heartLayer = document.querySelector<HTMLElement>(".heart-layer");
const sparkleLayer = document.querySelector<HTMLElement>(".sparkle-layer");

const meter = document.querySelector<HTMLInputElement>("[data-love-meter]");
const meterValue = document.querySelector<HTMLElement>("[data-love-value]");

const messageInput = document.querySelector<HTMLTextAreaElement>(
  "[data-message-input]"
);
const messageOutput = document.querySelector<HTMLElement>(
  "[data-message-output]"
);
const noHoverSound = document.querySelector<HTMLAudioElement>("#no-hover-sound");
const yesClickSound = document.querySelector<HTMLAudioElement>("#yes-click-sound");
const kissOverlay = document.querySelector<HTMLElement>(".kiss-overlay");

let noDodgeCount = 0;
const noResponses = [
  "Not a chance",
  "Ok but why :(",
  "You wound me",
  "Sad violin noises",
  "Ouch, my tiny heart",
  "I'm just a button",
  "Consider my feelings",
  "Now I'm sulking",
  "That stung a bit",
  "Emotionally damaged",
];
let noButtonPlaced = false;
let audioReady = false;
let audioCtx: AudioContext | null = null;

const ensureAudio = () => {
  if (audioReady) return;
  audioCtx = new AudioContext();
  audioReady = true;
};

const playChime = (notes: number[]) => {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  notes.forEach((frequency, index) => {
    const osc = audioCtx!.createOscillator();
    const gain = audioCtx!.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, now + index * 0.08);
    gain.gain.linearRampToValueAtTime(0.12, now + index * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx!.destination);
    osc.start(now + index * 0.08);
    osc.stop(now + index * 0.08 + 0.6);
  });
};

const dodgeButton = (cursorX?: number, cursorY?: number) => {
  if (!noButton) return;
  noDodgeCount += 1;
  noButton.classList.add("btn-flee");
  if (!noButtonPlaced) {
    const rect = noButton.getBoundingClientRect();
    noButton.style.left = `${rect.left}px`;
    noButton.style.top = `${rect.top}px`;
    noButtonPlaced = true;
  }
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const buttonRect = noButton.getBoundingClientRect();
  const safePadding = 24;
  const maxLeft = Math.max(safePadding, viewportWidth - buttonRect.width - safePadding);
  const maxTop = Math.max(safePadding, viewportHeight - buttonRect.height - safePadding);
  const targetX = cursorX ?? viewportWidth / 2;
  const targetY = cursorY ?? viewportHeight / 2;

  let nextLeft = Math.random() * maxLeft;
  let nextTop = Math.random() * maxTop;
  let attempts = 0;

  while (
    Math.hypot(nextLeft - targetX, nextTop - targetY) < 220 &&
    attempts < 6
  ) {
    nextLeft = Math.random() * maxLeft;
    nextTop = Math.random() * maxTop;
    attempts += 1;
  }

  noButton.style.left = `${nextLeft}px`;
  noButton.style.top = `${nextTop}px`;
  noButton.style.transform = `rotate(${noDodgeCount % 2 === 0 ? 6 : -6}deg)`;
  const responseIndex = Math.min(noResponses.length - 1, noDodgeCount - 1);
  noButton.textContent = noResponses[responseIndex];
  playChime([392, 523, 659]);
};

window.addEventListener("pointermove", (event) => {
  if (!noButton) return;
  const rect = noButton.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
  if (distance < 140) {
    dodgeButton(event.clientX, event.clientY);
  }
});

noButton?.addEventListener("pointerenter", () => {
  if (!noHoverSound) return;
  noHoverSound.currentTime = 0;
  noHoverSound.play().catch(() => {});
});

noButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  dodgeButton(event.clientX, event.clientY);
});

yesButton?.addEventListener("click", () => {
  if (yesClickSound) {
    yesClickSound.currentTime = 0;
    yesClickSound.play().catch(() => {});
  }
  kissOverlay?.classList.add("show");
  kissOverlay?.setAttribute("aria-hidden", "false");
  overlay?.classList.add("show");
  overlay?.setAttribute("aria-hidden", "false");
  playChime([659, 784, 988]);
});

closeButton?.addEventListener("click", () => {
  overlay?.classList.remove("show");
  overlay?.setAttribute("aria-hidden", "true");
});

const updateMeter = () => {
  if (!meter || !meterValue) return;
  const value = Number(meter.value);
  const labels = [
    "Soft sparks",
    "Sweet crush",
    "Cosmic crush",
    "Universe in bloom",
    "Head over heels",
  ];
  const labelIndex = Math.min(labels.length - 1, Math.floor(value / 25));
  meterValue.textContent = labels[labelIndex];
  document.documentElement.style.setProperty("--meter", `${value}%`);
  playChime([523, 659]);
};

meter?.addEventListener("input", updateMeter);
updateMeter();

messageInput?.addEventListener("input", () => {
  if (!messageOutput) return;
  const text = messageInput.value.trim();
  messageOutput.textContent = text.length > 0 ? text : "Pookie, I love the way you...";
});

window.addEventListener("pointerdown", () => {
  ensureAudio();
});

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const spawnHeart = () => {
  if (!heartLayer || prefersReducedMotion) return;
  const heart = document.createElement("div");
  heart.className = "floating-heart";
  heart.textContent = "<3";
  heart.style.left = `${Math.random() * 100}%`;
  heart.style.fontSize = `${16 + Math.random() * 24}px`;
  heart.style.animationDuration = `${4 + Math.random() * 4}s`;
  heartLayer.appendChild(heart);
  setTimeout(() => heart.remove(), 7000);
};

setInterval(spawnHeart, 1200);

let lastSparkle = 0;
window.addEventListener("pointermove", (event) => {
  if (!sparkleLayer || prefersReducedMotion) return;
  const now = performance.now();
  if (now - lastSparkle < 40) return;
  lastSparkle = now;
  const sparkle = document.createElement("div");
  sparkle.className = "sparkle";
  sparkle.style.left = `${event.clientX}px`;
  sparkle.style.top = `${event.clientY}px`;
  sparkleLayer.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 1600);
});

const setupDrag = (element: HTMLElement) => {
  const state: DragState = { active: false, offsetX: 0, offsetY: 0, startX: 0, startY: 0 };
  element.addEventListener("pointerdown", (event) => {
    state.active = true;
    state.startX = element.offsetLeft;
    state.startY = element.offsetTop;
    state.offsetX = event.clientX;
    state.offsetY = event.clientY;
    element.setPointerCapture(event.pointerId);
    element.style.zIndex = "4";
  });
  element.addEventListener("pointermove", (event) => {
    if (!state.active) return;
    const dx = event.clientX - state.offsetX;
    const dy = event.clientY - state.offsetY;
    element.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx / 24}deg)`;
  });
  element.addEventListener("pointerup", (event) => {
    state.active = false;
    element.releasePointerCapture(event.pointerId);
    element.style.zIndex = "";
  });
};

document.querySelectorAll<HTMLElement>("[data-drag]").forEach((element) => {
  setupDrag(element);
});
