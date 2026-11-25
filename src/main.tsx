import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import StickmanStudio from "./StickmanStudio";
import "./style.css";

function Root() {
  const [stickman, setStickman] = useState(() => new URLSearchParams(window.location.search).get("mode") === "stickman");
  const open = () => { const url = new URL(window.location.href); url.searchParams.set("mode", "stickman"); window.history.pushState({}, "", url); setStickman(true); };
  const close = () => { const url = new URL(window.location.href); url.searchParams.delete("mode"); window.history.pushState({}, "", url); setStickman(false); };
  return stickman ? <StickmanStudio onClose={close} /> : <><App /><button onClick={open} aria-label="Open Stickman Studio" style={{position:"fixed",right:16,bottom:16,zIndex:9999,border:"1px solid #a8ff60",borderRadius:10,padding:"12px 16px",background:"#101a27",color:"#a8ff60",fontWeight:800,letterSpacing:1,boxShadow:"0 8px 28px #0008"}}>✦ STICKMAN STUDIO</button></>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><Root /></React.StrictMode>);
