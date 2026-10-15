# ⚡ CUDA Parallel Programming // BCS702 Module 5 Keynote Masterclass & Visual Suite

A modern, high-fidelity **Keynote Presentation Deck**, **Interactive 3Blue1Brown-Style Canvas Simulation Suite**, and **In-Browser CUDA Execution Sandbox** built for **VTU BCS702 Module 5** and **Peter S. Pacheco & Matthew Malensek's *An Introduction to Parallel Programming* (2nd Edition, Chapter 6)**.

---

## 🚀 Quick Launch

Start the local server and automatically launch the platform in your default browser:

```powershell
python D:\cuda-parallel-programming\run_platform.py
```

Or directly double-click or open [`index.html`](file:///D:/cuda-parallel-programming/index.html) in Chrome, Edge, or Firefox!

---

## 🎬 20-Slide Keynote Masterclass Deck (Designed for 2-Hour Presenting)

Built like an Apple Keynote / NVIDIA GTC presentation with deep dark aesthetics, glowing neon accents, and embedded live simulation canvases:

### Keyboard Shortcuts for Presenting:
- **`Space` or `→`**: Advance to Next Slide
- **`←`**: Return to Previous Slide
- **`[F]`**: Toggle Fullscreen Presentation Mode
- **`[N]`**: Toggle Presenter Notes Drawer (pacing guide, audience questions, timing notes)
- **`[O]`**: Toggle 20-Slide Overview Grid (jump to any slide instantly)
- **`[S]`**: Jump directly to Live CUDA Code Sandbox

### The 20-Slide Curriculum Breakdown:
1. **Slide 1**: Title & 2-Hour Roadmap (Agenda & Textbook Context)
2. **Slide 2**: The Genesis of GPU Computing: Pixels to GPGPU (DirectX/OpenGL to CUDA)
3. **Slide 3**: Microarchitecture Comparison: CPU (MIMD) vs. GPU (SIMT) *(Embedded Canvas Sim 1)*
4. **Slide 4**: Inside the GPU: Streaming Multiprocessors (SMs), SPs & 32-Thread Warps
5. **Slide 5**: Warp Lockstep & Branch Divergence *(Embedded 3Blue1Brown-Style Canvas Sim 2)*
6. **Slide 6**: Heterogeneous Computing: Host (CPU) vs. Device (GPU) over PCIe
7. **Slide 7**: Memory Hierarchy & Latency Pyramid *(Embedded PCIe Particle Canvas Sim 4)*
8. **Slide 8**: Memory Management: Explicit (`cudaMemcpy`) vs. Unified/Managed (`cudaMallocManaged`)
9. **Slide 9**: First CUDA Program: Hello World, `__global__`, and `cudaDeviceSynchronize()`
10. **Slide 10**: The Thread Hierarchy: Grids, Blocks, Threads & Hardware Invariance
11. **Slide 11**: Coordinate Mapping: 1D & 2D Indexing Formulas *(Embedded Isometric Grid Canvas Sim 3)*
12. **Slide 12**: NVIDIA Compute Capabilities & Device Architectures (Table 6.3 Fermi to Hopper)
13. **Slide 13**: First Hands-on Kernel: Vector Addition with Boundary Checks (`Program 6.3 & 6.9`)
14. **Slide 14**: Numerical Integration: The Trapezoidal Rule Mathematical Foundation
15. **Slide 15**: CUDA Trapezoidal Rule I: Race Conditions & `atomicAdd` *(Embedded Canvas Sim 6)*
16. **Slide 16**: CUDA Trapezoidal Rule II: Shared Memory Tree Reduction *(Embedded Collapsing Tree Sim 7)*
17. **Slide 17**: Shared Memory Architecture & 32-Bank Conflicts *(Embedded Radar Canvas Sim 5)*
18. **Slide 18**: CUDA Trapezoidal Rule III: Warp Shuffles (`__shfl_down_sync`) & Benchmarks *(Embedded Sim 8)*
19. **Slide 19**: Parallel Bitonic Sort Preview (Butterfly Networks on CUDA)
20. **Slide 20**: VTU Exam Mastery: 10-Mark Model Answers & 10-Question Interactive Quiz

---

## 🧪 8 Live HTML5 Canvas Visual Simulations (60 FPS Animated)

- **Canvas Sim 1: CPU vs GPU Particle Dataflow**: Watch CPU process data sequentially across 4 heavy cores vs GPU dispatching waves of 32-thread warps across Streaming Multiprocessors with glowing laser bursts.
- **Canvas Sim 2: 32-Lane Warp Branch Divergence (3Blue1Brown-Style)**: Cycle-by-cycle lockstep execution of `if (x[i] >= 0) x[i] += 1; else x[i] -= 2;`, showing active masks (`0x55555555`), masked-off idle lanes, and the 50% divergence penalty.
- **Canvas Sim 3: Grid, Block & Thread Coordinate Mapper**: Interactive canvas with block cards and thread cells; click or hover any thread to see real-time HUD with `my_i = blockDim.x * blockIdx.x + threadIdx.x`, Warp ID, Lane ID, and physical SM mapping.
- **Canvas Sim 4: PCIe Memory Interconnect & Latency Flow**: Animated PCIe bus with animated data packets traveling between Host RAM and GPU VRAM with realistic velocity, latency, and throughput counters.
- **Canvas Sim 5: Shared Memory 32-Bank Conflict Radar**: 32 memory banks drawn as glowing columns; test strides 1 (conflict-free, 1 cycle), 2, 4, and 32 (all threads hit Bank 0, 32-cycle serial stall).
- **Canvas Sim 6: Riemann Trapezoidal Integration & Race Condition**: Mathematical curve $f(x) = x^2 + 1$ with dynamic trapezoid slices; toggle between dirty concurrent writes and hardware-serialized `atomicAdd`.
- **Canvas Sim 7: Collapsing Binary Reduction Tree (Trap II)**: Stride-halving visualization ($8 \to 4 \to 2 \to 1$) with animated merging curves and glowing `__syncthreads()` barrier pulses.
- **Canvas Sim 8: Warp Shuffle (`__shfl_down_sync`) Register Swapper (Trap III)**: 32 register files with animated curved bezier lines showing direct register-to-register data exchange in 1 clock cycle without shared memory.

---

## 💻 In-Browser CUDA Code Sandbox & Virtual GPU

- **Zero-Install Client-Side Execution**: Runs CUDA kernels deterministically in JavaScript without needing local NVIDIA drivers or NVCC.
- **Pre-Loaded Textbook Presets**: Programs 6.1, 6.2, 6.3, 6.9, 6.12, 6.14, and 6.15.
- **Configurable Launch Grid**: Change `<<<gridDim.x, blockDim.x>>>` and run live.
- **Virtual Hardware Telemetry**: Active threads, blocks, warps, simulated clock cycles, and atomic operations count.
- **Live Memory Buffer Inspector**: Inspect array inputs and outputs (`A[i]`, `B[i]`, `Z[i]`) before and after kernel execution.

---

## 🎯 VTU BCS702 Question Bank & Interactive Quiz

- **10-Mark Model Answers with Diagrams & Code Listings**:
  - Q1: GPU architecture, SMs, SPs, and SISD/SIMD/SIMT comparison.
  - Q2: Thread hierarchy, 1D/2D indexing formulas, and ceiling division.
  - Q3: Explicit vs. Managed Memory in CUDA.
  - Q4: Trapezoidal Rule I race conditions and `atomicAdd` contention.
  - Q5: Trapezoidal Rule II shared memory tree reduction and bank conflicts.
  - Q6: Trapezoidal Rule III multi-warp reduction, warp shuffles, and hierarchical architecture.
- **Interactive 10-Question Knowledge Check**: Multiple-choice questions with instant scoring, feedback, and textbook explanations.

---

## 📂 File Structure

```
D:\cuda-parallel-programming\
├── index.html                  # Main platform entrypoint (Keynote deck + labs)
├── styles.css                  # Dark OLED high-tech UI stylesheet
├── app.js                      # Keynote deck controller & view orchestration
├── slides_data.js              # 20 masterclass slides with speaker notes & formulas
├── canvas_simulations.js       # 8 high-performance 60 FPS Canvas visualizers
├── cuda_emulator.js            # In-browser CUDA execution engine & virtual GPU
├── curriculum.js               # Syllabus database, notes & 10-mark exam answers
├── run_platform.py             # Python server runner (auto browser launcher)
├── BCS702 SYLLABUS.pdf.docx.pdf # VTU official course syllabus document
├── chapter-6.pdf               # Peter Pacheco 2nd Edition Chapter 6 (63 pages)
└── README.md                   # Complete documentation and presentation guide
```
