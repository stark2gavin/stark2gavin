(function () {
  "use strict";

  const TAU = Math.PI * 2;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const palette = [
    [255, 246, 242],
    [255, 190, 202],
    [231, 189, 137],
    [200, 194, 237]
  ];

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function smoothstep(min, max, value) {
    const x = clamp((value - min) / (max - min), 0, 1);
    return x * x * (3 - 2 * x);
  }

  function easeOut(value) {
    return 1 - Math.pow(1 - clamp(value, 0, 1), 3);
  }

  function heartLocal(t) {
    return {
      x: 16 * Math.pow(Math.sin(t), 3),
      y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
    };
  }

  function curvePoint(curve, t) {
    const inv = 1 - t;
    const inv2 = inv * inv;
    const t2 = t * t;

    return {
      x: inv2 * inv * curve.sx + 3 * inv2 * t * curve.c1x + 3 * inv * t2 * curve.c2x + t2 * t * curve.ex,
      y: inv2 * inv * curve.sy + 3 * inv2 * t * curve.c1y + 3 * inv * t2 * curve.c2y + t2 * t * curve.ey
    };
  }

  function prepareCanvas(canvas, options = {}) {
    const context = canvas.getContext("2d", {
      alpha: options.alpha !== false,
      desynchronized: true
    });
    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr || 1.6);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { width, height, dpr };
    }

    return {
      context,
      resize,
      get width() {
        return width;
      },
      get height() {
        return height;
      }
    };
  }

  function createStarField(canvas, options = {}) {
    const surface = prepareCanvas(canvas, { maxDpr: 1.5 });
    const ctx = surface.context;
    let stars = [];
    let frame = 0;
    let running = false;

    function rebuild() {
      const { width, height } = surface.resize();
      const count = Math.round(Math.min(options.maxStars || 190, Math.max(80, (width * height) / 6200)));
      stars = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() > 0.9 ? rand(0.6, 1.35) : rand(0.16, 0.58),
        alpha: rand(0.08, 0.48),
        phase: rand(0, TAU),
        speed: rand(0.00032, 0.00086),
        warm: index % 10 === 0
      }));
    }

    function draw(time) {
      if (!running) {
        return;
      }

      ctx.clearRect(0, 0, surface.width, surface.height);

      for (const star of stars) {
        const shimmer = reducedMotion ? 0.78 : 0.6 + Math.sin(time * star.speed + star.phase) * 0.4;
        ctx.globalAlpha = star.alpha * shimmer;
        ctx.fillStyle = star.warm ? "#ffd4cb" : "#ece8f8";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, TAU);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    }

    rebuild();
    window.addEventListener("resize", rebuild, { passive: true });

    return {
      start() {
        if (!running) {
          running = true;
          frame = requestAnimationFrame(draw);
        }
      },
      stop() {
        running = false;
        cancelAnimationFrame(frame);
      }
    };
  }

  function createHeartScene(canvas) {
    const surface = prepareCanvas(canvas, { alpha: true, maxDpr: 1.6 });
    const ctx = surface.context;
    let layout = {};
    let stars = [];
    let heartParticles = [];
    let ribbons = [];
    let filaments = [];
    let bloomParticles = [];
    let groundParticles = [];
    let activeColor = -1;
    let startedAt = 0;
    let elapsedBeforePause = 0;
    let running = false;
    let frame = 0;

    function rebuild() {
      const { width, height } = surface.resize();
      const portrait = width / height < 0.92;
      const scaleY = portrait
        ? Math.min(width / 40, height / 68)
        : Math.min(height / 52, width / 88);
      const lowPower =
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4);
      const density = lowPower ? 0.68 : 1;

      layout = {
        portrait,
        lowPower,
        width,
        height,
        cx: width * (portrait ? 0.5 : 0.69),
        cy: height * (portrait ? 0.27 : 0.34),
        groundY: height * (portrait ? 0.57 : 0.74),
        scaleX: scaleY * (portrait ? 1.02 : 1.34),
        scaleY
      };

      stars = Array.from({ length: portrait ? 110 : 170 }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height * 0.74,
        radius: Math.random() > 0.93 ? rand(0.65, 1.2) : rand(0.16, 0.52),
        alpha: rand(0.07, 0.34),
        phase: rand(0, TAU),
        warm: index % 12 === 0
      }));

      heartParticles = [];
      const heartCount = Math.round((portrait ? 3900 : 5200) * density);
      for (let index = 0; index < heartCount; index += 1) {
        const t = rand(0, TAU);
        const surfacePoint = Math.random() < 0.48;
        const radial = surfacePoint ? rand(0.88, 1.035) : Math.pow(Math.random(), 0.72) * 0.92;
        const point = heartLocal(t);
        const thickness = surfacePoint
          ? rand(-1.15, 1.15)
          : rand(-1, 1) * Math.sqrt(Math.max(0, 1 - radial * radial)) * rand(4.4, 8.2);
        const roll = Math.random();

        heartParticles.push({
          x: point.x * radial,
          y: point.y * radial,
          z: thickness,
          seedX: layout.cx + rand(-17, 17),
          seedY: layout.groundY + rand(-4, 6),
          radius: surfacePoint ? rand(0.36, 1.16) : rand(0.2, 0.78),
          alpha: surfacePoint ? rand(0.32, 0.9) : rand(0.14, 0.62),
          phase: rand(0, TAU),
          delay: rand(0, 1),
          colorIndex: roll < 0.58 ? 1 : roll < 0.81 ? 0 : roll < 0.94 ? 2 : 3,
          spark: Math.random() < 0.014
        });
      }
      heartParticles.sort((a, b) => a.colorIndex - b.colorIndex);

      ribbons = Array.from({ length: portrait ? 18 : 22 }, (_, index) => ({
        scale: 0.68 + (index / (portrait ? 17 : 21)) * 0.38,
        alpha: rand(0.025, 0.1),
        width: rand(0.25, 0.72),
        phase: rand(0, TAU),
        color: index % 7 === 0 ? "231, 189, 137" : index % 5 === 0 ? "200, 194, 237" : "255, 190, 202"
      }));

      filaments = [];
      const filamentCount = Math.round((portrait ? 92 : 132) * density);
      for (let index = 0; index < filamentCount; index += 1) {
        const side = index % 2 === 0 ? -1 : 1;
        const reach = rand(0.16, portrait ? 0.54 : 0.38) * width;
        const endY = layout.groundY + rand(-0.025, 0.075) * height;
        filaments.push({
          sx: layout.cx + side * rand(0, width * 0.022),
          sy: layout.groundY + rand(-3, 5),
          c1x: layout.cx + side * rand(0.035, 0.15) * width,
          c1y: layout.groundY - rand(0.16, 0.48) * height,
          c2x: layout.cx + side * reach * rand(0.56, 0.88),
          c2y: endY - rand(0.03, 0.19) * height,
          ex: layout.cx + side * reach,
          ey: endY,
          alpha: rand(0.018, 0.066),
          width: rand(0.22, 0.78),
          delay: rand(0, 1),
          phase: rand(0, 1),
          color: Math.random() < 0.14 ? "200, 194, 237" : Math.random() < 0.2 ? "231, 189, 137" : "255, 190, 202"
        });
      }

      bloomParticles = [];
      const bloomCount = Math.round((portrait ? 1900 : 2900) * density);
      for (let index = 0; index < bloomCount; index += 1) {
        const roll = Math.random();
        bloomParticles.push({
          filamentIndex: Math.floor(Math.random() * filaments.length),
          pathT: Math.pow(rand(0.08, 1), 0.72),
          offsetX: rand(-4, 4),
          offsetY: rand(-3, 3),
          radius: Math.random() < 0.07 ? rand(0.75, 1.28) : rand(0.16, 0.58),
          alpha: rand(0.07, 0.32),
          phase: rand(0, TAU),
          delay: rand(0, 0.9),
          colorIndex: roll < 0.52 ? 1 : roll < 0.76 ? 0 : roll < 0.9 ? 2 : 3
        });
      }
      bloomParticles.sort((a, b) => a.colorIndex - b.colorIndex);

      groundParticles = [];
      const groundCount = Math.round((portrait ? 1250 : 2100) * density);
      for (let index = 0; index < groundCount; index += 1) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const distance = Math.pow(Math.random(), 0.72) * width * (portrait ? 0.52 : 0.42);
        const roll = Math.random();
        groundParticles.push({
          x: layout.cx + side * distance + rand(-8, 8),
          y: layout.groundY + rand(-height * 0.03, height * 0.07),
          seedX: layout.cx + rand(-14, 14),
          seedY: layout.groundY + rand(-3, 5),
          radius: Math.random() < 0.06 ? rand(0.72, 1.18) : rand(0.15, 0.52),
          alpha: rand(0.05, 0.28),
          phase: rand(0, TAU),
          delay: rand(0, 1),
          colorIndex: roll < 0.62 ? 1 : roll < 0.82 ? 0 : roll < 0.94 ? 2 : 3
        });
      }
      groundParticles.sort((a, b) => a.colorIndex - b.colorIndex);
    }

    function setParticleColor(colorIndex) {
      if (activeColor === colorIndex) {
        return;
      }
      const color = palette[colorIndex];
      ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      activeColor = colorIndex;
    }

    function drawParticle(x, y, radius, alpha, colorIndex) {
      setParticleColor(colorIndex);
      ctx.globalAlpha = alpha;
      if (radius < 0.76) {
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fill();
      }
    }

    function project(x, y, z, rotation, breathe) {
      const cosine = Math.cos(rotation);
      const sine = Math.sin(rotation);
      const rotatedX = x * cosine + z * sine;
      const rotatedZ = -x * sine + z * cosine;
      return {
        x: layout.cx + rotatedX * layout.scaleX * breathe,
        y: layout.cy + y * layout.scaleY * breathe,
        depth: clamp((rotatedZ + 18) / 36, 0, 1)
      };
    }

    function drawBackground(time) {
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, layout.width, layout.height);

      const haze = ctx.createRadialGradient(
        layout.cx,
        layout.cy,
        0,
        layout.cx,
        layout.cy,
        Math.min(layout.width, layout.height) * 0.58
      );
      haze.addColorStop(0, "rgba(128, 61, 81, 0.13)");
      haze.addColorStop(0.5, "rgba(75, 47, 71, 0.04)");
      haze.addColorStop(1, "rgba(8, 7, 10, 0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, layout.width, layout.height);

      for (const star of stars) {
        const pulse = 0.62 + Math.sin(time * 0.0008 + star.phase) * 0.38;
        ctx.globalAlpha = star.alpha * pulse;
        ctx.fillStyle = star.warm ? "#ffd5c8" : "#ece9f8";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function strokeCurve(curve, progress, alpha, lineWidth) {
      const steps = Math.max(2, Math.ceil(25 * progress));
      ctx.beginPath();
      for (let index = 0; index <= steps; index += 1) {
        const point = curvePoint(curve, progress * (index / steps));
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
      ctx.strokeStyle = `rgba(${curve.color}, ${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    function drawFilaments(time, elapsed) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const filament of filaments) {
        const reveal = smoothstep(0.7 + filament.delay * 0.45, 4 + filament.delay * 0.55, elapsed);
        if (reveal <= 0) {
          continue;
        }
        strokeCurve(filament, reveal, filament.alpha * reveal, filament.width);
        const headT = Math.min(reveal, (filament.phase + time * 0.000035) % 1);
        if (headT > 0.04) {
          const head = curvePoint(filament, headT);
          ctx.globalAlpha = 0.48;
          ctx.fillStyle = "#fff7f4";
          ctx.beginPath();
          ctx.arc(head.x, head.y, 0.65, 0, TAU);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    function drawBloom(time, elapsed) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      activeColor = -1;
      for (const particle of bloomParticles) {
        const reveal = easeOut(smoothstep(0.95 + particle.delay * 0.58, 4.6 + particle.delay * 0.5, elapsed));
        if (reveal <= 0) {
          continue;
        }
        const point = curvePoint(filaments[particle.filamentIndex], particle.pathT * reveal);
        const twinkle = 0.68 + Math.sin(time * 0.0024 + particle.phase) * 0.32;
        drawParticle(
          point.x + particle.offsetX * reveal,
          point.y + particle.offsetY * reveal,
          particle.radius,
          particle.alpha * reveal * Math.max(0.18, twinkle),
          particle.colorIndex
        );
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function drawGround(time, elapsed) {
      const spread = easeOut(smoothstep(1, 4.4, elapsed));
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      activeColor = -1;
      for (const particle of groundParticles) {
        const reveal = easeOut(clamp(spread - particle.delay * 0.18, 0, 1));
        if (reveal <= 0) {
          continue;
        }
        const lift = Math.sin(reveal * Math.PI) * layout.height * 0.035;
        const twinkle = 0.66 + Math.sin(time * 0.0021 + particle.phase) * 0.34;
        drawParticle(
          particle.seedX + (particle.x - particle.seedX) * reveal,
          particle.seedY + (particle.y - particle.seedY) * reveal - lift,
          particle.radius,
          particle.alpha * reveal * Math.max(0.18, twinkle),
          particle.colorIndex
        );
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function drawBranch(direction, progress, scale, z, ribbon, rotation, breathe) {
      const steps = Math.max(2, Math.ceil(86 * progress));
      ctx.beginPath();
      for (let index = 0; index <= steps; index += 1) {
        const amount = progress * (index / steps);
        const t = Math.PI + direction * Math.PI * amount;
        const local = heartLocal(t);
        const point = project(local.x * scale, local.y * scale, z, rotation, breathe);
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
      ctx.strokeStyle = `rgba(${ribbon.color}, ${ribbon.alpha * progress})`;
      ctx.lineWidth = ribbon.width;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    function drawHeart(time, elapsed) {
      const progress = reducedMotion ? 1 : smoothstep(0.45, 3.25, elapsed);
      const rotation = reducedMotion ? 0.03 : Math.sin(time * 0.00018) * 0.062;
      const breathe = 1 + Math.sin(time * 0.001) * 0.012 * smoothstep(3, 5, elapsed);
      if (progress <= 0) {
        return;
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const ribbon of ribbons) {
        const scale = ribbon.scale + Math.sin(time * 0.00052 + ribbon.phase) * 0.004;
        const z = Math.sin(time * 0.0004 + ribbon.phase) * 0.7;
        drawBranch(-1, progress, scale, z, ribbon, rotation, breathe);
        drawBranch(1, progress, scale, z, ribbon, rotation, breathe);
      }

      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(255, 151, 171, 0.52)";
      const outline = { color: "255, 222, 226", alpha: 0.43, width: 1.02 };
      drawBranch(-1, progress, 1.005, 0, outline, rotation, breathe);
      drawBranch(1, progress, 1.005, 0, outline, rotation, breathe);
      ctx.shadowBlur = 0;

      activeColor = -1;
      for (const particle of heartParticles) {
        const reveal = easeOut(smoothstep(0.75 + particle.delay * 0.62, 3.65 + particle.delay * 0.72, elapsed));
        if (reveal <= 0) {
          continue;
        }
        const point = project(particle.x, particle.y, particle.z, rotation, breathe);
        const lift = Math.sin(reveal * Math.PI) * (16 + Math.abs(particle.x) * 0.8);
        const x = particle.seedX + (point.x - particle.seedX) * reveal;
        const y = particle.seedY + (point.y - particle.seedY) * reveal - lift;
        const twinkle = 0.7 + Math.sin(time * 0.0027 + particle.phase) * 0.3;
        const radius = particle.radius * (0.72 + point.depth * 0.62);
        const alpha = particle.alpha * reveal * (0.42 + point.depth * 0.75) * Math.max(0.2, twinkle);
        drawParticle(x, y, radius, alpha, particle.colorIndex);

        if (particle.spark && reveal > 0.94 && radius > 0.72) {
          ctx.globalAlpha = alpha * 0.28;
          ctx.fillStyle = "#fffaf7";
          ctx.fillRect(x - radius * 3, y - 0.3, radius * 6, 0.6);
          ctx.fillRect(x - 0.3, y - radius * 3, 0.6, radius * 6);
          activeColor = -1;
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function drawSource(time, elapsed) {
      const reveal = smoothstep(0.04, 1.1, elapsed);
      const settle = smoothstep(4, 7, elapsed);
      const radius = Math.min(layout.width, layout.height) * 0.14;
      const alpha = (0.4 - settle * 0.24) * reveal * (0.9 + Math.sin(time * 0.0023) * 0.1);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createRadialGradient(layout.cx, layout.groundY, 0, layout.cx, layout.groundY, radius);
      glow.addColorStop(0, `rgba(255, 250, 247, ${alpha})`);
      glow.addColorStop(0.16, `rgba(255, 184, 198, ${alpha * 0.45})`);
      glow.addColorStop(1, "rgba(116, 57, 78, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(layout.cx, layout.groundY, radius, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    function draw(time) {
      if (!running) {
        return;
      }
      const elapsed = reducedMotion ? 10 : (time - startedAt) / 1000;
      drawBackground(time);
      drawFilaments(time, elapsed);
      drawBloom(time, elapsed);
      drawGround(time, elapsed);
      drawHeart(time, elapsed);
      drawSource(time, elapsed);
      frame = requestAnimationFrame(draw);
    }

    rebuild();
    window.addEventListener("resize", rebuild, { passive: true });

    return {
      start() {
        if (running) {
          return;
        }
        running = true;
        startedAt = performance.now() - elapsedBeforePause;
        frame = requestAnimationFrame(draw);
      },
      stop() {
        if (running) {
          elapsedBeforePause = Math.max(0, performance.now() - startedAt);
        }
        running = false;
        cancelAnimationFrame(frame);
      }
    };
  }

  function createFinale(canvas) {
    const surface = prepareCanvas(canvas, { maxDpr: 1.5 });
    const ctx = surface.context;
    let stars = [];
    let bursts = [];
    let running = false;
    let frame = 0;

    function rebuild() {
      const { width, height } = surface.resize();
      stars = Array.from({ length: Math.round(Math.min(170, Math.max(90, (width * height) / 6800))) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: rand(0.16, 0.82),
        alpha: rand(0.08, 0.38),
        phase: rand(0, TAU)
      }));
    }

    function burst(kind) {
      const count = kind === "yes" ? 320 : 120;
      const centerX = surface.width * 0.5;
      const centerY = surface.height * 0.48;
      bursts = Array.from({ length: count }, (_, index) => {
        const angle = rand(0, TAU);
        const speed = kind === "yes" ? rand(0.7, 4.2) : rand(0.35, 1.8);
        return {
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (kind === "yes" ? rand(0.4, 1.7) : 0),
          gravity: kind === "yes" ? 0.025 : 0.006,
          radius: rand(0.55, 1.8),
          life: 1,
          decay: rand(0.004, 0.011),
          color: index % 8 === 0 ? "#e7bd89" : index % 11 === 0 ? "#c8c2ed" : "#ffc0ca"
        };
      });
    }

    function draw(time) {
      if (!running) {
        return;
      }

      ctx.clearRect(0, 0, surface.width, surface.height);
      for (const star of stars) {
        const pulse = 0.62 + Math.sin(time * 0.0009 + star.phase) * 0.38;
        ctx.globalAlpha = star.alpha * pulse;
        ctx.fillStyle = "#f2edf8";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, TAU);
        ctx.fill();
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      bursts = bursts.filter((particle) => particle.life > 0);
      for (const particle of bursts) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += particle.gravity;
        particle.life -= particle.decay;
        ctx.globalAlpha = Math.max(0, particle.life);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    }

    rebuild();
    window.addEventListener("resize", rebuild, { passive: true });

    return {
      start() {
        if (!running) {
          running = true;
          frame = requestAnimationFrame(draw);
        }
      },
      stop() {
        running = false;
        cancelAnimationFrame(frame);
      },
      burst
    };
  }

  window.RomanticScenes = {
    createStarField,
    createHeartScene,
    createFinale
  };
})();
