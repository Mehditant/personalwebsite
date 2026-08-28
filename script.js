(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  const pointer = {
    tx: innerWidth / 2,
    ty: innerHeight / 2,
    x: innerWidth / 2,
    y: innerHeight / 2,
    lx: innerWidth / 2,
    ly: innerHeight / 2,
    vx: 0,
    vy: 0,
    hover: false,
  };

  let shock = 1;
  let running = true;
  const trail = [];

  document.addEventListener("mousemove", e => {
    pointer.tx = e.clientX;
    pointer.ty = e.clientY;
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) tick();
  });

  class TextScramble {
    constructor(el) {
      this.el = el;
      this.chars = "/\\|+*#?_·";
      this.update = this.update.bind(this);
    }

    setText(text) {
      const promise = new Promise(resolve => (this.resolve = resolve));
      this.queue = text.split("").map((char, i) => ({
        to: char,
        start: Math.floor(Math.random() * 10),
        end: Math.floor(Math.random() * 12) + 12 + i * 3,
        cur: "",
      }));
      cancelAnimationFrame(this.raf);
      this.frame = 0;
      this.update();
      return promise;
    }

    update() {
      let out = "";
      let done = 0;
      for (const item of this.queue) {
        if (this.frame >= item.end) {
          done++;
          out += item.to;
        } else if (this.frame >= item.start) {
          if (!item.cur || Math.random() < 0.28) {
            item.cur = this.chars[Math.floor(Math.random() * this.chars.length)];
          }
          out += `<span class="dud">${item.cur}</span>`;
        } else {
          out += `<span style="opacity:0">${item.to}</span>`;
        }
      }
      this.el.innerHTML = out;
      if (done < this.queue.length) {
        this.raf = requestAnimationFrame(this.update);
        this.frame++;
      } else {
        this.resolve();
      }
    }
  }

  function splitChars(el) {
    const text = el.textContent;
    el.textContent = "";
    const nodes = [];
    for (const ch of text) {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = ch === " " ? "\u00A0" : ch;
      span._x = 0;
      span._y = 0;
      span._vx = 0;
      span._vy = 0;
      el.appendChild(span);
      nodes.push(span);
    }
    return nodes;
  }

  function createField() {
    const canvas = document.getElementById("field");
    if (!canvas) return null;
    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) return null;

    const vert = `
      attribute vec2 a;
      void main(){ gl_Position = vec4(a,0.0,1.0); }
    `;

    const frag = `
      precision highp float;
      uniform vec2 uRes;
      uniform vec2 uMouse;
      uniform vec2 uLag;

      void main(){
        vec2 uv = gl_FragCoord.xy / uRes;
        vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
        vec2 p = (uv - 0.5) * aspect;
        vec2 m = (uMouse - 0.5) * aspect;
        vec2 l = (uLag - 0.5) * aspect;
        float light = exp(-length(p - m) * 2.8) * 0.04
                    + exp(-length(p - l) * 3.4) * 0.015;
        vec3 paper = vec3(0.945, 0.933, 0.894);
        vec3 blue  = vec3(0.122, 0.235, 1.0);
        gl_FragColor = vec4(paper + blue * light, 1.0);
      }
    `;

    function compile(type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    }

    const vs = compile(gl.VERTEX_SHADER, vert);
    const fs = compile(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return null;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = {
      res: gl.getUniformLocation(prog, "uRes"),
      mouse: gl.getUniformLocation(prog, "uMouse"),
      lag: gl.getUniformLocation(prog, "uLag"),
      time: gl.getUniformLocation(prog, "uTime"),
      shock: gl.getUniformLocation(prog, "uShock"),
    };

    const state = { gl, canvas, u, w: 0, h: 0 };

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, coarse ? 1 : 1.6);
      const w = innerWidth;
      const h = innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      gl.viewport(0, 0, canvas.width, canvas.height);
      state.w = canvas.width;
      state.h = canvas.height;
    }

    resize();
    addEventListener("resize", resize);

    state.draw = t => {
      gl.uniform2f(u.res, state.w, state.h);
      gl.uniform2f(u.mouse, pointer.x / innerWidth, 1 - pointer.y / innerHeight);
      gl.uniform2f(u.lag, pointer.lx / innerWidth, 1 - pointer.ly / innerHeight);
      gl.uniform1f(u.time, t);
      gl.uniform1f(u.shock, shock);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    return state;
  }

  function createInk() {
    const canvas = document.getElementById("ink");
    if (!canvas || coarse) return null;
    const ctx = canvas.getContext("2d");
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.floor(innerWidth * dpr);
      canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    addEventListener("resize", resize);
    return { canvas, ctx };
  }

  function spinNumber(el, final) {
    let n = 0;
    const frames = 22 + Math.floor(Math.random() * 8);
    const id = setInterval(() => {
      n++;
      el.textContent = String((Math.random() * 30) | 0).padStart(2, "0");
      if (n >= frames) {
        clearInterval(id);
        el.textContent = final;
      }
    }, 28);
  }

  function initReveal() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        const num = entry.target.querySelector("[data-spin]");
        if (num && !reduce) spinNumber(num, num.dataset.spin);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -48px 0px" });

    document.querySelectorAll(".reveal").forEach((el, i) => {
      el.style.transitionDelay = `${(i % 3) * 0.11}s`;
      observer.observe(el);
    });
  }

  function initNav() {
    const nav = document.getElementById("nav");
    const bar = document.getElementById("reading-bar");
    const onScroll = () => {
      if (nav) nav.classList.toggle("is-stuck", window.scrollY > 40);
      if (bar) {
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
      }
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
  }

  const field = reduce ? null : createField();
  const ink = reduce ? null : createInk();
  if (field) document.body.classList.add("has-engine");

  const dot = document.getElementById("cursor-dot");
  const ring = document.getElementById("cursor-ring");
  const magnets = [...document.querySelectorAll("[data-magnet]")].map(el => {
    el._x = 0; el._y = 0; el._vx = 0; el._vy = 0;
    return el;
  });
  const cards = [...document.querySelectorAll(".work li")];
  let chars = [];

  if (!coarse && !reduce) {
    document.querySelectorAll("a, button, .work li, .hero-portrait").forEach(el => {
      el.addEventListener("mouseenter", () => { pointer.hover = true; document.body.classList.add("cursor-hover"); });
      el.addEventListener("mouseleave", () => { pointer.hover = false; document.body.classList.remove("cursor-hover"); });
    });

    cards.forEach(card => {
      card.addEventListener("mousemove", e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--rx", `${(-py * 7).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${(px * 9).toFixed(2)}deg`);
      });
      card.addEventListener("mouseleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  const nameEl = document.getElementById("hero-name");
  if (nameEl && !reduce) {
    const fx = new TextScramble(nameEl);
    setTimeout(() => {
      fx.setText("Mehdi Baï").then(() => {
        chars = splitChars(nameEl);
        shock = 0;
      });
    }, 120);
  }

  function tick(now) {
    if (!running) return;
    requestAnimationFrame(tick);

    const t = (now || 0) * 0.001;
    const prevX = pointer.x;
    const prevY = pointer.y;
    pointer.x += (pointer.tx - pointer.x) * 0.18;
    pointer.y += (pointer.ty - pointer.y) * 0.18;
    pointer.lx += (pointer.x - pointer.lx) * 0.06;
    pointer.ly += (pointer.y - pointer.ly) * 0.06;
    pointer.vx = pointer.x - prevX;
    pointer.vy = pointer.y - prevY;
    if (shock < 1) shock = Math.min(1, shock + 0.018);

    if (field) field.draw(t);

    if (ink && !coarse) {
      trail.unshift({ x: pointer.x, y: pointer.y });
      if (trail.length > 18) trail.pop();
      const ctx = ink.ctx;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      if (trail.length > 2) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length - 1; i++) {
          const x = (trail[i].x + trail[i + 1].x) / 2;
          const y = (trail[i].y + trail[i + 1].y) / 2;
          ctx.quadraticCurveTo(trail[i].x, trail[i].y, x, y);
        }
        ctx.strokeStyle = "rgba(31,60,255,0.12)";
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }

    if (dot && ring && !coarse && !reduce) {
      const speed = Math.min(Math.hypot(pointer.vx, pointer.vy), 42);
      const ang = Math.atan2(pointer.vy, pointer.vx);
      const stretch = 1 + speed * 0.028;
      const squat = Math.max(0.62, 1 - speed * 0.018);
      const hover = pointer.hover ? 1.5 : 1;
      dot.style.transform = `translate(${pointer.tx}px, ${pointer.ty}px)`;
      ring.style.transform = `translate(${pointer.x}px, ${pointer.y}px) rotate(${ang}rad) scale(${stretch * hover}, ${squat * hover})`;
    }

    if (!coarse && !reduce) {
      for (const el of chars) {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2 - el._x;
        const cy = r.top + r.height / 2 - el._y;
        let dx = cx - pointer.x;
        let dy = cy - pointer.y;
        const dist = Math.hypot(dx, dy) || 1;
        const force = Math.max(0, 1 - dist / 130) * 26;
        const tx = (dx / dist) * force;
        const ty = (dy / dist) * force;
        el._vx += (tx - el._x) * 0.18;
        el._vy += (ty - el._y) * 0.18;
        el._vx *= 0.72;
        el._vy *= 0.72;
        el._x += el._vx;
        el._y += el._vy;
        const aberr = Math.min(3, speedAberration());
        el.style.transform = `translate3d(${el._x.toFixed(2)}px, ${el._y.toFixed(2)}px, 0)`;
        el.style.textShadow = aberr > 0.4
          ? `${aberr}px 0 rgba(31,60,255,0.45), ${-aberr}px 0 rgba(23,22,20,0.2)`
          : "none";
      }

      for (const el of magnets) {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2 - el._x;
        const cy = r.top + r.height / 2 - el._y;
        const dx = pointer.x - cx;
        const dy = pointer.y - cy;
        const dist = Math.hypot(dx, dy);
        const radius = 110;
        const pull = dist < radius ? (1 - dist / radius) * 22 : 0;
        const tx = dist ? (dx / dist) * pull : 0;
        const ty = dist ? (dy / dist) * pull : 0;
        el._vx += (tx - el._x) * 0.16;
        el._vy += (ty - el._y) * 0.16;
        el._vx *= 0.74;
        el._vy *= 0.74;
        el._x += el._vx;
        el._y += el._vy;
        el.style.transform = `translate3d(${el._x.toFixed(2)}px, ${el._y.toFixed(2)}px, 0)`;
      }
    }
  }

  function speedAberration() {
    return Math.hypot(pointer.vx, pointer.vy) * 0.22;
  }

  initReveal();
  initNav();
  if (!reduce) requestAnimationFrame(tick);
})();
