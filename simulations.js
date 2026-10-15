/**
 * simulations.js
 * Visual Simulations Lab Manager & Orchestrator
 * High-Fidelity 60 FPS Canvas Host, Live Hardware Telemetry & Guided Experiments
 * Covering all 8 core concepts of Module 5 and Pacheco Chapter 6
 */

class SimulationManager {
  constructor() {
    this.activeSimId = "sim-branch-divergence";
    this.playTimer = null;
    this.meta = {
      "sim-cpu-vs-gpu": {
        title: "Simulation 1: CPU vs. GPU Microarchitecture Shootout",
        section: "Pacheco Section 6.2 & 6.4 // Flynn's Taxonomy (SISD/MIMD vs. SIMT)",
        desc: "Compare latency-oriented CPU design (heavy out-of-order execution, deep caches, high clock speeds) with throughput-oriented GPU design (hundreds of SIMT cores, massive memory bandwidth).",
        code: `// Conceptual CPU vs GPU Workload Dispatch
// CPU: 4 Heavy Cores with Out-of-Order Execution & ~80% Silicon Cache
void ProcessCPU(float* data, int n) {
  #pragma omp parallel for
  for (int i = 0; i < n; i++) data[i] = sqrtf(data[i]);
}

// GPU: 4 SMs x 32 Cores = 128 SIMT Threads in Lockstep Waves
__global__ void ProcessGPU(float* data, int n) {
  int i = blockIdx.x * blockDim.x + threadIdx.x;
  if (i < n) data[i] = sqrtf(data[i]);
}`,
        experiment: "1. Select 512 or 1024 tasks. 2. Hit 'Launch Benchmark Shootout' and observe the progress bars. 3. Notice that while each individual CPU task finishes in ~2ns (fast latency), the GPU crunches 128 threads simultaneously in waves, delivering over 10x aggregate throughput!",
        examPoints: [
          "CPU allocates ~80% of silicon die area to cache hierarchies and branch predictors to minimize latency.",
          "GPU allocates >80% of silicon area to arithmetic units (ALUs / CUDA Cores) to maximize total compute throughput.",
          "Flynn's classification: Traditional CPUs operate as MIMD; NVIDIA GPUs operate under the SIMT (Single Instruction, Multiple Threads) architectural paradigm."
        ]
      },

      "sim-branch-divergence": {
        title: "Simulation 2: 32-Lane Warp Execution & Branch Serialization",
        section: "Pacheco Section 6.8.1 // Table 6.1 (Branch Divergence Penalty)",
        desc: "Watch 32 threads in Warp 0 execute an if-else statement. Observe how the hardware warp scheduler serializes divergent paths, masking idle threads and cutting execution efficiency in half.",
        code: `__global__ void BranchDivergenceKernel(float* x) {
  int i = threadIdx.x;
  // Step 1: Condition evaluation (All 32 lanes active)
  if (x[i] >= 0.0f) {
    // Step 2: Then-branch (Even lanes active, Odd lanes MASKED)
    x[i] += 1.0f;
  } else {
    // Step 3: Else-branch (Odd lanes active, Even lanes MASKED)
    x[i] -= 2.0f;
  }
  // Step 4: Reconvergence (All 32 lanes re-synchronized)
}`,
        experiment: "1. Select the 'Alternating +/-' preset (worst case). 2. Click 'Next Step ▶' to advance to Cycle 2. Notice Even lanes executing (+1) while Odd lanes are stalled with diagonal red masks (Mask: 0x55555555). 3. Advance to Cycle 3: Odd lanes execute (-2) while Even lanes are masked (Mask: 0xAAAAAAAA). 4. Compare with 'All Positive' preset, where zero divergence occurs!",
        examPoints: [
          "All 32 threads in a warp share a single instruction fetch and dispatch unit (SIMT lockstep).",
          "When threads take different branch paths, the SM executes each path sequentially, setting active mask bits to 0 for threads not on that path.",
          "Total execution time is the SUM of both paths: Time = Time(then) + Time(else).",
          "To optimize: arrange data so threads in the same warp take the same branch, or compute branches in multiples of 32."
        ]
      },

      "sim-coordinates": {
        title: "Simulation 3: Grid, Block & Thread Coordinate Mapper",
        section: "Pacheco Section 6.5 & 6.6 // 1D and 2D Indexing & Boundary Guards",
        desc: "Interactive coordinate matrix for CUDA grids. Drag sliders to adjust grid dimension, block dimension, and vector length. Click any thread cell to inspect its exact hardware mapping.",
        code: `// Vector Addition 1D Linear Rank Mapping
__global__ void VecAdd(float* z, float* x, float* y, int n) {
  // Linear index calculation across 1D grid and block
  int my_i = blockDim.x * blockIdx.x + threadIdx.x;

  // Boundary guard to prevent buffer overflow
  if (my_i < n) {
    z[my_i] = x[my_i] + y[my_i];
  }
}`,
        experiment: "1. Set Block Dim = 8 and Vector Size = 19. 2. Observe Block 2: threads 0, 1, 2 compute elements 16, 17, 18 (in bounds). 3. Click Thread 3 in Block 2 (my_i = 19): notice the status shows 'SKIP' and the formula HUD flags it as OUT-OF-BOUNDS. This demonstrates why the boundary guard `if (my_i < n)` is essential!",
        examPoints: [
          "Linear Rank Formula: my_i = blockDim.x * blockIdx.x + threadIdx.x.",
          "For 2D grid/block: row = blockDim.y * blockIdx.y + threadIdx.y; col = blockDim.x * blockIdx.x + threadIdx.x.",
          "Grid Dimension Ceiling Formula: gridDim = (n + blockDim - 1) / blockDim, preventing truncation errors.",
          "Threads where my_i >= n must be guarded by `if (my_i < n)` to avoid illegal memory access."
        ]
      },

      "sim-memory-flow": {
        title: "Simulation 4: PCIe Interconnect & Memory Architecture Flow",
        section: "Pacheco Section 6.3 & 6.8.5 // Memory Transfer Overhead & Unified Memory",
        desc: "Step through the complete memory transfer pipeline across the PCIe Gen4 x16 bus. Contrast explicit cudaMemcpy transfers (Program 6.9) with Unified Virtual Memory (Program 6.6).",
        code: `// Program 6.9: Explicit Memory Flow
float *h_a, *d_a;
h_a = (float*) malloc(size);         // 1. Host Allocate
cudaMalloc(&d_a, size);              // 2. Device Allocate
cudaMemcpy(d_a, h_a, size, H2D);     // 3. PCIe Host-to-Device
VecAdd<<<grid, blk>>>(d_a, n);       // 4. GPU Compute
cudaMemcpy(h_a, d_a, size, D2H);     // 5. PCIe Device-to-Host
cudaFree(d_a); free(h_a);            // 6. Deallocate`,
        experiment: "1. Click 'Next Stage ▶' step-by-step through the 6 stages. 2. Notice Stage 3 (H2D) and Stage 5 (D2H): data packets must cross the PCIe bus at ~31.5 GB/s with ~10,000 cycles latency. 3. Notice Stage 4 (Kernel): compute executes in VRAM at ~900 GB/s. 4. Toggle to 'Managed Memory' to see page fault migration.",
        examPoints: [
          "PCIe bus bandwidth (~32 GB/s) is 30x slower than internal GPU VRAM bandwidth (~900 GB/s).",
          "PCIe latency (~10,000 clock cycles) dominates overall execution time for small datasets (Amdahl's Law).",
          "Best Practice: Minimize PCIe transfers; keep intermediate results in device memory between kernel launches.",
          "Managed memory (cudaMallocManaged) simplifies code with a single pointer but relies on on-demand page migration."
        ]
      },

      "sim-bank-conflicts": {
        title: "Simulation 5: Shared Memory 32-Bank Conflict Radar",
        section: "Pacheco Section 6.13.4 // Table 6.9 (Shared Memory Bank Conflicts)",
        desc: "Visualize the 32 physical memory banks of shared memory. Drag the stride slider from 1 to 32 to witness how memory access serializes into multiple cycles when threads target the same bank.",
        code: `// Access Pattern in Shared Memory
__shared__ float s_data[1024];

// Stride 1: Thread t accesses s_data[t * 1]  -> Bank t (Zero Conflicts)
// Stride 2: Thread t accesses s_data[t * 2]  -> Bank (2*t)%32 (2-way conflict)
// Stride 32: Thread t accesses s_data[t * 32] -> Bank 0 (32-way serial disaster!)
float val = s_data[threadIdx.x * stride];`,
        experiment: "1. Click 'Stride 1': notice 32 parallel straight laser beams hitting 32 unique banks (1 cycle, 100% throughput). 2. Click 'Stride 2': notice 2 threads hit each even bank (2 cycles, 50% throughput). 3. Click 'Stride 32': ALL 32 threads converge onto Bank 0! The memory bus turns red and serializes into 32 separate clock cycles (3.1% throughput disaster)!",
        examPoints: [
          "Shared memory is divided into 32 equally sized memory modules called banks (4 bytes wide each).",
          "Bank index formula: bank_id = (word_address) % 32.",
          "When multiple threads in the same warp access addresses in the SAME bank, requests are serialized (k-way conflict = k cycles).",
          "Exception: If all threads in a warp read the exact SAME address, a broadcast occurs in 1 single cycle (0 conflict)."
        ]
      },

      "sim-trap1-atomic": {
        title: "Simulation 6: Trapezoidal Rule Integration & atomicAdd Contention",
        section: "Pacheco Section 6.10 // Table 6.5 (Program 6.12 atomicAdd Bottlenecks)",
        desc: "Interactive Riemann integral with multi-threaded GPU memory updates. Compare disastrous data races with hardware atomicAdd serialization.",
        code: `// Program 6.12: Trapezoidal Rule with atomicAdd
__global__ void TrapAtomic(float* trap_p, float a, float h, int n) {
  int my_i = blockDim.x * blockIdx.x + threadIdx.x;
  if (my_i < n) {
    float x = a + my_i * h;
    float my_trap = 0.5f * (f(x) + f(x + h)) * h;

    // Hardware-serialized atomic addition to global accumulator
    atomicAdd(trap_p, my_trap);
  }
}`,
        experiment: "1. Switch to 'Data Race Mode' and click 'Simulate Thread Additions'. Notice simultaneous writes colliding in memory address 0x7FFEE000, corrupting the final answer to ~14.8 instead of 24.0! 2. Switch back to 'atomicAdd Mode' and re-run: hardware serialization grants tokens one-by-one, guaranteeing 100% exact numerical accuracy (24.000000)!",
        examPoints: [
          "Data Race: Multiple threads write to the same memory location simultaneously without synchronization, causing dropped updates.",
          "atomicAdd(target, val) performs an atomic Read-Modify-Write (RMW) cycle in hardware without interruption.",
          "Contention Overhead: When thousands of threads execute atomicAdd on a single global variable, memory operations serialize, creating a major performance bottleneck (Pacheco Table 6.5).",
          "Solution: Use hierarchical reduction (shared memory tree reduction or warp shuffles) to avoid global atomic contention."
        ]
      },

      "sim-tree-reduction": {
        title: "Simulation 7: Tree-Structured Reduction in Shared Memory",
        section: "Pacheco Section 6.11 // Program 6.14 (Stride-Halving & __syncthreads)",
        desc: "Interactive binary reduction tree collapsing an array of elements in shared memory. Watch values merge level-by-level with barrier synchronization.",
        code: `// Program 6.14: Shared Memory Tree Reduction
__shared__ float s[BLOCK_SIZE];
s[tx] = my_val;
__syncthreads(); // Wait for all threads to populate shared memory

// Stride-halving loop: O(log2 n) steps
for (int stride = blockDim.x / 2; stride > 0; stride /= 2) {
  if (tx < stride) {
    s[tx] += s[tx + stride]; // Merge partner value
  }
  __syncthreads(); // Critical barrier preventing RAW hazard!
}`,
        experiment: "1. Click 'Next Stride ▶' to advance from Stride 8 to Stride 4, 2, and 1. 2. Observe the animated Bezier arcs carrying values from s[tx + stride] into s[tx]. 3. Notice the golden barrier pulse: __syncthreads() ensures all writes complete before the next iteration begins. 4. Notice that active threads 0..stride-1 map to distinct banks, preventing bank conflicts!",
        examPoints: [
          "Reduces N elements in O(log2 N) parallel steps instead of O(N) sequential additions (16 elements take 4 steps).",
          "__syncthreads() is a block-wide synchronization barrier. If omitted, a Read-After-Write (RAW) data race occurs where a thread reads un-updated memory.",
          "Stride-halving (stride /= 2 with tx < stride) keeps active threads sequential (0..stride-1), ensuring they access distinct shared memory banks and avoiding bank conflicts.",
          "In contrast, stride-doubling (stride *= 2) causes severe bank conflicts and warp branch divergence."
        ]
      },

      "sim-warp-shuffle": {
        title: "Simulation 8: Warp Shuffle & Multi-Warp Reduction",
        section: "Pacheco Section 6.13 // Program 6.15 (__shfl_down_sync & Benchmarks)",
        desc: "Watch 32 threads inside Warp 0 exchange values directly across register files without shared memory, achieving peak speedup in 5 single-cycle steps.",
        code: `// Program 6.15: Warp Shuffle Reduction
__inline__ __device__ float WarpReduceSum(float val) {
  // Delta-halving: 16, 8, 4, 2, 1 (O(log2 32) = 5 cycles)
  for (int offset = warpSize / 2; offset > 0; offset /= 2) {
    val += __shfl_down_sync(0xFFFFFFFF, val, offset);
  }
  return val; // Lane 0 holds warp sum
}`,
        experiment: "1. Click 'Next Delta ▶' to step through offsets 16, 8, 4, 2, 1. 2. Notice the purple laser arcs leaping directly between register files inside the SM warp. 3. Observe the telemetry counters: 0 BYTES shared memory used, 0 __syncthreads() barriers needed, and 1-cycle latency per step! 4. Check the performance benchmark comparison at the bottom.",
        examPoints: [
          "__shfl_down_sync(mask, val, delta) allows threads in a warp to exchange register values directly without memory transactions.",
          "Advantages over Shared Memory: (1) Zero shared memory footprint, (2) Zero __syncthreads() overhead (warps execute in lockstep), (3) 1 single clock cycle latency.",
          "Two-Tier Reduction: In a 1024-thread block, Tier 1 uses warp shuffles inside each of the 32 warps; Tier 2 uses shared memory for Warp 0 to sum the 32 warp results.",
          "Speedup: Delivers up to 4.3x higher throughput compared to global atomicAdd (Pacheco Table 6.7)."
        ]
      }
    };
  }

  // Switch to a new simulation
  switchSim(simId) {
    this.activeSimId = simId;
    this.stopPlayTimer();

    // Update sidebar navigation pills
    const navItems = document.querySelectorAll(".sim-nav-item");
    navItems.forEach(btn => {
      const onclickAttr = btn.getAttribute("onclick") || "";
      btn.classList.toggle("item-active", onclickAttr.includes(simId));
    });

    this.renderCurrentSim();
  }

  renderCurrentSim() {
    const container = document.getElementById("sim-viewport");
    if (!container) return;

    const simInfo = this.meta[this.activeSimId] || this.meta["sim-branch-divergence"];
    const engine = window.canvasSimEngine;
    const simState = engine ? engine.states[this.activeSimId] : {};

    // Render high-fidelity Lab Studio structure
    container.innerHTML = `
      <div class="sim-lab-container">
        <!-- Top Lab Studio Header -->
        <div class="sim-lab-header">
          <div>
            <div class="sim-lab-badge">${simInfo.section}</div>
            <h2 class="sim-lab-title">${simInfo.title}</h2>
            <p class="sim-lab-desc">${simInfo.desc}</p>
          </div>
          <div class="sim-lab-quick-actions">
            <button class="btn btn-outline btn-sm" onclick="simManager.resetActiveSim()">↺ Reset Simulation</button>
            <button class="btn btn-action btn-sm" onclick="appController.switchView('sandbox')">💻 Code Sandbox 🚀</button>
          </div>
        </div>

        <!-- High-DPI Interactive Canvas Stage -->
        <div class="sim-lab-canvas-wrapper">
          <canvas id="sim-lab-canvas" class="sim-lab-canvas"></canvas>
        </div>

        <!-- Interactive Control Bar directly under canvas -->
        <div class="sim-controls-toolbar" id="sim-controls-toolbar">
          ${this.buildControlsHTML(this.activeSimId)}
        </div>

        <!-- Two-Column Telemetry & Conceptual Dashboard -->
        <div class="sim-details-grid">
          <!-- Left: Real-Time Hardware Telemetry & Architecture Profiler -->
          <div class="sim-telemetry-panel">
            <div class="panel-header">
              <h4>⚡ Hardware Telemetry & Architecture Profiler</h4>
              <span class="badge badge-primary">Real-Time Profiler</span>
            </div>
            <div id="sim-telemetry-metrics" class="telemetry-metrics-grid">
              ${this.buildTelemetryHTML(this.activeSimId)}
            </div>
          </div>

          <!-- Right: Conceptual Deep-Dive & Guided Classroom Experiments -->
          <div class="sim-knowledge-panel">
            <div class="panel-header">
              <h4>📖 Guided Experiment & Textbook Principles</h4>
              <span class="badge badge-secondary">Pacheco Ch. 6</span>
            </div>
            <div class="experiment-guide-box">
              <strong>🔬 Classroom Challenge (Try This!):</strong>
              <p>${simInfo.experiment}</p>
            </div>
            <div class="exam-key-points">
              <strong>🎯 VTU Exam / Viva Voce Takeaways:</strong>
              <ul>
                ${simInfo.examPoints.map(pt => `<li>${pt}</li>`).join('')}
              </ul>
            </div>
            <div class="code-snippet-box">
              <div class="code-snippet-header">CUDA C++ Kernel Implementation:</div>
              <pre><code class="language-cpp">${this.escapeHtml(simInfo.code)}</code></pre>
            </div>
          </div>
        </div>
      </div>
    `;

    // Mount CanvasSimulationEngine to sim-lab-canvas
    if (window.canvasSimEngine) {
      setTimeout(() => {
        window.canvasSimEngine.mount("sim-lab-canvas", this.activeSimId);
      }, 50);
    }
  }

  buildControlsHTML(simId) {
    const engine = window.canvasSimEngine;
    if (!engine) return "";
    const s = engine.states[simId];

    if (simId === "sim-branch-divergence") {
      return `
        <div class="control-group">
          <span class="control-label">Cycle Stepper:</span>
          <button class="btn btn-outline btn-sm" onclick="simManager.stepBranch(-1)" ${s.step === 0 ? 'disabled' : ''}>◀ Prev Cycle</button>
          <span class="badge badge-primary">Cycle ${s.step} / 4</span>
          <button class="btn btn-primary btn-sm" onclick="simManager.stepBranch(1)" ${s.step === 4 ? 'disabled' : ''}>Next Cycle ▶</button>
          <button class="btn btn-action btn-sm" onclick="simManager.toggleAutoPlay('branch')">${s.isPlaying ? '⏸ Pause' : '▶ Auto-Play'}</button>
        </div>
        <div class="control-group">
          <span class="control-label">Array Pattern:</span>
          <button class="btn ${s.pattern === 'alternating' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.setBranchPattern('alternating')">Alternating (Worst 50%)</button>
          <button class="btn ${s.pattern === 'positive' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.setBranchPattern('positive')">All Positive (100% Uniform)</button>
          <button class="btn ${s.pattern === 'negative' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.setBranchPattern('negative')">All Negative (100% Uniform)</button>
          <button class="btn ${s.pattern === 'half' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.setBranchPattern('half')">Half & Half</button>
        </div>
      `;
    } else if (simId === "sim-coordinates") {
      return `
        <div class="control-group">
          <span class="control-label">Grid Dim (Blocks):</span>
          <input type="range" min="1" max="6" value="${s.gridDim.x}" class="sim-slider" oninput="simManager.updateCoordParam('gridX', this.value)">
          <span class="badge badge-secondary" id="gridX-val">${s.gridDim.x} blocks</span>
        </div>
        <div class="control-group">
          <span class="control-label">Block Dim (Threads/Block):</span>
          <input type="range" min="4" max="32" step="4" value="${s.blockDim.x}" class="sim-slider" oninput="simManager.updateCoordParam('blockX', this.value)">
          <span class="badge badge-secondary" id="blockX-val">${s.blockDim.x} threads</span>
        </div>
        <div class="control-group">
          <span class="control-label">Vector Length (n):</span>
          <input type="range" min="8" max="48" value="${s.vectorN}" class="sim-slider" oninput="simManager.updateCoordParam('vecN', this.value)">
          <span class="badge badge-secondary" id="vecN-val">n = ${s.vectorN}</span>
        </div>
        <div class="control-group">
          <button class="btn btn-outline btn-sm" onclick="simManager.setCoordPreset('exact')">Preset: Exact Fit</button>
          <button class="btn btn-outline btn-sm" onclick="simManager.setCoordPreset('boundary')">Preset: Boundary Guard</button>
        </div>
      `;
    } else if (simId === "sim-cpu-vs-gpu") {
      return `
        <div class="control-group">
          <span class="control-label">Workload Tasks:</span>
          <input type="range" min="128" max="2048" step="128" value="${s.workloadSize}" class="sim-slider" oninput="simManager.updateCpuGpuWorkload(this.value)">
          <span class="badge badge-secondary" id="workload-val">${s.workloadSize} tasks</span>
        </div>
        <div class="control-group">
          <button class="btn btn-action btn-sm" onclick="simManager.launchCpuGpuShootout()">${s.isRunning ? '⏸ Pause Shootout' : '🚀 Launch Benchmark Shootout'}</button>
          <button class="btn btn-outline btn-sm" onclick="simManager.resetCpuGpu()">↺ Reset Counters</button>
        </div>
      `;
    } else if (simId === "sim-memory-flow") {
      return `
        <div class="control-group">
          <span class="control-label">Architecture Mode:</span>
          <button class="btn ${s.mode === 'explicit' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.setMemMode('explicit')">Explicit Transfers (Program 6.9)</button>
          <button class="btn ${s.mode === 'managed' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.setMemMode('managed')">Managed Memory (Program 6.6)</button>
        </div>
        <div class="control-group">
          <span class="control-label">Pipeline Stepper:</span>
          <button class="btn btn-outline btn-sm" onclick="simManager.stepMemFlow(-1)" ${s.stage === 0 ? 'disabled' : ''}>◀ Prev</button>
          <span class="badge badge-primary">Stage ${s.stage} / 6</span>
          <button class="btn btn-primary btn-sm" onclick="simManager.stepMemFlow(1)" ${s.stage >= 6 ? 'disabled' : ''}>Next Stage ▶</button>
          <button class="btn btn-action btn-sm" onclick="simManager.toggleAutoPlay('mem')">${s.isPlaying ? '⏸ Pause' : '▶ Auto-Run Pipeline'}</button>
        </div>
      `;
    } else if (simId === "sim-bank-conflicts") {
      return `
        <div class="control-group">
          <span class="control-label">Stride Selector:</span>
          <button class="btn ${s.stride === 1 ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.setBankStride(1)">Stride 1 (0 Conflicts)</button>
          <button class="btn ${s.stride === 2 ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.setBankStride(2)">Stride 2 (2-Way)</button>
          <button class="btn ${s.stride === 4 ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.setBankStride(4)">Stride 4 (4-Way)</button>
          <button class="btn ${s.stride === 8 ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.setBankStride(8)">Stride 8 (8-Way)</button>
          <button class="btn ${s.stride === 16 ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.setBankStride(16)">Stride 16 (16-Way)</button>
          <button class="btn ${s.stride === 32 ? 'btn-danger' : 'btn-outline'} btn-sm" onclick="simManager.setBankStride(32)">Stride 32 (32-Way Disaster!)</button>
        </div>
        <div class="control-group">
          <span class="control-label">Custom Stride:</span>
          <input type="range" min="1" max="32" value="${s.stride}" class="sim-slider" oninput="simManager.setBankStride(parseInt(this.value))">
          <span class="badge badge-secondary" id="stride-val">Stride ${s.stride}</span>
        </div>
      `;
    } else if (simId === "sim-trap1-atomic") {
      return `
        <div class="control-group">
          <span class="control-label">Execution Mode:</span>
          <button class="btn ${s.mode === 'atomic' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.setTrapMode('atomic')">atomicAdd Mode (Program 6.12)</button>
          <button class="btn ${s.mode === 'race' ? 'btn-danger' : 'btn-outline'} btn-sm" onclick="simManager.setTrapMode('race')">Unsynchronized Data Race (Bug!)</button>
        </div>
        <div class="control-group">
          <span class="control-label">Intervals (n):</span>
          <button class="btn ${s.n === 8 ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.updateTrapIntervals(8)">n = 8</button>
          <button class="btn ${s.n === 16 ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.updateTrapIntervals(16)">n = 16</button>
          <button class="btn ${s.n === 24 ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.updateTrapIntervals(24)">n = 24</button>
        </div>
        <div class="control-group">
          <span class="control-label">Thread Stepper:</span>
          <button class="btn btn-action btn-sm" onclick="simManager.toggleTrapPlay()">${s.isPlaying ? '⏸ Pause' : '▶ Play Auto-Stream'}</button>
          <button class="btn btn-primary btn-sm" onclick="simManager.stepTrap()">⚡ Step +1 Thread</button>
          <button class="btn btn-outline btn-sm" onclick="simManager.resetTrap()">↺ Reset</button>
        </div>
      `;
    } else if (simId === "sim-tree-reduction") {
      return `
        <div class="control-group">
          <span class="control-label">Stride Halving:</span>
          <button class="btn btn-outline btn-sm" onclick="simManager.stepTree(-1)" ${s.strideIdx === 0 ? 'disabled' : ''}>◀ Prev Stage</button>
          <span class="badge badge-primary">Stage ${s.strideIdx} / 5</span>
          <button class="btn btn-primary btn-sm" onclick="simManager.stepTree(1)" ${s.strideIdx >= 5 ? 'disabled' : ''}>Next Stage ▶</button>
          <button class="btn btn-action btn-sm" onclick="simManager.toggleAutoPlay('tree')">${s.isPlaying ? '⏸ Pause' : '▶ Auto-Reduce'}</button>
          <button class="btn btn-outline btn-sm" onclick="simManager.resetTree()">↺ Reset Array</button>
        </div>
        <div class="control-group">
          <span class="control-label">Data Preset:</span>
          <button class="btn ${s.dataType === 'trapezoid' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.setTreeDataType('trapezoid')">Trapezoid Areas (24.14)</button>
          <button class="btn ${s.dataType === 'integer' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.setTreeDataType('integer')">Integers (80)</button>
          <button class="btn ${s.showBankAnalysis ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.toggleBankAnalysis()">🏦 Bank Analysis</button>
        </div>
      `;
    } else if (simId === "sim-warp-shuffle") {
      return `
        <div class="control-group">
          <span class="control-label">Shuffle Delta:</span>
          <button class="btn btn-outline btn-sm" onclick="simManager.stepShuffle(-1)" ${s.offsetIdx === 0 ? 'disabled' : ''}>◀ Prev Delta</button>
          <span class="badge badge-primary">Stage ${s.offsetIdx} / 6</span>
          <button class="btn btn-primary btn-sm" onclick="simManager.stepShuffle(1)" ${s.offsetIdx >= 6 ? 'disabled' : ''}>Next Delta ▶</button>
          <button class="btn btn-action btn-sm" onclick="simManager.toggleAutoPlay('shuffle')">${s.isPlaying ? '⏸ Pause' : '▶ Auto-Shuffle'}</button>
          <button class="btn btn-outline btn-sm" onclick="simManager.resetShuffle()">↺ Reset</button>
        </div>
        <div class="control-group">
          <span class="control-label">Architecture View:</span>
          <button class="btn ${s.viewMode === 'warp' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.setShuffleView('warp')">Single Warp (32 Registers)</button>
          <button class="btn ${s.viewMode === 'hierarchical' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="simManager.setShuffleView('hierarchical')">2-Tier Multi-Warp (1024 Ths)</button>
        </div>
      `;
    }
    return "";
  }

  buildTelemetryHTML(simId) {
    const engine = window.canvasSimEngine;
    if (!engine) return "";
    const s = engine.states[simId];

    if (simId === "sim-branch-divergence") {
      let maskHex = "0xFFFFFFFF";
      let activeThreads = 32;
      let stalledThreads = 0;
      let penaltyText = "100% Efficiency";
      if (s.step === 2) {
        maskHex = "0x55555555";
        activeThreads = s.lanes.filter(l => l.initialVal >= 0).length;
        stalledThreads = 32 - activeThreads;
        penaltyText = "50% ALU Efficiency (Divergent Stalls)";
      } else if (s.step === 3) {
        maskHex = "0xAAAAAAAA";
        activeThreads = s.lanes.filter(l => l.initialVal < 0).length;
        stalledThreads = 32 - activeThreads;
        penaltyText = "50% ALU Efficiency (Divergent Stalls)";
      }

      return `
        <div class="telemetry-metric-tile">
          <span class="metric-title">Active Warp Mask</span>
          <span class="metric-value font-mono text-cyan">${maskHex}</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Active / Stalled Threads</span>
          <span class="metric-value text-green">${activeThreads} Active <small class="text-red">(${stalledThreads} Masked)</small></span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Warp Execution Efficiency</span>
          <span class="metric-value text-amber">${penaltyText}</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Total Execution Cycles</span>
          <span class="metric-value font-mono">${s.step >= 3 ? '4 Cycles (2x Serialization)' : '2 Cycles (Standard)'}</span>
        </div>
      `;
    } else if (simId === "sim-bank-conflicts") {
      const bankHits = Array(32).fill(0);
      for (let t = 0; t < 32; t++) bankHits[(t * s.stride) % 32]++;
      const maxConflict = Math.max(...bankHits);
      const throughput = ((1 / maxConflict) * 100).toFixed(1);

      return `
        <div class="telemetry-metric-tile">
          <span class="metric-title">Access Stride</span>
          <span class="metric-value font-mono text-cyan">Stride ${s.stride}</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Conflict Degree</span>
          <span class="metric-value ${maxConflict === 1 ? 'text-green' : 'text-red'}">${maxConflict === 1 ? '0 Conflicts (1-to-1)' : `${maxConflict}-Way Conflict!`}</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Memory Transactions</span>
          <span class="metric-value font-mono text-amber">${maxConflict} Serial Clock Cycle(s)</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Effective Bandwidth</span>
          <span class="metric-value font-mono text-green">${throughput}% Peak SRAM Throughput</span>
        </div>
      `;
    } else if (simId === "sim-coordinates") {
      const totalTh = s.gridDim.x * s.blockDim.x;
      const validTh = Math.min(totalTh, s.vectorN);
      const idleTh = totalTh - validTh;
      const sel = s.selectedThread;
      const my_i = s.blockDim.x * sel.bx + sel.tx;

      return `
        <div class="telemetry-metric-tile">
          <span class="metric-title">Total Allocated Threads</span>
          <span class="metric-value font-mono text-cyan">${totalTh} Threads (${s.gridDim.x} Blocks × ${s.blockDim.x} Threads)</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Active vs Guarded Idle</span>
          <span class="metric-value text-green">${validTh} Active <small class="text-red">(${idleTh} Skipped)</small></span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Selected Cell Rank</span>
          <span class="metric-value font-mono text-amber">Block ${sel.bx}, Thread ${sel.tx} → my_i = ${my_i}</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Hardware Mapping</span>
          <span class="metric-value font-mono text-purple">SM ${sel.bx % 4} | Warp ${Math.floor(my_i / 32)} | Lane ${my_i % 32}</span>
        </div>
      `;
    } else if (simId === "sim-trap1-atomic") {
      const isDone = s.stepIdx >= s.n;
      return `
        <div class="telemetry-metric-tile">
          <span class="metric-title">Exact Analytical Sum</span>
          <span class="metric-value font-mono text-cyan">24.000000</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Accumulator (*trap_p)</span>
          <span class="metric-value font-mono ${s.mode === 'atomic' ? 'text-green' : (s.droppedWrites > 0 ? 'text-red' : 'text-cyan')}">${s.accumulatedSum.toFixed(4)}</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Data Integrity</span>
          <span class="metric-value ${s.mode === 'atomic' ? 'text-green' : (s.droppedWrites > 0 ? 'text-red' : 'text-amber')}">${s.mode === 'atomic' ? '100% Accurate (0 Dropped Writes)' : `${s.droppedWrites} Lost Updates (Stomped!)`}</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Hardware Contention</span>
          <span class="metric-value font-mono text-amber">${s.mode === 'atomic' ? `Table 6.5: ${s.stepIdx}/${s.n} Serialized Passes` : 'Unsynchronized Free-for-All Collision'}</span>
        </div>
      `;
    } else if (simId === "sim-tree-reduction") {
      const curStride = s.strideIdx > 0 && s.strideIdx <= s.strides.length ? s.strides[s.strideIdx - 1] : (s.strideIdx === 5 ? 0 : 8);
      const activeTh = s.strideIdx === 5 ? 1 : (s.strideIdx === 0 ? 16 : curStride);
      const topVal = (s.currentValues && s.currentValues[0]) || 0;
      return `
        <div class="telemetry-metric-tile">
          <span class="metric-title">Reduction Stage</span>
          <span class="metric-value font-mono text-cyan">Stage ${s.strideIdx} / 5 (stride = ${curStride || 'Done'})</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Active Threads</span>
          <span class="metric-value text-green">${activeTh} Active Thread(s)</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">s[0] Current Total</span>
          <span class="metric-value font-mono text-green">${typeof topVal === 'number' ? topVal.toFixed(2) : topVal}</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Global Atomics</span>
          <span class="metric-value font-mono text-amber">${s.strideIdx === 5 ? '1 atomicAdd to Global Memory' : '0 Global Atomics (100% On-Chip SRAM)'}</span>
        </div>
      `;
    } else if (simId === "sim-warp-shuffle") {
      const curOffset = s.offsetIdx > 0 && s.offsetIdx <= s.offsets.length ? s.offsets[s.offsetIdx - 1] : (s.offsetIdx === 6 ? 0 : 16);
      return `
        <div class="telemetry-metric-tile">
          <span class="metric-title">Shuffle Delta</span>
          <span class="metric-value font-mono text-purple">delta = ${curOffset || 'Complete (Lane 0 holds sum)'}</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Shared Memory Footprint</span>
          <span class="metric-value font-mono text-green">0 BYTES (Register Interconnect)</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Barrier Synchronization</span>
          <span class="metric-value text-green">0 Barriers Needed (Warp Lockstep)</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Speedup (Table 6.10)</span>
          <span class="metric-value font-mono text-cyan">21.8x Faster than Trap I (0.141ms)</span>
        </div>
      `;
    } else if (simId === "sim-memory-flow") {
      return `
        <div class="telemetry-metric-tile">
          <span class="metric-title">PCIe Gen4 x16 Bus</span>
          <span class="metric-value font-mono text-amber">~31.5 GB/s (~10,000 Cycles Latency)</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">GPU VRAM Bandwidth</span>
          <span class="metric-value font-mono text-green">~900 GB/s (GDDR6X)</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Pipeline Stage</span>
          <span class="metric-value font-mono text-cyan">Stage ${s.stage} / 6</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Transfer vs Compute</span>
          <span class="metric-value text-red">PCIe Overheads: 85% of Total Time</span>
        </div>
      `;
    } else if (simId === "sim-cpu-vs-gpu") {
      return `
        <div class="telemetry-metric-tile">
          <span class="metric-title">CPU Processing IPC</span>
          <span class="metric-value font-mono text-cyan">4 Heavy Cores @ 4.5 GHz (Fast Single Thread)</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">GPU SIMT Concurrency</span>
          <span class="metric-value font-mono text-green">128 CUDA Cores in Parallel Lockstep</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Total Processed</span>
          <span class="metric-value font-mono text-amber">CPU: ${s.cpuProcessed} / ${s.workloadSize} | GPU: ${s.gpuProcessed} / ${s.workloadSize}</span>
        </div>
        <div class="telemetry-metric-tile">
          <span class="metric-title">Silicon Die Focus</span>
          <span class="metric-value text-purple">CPU: 80% Cache | GPU: >80% ALUs</span>
        </div>
      `;
    }
    return "";
  }

  updateTelemetry() {
    const el = document.getElementById("sim-telemetry-metrics");
    if (el) {
      el.innerHTML = this.buildTelemetryHTML(this.activeSimId);
    }
    const toolbar = document.getElementById("sim-controls-toolbar");
    if (toolbar) {
      toolbar.innerHTML = this.buildControlsHTML(this.activeSimId);
    }
  }

  // --- SIMULATION SPECIFIC CONTROL HANDLERS ---
  stepBranch(dir) {
    const s = window.canvasSimEngine.states["sim-branch-divergence"];
    s.step = Math.max(0, Math.min(4, s.step + dir));
    this.updateTelemetry();
  }

  setBranchPattern(pat) {
    const s = window.canvasSimEngine.states["sim-branch-divergence"];
    s.pattern = pat;
    s.lanes = window.canvasSimEngine._generateLanes(pat);
    s.step = 0;
    this.updateTelemetry();
  }

  updateCoordParam(param, val) {
    const s = window.canvasSimEngine.states["sim-coordinates"];
    val = parseInt(val);
    if (param === "gridX") {
      s.gridDim.x = val;
      const el = document.getElementById("gridX-val");
      if (el) el.innerText = `${val} blocks`;
    } else if (param === "blockX") {
      s.blockDim.x = val;
      const el = document.getElementById("blockX-val");
      if (el) el.innerText = `${val} threads`;
    } else if (param === "vecN") {
      s.vectorN = val;
      const el = document.getElementById("vecN-val");
      if (el) el.innerText = `n = ${val}`;
    }
    this.updateTelemetry();
  }

  setCoordPreset(type) {
    const s = window.canvasSimEngine.states["sim-coordinates"];
    if (type === "exact") {
      s.gridDim.x = 3;
      s.blockDim.x = 8;
      s.vectorN = 24;
    } else {
      s.gridDim.x = 3;
      s.blockDim.x = 8;
      s.vectorN = 19;
    }
    this.updateTelemetry();
  }

  setBankStride(stride) {
    const s = window.canvasSimEngine.states["sim-bank-conflicts"];
    s.stride = stride;
    const el = document.getElementById("stride-val");
    if (el) el.innerText = `Stride ${stride}`;
    this.updateTelemetry();
  }

  setMemMode(mode) {
    const s = window.canvasSimEngine.states["sim-memory-flow"];
    s.mode = mode;
    s.stage = 0;
    this.updateTelemetry();
  }

  stepMemFlow(dir) {
    const s = window.canvasSimEngine.states["sim-memory-flow"];
    s.stage = Math.max(0, Math.min(6, s.stage + dir));
    this.updateTelemetry();
  }

  setTrapMode(mode) {
    const s = window.canvasSimEngine.states["sim-trap1-atomic"];
    s.mode = mode;
    this.resetTrap();
  }

  updateTrapIntervals(val) {
    const s = window.canvasSimEngine.states["sim-trap1-atomic"];
    s.n = parseInt(val);
    this.resetTrap();
  }

  stepTrap() {
    window.canvasSimEngine.stepTrapSimulation();
    this.updateTelemetry();
  }

  toggleTrapPlay() {
    const s = window.canvasSimEngine.states["sim-trap1-atomic"];
    s.isPlaying = !s.isPlaying;
    this.updateTelemetry();
  }

  resetTrap() {
    const s = window.canvasSimEngine.states["sim-trap1-atomic"];
    s.stepIdx = 0;
    s.accumulatedSum = 0.0;
    s.droppedWrites = 0;
    s.busPackets = [];
    s.collisionFlash = 0;
    s.lockHolder = null;
    s.isPlaying = false;
    this.updateTelemetry();
  }

  stepTree(dir) {
    const s = window.canvasSimEngine.states["sim-tree-reduction"];
    s.strideIdx = Math.max(0, Math.min(5, s.strideIdx + dir));
    if (s.stepHistory && s.stepHistory[s.strideIdx]) {
      s.currentValues = [...s.stepHistory[s.strideIdx]];
    }
    this.updateTelemetry();
  }

  resetTree() {
    const s = window.canvasSimEngine.states["sim-tree-reduction"];
    s.strideIdx = 0;
    if (s.stepHistory && s.stepHistory[0]) {
      s.currentValues = [...s.stepHistory[0]];
    }
    s.isPlaying = false;
    this.updateTelemetry();
  }

  setTreeDataType(type) {
    const s = window.canvasSimEngine.states["sim-tree-reduction"];
    s.dataType = type;
    s.stepHistory = window.canvasSimEngine._computeTreeHistory(type === "trapezoid" ? s.baseValues : s.integerValues);
    s.strideIdx = 0;
    s.currentValues = [...s.stepHistory[0]];
    this.updateTelemetry();
  }

  toggleBankAnalysis() {
    const s = window.canvasSimEngine.states["sim-tree-reduction"];
    s.showBankAnalysis = !s.showBankAnalysis;
    this.updateTelemetry();
  }

  stepShuffle(dir) {
    const s = window.canvasSimEngine.states["sim-warp-shuffle"];
    s.offsetIdx = Math.max(0, Math.min(6, s.offsetIdx + dir));
    if (s.stepHistory && s.stepHistory[s.offsetIdx]) {
      s.currentRegisters = [...s.stepHistory[s.offsetIdx]];
    }
    this.updateTelemetry();
  }

  resetShuffle() {
    const s = window.canvasSimEngine.states["sim-warp-shuffle"];
    s.offsetIdx = 0;
    if (s.stepHistory && s.stepHistory[0]) {
      s.currentRegisters = [...s.stepHistory[0]];
    }
    s.isPlaying = false;
    this.updateTelemetry();
  }

  setShuffleView(mode) {
    const s = window.canvasSimEngine.states["sim-warp-shuffle"];
    s.viewMode = mode;
    this.updateTelemetry();
  }

  updateCpuGpuWorkload(val) {
    const s = window.canvasSimEngine.states["sim-cpu-vs-gpu"];
    s.workloadSize = parseInt(val);
    s.cpuProcessed = 0;
    s.gpuProcessed = 0;
    const el = document.getElementById("workload-val");
    if (el) el.innerText = `${val} tasks`;
    this.updateTelemetry();
  }

  launchCpuGpuShootout() {
    const s = window.canvasSimEngine.states["sim-cpu-vs-gpu"];
    s.isRunning = !s.isRunning;
    this.updateTelemetry();
  }

  resetCpuGpu() {
    const s = window.canvasSimEngine.states["sim-cpu-vs-gpu"];
    s.isRunning = false;
    s.cpuProcessed = 0;
    s.gpuProcessed = 0;
    this.updateTelemetry();
  }

  toggleAutoPlay(type) {
    if (this.playTimer) {
      this.stopPlayTimer();
      return;
    }

    if (type === "branch") {
      const s = window.canvasSimEngine.states["sim-branch-divergence"];
      s.isPlaying = true;
      this.playTimer = setInterval(() => {
        s.step = (s.step + 1) % 5;
        this.updateTelemetry();
      }, 1500);
    } else if (type === "mem") {
      const s = window.canvasSimEngine.states["sim-memory-flow"];
      s.isPlaying = true;
      this.playTimer = setInterval(() => {
        s.stage = (s.stage + 1) % 7;
        this.updateTelemetry();
      }, 1600);
    } else if (type === "tree") {
      const s = window.canvasSimEngine.states["sim-tree-reduction"];
      s.isPlaying = true;
      this.playTimer = setInterval(() => {
        if (s.strideIdx < 5) {
          this.stepTree(1);
        } else {
          this.resetTree();
        }
      }, 1600);
    } else if (type === "shuffle") {
      const s = window.canvasSimEngine.states["sim-warp-shuffle"];
      s.isPlaying = true;
      this.playTimer = setInterval(() => {
        if (s.offsetIdx < 6) {
          this.stepShuffle(1);
        } else {
          this.resetShuffle();
        }
      }, 1400);
    }
    this.updateTelemetry();
  }

  stopPlayTimer() {
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
    Object.values(window.canvasSimEngine.states).forEach(st => {
      if (st.isPlaying !== undefined) st.isPlaying = false;
    });
  }

  resetActiveSim() {
    this.stopPlayTimer();
    const simId = this.activeSimId;
    if (simId === "sim-branch-divergence") this.setBranchPattern("alternating");
    if (simId === "sim-coordinates") this.setCoordPreset("boundary");
    if (simId === "sim-cpu-vs-gpu") this.resetCpuGpu();
    if (simId === "sim-memory-flow") { const s = window.canvasSimEngine.states[simId]; s.stage = 0; }
    if (simId === "sim-bank-conflicts") this.setBankStride(1);
    if (simId === "sim-trap1-atomic") this.resetTrap();
    if (simId === "sim-tree-reduction") this.resetTree();
    if (simId === "sim-warp-shuffle") this.resetShuffle();
    this.updateTelemetry();
  }

  escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// Global simulation manager instance
window.simManager = new SimulationManager();
