/**
 * slides_data.js
 * Comprehensive 20-Slide Masterclass Deck for BCS702 Module 5:
 * GPU Programming with CUDA (Based on Peter S. Pacheco & Matthew Malensek, 2nd Edition)
 */

const SLIDES_DATA = [
  {
    id: 1,
    title: "GPU Programming with CUDA",
    subtitle: "Module 5 Masterclass // Architecture, Execution Model & Performance Optimization",
    part: "Introduction & Overview",
    timeEstimate: "00:00 - 00:05 (5 mins)",
    layout: "title-slide",
    content: {
      overview: "Welcome to this 2-hour masterclass on GPU Programming with CUDA, based on Chapter 6 of Peter S. Pacheco and Matthew Malensek's 'An Introduction to Parallel Programming' (2nd Edition) and the VTU BCS702 syllabus.",
      agenda: [
        "Part 1: The Evolution of GPUs & Microarchitecture (SISD vs. SIMD vs. SIMT)",
        "Part 2: Heterogeneous Computing & The Memory Hierarchy (Explicit vs. Managed Memory)",
        "Part 3: The Execution Hierarchy: Grids, Blocks, Threads & 1D/2D Indexing",
        "Part 4: NVIDIA Compute Capabilities & The Vector Addition Kernel",
        "Part 5: Numerical Integration: CUDA Trapezoidal Rule I & II (Race Conditions, atomicAdd, Tree Reduction)",
        "Part 6: Warp Primitives & Trapezoidal Rule III (__shfl_down_sync, Bank Conflicts, Benchmarks & Exam Review)"
      ],
      quickStats: [
        { label: "Target Duration", val: "120 Mins" },
        { label: "Textbook Source", val: "Pacheco Ch. 6" },
        { label: "Interactive Sims", val: "8 Live Engines" },
        { label: "Exam Component", val: "VTU 10-Mark Focus" }
      ]
    },
    speakerNotes: "Welcome everyone! Today we cover Module 5: GPU Programming with CUDA. In 2 hours, we will demystify why GPUs run scientific code hundreds of times faster than CPUs, how thread hierarchies map onto silicon, and how to write production-grade CUDA kernels. Use the bottom toolbar to navigate, toggle notes, or launch live simulations at any point."
  },

  {
    id: 2,
    title: "The Genesis of GPU Computing: From Pixels to GPGPU",
    subtitle: "Section 6.1 // Fixed-Function Pipelines to Programmable Shaders & CUDA",
    part: "Part 1: Architecture (00:05 - 00:12)",
    layout: "split-text-visual",
    content: {
      summary: "In the late 1990s and early 2000s, video games created explosive demand for 3D realism. Hardware vendors developed Graphics Processing Units (GPUs) with thousands of arithmetic units to calculate lighting, textures, and geometry concurrently.",
      bullets: [
        "<strong>Early GPGPU Era (Early 2000s):</strong> Scientific programmers realized GPUs possessed enormous raw floating-point throughput. However, code had to be cast into graphics APIs (DirectX, OpenGL). Matrices were encoded as 2D textures; matrix multiply was disguised as pixel shading!",
        "<strong>The CUDA Revolution (2006/2007):</strong> NVIDIA introduced Compute Unified Device Architecture (CUDA), exposing GPU silicon directly via C/C++ extensions without any graphics abstraction.",
        "<strong>CUDA vs. OpenCL:</strong> CUDA is tailored for NVIDIA GPUs, providing low boilerplate, rich tooling, and optimal hardware utilization. OpenCL is an open multi-vendor standard (CPUs, AMD GPUs, DSPs, FPGAs) but requires verbose runtime setup."
      ],
      infobox: {
        title: "Why GPUs for Compute?",
        text: "A 4-core CPU optimizes for <em>latency</em> (making 1 thread run as fast as possible with giant caches). A GPU optimizes for <em>throughput</em> (processing thousands of data points concurrently with massive ALU arrays)."
      }
    },
    speakerNotes: "Highlight the contrast between early GPGPU and modern CUDA. Early researchers had to pretend their linear algebra was a texture of triangles! NVIDIA's 2006 CUDA release changed scientific computing forever by providing native C pointers and function qualifiers."
  },

  {
    id: 3,
    title: "Microarchitecture Comparison: CPU (MIMD) vs. GPU (SIMT)",
    subtitle: "Section 6.2 // Flynn's Taxonomy & Hardware Die Allocation",
    part: "Part 1: Architecture (00:12 - 00:20)",
    layout: "interactive-sim",
    simId: "sim-cpu-vs-gpu",
    content: {
      summary: "Let's examine how silicon is allocated on modern chips. CPUs are designed for unpredictable general-purpose code; GPUs are designed for data-parallel arithmetic.",
      comparisonTable: [
        { feature: "Flynn Taxonomy", cpu: "SISD / MIMD (Multiple Instruction, Multiple Data)", gpu: "SIMT (Single Instruction, Multiple Threads)" },
        { feature: "Silicon Dedication", cpu: "~15-20% ALUs; ~80% Cache & Control Logic", gpu: ">80% ALUs; Minimal Cache & Control" },
        { feature: "Concurrency", cpu: "4 to 64 heavy, latency-optimized threads", gpu: "10,000+ lightweight, throughput-optimized threads" },
        { feature: "Latency Strategy", cpu: "Big L1/L2/L3 caches, Branch Prediction, Out-of-Order", gpu: "Zero-overhead context switching between warps" }
      ]
    },
    speakerNotes: "Run the interactive simulation on this slide! Toggle between CPU Mode and GPU Mode to process 256 items. Watch how the CPU runs sequentially or across 4 cores, while the GPU dispatches waves of threads across SMs simultaneously."
  },

  {
    id: 4,
    title: "Inside the GPU: Streaming Multiprocessors & Warps",
    subtitle: "Section 6.2 // The Building Blocks of GPU Hardware",
    part: "Part 1: Architecture (00:20 - 00:28)",
    layout: "diagram-slide",
    content: {
      summary: "An NVIDIA GPU consists of an array of Streaming Multiprocessors (SMs) connected to a shared L2 Cache and high-bandwidth Global VRAM.",
      components: [
        {
          name: "Streaming Multiprocessor (SM)",
          desc: "The fundamental processing unit. Contains Warp Schedulers, Dispatch Units, a large 32-bit Register File (64K registers), fast on-chip Shared Memory/L1 Cache, and dozens of SPs. SMs operate asynchronously from each other."
        },
        {
          name: "Streaming Processors (SPs / CUDA Cores)",
          desc: "The arithmetic datapaths inside an SM that execute 32-bit floating point (FP32) and integer (INT32) operations. Modern SMs also house Tensor Cores and Special Function Units (SFUs)."
        },
        {
          name: "The Warp (32 Threads)",
          desc: "The atomic unit of scheduling. Hardware groups 32 consecutive threads into a Warp. All 32 threads in a warp execute the exact same instruction in lockstep across 32 physical SPs."
        },
        {
          name: "Zero-Overhead Scheduling",
          desc: "When one warp stalls waiting for high-latency global memory (~400-800 cycles), the hardware warp scheduler instantly switches to another ready warp in 1 clock cycle without CPU-like context-switch overhead!"
        }
      ]
    },
    speakerNotes: "Stress the concept of a Warp. Hardware never schedules 1 thread; it always schedules 32 threads. If thread 0 needs to execute an instruction, threads 0 through 31 all receive that instruction simultaneously."
  },

  {
    id: 5,
    title: "Warp Lockstep Execution & Branch Divergence",
    subtitle: "Section 6.2 & Textbook Table 6.1 // The Cost of If-Else Branches",
    part: "Part 1: Architecture (00:28 - 00:35)",
    layout: "interactive-sim",
    simId: "sim-branch-divergence",
    content: {
      summary: "Because all 32 threads in a warp share one instruction dispatch unit, what happens when threads encounter conditional branching like if (x[i] >= 0) x[i] += 1; else x[i] -= 2;?",
      keyTable: [
        { time: "Cycle 1", truePath: "Evaluate condition (x[i] >= 0)", falsePath: "Evaluate condition (x[i] >= 0)" },
        { time: "Cycle 2", truePath: "Execute: x[i] += 1 (Active)", falsePath: "IDLE / MASKED OFF" },
        { time: "Cycle 3", truePath: "IDLE / MASKED OFF", falsePath: "Execute: x[i] -= 2 (Active)" },
        { time: "Cycle 4", truePath: "Reconverge: Resume lockstep", falsePath: "Reconverge: Resume lockstep" }
      ],
      insight: "When threads in the same warp diverge, the warp must execute BOTH branches serially. Total execution time is T(then) + T(else)! Divergence across warps incurs a 50% throughput penalty."
    },
    speakerNotes: "Step through the 32-lane simulation on this slide. Show students how the active mask turns off the divergent threads. Emphasize that branch divergence only penalizes within the SAME warp; different warps on different SMs do not penalize each other."
  },

  {
    id: 6,
    title: "Heterogeneous Computing: Host vs. Device",
    subtitle: "Section 6.3 // CPU Control + GPU Acceleration over PCIe",
    part: "Part 2: Memory & Heterogeneous Flow (00:35 - 00:45)",
    layout: "split-text-visual",
    content: {
      summary: "Heterogeneous computing pairs two distinct processing environments: the Host (CPU + DDR System RAM) and the Device (GPU + GDDR/HBM Video RAM).",
      bullets: [
        "<strong>Role of the Host (CPU):</strong> Executes the main() function, handles operating system calls, file I/O, user interaction, complex serial logic, and launches GPU kernels.",
        "<strong>Role of the Device (GPU):</strong> Acts as a coprocessor; executes compute-intensive data-parallel kernels across thousands of threads.",
        "<strong>The PCIe Bottleneck:</strong> The CPU and GPU are separated by the PCIe bus. PCIe Gen4 bandwidth is ~16-32 GB/s, whereas GPU internal VRAM bandwidth exceeds 900+ GB/s! <em>The golden rule of GPU programming: Minimize Host-to-Device and Device-to-Host transfers.</em>"
      ],
      infobox: {
        title: "Asynchronous Kernel Launch",
        text: "When the CPU calls a kernel: <code>Kernel<<<grid, block>>>(args);</code>, control returns to the CPU <em>immediately</em>. The CPU does not wait for the GPU to finish unless explicitly told to via <code>cudaDeviceSynchronize()</code>."
      }
    },
    speakerNotes: "Spend 3 minutes on the PCIe bottleneck. An algorithm with great parallel scaling on the GPU will still run slower than a CPU if it spends 80% of its time copying data back and forth across the PCIe bus."
  },

  {
    id: 7,
    title: "The Memory Hierarchy: From Registers to PCIe",
    subtitle: "Section 6.11.2 & Textbook Table 6.7 // Latency, Scope & Lifetime",
    part: "Part 2: Memory & Heterogeneous Flow (00:45 - 00:55)",
    layout: "interactive-sim",
    simId: "sim-memory-flow",
    content: {
      summary: "To achieve peak performance, programmers must understand the CUDA memory hierarchy and where variables reside.",
      hierarchy: [
        { name: "Registers", scope: "Thread-Private", latency: "1 cycle (~30 TB/s)", desc: "Fastest memory on chip. Holds local scalar variables. 64K 32-bit registers per SM." },
        { name: "Shared Memory", scope: "Block-Shared (__shared__)", latency: "~20-30 cycles (~14 TB/s)", desc: "On-chip SRAM shared across all threads in a block. Used for user-managed caching and tree reductions." },
        { name: "L1 / L2 Cache", scope: "SM / Chip-wide", latency: "~30-200 cycles", desc: "Hardware-managed caching for global memory accesses." },
        { name: "Global Memory (VRAM)", scope: "Grid / Host-accessible", latency: "~400-800 cycles (~900 GB/s)", desc: "DRAM on the GPU card. Large (8GB - 80GB), but high latency. Requires coalesced access." },
        { name: "PCIe Bus", scope: "Host <-> Device", latency: "~10,000+ cycles (~32 GB/s)", desc: "The interconnect between CPU and GPU." }
      ]
    },
    speakerNotes: "Walk students through the 6-stage PCIe memory flow animation on this slide. Step through Host Alloc -> Device Alloc -> cudaMemcpy H2D -> Kernel -> cudaMemcpy D2H -> cudaFree."
  },

  {
    id: 8,
    title: "Memory Management: Explicit vs. Unified/Managed",
    subtitle: "Section 6.8.3 & 6.8.5 // Programs 6.6 vs. 6.9",
    part: "Part 2: Memory & Heterogeneous Flow (00:55 - 01:05)",
    layout: "code-comparison",
    content: {
      summary: "CUDA provides two paradigms for managing memory between host and device:",
      explicitCode: `// Explicit Memory (Program 6.9)
float *hx, *dx;
hx = (float*)malloc(n * sizeof(float));
cudaMalloc(&dx, n * sizeof(float));

// Host -> Device copy over PCIe
cudaMemcpy(dx, hx, n * sizeof(float), cudaMemcpyHostToDevice);

Vec_add<<<blk_ct, th_per_blk>>>(dx, dy, dz, n);

// Device -> Host copy over PCIe
cudaMemcpy(hz, dz, n * sizeof(float), cudaMemcpyDeviceToHost);

cudaFree(dx);
free(hx);`,
      managedCode: `// Managed / Unified Memory (Program 6.6)
float *x;
// Single pointer accessible by CPU & GPU!
cudaMallocManaged(&x, n * sizeof(float));

// CPU initializes array
for (int i = 0; i < n; i++) x[i] = i * 2.0f;

Vec_add<<<blk_ct, th_per_blk>>>(x, y, z, n);

// Mandatory barrier before CPU reads output!
cudaDeviceSynchronize();

printf("Result = %f\\n", z[0]);
cudaFree(x);`,
      notes: [
        "<strong>Explicit Memory:</strong> Maximum control. Best performance for latency-critical production codes. Requires managing separate pointers for host (hx) and device (dx).",
        "<strong>Managed Memory:</strong> Introduced in CUDA 6.0 (Compute Capability >= 3.0/6.0). Automatic page-migration over PCIe via hardware page faulting. Simpler code, but requires explicit <code>cudaDeviceSynchronize()</code>."
      ]
    },
    speakerNotes: "Highlight why explicit memory requires free(hx) and cudaFree(dx), while managed memory only requires cudaFree(x). Emphasize that cudaMemcpy is synchronous to the host, whereas managed memory kernel launches are asynchronous."
  },

  {
    id: 9,
    title: "First CUDA Program: Hello World & Function Qualifiers",
    subtitle: "Sections 6.4 & 6.5 // Program 6.1 Walkthrough",
    part: "Part 3: Execution Hierarchy (01:05 - 01:12)",
    layout: "code-walkthrough",
    content: {
      summary: "Let's inspect the canonical CUDA Hello World program from Section 6.4 of Pacheco:",
      code: `#include <stdio.h>
#include <cuda.h>

/* Device code: runs on GPU, called from CPU */
__global__ void Hello(void) {
    printf("Hello from thread %d!\\n", threadIdx.x);
}

/* Host code: runs on CPU */
int main(int argc, char* argv[]) {
    int thread_count = 8;
    
    // Launch 1 block of 8 threads on the GPU
    Hello<<<1, thread_count>>>();
    
    // CPU barrier: Wait for GPU threads to finish printf
    cudaDeviceSynchronize();
    
    return 0;
}`,
      qualifiers: [
        { q: "__global__", desc: "Kernel function. Executed on the device (GPU), called from the host (CPU). Must return void." },
        { q: "__device__", desc: "Helper function. Executed on the device (GPU), called ONLY from other device functions on the GPU." },
        { q: "__host__", desc: "Standard C/C++ function. Executed on host (CPU), called from host. Default if omitted." }
      ]
    },
    speakerNotes: "Point out the triple angle brackets <<<grid, block>>>. Explain that threadIdx is a built-in variable supplied automatically by the CUDA runtime to every running thread."
  },

  {
    id: 10,
    title: "The Thread Hierarchy: Grids, Blocks & Threads",
    subtitle: "Section 6.6 // Logical Hierarchy to Physical Hardware Mapping",
    part: "Part 3: Execution Hierarchy (01:12 - 01:20)",
    layout: "diagram-slide",
    content: {
      summary: "CUDA organizes parallel work into a 3-tier hierarchy: Threads group into Thread Blocks; Thread Blocks group into a Grid.",
      hierarchyCards: [
        {
          tier: "Thread",
          dim: "threadIdx (x, y, z)",
          desc: "Executes an instance of the kernel. Has private registers and private local memory."
        },
        {
          tier: "Thread Block",
          dim: "blockDim (x, y, z), blockIdx (x, y, z)",
          desc: "Group of up to 1024 threads mapped to a single Streaming Multiprocessor (SM). Threads in a block share on-chip Shared Memory and synchronize via __syncthreads()."
        },
        {
          tier: "Grid",
          dim: "gridDim (x, y, z)",
          desc: "The entire collection of blocks launched by a single kernel invocation. Blocks execute independently in any order (concurrently or sequentially)."
        }
      ],
      hardwareRule: "<strong>Hardware Invariance:</strong> Because thread blocks cannot communicate directly with other blocks, the GPU can schedule blocks in any order across available SMs. A kernel written for an 8-SM laptop GPU scales automatically to an 80-SM enterprise GPU with ZERO code changes!"
    },
    speakerNotes: "This hardware invariance is why NVIDIA conquered parallel computing. The programmer specifies thread blocks, and the hardware warp scheduler takes care of mapping blocks to SMs automatically."
  },

  {
    id: 11,
    title: "Coordinate Mapping: 1D & 2D Indexing Formulas",
    subtitle: "Section 6.6 & 6.8 // Textbook Table 6.4 & Ceiling Division",
    part: "Part 3: Execution Hierarchy (01:20 - 01:30)",
    layout: "interactive-sim",
    simId: "sim-coordinates",
    content: {
      summary: "How does an individual thread compute its unique data index from blockIdx and threadIdx?",
      formulas: [
        {
          title: "1D Global Thread Index (Section 6.8, Table 6.4)",
          math: "int my_i = blockDim.x * blockIdx.x + threadIdx.x;",
          explain: "Each block skips 'blockDim.x' elements per block rank, plus the thread's local rank within the block."
        },
        {
          title: "2D Matrix Coordinate Mapping (Row & Column)",
          math: "int col = blockDim.x * blockIdx.x + threadIdx.x;\nint row = blockDim.y * blockIdx.y + threadIdx.y;\nint linear_idx = row * width + col;",
          explain: "Maps a 2D matrix element (row, col) into a 1D row-major array in global memory."
        },
        {
          title: "Ceiling Division for Grid Sizing (Section 6.8.1)",
          math: "dim3 grid((n + block_size - 1) / block_size);",
          explain: "Ensures enough threads are launched when vector length n is not an exact multiple of block size. Always guard the kernel with: if (my_i < n)!"
        }
      ]
    },
    speakerNotes: "Open the interactive coordinate mapper on this slide. Adjust gridDim.x and blockDim.x sliders. Click on different threads to see the live math formula and physical SM mapping."
  },

  {
    id: 12,
    title: "NVIDIA Compute Capabilities & Device Architectures",
    subtitle: "Section 6.7 // Textbook Table 6.3 & Hardware Constraints",
    part: "Part 4: Capabilities & Vector Add (01:30 - 01:38)",
    layout: "table-slide",
    content: {
      summary: "An NVIDIA GPU's Compute Capability (CC) is represented as a major.minor number (e.g., 2.0, 3.5, 7.0, 8.0). It defines microarchitecture feature support and resource limits.",
      tableData: [
        { arch: "Fermi (CC 2.x)", threadsPerBlk: "1024", warpSize: "32", warpsPerSM: "48", features: "First C++ support, L1/L2 caches, hardware 64-bit float" },
        { arch: "Kepler (CC 3.x)", threadsPerBlk: "1024", warpSize: "32", warpsPerSM: "64", features: "Warp shuffles (__shfl_down_sync), Dynamic Parallelism, SMX" },
        { arch: "Maxwell (CC 5.x)", threadsPerBlk: "1024", warpSize: "32", warpsPerSM: "64", features: "Dedicated shared memory per SM, power efficiency" },
        { arch: "Pascal (CC 6.x)", threadsPerBlk: "1024", warpSize: "32", warpsPerSM: "64", features: "Page-faulting Unified Memory, native FP16 half-precision, NVLink" },
        { arch: "Volta (CC 7.0)", threadsPerBlk: "1024", warpSize: "32", warpsPerSM: "64", features: "First Tensor Cores (mixed precision matrix multiply), Independent Thread Scheduling" },
        { arch: "Ampere (CC 8.x)", threadsPerBlk: "1024", warpSize: "32", warpsPerSM: "64", features: "3rd Gen Tensor Cores, BF16, Asynchronous Memory Copy Engine" }
      ],
      note: "<strong>Querying at Runtime:</strong> Call <code>cudaGetDeviceProperties(&prop, 0);</code> to query maximum threads per block (<code>prop.maxThreadsPerBlock</code>), total global memory, and shared memory per block dynamically."
    },
    speakerNotes: "Make sure students know that Warp Size is ALWAYS 32 across all compute capabilities from Fermi to Blackwell. The maximum threads per block has also been 1024 since Fermi."
  },

  {
    id: 13,
    title: "First Hands-On Kernel: Vector Addition",
    subtitle: "Section 6.8 // Programs 6.3, 6.8 & 6.9",
    part: "Part 4: Capabilities & Vector Add (01:38 - 01:45)",
    layout: "code-walkthrough",
    content: {
      summary: "Vector Addition z = x + y is the foundational data-parallel problem. Each thread adds one pair of elements independently.",
      code: `// Program 6.8: Vector Addition Kernel
__global__ void Vec_add(
    const float x[],  /* in  */
    const float y[],  /* in  */
    float       z[],  /* out */
    const int   n     /* in  */) {
    
    // Compute unique global index
    int my_elt = blockDim.x * blockIdx.x + threadIdx.x;
    
    // Boundary check: skip padding threads if n is not multiple of block size
    if (my_elt < n) {
        z[my_elt] = x[my_elt] + y[my_elt];
    }
} /* Vec_add */`,
      keyTakeaways: [
        "<strong>Why void return type?</strong> Kernels cannot return scalar values because thousands of threads execute concurrently. Results are returned by writing to memory pointers (e.g. <code>float z[]</code>).",
        "<strong>Boundary Protection:</strong> If n = 997 and block size = 256, we launch 4 blocks = 1024 threads. The last 27 threads must not access memory beyond array bound n!",
        "<strong>Error Checking:</strong> Call <code>cudaGetLastError()</code> after kernel launch to detect launch configuration errors (e.g., requesting too many threads)."
      ]
    },
    speakerNotes: "Encourage students to open the live Coding Sandbox on this slide! Test vector addition with custom array sizes and verify that the virtual GPU returns exact element sums."
  },

  {
    id: 14,
    title: "Numerical Integration: The Trapezoidal Rule",
    subtitle: "Section 6.10.1 // Mathematical Foundation & Problem Decomposition",
    part: "Part 5: Numerical Integration (01:45 - 01:52)",
    layout: "split-text-visual",
    content: {
      summary: "The trapezoidal rule estimates the definite integral $\\int_a^b f(x)dx$ by dividing the interval $[a, b]$ into $n$ equal subintervals of width $h = \\frac{b-a}{n}$ and summing trapezoid areas.",
      formulas: [
        { name: "Subinterval Width", math: "h = \\frac{b - a}{n}" },
        { name: "Grid Endpoints", math: "x_i = a + i \\cdot h, \\quad \\text{for } i = 0, 1, \\dots, n" },
        { name: "Composite Trapezoidal Formula", math: "\\int_a^b f(x)dx \\approx h \\left[ \\frac{f(a) + f(b)}{2} + \\sum_{i=1}^{n-1} f(x_i) \\right]" }
      ],
      decomposition: "<strong>Foster's Methodology on CUDA:</strong>\n- <em>Task:</em> Computing $f(x_i)$ for trapezoid $i$.\n- <em>Mapping:</em> Assign each trapezoid calculation to one CUDA thread: <code>my_i = blockDim.x * blockIdx.x + threadIdx.x;</code>\n- <em>The Challenge:</em> How do thousands of threads sum their partial values into a single global accumulator?"
    },
    speakerNotes: "Explain that calculating f(x) is embarrassing parallel (every thread does its own x_i). The challenge is the REDUCTION (summing all trapezoid areas together into one scalar). This leads into Trap I, II, and III."
  },

  {
    id: 15,
    title: "CUDA Trapezoidal Rule I: Race Conditions & atomicAdd",
    subtitle: "Section 6.10 // Program 6.12 & Table 6.5 Performance Bottleneck",
    part: "Part 5: Numerical Integration (01:52 - 02:00)",
    layout: "interactive-sim",
    simId: "sim-trap1-atomic",
    content: {
      summary: "In Trap I, all threads attempt to update the global sum pointer *trap_p directly.",
      raceCondition: "<strong>The Data Race:</strong> If threads execute <code>*trap_p += my_trap;</code>, thread A reads the old sum, thread B reads the old sum, both add, and both write back—overwriting each other's updates! The result is mathematically corrupted.",
      atomicSolution: "<strong>atomicAdd(trap_p, my_trap):</strong> Serializes additions at the hardware memory controller, guaranteeing atomic mutual exclusion.",
      bottleneck: "<strong>The Critical Contention Bottleneck (Table 6.5):</strong> When 1,000,000 threads execute <code>atomicAdd</code> on the EXACT SAME memory address, all 1,000,000 additions are executed sequentially! The global memory bus thralls. On NVIDIA GK20A, serial CPU runs in <strong>20.7 ms</strong>, but Trap I on the GPU takes <strong>33.6 ms</strong> (slower than CPU!)."
    },
    speakerNotes: "Demonstrate the live simulation on this slide! Switch between 'Unsynchronized Mode' (dirty writes, corrupted integral) and 'atomicAdd Mode' (exact integral, but high contention). Highlight why Trap I is unacceptable for production code."
  },

  {
    id: 16,
    title: "CUDA Trapezoidal Rule II: Shared Memory Tree Reduction",
    subtitle: "Section 6.11 & 6.12 // Program 6.14 & Figures 6.4/6.6",
    part: "Part 5: Numerical Integration (02:00 - 02:08)",
    layout: "interactive-sim",
    simId: "sim-tree-reduction",
    content: {
      summary: "To eliminate global atomic contention, threads cooperatively sum their trapezoids in fast on-chip Shared Memory using a Tree Reduction. Only ONE thread per block calls atomicAdd!",
      algorithmSteps: [
        "1. Every thread computes its trapezoid and stores it in shared memory: <code>sdata[threadIdx.x] = my_trap;</code>",
        "2. Intra-block barrier: <code>__syncthreads();</code> ensures all writes are visible.",
        "3. Stride-halving tree reduction in shared memory: in each step, half the threads add values from the other half: <code>sdata[tid] += sdata[tid + s];</code>",
        "4. Synchronize after each step with <code>__syncthreads();</code> to prevent Read-After-Write hazards.",
        "5. Final update: Only Thread 0 writes block total: <code>if (threadIdx.x == 0) atomicAdd(trap_p, sdata[0]);</code> (Reduces global atomics by 1024x!)."
      ]
    },
    speakerNotes: "Step through the collapsing tree simulation on this slide. Show how stride goes from 8 to 4 to 2 to 1 in O(log2 N) parallel steps. Emphasize that __syncthreads() is mandatory to avoid RAW hazards between tree levels."
  },

  {
    id: 17,
    title: "Shared Memory Architecture & 32-Bank Conflicts",
    subtitle: "Section 6.13.4 & Textbook Table 6.9 // Memory Bank Serialization",
    part: "Part 6: Warp Primitives & Trap III (02:08 - 02:16)",
    layout: "interactive-sim",
    simId: "sim-bank-conflicts",
    content: {
      summary: "Shared memory is physically split into 32 independent memory banks (4 bytes wide). All 32 threads in a warp can access shared memory in 1 single clock cycle—provided they access distinct banks!",
      rules: [
        "<strong>Conflict-Free Access (Stride 1):</strong> Thread $i$ accesses Bank $i$. All 32 requests resolve simultaneously in 1 cycle.",
        "<strong>Bank Conflict:</strong> If multiple threads in a warp access different addresses belonging to the SAME bank, hardware serializes the accesses. A 2-way conflict takes 2 cycles; a 32-way conflict takes 32 cycles!",
        "<strong>Broadcast Exception:</strong> If multiple threads read the <em>exact same address</em> in a bank, the value is broadcast to all reading threads simultaneously in 1 cycle."
      ],
      table6_9Excerpt: "Pacheco Table 6.9 shows why stride-halving tree reduction is optimal: active threads always map to distinct banks, avoiding bank conflicts completely!"
    },
    speakerNotes: "Run the 32-Bank Conflict Simulator on this slide. Compare Stride 1 (green, 1 cycle) with Stride 32 (red, 32 cycles). Show students how bank conflicts kill shared memory throughput."
  },

  {
    id: 18,
    title: "CUDA Trapezoidal Rule III: Warp Shuffles & Multi-Warp",
    subtitle: "Sections 6.11.3 & 6.13 // Program 6.15 & Table 6.10 Benchmarks",
    part: "Part 6: Warp Primitives & Trap III (02:16 - 02:25)",
    layout: "interactive-sim",
    simId: "sim-warp-shuffle",
    content: {
      summary: "Modern GPUs achieve peak occupancy with 128 to 1024 threads per block (multiple warps). Trap III implements a Hierarchical 2-Tier Reduction:",
      tierBreakdown: [
        {
          tier: "Tier 1: Intra-Warp Reduction",
          tech: "__shfl_down_sync(0xFFFFFFFF, val, offset)",
          desc: "Threads exchange data directly register-to-register in 1 clock cycle without using shared memory and without __syncthreads() barriers!"
        },
        {
          tier: "Tier 2: Inter-Warp Shared Memory",
          tech: "warp_sum_arr[my_warp] = warp_sum; __syncthreads();",
          desc: "Lane 0 of each warp writes its warp sum to a contiguous shared array (0 bank conflicts). Warp 0 reduces warp_sum_arr."
        },
        {
          tier: "Final Update",
          tech: "if (threadIdx.x == 0) atomicAdd(trap_p, blk_result);",
          desc: "Block thread 0 performs 1 single atomicAdd to global memory."
        }
      ],
      table6_10Benchmarks: [
        { impl: "Trap I (atomicAdd every thread)", gk20a: "20.7 ms", titanX: "3.08 ms", speedup: "1.0x (Baseline)" },
        { impl: "Trap II (Shared Memory, 32 ths/blk)", gk20a: "15.0 ms", titanX: "0.206 ms", speedup: "15.0x Faster" },
        { impl: "Trap II (Warp Shuffle, 32 ths/blk)", gk20a: "14.4 ms", titanX: "0.210 ms", speedup: "14.7x Faster" },
        { impl: "Trap III (Shared Memory, 1024 ths/blk)", gk20a: "14.3 ms", titanX: "0.150 ms", speedup: "20.5x Faster" },
        { impl: "Trap III (Warp Shuffle, 1024 ths/blk)", gk20a: "12.8 ms", titanX: "0.141 ms", speedup: "21.8x Faster! ⚡" }
      ]
    },
    speakerNotes: "Showcase Table 6.10 on Titan X: Trap III achieves a massive 21.8x speedup over Trap I (0.141 ms vs 3.08 ms). Reducing atomicAdd contention and using warp shuffles is worth every bit of engineering effort!"
  },

  {
    id: 19,
    title: "Parallel Bitonic Sort Preview",
    subtitle: "Section 6.14 // Figures 6.7, 6.8 & Butterfly Communication Networks",
    part: "Part 6: Wrap-up & Exam Prep (02:25 - 02:30)",
    layout: "split-text-visual",
    content: {
      summary: "Bitonic sort is a comparison-based sorting algorithm with a fixed butterfly communication structure, making it ideal for GPUs where data-dependent branch divergence is costly.",
      bullets: [
        "<strong>Bitonic Sequence:</strong> A sequence that first increases monotonically, then decreases monotonically (e.g. {15, 77, 83, 86, 93, 92, 85, 35}).",
        "<strong>Butterfly Network:</strong> Fixed compare-and-swap pairings at power-of-two stages ($N/2, N/4, \\dots, 1$).",
        "<strong>Why it shines on GPUs:</strong> Because the compare-and-swap pairs are predetermined and independent of data values, threads never suffer from branch divergence!"
      ]
    },
    speakerNotes: "Briefly touch upon Bitonic Sort. Mention that its butterfly network is structurally identical to the FFT (Fast Fourier Transform), making it a favorite topic for advanced parallel algorithms."
  },

  {
    id: 20,
    title: "VTU Exam Mastery & Interactive Knowledge Check",
    subtitle: "Module 5 Complete Review // 10-Mark Model Answers & Viva Questions",
    part: "Part 6: Wrap-up & Exam Prep (02:30 - 02:40)",
    layout: "exam-summary",
    content: {
      summary: "Congratulations on completing the Module 5 Masterclass! Here are the core VTU examination questions and concepts to review:",
      topExamQuestions: [
        "1. Explain GPU architecture and contrast Flynn's SISD, SIMD, and NVIDIA SIMT models. (10 Marks)",
        "2. Explain CUDA Thread Hierarchy (Grids, Blocks, Threads) and derive 1D and 2D coordinate formulas. (10 Marks)",
        "3. Differentiate between Explicit Memory Management and Unified/Managed Memory with code examples. (10 Marks)",
        "4. Explain CUDA Trapezoidal Rule I. Why does it cause race conditions, and why does atomicAdd suffer from contention? (10 Marks)",
        "5. Explain CUDA Trapezoidal Rule II with Shared Memory Tree Reduction, __syncthreads(), and 32-Bank Conflicts. (10 Marks)",
        "6. Explain CUDA Trapezoidal Rule III with Warp Shuffles (__shfl_down_sync) and 2-Tier Hierarchical Reduction. (10 Marks)"
      ]
    },
    speakerNotes: "Conclude the session! Direct students to the 'Exam & Viva Voce' tab for the full model answers and the 10-question interactive quiz."
  }
];
