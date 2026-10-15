/**
 * app.js
 * Master Keynote Presentation Deck Controller, Session Timer,
 * Canvas Simulations Orchestrator & Live CUDA Code Sandbox
 */

class AppController {
  constructor() {
    this.currentView = "keynote"; // 'keynote', 'simulations', 'sandbox', 'textbook', 'exam'
    this.currentSlideIdx = 0;
    this.totalSlides = SLIDES_DATA.length;
    this.showNotes = false;
    this.showSlideGrid = false;
    this.activePreset = "cuda_hello";
    this.quizAnswersRecord = {};
    this.sessionTimer = {
      remainingSeconds: 120 * 60,
      totalSeconds: 120 * 60,
      isRunning: false,
      timerId: null
    };
  }

  init() {
    this.initTheme();
    this.bindEvents();
    this.initSandbox();
    this.initTextbookView();
    this.initExamView();
    this.renderCurrentSlide();
    this.updateTimerUI();
    this.initShortcuts();
  }

  initTheme() {
    const saved = localStorage.getItem("cuda_theme") || "dark";
    this.applyTheme(saved);

    const btn = document.getElementById("theme-toggle-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        const cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
        const next = cur === "light" ? "dark" : "light";
        this.applyTheme(next);
      });
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("cuda_theme", theme);

    const icon = document.getElementById("theme-icon");
    const label = document.getElementById("theme-label");
    if (icon) icon.textContent = theme === "light" ? "🌙" : "☀️";
    if (label) label.textContent = theme === "light" ? "Dark" : "Light";

    if (window.canvasSimEngine && window.canvasSimEngine.ctx && window.canvasSimEngine.render) {
      window.canvasSimEngine.render();
    }
  }

  bindEvents() {
    // Navigation tabs
    document.querySelectorAll("[data-nav-view]").forEach(btn => {
      btn.addEventListener("click", () => {
        const view = btn.getAttribute("data-nav-view");
        this.switchView(view);
      });
    });

    // Session Timer buttons
    const timerBtn = document.getElementById("timer-toggle-btn");
    if (timerBtn) {
      timerBtn.addEventListener("click", () => this.toggleSessionTimer());
    }
    const resetBtn = document.getElementById("timer-reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.resetSessionTimer());
    }

    // Slide controls
    const prevBtn = document.getElementById("slide-prev-btn");
    if (prevBtn) prevBtn.addEventListener("click", () => this.prevSlide());

    const nextBtn = document.getElementById("slide-next-btn");
    if (nextBtn) nextBtn.addEventListener("click", () => this.nextSlide());

    const notesBtn = document.getElementById("toggle-notes-btn");
    if (notesBtn) notesBtn.addEventListener("click", () => this.toggleNotes());

    const gridBtn = document.getElementById("toggle-grid-btn");
    if (gridBtn) gridBtn.addEventListener("click", () => this.toggleSlideGrid());

    const fsBtn = document.getElementById("toggle-fullscreen-btn");
    if (fsBtn) fsBtn.addEventListener("click", () => this.toggleFullscreen());
  }

  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll("[data-nav-view]").forEach(btn => {
      btn.classList.toggle("nav-active", btn.getAttribute("data-nav-view") === viewName);
    });

    const views = ["keynote", "simulations", "sandbox", "textbook", "exam"];
    views.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) el.classList.toggle("view-hidden", v !== viewName);
    });

    if (viewName === "keynote") {
      this.renderCurrentSlide();
    } else if (viewName === "simulations") {
      if (window.simManager) {
        window.simManager.renderCurrentSim();
      }
    }
  }

  // =========================================================================
  // KEYNOTE SLIDE RENDERER
  // =========================================================================
  renderCurrentSlide() {
    const slide = SLIDES_DATA[this.currentSlideIdx];
    if (!slide) return;

    // Update Counter & Progress Bar
    const counterEl = document.getElementById("slide-counter-display");
    if (counterEl) counterEl.textContent = `${this.currentSlideIdx + 1} / ${this.totalSlides}`;

    const progressFill = document.getElementById("deck-progress-fill");
    if (progressFill) {
      progressFill.style.width = `${((this.currentSlideIdx + 1) / this.totalSlides) * 100}%`;
    }

    // Render Slide Content Viewport
    const viewport = document.getElementById("keynote-slide-viewport");
    if (!viewport) return;

    viewport.innerHTML = this.buildSlideHTML(slide);

    // If slide contains an embedded simulation, mount the canvas
    if (slide.simId && window.canvasSimEngine) {
      setTimeout(() => {
        window.canvasSimEngine.mount(`slide-canvas-${slide.id}`, slide.simId);
      }, 50);
    }

    // Update Speaker Notes Drawer
    const notesContent = document.getElementById("speaker-notes-content");
    if (notesContent) {
      notesContent.innerHTML = `
        <div class="notes-meta">
          <strong>${slide.part}</strong> | Pacing: <em>${slide.timeEstimate}</em>
        </div>
        <p class="notes-text">${slide.speakerNotes}</p>
      `;
    }
  }

  buildSlideHTML(slide) {
    let bodyHTML = "";

    if (slide.layout === "title-slide") {
      bodyHTML = `
        <div class="slide-title-hero">
          <div class="hero-badge">BCS702 // MODULE 5</div>
          <h1 class="hero-main-title">${slide.title}</h1>
          <p class="hero-subtitle">${slide.subtitle}</p>
          <div class="hero-overview-card">${slide.content.overview}</div>
          <div class="hero-stats-row">
            ${slide.content.quickStats.map(s => `
              <div class="hero-stat-pill">
                <span class="pill-label">${s.label}</span>
                <strong class="pill-val">${s.val}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (slide.layout === "interactive-sim") {
      bodyHTML = `
        <div class="slide-sim-layout">
          <div class="sim-slide-canvas-wrap">
            <canvas id="slide-canvas-${slide.id}" class="keynote-canvas"></canvas>
            <div class="canvas-overlay-controls">
              <button class="btn btn-sm btn-primary" onclick="appController.triggerSimStep('${slide.simId}')">Step Action ▶</button>
              <button class="btn btn-sm btn-outline" onclick="appController.resetSim('${slide.simId}')">Reset Sim</button>
              <button class="btn btn-sm btn-action" onclick="appController.openStandaloneSim('${slide.simId}')">Open Fullscreen Lab ⚡</button>
            </div>
          </div>
          <div class="sim-slide-sidebar">
            <div class="slide-meta-badge">${slide.part}</div>
            <h2 class="slide-heading">${slide.title}</h2>
            <p class="slide-subheading">${slide.subtitle}</p>
            <div class="slide-text-block">${slide.content.summary}</div>
            ${slide.content.insight ? `<div class="slide-insight-box"><strong>💡 Key Principle:</strong> ${slide.content.insight}</div>` : ''}
            ${slide.content.formulas ? `
              <div class="slide-formulas-box">
                ${slide.content.formulas.map(f => `
                  <div class="slide-f-row">
                    <span class="f-title">${f.title}:</span>
                    <code>${f.math}</code>
                    <p class="f-desc">${f.explain}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    } else if (slide.layout === "code-walkthrough") {
      bodyHTML = `
        <div class="slide-code-layout">
          <div class="slide-code-panel">
            <div class="code-panel-header">
              <span>Textbook C++ / CUDA Source</span>
              <button class="btn btn-sm btn-action" onclick="appController.loadIntoSandbox('${slide.title}')">Run in Live Sandbox 🚀</button>
            </div>
            <pre class="keynote-code-pre"><code>${escapeHtml(slide.content.code)}</code></pre>
          </div>
          <div class="slide-info-panel">
            <div class="slide-meta-badge">${slide.part}</div>
            <h2 class="slide-heading">${slide.title}</h2>
            <p class="slide-subheading">${slide.subtitle}</p>
            <p class="slide-text-block">${slide.content.summary}</p>
            <div class="slide-takeaways-list">
              ${slide.content.keyTakeaways ? slide.content.keyTakeaways.map(t => `<div class="takeaway-item">${t}</div>`).join('') : ''}
              ${slide.content.qualifiers ? slide.content.qualifiers.map(q => `
                <div class="qualifier-item">
                  <code>${q.q}</code>
                  <p>${q.desc}</p>
                </div>
              `).join('') : ''}
            </div>
          </div>
        </div>
      `;
    } else {
      // Default clean presentation layout
      bodyHTML = `
        <div class="slide-standard-layout">
          <div class="slide-meta-badge">${slide.part}</div>
          <h2 class="slide-heading">${slide.title}</h2>
          <p class="slide-subheading">${slide.subtitle}</p>
          <div class="slide-body-content">
            <p class="lead-text">${slide.content.summary}</p>
            ${slide.content.bullets ? `
              <ul class="keynote-bullets-list">
                ${slide.content.bullets.map(b => `<li>${b}</li>`).join('')}
              </ul>
            ` : ''}
            ${slide.content.infobox ? `
              <div class="keynote-infobox">
                <h4>${slide.content.infobox.title}</h4>
                <p>${slide.content.infobox.text}</p>
              </div>
            ` : ''}
            ${slide.content.components ? `
              <div class="components-grid">
                ${slide.content.components.map(c => `
                  <div class="component-card">
                    <h4>${c.name}</h4>
                    <p>${c.desc}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${slide.content.tableData ? `
              <div class="keynote-table-wrap">
                <table class="keynote-table">
                  <thead>
                    <tr><th>Architecture</th><th>Threads/Block</th><th>Warp Size</th><th>Warps/SM</th><th>Architectural Breakthroughs</th></tr>
                  </thead>
                  <tbody>
                    ${slide.content.tableData.map(r => `
                      <tr>
                        <td><strong>${r.arch}</strong></td>
                        <td>${r.threadsPerBlk}</td>
                        <td>${r.warpSize}</td>
                        <td>${r.warpsPerSM}</td>
                        <td>${r.features}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    return `<div class="slide-card-container">${bodyHTML}</div>`;
  }

  // Slide navigation
  nextSlide() {
    if (this.currentSlideIdx < this.totalSlides - 1) {
      this.currentSlideIdx++;
      this.renderCurrentSlide();
    }
  }

  prevSlide() {
    if (this.currentSlideIdx > 0) {
      this.currentSlideIdx--;
      this.renderCurrentSlide();
    }
  }

  goToSlide(idx) {
    this.currentSlideIdx = Math.max(0, Math.min(this.totalSlides - 1, idx));
    this.renderCurrentSlide();
    this.closeSlideGrid();
  }

  // Simulation controls inside slides
  triggerSimStep(simId) {
    if (!window.canvasSimEngine) return;
    const s = window.canvasSimEngine.states[simId];
    if (!s) return;

    if (simId === "sim-branch-divergence") {
      s.step = (s.step + 1) % 5;
    } else if (simId === "sim-memory-flow") {
      s.stage = (s.stage + 1) % 7;
    } else if (simId === "sim-bank-conflicts") {
      const strides = [1, 2, 4, 8, 16, 32];
      const curIdx = strides.indexOf(s.stride);
      s.stride = strides[(curIdx + 1) % strides.length];
    } else if (simId === "sim-tree-reduction") {
      if (window.simManager) {
        if (s.strideIdx >= 5) window.simManager.resetTree();
        else window.simManager.stepTree(1);
      } else {
        s.strideIdx = (s.strideIdx + 1) % 6;
      }
    } else if (simId === "sim-warp-shuffle") {
      if (window.simManager) {
        if (s.offsetIdx >= 6) window.simManager.resetShuffle();
        else window.simManager.stepShuffle(1);
      } else {
        s.offsetIdx = (s.offsetIdx + 1) % 7;
      }
    } else if (simId === "sim-trap1-atomic") {
      if (window.simManager) {
        if (s.stepIdx >= s.n) window.simManager.resetTrap();
        else window.simManager.stepTrap();
      } else {
        window.canvasSimEngine.stepTrapSimulation();
      }
    } else if (simId === "sim-cpu-vs-gpu") {
      s.isRunning = !s.isRunning;
    }
  }

  resetSim(simId) {
    if (!window.canvasSimEngine) return;
    const s = window.canvasSimEngine.states[simId];
    if (!s) return;
    if (simId === "sim-branch-divergence") s.step = 0;
    if (simId === "sim-memory-flow") s.stage = 0;
    if (simId === "sim-tree-reduction") {
      if (window.simManager) window.simManager.resetTree();
      else s.strideIdx = 0;
    }
    if (simId === "sim-warp-shuffle") {
      if (window.simManager) window.simManager.resetShuffle();
      else s.offsetIdx = 0;
    }
    if (simId === "sim-trap1-atomic") {
      if (window.simManager) window.simManager.resetTrap();
      else { s.stepIdx = 0; s.accumulatedSum = 0; s.droppedWrites = 0; s.busPackets = []; }
    }
    if (simId === "sim-bank-conflicts") s.stride = 1;
    if (simId === "sim-cpu-vs-gpu") { s.isRunning = false; s.cpuProcessed = 0; s.gpuProcessed = 0; }
  }

  openStandaloneSim(simId) {
    this.switchView("simulations");
    if (window.simManager) {
      window.simManager.switchSim(simId);
    }
  }

  loadIntoSandbox(title) {
    this.switchView("sandbox");
    if (title.includes("Vector Addition")) {
      this.loadSandboxPreset("cuda_vec_add_managed");
    } else if (title.includes("Trapezoidal")) {
      this.loadSandboxPreset("cuda_trap2_shared");
    } else {
      this.loadSandboxPreset("cuda_hello");
    }
  }

  // Speaker notes toggle
  toggleNotes() {
    this.showNotes = !this.showNotes;
    const drawer = document.getElementById("speaker-notes-drawer");
    if (drawer) {
      drawer.classList.toggle("notes-drawer-open", this.showNotes);
    }
  }

  // Slide Grid Overview Modal
  toggleSlideGrid() {
    this.showSlideGrid = !this.showSlideGrid;
    const modal = document.getElementById("slide-grid-modal");
    if (!modal) return;

    modal.classList.toggle("modal-visible", this.showSlideGrid);
    if (this.showSlideGrid) {
      const gridContainer = document.getElementById("slide-grid-thumbnails");
      gridContainer.innerHTML = SLIDES_DATA.map((s, idx) => `
        <div class="thumb-card ${idx === this.currentSlideIdx ? 'thumb-active' : ''}" onclick="appController.goToSlide(${idx})">
          <div class="thumb-num">Slide ${idx + 1}</div>
          <div class="thumb-title">${s.title}</div>
          <div class="thumb-part">${s.part}</div>
        </div>
      `).join('');
    }
  }

  closeSlideGrid() {
    this.showSlideGrid = false;
    const modal = document.getElementById("slide-grid-modal");
    if (modal) modal.classList.remove("modal-visible");
  }

  // Fullscreen
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen();
    }
  }

  // Session countdown timer
  toggleSessionTimer() {
    const t = this.sessionTimer;
    const btn = document.getElementById("timer-toggle-btn");
    const indicator = document.getElementById("timer-status-indicator");

    if (t.isRunning) {
      clearInterval(t.timerId);
      t.isRunning = false;
      if (btn) btn.innerHTML = "▶ Resume";
      if (indicator) indicator.classList.remove("status-running");
    } else {
      t.isRunning = true;
      if (btn) btn.innerHTML = "⏸ Pause";
      if (indicator) indicator.classList.add("status-running");
      t.timerId = setInterval(() => {
        if (t.remainingSeconds > 0) {
          t.remainingSeconds--;
          this.updateTimerUI();
        } else {
          clearInterval(t.timerId);
          t.isRunning = false;
          if (indicator) indicator.classList.remove("status-running");
          alert("2-Hour Session Completed!");
        }
      }, 1000);
    }
  }

  resetSessionTimer() {
    clearInterval(this.sessionTimer.timerId);
    this.sessionTimer.isRunning = false;
    this.sessionTimer.remainingSeconds = this.sessionTimer.totalSeconds;
    const btn = document.getElementById("timer-toggle-btn");
    const indicator = document.getElementById("timer-status-indicator");
    if (btn) btn.innerHTML = "▶ Start 2-Hr";
    if (indicator) indicator.classList.remove("status-running");
    this.updateTimerUI();
  }

  updateTimerUI() {
    const rem = this.sessionTimer.remainingSeconds;
    const m = Math.floor(rem / 60);
    const s = rem % 60;
    const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    const clock = document.getElementById("session-countdown-display");
    if (clock) clock.textContent = formatted;
  }

  // =========================================================================
  // SANDBOX CONTROLLER
  // =========================================================================
  initSandbox() {
    const presetSelect = document.getElementById("sandbox-preset-select");
    const runBtn = document.getElementById("sandbox-run-btn");
    const clearBtn = document.getElementById("sandbox-clear-btn");

    if (presetSelect) {
      presetSelect.addEventListener("change", (e) => {
        this.loadSandboxPreset(e.target.value);
      });
    }

    if (runBtn) {
      runBtn.addEventListener("click", () => this.executeSandboxCode());
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        const consoleEl = document.getElementById("sandbox-console");
        if (consoleEl) consoleEl.textContent = "[CUDA Console cleared. Ready for kernel launch.]";
      });
    }

    this.loadSandboxPreset("cuda_hello");
  }

  loadSandboxPreset(presetId) {
    this.activePreset = presetId;
    const preset = CudaEmulator.PRESETS[presetId];
    if (!preset) return;

    const codeArea = document.getElementById("sandbox-code-editor");
    if (codeArea) codeArea.value = preset.code;

    const gridX = document.getElementById("sb-grid-x");
    const blockX = document.getElementById("sb-block-x");
    if (gridX) gridX.value = preset.gridDim.x;
    if (blockX) blockX.value = preset.blockDim.x;

    const titleEl = document.getElementById("sandbox-current-preset-name");
    if (titleEl) titleEl.textContent = preset.name;
  }

  executeSandboxCode() {
    const gridX = parseInt(document.getElementById("sb-grid-x")?.value || "1");
    const blockX = parseInt(document.getElementById("sb-block-x")?.value || "32");

    const config = {
      gridDim: { x: gridX, y: 1, z: 1 },
      blockDim: { x: blockX, y: 1, z: 1 }
    };

    const result = window.cudaEmulator.run(this.activePreset, config);

    // Render Console Output
    const consoleEl = document.getElementById("sandbox-console");
    if (consoleEl) {
      consoleEl.textContent = result.stdout;
    }

    // Render Telemetry
    const t = result.telemetry;
    const statsWrap = document.getElementById("sandbox-telemetry");
    if (statsWrap) {
      statsWrap.innerHTML = `
        <div class="stat-badge"><span>Total Threads:</span> <strong>${t.totalThreads}</strong></div>
        <div class="stat-badge"><span>Blocks:</span> <strong>${t.totalBlocks}</strong></div>
        <div class="stat-badge"><span>Warps:</span> <strong>${t.totalWarps}</strong></div>
        <div class="stat-badge"><span>Simulated Cycles:</span> <strong>~${t.simulatedCycles}</strong></div>
        ${t.atomicOps > 0 ? `<div class="stat-badge stat-warn"><span>atomicAdd Calls:</span> <strong>${t.atomicOps}</strong></div>` : ''}
        ${t.sharedMemBytes > 0 ? `<div class="stat-badge stat-info"><span>Shared Mem:</span> <strong>${t.sharedMemBytes} B</strong></div>` : ''}
      `;
    }

    // Render Memory Buffer Inspector if applicable
    const memWrap = document.getElementById("sandbox-memory-inspector");
    if (memWrap && result.memory) {
      this.renderMemoryInspector(memWrap, result.memory);
    }
  }

  renderMemoryInspector(container, mem) {
    if (mem.vectors) {
      const v = mem.vectors;
      container.innerHTML = `
        <div class="mem-table-wrap">
          <h5>💾 Memory Buffer Inspector: Vectors (x, y, z)</h5>
          <table class="mem-table">
            <thead><tr><th>Index</th><th>A[i]</th><th>B[i]</th><th>Z[i] (Output)</th></tr></thead>
            <tbody>
              ${v.A.slice(0, 16).map((val, i) => `
                <tr>
                  <td>[${i}]</td>
                  <td>${v.A[i]}</td>
                  <td>${v.B[i]}</td>
                  <td class="res-col"><strong>${v.C[i]}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (mem.integral) {
      const it = mem.integral;
      container.innerHTML = `
        <div class="mem-integral-card">
          <h5>📐 Numerical Integration Telemetry</h5>
          <div class="integral-stats-grid">
            <div><span>Method:</span> <strong>${it.method}</strong></div>
            <div><span>Computed Integral:</span> <strong>${it.calculatedIntegral}</strong></div>
            <div><span>Exact Analytical:</span> <strong>${it.exactIntegral}</strong></div>
            <div><span>Absolute Error:</span> <strong>${it.error}</strong></div>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `<p class="text-muted">No external memory buffers allocated for this kernel.</p>`;
    }
  }

  // =========================================================================
  // TEXTBOOK & SYLLABUS REFERENCE VIEW
  // =========================================================================
  initTextbookView() {
    const container = document.getElementById("textbook-sections-list");
    if (!container) return;

    const sections = CURRICULUM_DATA.sections;
    container.innerHTML = Object.keys(sections).map(secId => {
      const s = sections[secId];
      return `
        <div class="textbook-card" id="section-card-${secId}">
          <div class="tb-card-header">
            <div class="tb-title-group">
              <span class="badge badge-primary">Section ${secId}</span>
              <span class="tb-pages">${s.textbookRef}</span>
              <h3>${s.title}</h3>
            </div>
          </div>
          <div class="tb-card-body">
            <p class="tb-summary">${s.summary}</p>
            <div class="tb-keypoints">
              <strong>Key Principles & Insights:</strong>
              <ul>
                ${s.keyPoints.map(kp => `<li>${kp}</li>`).join('')}
              </ul>
            </div>
            ${s.formulas ? `
              <div class="tb-formulas">
                <strong>Mathematical Formulations:</strong>
                ${s.formulas.map(f => `
                  <div class="math-row">
                    <span class="f-name">${f.name}:</span>
                    <code>${f.latex}</code>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${s.codeSnippet ? `
              <div class="tb-code-box">
                <div class="code-header">Textbook Code Listing</div>
                <pre><code>${escapeHtml(s.codeSnippet)}</code></pre>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // EXAM PREPARATION & INTERACTIVE QUIZ
  // =========================================================================
  initExamView() {
    const examContainer = document.getElementById("exam-questions-list");
    if (examContainer) {
      examContainer.innerHTML = CURRICULUM_DATA.examPrep.longQuestions.map(q => `
        <div class="exam-q-card">
          <div class="exam-q-header">
            <div class="q-title-row">
              <span class="badge badge-accent">${q.marks} MARKS</span>
              <h4>${q.question}</h4>
            </div>
            <button class="btn btn-outline btn-sm" onclick="appController.toggleExamAnswer('${q.id}')">Toggle Model Answer</button>
          </div>
          <div class="exam-answer-box" id="ans-${q.id}" style="display: none;">
            <pre>${q.answer}</pre>
          </div>
        </div>
      `).join('');
    }

    this.initQuiz();
  }

  toggleExamAnswer(id) {
    const el = document.getElementById(`ans-${id}`);
    if (el) {
      el.style.display = el.style.display === "none" ? "block" : "none";
    }
  }

  initQuiz() {
    const quizWrap = document.getElementById("quiz-container");
    if (!quizWrap) return;

    const questions = CURRICULUM_DATA.examPrep.quizQuestions;
    quizWrap.innerHTML = `
      <div class="quiz-card">
        <div class="quiz-header">
          <h3>Interactive Knowledge Check (10 Exam Questions)</h3>
          <p>Test your conceptual understanding across Module 5 before your session.</p>
        </div>
        <div class="quiz-questions">
          ${questions.map((q, idx) => `
            <div class="quiz-item" id="quiz-item-${q.id}">
              <div class="q-num-text">Question ${idx + 1}: ${q.question}</div>
              <div class="q-options-list">
                ${q.options.map((opt, oIdx) => `
                  <label class="q-opt-label">
                    <input type="radio" name="q-${q.id}" value="${oIdx}" onchange="appController.checkQuizAnswer(${q.id}, ${oIdx})">
                    <span>${opt}</span>
                  </label>
                `).join('')}
              </div>
              <div class="q-explanation" id="exp-${q.id}" style="display: none;"></div>
            </div>
          `).join('')}
        </div>
        <div class="quiz-score-banner" id="quiz-score-banner" style="display: none;">
          <h4>Quiz Score: <span id="quiz-score-val">0</span> / 10</h4>
        </div>
      </div>
    `;
  }

  checkQuizAnswer(qId, selectedIdx) {
    const q = CURRICULUM_DATA.examPrep.quizQuestions.find(item => item.id === qId);
    if (!q) return;

    this.quizAnswersRecord[qId] = (selectedIdx === q.answer);
    const expEl = document.getElementById(`exp-${qId}`);
    if (expEl) {
      expEl.style.display = "block";
      const isCorrect = (selectedIdx === q.answer);
      expEl.className = `q-explanation ${isCorrect ? 'exp-correct' : 'exp-wrong'}`;
      expEl.innerHTML = `
        <strong>${isCorrect ? '✓ Correct!' : '✗ Incorrect.'}</strong> ${q.explanation}
      `;
    }

    const totalCorrect = Object.values(this.quizAnswersRecord).filter(Boolean).length;
    const scoreBanner = document.getElementById("quiz-score-banner");
    const scoreVal = document.getElementById("quiz-score-val");
    if (scoreBanner && scoreVal) {
      scoreBanner.style.display = "block";
      scoreVal.textContent = totalCorrect;
    }
  }

  // Keyboard navigation
  initShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (this.currentView === "keynote") {
        if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
          e.preventDefault();
          this.nextSlide();
        } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
          e.preventDefault();
          this.prevSlide();
        } else if (e.key.toLowerCase() === "n") {
          this.toggleNotes();
        } else if (e.key.toLowerCase() === "o") {
          this.toggleSlideGrid();
        } else if (e.key.toLowerCase() === "f") {
          this.toggleFullscreen();
        } else if (e.key === "Escape") {
          this.closeSlideGrid();
        }
      }
    });
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Global controller instance
window.appController = new AppController();

document.addEventListener("DOMContentLoaded", () => {
  window.appController.init();
});
