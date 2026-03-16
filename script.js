/* ─── Text Scramble ──────────────────────────────────────── */
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '/\\|—+*#?_·';
    this.update = this.update.bind(this);
  }

  setText(text) {
    const promise = new Promise(resolve => (this.resolve = resolve));
    this.queue = text.split('').map((char, i) => ({
      to:    char,
      start: Math.floor(Math.random() * 12),
      end:   Math.floor(Math.random() * 14) + 14 + i * 4,
      cur:   '',
    }));
    cancelAnimationFrame(this.raf);
    this.frame = 0;
    this.update();
    return promise;
  }

  update() {
    let out = '';
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

/* ─── Custom Cursor ──────────────────────────────────────── */
function initCursor() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx, ry = my;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  (function lerpRing() {
    rx += (mx - rx) * 0.11;
    ry += (my - ry) * 0.11;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(lerpRing);
  })();

  document.querySelectorAll('a, button, .project').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

/* ─── Scroll Reveal ──────────────────────────────────────── */
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 0.11}s`;
    observer.observe(el);
  });
}

/* ─── Nav on Scroll ──────────────────────────────────────── */
function initNav() {
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

/* ─── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const nameEl = document.getElementById('hero-name');
  if (nameEl) {
    const fx = new TextScramble(nameEl);
    setTimeout(() => fx.setText('Mehdi Baï'), 180);
  }

  initCursor();
  initReveal();
  initNav();
});
