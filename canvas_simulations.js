/**
 * canvas_simulations.js
 * Ultra-High-Fidelity 60 FPS Interactive Canvas2D Simulation Engine
 * Module 5: CUDA Parallel Programming // Pacheco Chapter 6
 * Covers all 8 core concepts with live particle physics, laser interconnects,
 * 32-lane SIMT lockstep execution, bank conflict radar, and interactive telemetry.
 */

class CanvasSimulationEngine {
  constructor() {
    this.activeSimId = "sim-branch-divergence";
    this.canvas = null;
    this.ctx = null;
    this.animFrameId = null;
    this.time = 0;
    this.width = 960;
    this.height = 480;
    this.dpr = 1;
    this.mouse = { x: -1, y: -1, isHover: false, clicked: false };

    // Shared simulation states
    this.states = {
      // Sim 1: CPU vs GPU Microarchitecture & Workload Shootout
      "sim-cpu-vs-gpu": {
        mode: "compare", // 'compare', 'cpu', 'gpu'
        workloadSize: 512,
        cpuProcessed: 0,
        gpuProcessed: 0,
        cpuTime: 0,
        gpuTime: 0,
        isRunning: false,
        cpuQueue: [],
        gpuSmQueues: [[], [], [], []],
        particles: []
      },

      // Sim 2: 32-Lane Warp Execution & Branch Divergence
      "sim-branch-divergence": {
        step: 0, // 0: Ready, 1: Eval cond, 2: Then-branch (+1), 3: Else-branch (-2), 4: Reconverge
        isPlaying: false,
        playSpeed: 1,
        lanes: this._generateLanes("alternating"),
        selectedLane: 0,
        pattern: "alternating",
        cycleCount: 0
      },

      // Sim 3: Grid, Block & Thread Coordinate Mapper
      "sim-coordinates": {
        gridDim: { x: 3, y: 1 },
        blockDim: { x: 8, y: 1 },
        vectorN: 20,
        selectedThread: { bx: 1, tx: 3 },
        hoverThread: null,
        viewMode: "1d" // '1d' or '2d'
      },

      // Sim 4: PCIe Interconnect & Memory Architecture Flow
      "sim-memory-flow": {
        mode: "explicit", // 'explicit' or 'managed'
        stage: 0, // 0: Idle, 1: H_Alloc, 2: D_Alloc, 3: H2D, 4: Kernel, 5: D2H, 6: Free
        isPlaying: false,
        playSpeed: 1,
        packets: [],
        progress: 0
      },

      // Sim 5: Shared Memory 32-Bank Conflict Radar
      "sim-bank-conflicts": {
        stride: 1, // 1, 2, 4, 8, 16, 32
        beamPhase: 0,
        selectedBank: null,
        pulseIntensity: 0
      },

      // Sim 6: Riemann Trapezoidal Integration & atomicAdd Race Conditions
      "sim-trap1-atomic": {
        n: 16,
        a: -3,
        b: 3,
        mode: "atomic", // 'atomic' or 'race'
        isPlaying: false,
        stepIdx: 0,
        accumulatedSum: 0.0,
        exactSum: 24.0,
        droppedWrites: 0,
        busPackets: [],
        collisionFlash: 0,
        lockHolder: null,
        frameCounter: 0
      },

      // Sim 7: Tree-Structured Reduction in Shared Memory
      "sim-tree-reduction": {
        strideIdx: 0, // 0: init, 1: stride=8, 2: stride=4, 3: stride=2, 4: stride=1, 5: done
        strides: [8, 4, 2, 1],
        dataType: "trapezoid", // 'trapezoid' or 'integer'
        baseValues: [3.35, 2.62, 1.98, 1.46, 1.03, 0.72, 0.51, 0.40, 0.40, 0.51, 0.72, 1.03, 1.46, 1.98, 2.62, 3.35],
        integerValues: [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3],
        stepHistory: [],
        currentValues: [3.35, 2.62, 1.98, 1.46, 1.03, 0.72, 0.51, 0.40, 0.40, 0.51, 0.72, 1.03, 1.46, 1.98, 2.62, 3.35],
        globalAccumulator: 0.0,
        showBankAnalysis: false,
        isPlaying: false,
        barrierFlash: 0
      },

      // Sim 8: Warp Shuffle & Multi-Warp Reduction
      "sim-warp-shuffle": {
        offsetIdx: 0, // 0: init, 1: offset=16, 2: offset=8, 3: offset=4, 4: offset=2, 5: offset=1, 6: done
        offsets: [16, 8, 4, 2, 1],
        baseRegisters: Array.from({ length: 32 }, (_, i) => {
          const x = -3 + (i + 0.5) * (6 / 32);
          return parseFloat(((x * x + 1) * (6 / 32)).toFixed(2));
        }),
        stepHistory: [],
        currentRegisters: [],
        viewMode: "warp", // 'warp' or 'hierarchical'
        isPlaying: false
      }
    };

    this.initTrapSims();
  }

  _generateLanes(pattern) {
    return Array.from({ length: 32 }, (_, i) => {
      let val = 0;
      if (pattern === "alternating") {
        val = i % 2 === 0 ? (i - 10) : (10 - i);
      } else if (pattern === "positive") {
        val = i + 2;
      } else if (pattern === "negative") {
        val = -(i + 1);
      } else if (pattern === "half") {
        val = i < 16 ? (i + 4) : -(i - 12);
      } else {
        val = Math.floor(Math.random() * 40) - 20;
      }
      return {
        id: i,
        initialVal: val,
        val: val,
        isTrue: val >= 0,
        computedVal: val,
        state: "ready"
      };
    });
  }

  initTrapSims() {
    // 1. Trap 1 Init
    const t1 = this.states["sim-trap1-atomic"];
    if (t1) {
      t1.stepIdx = 0;
      t1.accumulatedSum = 0.0;
      t1.droppedWrites = 0;
      t1.busPackets = [];
      t1.collisionFlash = 0;
      t1.lockHolder = null;
      t1.isPlaying = false;
      t1.frameCounter = 0;
    }

    // 2. Trap 2 Tree Reduction Init
    const t2 = this.states["sim-tree-reduction"];
    if (t2) {
      t2.strideIdx = 0;
      t2.dataType = t2.dataType || "trapezoid";
      t2.baseValues = [3.35, 2.62, 1.98, 1.46, 1.03, 0.72, 0.51, 0.40, 0.40, 0.51, 0.72, 1.03, 1.46, 1.98, 2.62, 3.35];
      t2.integerValues = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3];
      t2.stepHistory = this._computeTreeHistory(t2.dataType === "trapezoid" ? t2.baseValues : t2.integerValues);
      t2.currentValues = [...t2.stepHistory[0]];
      t2.globalAccumulator = 0.0;
      t2.isPlaying = false;
      t2.barrierFlash = 0;
    }

    // 3. Trap 3 Warp Shuffle Init
    const t3 = this.states["sim-warp-shuffle"];
    if (t3) {
      t3.offsetIdx = 0;
      t3.viewMode = t3.viewMode || "warp";
      t3.baseRegisters = Array.from({ length: 32 }, (_, i) => {
        const x = -3 + (i + 0.5) * (6 / 32);
        return parseFloat(((x * x + 1) * (6 / 32)).toFixed(2));
      });
      t3.stepHistory = this._computeShuffleHistory(t3.baseRegisters);
      t3.currentRegisters = [...t3.stepHistory[0]];
      t3.isPlaying = false;
    }
  }

  _computeTreeHistory(initialValues) {
    const history = [];
    let cur = [...initialValues];
    history.push([...cur]); // Step 0

    const strides = [8, 4, 2, 1];
    for (let s of strides) {
      const next = [...cur];
      for (let i = 0; i < s; i++) {
        next[i] = parseFloat((cur[i] + cur[i + s]).toFixed(2));
      }
      history.push([...next]);
      cur = next;
    }
    history.push([...cur]); // Step 5 (Done / global write)
    return history;
  }

  _computeShuffleHistory(initialRegs) {
    const history = [];
    let cur = [...initialRegs];
    history.push([...cur]); // Step 0

    const offsets = [16, 8, 4, 2, 1];
    for (let off of offsets) {
      const next = [...cur];
      for (let i = 0; i < 32; i++) {
        if (i + off < 32) {
          next[i] = parseFloat((cur[i] + cur[i + off]).toFixed(2));
        }
      }
      history.push([...next]);
      cur = next;
    }
    history.push([...cur]); // Step 6 (Done)
    return history;
  }

  stepTrapSimulation() {
    const s = this.states["sim-trap1-atomic"];
    if (!s) return;
    const n = s.n;
    const dx = 6 / n;
    const f = (x) => x * x + 1;
    const getTrapArea = (i) => {
      const x0 = -3 + i * dx;
      const x1 = -3 + (i + 1) * dx;
      return (f(x0) + f(x1)) * 0.5 * dx;
    };

    if (s.stepIdx >= n) {
      s.isPlaying = false;
      s.lockHolder = null;
      return;
    }

    if (s.mode === "atomic") {
      // Hardware serialization: 1 thread at a time
      const area = getTrapArea(s.stepIdx);
      s.lockHolder = s.stepIdx;
      s.accumulatedSum += area;
      s.busPackets.push({
        fromThread: s.stepIdx,
        val: area,
        progress: 0,
        isCollision: false
      });
      s.stepIdx++;
      if (s.stepIdx >= n) {
        s.lockHolder = null;
        s.isPlaying = false;
      }
    } else {
      // Data Race: Warp of 4 threads executes concurrently
      const warpEnd = Math.min(n, s.stepIdx + 4);
      const start = s.stepIdx;
      const survivor = start; // Arbitrary winning write
      const survivingArea = getTrapArea(survivor);
      s.accumulatedSum += survivingArea;
      const numInWarp = warpEnd - start;
      const dropped = numInWarp - 1;
      s.droppedWrites += dropped;
      s.collisionFlash = 1.0;
      for (let t = start; t < warpEnd; t++) {
        s.busPackets.push({
          fromThread: t,
          val: getTrapArea(t),
          progress: 0,
          isCollision: (t !== survivor)
        });
      }
      s.stepIdx = warpEnd;
      if (s.stepIdx >= n) {
        s.isPlaying = false;
      }
    }
  }

  // Mount canvas
  mount(canvasId, simId) {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.activeSimId = simId || this.activeSimId;

    this.resize();

    // Mouse listeners
    this.canvas.onmousemove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left);
      this.mouse.y = (e.clientY - rect.top);
      this.mouse.isHover = true;
    };
    this.canvas.onmouseleave = () => {
      this.mouse.isHover = false;
      this.mouse.x = -1;
      this.mouse.y = -1;
    };
    this.canvas.onclick = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      this.handleCanvasClick(clickX, clickY);
    };

    // Auto-resize on window resize
    window.addEventListener("resize", () => {
      if (this.canvas && document.body.contains(this.canvas)) {
        this.resize();
      }
    });

    // Start 60fps loop
    this.loop();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    const w = rect.width > 50 ? rect.width : 900;
    const h = rect.height > 50 ? rect.height : 460;

    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.width = w;
    this.height = h;

    if (this.ctx) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset scale
      this.ctx.scale(this.dpr, this.dpr);
    }
  }

  loop() {
    this.time += 0.016;
    if (this.ctx && this.canvas && document.body.contains(this.canvas)) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.render();
      this.animFrameId = requestAnimationFrame(() => this.loop());
    }
  }

  handleCanvasClick(x, y) {
    if (this.activeSimId === "sim-coordinates") {
      const s = this.states["sim-coordinates"];
      const marginX = 40, marginY = 70;
      const bw = (this.width - 80 - (s.gridDim.x - 1) * 16) / s.gridDim.x;
      const bh = 130;
      for (let bx = 0; bx < s.gridDim.x; bx++) {
        const blkX = marginX + bx * (bw + 16);
        if (x >= blkX && x <= blkX + bw && y >= marginY && y <= marginY + bh) {
          const thW = (bw - 20) / s.blockDim.x;
          const thY = marginY + 40;
          for (let tx = 0; tx < s.blockDim.x; tx++) {
            const tX = blkX + 10 + tx * thW;
            if (x >= tX && x <= tX + thW && y >= thY && y <= thY + 70) {
              s.selectedThread = { bx, tx };
              if (window.simManager) window.simManager.updateTelemetry();
              return;
            }
          }
        }
      }
    } else if (this.activeSimId === "sim-branch-divergence") {
      const s = this.states["sim-branch-divergence"];
      const startX = 300;
      const startY = 85;
      const laneW = (this.width - 340) / 32;
      for (let i = 0; i < 32; i++) {
        const lx = startX + i * laneW;
        if (x >= lx && x <= lx + laneW && y >= startY && y <= startY + 160) {
          s.selectedLane = i;
          if (window.simManager) window.simManager.updateTelemetry();
          return;
        }
      }
    } else if (this.activeSimId === "sim-bank-conflicts") {
      const startX = 50;
      const startY = 120;
      const colW = (this.width - 100) / 32;
      for (let b = 0; b < 32; b++) {
        const bx = startX + b * colW;
        if (x >= bx && x <= bx + colW && y >= startY && y <= startY + 180) {
          this.states["sim-bank-conflicts"].selectedBank = b;
          if (window.simManager) window.simManager.updateTelemetry();
          return;
        }
      }
    }
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    switch (this.activeSimId) {
      case "sim-cpu-vs-gpu":
        this.renderCpuVsGpu();
        break;
      case "sim-branch-divergence":
        this.renderBranchDivergence();
        break;
      case "sim-coordinates":
        this.renderCoordinates();
        break;
      case "sim-memory-flow":
        this.renderMemoryFlow();
        break;
      case "sim-bank-conflicts":
        this.renderBankConflicts();
        break;
      case "sim-trap1-atomic":
        this.renderTrap1Atomic();
        break;
      case "sim-tree-reduction":
        this.renderTreeReduction();
        break;
      case "sim-warp-shuffle":
        this.renderWarpShuffle();
        break;
      default:
        this.renderBranchDivergence();
    }
  }

  // =========================================================================
  // SIMULATION 1: CPU vs GPU Microarchitecture & Workload Shootout
  // =========================================================================
  renderCpuVsGpu() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const s = this.states["sim-cpu-vs-gpu"];

    this._drawGrid(ctx, w, h);

    // Title banner
    ctx.fillStyle = this.textColor();
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText("CPU (Latency-Optimized MIMD) vs. NVIDIA GPU (Throughput-Optimized SIMT)", 30, 32);

    ctx.fillStyle = this.textMutedColor();
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillText("Pacheco Section 6.2 & 6.4 // Flynn's Taxonomy: Heavy Out-of-Order Cores vs Massive Concurrency", 30, 50);

    const pad = 30;
    const boxW = (w - pad * 3) / 2;
    const boxH = h - 140;
    const topY = 70;

    // --- LEFT: CPU Die ---
    const cpuX = pad;
    this._drawGlowBox(ctx, cpuX, topY, boxW, boxH, "#38bdf8", "Intel/AMD Multi-Core CPU (Low Concurrency, Heavy Caches)");

    // CPU Cores (4 Cores)
    const coreGap = 12;
    const coreW = (boxW - 40 - coreGap) / 2;
    const coreH = (boxH - 140) / 2;
    for (let c = 0; c < 4; c++) {
      const cx = cpuX + 20 + (c % 2) * (coreW + coreGap);
      const cy = topY + 45 + Math.floor(c / 2) * (coreH + coreGap);

      const isActive = s.isRunning && (s.cpuProcessed < s.workloadSize);
      ctx.fillStyle = isActive ? "rgba(56, 189, 248, 0.22)" : "rgba(30, 41, 59, 0.5)";
      ctx.strokeStyle = isActive ? "#38bdf8" : "#475569";
      ctx.lineWidth = isActive ? 2 : 1;
      this._roundRect(ctx, cx, cy, coreW, coreH, 6, true, true);

      // Core Header
      ctx.fillStyle = this.textColor();
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText(`Heavy Core ${c} (~4.5 GHz)`, cx + 10, cy + 18);

      // Internal Units
      ctx.fillStyle = "#64748b";
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillText("• Branch Predictor (Big Speculation)", cx + 10, cy + 34);
      ctx.fillText("• Out-of-Order Engine (Deep Window)", cx + 10, cy + 48);
      ctx.fillText("• Large ALU + AVX-512 Pipeline", cx + 10, cy + 62);
      ctx.fillText("• Dedicated L1/L2 Caches (1.5 MB)", cx + 10, cy + 76);

      if (isActive) {
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(cx + coreW - 24, cy + 8, 12, 12);
      }
    }

    // CPU Giant L3 Cache (~80% Silicon Area)
    const l3Y = topY + boxH - 75;
    ctx.fillStyle = "rgba(100, 116, 139, 0.25)";
    ctx.strokeStyle = "#475569";
    this._roundRect(ctx, cpuX + 20, l3Y, boxW - 40, 55, 6, true, true);
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText("Massive Shared L3 Cache (~80% Silicon Die Area)", cpuX + 32, l3Y + 22);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText("Absorbs memory latency (~10-20ns). Few transistors dedicated to raw compute ALUs.", cpuX + 32, l3Y + 40);

    // --- RIGHT: GPU Die ---
    const gpuX = pad * 2 + boxW;
    this._drawGlowBox(ctx, gpuX, topY, boxW, boxH, "#10b981", "NVIDIA GPU Die (Streaming Multiprocessors, High Concurrency)");

    // 4 SMs
    const smW = (boxW - 40 - coreGap) / 2;
    const smH = (boxH - 120) / 2;
    for (let sm = 0; sm < 4; sm++) {
      const sx = gpuX + 20 + (sm % 2) * (smW + coreGap);
      const sy = topY + 45 + Math.floor(sm / 2) * (smH + coreGap);

      const isSmActive = s.isRunning && (s.gpuProcessed < s.workloadSize);
      ctx.fillStyle = isSmActive ? "rgba(16, 185, 129, 0.15)" : "rgba(30, 41, 59, 0.5)";
      ctx.strokeStyle = isSmActive ? "#10b981" : "#475569";
      ctx.lineWidth = isSmActive ? 2 : 1;
      this._roundRect(ctx, sx, sy, smW, smH, 6, true, true);

      // SM Header
      ctx.fillStyle = "#34d399";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText(`SM ${sm} (Warp Sched + Dispatch)`, sx + 8, sy + 16);

      // Grid of 32 CUDA Cores (SPs) per SM (represented as 32 glowing tiles)
      const coreRows = 4, coreCols = 8;
      const spW = (smW - 20) / coreCols;
      const spH = (smH - 46) / coreRows;
      for (let r = 0; r < coreRows; r++) {
        for (let cl = 0; cl < coreCols; cl++) {
          const spX = sx + 10 + cl * spW;
          const spY = sy + 24 + r * spH;
          ctx.fillStyle = isSmActive ? "#10b981" : "#1e293b";
          ctx.fillRect(spX + 1, spY + 1, spW - 2, spH - 2);
        }
      }

      ctx.fillStyle = "#94a3b8";
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillText("32 SIMT Cores + 64KB Shared SRAM", sx + 8, sy + smH - 6);
    }

    // Shared L2 Cache & High-Bandwidth VRAM Bus
    const gpuL2Y = topY + boxH - 60;
    ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
    ctx.strokeStyle = "#10b981";
    this._roundRect(ctx, gpuX + 20, gpuL2Y, boxW - 40, 40, 6, true, true);
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText("High-Bandwidth GDDR6X Bus (~900 GB/s) + L2 Cache (~6 MB)", gpuX + 32, gpuL2Y + 24);

    // --- BOTTOM TELEMETRY COMPARISON BAR ---
    const barY = h - 60;
    ctx.fillStyle = this.cardBgColor(0.95);
    ctx.strokeStyle = this.cardBorderColor();
    this._roundRect(ctx, pad, barY, w - pad * 2, 50, 8, true, true);

    // CPU Progress Bar
    const progW = (w - pad * 2 - 60) / 2;
    const cpuPct = Math.min(1, s.cpuProcessed / s.workloadSize);
    ctx.fillStyle = this.textMutedColor();
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText(`CPU: ${s.cpuProcessed} / ${s.workloadSize} Tasks (Latency: 2.1ns/task)`, pad + 15, barY + 18);
    ctx.fillStyle = this.isLightTheme() ? "#e2e8f0" : "#1e293b";
    ctx.fillRect(pad + 15, barY + 26, progW, 14);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(pad + 15, barY + 26, progW * cpuPct, 14);

    // GPU Progress Bar
    const gpuPct = Math.min(1, s.gpuProcessed / s.workloadSize);
    ctx.fillStyle = this.textMutedColor();
    ctx.fillText(`GPU: ${s.gpuProcessed} / ${s.workloadSize} Tasks (Concurrency: 128 threads/wave)`, pad + 35 + progW, barY + 18);
    ctx.fillStyle = this.isLightTheme() ? "#e2e8f0" : "#1e293b";
    ctx.fillRect(pad + 35 + progW, barY + 26, progW, 14);
    ctx.fillStyle = "#10b981";
    ctx.fillRect(pad + 35 + progW, barY + 26, progW * gpuPct, 14);

    // Animated processing if running
    if (s.isRunning) {
      if (s.cpuProcessed < s.workloadSize) {
        s.cpuProcessed = Math.min(s.workloadSize, s.cpuProcessed + 2);
      }
      if (s.gpuProcessed < s.workloadSize) {
        s.gpuProcessed = Math.min(s.workloadSize, s.gpuProcessed + 32);
      }
      if (s.cpuProcessed >= s.workloadSize && s.gpuProcessed >= s.workloadSize) {
        s.isRunning = false;
        if (window.simManager) window.simManager.updateTelemetry();
      }
    }
  }

  // =========================================================================
  // SIMULATION 2: 32-Lane Warp Branch Divergence & Lockstep Masks
  // =========================================================================
  renderBranchDivergence() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const s = this.states["sim-branch-divergence"];

    this._drawGrid(ctx, w, h);

    // Title
    ctx.fillStyle = this.textColor();
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText("Simulation 2: 32-Lane Warp Execution & Branch Serialization (Pacheco Table 6.1)", 30, 32);

    let maskHex = "0xFFFFFFFF";
    let activeDesc = "All 32 Threads Active";
    let penalty = "100% Efficiency (Uniform Lockstep)";
    if (s.step === 1) {
      maskHex = "0xFFFFFFFF";
      activeDesc = "Condition Evaluation (x[i] >= 0.0f)";
    } else if (s.step === 2) {
      maskHex = "0x55555555";
      activeDesc = "Even Lanes Active (x[i] += 1.0f); Odd Lanes MASKED (Stalled)";
      penalty = "50% ALU Efficiency (Divergent Penalty)";
    } else if (s.step === 3) {
      maskHex = "0xAAAAAAAA";
      activeDesc = "Odd Lanes Active (x[i] -= 2.0f); Even Lanes MASKED (Stalled)";
      penalty = "50% ALU Efficiency (Divergent Penalty)";
    } else if (s.step === 4) {
      maskHex = "0xFFFFFFFF";
      activeDesc = "Reconvergence Barrier Passed // All Lanes Resumed Uniform Execution";
    }

    ctx.fillStyle = "#38bdf8";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillText(`Hardware Active Mask: ${maskHex}  [${activeDesc}]`, 30, 52);

    // Left Panel: C++ Kernel Code with Animated Instruction Pointer
    const codeW = 270;
    const codeH = 260;
    const codeX = 30;
    const codeY = 75;

    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.strokeStyle = "#334155";
    this._roundRect(ctx, codeX, codeY, codeW, codeH, 8, true, true);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText("KERNEL C++ SOURCE (Warp Instruction Stream)", codeX + 14, codeY + 24);

    const codeLines = [
      { num: 1, text: "__global__ void Kernel(float* x) {", step: -1 },
      { num: 2, text: "  int i = threadIdx.x;", step: 0 },
      { num: 3, text: "  if (x[i] >= 0.0f) {", step: 1 },
      { num: 4, text: "    x[i] += 1.0f;  // THEN", step: 2 },
      { num: 5, text: "  } else {", step: -1 },
      { num: 6, text: "    x[i] -= 2.0f;  // ELSE", step: 3 },
      { num: 7, text: "  }", step: -1 },
      { num: 8, text: "  // Reconverged Point", step: 4 },
      { num: 9, text: "}", step: -1 }
    ];

    codeLines.forEach((line, idx) => {
      const lineY = codeY + 50 + idx * 22;
      const isCurrent = line.step === s.step;

      if (isCurrent) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
        ctx.fillRect(codeX + 8, lineY - 14, codeW - 16, 20);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 12px 'JetBrains Mono', monospace";
        ctx.fillText("▶", codeX + 12, lineY);
      }

      ctx.fillStyle = isCurrent ? "#ffffff" : "#64748b";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillText(`${line.num}`, codeX + 28, lineY);

      ctx.fillStyle = isCurrent ? (line.step === 2 ? "#34d399" : line.step === 3 ? "#c084fc" : "#38bdf8") : "#cbd5e1";
      ctx.fillText(line.text, codeX + 46, lineY);
    });

    // Right Panel: 32 Hardware Lanes
    const startX = codeX + codeW + 20;
    const laneW = (w - startX - 30) / 32;
    const laneH = 180;
    const startY = 75;

    s.lanes.forEach((lane, i) => {
      const lx = startX + i * laneW;
      const isTrue = lane.initialVal >= 0;
      const isSelected = i === s.selectedLane;

      let laneBg = "rgba(30, 41, 59, 0.4)";
      let strokeColor = "#475569";
      let statusText = `L${i}`;
      let valText = `${lane.val}`;
      let isStalled = false;

      if (s.step === 0) {
        valText = `${lane.initialVal}`;
        statusText = `L${i}`;
      } else if (s.step === 1) {
        laneBg = isTrue ? "rgba(16, 185, 129, 0.25)" : "rgba(168, 85, 247, 0.25)";
        strokeColor = isTrue ? "#10b981" : "#a855f7";
        statusText = isTrue ? "TRUE" : "FALSE";
        valText = `${lane.initialVal}`;
      } else if (s.step === 2) {
        // Then-branch (x[i] >= 0)
        if (isTrue) {
          laneBg = "#10b981";
          strokeColor = "#34d399";
          statusText = "+1";
          valText = `${lane.initialVal + 1}`;
        } else {
          laneBg = "rgba(15, 23, 42, 0.9)";
          strokeColor = "#f43f5e";
          statusText = "IDLE";
          valText = "MASK";
          isStalled = true;
        }
      } else if (s.step === 3) {
        // Else-branch (x[i] < 0)
        if (!isTrue) {
          laneBg = "#a855f7";
          strokeColor = "#c084fc";
          statusText = "-2";
          valText = `${lane.initialVal - 2}`;
        } else {
          laneBg = "rgba(15, 23, 42, 0.9)";
          strokeColor = "#f43f5e";
          statusText = "IDLE";
          valText = "MASK";
          isStalled = true;
        }
      } else if (s.step === 4) {
        laneBg = "rgba(56, 189, 248, 0.3)";
        strokeColor = "#38bdf8";
        statusText = "SYNC";
        valText = isTrue ? `${lane.initialVal + 1}` : `${lane.initialVal - 2}`;
      }

      // Draw Lane Column
      ctx.fillStyle = laneBg;
      ctx.strokeStyle = isSelected ? "#ffffff" : strokeColor;
      ctx.lineWidth = isSelected ? 2.5 : 1;
      this._roundRect(ctx, lx, startY, laneW - 2, laneH, 3, true, true);

      // If stalled, draw diagonal hazard stripes
      if (isStalled) {
        ctx.strokeStyle = "rgba(244, 63, 94, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lx, startY + 20);
        ctx.lineTo(lx + laneW - 2, startY + 40);
        ctx.moveTo(lx, startY + 50);
        ctx.lineTo(lx + laneW - 2, startY + 70);
        ctx.stroke();
      }

      // Lane Header
      ctx.fillStyle = isSelected ? "#ffffff" : "#cbd5e1";
      ctx.font = "bold 8px 'JetBrains Mono', monospace";
      ctx.fillText(`${i}`, lx + 2, startY + 14);

      // Status Badge
      ctx.fillStyle = isStalled ? "#f43f5e" : "#ffffff";
      ctx.font = "bold 8px 'JetBrains Mono', monospace";
      ctx.fillText(statusText, lx + 1, startY + 50);

      // Value at Bottom
      ctx.fillStyle = isStalled ? "#64748b" : "#34d399";
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillText(valText, lx + 1, startY + laneH - 8);
    });

    // SIMT Warp Mask Bit Bar under lanes
    const bitY = startY + laneH + 12;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillText("Active Bitmask [31..0]:", startX, bitY + 12);

    s.lanes.forEach((lane, i) => {
      const lx = startX + i * laneW;
      const isTrue = lane.initialVal >= 0;
      let bitActive = true;
      if (s.step === 2) bitActive = isTrue;
      if (s.step === 3) bitActive = !isTrue;

      ctx.fillStyle = bitActive ? "#10b981" : "#f43f5e";
      ctx.fillRect(lx, bitY + 18, laneW - 2, 8);
    });

    // Bottom Timeline & Takeaway
    const botY = h - 65;
    ctx.fillStyle = this.cardBgColor(0.9);
    ctx.strokeStyle = this.cardBorderColor();
    this._roundRect(ctx, 30, botY, w - 60, 50, 8, true, true);

    ctx.fillStyle = s.step === 2 || s.step === 3 ? "#f43f5e" : "#10b981";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillText(`⚡ ${penalty}`, 45, botY + 22);

    ctx.fillStyle = this.textMutedColor();
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("Pacheco Takeaway: Divergence forces the hardware warp scheduler to serialize both branches. Total time = Time(Then) + Time(Else). Avoid branch divergence within the same 32-thread warp!", 45, botY + 40);
  }

  // =========================================================================
  // SIMULATION 3: 3D / 2D Grid, Block & Thread Coordinate Mapper
  // =========================================================================
  renderCoordinates() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const s = this.states["sim-coordinates"];

    this._drawGrid(ctx, w, h);

    // Title
    ctx.fillStyle = this.textColor();
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText("Simulation 3: Grid, Block & Thread Coordinate Mapper (Pacheco Section 6.5 & 6.6)", 30, 32);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillText(`Kernel Launch: VectorAdd<<<${s.gridDim.x}, ${s.blockDim.x}>>>(n=${s.vectorN})  |  Total Allocated Threads = ${s.gridDim.x * s.blockDim.x}`, 30, 52);

    const marginX = 40;
    const marginY = 70;
    const blockGap = 16;
    const bw = (w - 80 - (s.gridDim.x - 1) * blockGap) / s.gridDim.x;
    const bh = 145;

    let selectedCoords = null;

    for (let bx = 0; bx < s.gridDim.x; bx++) {
      const blkX = marginX + bx * (bw + blockGap);
      const isBlkActive = bx === s.selectedThread.bx;

      // Draw Block Container
      ctx.fillStyle = isBlkActive ? "rgba(56, 189, 248, 0.12)" : "rgba(30, 41, 59, 0.4)";
      ctx.strokeStyle = isBlkActive ? "#38bdf8" : "#475569";
      ctx.lineWidth = isBlkActive ? 2 : 1;
      this._roundRect(ctx, blkX, marginY, bw, bh, 8, true, true);

      // Block Header
      ctx.fillStyle = isBlkActive ? "#38bdf8" : "#94a3b8";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.fillText(`Block ${bx} (blockIdx.x = ${bx})`, blkX + 10, marginY + 20);

      ctx.fillStyle = "#a855f7";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText(`SM ${bx % 4}`, blkX + bw - 40, marginY + 20);

      // Threads inside block
      const thGap = 4;
      const thW = (bw - 20 - (s.blockDim.x - 1) * thGap) / s.blockDim.x;
      const thH = 75;
      const thStartY = marginY + 35;

      for (let tx = 0; tx < s.blockDim.x; tx++) {
        const tX = blkX + 10 + tx * (thW + thGap);
        const globalId = s.blockDim.x * bx + tx;
        const inBounds = globalId < s.vectorN;
        const isSel = bx === s.selectedThread.bx && tx === s.selectedThread.tx;

        if (isSel) {
          selectedCoords = { bx, tx, globalId, inBounds, sm: bx % 4, warp: Math.floor(globalId / 32), lane: globalId % 32 };
        }

        ctx.fillStyle = isSel ? "#38bdf8" : inBounds ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.12)";
        ctx.strokeStyle = isSel ? "#ffffff" : inBounds ? "#10b981" : "#f43f5e";
        ctx.lineWidth = isSel ? 2 : 1;
        if (!inBounds) ctx.setLineDash([3, 2]);
        this._roundRect(ctx, tX, thStartY, thW, thH, 4, true, true);
        ctx.setLineDash([]);

        // Thread label
        ctx.fillStyle = isSel ? "#000000" : "#ffffff";
        ctx.font = "bold 10px 'JetBrains Mono', monospace";
        ctx.fillText(`T${tx}`, tX + 3, thStartY + 18);

        // Global ID
        ctx.fillStyle = isSel ? "#000000" : inBounds ? "#10b981" : "#f43f5e";
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.fillText(`i:${globalId}`, tX + 2, thStartY + 45);

        // Status
        ctx.fillStyle = isSel ? "#000000" : inBounds ? "#94a3b8" : "#f43f5e";
        ctx.font = "8px 'JetBrains Mono', monospace";
        ctx.fillText(inBounds ? "OK" : "SKIP", tX + 2, thStartY + 64);
      }
    }

    // Memory Vector Visualization Strip
    const vecY = marginY + bh + 18;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("Global Memory Vector (float A[n]):", marginX, vecY + 12);

    const cellW = Math.min(28, (w - 80) / s.vectorN);
    for (let i = 0; i < s.vectorN; i++) {
      const vx = marginX + 180 + i * (cellW + 2);
      const isTargeted = selectedCoords && selectedCoords.globalId === i;

      ctx.fillStyle = isTargeted ? "#38bdf8" : "rgba(30, 41, 59, 0.6)";
      ctx.strokeStyle = isTargeted ? "#ffffff" : "#475569";
      ctx.lineWidth = isTargeted ? 2 : 1;
      this._roundRect(ctx, vx, vecY, cellW, 22, 3, true, true);

      ctx.fillStyle = isTargeted ? "#000000" : "#ffffff";
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      ctx.fillText(`${i}`, vx + 3, vecY + 15);
    }

    // Bottom HUD Formula Card
    const hudY = h - 130;
    ctx.fillStyle = this.cardBgColor(0.95);
    ctx.strokeStyle = this.cardBorderColor();
    this._roundRect(ctx, marginX, hudY, w - marginX * 2, 115, 8, true, true);

    const sel = selectedCoords || { bx: 0, tx: 0, globalId: 0, inBounds: true, sm: 0, warp: 0, lane: 0 };

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillText("Interactive Coordinates HUD (Click ANY thread cell above to inspect)", marginX + 16, hudY + 22);

    ctx.fillStyle = this.textColor();
    ctx.font = "13px 'JetBrains Mono', monospace";
    ctx.fillText("Linear Index Formula:  my_i = blockDim.x * blockIdx.x + threadIdx.x", marginX + 16, hudY + 46);

    ctx.fillStyle = sel.inBounds ? "#10b981" : "#f43f5e";
    ctx.font = "bold 14px 'JetBrains Mono', monospace";
    ctx.fillText(`my_i = (${s.blockDim.x} * ${sel.bx}) + ${sel.tx} = ${sel.globalId}  -->  ${sel.inBounds ? 'VALID (Thread actively computes vector[my_i])' : 'OUT-OF-BOUNDS (my_i >= n, Safely skipped by boundary guard if (my_i < n))'}`, marginX + 16, hudY + 70);

    ctx.fillStyle = this.textMutedColor();
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText(`Hardware Mapping: Physical SM ${sel.sm}  |  Warp ${sel.warp}  |  Lane ${sel.lane}  |  Grid Ceiling: blocks = (${s.vectorN} + ${s.blockDim.x} - 1) / ${s.blockDim.x} = ${Math.ceil(s.vectorN / s.blockDim.x)}`, marginX + 16, hudY + 95);
  }

  // =========================================================================
  // SIMULATION 4: PCIe Interconnect & Memory Architecture Flow
  // =========================================================================
  renderMemoryFlow() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const s = this.states["sim-memory-flow"];

    this._drawGrid(ctx, w, h);

    // Title
    ctx.fillStyle = this.textColor();
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText("Simulation 4: PCIe Interconnect & Memory Flow (Pacheco Section 6.3 & 6.8.5)", 30, 32);

    const modeDesc = s.mode === "explicit" ? "Explicit Transfers (cudaMalloc & cudaMemcpy, Program 6.9)" : "Unified Virtual Memory (cudaMallocManaged, Program 6.6)";
    ctx.fillStyle = "#38bdf8";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillText(`Architecture Mode: ${modeDesc}`, 30, 52);

    // System Layout: Host CPU (Left) <---> PCIe 4.0 Bus (Center) <---> GPU VRAM & SMs (Right)
    const hostX = 40, hostY = 75, hw = 220, hh = 240;
    const devX = w - 280, devY = 75, dw = 240, dh = 240;
    const pcieX = hostX + hw + 20;
    const pcieW = devX - pcieX - 20;
    const pcieY = hostY + 60;
    const pcieH = 120;

    // --- HOST CARD ---
    const isHostActive = s.stage === 1 || s.stage === 3 || s.stage === 5;
    this._drawGlowBox(ctx, hostX, hostY, hw, hh, isHostActive ? "#38bdf8" : "#475569", "HOST SYSTEM (CPU + DDR RAM)");
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText("• Host RAM (~80 GB/s)", hostX + 16, hostY + 60);
    ctx.fillText("• float *h_A, *h_B, *h_C", hostX + 16, hostY + 80);
    ctx.fillText("• Sequential Driver", hostX + 16, hostY + 100);

    // Host Memory Blocks
    ctx.fillStyle = s.stage >= 1 ? "rgba(56, 189, 248, 0.3)" : "rgba(30, 41, 59, 0.4)";
    ctx.strokeStyle = s.stage >= 1 ? "#38bdf8" : "#334155";
    this._roundRect(ctx, hostX + 16, hostY + 120, hw - 32, 40, 4, true, true);
    ctx.fillStyle = s.stage >= 1 ? "#38bdf8" : "#64748b";
    ctx.fillText(s.stage >= 1 ? "h_A, h_B, h_C ALLOCATED" : "Unallocated Buffer", hostX + 24, hostY + 144);

    // --- DEVICE CARD ---
    const isDevActive = s.stage === 2 || s.stage === 4;
    this._drawGlowBox(ctx, devX, devY, dw, dh, isDevActive ? "#10b981" : "#475569", "DEVICE SYSTEM (GPU + VRAM)");
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText("• Global VRAM (~900 GB/s)", devX + 16, devY + 60);
    ctx.fillText("• float *d_A, *d_B, *d_C", devX + 16, devY + 80);
    ctx.fillText("• Streaming Multiprocessors", devX + 16, devY + 100);

    // Device Memory Blocks
    ctx.fillStyle = s.stage >= 2 && s.stage < 6 ? "rgba(16, 185, 129, 0.3)" : "rgba(30, 41, 59, 0.4)";
    ctx.strokeStyle = s.stage >= 2 && s.stage < 6 ? "#10b981" : "#334155";
    this._roundRect(ctx, devX + 16, devY + 120, dw - 32, 40, 4, true, true);
    ctx.fillStyle = s.stage >= 2 && s.stage < 6 ? "#10b981" : "#64748b";
    ctx.fillText(s.stage >= 2 && s.stage < 6 ? "d_A, d_B, d_C ALLOCATED" : "Unallocated VRAM", devX + 24, devY + 144);

    // GPU Compute Cores
    ctx.fillStyle = s.stage === 4 ? "rgba(16, 185, 129, 0.25)" : "rgba(15, 23, 42, 0.6)";
    ctx.strokeStyle = s.stage === 4 ? "#34d399" : "#334155";
    this._roundRect(ctx, devX + 16, devY + 175, dw - 32, 50, 4, true, true);
    ctx.fillStyle = s.stage === 4 ? "#34d399" : "#64748b";
    ctx.fillText(s.stage === 4 ? "⚡ KERNEL EXECUTING IN PARALLEL!" : "SM Cores Idle", devX + 24, devY + 204);

    // --- PCIE BRIDGE IN CENTER ---
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = s.stage === 3 || s.stage === 5 ? "#fbbf24" : "#334155";
    ctx.lineWidth = 2;
    this._roundRect(ctx, pcieX, pcieY, pcieW, pcieH, 8, true, true);

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillText("PCIe Gen4 x16 Bus (~31.5 GB/s)", pcieX + 20, pcieY + 28);

    ctx.fillStyle = "#f43f5e";
    ctx.font = "bold 10px 'JetBrains Mono', monospace";
    ctx.fillText("CRITICAL BOTTLENECK: ~10,000 Cycles Latency!", pcieX + 20, pcieY + 48);

    // Moving Data Packets across PCIe
    if (s.stage === 3) {
      // H2D
      const numPackets = 4;
      for (let p = 0; p < numPackets; p++) {
        const px = pcieX + 20 + ((this.time * 160 + p * (pcieW / numPackets)) % (pcieW - 40));
        ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 10;
        this._roundRect(ctx, px, pcieY + 70, 32, 20, 4, true, false);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#000000";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.fillText("H2D", px + 6, pcieY + 84);
      }
    } else if (s.stage === 5) {
      // D2H
      const numPackets = 4;
      for (let p = 0; p < numPackets; p++) {
        const px = pcieX + pcieW - 40 - ((this.time * 160 + p * (pcieW / numPackets)) % (pcieW - 40));
        ctx.fillStyle = "#a855f7";
        ctx.shadowColor = "#a855f7";
        ctx.shadowBlur = 10;
        this._roundRect(ctx, px, pcieY + 70, 32, 20, 4, true, false);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#000000";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.fillText("D2H", px + 6, pcieY + 84);
      }
    }

    // Pipeline Stepper Progress Bar at Bottom
    const stepBarY = h - 120;
    const stages = [
      "1. malloc(hx)",
      "2. cudaMalloc(dx)",
      "3. cudaMemcpy(H2D)",
      "4. Kernel Launch",
      "5. cudaMemcpy(D2H)",
      "6. cudaFree(dx)"
    ];

    const segW = (w - 80) / stages.length;
    stages.forEach((st, idx) => {
      const sx = 40 + idx * segW;
      const isCur = s.stage === idx + 1;
      const isPast = s.stage > idx + 1;

      ctx.fillStyle = isCur ? "rgba(56, 189, 248, 0.25)" : isPast ? "rgba(16, 185, 129, 0.2)" : "rgba(30, 41, 59, 0.5)";
      ctx.strokeStyle = isCur ? "#38bdf8" : isPast ? "#10b981" : "#334155";
      ctx.lineWidth = isCur ? 2 : 1;
      this._roundRect(ctx, sx, stepBarY, segW - 8, 45, 6, true, true);

      ctx.fillStyle = isCur ? "#ffffff" : isPast ? "#34d399" : "#64748b";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText(st, sx + 8, stepBarY + 26);
    });

    // Insight Footer
    ctx.fillStyle = "#fbbf24";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText("Pacheco Principle: PCIe transfer time often dwarfs GPU computation time! Keep data on the device across multiple kernel launches to amortize transfer overhead.", 40, h - 35);
  }

  // =========================================================================
  // SIMULATION 5: Shared Memory 32-Bank Conflict Radar & Stride Analyzer
  // =========================================================================
  renderBankConflicts() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const s = this.states["sim-bank-conflicts"];

    this._drawGrid(ctx, w, h);

    // Title
    ctx.fillStyle = this.textColor();
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText("Simulation 5: Shared Memory 32-Bank Conflict Radar (Pacheco Section 6.13.4 & Table 6.9)", 30, 32);

    const stride = s.stride;
    const bankHits = Array(32).fill(0);
    const threadDestinations = [];
    for (let t = 0; t < 32; t++) {
      const bank = (t * stride) % 32;
      bankHits[bank]++;
      threadDestinations.push({ thread: t, bank });
    }
    const maxConflict = Math.max(...bankHits);

    let conflictTitle = "ZERO CONFLICTS (1-to-1 Conflict-Free Access)";
    let conflictColor = "#10b981";
    if (maxConflict > 1) {
      conflictTitle = `${maxConflict}-WAY SERIALIZATION CONFLICT! (Severe Stall)`;
      conflictColor = "#f43f5e";
    }

    ctx.fillStyle = conflictColor;
    ctx.font = "bold 13px 'JetBrains Mono', monospace";
    ctx.fillText(`Active Stride: ${stride}  -->  ${conflictTitle}  |  Memory Cycles Required: ${maxConflict} Cycle(s)`, 30, 52);

    // Left Column: 32 Threads of Warp 0
    const startX = 40;
    const startY = 80;
    const colW = (w - 80) / 32;
    const colH = 170;

    // Render 32 Physical Banks
    for (let b = 0; b < 32; b++) {
      const bx = startX + b * colW;
      const count = bankHits[b];
      const isConflict = count > 1;
      const isSelected = s.selectedBank === b;

      ctx.fillStyle = count === 0 ? "rgba(30, 41, 59, 0.3)" : isConflict ? "rgba(244, 63, 94, 0.25)" : "rgba(16, 185, 129, 0.25)";
      ctx.strokeStyle = isSelected ? "#ffffff" : isConflict ? "#f43f5e" : count === 1 ? "#10b981" : "#334155";
      ctx.lineWidth = isSelected ? 2.5 : isConflict ? 2 : 1;
      this._roundRect(ctx, bx, startY, colW - 3, colH, 3, true, true);

      // Bank label
      ctx.fillStyle = isConflict ? "#f43f5e" : count === 1 ? "#10b981" : "#64748b";
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      ctx.fillText(`B${b}`, bx + 2, startY + 16);

      // Stacked load bar inside bank
      if (count > 0) {
        const barH = (count / maxConflict) * (colH - 45);
        ctx.fillStyle = isConflict ? "#f43f5e" : "#10b981";
        ctx.fillRect(bx + 2, startY + colH - barH - 6, colW - 7, barH);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px 'JetBrains Mono', monospace";
        ctx.fillText(`${count}`, bx + 4, startY + colH - 12);
      }
    }

    // Animated Beams from Threads (Warp 0) to Banks
    const beamY = startY + colH + 20;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("Warp 0 Simultaneous Memory Requests (Threads 0..31 targeting Bank (thread * stride) % 32):", startX, beamY + 12);

    for (let t = 0; t < 32; t++) {
      const tx = startX + t * colW + (colW - 3) / 2;
      const b = (t * stride) % 32;
      const bx = startX + b * colW + (colW - 3) / 2;
      const isConflict = bankHits[b] > 1;

      // Draw thread node
      ctx.fillStyle = isConflict ? "#f43f5e" : "#10b981";
      ctx.beginPath();
      ctx.arc(tx, beamY + 36, 4, 0, Math.PI * 2);
      ctx.fill();

      // Laser curve to bank
      ctx.strokeStyle = isConflict ? "rgba(244, 63, 94, 0.4)" : "rgba(16, 185, 129, 0.35)";
      ctx.lineWidth = isConflict ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(tx, beamY + 36);
      ctx.quadraticCurveTo((tx + bx) / 2, beamY - 10, bx, startY + colH);
      ctx.stroke();
    }

    // Bottom Telemetry Summary
    const botY = h - 90;
    ctx.fillStyle = this.cardBgColor(0.95);
    ctx.strokeStyle = this.cardBorderColor();
    this._roundRect(ctx, 40, botY, w - 80, 75, 8, true, true);

    ctx.fillStyle = this.textColor();
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillText("Hardware Serialization & Table 6.9 Benchmark Telemetry:", 55, botY + 20);

    ctx.fillStyle = this.textColor();
    ctx.font = "12px 'JetBrains Mono', monospace";
    const throughput = ((1 / maxConflict) * 100).toFixed(1);
    ctx.fillText(`Hardware Memory Transactions: ${maxConflict} Serial Cycle(s)  |  SRAM Bandwidth Utilization: ${throughput}%`, 55, botY + 42);

    ctx.fillStyle = this.textMutedColor();
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("Pacheco Insight: Shared memory tree reduction using stride-halving guarantees sequential active threads map to distinct banks, eliminating bank conflicts entirely!", 55, botY + 62);
  }

  // =========================================================================
  // SIMULATION 6: Riemann Trapezoidal Integration & atomicAdd Race Conditions
  // =========================================================================
  // =========================================================================
  // SIMULATION 6: Riemann Trapezoidal Integration & atomicAdd Race Conditions
  // =========================================================================
  renderTrap1Atomic() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const s = this.states["sim-trap1-atomic"];

    // Auto-advance if playing
    if (s.isPlaying) {
      s.frameCounter = (s.frameCounter || 0) + 1;
      if (s.frameCounter % (s.mode === "atomic" ? 18 : 34) === 0) {
        this.stepTrapSimulation();
        if (window.simManager) window.simManager.updateTelemetry();
      }
    }

    // Advance bus packets progress
    for (let i = s.busPackets.length - 1; i >= 0; i--) {
      s.busPackets[i].progress += 0.04;
      if (s.busPackets[i].progress >= 1.0) {
        s.busPackets.splice(i, 1);
      }
    }
    if (s.collisionFlash > 0) s.collisionFlash = Math.max(0, s.collisionFlash - 0.025);

    this._drawGrid(ctx, w, h);

    // Title
    ctx.fillStyle = this.textColor();
    ctx.font = "bold 15px Inter, sans-serif";
    ctx.fillText("Simulation 6: Trapezoidal Rule I — atomicAdd Contention vs Data Race (Program 6.12)", 30, 28);

    const modeTitle = s.mode === "atomic"
      ? "Hardware atomicAdd Mode (Program 6.12: Serialized RMW — 100% Mathematically Exact)"
      : "Unsynchronized Data Race Mode (*trap_p += my_trap — Fatal Lost Updates Bug!)";
    ctx.fillStyle = s.mode === "atomic" ? "#10b981" : "#f43f5e";
    ctx.font = "bold 11.5px 'JetBrains Mono', monospace";
    ctx.fillText(`Mode: ${modeTitle}`, 30, 48);

    // Layout dimensions
    const graphX = 30, graphY = 62, graphW = (w - 70) * 0.52, graphH = h - 150;
    const f = (x) => x * x + 1; // f(-3)=10, f(0)=1, f(3)=10
    const n = s.n;
    const dx = 6 / n;

    // Draw Function Graph Card
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "#334155";
    this._roundRect(ctx, graphX, graphY, graphW, graphH, 8, true, true);

    // Card Header
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(`Riemann Trapezoids under f(x) = x² + 1 on [-3, 3]  (n = ${n} intervals)`, graphX + 14, graphY + 20);

    // Axes
    const scaleX = (graphW - 60) / 6;
    const scaleY = (graphH - 60) / 10;
    const baseY = graphY + graphH - 24;

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(graphX + 24, baseY);
    ctx.lineTo(graphX + graphW - 20, baseY); // X axis
    ctx.moveTo(graphX + graphW / 2, graphY + 30);
    ctx.lineTo(graphX + graphW / 2, baseY); // Y axis
    ctx.stroke();

    // Axis tick labels
    ctx.fillStyle = "#64748b";
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillText("-3", graphX + 26, baseY + 14);
    ctx.fillText("0", graphX + graphW / 2 - 4, baseY + 14);
    ctx.fillText("+3", graphX + graphW - 35, baseY + 14);

    // Draw Trapezoids
    for (let i = 0; i < n; i++) {
      const x0 = -3 + i * dx;
      const x1 = -3 + (i + 1) * dx;
      const y0 = f(x0);
      const y1 = f(x1);

      const px0 = graphX + 30 + (x0 + 3) * scaleX;
      const px1 = graphX + 30 + (x1 + 3) * scaleX;
      const py0 = baseY - y0 * scaleY;
      const py1 = baseY - y1 * scaleY;

      const isComputed = i < s.stepIdx;
      const isCurrent = i === s.stepIdx;

      if (isCurrent) {
        // Glowing animated current trapezoid
        ctx.fillStyle = s.mode === "atomic" ? "rgba(56, 189, 248, 0.45)" : "rgba(244, 63, 94, 0.45)";
        ctx.strokeStyle = s.mode === "atomic" ? "#38bdf8" : "#f43f5e";
        ctx.lineWidth = 2.5;
      } else if (isComputed) {
        ctx.fillStyle = s.mode === "atomic" ? "rgba(16, 185, 129, 0.28)" : "rgba(251, 191, 36, 0.25)";
        ctx.strokeStyle = s.mode === "atomic" ? "#10b981" : "#fbbf24";
        ctx.lineWidth = 1;
      } else {
        ctx.fillStyle = "rgba(30, 41, 59, 0.3)";
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1;
      }

      ctx.beginPath();
      ctx.moveTo(px0, baseY);
      ctx.lineTo(px0, py0);
      ctx.lineTo(px1, py1);
      ctx.lineTo(px1, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Thread ID on top of each trapezoid if spacing allows
      if (n <= 24) {
        ctx.fillStyle = isCurrent ? "#ffffff" : (isComputed ? (s.mode === "atomic" ? "#34d399" : "#fbbf24") : "#64748b");
        ctx.font = isCurrent ? "bold 9px 'JetBrains Mono', monospace" : "8px 'JetBrains Mono', monospace";
        ctx.fillText(`T${i}`, (px0 + px1) / 2 - 6, Math.min(py0, py1) - 4);
      }
    }

    // Function Curve Overlay
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = 0; px <= graphW - 60; px += 2) {
      const rx = -3 + (px / (graphW - 60)) * 6;
      const ry = f(rx);
      const cy = baseY - ry * scaleY;
      if (px === 0) ctx.moveTo(graphX + 30 + px, cy);
      else ctx.lineTo(graphX + 30 + px, cy);
    }
    ctx.stroke();

    // Right Half: Global Memory Cell, Hardware Queue & Bus
    const memX = graphX + graphW + 16;
    const memW = w - memX - 30;
    const memH = graphH;

    this._drawGlowBox(ctx, memX, graphY, memW, memH, s.mode === "atomic" ? "#10b981" : "#f43f5e", "Global Memory Controller & Contention Arbiter");

    // Address Box (*trap_p)
    const cellW = 160;
    const cellH = 68;
    const cellX = memX + (memW - cellW) / 2;
    const cellY = graphY + 45;

    ctx.fillStyle = this.cardBgColor(0.95);
    ctx.strokeStyle = s.mode === "atomic" ? "#10b981" : (s.collisionFlash > 0 ? "#f43f5e" : "#fbbf24");
    ctx.lineWidth = s.collisionFlash > 0 ? 3 : 2;
    this._roundRect(ctx, cellX, cellY, cellW, cellH, 8, true, true);

    // Collision Flash Ripple
    if (s.collisionFlash > 0) {
      ctx.strokeStyle = `rgba(244, 63, 94, ${s.collisionFlash})`;
      ctx.lineWidth = 4 * s.collisionFlash;
      ctx.strokeRect(cellX - 6, cellY - 6, cellW + 12, cellH + 12);
    }

    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillText("Address: 0x7FFEE000  [*trap_p]", cellX + 12, cellY + 18);

    ctx.fillStyle = s.mode === "atomic" ? "#34d399" : (s.droppedWrites > 0 ? "#f43f5e" : "#f8fafc");
    ctx.font = "bold 15px 'JetBrains Mono', monospace";
    ctx.fillText(`*trap_p = ${s.accumulatedSum.toFixed(4)}`, cellX + 12, cellY + 42);

    ctx.fillStyle = s.mode === "atomic" ? "#10b981" : "#fbbf24";
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillText(s.mode === "atomic" ? (s.lockHolder !== null ? `🔒 LOCKED by T${s.lockHolder} (RMW)` : "IDLE (Next Token Ready)") : (s.collisionFlash > 0 ? "💥 DATA RACE COLLISION!" : "⚠️ NO MUTEX LOCK"), cellX + 12, cellY + 60);

    // Hardware Bus Pathway (Between Thread Pool & Memory Cell)
    const busY = cellY + cellH + 20;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(s.mode === "atomic" ? "Hardware Serialization Queue (Pacheco Table 6.5):" : "Concurrent Unsynchronized Warp Writes:", memX + 16, busY);

    // Animated Bus Packets
    for (let pkt of s.busPackets) {
      const pktY = cellY - 14 + pkt.progress * 14;
      const pktX = cellX + 20 + (pkt.fromThread % 8) * 15;
      ctx.fillStyle = pkt.isCollision ? "#f43f5e" : "#38bdf8";
      ctx.shadowColor = pkt.isCollision ? "#f43f5e" : "#38bdf8";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(pktX, pktY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Queue of Threads Waiting for Access
    const qStartY = busY + 12;
    const maxVisibleThreads = 6;
    for (let q = 0; q < maxVisibleThreads; q++) {
      const thIdx = s.stepIdx + q;
      const qy = qStartY + q * 22;
      if (qy > graphY + memH - 15) break;

      if (thIdx >= n) {
        // Done slot
        ctx.fillStyle = "rgba(30, 41, 59, 0.4)";
        ctx.strokeStyle = "#334155";
        this._roundRect(ctx, memX + 16, qy, memW - 32, 18, 4, true, true);
        ctx.fillStyle = "#64748b";
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.fillText("All threads completed", memX + 24, qy + 12);
        break;
      }

      const isExecuting = q === 0;
      if (s.mode === "atomic") {
        ctx.fillStyle = isExecuting ? "rgba(16, 185, 129, 0.25)" : "rgba(30, 41, 59, 0.6)";
        ctx.strokeStyle = isExecuting ? "#10b981" : "#475569";
        this._roundRect(ctx, memX + 16, qy, memW - 32, 18, 4, true, true);

        ctx.fillStyle = isExecuting ? "#34d399" : "#cbd5e1";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        const txt = isExecuting
          ? `Thread ${thIdx}: atomicAdd(trap_p, my_trap) [Token Acquired]`
          : `Thread ${thIdx}: Waiting in L2 Arbiter Ring [Contention #${q}]`;
        ctx.fillText(txt, memX + 24, qy + 12);
      } else {
        // Data race concurrent stomping
        const inCurrentWarp = q < 4;
        ctx.fillStyle = inCurrentWarp ? "rgba(244, 63, 94, 0.25)" : "rgba(30, 41, 59, 0.6)";
        ctx.strokeStyle = inCurrentWarp ? "#f43f5e" : "#475569";
        this._roundRect(ctx, memX + 16, qy, memW - 32, 18, 4, true, true);

        ctx.fillStyle = inCurrentWarp ? "#fca5a5" : "#cbd5e1";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        const txt = inCurrentWarp
          ? `Thread ${thIdx}: *trap_p += my_trap [Concurrent Collision!]`
          : `Thread ${thIdx}: Next Warp Ready to Fire`;
        ctx.fillText(txt, memX + 24, qy + 12);
      }
    }

    // Bottom Telemetry Bar
    const botY = h - 78;
    ctx.fillStyle = this.cardBgColor(0.95);
    ctx.strokeStyle = this.cardBorderColor();
    this._roundRect(ctx, 30, botY, w - 60, 68, 8, true, true);

    ctx.fillStyle = this.textColor();
    ctx.font = "bold 11.5px Inter, sans-serif";
    ctx.fillText(`Exact Analytical Integral: ∫_{-3}^{3} (x² + 1) dx = 24.000000`, 45, botY + 20);

    const isComplete = s.stepIdx >= n;
    const accuracy = isComplete && s.accumulatedSum > 0 ? (s.mode === "atomic" ? 100 : (s.accumulatedSum / 24.0 * 100).toFixed(1)) : (s.mode === "atomic" ? 100 : 25);

    ctx.fillStyle = s.mode === "atomic" ? "#10b981" : "#f43f5e";
    ctx.font = "bold 12.5px 'JetBrains Mono', monospace";
    const statusTxt = s.mode === "atomic"
      ? (isComplete ? `Computed Integral = ${s.accumulatedSum.toFixed(6)} (100% Mathematically Exact — 0 Lost Writes)` : `Accumulating: ${s.accumulatedSum.toFixed(4)}... [Progress: ${s.stepIdx}/${n} threads]`)
      : (isComplete ? `CORRUPTED RESULT = ${s.accumulatedSum.toFixed(6)} [LOST ${s.droppedWrites} WRITES! Accuracy: ${accuracy}%]` : `Simultaneous Collision: ${s.droppedWrites} writes dropped so far!`);
    ctx.fillText(statusTxt, 45, botY + 40);

    ctx.fillStyle = this.textMutedColor();
    ctx.font = "10.5px Inter, sans-serif";
    ctx.fillText(s.mode === "atomic"
      ? "Pacheco Table 6.5: atomicAdd guarantees mutual exclusion, but 1,000,000 threads serializing creates a massive performance stall. Solution: Trap II Shared Memory Tree!"
      : "CRITICAL BUG: Multiple threads reading/writing simultaneously causes data stomping. Lost updates lead to silent data corruption in scientific codes!",
      45, botY + 58
    );
  }

  // =========================================================================
  // SIMULATION 7: Tree-Structured Reduction in Shared Memory (Program 6.14)
  // =========================================================================
  renderTreeReduction() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const s = this.states["sim-tree-reduction"];

    this._drawGrid(ctx, w, h);

    // Title
    ctx.fillStyle = this.textColor();
    ctx.font = "bold 15px Inter, sans-serif";
    ctx.fillText("Simulation 7: Trapezoidal Rule II — Shared Memory Tree Reduction (Section 6.11, Program 6.14)", 30, 28);

    const currentStride = s.strideIdx > 0 && s.strideIdx <= s.strides.length ? s.strides[s.strideIdx - 1] : (s.strideIdx === 5 ? 0 : 8);
    const isDone = s.strideIdx === 5;
    const activeThreads = isDone ? 0 : (s.strideIdx === 0 ? 16 : currentStride);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 11.5px 'JetBrains Mono', monospace";
    ctx.fillText(`Stage ${s.strideIdx} / 5 | ${s.strideIdx === 0 ? 'Initial Population: s[tx] = my_trap' : (isDone ? 'Block Complete → atomicAdd(trap_p, s[0])' : `Stride = ${currentStride} (${activeThreads} Active Threads)`)}`, 30, 48);

    // Shared Memory Array Display (16 Cells)
    const startX = 40;
    const startY = 72;
    const nodeW = (w - 80) / 16;
    const nodeH = 75;

    const values = s.currentValues || (s.stepHistory && s.stepHistory[s.strideIdx]) || s.baseValues;

    for (let i = 0; i < 16; i++) {
      const nx = startX + i * nodeW;

      let isActiveReceiver = false;
      let isSender = false;
      let isFolded = false;

      if (s.strideIdx === 0) {
        // Initial population
        isActiveReceiver = true;
      } else if (s.strideIdx >= 1 && s.strideIdx <= 4) {
        const str = s.strides[s.strideIdx - 1];
        if (i < str) {
          isActiveReceiver = true;
        } else if (i >= str && i < str * 2) {
          isSender = true;
        } else {
          isFolded = true;
        }
      } else if (isDone) {
        if (i === 0) isActiveReceiver = true;
        else isFolded = true;
      }

      ctx.fillStyle = isActiveReceiver
        ? "rgba(16, 185, 129, 0.25)"
        : (isSender ? "rgba(56, 189, 248, 0.22)" : "rgba(30, 41, 59, 0.35)");
      ctx.strokeStyle = isActiveReceiver
        ? "#10b981"
        : (isSender ? "#38bdf8" : "#475569");
      ctx.lineWidth = isActiveReceiver ? 2 : 1;
      this._roundRect(ctx, nx + 2, startY, nodeW - 4, nodeH, 6, true, true);

      // Thread & Bank label
      ctx.fillStyle = isActiveReceiver ? "#34d399" : (isSender ? "#38bdf8" : "#64748b");
      ctx.font = "bold 9.5px 'JetBrains Mono', monospace";
      ctx.fillText(`T${i}`, nx + 6, startY + 16);

      // Bank or cell index
      ctx.fillStyle = s.showBankAnalysis ? "#c084fc" : "#94a3b8";
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillText(s.showBankAnalysis ? `Bank ${i}` : `s[${i}]`, nx + 6, startY + 32);

      // Value in Shared Memory
      const valStr = typeof values[i] === 'number' ? (s.dataType === 'integer' ? values[i] : values[i].toFixed(2)) : values[i];
      ctx.fillStyle = isFolded ? "#64748b" : (isActiveReceiver ? "#34d399" : "#ffffff");
      ctx.font = "bold 12px 'JetBrains Mono', monospace";
      ctx.fillText(`${valStr}`, nx + 6, startY + 54);

      // Folded watermark label
      if (isFolded) {
        ctx.fillStyle = "rgba(100, 116, 139, 0.5)";
        ctx.font = "7.5px 'JetBrains Mono', monospace";
        ctx.fillText("FOLDED", nx + 6, startY + 68);
      }

      // Curved Laser Transfer Beams from Sender to Receiver
      if (isActiveReceiver && s.strideIdx >= 1 && s.strideIdx <= 4) {
        const str = s.strides[s.strideIdx - 1];
        const senderIdx = i + str;
        if (senderIdx < 16) {
          const senderX = startX + senderIdx * nodeW + nodeW / 2;
          const receiverX = nx + nodeW / 2;

          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 3]);
          ctx.beginPath();
          ctx.moveTo(senderX, startY + nodeH);
          ctx.quadraticCurveTo((senderX + receiverX) / 2, startY + nodeH + 35, receiverX, startY + nodeH);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    // Barrier Beam (__syncthreads())
    const barrierY = startY + nodeH + 42;
    ctx.fillStyle = "rgba(251, 191, 36, 0.12)";
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, startX, barrierY, w - 80, 42, 6, true, true);

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillText("🛑 __syncthreads() Barrier Execution (Pacheco Section 6.11.2)", startX + 16, barrierY + 18);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "10.5px Inter, sans-serif";
    ctx.fillText("All threads in the block must reach this barrier before proceeding to the next stride, eliminating RAW data hazards!", startX + 16, barrierY + 32);

    // Global Memory Atomic Write Box (When Step 5 is reached)
    const gMemY = barrierY + 52;
    const gMemW = w - 80;
    const gMemH = 68;

    this._drawGlowBox(ctx, startX, gMemY, gMemW, gMemH, isDone ? "#10b981" : "#38bdf8", "Global Memory Integration (*trap_p) — 1 atomicAdd per Thread Block");

    if (isDone) {
      // Golden laser from s[0] to global memory
      ctx.strokeStyle = "#34d399";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX + nodeW / 2, startY + nodeH);
      ctx.lineTo(startX + nodeW / 2, gMemY + 30);
      ctx.stroke();

      ctx.fillStyle = "#34d399";
      ctx.font = "bold 13px 'JetBrains Mono', monospace";
      ctx.fillText(`Thread 0: atomicAdd(trap_p, s[0])  →  *trap_p += ${values[0]}`, startX + nodeW + 15, gMemY + 35);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText("Massive 1024x Contention Reduction! Only 1 atomic call per thread block instead of 1024 calls.", startX + nodeW + 15, gMemY + 52);
    } else {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText(`Threads are currently reducing in on-chip Shared Memory. Global memory bus is 100% IDLE (0 traffic).`, startX + 20, gMemY + 35);
      ctx.fillStyle = "#64748b";
      ctx.font = "10.5px 'JetBrains Mono', monospace";
      ctx.fillText(`Step through to Stage 5 to observe Thread 0 committing the block total with atomicAdd.`, startX + 20, gMemY + 52);
    }

    // Bottom Complexity & Bank Conflict Proof
    const botY = h - 74;
    ctx.fillStyle = this.cardBgColor(0.95);
    ctx.strokeStyle = this.cardBorderColor();
    this._roundRect(ctx, 30, botY, w - 60, 64, 8, true, true);

    ctx.fillStyle = this.textColor();
    ctx.font = "bold 11.5px Inter, sans-serif";
    ctx.fillText("Complexity Analysis & Bank Conflict Immunity:", 45, botY + 18);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillText(`Time Complexity: O(log2 16) = 4 Steps vs. Sequential O(n) = 16 Steps  |  Speedup: ~4x in 1 block (20x on Titan X)`, 45, botY + 36);

    ctx.fillStyle = this.textMutedColor();
    ctx.font = "10.5px Inter, sans-serif";
    ctx.fillText("Pacheco Bank Conflict Proof: Stride-halving ensures active threads 0..stride-1 access consecutive bank columns, guaranteeing zero bank conflicts!", 45, botY + 54);
  }

  // =========================================================================
  // SIMULATION 8: Warp Shuffle & Multi-Warp Reduction (Program 6.15)
  // =========================================================================
  renderWarpShuffle() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const s = this.states["sim-warp-shuffle"];

    this._drawGrid(ctx, w, h);

    // Title
    ctx.fillStyle = this.textColor();
    ctx.font = "bold 15px Inter, sans-serif";
    ctx.fillText("Simulation 8: Trapezoidal Rule III — Warp Shuffle (__shfl_down_sync) & 2-Tier Reduction (Program 6.15)", 30, 28);

    const currentOffset = s.offsetIdx > 0 && s.offsetIdx <= s.offsets.length ? s.offsets[s.offsetIdx - 1] : (s.offsetIdx === 6 ? 0 : 16);
    const isDone = s.offsetIdx === 6;

    ctx.fillStyle = "#c084fc";
    ctx.font = "bold 11.5px 'JetBrains Mono', monospace";
    ctx.fillText(`Stage ${s.offsetIdx} / 6 | ${s.offsetIdx === 0 ? 'Initial Warp Registers' : (isDone ? 'Warp 0 Reduction Done → R[0] holds full warp sum' : `Warp Shuffle Delta = ${currentOffset}`)}  |  Shared Memory: 0 BYTES  |  Latency: 1 Cycle`, 30, 48);

    if (s.viewMode === "hierarchical") {
      this._renderHierarchicalWarpView(ctx, w, h, s);
      return;
    }

    // 32 Hardware Registers inside Warp 0
    const startX = 35;
    const startY = 72;
    const regW = (w - 70) / 32;
    const regH = 115;

    const registers = s.currentRegisters || (s.stepHistory && s.stepHistory[s.offsetIdx]) || s.baseRegisters;

    for (let i = 0; i < 32; i++) {
      const rx = startX + i * regW;

      let canReceive = false;
      let isSender = false;
      let isFolded = false;

      if (s.offsetIdx === 0) {
        canReceive = true;
      } else if (s.offsetIdx >= 1 && s.offsetIdx <= 5) {
        const off = s.offsets[s.offsetIdx - 1];
        if (i < off) {
          canReceive = true;
        } else if (i >= off && i < off * 2) {
          isSender = true;
        } else {
          isFolded = true;
        }
      } else if (isDone) {
        if (i === 0) canReceive = true;
        else isFolded = true;
      }

      ctx.fillStyle = canReceive
        ? "rgba(168, 85, 247, 0.28)"
        : (isSender ? "rgba(56, 189, 248, 0.22)" : "rgba(30, 41, 59, 0.35)");
      ctx.strokeStyle = canReceive
        ? "#a855f7"
        : (isSender ? "#38bdf8" : "#475569");
      ctx.lineWidth = canReceive ? 2 : 1;
      this._roundRect(ctx, rx + 1, startY, regW - 2, regH, 4, true, true);

      // Lane label
      ctx.fillStyle = canReceive ? "#c084fc" : (isSender ? "#38bdf8" : "#64748b");
      ctx.font = "bold 8.5px 'JetBrains Mono', monospace";
      ctx.fillText(`L${i}`, rx + 2, startY + 16);

      // Register label
      ctx.fillStyle = "#94a3b8";
      ctx.font = "7.5px 'JetBrains Mono', monospace";
      ctx.fillText(`R[${i}]`, rx + 2, startY + 32);

      // Value in Register
      const regVal = registers[i];
      ctx.fillStyle = isFolded ? "#64748b" : (canReceive ? "#ffffff" : "#cbd5e1");
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      ctx.fillText(`${typeof regVal === 'number' ? regVal.toFixed(1) : regVal}`, rx + 2, startY + 58);

      // Laser data exchange arc
      if (canReceive && s.offsetIdx >= 1 && s.offsetIdx <= 5) {
        const off = s.offsets[s.offsetIdx - 1];
        const pLane = i + off;
        if (pLane < 32) {
          const px = startX + pLane * regW + regW / 2;
          ctx.strokeStyle = "#a855f7";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px, startY + regH);
          ctx.quadraticCurveTo((rx + px) / 2, startY + regH + 35, rx + regW / 2, startY + regH);
          ctx.stroke();
        }
      }
    }

    // Warp Shuffle Code Primitive Banner
    const codeY = startY + regH + 42;
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, 35, codeY, w - 70, 52, 6, true, true);

    ctx.fillStyle = "#c084fc";
    ctx.font = "bold 13px 'JetBrains Mono', monospace";
    ctx.fillText(`val += __shfl_down_sync(0xFFFFFFFF, val, ${currentOffset});`, 50, codeY + 22);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("Direct register-to-register hardware interconnect. Zero shared memory used, zero bank conflicts, zero __syncthreads() barriers!", 50, codeY + 38);

    // Bottom Benchmark Comparison Bar
    const botY = h - 74;
    ctx.fillStyle = this.cardBgColor(0.95);
    ctx.strokeStyle = this.cardBorderColor();
    this._roundRect(ctx, 30, botY, w - 60, 64, 8, true, true);

    ctx.fillStyle = this.textColor();
    ctx.font = "bold 11.5px Inter, sans-serif";
    ctx.fillText("Performance Benchmarks (Pacheco Table 6.10 on NVIDIA Titan X):", 45, botY + 18);

    ctx.fillStyle = "#34d399";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillText("Trap I (atomicAdd): 3.08ms (1.0x) | Trap II (Shared Tree): 0.206ms (15.0x) | Trap III (Warp Shuffle): 0.141ms (21.8x Faster!)", 45, botY + 36);

    ctx.fillStyle = this.textMutedColor();
    ctx.font = "10.5px Inter, sans-serif";
    ctx.fillText("Warp shuffles eliminate all shared memory load/store operations, operating entirely within the single-cycle register file.", 45, botY + 54);
  }

  _renderHierarchicalWarpView(ctx, w, h, s) {
    const startX = 40;
    const startY = 75;
    const boxW = w - 80;
    const boxH = h - 165;

    this._drawGlowBox(ctx, startX, startY, boxW, boxH, "#a855f7", "2-Tier Hierarchical Reduction Architecture (Pacheco Section 6.13, 1024 Threads/Block)");

    // Tier 1: 32 Warps in SM
    ctx.fillStyle = this.textColor();
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillText("Tier 1: 32 Warps (1024 Threads) reduce in parallel using __shfl_down_sync() [5 clock cycles]", startX + 20, startY + 45);

    const warpBoxW = (boxW - 60) / 4;
    for (let i = 0; i < 4; i++) {
      const bx = startX + 20 + i * (warpBoxW + 6);
      ctx.fillStyle = "rgba(168, 85, 247, 0.18)";
      ctx.strokeStyle = "#a855f7";
      this._roundRect(ctx, bx, startY + 58, warpBoxW, 40, 4, true, true);
      ctx.fillStyle = "#c084fc";
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.fillText(`Warp ${i * 8}..${i * 8 + 7}`, bx + 10, startY + 76);
      ctx.fillStyle = this.textMutedColor();
      ctx.font = "9px Inter, sans-serif";
      ctx.fillText("Shuffle Sum in Lane 0", bx + 10, startY + 90);
    }

    // Tier 2: Warp Leaders store into shared memory
    ctx.fillStyle = this.textColor();
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillText("Tier 2: 32 Warp Leaders store sums into __shared__ float warp_sums[32] [1 cycle, 0 bank conflicts]", startX + 20, startY + 125);

    ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
    ctx.strokeStyle = "#38bdf8";
    this._roundRect(ctx, startX + 20, startY + 138, boxW - 40, 36, 4, true, true);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.fillText("if (lane == 0) warp_sums[warpId] = my_warp_sum;  __syncthreads();", startX + 30, startY + 160);

    // Tier 3: Warp 0 sums the 32 warp totals
    ctx.fillStyle = this.textColor();
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillText("Tier 3: Warp 0 reads warp_sums and performs 1 final __shfl_down_sync() [5 cycles]", startX + 20, startY + 200);

    ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
    ctx.strokeStyle = "#10b981";
    this._roundRect(ctx, startX + 20, startY + 212, boxW - 40, 36, 4, true, true);
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.fillText("if (threadIdx.x == 0) atomicAdd(trap_p, block_total);  // Only 1 atomicAdd per 1024-thread Block!", startX + 30, startY + 234);
  }

  // =========================================================================
  // HELPER CANVAS UTILITIES & THEME AWARENESS
  // =========================================================================
  isLightTheme() {
    return document.documentElement.getAttribute("data-theme") === "light";
  }

  textColor() {
    return this.isLightTheme() ? "#0f172a" : "#ffffff";
  }

  textMutedColor() {
    return this.isLightTheme() ? "#475569" : "#94a3b8";
  }

  cardBgColor(alpha = 0.95) {
    return this.isLightTheme() ? `rgba(255, 255, 255, ${alpha})` : `rgba(15, 23, 42, ${alpha})`;
  }

  cardBorderColor() {
    return this.isLightTheme() ? "#cbd5e1" : "#334155";
  }

  _drawGrid(ctx, w, h) {
    if (!ctx) return;
    const isLight = this.isLightTheme();
    ctx.fillStyle = isLight ? "#f8fafc" : "#070b14";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = isLight ? "rgba(203, 213, 225, 0.6)" : "rgba(30, 41, 59, 0.3)";
    ctx.lineWidth = 1;
    const step = 32;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  _drawGlowBox(ctx, x, y, w, h, glowColor, title) {
    if (!ctx) return;
    const isLight = this.isLightTheme();
    ctx.fillStyle = isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isLight ? 4 : 8;
    this._roundRect(ctx, x, y, w, h, 8, true, true);
    ctx.shadowBlur = 0;

    ctx.fillStyle = glowColor;
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillText(title, x + 14, y + 24);
  }

  _roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (!ctx) return;
    if (typeof radius === 'undefined') radius = 5;
    if (typeof radius === 'number') {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}

// Global simulation engine instance
window.canvasSimEngine = new CanvasSimulationEngine();
