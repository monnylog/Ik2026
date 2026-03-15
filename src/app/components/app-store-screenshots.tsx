import { useEffect, useRef, useState, useCallback } from "react";

/**
 * App Store Screenshot Generator
 * Renders 3 screenshots at 1284×2778px (iPhone 6.5" display)
 * and 2048×2732px (iPad 13" display)
 * using Canvas API to faithfully recreate the app screens.
 */

const W = 1284;
const H = 2778;

// iPad 13" display dimensions
const IPAD_W = 2048;
const IPAD_H = 2732;

// ── Color palette ──
const C = {
  bgDark: "#2B4440",
  bgDarkMid: "#3D524D",
  bgLight: "#F4EDE4",
  gold: "#C9A96E",
  goldBright: "#DDA15E",
  goldMuted: "#CDA88A",
  sage: "#7E9E78",
  blush: "#EDCBC8",
  periwinkle: "#8B96C4",
  cream: "#F4EDE4",
  textLight: "#F4EDE4",
  textDark: "#3A3D35",
  cardBg: "rgba(244,237,228,0.035)",
  border: "rgba(201,169,110,0.15)",
};

// ── Helper: rounded rect ──
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Helper: pill shape ──
function pill(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number
) {
  roundRect(ctx, x, y, w, h, h / 2);
}

// ── Helper: draw iOS status bar ──
function drawStatusBar(ctx: CanvasRenderingContext2D, dark: boolean) {
  const color = dark ? "rgba(244,237,228,0.8)" : "rgba(58,61,53,0.7)";
  const y = 54;

  // Time
  ctx.font = `600 ${46}px -apple-system, 'SF Pro Display', sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.fillText("9:41", 96, y + 38);

  // Dynamic Island (notch area)
  ctx.fillStyle = "#000";
  roundRect(ctx, W / 2 - 180, 30, 360, 108, 54);
  ctx.fill();

  // Signal bars
  const bx = W - 330;
  for (let i = 0; i < 4; i++) {
    const bh = 14 + i * 6;
    ctx.fillStyle = color;
    roundRect(ctx, bx + i * 22, y + 38 - bh, 14, bh, 3);
    ctx.fill();
  }

  // WiFi icon (simplified)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(W - 186, y + 22, 16, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();

  // Battery
  const batX = W - 130;
  const batY = y + 12;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  roundRect(ctx, batX, batY, 72, 30, 6);
  ctx.stroke();
  ctx.fillStyle = color;
  roundRect(ctx, batX + 4, batY + 4, 56, 22, 3);
  ctx.fill();
  // Battery cap
  roundRect(ctx, batX + 72, batY + 9, 6, 12, 2);
  ctx.fill();
}

// ── Helper: draw home indicator ──
function drawHomeIndicator(ctx: CanvasRenderingContext2D, dark: boolean) {
  const color = dark ? "rgba(244,237,228,0.25)" : "rgba(58,61,53,0.2)";
  ctx.fillStyle = color;
  roundRect(ctx, W / 2 - 200, H - 30, 400, 14, 7);
  ctx.fill();
}

// ── Helper: draw circle with emoji-like avatar ──
function drawAvatar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  bgColor: string, emoji: string, fontSize: number
) {
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, cx, cy + 4);
}

// ── Helper: draw a lock icon ──
function drawLockIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size * 0.14;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Shackle
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.15, size * 0.28, Math.PI, 0);
  ctx.stroke();

  // Body
  roundRect(ctx, cx - size * 0.36, cy - size * 0.08, size * 0.72, size * 0.56, size * 0.08);
  ctx.fill();
}

// ── Helper: draw chevron right ──
function drawChevron(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.2, cy - size * 0.35);
  ctx.lineTo(cx + size * 0.2, cy);
  ctx.lineTo(cx - size * 0.2, cy + size * 0.35);
  ctx.stroke();
}

// ══════════════════════════════════════════════════════════════
// SCREENSHOT 1: Login / Access Code Screen
// ══════════════════════════════════════════════════════════════
function drawLoginScreen(ctx: CanvasRenderingContext2D) {
  // ── Background ──
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#1E3330");
  bgGrad.addColorStop(0.5, "#2B4440");
  bgGrad.addColorStop(1, "#1E3330");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Ambient glows
  const glow1 = ctx.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.3, H * 0.2, 600);
  glow1.addColorStop(0, "rgba(201,169,110,0.06)");
  glow1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(W * 0.7, H * 0.35, 0, W * 0.7, H * 0.35, 500);
  glow2.addColorStop(0, "rgba(126,158,120,0.05)");
  glow2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  const glow3 = ctx.createRadialGradient(W * 0.5, H * 0.6, 0, W * 0.5, H * 0.6, 400);
  glow3.addColorStop(0, "rgba(139,150,196,0.04)");
  glow3.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow3;
  ctx.fillRect(0, 0, W, H);

  // Gold line at top
  const topLineGrad = ctx.createLinearGradient(0, 0, W, 0);
  topLineGrad.addColorStop(0, "rgba(201,169,110,0)");
  topLineGrad.addColorStop(0.3, "rgba(201,169,110,0.3)");
  topLineGrad.addColorStop(0.7, "rgba(201,169,110,0.3)");
  topLineGrad.addColorStop(1, "rgba(201,169,110,0)");
  ctx.fillStyle = topLineGrad;
  ctx.fillRect(0, 0, W, 4);

  drawStatusBar(ctx, true);

  // ── Logo area ──
  const logoY = 520;

  // Glow ring behind logo
  const logoGlow = ctx.createRadialGradient(W / 2, logoY, 0, W / 2, logoY, 180);
  logoGlow.addColorStop(0, "rgba(201,169,110,0.12)");
  logoGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = logoGlow;
  ctx.fillRect(W / 2 - 180, logoY - 180, 360, 360);

  // Logo circle
  ctx.fillStyle = C.bgDarkMid;
  ctx.beginPath();
  ctx.arc(W / 2, logoY, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(201,169,110,0.2)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // "IK" in logo
  const logoTextGrad = ctx.createLinearGradient(W / 2 - 60, logoY - 30, W / 2 + 60, logoY + 30);
  logoTextGrad.addColorStop(0, C.gold);
  logoTextGrad.addColorStop(1, C.goldBright);
  ctx.fillStyle = logoTextGrad;
  ctx.font = `700 80px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("IK", W / 2, logoY + 2);

  // Title
  ctx.fillStyle = C.textLight;
  ctx.font = `700 84px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Isang Kusina", W / 2 - 60, logoY + 200);
  ctx.fillStyle = C.gold;
  ctx.fillText("2026", W / 2 + 340, logoY + 200);

  // Subtitle
  ctx.fillStyle = "rgba(244,237,228,0.5)";
  ctx.font = `400 40px sans-serif`;
  ctx.fillText("A Filipino Chefs Collaboration Dinner", W / 2, logoY + 270);

  // Event date pill
  const pillText = "MAY 22, 2026  ·  LAS VEGAS";
  ctx.font = `500 30px sans-serif`;
  const pillW = ctx.measureText(pillText).width + 80;
  const pillX = W / 2 - pillW / 2;
  const pillY = logoY + 320;

  ctx.fillStyle = "rgba(201,169,110,0.06)";
  ctx.strokeStyle = "rgba(201,169,110,0.12)";
  ctx.lineWidth = 2;
  pill(ctx, pillX, pillY, pillW, 60);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(201,169,110,0.6)";
  ctx.font = `500 28px sans-serif`;
  ctx.letterSpacing = "0.1em";
  ctx.fillText(pillText, W / 2, pillY + 35);

  // ── Card ──
  const cardX = 90;
  const cardY = logoY + 450;
  const cardW = W - 180;
  const cardH = 640;

  // Card background
  ctx.fillStyle = "rgba(244,237,228,0.035)";
  roundRect(ctx, cardX, cardY, cardW, cardH, 48);
  ctx.fill();
  ctx.strokeStyle = "rgba(201,169,110,0.15)";
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 48);
  ctx.stroke();

  // Inner glow
  const innerGlow = ctx.createRadialGradient(W / 2, cardY + cardH / 2, 0, W / 2, cardY + cardH / 2, cardW / 2);
  innerGlow.addColorStop(0, "rgba(201,169,110,0.02)");
  innerGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = innerGlow;
  roundRect(ctx, cardX, cardY, cardW, cardH, 48);
  ctx.fill();

  // Lock icon + "Enter your access code"
  const lockBgX = cardX + 60;
  const lockBgY = cardY + 55;
  ctx.fillStyle = "rgba(201,169,110,0.1)";
  roundRect(ctx, lockBgX, lockBgY, 72, 72, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(201,169,110,0.2)";
  ctx.lineWidth = 2;
  roundRect(ctx, lockBgX, lockBgY, 72, 72, 18);
  ctx.stroke();
  drawLockIcon(ctx, lockBgX + 36, lockBgY + 36, 36, C.gold);

  ctx.fillStyle = C.textLight;
  ctx.font = `600 46px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("Enter your access code", lockBgX + 90, lockBgY + 50);

  ctx.fillStyle = "rgba(244,237,228,0.4)";
  ctx.font = `400 34px sans-serif`;
  ctx.fillText("Your code was sent by the event team.", cardX + 60, lockBgY + 120);

  // Input field
  const inputY = lockBgY + 170;
  ctx.fillStyle = "rgba(244,237,228,0.04)";
  roundRect(ctx, cardX + 60, inputY, cardW - 120, 120, 30);
  ctx.fill();
  ctx.strokeStyle = "rgba(201,169,110,0.15)";
  ctx.lineWidth = 3;
  roundRect(ctx, cardX + 60, inputY, cardW - 120, 120, 30);
  ctx.stroke();

  // Placeholder dots (masked password)
  ctx.fillStyle = "rgba(244,237,228,0.3)";
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(cardX + 120 + i * 44, inputY + 60, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eye icon
  ctx.strokeStyle = "rgba(244,237,228,0.35)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(cardX + cardW - 120, inputY + 60, 24, 16, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(244,237,228,0.35)";
  ctx.beginPath();
  ctx.arc(cardX + cardW - 120, inputY + 60, 8, 0, Math.PI * 2);
  ctx.fill();

  // Session notice
  const noticeY = inputY + 150;
  ctx.fillStyle = "rgba(126,158,120,0.04)";
  roundRect(ctx, cardX + 60, noticeY, cardW - 120, 88, 20);
  ctx.fill();
  ctx.strokeStyle = "rgba(126,158,120,0.1)";
  ctx.lineWidth = 2;
  roundRect(ctx, cardX + 60, noticeY, cardW - 120, 88, 20);
  ctx.stroke();

  // Shield icon
  ctx.fillStyle = "rgba(126,158,120,0.5)";
  ctx.font = `400 28px sans-serif`;
  ctx.textAlign = "left";

  ctx.fillStyle = "rgba(244,237,228,0.35)";
  ctx.font = `400 28px sans-serif`;
  ctx.fillText("Your session will be remembered on this device.", cardX + 120, noticeY + 52);

  // Gold CTA button
  const btnY = noticeY + 120;
  const btnGrad = ctx.createLinearGradient(cardX + 60, btnY, cardX + cardW - 60, btnY + 120);
  btnGrad.addColorStop(0, "#C9A96E");
  btnGrad.addColorStop(1, "#B8944F");
  ctx.fillStyle = btnGrad;
  roundRect(ctx, cardX + 60, btnY, cardW - 120, 120, 30);
  ctx.fill();

  // Button shadow
  ctx.shadowColor = "rgba(201,169,110,0.25)";
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, cardX + 60, btnY, cardW - 120, 120, 30);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = "#1E2019";
  ctx.font = `600 42px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Enter", W / 2, btnY + 72);

  // ── Footer ──
  ctx.fillStyle = "rgba(244,237,228,0.15)";
  ctx.font = `400 24px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("INVITE-ONLY EXPERIENCE", W / 2, H - 280);

  ctx.fillStyle = "rgba(201,169,110,0.35)";
  ctx.font = `400 28px sans-serif`;
  ctx.fillText("Forgot your code? Contact the event lead", W / 2, H - 230);

  ctx.fillStyle = "rgba(244,237,228,0.2)";
  ctx.font = `400 22px sans-serif`;
  ctx.fillText("Privacy  ·  Terms", W / 2, H - 180);

  drawHomeIndicator(ctx, true);
}

// ══════════════════════════════════════════════════════════════
// SCREENSHOT 2: Profile Selection / Onboarding Screen
// ══════════════════════════════════════════════════════════════
function drawProfileScreen(ctx: CanvasRenderingContext2D) {
  // ── Background (same dark theme) ──
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#1E3330");
  bgGrad.addColorStop(0.5, "#2B4440");
  bgGrad.addColorStop(1, "#1E3330");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Ambient glows
  const glow1 = ctx.createRadialGradient(W * 0.5, H * 0.3, 0, W * 0.5, H * 0.3, 600);
  glow1.addColorStop(0, "rgba(126,158,120,0.06)");
  glow1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(W * 0.6, H * 0.5, 0, W * 0.6, H * 0.5, 400);
  glow2.addColorStop(0, "rgba(201,169,110,0.04)");
  glow2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  drawStatusBar(ctx, true);

  // ── Logo + heading ──
  const headY = 460;

  // Logo circle (smaller)
  ctx.fillStyle = C.bgDarkMid;
  ctx.beginPath();
  ctx.arc(W / 2, headY, 84, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(201,169,110,0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const logoGrad = ctx.createLinearGradient(W / 2 - 50, headY - 25, W / 2 + 50, headY + 25);
  logoGrad.addColorStop(0, C.gold);
  logoGrad.addColorStop(1, C.goldBright);
  ctx.fillStyle = logoGrad;
  ctx.font = `700 68px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("IK", W / 2, headY + 2);

  // "Welcome back"
  ctx.fillStyle = C.textLight;
  ctx.font = `600 64px sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Welcome back", W / 2, headY + 180);

  ctx.fillStyle = "rgba(244,237,228,0.45)";
  ctx.font = `400 36px sans-serif`;
  ctx.fillText("Select your profile to continue.", W / 2, headY + 240);

  // ── Profile cards ──
  const cardX = 90;
  const cardY = headY + 310;
  const cardW = W - 180;

  ctx.fillStyle = "rgba(244,237,228,0.035)";
  roundRect(ctx, cardX, cardY, cardW, 720, 48);
  ctx.fill();
  ctx.strokeStyle = "rgba(201,169,110,0.15)";
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, 720, 48);
  ctx.stroke();

  // Profile entries — actual app roles (Chef + Leadership)
  const profiles = [
    { name: "Chef Dio Buan", role: "Chef", emoji: "\u{1F525}", bg: "rgba(126,158,120,0.15)" },
    { name: "Walbert Castillo", role: "Leadership", emoji: "\u{1F451}", bg: "rgba(201,169,110,0.15)" },
  ];

  profiles.forEach((p, i) => {
    const py = cardY + 50 + i * 170;
    const rowX = cardX + 50;
    const rowW = cardW - 100;
    const rowH = 140;

    ctx.fillStyle = "rgba(0,0,0,0)";
    roundRect(ctx, rowX, py, rowW, rowH, 30);
    ctx.fill();
    ctx.strokeStyle = "rgba(201,169,110,0.1)";
    ctx.lineWidth = 2;
    roundRect(ctx, rowX, py, rowW, rowH, 30);
    ctx.stroke();

    drawAvatar(ctx, rowX + 70, py + rowH / 2, 48, p.bg, p.emoji, 40);

    ctx.fillStyle = C.textLight;
    ctx.font = `500 38px sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(p.name, rowX + 140, py + 55);

    ctx.fillStyle = "rgba(244,237,228,0.4)";
    ctx.font = `400 28px sans-serif`;
    ctx.fillText(p.role, rowX + 140, py + 98);

    drawChevron(ctx, rowX + rowW - 40, py + rowH / 2, 30, "rgba(201,169,110,0.4)");
  });

  // Divider "or"
  const divY = cardY + 50 + 2 * 170 + 10;
  ctx.strokeStyle = "rgba(201,169,110,0.08)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 80, divY);
  ctx.lineTo(W / 2 - 40, divY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W / 2 + 40, divY);
  ctx.lineTo(cardX + cardW - 80, divY);
  ctx.stroke();

  ctx.fillStyle = "rgba(244,237,228,0.25)";
  ctx.font = `400 28px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("or", W / 2, divY + 10);

  // "Create new profile" button
  const newY = divY + 50;
  const newRow = cardX + 50;
  const newW = cardW - 100;

  ctx.fillStyle = "rgba(0,0,0,0)";
  roundRect(ctx, newRow, newY, newW, 130, 30);
  ctx.fill();
  ctx.strokeStyle = "rgba(201,169,110,0.1)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  roundRect(ctx, newRow, newY, newW, 130, 30);
  ctx.stroke();
  ctx.setLineDash([]);

  // Plus icon
  ctx.fillStyle = "rgba(201,169,110,0.12)";
  ctx.beginPath();
  ctx.arc(newRow + 70, newY + 65, 42, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(201,169,110,0.4)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(newRow + 70, newY + 45);
  ctx.lineTo(newRow + 70, newY + 85);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(newRow + 50, newY + 65);
  ctx.lineTo(newRow + 90, newY + 65);
  ctx.stroke();

  ctx.fillStyle = "rgba(244,237,228,0.7)";
  ctx.font = `500 36px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("Create new profile", newRow + 140, newY + 72);

  // Back button at bottom
  const backY = cardY + 760;
  ctx.fillStyle = "rgba(244,237,228,0.35)";
  ctx.font = `400 32px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("\u2190  Back to access code", W / 2, backY + 40);

  drawHomeIndicator(ctx, true);
}

// ══════════════════════════════════════════════════════════════
// SCREENSHOT 3: Main Dashboard
// ══════════════════════════════════════════════════════════════
function drawDashboardScreen(ctx: CanvasRenderingContext2D) {
  // ── Light background ──
  ctx.fillStyle = C.bgLight;
  ctx.fillRect(0, 0, W, H);

  const warmOverlay = ctx.createLinearGradient(0, 0, 0, H);
  warmOverlay.addColorStop(0, "rgba(244,237,228,0)");
  warmOverlay.addColorStop(1, "rgba(237,229,219,0.3)");
  ctx.fillStyle = warmOverlay;
  ctx.fillRect(0, 0, W, H);

  drawStatusBar(ctx, false);

  // ── Top Bar ──
  const topBarH = 168;
  ctx.fillStyle = "rgba(255,253,245,0.85)";
  ctx.fillRect(0, 0, W, topBarH);

  const barLine = ctx.createLinearGradient(0, topBarH, W, topBarH);
  barLine.addColorStop(0, "rgba(201,169,110,0.05)");
  barLine.addColorStop(0.5, "rgba(201,169,110,0.15)");
  barLine.addColorStop(1, "rgba(201,169,110,0.05)");
  ctx.fillStyle = barLine;
  ctx.fillRect(0, topBarH - 2, W, 2);

  // Menu hamburger
  const menuX = 60;
  const menuY = 110;
  ctx.strokeStyle = "rgba(58,61,53,0.5)";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(menuX, menuY + i * 16);
    ctx.lineTo(menuX + 44, menuY + i * 16);
    ctx.stroke();
  }

  // Logo in top bar
  ctx.fillStyle = C.bgDarkMid;
  ctx.beginPath();
  ctx.arc(170, menuY + 14, 30, 0, Math.PI * 2);
  ctx.fill();
  const miniLogoGrad = ctx.createLinearGradient(150, menuY, 190, menuY + 28);
  miniLogoGrad.addColorStop(0, C.gold);
  miniLogoGrad.addColorStop(1, C.goldBright);
  ctx.fillStyle = miniLogoGrad;
  ctx.font = `700 24px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("IK", 170, menuY + 16);

  ctx.fillStyle = C.textDark;
  ctx.font = `600 36px sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Isang Kusina", 220, menuY + 8);
  ctx.fillStyle = C.gold;
  ctx.fillText("2026", 480, menuY + 8);

  ctx.fillStyle = "rgba(58,61,53,0.4)";
  ctx.font = `400 24px sans-serif`;
  ctx.fillText("Dashboard", 220, menuY + 38);

  // Notification bell
  ctx.strokeStyle = "rgba(58,61,53,0.4)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(W - 180, menuY + 14, 18, Math.PI * 0.15, Math.PI * 0.85, true);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W - 198, menuY + 14);
  ctx.lineTo(W - 162, menuY + 14);
  ctx.stroke();

  // Avatar
  drawAvatar(ctx, W - 90, menuY + 14, 30, "rgba(201,169,110,0.15)", "\u{1F451}", 28);

  // ── Content area ──
  const contentY = topBarH + 40;
  const px = 48;

  // ── Event Countdown Card (matches real EventCountdown component) ──
  const countdownY = contentY;
  const countdownH = 320;
  const cdGrad = ctx.createLinearGradient(px, countdownY, W - px, countdownY + countdownH);
  cdGrad.addColorStop(0, "#3D524D");
  cdGrad.addColorStop(0.45, "#4D6A5E");
  cdGrad.addColorStop(1, "#7E9E78");
  ctx.fillStyle = cdGrad;
  roundRect(ctx, px, countdownY, W - px * 2, countdownH, 36);
  ctx.fill();

  const cdInnerGlow = ctx.createRadialGradient(W / 2, countdownY + countdownH / 2, 0, W / 2, countdownY + countdownH / 2, 400);
  cdInnerGlow.addColorStop(0, "rgba(126,158,120,0.08)");
  cdInnerGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = cdInnerGlow;
  roundRect(ctx, px, countdownY, W - px * 2, countdownH, 36);
  ctx.fill();

  // "ISANG KUSINA 2026" label
  ctx.fillStyle = "rgba(205,168,138,0.85)";
  ctx.font = `400 24px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("ISANG KUSINA 2026", px + 50, countdownY + 55);

  // Heading: "Event Overview"
  ctx.fillStyle = "#E8EDE3";
  ctx.font = `600 52px sans-serif`;
  ctx.fillText("Event Overview", px + 50, countdownY + 120);

  // Location + date
  ctx.fillStyle = "rgba(192,209,177,0.65)";
  ctx.font = `400 30px sans-serif`;
  ctx.fillText("Las Vegas, NV  \u00b7  May 22, 2026", px + 50, countdownY + 170);

  // Big countdown number (71 days from Mar 12 to May 22, 2026)
  ctx.fillStyle = "#E8EDE3";
  ctx.font = `700 120px sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("71", W - px - 80, countdownY + 135);

  ctx.fillStyle = "rgba(205,168,138,0.9)";
  ctx.font = `500 28px sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("DAYS", W - px - 80, countdownY + 170);

  ctx.textAlign = "left";

  // Progress bar
  const progBarX = px + 50;
  const progBarY = countdownY + 210;
  const progBarW = W - px * 2 - 100;
  ctx.fillStyle = "rgba(192,209,177,0.45)";
  ctx.font = `400 22px sans-serif`;
  ctx.fillText("PROGRESS", progBarX, progBarY);
  ctx.textAlign = "right";
  ctx.fillStyle = "#CDA88A";
  ctx.font = `500 26px sans-serif`;
  ctx.fillText("44%", progBarX + progBarW, progBarY);
  ctx.textAlign = "left";

  const progTrackY = progBarY + 18;
  ctx.fillStyle = "rgba(192,209,177,0.1)";
  roundRect(ctx, progBarX, progTrackY, progBarW, 14, 7);
  ctx.fill();
  ctx.fillStyle = "#CDA88A";
  roundRect(ctx, progBarX, progTrackY, progBarW * 0.44, 14, 7);
  ctx.fill();

  // Quick links row (matches real quickLinks in EventCountdown)
  const qlY = progTrackY + 40;
  const qlLabels = ["Event Timeline", "Chef Roster", "Menu & Courses", "Travel"];
  const qlW = (W - px * 2 - 100 - 30 * 3) / 4;
  qlLabels.forEach((label, i) => {
    const lx = px + 50 + i * (qlW + 30);
    ctx.fillStyle = "rgba(192,209,177,0.08)";
    roundRect(ctx, lx, qlY, qlW, 56, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(192,209,177,0.12)";
    ctx.lineWidth = 1;
    roundRect(ctx, lx, qlY, qlW, 56, 14);
    ctx.stroke();
    ctx.fillStyle = "rgba(232,237,227,0.85)";
    ctx.font = `400 22px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(label, lx + qlW / 2, qlY + 35);
    ctx.textAlign = "left";
  });

  // ── Role Welcome Bar (matches real RoleWelcome component — leadership view) ──
  const rwY = countdownY + countdownH + 40;
  ctx.fillStyle = "rgba(221,161,94,0.06)";
  roundRect(ctx, px, rwY, W - px * 2, 140, 24);
  ctx.fill();
  ctx.strokeStyle = "rgba(221,161,94,0.15)";
  ctx.lineWidth = 2;
  roundRect(ctx, px, rwY, W - px * 2, 140, 24);
  ctx.stroke();

  // Shield icon bg
  const shieldX = px + 30;
  const shieldY = rwY + 30;
  ctx.fillStyle = "rgba(221,161,94,0.1)";
  roundRect(ctx, shieldX, shieldY, 72, 72, 18);
  ctx.fill();
  ctx.fillStyle = "#DDA15E";
  ctx.font = `28px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("\u{1F6E1}", shieldX + 36, shieldY + 42);

  ctx.textAlign = "left";
  ctx.fillStyle = C.textDark;
  ctx.font = `500 34px sans-serif`;
  ctx.fillText("Good morning, Walbert", shieldX + 90, shieldY + 32);

  ctx.fillStyle = "rgba(58,61,53,0.5)";
  ctx.font = `400 26px sans-serif`;
  ctx.fillText("Command Center \u2014 Full visibility across all event operations", shieldX + 90, shieldY + 68);

  // ── Announcement Banner (real: "Team Comms are live") ──
  const annY = rwY + 180;
  ctx.fillStyle = "rgba(26,92,56,0.06)";
  roundRect(ctx, px, annY, W - px * 2, 120, 24);
  ctx.fill();
  ctx.strokeStyle = "rgba(26,92,56,0.15)";
  ctx.lineWidth = 2;
  roundRect(ctx, px, annY, W - px * 2, 120, 24);
  ctx.stroke();

  ctx.fillStyle = "#1A5C38";
  ctx.font = `500 28px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("\u{1F389}  Team Comms are live", px + 40, annY + 45);

  ctx.fillStyle = "rgba(58,61,53,0.5)";
  ctx.font = `400 26px sans-serif`;
  ctx.fillText("Chat with the team right inside the hub.", px + 40, annY + 85);

  // ── Quick Actions Grid (matches real leadershipActions) ──
  const qaY = annY + 160;
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  roundRect(ctx, px, qaY, W - px * 2, 380, 32);
  ctx.fill();
  ctx.strokeStyle = "rgba(201,169,110,0.06)";
  ctx.lineWidth = 2;
  roundRect(ctx, px, qaY, W - px * 2, 380, 32);
  ctx.stroke();

  ctx.fillStyle = C.textDark;
  ctx.font = `600 36px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("Quick Actions", px + 50, qaY + 55);

  const actions = [
    { icon: "\u{1F4CB}", label: "Action Items", color: "#C75B3F" },
    { icon: "\u{1F4B0}", label: "Budget", color: "#CDA88A" },
    { icon: "\u{1F465}", label: "Team Deploy", color: "#4A7FB5" },
    { icon: "\u{2708}\uFE0F", label: "Travel", color: "#CDA88A" },
  ];

  const actionW = (W - px * 2 - 200) / 4;
  actions.forEach((a, i) => {
    const ax = px + 50 + i * (actionW + 24);
    const ay = qaY + 90;

    ctx.fillStyle = "rgba(244,237,228,0.5)";
    roundRect(ctx, ax, ay, actionW, 240, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(201,169,110,0.06)";
    ctx.lineWidth = 2;
    roundRect(ctx, ax, ay, actionW, 240, 24);
    ctx.stroke();

    // Icon circle with action color
    ctx.fillStyle = a.color + "14";
    ctx.beginPath();
    ctx.arc(ax + actionW / 2, ay + 70, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `36px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(a.icon, ax + actionW / 2, ay + 76);

    ctx.fillStyle = C.textDark;
    ctx.font = `500 26px sans-serif`;
    ctx.fillText(a.label, ax + actionW / 2, ay + 150);
  });

  // ── Bottom Nav (matches real MobileBottomNav: Home, Comms, Timeline, Roster + More) ──
  const navH = 200;
  const navY = H - navH;
  ctx.fillStyle = "rgba(255,253,245,0.95)";
  ctx.fillRect(0, navY, W, navH);
  ctx.strokeStyle = "rgba(201,169,110,0.08)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, navY);
  ctx.lineTo(W, navY);
  ctx.stroke();

  const navItems = [
    { icon: "\u{1F3E0}", label: "Home", active: true },
    { icon: "\u{1F4AC}", label: "Comms", active: false },
    { icon: "\u{1F4C5}", label: "Timeline", active: false },
    { icon: "\u{1F465}", label: "Roster", active: false },
    { icon: "\u{2699}\uFE0F", label: "More", active: false },
  ];

  const navItemW = W / navItems.length;
  navItems.forEach((n, i) => {
    const nx = i * navItemW + navItemW / 2;
    const ny = navY + 45;

    ctx.font = `28px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(n.icon, nx, ny + 10);

    ctx.fillStyle = n.active ? C.gold : "rgba(58,61,53,0.35)";
    ctx.font = `${n.active ? 500 : 400} 22px sans-serif`;
    ctx.fillText(n.label, nx, ny + 50);

    if (n.active) {
      ctx.fillStyle = C.gold;
      ctx.beginPath();
      ctx.arc(nx, navY + 12, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  drawHomeIndicator(ctx, false);
}

// ── Background fills for iPad margins (per-screen type) ──
const IPAD_BG: Record<string, (ctx: CanvasRenderingContext2D) => void> = {
  login: (ctx) => {
    // Dark forest gradient matching login/profile screens
    const g = ctx.createLinearGradient(0, 0, IPAD_W, IPAD_H);
    g.addColorStop(0, "#1E3330");
    g.addColorStop(0.5, "#2B4440");
    g.addColorStop(1, "#1E3330");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, IPAD_W, IPAD_H);
  },
  profiles: (ctx) => {
    const g = ctx.createLinearGradient(0, 0, IPAD_W, IPAD_H);
    g.addColorStop(0, "#1E3330");
    g.addColorStop(0.5, "#2B4440");
    g.addColorStop(1, "#1E3330");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, IPAD_W, IPAD_H);
  },
  dashboard: (ctx) => {
    // Light ecru background matching dashboard
    ctx.fillStyle = C.bgLight;
    ctx.fillRect(0, 0, IPAD_W, IPAD_H);
  },
};

// ── iPad screenshot card — uniform scale + offscreen compositing ──
function IPadScreenshotCard({ def }: { def: ScreenshotDef }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || rendered) return;
    canvas.width = IPAD_W;
    canvas.height = IPAD_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, IPAD_W, IPAD_H);

    // Step 1: Fill background to cover margins
    const bgFill = IPAD_BG[def.id];
    if (bgFill) bgFill(ctx);

    // Step 2: Render iPhone content to offscreen canvas at native size
    const offscreen = document.createElement("canvas");
    offscreen.width = W;
    offscreen.height = H;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;
    def.draw(offCtx);

    // Step 3: Calculate uniform scale to fit iPad canvas (cover strategy)
    // Use width-based scale since iPad is proportionally wider
    const uniformScale = IPAD_W / W; // ~1.595
    const scaledH = H * uniformScale;  // ~4431 — taller than IPAD_H

    // Center vertically (top-aligned content, trim bottom overflow)
    const offsetY = 0; // Keep content top-aligned for status bar
    const offsetX = 0; // Width fits exactly

    // Step 4: Draw the offscreen render onto iPad canvas with uniform scale
    ctx.drawImage(
      offscreen,
      0, 0, W, H,                              // source (full iPhone canvas)
      offsetX, offsetY, IPAD_W, scaledH         // dest (uniformly scaled)
    );

    setRendered(true);
  }, [def, rendered]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    canvas.toBlob(
      (blob) => {
        if (!blob) { setDownloading(false); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ik26-appstore-ipad-${def.id}-${IPAD_W}x${IPAD_H}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloading(false);
      },
      "image/png", 1.0
    );
  }, [def.id]);

  const previewW = 280;
  const previewH = Math.round(previewW * (IPAD_H / IPAD_W));

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-2xl overflow-hidden shadow-lg" style={{ border: "1px solid rgba(201,169,110,0.12)", width: previewW, height: previewH }}>
        <canvas ref={canvasRef} style={{ width: previewW, height: previewH }} />
      </div>
      <div className="text-center">
        <h3 className="text-[0.9375rem] font-medium" style={{ ...headingFont, color: "#3A3D35" }}>{def.title}</h3>
        <p className="text-[0.75rem]" style={{ ...bodyFont, color: "rgba(58,61,53,0.5)" }}>{def.subtitle}</p>
      </div>
      <button onClick={handleDownload} disabled={!rendered || downloading} className="px-5 py-2.5 rounded-xl text-[0.8125rem] font-medium cursor-pointer disabled:opacity-50 min-h-[44px]" style={{ ...bodyFont, background: "linear-gradient(135deg, #C9A96E, #B8944F)", color: "#1E2019", boxShadow: "0 2px 8px rgba(201,169,110,0.2)" }} data-download-btn={`ipad-${def.id}`}>
        {downloading ? "Saving..." : "Download PNG"}
      </button>
      <span className="text-[0.6875rem]" style={{ ...bodyFont, color: "rgba(58,61,53,0.3)" }}>{IPAD_W} &times; {IPAD_H}px</span>
    </div>
  );
}

export function AppStoreScreenshots() {
  const [downloadingAll, setDownloadingAll] = useState(false);

  const handleDownloadAll = useCallback(async () => {
    setDownloadingAll(true);
    const btns = document.querySelectorAll('[data-download-btn]');
    for (let i = 0; i < btns.length; i++) {
      (btns[i] as HTMLButtonElement).click();
      await new Promise(r => setTimeout(r, 500));
    }
    setDownloadingAll(false);
  }, []);

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{ backgroundColor: C.bgLight }}
    >
      <div className="max-w-6xl mx-auto">
        {/* ─── Page Header ─── */}
        <div className="text-center mb-10">
          <h1
            className="mb-2"
            style={{ ...headingFont, fontSize: "2rem", color: C.textDark }}
          >
            App Store Screenshots
          </h1>
          <p
            className="text-[0.9375rem] mb-1"
            style={{ ...bodyFont, color: "rgba(58,61,53,0.5)" }}
          >
            Click each card to download, or use the button below to get all at once.
          </p>
        </div>

        {/* ─── iPhone Section ─── */}
        <div className="mb-6">
          <h2
            className="text-[1.25rem] font-semibold mb-1"
            style={{ ...headingFont, color: C.textDark }}
          >
            iPhone 6.5&Prime; Display
          </h2>
          <p
            className="text-[0.8125rem]"
            style={{ ...bodyFont, color: "rgba(58,61,53,0.45)" }}
          >
            1284 &times; 2778px &middot; PNG
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          {SCREENSHOTS.map((def) => (
            <ScreenshotCard key={def.id} def={def} />
          ))}
        </div>

        {/* ─── Divider ─── */}
        <div className="my-12 flex items-center gap-4">
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(201,169,110,0.15)" }} />
          <span
            className="text-[0.75rem] uppercase tracking-widest"
            style={{ ...bodyFont, color: "rgba(201,169,110,0.5)" }}
          >
            iPad
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(201,169,110,0.15)" }} />
        </div>

        {/* ─── iPad Section ─── */}
        <div className="mb-6">
          <h2
            className="text-[1.25rem] font-semibold mb-1"
            style={{ ...headingFont, color: C.textDark }}
          >
            iPad 13&Prime; Display
          </h2>
          <p
            className="text-[0.8125rem]"
            style={{ ...bodyFont, color: "rgba(58,61,53,0.45)" }}
          >
            2048 &times; 2732px &middot; PNG
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          {SCREENSHOTS.map((def) => (
            <IPadScreenshotCard key={`ipad-${def.id}`} def={def} />
          ))}
        </div>

        {/* ─── Download All + Back ─── */}
        <div className="text-center space-y-4">
          <button
            onClick={handleDownloadAll}
            disabled={downloadingAll}
            className="px-8 py-3 rounded-xl text-[0.875rem] font-medium cursor-pointer disabled:opacity-50 min-h-[44px]"
            style={{
              ...bodyFont,
              backgroundColor: "rgba(61,82,77,0.9)",
              color: C.cream,
              boxShadow: "0 2px 12px rgba(43,68,64,0.2)",
            }}
          >
            {downloadingAll ? "Downloading..." : "Download All 6 Screenshots"}
          </button>
          <div>
            <a
              href="/"
              className="text-[0.8125rem]"
              style={{ ...bodyFont, color: C.gold }}
            >
              &larr; Back to app
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Screenshot definitions ──
const SCREENSHOTS: ScreenshotDef[] = [
  {
    id: "login",
    title: "Access Code Gate",
    subtitle: "Invite-only login screen",
    draw: drawLoginScreen,
  },
  {
    id: "profiles",
    title: "Profile Selection",
    subtitle: "Returning user profile picker",
    draw: drawProfileScreen,
  },
  {
    id: "dashboard",
    title: "Leadership Dashboard",
    subtitle: "Event overview & quick actions",
    draw: drawDashboardScreen,
  },
];