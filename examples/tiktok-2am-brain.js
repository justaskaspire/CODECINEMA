// CODECINEMA — TikTok short: YOUR BRAIN AT 2 AM
// 25 seconds | vertical 9:16 | 720p | 30 FPS | 540p/720p export profile
// Canvas 2D + built-in character2D helper. No external assets or paid APIs.
// Recommended project settings: 9:16, 25s, 30 FPS, 720p, Vertical Social profile.
// Audio: add a quiet room tone, a memory-rewind whoosh, chase beat and a final record-scratch in the Audio Mixer.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (v) => { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };
const mix = (a, b, p) => a + (b - a) * p;
const fade = (start, end) => smooth((t - start) / Math.max(0.001, end - start));
const unit = Math.min(w, h);
const cx = w * 0.5;
const floorY = h * 0.79;

function text(label, x, y, size, color, weight = 800, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = weight + " " + Math.round(size) + "px Arial, sans-serif";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.strokeStyle = "rgba(3,6,15,0.78)";
  ctx.strokeText(label, x, y);
  ctx.fillStyle = color;
  ctx.fillText(label, x, y);
  ctx.restore();
}

function rounded(x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

function background(colorA, colorB) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, colorA); g.addColorStop(1, colorB);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

function bedroom() {
  background("#111a35", "#080b18");
  // Window and moon.
  rounded(w * .61, h * .13, w * .27, h * .22, 18, "#1b2a4c", "#52678e");
  ctx.fillStyle = "#d9e8ff";
  ctx.beginPath(); ctx.arc(w * .77, h * .22, unit * .035, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 24; i++) {
    const sx = (Math.sin(i * 91.7) * .5 + .5) * w;
    const sy = (Math.sin(i * 37.1 + 2) * .5 + .5) * h * .34;
    ctx.globalAlpha = .25 + .45 * (Math.sin(t * 2 + i) * .5 + .5);
    ctx.fillStyle = "#dce8ff"; ctx.fillRect(sx, sy, 2.5, 2.5);
  }
  ctx.globalAlpha = 1;
  // Floor and bed.
  ctx.fillStyle = "#202943"; ctx.fillRect(0, floorY, w, h - floorY);
  rounded(w * .10, h * .62, w * .80, h * .19, 24, "#354563", "#7184a8");
  rounded(w * .14, h * .60, w * .30, h * .09, 18, "#e0e8f6");
  rounded(w * .39, h * .65, w * .49, h * .14, 18, "#263b61");
  ctx.fillStyle = "#526b95";
  ctx.fillRect(w * .12, h * .80, w * .04, h * .08);
  ctx.fillRect(w * .83, h * .80, w * .04, h * .08);
}

function sleepingStickman() {
  const x = w * .52, y = h * .665;
  ctx.save(); ctx.translate(x, y);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.strokeStyle = "#f5f7ff"; ctx.lineWidth = unit * .009;
  // Horizontal body, arms and legs.
  ctx.beginPath(); ctx.moveTo(-unit*.04, 0); ctx.lineTo(unit*.075, unit*.012);
  ctx.moveTo(unit*.04, unit*.006); ctx.lineTo(unit*.09, -unit*.025);
  ctx.moveTo(unit*.04, unit*.006); ctx.lineTo(unit*.09, unit*.035);
  ctx.moveTo(-unit*.04, 0); ctx.lineTo(-unit*.10, -unit*.02);
  ctx.moveTo(-unit*.04, 0); ctx.lineTo(-unit*.10, unit*.025);
  ctx.stroke();
  ctx.fillStyle = "#f5f7ff"; ctx.beginPath(); ctx.arc(-unit*.065, -unit*.008, unit*.026, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#18213a"; ctx.lineWidth = unit*.004;
  ctx.beginPath(); ctx.moveTo(-unit*.078,-unit*.008); ctx.lineTo(-unit*.067,-unit*.008); ctx.stroke();
  ctx.restore();
  text("Z", w*.69, h*.55, unit*.035, "#b9c9e8", 700, .85);
  text("z", w*.72, h*.51, unit*.025, "#b9c9e8", 700, .65);
}

function schoolHall() {
  background("#392b50", "#15152a");
  // Repeating hallway perspective.
  ctx.strokeStyle = "rgba(255,255,255,.15)"; ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const x = i * w / 5;
    ctx.beginPath(); ctx.moveTo(cx, h*.20); ctx.lineTo(x, h*.83); ctx.stroke();
  }
  ctx.fillStyle = "#514365"; ctx.fillRect(0, h*.72, w, h*.28);
  for (let i = 0; i < 4; i++) {
    rounded(w*(.08+i*.23), h*.18, w*.14, h*.26, 10, "#69718b", "#aab1c7");
  }
  text("SCHOOL. 2018.", cx, h*.10, unit*.043, "#fff0c7", 900);
}

function memoryMonster(x, y, scale, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(scale, scale);
  // Wobbly shadow body.
  ctx.fillStyle = "#a34bff"; ctx.shadowColor = "#a34bff"; ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.moveTo(-85, 80); ctx.bezierCurveTo(-120, 5, -65, -110, 0, -95);
  ctx.bezierCurveTo(75, -130, 120, -35, 82, 55);
  ctx.bezierCurveTo(65, 120, -40, 130, -85, 80); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-28,-28,16,0,Math.PI*2); ctx.arc(28,-28,16,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = "#241332"; ctx.beginPath(); ctx.arc(-28,-28,6,0,Math.PI*2); ctx.arc(28,-28,6,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#241332"; ctx.lineWidth = 9; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(0,18,28,.15,Math.PI-.15); ctx.stroke();
  ctx.restore();
}

function memoryScene() {
  schoolHall();
  const p = fade(6, 7.3);
  // Memory card slams into view.
  ctx.save();
  ctx.translate(cx, h*.42);
  ctx.rotate((1-p)*-.08);
  ctx.globalAlpha = p;
  rounded(-w*.37, -h*.17, w*.74, h*.34, 22, "#f4e8d2", "#fff");
  text("2018", cx, h*.35, unit*.10, "#3c2d50", 900, p);
  text("THE WAVE", cx, h*.44, unit*.047, "#5a426b", 900, p);
  ctx.restore();
  // The awkward wave: one person waving, the other walking away.
  const personX = w*.40, personY = h*.68;
  ctx.save(); ctx.translate(personX, personY);
  ctx.strokeStyle = "#ffffff"; ctx.fillStyle = "#ffffff"; ctx.lineWidth = unit*.009; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(0,-unit*.06,unit*.025,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0,-unit*.035); ctx.lineTo(0,unit*.055);
  ctx.moveTo(0,-unit*.015); ctx.lineTo(-unit*.035,-unit*.075);
  ctx.moveTo(0,-unit*.015); ctx.lineTo(unit*.04,-unit*.09);
  ctx.moveTo(0,unit*.055); ctx.lineTo(-unit*.03,unit*.10);
  ctx.moveTo(0,unit*.055); ctx.lineTo(unit*.03,unit*.10); ctx.stroke();
  ctx.restore();
  // Uninterested passer-by.
  ctx.save(); ctx.translate(w*.68,h*.69);
  ctx.strokeStyle="#b7c1d8"; ctx.fillStyle="#b7c1d8"; ctx.lineWidth=unit*.009; ctx.lineCap="round";
  ctx.beginPath(); ctx.arc(0,-unit*.06,unit*.024,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0,-unit*.035); ctx.lineTo(0,unit*.055); ctx.moveTo(0,-unit*.01); ctx.lineTo(-unit*.03,unit*.03); ctx.moveTo(0,-unit*.01); ctx.lineTo(unit*.03,unit*.03); ctx.moveTo(0,unit*.055); ctx.lineTo(-unit*.03,unit*.10); ctx.moveTo(0,unit*.055); ctx.lineTo(unit*.03,unit*.10); ctx.stroke();
  ctx.restore();
  text("...THEY WERE WAVING AT SOMEONE ELSE.", cx, h*.88, unit*.027, "#ffe2b5", 800, fade(8.3,9));
}

function chaseScene() {
  background("#160e29", "#070912");
  // Speed lines.
  ctx.strokeStyle = "rgba(191,137,255,.28)"; ctx.lineWidth = 4;
  for (let i=0;i<18;i++) {
    const y = (i/18)*h;
    const drift = (t*260 + i*83) % (w+180);
    ctx.beginPath(); ctx.moveTo(w-drift, y); ctx.lineTo(w-drift+90, y); ctx.stroke();
  }
  // Floor stripes.
  ctx.fillStyle="#24203b"; ctx.fillRect(0,h*.80,w,h*.20);
  for(let i=0;i<8;i++){
    const x=((i*180-t*420)%(w+180)+w+180)%(w+180);
    ctx.fillStyle="rgba(255,255,255,.13)"; ctx.fillRect(x,h*.82,70,7);
  }
  const run = t - 12;
  const heroX = mix(w*.32, w*.62, (Math.sin(run*2.1)+1)*.5);
  const bob = Math.sin(run*13)*unit*.012;
  api.character2D(ctx, t, {x:heroX, y:h*.78+bob, scale:1.35, motion:"run", expression:"surprised", color:"#f4f7ff", timeOffset:0});
  memoryMonster(w*.76 + Math.sin(t*5)*unit*.025, h*.60, 1.15+Math.sin(t*8)*.06, 1);
  text("WHY IS IT STILL CHASING ME?!", cx, h*.14, unit*.043, "#ffe0ff", 900);
}

function drawFrame() {
  // 0–5.5s: calm bedroom and the 2 AM hook.
  if (t < 5.5) {
    bedroom(); sleepingStickman();
    if (t > 1.0) {
      rounded(w*.12,h*.12,w*.76,h*.085,18,"rgba(8,13,28,.76)","rgba(255,255,255,.2)");
      text("ME TRYING TO SLEEP AT 2 AM",cx,h*.162,unit*.039,"#ffffff",900,fade(1,1.5));
    }
    if (t > 3.2) {
      const a = fade(3.2,3.8);
      ctx.save(); ctx.globalAlpha=a;
      ctx.fillStyle="#f6d58b"; ctx.beginPath(); ctx.arc(w*.50,h*.46,unit*.075,0,Math.PI*2); ctx.fill();
      text("...",w*.50,h*.46,unit*.06,"#34233f",900,a);
      text("WAIT.",cx,h*.34,unit*.065,"#ffdf91",900,a);
      ctx.restore();
    }
  }
  // 5.5–11.5s: flashback.
  else if (t < 11.5) {
    memoryScene();
    if (t > 9.2) memoryMonster(w*.76,h*.60,fade(9.2,10.2)*1.35,fade(9.2,10.2));
    if (t > 10.2) text("NO. NOT THIS MEMORY.",cx,h*.16,unit*.045,"#ffffff",900,fade(10.2,10.7));
  }
  // 11.5–19.5s: the memory becomes a monster.
  else if (t < 19.5) {
    chaseScene();
    const intro = 1-fade(11.5,12.3);
    if (intro>0) {
      ctx.fillStyle="rgba(255,255,255,"+(intro*.75)+")"; ctx.fillRect(0,0,w,h);
    }
  }
  // 19.5–25s: smash cut back to bed and punchline.
  else {
    bedroom(); sleepingStickman();
    const punch = fade(20,20.8);
    rounded(w*.12,h*.35,w*.76,h*.17,24,"rgba(7,11,24,.88)","rgba(255,255,255,.25)");
    text("ANYWAY...",cx,h*.405,unit*.055,"#d9e8ff",900,punch);
    text("GOOD MORNING.",cx,h*.465,unit*.055,"#b5ff6d",900,punch);
    if (t > 23.2) text("FOLLOW FOR MORE 2 AM THOUGHTS",cx,h*.89,unit*.025,"#c5d2e8",700,fade(23.2,23.8));
  }
}

drawFrame();
api.vignette(ctx, 0.48);
api.grain(ctx, t, 0.018, 31);
