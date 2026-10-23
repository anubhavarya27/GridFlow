import React from "react";
import { Link } from "react-router-dom";

/**
 * U/BILL — Utility data. Under control.
 * Visual concept sheet for a utility billing management platform
 * (customers, properties, meters, readings, tariffs, bills, payments).
 *
 * This is a static, self-contained visual mockup ported from an HTML/CSS
 * design concept — no external UI libraries required. All animation is
 * pure CSS (respects prefers-reduced-motion). Fonts load from Google Fonts.
 */
export default function UBillLandingPage() {
  const goToLogin = () => {
    window.location.assign("/login");
  };

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@400;500;600;700&display=swap');
/* ============================================================
   U/BILL — visual concept sheet
   Design tokens
   ============================================================ */
:root{
  --void:#05080A;
  --bg:#070B0C;
  --panel:#0D1214;
  --panel-2:#121A1C;
  --hair:rgba(178,208,212,.10);
  --hair-2:rgba(178,208,212,.18);
  --ink:#EAF1F1;
  --dim:#8DA0A3;
  --faint:#5A6B6E;
  --amber:#F2A93B;
  --amber-soft:rgba(242,169,59,.14);
  --teal:#5FD0BE;
  --teal-soft:rgba(95,208,190,.12);
  --ok:#79C68D;
  --red:#D9695F;
  --sans:'IBM Plex Sans',system-ui,-apple-system,sans-serif;
  --cond:'IBM Plex Sans Condensed','IBM Plex Sans',system-ui,sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,monospace;
  --gut:clamp(20px,4vw,64px);
}

*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0;
  background:var(--void);
  color:var(--ink);
  font-family:var(--sans);
  font-size:16px;
  line-height:1.55;
  -webkit-font-smoothing:antialiased;
  overflow-x:hidden;
}
a{color:inherit;text-decoration:none}
:focus-visible{outline:1px solid var(--amber);outline-offset:3px}

/* ---------- shared primitives ---------- */
.wrap{width:min(1240px,100% - var(--gut)*2);margin-inline:auto}
.mono{font-family:var(--mono);font-variant-ligatures:none}
.eyebrow{
  font-family:var(--mono);font-size:11px;letter-spacing:.22em;text-transform:uppercase;
  color:var(--dim);display:inline-flex;align-items:center;gap:10px;
}
.eyebrow::before{
  content:"";width:5px;height:5px;border-radius:50%;background:var(--amber);
  box-shadow:0 0 0 3px rgba(242,169,59,.14);
}
h1,h2,h3{font-family:var(--cond);font-weight:600;margin:0;letter-spacing:-.018em;line-height:.96}
h2{font-size:clamp(38px,5.4vw,76px)}
.sec-head{display:flex;align-items:flex-end;justify-content:space-between;gap:40px;flex-wrap:wrap}
.sec-idx{font-family:var(--mono);font-size:11px;letter-spacing:.2em;color:var(--faint)}
.rule{height:1px;background:linear-gradient(90deg,var(--hair-2),rgba(178,208,212,.02) 70%,transparent);margin:0}
.lede{color:var(--dim);font-size:16.5px;max-width:52ch}

/* glass surface used by every floating panel */
.glass{
  background:linear-gradient(162deg,rgba(28,38,41,.86),rgba(11,16,18,.92));
  border:1px solid var(--hair);
  border-radius:10px;
  box-shadow:
    0 1px 0 rgba(255,255,255,.055) inset,
    0 -1px 0 rgba(0,0,0,.4) inset,
    0 24px 60px -24px rgba(0,0,0,.9),
    0 4px 14px -6px rgba(0,0,0,.7);
  backdrop-filter:blur(14px);
}
.led{width:6px;height:6px;border-radius:50%;background:var(--ok);box-shadow:0 0 8px currentColor;color:var(--ok);display:inline-block}
.led.amber{background:var(--amber);color:var(--amber)}
.led.teal{background:var(--teal);color:var(--teal)}
.led.red{background:var(--red);color:var(--red)}
.pulse{animation:pulse 2.6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.32}}

/* ---------- page atmosphere ---------- */
.field{position:fixed;inset:0;pointer-events:none;z-index:0}
.field .grid{
  position:absolute;inset:-10%;
  background-image:linear-gradient(rgba(178,208,212,.045) 1px,transparent 1px),
                   linear-gradient(90deg,rgba(178,208,212,.045) 1px,transparent 1px);
  background-size:78px 78px;
  mask-image:radial-gradient(120% 80% at 62% 18%,#000 0%,transparent 72%);
}
.field .vig{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 0%,rgba(95,208,190,.055),transparent 55%),radial-gradient(90% 60% at 78% 22%,rgba(242,169,59,.05),transparent 62%)}

/* ============================================================
   NAV
   ============================================================ */
.nav{position:relative;z-index:30;border-bottom:1px solid rgba(178,208,212,.07);backdrop-filter:blur(10px)}
.nav-in{display:flex;align-items:center;gap:36px;height:66px}
.mark{font-family:var(--cond);font-weight:700;font-size:20px;letter-spacing:.02em;display:flex;align-items:center;gap:1px}
.mark .logo{width:28px;height:28px;margin-right:11px;flex:none}
.side .mark .logo{width:22px;height:22px;margin-right:9px}
.foot .logo{width:18px;height:18px;vertical-align:-4px;margin-right:8px}
.mark i{color:var(--amber);font-style:normal;font-weight:400;opacity:.85}
.mark small{font-family:var(--mono);font-size:9px;letter-spacing:.18em;color:var(--faint);margin-left:12px;align-self:center;text-transform:uppercase}
.nav-links{display:flex;gap:26px;margin-left:auto}
.nav-links a{font-size:13.5px;color:var(--dim)}
.nav-links a:hover{color:var(--ink)}
.nav-status{display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;color:var(--dim);
  border:1px solid var(--hair);border-radius:999px;padding:5px 11px}
.btn{
  display:inline-flex;align-items:center;gap:10px;font-size:14px;font-weight:500;
  padding:11px 18px;border-radius:8px;border:1px solid var(--hair-2);color:var(--ink);
  background:linear-gradient(180deg,rgba(38,50,53,.7),rgba(15,21,23,.8));
  transition:transform .25s cubic-bezier(.2,.7,.3,1),border-color .25s,box-shadow .25s;
}
.btn:hover{transform:translateY(-1px);border-color:rgba(178,208,212,.3)}
.btn.sm{padding:8px 14px;font-size:13px}
.btn.primary{
  background:linear-gradient(180deg,#F6BD5E,#E09425);
  color:#1A1105;border-color:rgba(255,215,150,.55);font-weight:600;
  box-shadow:0 10px 30px -12px rgba(242,169,59,.6),0 1px 0 rgba(255,255,255,.4) inset;
}
.btn.primary:hover{box-shadow:0 16px 40px -14px rgba(242,169,59,.8),0 1px 0 rgba(255,255,255,.45) inset}

/* ============================================================
   HERO
   ============================================================ */
.hero{position:relative;z-index:10;padding:72px 0 0}
.strip{margin-top:44px}
.strip-in{display:flex;align-items:center;gap:0;border-top:1px solid var(--hair);padding-top:20px}
.readout{flex:1;display:flex;flex-direction:column;gap:6px;position:relative;padding-right:28px}
.readout span{font-family:var(--mono);font-size:10px;letter-spacing:.18em;color:var(--faint)}
.readout b{font-family:var(--cond);font-size:26px;font-weight:600;letter-spacing:-.01em;line-height:1}
.readout i{position:absolute;right:28px;top:4px}
.scroll{font-size:10px;letter-spacing:.28em;color:var(--faint);writing-mode:vertical-rl;height:52px;
  display:flex;align-items:flex-start;border-left:1px solid var(--hair);padding-left:16px}
.hero-in{display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:18px;align-items:center}
.hero h1{font-size:clamp(50px,6.5vw,93px);letter-spacing:-.03em;margin:26px 0 0}
.hero h1 span{display:block}
.hero h1 .l2{color:#BFCCCD}
.hero .lede{margin:26px 0 0;max-width:40ch;font-size:17px;line-height:1.6}
.cta-row{display:flex;gap:12px;margin-top:34px;flex-wrap:wrap}
.meta{display:flex;align-items:center;gap:0;margin-top:34px;flex-wrap:wrap}
.meta span{font-family:var(--mono);font-size:10.5px;letter-spacing:.2em;color:var(--faint);padding-right:16px;margin-right:16px;border-right:1px solid var(--hair)}
.meta span:last-child{border:0}

/* ============================================================
   THE RELATIONAL CORE  (hero scene)
   ============================================================ */
.scene{position:relative;height:712px;margin-right:calc(var(--gut)*-1)}
.scene .halo{
  position:absolute;left:46%;top:48%;width:760px;height:620px;transform:translate(-50%,-50%);
  background:radial-gradient(52% 50% at 50% 50%,rgba(95,208,190,.16),rgba(95,208,190,.045) 45%,transparent 72%);
  filter:blur(6px);
}
.scene .halo.warm{width:420px;height:380px;left:52%;top:56%;
  background:radial-gradient(50% 50% at 50% 50%,rgba(242,169,59,.16),transparent 70%)}
.stage{position:absolute;inset:0;perspective:1500px;perspective-origin:52% 46%}
.core{
  position:absolute;left:46%;top:47%;width:0;height:0;
  transform-style:preserve-3d;
  transform:rotateX(-31deg);
  animation:spin 54s linear infinite;
  animation-delay:-2.1s;
}
@keyframes spin{from{transform:rotateX(-31deg) rotateY(0)}to{transform:rotateX(-31deg) rotateY(360deg)}}
@keyframes spinback{from{transform:rotateY(0)}to{transform:rotateY(-360deg)}}

/* relational planes — stacked table surfaces */
.plate{
  position:absolute;width:352px;height:352px;margin:-176px 0 0 -176px;
  transform-style:preserve-3d;
  border:1px solid rgba(95,208,190,.55);
  background:
    linear-gradient(rgba(95,208,190,.17) 1px,transparent 1px) 0 0/100% 32px,
    linear-gradient(90deg,rgba(95,208,190,.17) 1px,transparent 1px) 0 0/32px 100%,
    linear-gradient(150deg,rgba(95,208,190,.10),rgba(95,208,190,.02));
  mask-image:radial-gradient(64% 64% at 50% 50%,#000 46%,rgba(0,0,0,.45) 78%,transparent 100%);
  box-shadow:0 0 70px rgba(95,208,190,.14) inset;
}
.plate.a{transform:rotateX(90deg) rotateZ(45deg) translateZ(152px);width:296px;height:296px;margin:-148px 0 0 -148px;border-color:rgba(95,208,190,.8)}
.plate.b{transform:rotateX(90deg) rotateZ(45deg) translateZ(0);width:452px;height:452px;margin:-226px 0 0 -226px;border-color:rgba(95,208,190,.72)}
.plate.c{transform:rotateX(90deg) rotateZ(45deg) translateZ(-152px);width:388px;height:388px;margin:-194px 0 0 -194px;border-color:rgba(95,208,190,.42)}
.plate.floor{
  transform:rotateX(90deg) rotateZ(45deg) translateZ(-224px);width:720px;height:720px;margin:-360px 0 0 -360px;
  border-color:rgba(178,208,212,.10);
  background:linear-gradient(rgba(178,208,212,.07) 1px,transparent 1px) 0 0/60px 60px,
             linear-gradient(90deg,rgba(178,208,212,.07) 1px,transparent 1px) 0 0/60px 60px;
  mask-image:radial-gradient(42% 42% at 50% 50%,#000,transparent 80%);
}
/* nodes sitting on the planes */
.node{position:absolute;width:7px;height:7px;margin:-3.5px 0 0 -3.5px;border-radius:50%;
  background:var(--teal);box-shadow:0 0 10px rgba(95,208,190,.9),0 0 26px rgba(95,208,190,.45)}
.node.key{background:var(--amber);box-shadow:0 0 12px rgba(242,169,59,.95),0 0 30px rgba(242,169,59,.5);width:9px;height:9px;margin:-4.5px 0 0 -4.5px}
.node.dim{opacity:.5;width:5px;height:5px;box-shadow:0 0 7px rgba(95,208,190,.6)}

/* relationship columns between planes */
.rel{position:absolute;width:2px;height:306px;margin:-153px 0 0 -1px;transform-style:preserve-3d;
  background:linear-gradient(180deg,transparent,rgba(95,208,190,.72) 18%,rgba(95,208,190,.72) 82%,transparent)}
.rel.warm{background:linear-gradient(180deg,transparent,rgba(242,169,59,.55) 20%,rgba(242,169,59,.55) 80%,transparent)}
.rel i{position:absolute;left:-2px;width:5px;height:5px;border-radius:50%;background:#EAFFFA;
  box-shadow:0 0 10px rgba(95,208,190,1);animation:travel 4.4s cubic-bezier(.5,0,.5,1) infinite}
.rel.warm i{box-shadow:0 0 10px rgba(242,169,59,1)}
@keyframes travel{0%{top:-4px;opacity:0}12%{opacity:1}88%{opacity:1}100%{top:302px;opacity:0}}

/* outer containment rings */
.ring{position:absolute;border-radius:50%;border:1px solid rgba(178,208,212,.14);}
.ring.r1{width:520px;height:520px;margin:-260px 0 0 -260px;transform:rotateX(90deg) translateZ(0);
  border-top-color:rgba(95,208,190,.55);border-left-color:rgba(95,208,190,.3)}
.ring.r2{width:624px;height:624px;margin:-312px 0 0 -312px;transform:rotateX(90deg) translateZ(-150px);
  border-color:rgba(178,208,212,.07);border-bottom-color:rgba(242,169,59,.35)}
.ring.r3{width:252px;height:252px;margin:-126px 0 0 -126px;transform:rotateX(90deg) translateZ(158px);
  border-style:dashed;border-color:rgba(178,208,212,.16)}

/* table fragments orbiting the core (billboarded) */
.frag{position:absolute;width:132px;margin:-30px 0 0 -66px;transform-style:preserve-3d}
.frag .bb{transform-style:preserve-3d;animation:spinback 54s linear infinite;animation-delay:-2.1s}
.frag .fr{
  border:1px solid rgba(178,208,212,.3);border-radius:6px;overflow:hidden;
  background:linear-gradient(170deg,rgba(24,34,36,.92),rgba(10,15,16,.94));
  box-shadow:0 16px 34px -18px #000;
}
.frag .fr b{display:block;font-family:var(--mono);font-size:9px;letter-spacing:.16em;color:var(--teal);
  padding:6px 8px 5px;border-bottom:1px solid rgba(178,208,212,.16);font-weight:500;background:rgba(95,208,190,.06)}
.frag .fr u{display:flex;justify-content:space-between;text-decoration:none;font-family:var(--mono);font-size:8px;
  color:#93A6A8;padding:4px 8px;border-bottom:1px solid rgba(178,208,212,.07)}
.frag .fr u:last-child{border:0}
.frag .fr u em{font-style:normal;color:#5E6F72}

/* particulate */
.spark{position:absolute;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;
  background:#FFF3DE;box-shadow:0 0 14px rgba(242,169,59,1),0 0 44px rgba(242,169,59,.75),0 0 90px rgba(242,169,59,.35)}
.spark::after{content:"";position:absolute;left:-26px;top:-26px;width:64px;height:64px;border-radius:50%;
  border:1px solid rgba(242,169,59,.35);animation:emit 3.6s ease-out infinite}
@keyframes emit{0%{transform:scale(.4);opacity:.9}100%{transform:scale(2.4);opacity:0}}
.dust{position:absolute;inset:0;pointer-events:none}
.dust i{position:absolute;width:2px;height:2px;border-radius:50%;background:rgba(190,230,225,.6);
  animation:drift 9s ease-in-out infinite}
@keyframes drift{0%,100%{transform:translate3d(0,0,0);opacity:.25}50%{transform:translate3d(6px,-16px,0);opacity:.9}}

/* floating product cards */
.fcards{position:absolute;inset:0;pointer-events:none}
.fcard{position:absolute;pointer-events:auto;padding:13px 15px;min-width:172px;animation:float 11s ease-in-out infinite}
.fcard .fh{display:flex;align-items:center;justify-content:space-between;gap:14px;
  font-family:var(--mono);font-size:9.5px;letter-spacing:.2em;color:var(--faint)}
.fcard .fv{font-family:var(--cond);font-size:27px;font-weight:600;letter-spacing:-.02em;margin-top:8px;line-height:1}
.fcard .fs{font-family:var(--mono);font-size:10px;color:var(--dim);margin-top:7px;display:flex;gap:8px;align-items:center;letter-spacing:.05em}
.fcard .bar{height:3px;border-radius:2px;background:rgba(178,208,212,.12);margin-top:11px;overflow:hidden}
.fcard .bar i{display:block;height:100%;background:linear-gradient(90deg,rgba(95,208,190,.5),var(--teal))}
.fcard.warm .bar i{background:linear-gradient(90deg,rgba(242,169,59,.5),var(--amber))}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
.far{filter:blur(1.6px);opacity:.62;transform-origin:center}
.near{box-shadow:0 1px 0 rgba(255,255,255,.07) inset,0 40px 80px -30px rgba(0,0,0,.95)}


/* ============================================================
   SECTION SHELL
   ============================================================ */
section.band{position:relative;z-index:10;padding:132px 0}
.band .sec-head{margin-bottom:56px}
.band h2 span{display:block}
.band h2 .q{color:#93A5A7}

/* ---------- 2. lifecycle ---------- */
.flow{display:grid;grid-template-columns:repeat(6,1fr);gap:0;margin-top:12px}
.step{position:relative;padding-right:18px}
.step::after{content:"";position:absolute;right:9px;top:46px;width:calc(100% - 118px);height:1px;
  background:linear-gradient(90deg,rgba(95,208,190,.55),rgba(95,208,190,.12));overflow:visible}
.step:last-child{padding-right:0}
.step:last-child::after{display:none}
.step .pulse-dot{position:absolute;top:44px;left:104px;width:4px;height:4px;border-radius:50%;background:#DFFFF7;
  box-shadow:0 0 8px rgba(95,208,190,1);animation:slide 3.2s cubic-bezier(.6,0,.4,1) infinite}
@keyframes slide{0%{transform:translateX(0);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateX(88px);opacity:0}}
.tile{width:92px;height:92px;border-radius:12px;display:grid;place-items:center;position:relative;
  background:linear-gradient(155deg,rgba(32,44,46,.9),rgba(11,16,18,.92));
  border:1px solid var(--hair-2);
  box-shadow:0 1px 0 rgba(255,255,255,.07) inset,0 26px 44px -26px #000;
  transform:rotateY(-13deg) rotateX(5deg);transform-style:preserve-3d;
}
.tile svg{color:var(--teal);opacity:.92}
.tile .cnr{position:absolute;inset:7px;border:1px solid rgba(95,208,190,.12);border-radius:7px}
.step h3{font-family:var(--cond);font-size:19px;font-weight:600;margin:20px 0 5px;letter-spacing:.005em}
.step p{margin:0;color:var(--faint);font-family:var(--mono);font-size:10.5px;letter-spacing:.06em;line-height:1.7}
.step .card-idx{position:absolute;top:-2px;left:104px;font-family:var(--mono);font-size:9.5px;color:var(--faint);letter-spacing:.16em}

/* ---------- 3. console ---------- */
.reveal{position:relative;perspective:2200px;margin-top:20px}
.reveal .under{position:absolute;left:8%;right:8%;top:16%;bottom:-6%;
  background:radial-gradient(60% 50% at 50% 50%,rgba(95,208,190,.14),transparent 70%);filter:blur(30px)}
.app{
  position:relative;transform:rotateY(-14deg) rotateX(6deg) rotateZ(.6deg) translateZ(-30px);
  transform-origin:60% 50%;
  display:grid;grid-template-columns:186px 1fr;overflow:hidden;border-radius:14px;
  border:1px solid rgba(178,208,212,.16);
  background:linear-gradient(160deg,#101719,#0A0E0F);
  box-shadow:0 1px 0 rgba(255,255,255,.07) inset,0 80px 120px -50px rgba(0,0,0,.95),0 30px 60px -30px rgba(0,0,0,.8);
}
.side{border-right:1px solid rgba(178,208,212,.09);padding:16px 12px;background:linear-gradient(180deg,rgba(18,26,28,.7),rgba(10,14,15,.7))}
.side .mark{font-size:15px;margin:4px 8px 18px}
.side a{display:flex;align-items:center;gap:9px;font-size:12.5px;color:#93A5A7;padding:7px 9px;border-radius:6px;margin-bottom:2px}
.side a.on{background:rgba(95,208,190,.10);color:var(--ink);box-shadow:inset 0 0 0 1px rgba(95,208,190,.18)}
.side a .dot{width:5px;height:5px;border-radius:1px;background:currentColor;opacity:.55}
.side .grp{font-family:var(--mono);font-size:9px;letter-spacing:.2em;color:var(--faint);margin:18px 9px 8px}
.side .who{margin-top:24px;border-top:1px solid var(--hair);padding:12px 9px 0;font-family:var(--mono);font-size:9.5px;color:var(--faint);line-height:1.8}
.main{padding:0}
.topbar{display:flex;align-items:center;gap:14px;padding:13px 18px;border-bottom:1px solid rgba(178,208,212,.09)}
.crumb{font-family:var(--mono);font-size:11px;color:var(--dim);letter-spacing:.08em}
.crumb b{color:var(--ink);font-weight:500}
.chip{font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;color:var(--dim);border:1px solid var(--hair);
  border-radius:5px;padding:4px 9px}
.chip.on{color:var(--amber);border-color:rgba(242,169,59,.35);background:rgba(242,169,59,.08)}
.spacer{margin-left:auto}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid rgba(178,208,212,.09)}
.kpi{padding:16px 18px;border-right:1px solid rgba(178,208,212,.07)}
.kpi:last-child{border-right:0}
.kpi span{font-family:var(--mono);font-size:9.5px;letter-spacing:.18em;color:var(--faint);display:block}
.kpi b{font-family:var(--cond);font-size:28px;font-weight:600;display:block;margin-top:9px;line-height:1;letter-spacing:-.015em}
.kpi em{font-style:normal;font-family:var(--mono);font-size:10px;color:var(--dim);display:block;margin-top:8px}
.kpi em.up{color:var(--ok)}
.kpi em.down{color:var(--red)}
.panes{display:grid;grid-template-columns:1.55fr 1fr}
.pane{padding:16px 18px 18px;border-right:1px solid rgba(178,208,212,.07);border-bottom:1px solid rgba(178,208,212,.07)}
.pane:nth-child(2n){border-right:0}
.pane h4{margin:0 0 2px;font-family:var(--sans);font-size:12.5px;font-weight:500;letter-spacing:.01em;
  display:flex;align-items:center;justify-content:space-between}
.pane h4 i{font-style:normal;font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;color:var(--faint)}
.trow{display:flex;justify-content:space-between;align-items:center;font-size:11.5px;padding:7px 0;
  border-bottom:1px solid rgba(178,208,212,.06);font-family:var(--mono);color:#A9BABC}
.trow:last-child{border:0}
.trow b{color:var(--ink);font-weight:500}
.tag{font-size:9px;letter-spacing:.12em;padding:2px 7px;border-radius:4px;border:1px solid}
.tag.paid{color:var(--ok);border-color:rgba(121,198,141,.35);background:rgba(121,198,141,.08)}
.tag.due{color:var(--amber);border-color:rgba(242,169,59,.35);background:rgba(242,169,59,.08)}
.tag.over{color:var(--red);border-color:rgba(217,105,95,.35);background:rgba(217,105,95,.08)}
.stack{display:flex;height:9px;border-radius:3px;overflow:hidden;margin:14px 0 12px}
.stack i{display:block;height:100%}
.legend{display:flex;gap:16px;font-family:var(--mono);font-size:10px;color:var(--dim)}
.legend span{display:flex;align-items:center;gap:6px}
.legend u{width:7px;height:7px;border-radius:2px;text-decoration:none}
.dist{display:grid;gap:11px;margin-top:14px}
.dist div{display:grid;grid-template-columns:52px 1fr 42px;align-items:center;gap:10px;font-family:var(--mono);font-size:10.5px;color:var(--dim)}
.dist .track{height:5px;border-radius:3px;background:rgba(178,208,212,.10);overflow:hidden}
.dist .track i{display:block;height:100%;background:linear-gradient(90deg,rgba(95,208,190,.45),var(--teal))}
.dist div:nth-child(2) .track i{background:linear-gradient(90deg,rgba(242,169,59,.45),var(--amber))}
.dist div:nth-child(3) .track i{background:linear-gradient(90deg,rgba(178,208,212,.25),rgba(178,208,212,.6))}
.mcard{position:absolute;padding:10px 13px;min-width:132px;animation:float 9s ease-in-out infinite}
.mcard span{font-family:var(--mono);font-size:9px;letter-spacing:.18em;color:var(--faint);display:block}
.mcard b{font-family:var(--cond);font-size:21px;font-weight:600;display:block;margin-top:5px;line-height:1}

/* ---------- 4. query studio ---------- */
.studio{display:grid;grid-template-columns:230px 1fr;border-radius:12px;overflow:hidden;
  border:1px solid rgba(178,208,212,.16);background:linear-gradient(160deg,#0F1618,#090D0E);
  box-shadow:0 1px 0 rgba(255,255,255,.06) inset,0 60px 100px -50px #000;transform:perspective(2400px) rotateX(2.2deg)}
.hist{border-right:1px solid rgba(178,208,212,.09);padding:14px 12px;background:rgba(12,17,18,.6)}
.hist .grp{font-family:var(--mono);font-size:9px;letter-spacing:.2em;color:var(--faint);margin:2px 6px 12px}
.hist div{font-family:var(--mono);font-size:10.5px;color:#8FA2A4;padding:8px 8px;border-radius:5px;line-height:1.5;
  border-left:1px solid transparent}
.hist div.on{background:rgba(95,208,190,.07);border-left-color:var(--teal);color:var(--ink)}
.hist div i{display:block;font-style:normal;color:var(--faint);font-size:9px;margin-top:4px;letter-spacing:.1em}
.ed-top{display:flex;align-items:center;gap:10px;padding:0 14px;border-bottom:1px solid rgba(178,208,212,.09);height:42px}
.tab{font-family:var(--mono);font-size:10.5px;color:var(--ink);border:1px solid var(--hair);border-bottom:0;
  padding:6px 12px;border-radius:5px 5px 0 0;background:rgba(95,208,190,.06);position:relative;top:1px}
.tab.off{color:var(--faint);background:transparent;border-color:transparent}
.code{display:grid;grid-template-columns:44px 1fr;font-family:var(--mono);font-size:13px;line-height:2.05;padding:14px 0 18px}
.ln{color:#3E4C4E;text-align:right;padding-right:14px;border-right:1px solid rgba(178,208,212,.07);user-select:none}
.src{padding-left:16px;white-space:pre;overflow-x:auto}
.kw{color:#7FB2F0}.fn{color:var(--amber)}.tbl{color:var(--teal)}.str{color:#C3E88D}.num{color:#E4A07A}.op{color:#8FA2A4}.cmt{color:#4E6062;font-style:italic}
.caret{display:inline-block;width:8px;height:16px;background:var(--amber);vertical-align:-3px;animation:blink 1.1s steps(1) infinite;box-shadow:0 0 10px rgba(242,169,59,.7)}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
.ed-bar{display:flex;align-items:center;gap:12px;padding:9px 16px;border-top:1px solid rgba(178,208,212,.09);
  border-bottom:1px solid rgba(178,208,212,.09);font-family:var(--mono);font-size:10px;color:var(--dim);letter-spacing:.1em;
  background:linear-gradient(180deg,rgba(95,208,190,.05),transparent)}
.res{padding:6px 16px 18px}
.res table{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:12px}
.res th{text-align:left;font-weight:400;font-size:9.5px;letter-spacing:.2em;color:var(--faint);padding:12px 0 9px;
  border-bottom:1px solid var(--hair)}
.res td{padding:10px 0;border-bottom:1px solid rgba(178,208,212,.05);color:#B6C6C8}
.res td:last-child,.res th:last-child{text-align:right}
.res tr td:first-child{color:var(--ink)}
.res tr:nth-child(1) td{background:rgba(95,208,190,.04)}

/* ---------- 5. schema ---------- */
.map{position:relative;height:580px;margin-top:8px}
.map svg.links{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.ent{position:absolute;width:178px;border-radius:9px;overflow:hidden;border:1px solid var(--hair-2);
  background:linear-gradient(165deg,rgba(26,36,38,.94),rgba(10,15,16,.95));
  box-shadow:0 22px 44px -24px #000;}
.ent b{display:flex;align-items:center;justify-content:space-between;font-family:var(--mono);font-size:10px;letter-spacing:.14em;
  color:#C6D4D5;font-weight:500;padding:9px 11px;border-bottom:1px solid var(--hair);background:rgba(178,208,212,.045)}
.ent b em{font-style:normal;color:var(--faint);font-size:9px}
.ent u{display:flex;justify-content:space-between;text-decoration:none;font-family:var(--mono);font-size:9.5px;
  color:#8FA2A4;padding:6px 11px}
.ent u em{font-style:normal;color:#56686A}
.ent u.pk{color:var(--amber)}
.ent.sel{border-color:rgba(95,208,190,.6);box-shadow:0 0 0 1px rgba(95,208,190,.25),0 0 40px rgba(95,208,190,.18),0 22px 44px -24px #000}
.ent.sel b{background:rgba(95,208,190,.10);color:#DFF6F1}
.card-label{position:absolute;font-family:var(--mono);font-size:9px;letter-spacing:.1em;color:var(--faint);
  background:var(--void);padding:2px 6px;border-radius:3px;border:1px solid rgba(178,208,212,.07)}
.card-label.hi{color:#8FE8D8;border-color:rgba(95,208,190,.22);background:rgba(8,14,15,.96)}
.ent.lit{border-color:rgba(95,208,190,.34)}
.ent.lit b{color:#DCEAEB}
.ent u.fk{color:#8FE8D8}
.map-hint{position:absolute;left:0;bottom:-6px;display:flex;align-items:center;gap:9px;
  font-size:10px;letter-spacing:.16em;color:var(--faint)}
.meta-panel{position:absolute;width:214px;padding:14px 15px}
.meta-panel h5{margin:0 0 10px;font-family:var(--mono);font-size:10px;letter-spacing:.18em;color:var(--teal);font-weight:500}
.meta-panel div{display:flex;justify-content:space-between;font-family:var(--mono);font-size:10px;color:#8FA2A4;padding:5px 0;
  border-bottom:1px solid rgba(178,208,212,.06)}
.meta-panel div:last-child{border:0}
.meta-panel div em{font-style:normal;color:#56686A}

/* ---------- 6. records ---------- */
.pipeline{display:flex;align-items:center;gap:0;margin:0 0 54px}
.pill{flex:none;font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;color:#B6C6C8;padding:11px 16px;
  border:1px solid var(--hair-2);border-radius:7px;background:linear-gradient(170deg,rgba(28,38,41,.8),rgba(12,17,19,.9));
  display:flex;align-items:center;gap:9px}
.pill.done{color:var(--ok);border-color:rgba(121,198,141,.3)}
.pill.act{color:var(--amber);border-color:rgba(242,169,59,.4);box-shadow:0 0 30px -12px rgba(242,169,59,.8)}
.link{flex:1;height:1px;background:linear-gradient(90deg,rgba(178,208,212,.3),rgba(178,208,212,.1));position:relative}
.link i{position:absolute;top:-2px;left:0;width:5px;height:5px;border-radius:50%;background:var(--amber);
  box-shadow:0 0 10px rgba(242,169,59,.9);animation:run 4s cubic-bezier(.5,0,.5,1) infinite}
@keyframes run{0%{left:0;opacity:0}10%{opacity:1}90%{opacity:1}100%{left:100%;opacity:0}}
.reqs{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.req{padding:18px 20px}
.req .rh{display:flex;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:9.5px;
  letter-spacing:.18em;color:var(--faint)}
.req h3{font-family:var(--cond);font-size:22px;font-weight:600;margin:14px 0 6px}
.req p{margin:0;color:var(--dim);font-size:13px}
.req .rf{display:flex;align-items:center;gap:9px;margin-top:16px;padding-top:13px;border-top:1px solid var(--hair);
  font-family:var(--mono);font-size:10px;color:var(--dim);letter-spacing:.08em}

/* ---------- final ---------- */
.final{position:relative;padding:190px 0 190px;text-align:center;overflow:hidden}
.final .stage{position:absolute;inset:0;perspective:1400px;perspective-origin:50% 50%}
.final .core{left:50%;top:56%;transform:rotateX(-31deg) scale(.52);opacity:1}
.final h2{font-size:clamp(42px,6.4vw,86px);position:relative;z-index:2}
.final h2 span{display:block}
.final h2 .q{color:#93A5A7}
.final .lede{margin:22px auto 0;position:relative;z-index:2}
.final .cta-row{justify-content:center;position:relative;z-index:2}
.veil{position:absolute;inset:0;background:radial-gradient(46% 40% at 50% 52%,rgba(5,8,10,.44),rgba(5,8,10,.18) 60%,transparent 82%)}
.final .glowpad{position:absolute;left:50%;top:58%;width:520px;height:360px;transform:translate(-50%,-50%);z-index:1;background:radial-gradient(50% 50% at 50% 50%,rgba(242,169,59,.16),rgba(95,208,190,.07) 45%,transparent 72%);filter:blur(4px)}

/* ---------- motion notes ---------- */
.notes{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(178,208,212,.08);border:1px solid var(--hair);border-radius:10px;overflow:hidden}
.note{background:#090D0E;padding:20px 22px}
.note b{display:block;font-family:var(--mono);font-size:9.5px;letter-spacing:.2em;color:var(--teal);margin-bottom:10px;font-weight:500}
.note p{margin:0;font-size:13px;color:var(--dim);line-height:1.65}
.note p+p{margin-top:8px}
footer{padding:46px 0 60px;border-top:1px solid var(--hair);margin-top:110px;position:relative;z-index:10}
.foot{display:flex;justify-content:space-between;font-family:var(--mono);font-size:10px;letter-spacing:.14em;color:var(--faint);flex-wrap:wrap;gap:16px}

@media (max-width:1100px){
  .hero-in{grid-template-columns:1fr}
  .scene{margin:30px 0 0;height:560px}
  .flow,.reqs,.notes{grid-template-columns:1fr 1fr}
  .studio,.app{grid-template-columns:1fr}
  .map{height:auto}
}


/* ---------- tariff engine ---------- */
.calc{display:grid;grid-template-columns:1fr 44px 1.22fr 44px 1fr;align-items:stretch;gap:0}
.calc-col{padding:20px 22px 22px;display:flex;flex-direction:column}
.calc-arrow{display:grid;place-items:center}
.calc-arrow svg{width:44px;opacity:.9}
.cc-head{display:flex;align-items:center;justify-content:space-between;gap:12px;
  font-family:var(--mono);font-size:9.5px;letter-spacing:.18em;color:var(--faint);
  padding-bottom:14px;border-bottom:1px solid var(--hair)}
.cc-rows{margin-top:6px}
.cc-rows div{display:flex;justify-content:space-between;align-items:baseline;gap:12px;
  font-family:var(--mono);font-size:11.5px;color:var(--dim);padding:9px 0;border-bottom:1px solid rgba(178,208,212,.06)}
.cc-rows div em{font-style:normal;color:var(--ink)}
.cc-rows.slabs div{display:grid;grid-template-columns:1fr auto auto;gap:16px}
.cc-rows.slabs div em{color:var(--faint)}
.cc-rows.slabs div b{color:var(--ink);font-weight:500;min-width:74px;text-align:right}
.cc-big{margin-top:auto;padding-top:20px}
.cc-big b{display:block;font-family:var(--cond);font-size:44px;font-weight:600;letter-spacing:-.025em;line-height:1}
.cc-big i{display:block;font-style:normal;font-family:var(--mono);font-size:10px;letter-spacing:.16em;color:var(--faint);margin-top:9px}
.cc-big.total b{color:var(--amber)}
.slabbar{display:flex;height:7px;border-radius:4px;overflow:hidden;margin:18px 0 6px;background:rgba(178,208,212,.08)}
.slabbar i{display:block;height:100%}
.slablegend{display:flex;font-family:var(--mono);font-size:9px;letter-spacing:.14em;color:var(--faint);margin-bottom:8px}
.slablegend span{position:relative;padding-left:8px}
.slablegend span::before{content:"";position:absolute;left:0;top:3px;width:1px;height:8px;background:rgba(178,208,212,.22)}
.cc-sum{margin-top:auto;display:flex;justify-content:space-between;align-items:baseline;gap:12px;
  font-family:var(--mono);font-size:11.5px;color:var(--teal);padding:14px 0 0;border-top:1px solid rgba(95,208,190,.2)}
.cc-sum b{font-weight:500;color:#DFF6F1;font-size:13px}
.cc-foot{margin-top:18px;padding-top:18px;font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;color:var(--faint)}
.calc-note{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-top:22px;
  font-size:13px;color:var(--dim)}
.calc-note span{display:flex;align-items:center;gap:9px}
.calc-note .mono{font-size:9.5px;letter-spacing:.2em;color:var(--faint)}
.motion-strip{display:flex;align-items:center;gap:0;flex-wrap:wrap;border-top:1px solid var(--hair);padding-top:18px;
  font-family:var(--mono);font-size:9.5px;letter-spacing:.18em;color:var(--faint)}
.motion-strip b{color:var(--teal);font-weight:500;padding-right:22px;margin-right:22px;border-right:1px solid var(--hair)}
.motion-strip span{padding-right:22px;margin-right:22px;border-right:1px solid var(--hair)}
.motion-strip span:last-child{border:0}
@media (max-width:1100px){.calc{grid-template-columns:1fr}.calc-arrow{transform:rotate(90deg);padding:14px 0}}

@media (prefers-reduced-motion:reduce){
  *{animation:none!important;transition:none!important}
}

      `}</style>



      <div className="field" aria-hidden="true"><div className="grid"></div><div className="vig"></div></div>

      {/* ======================= NAV ======================= */}
      <header className="nav">
        <div className="wrap nav-in">
          <div className="mark"><svg className="logo" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect x="1" y="1" width="26" height="26" rx="8" fill="rgba(95,208,190,.055)" stroke="rgba(178,208,212,.22)"/><path d="M7.4 18.9a8.2 8.2 0 1 1 13.2 0" stroke="#5FD0BE" strokeWidth="1.5" strokeLinecap="round"/><path d="M5.9 15.1 7.6 15.5M14 6.1v1.8M22.1 15.1 20.4 15.5" stroke="rgba(178,208,212,.45)" strokeWidth="1.2" strokeLinecap="round"/><path d="M14 15.4 18.9 9.2" stroke="#F2A93B" strokeWidth="1.8" strokeLinecap="round"/><circle cx="14" cy="15.6" r="1.7" fill="#0B1113" stroke="#EAF1F1" strokeWidth="1.3"/></svg>U<i>/</i>BILL <small>Utility billing management</small></div>
          <nav className="nav-links">
  <a href="#lifecycle">Lifecycle</a>
  <a href="#console">Console</a>

  <Link
    to="/login"
    state={{ from: { pathname: "/queries" } }}
  >
    Query studio
  </Link>

  <Link
    to="/login"
    state={{ from: { pathname: "/database" } }}
  >
    Schema
  </Link>

  <Link
    to="/login"
    state={{ from: { pathname: "/records" } }}
  >
    Records
  </Link>
</nav>
          <div className="nav-status mono"><span className="led pulse"></span> DB ONLINE</div>
          <button type="button" className="btn sm" onClick={goToLogin}>
            Open control center
          </button>
        </div>
      </header>

      {/* ======================= HERO ======================= */}
      <section className="hero">
        <div className="wrap hero-in">
          <div className="hero-copy">
            <div className="eyebrow">Utility operations platform</div>
            <h1><span>UTILITY DATA.</span><span className="l2">UNDER CONTROL.</span></h1>
            <p className="lede">One platform for customers, properties, meters, consumption, tariffs, billing, payments and the database underneath all of it.</p>
            <div className="cta-row">
              <button type="button" className="btn primary" onClick={goToLogin}>
                Open control center →
              </button>
              <a className="btn" href="#console">Explore platform</a>
            </div>
            <div className="meta"><span>MYSQL</span><span>REST API</span><span>REACT</span></div>
          </div>

          <div className="scene">
            <div className="halo" aria-hidden="true"></div>
            <div className="halo warm" aria-hidden="true"></div>

            <div className="stage" aria-hidden="true">
              <div className="core">
                <div className="plate floor"></div>
                <div className="spark"></div>
                <div className="ring r2"></div>
                <div className="ring r1"></div>
                <div className="ring r3"></div>

                <div className="plate c">
                  <span className="node dim" style={{left: '30%', top: '36%'}}></span>
                  <span className="node" style={{left: '62%', top: '54%'}}></span>
                  <span className="node dim" style={{left: '46%', top: '70%'}}></span>
                </div>
                <div className="plate b">
                  <span className="node key" style={{left: '50%', top: '50%'}}></span>
                  <span className="node" style={{left: '31%', top: '42%'}}></span>
                  <span className="node" style={{left: '67%', top: '36%'}}></span>
                  <span className="node" style={{left: '38%', top: '68%'}}></span>
                  <span className="node dim" style={{left: '72%', top: '63%'}}></span>
                  <span className="node dim" style={{left: '56%', top: '24%'}}></span>
                </div>
                <div className="plate a">
                  <span className="node key" style={{left: '42%', top: '44%'}}></span>
                  <span className="node" style={{left: '63%', top: '62%'}}></span>
                  <span className="node dim" style={{left: '28%', top: '62%'}}></span>
                </div>

                <div className="rel" style={{transform: 'translate3d(-92px,0,-46px)'}}><i></i></div>
                <div className="rel warm" style={{transform: 'translate3d(0,0,0)'}}><i style={{animationDelay: '-1.4s'}}></i></div>
                <div className="rel" style={{transform: 'translate3d(86px,0,36px)'}}><i style={{animationDelay: '-2.6s'}}></i></div>
                <div className="rel" style={{transform: 'translate3d(-36px,0,104px)'}}><i style={{animationDelay: '-3.4s'}}></i></div>
                <div className="rel" style={{transform: 'translate3d(52px,0,-106px)'}}><i style={{animationDelay: '-2s'}}></i></div>

                <div className="frag" style={{transform: 'translate3d(250px,-104px,0)'}}><div className="bb">
                  <div className="fr"><b>CUSTOMER</b>
                    <u>cust_id <em>PK</em></u><u>cust_name <em>VARCHAR</em></u><u>city <em>VARCHAR</em></u></div>
                </div></div>
                <div className="frag" style={{transform: 'translate3d(0,62px,250px)'}}><div className="bb">
                  <div className="fr"><b>METER</b>
                    <u>meter_id <em>PK</em></u><u>prop_id <em>FK</em></u><u>status <em>ENUM</em></u></div>
                </div></div>
                <div className="frag" style={{transform: 'translate3d(-250px,-18px,0)'}}><div className="bb">
                  <div className="fr"><b>BILL</b>
                    <u>bill_id <em>PK</em></u><u>cycle <em>DATE</em></u><u>amount <em>DECIMAL</em></u></div>
                </div></div>
                <div className="frag" style={{transform: 'translate3d(0,150px,-250px)'}}><div className="bb">
                  <div className="fr"><b>PAYMENT</b>
                    <u>pay_id <em>PK</em></u><u>mode <em>ENUM</em></u></div>
                </div></div>
              </div>
            </div>

            <div className="dust" aria-hidden="true">
              <i style={{left: '14%', top: '22%'}}></i><i style={{left: '23%', top: '64%', animationDelay: '-2s'}}></i>
              <i style={{left: '37%', top: '14%', animationDelay: '-4s'}}></i><i style={{left: '58%', top: '80%', animationDelay: '-1s'}}></i>
              <i style={{left: '72%', top: '30%', animationDelay: '-5s'}}></i><i style={{left: '84%', top: '58%', animationDelay: '-3s'}}></i>
              <i style={{left: '66%', top: '12%', animationDelay: '-6s'}}></i><i style={{left: '44%', top: '88%', animationDelay: '-2.5s'}}></i>
              <i style={{left: '91%', top: '40%', animationDelay: '-4.5s'}}></i><i style={{left: '8%', top: '46%', animationDelay: '-1.5s'}}></i>
            </div>

            <div className="fcards">
              <div className="fcard glass near" style={{left: '0%', top: '18%'}}>
                <div className="fh"><span>CUSTOMER</span><span>C1028</span></div>
                <div className="fv">A. Sharma</div>
                <div className="fs"><span className="led teal"></span> 2 properties · 3 meters</div>
              </div>

              <div className="fcard glass far" style={{left: '22%', top: '-1%', animationDelay: '-3s'}}>
                <div className="fh"><span>ACTIVE METERS</span><span>LIVE</span></div>
                <div className="fv">1,192</div>
                <div className="bar"><i style={{width: '78%'}}></i></div>
              </div>

              <div className="fcard glass near" style={{right: '9%', top: '9%', animationDelay: '-5s', minWidth: '196px'}}>
                <div className="fh"><span>METER · MTR-1048</span><span className="mono">kWh</span></div>
                <div className="fv">482.7</div>
                <div className="fs"><span className="led pulse"></span> Active · read 14 Sep, 06:12</div>
              </div>

              <div className="fcard glass near warm" style={{left: '3%', bottom: '14%', animationDelay: '-2s', minWidth: '190px'}}>
                <div className="fh"><span>BILL · SEP 2026</span><span style={{color: 'var(--ok)'}}>PAID ✓</span></div>
                <div className="fv">₹2,840</div>
                <div className="bar"><i style={{width: '100%'}}></i></div>
              </div>

              <div className="fcard glass far" style={{left: '38%', bottom: '-2%', animationDelay: '-6s'}}>
                <div className="fh"><span>DATABASE</span><span>MYSQL 8</span></div>
                <div className="fv" style={{fontSize: '22px'}}>Connected</div>
                <div className="fs"><span className="led"></span> 11 tables · 42 ms</div>
              </div>

              <div className="fcard glass near" style={{right: '1%', bottom: '27%', animationDelay: '-4s', minWidth: '184px'}}>
                <div className="fh"><span>REVENUE · MTD</span><span style={{color: 'var(--amber)'}}>+8.4%</span></div>
                <div className="fv">₹8.4L</div>
                <div className="bar"><i style={{width: '64%'}}></i></div>
              </div>
            </div>
          </div>
        </div>

        <div className="wrap strip">
          <div className="strip-in">
            <div className="readout"><span>READINGS CAPTURED TODAY</span><b>4,218</b><i className="led teal"></i></div>
            <div className="readout"><span>COLLECTED THIS CYCLE</span><b>₹1.94L</b><i className="led"></i></div>
            <div className="readout"><span>BILLS AWAITING RELEASE</span><b>128</b><i className="led amber pulse"></i></div>
            <div className="readout"><span>RECORDS PENDING APPROVAL</span><b>17</b><i className="led amber"></i></div>
            <div className="scroll mono">SCROLL</div>
          </div>
        </div>
      </section>

      {/* ======================= 2. LIFECYCLE ======================= */}
      <section className="band" id="lifecycle">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">Data model</div>
              <h2 style={{marginTop: '22px'}}><span>THE ENTIRE UTILITY</span><span className="q">LIFECYCLE. CONNECTED.</span></h2>
            </div>
            <p className="lede" style={{maxWidth: '34ch', margin: '0 0 6px'}}>Every record downstream inherits from the one before it. A reading cannot exist without a meter; a bill cannot exist without a reading.</p>
          </div>

          <div className="flow">
            <div className="step">
              <div className="tile"><div className="cnr"></div>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="2.6"/><circle cx="9.2" cy="10.9" r="2.1"/><path d="M5.9 16.3c.5-1.7 1.8-2.6 3.3-2.6s2.8.9 3.3 2.6"/><path d="M15.2 10.2h3.6M15.2 13.4h3.6"/></svg>
              </div>
              <span className="card-idx">01</span><span className="pulse-dot"></span>
              <h3>Customer</h3>
              <p>cust_id · PK<br/>3,486 records</p>
            </div>
            <div className="step">
              <div className="tile"><div className="cnr"></div>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M4.4 20V9.4L12 4.6l7.6 4.8V20"/><path d="M2.6 20h18.8"/><path d="M9.6 20v-4.9h4.8V20"/><path d="M8.7 11.9h1.8M13.5 11.9h1.8"/></svg>
              </div>
              <span className="card-idx">02</span><span className="pulse-dot" style={{animationDelay: '-.5s'}}></span>
              <h3>Property</h3>
              <p>prop_id · FK cust_id<br/>4,107 records</p>
            </div>
            <div className="step">
              <div className="tile"><div className="cnr"></div>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><rect x="3.2" y="3.8" width="17.6" height="16.4" rx="3"/><circle cx="12" cy="10.6" r="4.1"/><path d="M12 10.6 14.7 7.9" stroke="#F2A93B" strokeWidth="1.5"/><path d="M7.7 17.2h8.6" strokeWidth="1.4"/></svg>
              </div>
              <span className="card-idx">03</span><span className="pulse-dot" style={{animationDelay: '-1s'}}></span>
              <h3>Meter</h3>
              <p>meter_id · FK prop_id<br/>1,192 active</p>
            </div>
            <div className="step">
              <div className="tile"><div className="cnr"></div>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M2.8 15.4c2.4 0 2.1-6.6 4.6-6.6s2.2 6.6 4.7 6.6 2.1-6.6 4.6-6.6c1.6 0 2.1 2.6 3.1 4.5"/><path d="M2.8 19.6h18.4" stroke="rgba(178,208,212,.35)"/><circle cx="12.1" cy="15.4" r="1.6" fill="#F2A93B" stroke="none"/></svg>
              </div>
              <span className="card-idx">04</span><span className="pulse-dot" style={{animationDelay: '-1.5s'}}></span>
              <h3>Reading</h3>
              <p>reading_id · kWh<br/>4,218 today</p>
            </div>
            <div className="step">
              <div className="tile"><div className="cnr"></div>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M6 3.6h8.6l4 4v12.8H6z"/><path d="M14.4 3.6v4h4.2"/><path d="M8.9 11.4h6.2M8.9 13.9h6.2"/><path d="M8.9 16.4h3.6" stroke="#F2A93B" strokeWidth="1.5"/></svg>
              </div>
              <span className="card-idx">05</span><span className="pulse-dot" style={{animationDelay: '-2s'}}></span>
              <h3>Bill</h3>
              <p>bill_id · tariff applied<br/>September 2026</p>
            </div>
            <div className="step">
              <div className="tile"><div className="cnr"></div>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><rect x="2.6" y="5.4" width="18.8" height="13.2" rx="2.6"/><path d="M2.6 9.6h18.8"/><rect x="5.6" y="12.6" width="4.2" height="3" rx="1" stroke="#F2A93B"/><path d="M15.4 12.5a3.1 3.1 0 0 1 0 3.6"/><path d="M17.7 11.4a5.2 5.2 0 0 1 0 5.8"/></svg>
              </div>
              <span className="card-idx">06</span>
              <h3>Payment</h3>
              <p>pay_id · card / cash / upi<br/>₹1.94L this cycle</p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= 3. CONSOLE ======================= */}
      <section className="band" id="console" style={{paddingTop: '40px'}}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">Control center</div>
              <h2 style={{marginTop: '22px'}}><span>THE WHOLE UTILITY,</span><span className="q">ON ONE SCREEN.</span></h2>
            </div>
            <p className="lede" style={{maxWidth: '34ch', margin: '0 0 6px'}}>Consumption, collections and billing health update as readings land — no export, no spreadsheet round-trip.</p>
          </div>

          <div className="reveal">
            <div className="under" aria-hidden="true"></div>
            <div className="app">
              <aside className="side">
                <div className="mark"><svg className="logo" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect x="1" y="1" width="26" height="26" rx="8" fill="rgba(95,208,190,.055)" stroke="rgba(178,208,212,.22)"/><path d="M7.4 18.9a8.2 8.2 0 1 1 13.2 0" stroke="#5FD0BE" strokeWidth="1.5" strokeLinecap="round"/><path d="M5.9 15.1 7.6 15.5M14 6.1v1.8M22.1 15.1 20.4 15.5" stroke="rgba(178,208,212,.45)" strokeWidth="1.2" strokeLinecap="round"/><path d="M14 15.4 18.9 9.2" stroke="#F2A93B" strokeWidth="1.8" strokeLinecap="round"/><circle cx="14" cy="15.6" r="1.7" fill="#0B1113" stroke="#EAF1F1" strokeWidth="1.3"/></svg>U<i>/</i>BILL</div>
                <a className="on" href="#"><span className="dot"></span> Dashboard</a>
                <a href="#"><span className="dot"></span> Database explorer</a>
                <a href="#"><span className="dot"></span> Query studio</a>
                <div className="grp">RECORDS</div>
                <a href="#"><span className="dot"></span> Customers</a>
                <a href="#"><span className="dot"></span> Properties</a>
                <a href="#"><span className="dot"></span> Meters &amp; readings</a>
                <a href="#"><span className="dot"></span> Tariffs</a>
                <a href="#"><span className="dot"></span> Bills</a>
                <a href="#"><span className="dot"></span> Payments</a>
                <div className="grp">GOVERNANCE</div>
                <a href="#"><span className="dot"></span> Approvals <span style={{marginLeft: 'auto', color: 'var(--amber)'}}>17</span></a>
                <a href="#"><span className="dot"></span> Reports</a>
                <div className="who">R. IYER · ADMIN<br/>NODE 02 · IST</div>
              </aside>

              <div className="main">
                <div className="topbar">
                  <div className="crumb">Billing cycle <b>September 2026</b> · North zone</div>
                  <span className="chip on">LIVE</span>
                  <span className="chip">CYCLE OPEN</span>
                  <div className="spacer"></div>
                  <span className="chip">⌘K</span>
                  <span className="chip">EXPORT</span>
                </div>

                <div className="grid4">
                  <div className="kpi"><span>ACTIVE CUSTOMERS</span><b>3,486</b><em className="up">+112 this cycle</em></div>
                  <div className="kpi"><span>METERS ONLINE</span><b>1,192</b><em>6 awaiting install</em></div>
                  <div className="kpi"><span>BILLED THIS CYCLE</span><b>₹8.42L</b><em className="up">+8.4% vs August</em></div>
                  <div className="kpi"><span>COLLECTED</span><b>76.4%</b><em className="down">128 bills unreleased</em></div>
                </div>

                <div className="panes">
                  <div className="pane">
                    <h4>Consumption · kWh per day <i>30 DAYS</i></h4>
                    <svg viewBox="0 0 560 180" width="100%" height="180" preserveAspectRatio="none" style={{marginTop: '10px'}}>
                      <defs>
                        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#5FD0BE" stopOpacity=".34"/>
                          <stop offset="1" stopColor="#5FD0BE" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <g stroke="rgba(178,208,212,.10)">
                        <line x1="0" y1="20" x2="560" y2="20"/><line x1="0" y1="60" x2="560" y2="60"/>
                        <line x1="0" y1="100" x2="560" y2="100"/><line x1="0" y1="140" x2="560" y2="140"/>
                        <line x1="0" y1="176" x2="560" y2="176"/>
                      </g>
                      <path d="M0,132 L40,118 L80,126 L120,96 L160,104 L200,76 L240,88 L280,60 L320,72 L360,46 L400,58 L440,36 L480,52 L520,28 L560,40 L560,176 L0,176 Z" fill="url(#ag)"/>
                      <path d="M0,132 L40,118 L80,126 L120,96 L160,104 L200,76 L240,88 L280,60 L320,72 L360,46 L400,58 L440,36 L480,52 L520,28 L560,40" fill="none" stroke="#5FD0BE" strokeWidth="1.6"/>
                      <path d="M0,152 L40,146 L80,150 L120,134 L160,140 L200,124 L240,130 L280,116 L320,122 L360,108 L400,114 L440,100 L480,108 L520,96 L560,102" fill="none" stroke="rgba(178,208,212,.3)" strokeWidth="1.2" strokeDasharray="4 4"/>
                      <circle cx="520" cy="28" r="3.4" fill="#5FD0BE"/>
                      <circle cx="520" cy="28" r="7" fill="none" stroke="#5FD0BE" stroke-opacity=".45"/>
                    </svg>
                    <div className="legend" style={{marginTop: '12px'}}>
                      <span><u style={{background: '#5FD0BE'}}></u> This cycle</span>
                      <span><u style={{background: 'rgba(178,208,212,.4)'}}></u> Same cycle last year</span>
                      <span style={{marginLeft: 'auto'}}>PEAK 482.7 kWh · 14 SEP</span>
                    </div>
                  </div>

                  <div className="pane">
                    <h4>Billing status <i>2,104 BILLS</i></h4>
                    <div className="stack">
                      <i style={{width: '68%', background: 'linear-gradient(90deg,#4FAE8E,#79C68D)'}}></i>
                      <i style={{width: '24%', background: 'linear-gradient(90deg,#D9963C,#F2A93B)'}}></i>
                      <i style={{width: '8%', background: 'linear-gradient(90deg,#B9544C,#D9695F)'}}></i>
                    </div>
                    <div className="legend" style={{flexWrap: 'wrap', gap: '12px'}}>
                      <span><u style={{background: '#79C68D'}}></u> Paid 68%</span>
                      <span><u style={{background: '#F2A93B'}}></u> Pending 24%</span>
                      <span><u style={{background: '#D9695F'}}></u> Overdue 8%</span>
                    </div>
                    <h4 style={{marginTop: '26px'}}>Payment distribution <i>MODE</i></h4>
                    <div className="dist">
                      <div><span>UPI</span><span className="track"><i style={{width: '58%'}}></i></span><span>58%</span></div>
                      <div><span>CARD</span><span className="track"><i style={{width: '27%'}}></i></span><span>27%</span></div>
                      <div><span>CASH</span><span className="track"><i style={{width: '15%'}}></i></span><span>15%</span></div>
                    </div>
                  </div>

                  <div className="pane" style={{borderBottom: '0'}}>
                    <h4>Recent records <i>LAST 6</i></h4>
                    <div style={{marginTop: '6px'}}>
                      <div className="trow"><span>BILL-20461</span><b>A. Sharma</b><span>₹2,840</span><span className="tag paid">PAID</span></div>
                      <div className="trow"><span>BILL-20460</span><b>P. Menon</b><span>₹3,120</span><span className="tag due">PENDING</span></div>
                      <div className="trow"><span>PAY-8842</span><b>R. Kumar</b><span>₹1,460</span><span className="tag paid">UPI</span></div>
                      <div className="trow"><span>BILL-20458</span><b>S. Nair</b><span>₹5,980</span><span className="tag over">OVERDUE</span></div>
                      <div className="trow"><span>MTR-1048</span><b>Reading logged</b><span>482.7 kWh</span><span className="tag paid">OK</span></div>
                      <div className="trow"><span>CUST-1028</span><b>Property added</b><span>North zone</span><span className="tag due">REVIEW</span></div>
                    </div>
                  </div>

                  <div className="pane" style={{borderBottom: '0'}}>
                    <h4>Revenue · 12 cycles <i>₹ LAKH</i></h4>
                    <svg viewBox="0 0 300 150" width="100%" height="150" style={{marginTop: '14px'}}>
                      <g fill="rgba(95,208,190,.28)">
                        <rect x="4" y="86" width="14" height="64" rx="2"/><rect x="28" y="74" width="14" height="76" rx="2"/>
                        <rect x="52" y="92" width="14" height="58" rx="2"/><rect x="76" y="66" width="14" height="84" rx="2"/>
                        <rect x="100" y="78" width="14" height="72" rx="2"/><rect x="124" y="54" width="14" height="96" rx="2"/>
                        <rect x="148" y="62" width="14" height="88" rx="2"/><rect x="172" y="44" width="14" height="106" rx="2"/>
                        <rect x="196" y="52" width="14" height="98" rx="2"/><rect x="220" y="36" width="14" height="114" rx="2"/>
                        <rect x="244" y="46" width="14" height="104" rx="2"/>
                      </g>
                      <rect x="268" y="22" width="14" height="128" rx="2" fill="#F2A93B"/>
                      <line x1="0" y1="150" x2="300" y2="150" stroke="rgba(178,208,212,.16)"/>
                    </svg>
                    <div className="legend" style={{marginTop: '10px'}}><span>OCT 25</span><span style={{marginLeft: 'auto', color: 'var(--amber)'}}>SEP 26 · ₹8.42L</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mcard glass" style={{left: '-1%', top: '12%', animationDelay: '-1s'}}>
              <span>REVENUE · MTD</span><b style={{color: 'var(--ok)'}}>+8.4%</b>
            </div>
            <div className="mcard glass" style={{left: '-2%', bottom: '14%', animationDelay: '-4s'}}>
              <span>MTR-1048</span><b>482 kWh</b>
            </div>
            <div className="mcard glass" style={{right: '-3%', top: '26%', animationDelay: '-2.5s'}}>
              <span>APPROVAL QUEUE</span><b style={{color: 'var(--amber)'}}>17 pending</b>
            </div>
            <div className="mcard glass" style={{right: '2%', bottom: '6%', animationDelay: '-5.5s', minWidth: '170px'}}>
              <span>PAYMENT RECEIVED</span><b>₹1,460 · UPI</b>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= 4. QUERY STUDIO ======================= */}
      <section className="band" id="query">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">Query studio</div>
              <h2 style={{marginTop: '22px'}}><span>ASK THE DATABASE.</span></h2>
            </div>
            <p className="lede" style={{maxWidth: '34ch', margin: '0 0 6px'}}>Write SQL against the live schema with autocomplete on every table, and keep the result set beside the query that made it.</p>
          </div>

          <div className="studio">
            <aside className="hist">
              <div className="grp">QUERY HISTORY</div>
              <div className="on">top_customers_by_billing<i>NOW · 42 MS</i></div>
              <div>overdue_bills_north_zone<i>12 MIN AGO · 61 MS</i></div>
              <div>avg_consumption_by_tariff<i>48 MIN AGO · 38 MS</i></div>
              <div>meters_without_readings<i>2 HR AGO · 94 MS</i></div>
              <div>payment_mode_split_sep<i>YESTERDAY · 27 MS</i></div>
            </aside>

            <div>
              <div className="ed-top">
                <span className="tab">top_customers.sql</span>
                <span className="tab off">schema.sql</span>
                <span className="tab off">+</span>
                <div className="spacer"></div>
                <span className="chip">ubill_db@localhost</span>
                <span className="chip on">RUN ⌘↵</span>
              </div>

              <div className="code">
                <div className="ln">1<br/>2<br/>3<br/>4<br/>5<br/>6<br/>7</div>
                <div className="src"><span className="cmt">-- highest billed customers, current cycle</span>
      <span className="kw">SELECT</span>   c.cust_name, <span className="fn">SUM</span>(b.amount) <span className="kw">AS</span> total
      <span className="kw">FROM</span>     <span className="tbl">CUSTOMER</span> c
      <span className="kw">JOIN</span>     <span className="tbl">BILL</span> b <span className="kw">ON</span> c.cust_id <span className="op">=</span> b.cust_id
      <span className="kw">WHERE</span>    b.cycle <span className="op">=</span> <span className="str">'2026-09'</span>
      <span className="kw">GROUP BY</span> c.cust_id
      <span className="kw">ORDER BY</span> total <span className="kw">DESC</span> <span className="kw">LIMIT</span> <span className="num">3</span>;<span className="caret"></span></div>
              </div>

              <div className="ed-bar">
                <span className="led pulse"></span> EXECUTED IN 42 MS
                <span style={{color: 'var(--faint)'}}>·</span> 3 ROWS
                <span style={{color: 'var(--faint)'}}>·</span> INDEX SCAN ON bill_cycle_idx
                <div className="spacer"></div>
                <span>LN 7, COL 34</span>
              </div>

              <div className="res">
                <table>
                  <tr><th>CUST_NAME</th><th>CITY</th><th>BILLS</th><th>TOTAL</th></tr>
                  <tr><td>Rahul Sharma</td><td>Chennai</td><td>6</td><td>₹18,240</td></tr>
                  <tr><td>Priya Menon</td><td>Kochi</td><td>5</td><td>₹14,820</td></tr>
                  <tr><td>Arjun Kumar</td><td>Madurai</td><td>4</td><td>₹11,920</td></tr>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= 5. SCHEMA ======================= */}
      <section className="band" id="schema">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">Database explorer</div>
              <h2 style={{marginTop: '22px'}}><span>SEE HOW THE</span><span className="q">DATA CONNECTS.</span></h2>
            </div>
            <p className="lede" style={{maxWidth: '34ch', margin: '0 0 6px'}}>Select any table to trace its keys, its relationships and the records that depend on it before you change a single row.</p>
          </div>

          <div className="map">
            <svg className="links" viewBox="0 0 1240 580" fill="none">
              <defs>
                <marker id="many" viewBox="0 0 11 12" refX="10.5" refY="6" markerWidth="11" markerHeight="12"
                        markerUnits="userSpaceOnUse" orient="auto">
                  <path d="M0,6 L10,1.5 M0,6 L10,6 M0,6 L10,10.5" stroke="#5FD0BE" strokeWidth="1.1" fill="none"/>
                </marker>
                <marker id="one" viewBox="0 0 12 12" refX="4" refY="6" markerWidth="12" markerHeight="12"
                        markerUnits="userSpaceOnUse" orient="auto">
                  <path d="M4,1.5 L4,10.5" stroke="#5FD0BE" strokeWidth="1.1" fill="none"/>
                </marker>
                <marker id="many-hi" viewBox="0 0 11 12" refX="10.5" refY="6" markerWidth="11" markerHeight="12"
                        markerUnits="userSpaceOnUse" orient="auto">
                  <path d="M0,6 L10,1.5 M0,6 L10,6 M0,6 L10,10.5" stroke="#8FE8D8" strokeWidth="1.2" fill="none"/>
                </marker>
                <marker id="one-hi" viewBox="0 0 12 12" refX="4" refY="6" markerWidth="12" markerHeight="12"
                        markerUnits="userSpaceOnUse" orient="auto">
                  <path d="M4,1.5 L4,10.5" stroke="#8FE8D8" strokeWidth="1.2" fill="none"/>
                </marker>
              </defs>

              <g stroke="rgba(95,208,190,.38)" strokeWidth="1.2" markerStart="url(#one)" markerEnd="url(#many)">
                <path d="M440,118.5 C486,118.5 478,261.5 524,261.5"/>
                <path d="M440,388.5 C486,388.5 478,261.5 524,261.5"/>
                <path d="M702,261.5 C748,261.5 740,114.5 786,114.5"/>
                <path d="M964,371.5 C1000,371.5 1012,388.5 1048,388.5"/>
              </g>
              <g stroke="rgba(143,232,216,.85)" strokeWidth="1.35" markerStart="url(#one-hi)" markerEnd="url(#many-hi)">
                <path d="M178,307.5 C226,307.5 214,118.5 262,118.5"/>
                <path d="M89,379 C89,506 330,548 600,530 C742,520 875,512 875,443" strokeDasharray="6 5"/>
              </g>
              <g stroke="rgba(95,208,190,.38)" strokeWidth="1.2" markerStart="url(#one)" markerEnd="url(#one)">
                <path d="M875,173 L875,300"/>
              </g>
              <g fill="#5FD0BE">
                <circle cx="178" cy="307.5" r="2.6"/><circle cx="440" cy="118.5" r="2.6"/>
                <circle cx="440" cy="388.5" r="2.6"/><circle cx="702" cy="261.5" r="2.6"/>
                <circle cx="875" cy="173" r="2.6"/><circle cx="964" cy="371.5" r="2.6"/>
                <circle cx="89" cy="379" r="2.6"/>
              </g>
            </svg>

            <span className="card-label hi" style={{left: '222px', top: '202px'}}>1 : N</span>
            <span className="card-label" style={{left: '462px', top: '176px'}}>1 : N</span>
            <span className="card-label" style={{left: '462px', top: '322px'}}>1 : N</span>
            <span className="card-label" style={{left: '724px', top: '172px'}}>1 : N</span>
            <span className="card-label" style={{left: '886px', top: '228px'}}>1 : 1</span>
            <span className="card-label" style={{left: '986px', top: '352px'}}>1 : N</span>
            <span className="card-label hi" style={{left: '430px', top: '526px'}}>CUSTOMER → BILL · 1 : N · billed_to</span>

            <div className="meta-panel glass" style={{left: '0', top: '0'}}>
              <h5>CUSTOMER · INSPECTOR</h5>
              <div><span>Rows</span><em>3,486</em></div>
              <div><span>Primary key</span><em style={{color: 'var(--amber)'}}>cust_id</em></div>
              <div><span>Referenced by</span><em>property, bill</em></div>
              <div><span>Indexes</span><em>3</em></div>
              <div><span>Last write</span><em>09:41 IST</em></div>
              <div><span>Engine</span><em>InnoDB · utf8mb4</em></div>
            </div>

            <div className="ent sel" style={{left: '0', top: '236px'}}>
              <b>CUSTOMER <em>SELECTED</em></b>
              <u className="pk">cust_id <em>PK</em></u><u>cust_name <em>VARCHAR</em></u><u>city <em>VARCHAR</em></u><u>phone <em>VARCHAR</em></u>
            </div>
            <div className="ent lit" style={{left: '262px', top: '60px'}}>
              <b>PROPERTY <em>4,107</em></b>
              <u className="pk">prop_id <em>PK</em></u><u className="fk">cust_id <em>FK</em></u><u>address <em>VARCHAR</em></u>
            </div>
            <div className="ent" style={{left: '262px', top: '330px'}}>
              <b>SERVICE <em>4</em></b>
              <u className="pk">svc_id <em>PK</em></u><u>svc_type <em>ENUM</em></u><u>tariff_id <em>FK</em></u>
            </div>
            <div className="ent" style={{left: '524px', top: '190px'}}>
              <b>METER <em>1,192</em></b>
              <u className="pk">meter_id <em>PK</em></u><u>prop_id <em>FK</em></u><u>svc_id <em>FK</em></u><u>status <em>ENUM</em></u>
            </div>
            <div className="ent" style={{left: '786px', top: '56px'}}>
              <b>METER_READING <em>82,914</em></b>
              <u className="pk">reading_id <em>PK</em></u><u>meter_id <em>FK</em></u><u>units <em>DECIMAL</em></u>
            </div>
            <div className="ent lit" style={{left: '786px', top: '300px'}}>
              <b>BILL <em>2,104</em></b>
              <u className="pk">bill_id <em>PK</em></u><u className="fk">cust_id <em>FK</em></u><u>reading_id <em>FK</em></u><u>amount <em>DECIMAL</em></u>
            </div>
            <div className="ent" style={{left: '1048px', top: '330px'}}>
              <b>PAYMENT <em>1,608</em></b>
              <u className="pk">pay_id <em>PK</em></u><u>bill_id <em>FK</em></u><u>mode <em>ENUM</em></u>
            </div>

            <div className="map-hint mono"><span className="led teal"></span> 2 relationships traced from CUSTOMER · 7 tables · 11 foreign keys</div>
          </div>
        </div>
      </section>

      {/* ======================= 6. RECORDS ======================= */}
      <section className="band" id="records">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">Controlled records</div>
              <h2 style={{marginTop: '22px'}}><span>NOTHING REACHES THE</span><span className="q">DATABASE UNREVIEWED.</span></h2>
            </div>
            <p className="lede" style={{maxWidth: '34ch', margin: '0 0 6px'}}>Every insert, update and delete is validated, queued and signed off before it is written. The audit trail is the record.</p>
          </div>

          <div className="pipeline">
            <span className="pill done"><span className="led"></span> USER REQUEST</span>
            <span className="link"><i></i></span>
            <span className="pill done"><span className="led"></span> VALIDATION</span>
            <span className="link"><i style={{animationDelay: '-1.3s'}}></i></span>
            <span className="pill act"><span className="led amber pulse"></span> ADMIN REVIEW</span>
            <span className="link"><i style={{animationDelay: '-2.6s'}}></i></span>
            <span className="pill">APPROVED</span>
            <span className="link"><i style={{animationDelay: '-3.4s'}}></i></span>
            <span className="pill">WRITTEN TO DB</span>
          </div>

          <div className="reqs">
            <div className="req glass">
              <div className="rh"><span>REQ-4417 · INSERT</span><span style={{color: 'var(--amber)'}}>PENDING</span></div>
              <h3>New customer</h3>
              <p>M. Krishnan · 2 properties · North zone</p>
              <div className="rf"><span className="led amber pulse"></span> Raised 14 min ago by clerk_09</div>
            </div>
            <div className="req glass">
              <div className="rh"><span>REQ-4416 · INSERT</span><span style={{color: 'var(--amber)'}}>PENDING</span></div>
              <h3>New meter</h3>
              <p>MTR-1194 · linked to PROP-3820</p>
              <div className="rf"><span className="led amber"></span> Awaiting serial verification</div>
            </div>
            <div className="req glass">
              <div className="rh"><span>REQ-4412 · UPDATE</span><span style={{color: 'var(--ok)'}}>APPROVED ✓</span></div>
              <h3>Payment correction</h3>
              <p>PAY-8842 · mode changed cash → upi</p>
              <div className="rf"><span className="led"></span> Signed off by R. Iyer · written 09:41</div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= 7. TARIFF ENGINE ======================= */}
      <section className="band" id="tariff" style={{paddingTop: '20px'}}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">Tariff engine</div>
              <h2 style={{marginTop: '22px'}}><span>FROM A READING</span><span className="q">TO AN AMOUNT.</span></h2>
            </div>
            <p className="lede" style={{maxWidth: '34ch', margin: '0 0 6px'}}>The step everyone argues about. Slabs, fixed charges and duty are applied by the system, shown in full, and stored with the bill.</p>
          </div>

          <div className="calc">
            <div className="calc-col glass">
              <div className="cc-head"><span>READING · MTR-1048</span><span className="led teal"></span></div>
              <div className="cc-rows">
                <div><span>Previous</span><em>8,412.3 kWh</em></div>
                <div><span>Current</span><em>8,895.0 kWh</em></div>
                <div><span>Period</span><em>16 Aug – 15 Sep</em></div>
                <div><span>Source</span><em>Field capture</em></div>
              </div>
              <div className="cc-big"><b>482.7</b><i>kWh billed</i></div>
            </div>

            <div className="calc-arrow" aria-hidden="true">
              <svg viewBox="0 0 44 12" fill="none"><path d="M2 6h34" stroke="rgba(95,208,190,.5)" strokeWidth="1.2"/><path d="M33 2 38 6l-5 4" stroke="#5FD0BE" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round"/></svg>
            </div>

            <div className="calc-col glass">
              <div className="cc-head"><span>TARIFF LT-1 · DOMESTIC</span><span className="mono" style={{color: 'var(--faint)'}}>v4</span></div>
              <div className="slabbar">
                <i style={{width: '20.7%', background: 'linear-gradient(90deg,#2E6A63,#3E8C81)'}}></i>
                <i style={{width: '41.4%', background: 'linear-gradient(90deg,#3E8C81,#5FD0BE)'}}></i>
                <i style={{width: '37.9%', background: 'linear-gradient(90deg,#C98F36,#F2A93B)'}}></i>
              </div>
              <div className="slablegend"><span style={{width: '20.7%'}}>100</span><span style={{width: '41.4%'}}>200</span><span style={{width: '37.9%'}}>182.7 units</span></div>
              <div className="cc-rows slabs">
                <div><span>0 – 100 units</span><em>₹3.50</em><b>₹350.00</b></div>
                <div><span>101 – 300 units</span><em>₹5.20</em><b>₹1,040.00</b></div>
                <div><span>301 – 482.7 units</span><em>₹6.40</em><b>₹1,169.28</b></div>
              </div>
              <div className="cc-sum"><span>Energy charge</span><b>₹2,559.28</b></div>
              <div className="cc-foot">Slab rates versioned · effective 01 Apr 2026</div>
            </div>

            <div className="calc-arrow" aria-hidden="true">
              <svg viewBox="0 0 44 12" fill="none"><path d="M2 6h34" stroke="rgba(242,169,59,.5)" strokeWidth="1.2"/><path d="M33 2 38 6l-5 4" stroke="#F2A93B" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round"/></svg>
            </div>

            <div className="calc-col glass amount">
              <div className="cc-head"><span>BILL-20461 · SEP 2026</span><span className="tag paid">ISSUED</span></div>
              <div className="cc-rows">
                <div><span>Energy charge</span><em>₹2,559.28</em></div>
                <div><span>Fixed charge</span><em>₹160.00</em></div>
                <div><span>Electricity duty · 5%</span><em>₹127.96</em></div>
                <div><span>Round off</span><em>−₹7.24</em></div>
              </div>
              <div className="cc-big total"><b>₹2,840</b><i>payable by 28 Sep 2026</i></div>
            </div>
          </div>

          <div className="calc-note">
            <span><span className="led teal"></span> Every bill stores the tariff version it was computed with, so a rate change never rewrites history.</span>
            <span className="mono">RECOMPUTE · AUDIT TRAIL · DISPUTE-READY</span>
          </div>
        </div>
      </section>

      <section className="band" style={{padding: '0 0 110px'}}>
        <div className="wrap motion-strip">
          <b>MOTION SPEC</b>
          <span>CORE · 54 s PER TURN</span>
          <span>CARDS · 9–11 s DESYNCED DRIFT</span>
          <span>DATA PARTICLES · 4.4 s</span>
          <span>PARALLAX · ±12 px DAMPED</span>
          <span>REDUCED MOTION · HONOURED</span>
        </div>
      </section>

      {/* ======================= FINAL ======================= */}
      <section className="final">
        <div className="stage" aria-hidden="true">
          <div className="core">
            <div className="plate floor"></div>
            <div className="spark"></div>
            <div className="ring r2"></div>
            <div className="ring r1"></div>
            <div className="plate b">
              <span className="node key" style={{left: '50%', top: '50%'}}></span>
              <span className="node" style={{left: '32%', top: '44%'}}></span>
              <span className="node" style={{left: '66%', top: '38%'}}></span>
              <span className="node dim" style={{left: '44%', top: '70%'}}></span>
            </div>
            <div className="plate a"><span className="node" style={{left: '46%', top: '48%'}}></span></div>
            <div className="plate c"><span className="node dim" style={{left: '58%', top: '56%'}}></span></div>
            <div className="rel" style={{transform: 'translate3d(-92px,0,-46px)'}}><i></i></div>
            <div className="rel warm" style={{transform: 'translate3d(0,0,0)'}}><i style={{animationDelay: '-1.4s'}}></i></div>
            <div className="rel" style={{transform: 'translate3d(86px,0,36px)'}}><i style={{animationDelay: '-2.6s'}}></i></div>
          </div>
        </div>
        <div className="veil" aria-hidden="true"></div>
        <div className="glowpad" aria-hidden="true"></div>
        <div className="wrap">
          <h2><span>ONE SYSTEM.</span><span className="q">EVERY UTILITY RECORD.</span></h2>
          <p className="lede" style={{maxWidth: '44ch'}}>Customers, meters, readings, tariffs, bills and payments — held in one relational core, queried and controlled from one place.</p>
          <div className="cta-row">
            <button type="button" className="btn primary" onClick={goToLogin}>
              Enter system →
            </button>
            <Link className="btn" to="/database">
              Read the schema
            </Link>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap foot">
          <span><svg className="logo" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect x="1" y="1" width="26" height="26" rx="8" fill="rgba(95,208,190,.055)" stroke="rgba(178,208,212,.22)"/><path d="M7.4 18.9a8.2 8.2 0 1 1 13.2 0" stroke="#5FD0BE" strokeWidth="1.5" strokeLinecap="round"/><path d="M5.9 15.1 7.6 15.5M14 6.1v1.8M22.1 15.1 20.4 15.5" stroke="rgba(178,208,212,.45)" strokeWidth="1.2" strokeLinecap="round"/><path d="M14 15.4 18.9 9.2" stroke="#F2A93B" strokeWidth="1.8" strokeLinecap="round"/><circle cx="14" cy="15.6" r="1.7" fill="#0B1113" stroke="#EAF1F1" strokeWidth="1.3"/></svg>U/BILL · UTILITY BILLING MANAGEMENT SYSTEM</span>
          <span>VISUAL CONCEPT SHEET · V1 · SEP 2026</span>
          <span>MYSQL · REST API · REACT</span>
        </div>
      </footer>


    </>
  );
}
