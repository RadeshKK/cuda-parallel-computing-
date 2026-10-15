/**
 * curriculum.js
 * Comprehensive syllabus & textbook database for BCS702 Module 5:
 * GPU Programming with CUDA (Based on Peter S. Pacheco & Matthew Malensek, 2nd Edition)
 */

const CURRICULUM_DATA = {
  courseInfo: {
    code: "BCS702",
    title: "Parallel Programming",
    module: "MODULE-5: GPU Programming with CUDA",
    durationHours: 2,
    textbook: "Peter S. Pacheco, Matthew Malensek - An Introduction to Parallel Programming, 2nd Edition, Morgan Kaufmann (Chapter 6)",
    topics: [
      "GPUs and GPGPU",
      "GPU architectures",
      "Heterogeneous computing",
      "Threads, blocks, and grids",
      "Nvidia compute capabilities and device architectures",
      "Vector addition",
      "Returning results from CUDA kernels",
      "CUDA trapezoidal rule I",
      "CUDA trapezoidal rule II: improving performance",
      "CUDA trapezoidal rule III: blocks with more than one warp"
    ]
  },

  sessionSchedule: [
    {
      id: "part-1",
      title: "Part 1: Genesis of GPU Computing & Hardware Architecture",
      durationMins: 20,
      timeRange: "00:00 - 00:20",
      sections: ["6.1", "6.2"],
      objective: "Understand why GPUs evolved from fixed pipelines to massive data-parallel processors; contrast Flynn's SISD, SIMD, and Nvidia's SIMT; unpack Streaming Multiprocessors (SMs), SPs (CUDA Cores), and warps.",
      keyConcepts: [
        "Fixed graphics pipelines vs. Programmable Shaders vs. GPGPU",
        "Flynn's Taxonomy: SISD vs SIMD vs MIMD",
        "SIMT (Single Instruction, Multiple Threads) Execution Model",
        "Streaming Multiprocessors (SMs) and Streaming Processors (SPs)",
        "Warp Organization (32 threads in lockstep) & Zero-overhead Context Switching",
        "Branch Divergence penalty and execution masking"
      ]
    },
    {
      id: "part-2",
      title: "Part 2: Heterogeneous Computing & Memory Hierarchy",
      durationMins: 20,
      timeRange: "00:20 - 00:40",
      sections: ["6.3", "6.11.2"],
      objective: "Master the Host/Device paradigm separated by the PCIe bus; explore the physical and logical memory hierarchy from registers to Global VRAM; contrast Explicit memory transfers with Unified/Managed memory.",
      keyConcepts: [
        "Host (CPU + System RAM) vs Device (GPU + VRAM)",
        "PCIe bus bandwidth bottleneck (~16-64 GB/s vs ~900 GB/s on GPU)",
        "Memory Hierarchy: Registers (1 cycle), Shared Memory (~20 cycles), L1/L2 Caches, Global Memory (~400-800 cycles)",
        "Explicit Memory Flow: cudaMalloc, cudaMemcpy (H2D, D2H), cudaFree",
        "Managed Memory: cudaMallocManaged, page-faulting and automatic migration (Compute Capability >= 3.0/6.0)"
      ]
    },
    {
      id: "part-3",
      title: "Part 3: The Execution Model: Grids, Blocks, Threads & Warp Scheduling",
      durationMins: 25,
      timeRange: "00:40 - 01:05",
      sections: ["6.4", "6.5", "6.6"],
      objective: "Formulate the CUDA thread hierarchy; implement CUDA Hello World; master 1D, 2D, and 3D coordinate mapping formulas; discover how hardware assigns thread blocks to physical SMs.",
      keyConcepts: [
        "CUDA Hello World: __global__ void Hello(), <<<grid, block>>>",
        "Asynchronous kernel execution and cudaDeviceSynchronize()",
        "Built-in variables: threadIdx, blockIdx, blockDim, gridDim",
        "1D Thread Indexing formula: global_id = blockDim.x * blockIdx.x + threadIdx.x",
        "2D Matrix Coordinate Mapping: row, col, and linear index",
        "Ceiling division for Grid Sizing: grid = (n + block_size - 1) / block_size",
        "Block-to-SM hardware allocation: Non-migrating blocks, resource partitioning"
      ]
    },
    {
      id: "part-4",
      title: "Part 4: Nvidia Compute Capabilities & Vector Addition Kernel",
      durationMins: 20,
      timeRange: "01:05 - 01:25",
      sections: ["6.7", "6.8", "6.9"],
      objective: "Decode Nvidia Compute Capability versions and hardware constraints; build complete Vector Addition kernels (managed vs explicit); master kernel return patterns via device pointers.",
      keyConcepts: [
        "Compute Capability versioning (Fermi 2.x, Kepler 3.x, Maxwell 5.x, Pascal 6.x, Volta 7.0, Ampere 8.x, Hopper 9.0)",
        "Hardware constraints per CC: Max threads per block (1024), registers per SM, shared memory limits",
        "Vector Addition Kernel implementation with boundary check: if (i < n)",
        "Get_args, Allocate_vectors, Init_vectors, Two_norm_diff validation",
        "Returning results from kernels: why __global__ returns void, passing device pointers",
        "CUDA Error Handling: cudaGetLastError(), cudaGetErrorString()"
      ]
    },
    {
      id: "part-5",
      title: "Part 5: Numerical Integration: CUDA Trapezoidal Rule I & II",
      durationMins: 20,
      timeRange: "01:25 - 01:45",
      sections: ["6.10", "6.11", "6.12"],
      objective: "Parallelize numerical integration; analyze race conditions and serialized atomicAdd in Trap I; engineer high-performance Tree Reduction in Shared Memory with __syncthreads() in Trap II; analyze bank conflicts.",
      keyConcepts: [
        "The Trapezoidal Rule formula: h = (b-a)/n, x_i = a + i*h, area = h * [(f(a)+f(b))/2 + sum(f(x_i))]",
        "CUDA Trap I: The Race Condition (*trap_p += my_trap) and data corruption",
        "atomicAdd(): Hardware serialization queue, memory bus contention, why Trap I scales poorly",
        "CUDA Trap II: Shared Memory Reduction (__shared__ float shared_vals[])",
        "Tree-Structured Reduction: Stride halving (stride = blockDim/2; stride > 0; stride /= 2)",
        "The __syncthreads() barrier: why it is strictly required to prevent RAW/WAR hazards",
        "Shared Memory Architecture: 32 memory banks, conflict-free broadcast vs 2-way/32-way bank conflicts"
      ]
    },
    {
      id: "part-6",
      title: "Part 6: Warp Primitives, Multi-Warp Reduction (Trap III) & Exam Prep",
      durationMins: 15,
      timeRange: "01:45 - 02:00",
      sections: ["6.13", "6.14", "6.15"],
      objective: "Master register-to-register warp shuffles (__shfl_down_sync); construct the 2-tier Hierarchical Block Reduction (Trap III); examine textbook performance benchmarks (Titan X & Tegra K1); review VTU exam questions.",
      keyConcepts: [
        "Warp Shuffle Primitive: __shfl_down_sync(mask, val, offset) - direct register exchange without shared memory",
        "Intra-warp tree reduction using shuffles (offsets 16, 8, 4, 2, 1)",
        "CUDA Trap III: Blocks with multiple warps (hierarchical reduction)",
        "Inter-warp race conditions and the two-tier shared memory architecture (thread_calcs + warp_sum_arr)",
        "Bank conflict elimination by storing warp sums contiguously",
        "Performance Benchmarking: Table 6.10 comparison (GK20A vs Titan X)",
        "Bitonic Sort preview: Butterfly networks on CUDA",
        "VTU Exam Question Bank & Viva Voce revision"
      ]
    }
  ],

  sections: {
    "6.1": {
      title: "GPUs and GPGPU",
      textbookRef: "Pages 291-292",
      summary: "In the late 1990s and early 2000s, the computer industry responded to demand for 3D realism in video games by developing Graphics Processing Units (GPUs). Early programmers realized the immense raw floating-point computing power of GPUs and sought to apply them to scientific computing (GPGPU: General Purpose computing on GPUs). However, early developers had to reformulate scientific algorithms into graphics concepts (mapping arrays to textures, computations to pixel shaders, data points to triangles/vertices). In 2006/2007, NVIDIA revolutionized the field by releasing CUDA (Compute Unified Device Architecture), providing a direct C/C++ interface with no graphics abstraction needed.",
      keyPoints: [
        "Evolution: Fixed-function pipeline -> Programmable vertex/pixel shaders (DirectX/OpenGL) -> GPGPU -> Native Compute APIs (CUDA, OpenCL).",
        "CUDA vs OpenCL: CUDA is tailored specifically for NVIDIA hardware, providing higher performance and lower setup boilerplate. OpenCL is an open standard supporting multi-vendor CPUs, GPUs, DSPs, and FPGAs.",
        "Motivation for GPUs: Latency-oriented CPUs dedicate massive silicon to caches and branch prediction, whereas Throughput-oriented GPUs dedicate >80% of silicon to arithmetic logic units (ALUs)."
      ]
    },

    "6.2": {
      title: "GPU Architectures",
      textbookRef: "Pages 292-294",
      summary: "Conventional CPUs are SISD/MIMD architectures in Flynn's Taxonomy. GPUs are SIMD/SIMT architectures. A GPU chip contains an array of Streaming Multiprocessors (SMs). Each SM contains multiple Streaming Processors (SPs or CUDA Cores), Warp Schedulers, Dispatch Units, and fast Shared Memory/L1 Cache. All SMs share an L2 cache and connect to high-bandwidth Global VRAM.",
      keyPoints: [
        "SIMD vs SIMT: SIMD (Single Instruction, Multiple Data) broadcasts one instruction to vector datapaths. SIMT (Single Instruction, Multiple Threads) executes independent threads grouped into 32-thread warps. Threads have their own instruction pointers and registers, but the warp scheduler dispatches instructions to active threads in lockstep.",
        "Streaming Multiprocessors (SMs): SMs operate asynchronously relative to each other. An SM can execute a different kernel or different thread block than another SM.",
        "Branch Divergence: In an if-else block, if threads in a warp evaluate different paths, the warp executes the 'if' path while 'else' threads are masked (idle), then executes the 'else' path while 'if' threads are masked. Total time = Time(if) + Time(else).",
        "Textbook Table 6.1 & 6.2: Demonstrates branch execution across datapaths and across multiple SMs."
      ],
      formulas: [
        { name: "Branch Divergence Serialization Cost", latex: "T_{\\text{warp}} = T_{\\text{then}} + T_{\\text{else}} \\quad (\\text{when branches diverge across 32 threads})" }
      ]
    },

    "6.3": {
      title: "Heterogeneous Computing",
      textbookRef: "Pages 293-295",
      summary: "Heterogeneous computing combines two distinct processing architectures: the Host (CPU and system memory) and the Device (GPU and its high-bandwidth video memory). The CPU handles sequential control flow, operating system calls, I/O, and complex branching, while offloading massively parallel compute-intensive data kernels to the GPU. Communication happens over the PCIe bus (Peripheral Component Interconnect Express), which has significant latency and limited bandwidth (~16 to 64 GB/s) compared to GPU internal memory bandwidth (~900+ GB/s).",
      keyPoints: [
        "The Host/Device Relationship: Host manages execution, allocates memory, and launches kernels. Device executes massive parallel kernels.",
        "The PCIe Bottleneck: Minimizing Host-Device transfers is the #1 optimization rule in GPU programming.",
        "Explicit Memory Model: The programmer calls cudaMalloc() for device buffers, cudaMemcpy(cudaMemcpyHostToDevice) before kernel launch, and cudaMemcpy(cudaMemcpyDeviceToHost) after kernel launch, followed by cudaFree().",
        "Managed / Unified Memory: Introduced in CUDA 6.0 (CC >= 3.0), cudaMallocManaged() provides a single pointer accessible by both Host and Device. Under CC >= 6.0 (Pascal+), pages are migrated on-demand via hardware page faulting."
      ]
    },

    "6.4": {
      title: "CUDA Hello World & Closer Look",
      textbookRef: "Pages 295-298",
      summary: "Program 6.1 introduces the first CUDA program. A kernel function is designated with the `__global__` function qualifier. Kernels return `void`. The triple angle brackets `<<<grid, block>>>` specify the execution configuration. CUDA kernels execute asynchronously: control returns to the CPU immediately after launch. `cudaDeviceSynchronize()` forces the CPU to block until all GPU threads finish.",
      keyPoints: [
        "Function Qualifiers: `__global__` (called from host, runs on device), `__device__` (called from device, runs on device), `__host__` (standard CPU function, default).",
        "Kernel Launch Syntax: `FunctionName<<<grid_dimension, block_dimension, shared_mem_bytes, stream>>>(arguments);`",
        "Asynchronous Nature: CPU does not wait for GPU kernel completion automatically. If CPU accesses data before synchronization, race conditions occur.",
        "`cudaDeviceSynchronize()`: Crucial host synchronization barrier."
      ],
      codeSnippet: `// Program 6.1: CUDA Hello World
#include <stdio.h>
#include <cuda.h>

/* Device code: runs on GPU */
__global__ void Hello(void) {
    printf("Hello from thread %d!\\n", threadIdx.x);
}

/* Host code: runs on CPU */
int main(int argc, char* argv[]) {
    int thread_count = 10;
    Hello<<<1, thread_count>>>();
    cudaDeviceSynchronize(); // Wait for GPU to finish
    return 0;
}`
    },

    "6.6": {
      title: "Threads, Blocks, and Grids",
      textbookRef: "Pages 299-301",
      summary: "CUDA structures execution into a three-level hierarchy: Threads -> Thread Blocks -> Grid. Threads inside a block can cooperate using shared memory and synchronize via `__syncthreads()`. Thread blocks run independently across Streaming Multiprocessors, allowing CUDA code to scale transparently across low-end mobile GPUs (few SMs) and enterprise server GPUs (dozens of SMs). Built-in variables `threadIdx`, `blockIdx`, `blockDim`, and `gridDim` are 3-component structs (`dim3`) with `.x`, `.y`, and `.z` fields.",
      keyPoints: [
        "Grid of Blocks: The entire kernel launch is a Grid. A Grid is an array of Blocks.",
        "Block of Threads: Each Block contains up to 1024 threads (on all modern hardware).",
        "Hardware Independence: Blocks can execute in any order (concurrently, sequentially, or interleaved) on any SM.",
        "1D Global Thread Index Formula: `int tid = blockIdx.x * blockDim.x + threadIdx.x;`",
        "2D Matrix Coordinates: `int col = blockIdx.x * blockDim.x + threadIdx.x; int row = blockIdx.y * blockDim.y + threadIdx.y; int idx = row * width + col;`",
        "Ceiling Division for Grid Sizing: When vector size n is not an exact multiple of block size, compute `dim3 grid((n + block_size - 1) / block_size);` and protect kernel with `if (i < n)`."
      ],
      formulas: [
        { name: "1D Global Index", latex: "i = \\text{blockDim.x} \\times \\text{blockIdx.x} + \\text{threadIdx.x}" },
        { name: "2D Grid Coordinates", latex: "\\text{col} = \\text{blockDim.x} \\times \\text{blockIdx.x} + \\text{threadIdx.x}, \\quad \\text{row} = \\text{blockDim.y} \\times \\text{blockIdx.y} + \\text{threadIdx.y}" },
        { name: "Grid Sizing (Ceiling Division)", latex: "\\text{gridDim.x} = \\left\\lceil \\frac{n}{\\text{blockDim.x}} \\right\\rceil = \\frac{n + \\text{blockDim.x} - 1}{\\text{blockDim.x}}" }
      ],
      codeSnippet: `// Program 6.2: Hello from threads in multiple blocks
__global__ void Hello(void) {
    printf("Hello from thread %d in block %d\\n", threadIdx.x, blockIdx.x);
}

int main(int argc, char* argv[]) {
    int blk_ct = 4;
    int th_per_blk = 8;
    Hello<<<blk_ct, th_per_blk>>>();
    cudaDeviceSynchronize();
    return 0;
}`
    },

    "6.7": {
      title: "Nvidia Compute Capabilities and Device Architectures",
      textbookRef: "Pages 301-303",
      summary: "An NVIDIA GPU's Compute Capability (CC) is represented as a major.minor number (e.g., 2.0, 3.5, 6.1, 7.0, 8.0). It defines the microarchitectural feature set, instruction support, and physical hardware resource limits. It does not represent clock frequency or raw ALU count, but the generation of the GPU hardware.",
      keyPoints: [
        "Architecture Generations: Fermi (2.x), Kepler (3.x), Maxwell (5.x), Pascal (6.x), Volta (7.0), Turing (7.5), Ampere (8.x), Hopper (9.0), Blackwell (10.0).",
        "Warp Size: Exactly 32 threads across ALL compute capabilities.",
        "Max Threads Per Block: 512 on CC 1.x, 1024 on CC 2.0 through 9.x.",
        "Max Resident Blocks / Warps per SM: Constrained by register count (e.g. 64K 32-bit registers per SM) and shared memory capacity (e.g. 48KB - 164KB per SM).",
        "Querying in CUDA: Use `cudaGetDeviceProperties(&deviceProp, deviceId)` to read architecture name, total global memory, shared memory per block, and warp size dynamically."
      ],
      table6_3: [
        { arch: "Fermi", cc: "2.x", maxThPerBlk: 1024, warpSize: 32, maxResidentWarpsPerSM: 48, features: "L1/L2 caches, C++ support, hardware FP64" },
        { arch: "Kepler", cc: "3.x", maxThPerBlk: 1024, warpSize: 32, maxResidentWarpsPerSM: 64, features: "Warp shuffle (__shfl), Dynamic Parallelism, SMX" },
        { arch: "Maxwell", cc: "5.x", maxThPerBlk: 1024, warpSize: 32, maxResidentWarpsPerSM: 64, features: "Dedicated shared memory per SM, power efficiency" },
        { arch: "Pascal", cc: "6.x", maxThPerBlk: 1024, warpSize: 32, maxResidentWarpsPerSM: 64, features: "Native FP16, Page Faulting Unified Memory, NVLink" },
        { arch: "Volta", cc: "7.0", maxThPerBlk: 1024, warpSize: 32, maxResidentWarpsPerSM: 64, features: "Tensor Cores, Independent Thread Scheduling" },
        { arch: "Turing", cc: "7.5", maxThPerBlk: 1024, warpSize: 32, maxResidentWarpsPerSM: 32, features: "RT Cores, Concurrent INT32 + FP32 execution" },
        { arch: "Ampere", cc: "8.x", maxThPerBlk: 1024, warpSize: 32, maxResidentWarpsPerSM: 64, features: "3rd Gen Tensor Cores, BF16, Async Copy engine" }
      ]
    },

    "6.8": {
      title: "Vector Addition (Managed vs. Explicit Memory)",
      textbookRef: "Pages 303-312",
      summary: "Vector addition $z = x + y$ serves as the foundational data-parallel workload. Each thread computes one component: `z[i] = x[i] + y[i]`. The textbook presents two complete implementations: Program 6.3/6.6 using Managed Memory (`cudaMallocManaged`) and Program 6.9 using Explicit Memory transfers (`cudaMalloc`, `cudaMemcpyHostToDevice`, `cudaMemcpyDeviceToHost`, `cudaFree`).",
      keyPoints: [
        "The Kernel: `__global__ void Vec_add(const float x[], const float y[], float z[], const int n)`",
        "Boundary Check: Essential when vector length n is not a multiple of block size: `if (my_elt < n) z[my_elt] = x[my_elt] + y[my_elt];`",
        "Managed Memory Approach: Clean code, single pointers for host and device, but requires `cudaDeviceSynchronize()` before host reads output.",
        "Explicit Memory Approach: Allocates host vectors (`hx`, `hy`, `hz`) and device vectors (`dx`, `dy`, `dz`). Transfers inputs via `cudaMemcpyHostToDevice` and retrieves results via `cudaMemcpyDeviceToHost`. Note that `cudaMemcpy` is synchronous with respect to the host, so `cudaDeviceSynchronize()` is implicitly guaranteed.",
        "Validation: Using `Serial_vec_add` on CPU and computing Euclidean difference norm `Two_norm_diff` to verify numerical correctness."
      ],
      codeSnippet: `// Program 6.8 & 6.9: Vector Addition Kernel
__global__ void Vec_add(const float x[], const float y[], float z[], const int n) {
    int my_elt = blockDim.x * blockIdx.x + threadIdx.x;
    if (my_elt < n) {
        z[my_elt] = x[my_elt] + y[my_elt];
    }
}`
    },

    "6.9": {
      title: "Returning Results from CUDA Kernels",
      textbookRef: "Pages 313-314",
      summary: "Unlike C functions that can return scalar values via the `return` statement, CUDA kernels declared with `__global__` must have a return type of `void`. Kernels return results to the caller by writing into memory allocated on the device (or managed memory) via pointer arguments. The host must synchronize before reading these results.",
      keyPoints: [
        "Why void? Because thousands of threads execute concurrently; returning a single scalar value from multiple threads makes no semantic sense.",
        "Pointer Passing: Pass `float* result_p` to the kernel. Threads write results into `*result_p` or `result_p[threadIdx.x]`.",
        "Host Access: For managed variables, host cannot read `*result_p` until `cudaDeviceSynchronize()` completes.",
        "Alternative: `__managed__ int global_sum;` declares a managed variable with static duration accessible on host and device."
      ]
    },

    "6.10": {
      title: "CUDA Trapezoidal Rule I (Atomic Operations)",
      textbookRef: "Pages 314-320",
      summary: "The trapezoidal rule estimates the definite integral $\\int_a^b f(x) dx \\approx h \\cdot [\\frac{f(a)+f(b)}{2} + \\sum_{i=1}^{n-1} f(x_i)]$ with $h = \\frac{b-a}{n}$ and $x_i = a + i \\cdot h$. In CUDA Trapezoidal Rule I, each thread calculates one trapezoid $f(x_i)$. To accumulate the global sum, all threads write into a shared accumulator `*trap_p`. If threads do `*trap_p += my_trap`, a severe Race Condition occurs because reads, adds, and writes interleave non-deterministically. To prevent data corruption, CUDA provides `atomicAdd(trap_p, my_trap)`. However, having thousands of threads call `atomicAdd` on the EXACT SAME memory address causes intense hardware contention, serializing execution and destroying parallel speedup.",
      keyPoints: [
        "The Race Condition: When multiple threads execute read-modify-write on shared memory concurrently, updates are clobbered.",
        "`atomicAdd(float* address, float val)`: Atomically adds `val` to `*address`, guaranteeing mutual exclusion at hardware level.",
        "The Performance Bottleneck in Trap I: Serializing 1,000,000 threads through a single 32-bit memory location saturates the global memory controller and causes massive warp stalling.",
        "Textbook Table 6.5: On Nvidia GK20A, serial CPU runtime is 20.7 ms, while CUDA Trap I is 33.6 ms (slower than CPU!) due to atomic contention!"
      ],
      formulas: [
        { name: "Trapezoidal Rule Approximation", latex: "\\int_a^b f(x) dx \\approx h \\left[ \\frac{f(a) + f(b)}{2} + \\sum_{i=1}^{n-1} f(x_i) \\right], \\quad h = \\frac{b-a}{n}, \\quad x_i = a + ih" }
      ],
      codeSnippet: `// Program 6.12: CUDA Trap I (AtomicAdd)
__global__ void Dev_trap(const float a, const float b, const float h, const int n, float* trap_p) {
    int my_i = blockDim.x * blockIdx.x + threadIdx.x;
    if (0 < my_i && my_i < n) {
        float my_x = a + my_i * h;
        float my_trap = f(my_x);
        // Contention bottleneck: every thread executes atomicAdd on the same pointer!
        atomicAdd(trap_p, my_trap);
    }
}`
    },

    "6.11": {
      title: "CUDA Trapezoidal Rule II: Improving Performance",
      textbookRef: "Pages 320-328",
      summary: "To eliminate the atomic contention of Trap I, we use a two-level Tree-Structured Reduction. Instead of every thread calling `atomicAdd` in global memory, threads in each thread block sum their contributions cooperatively in fast on-chip Shared Memory (`__shared__`). Only ONE thread per block (thread 0) writes the block total into global memory using `atomicAdd`. This reduces atomic operations by a factor equal to the block size (e.g. 1024x fewer atomics!).",
      keyPoints: [
        "Shared Memory (`__shared__`): On-chip SRAM shared across all threads in a block. Has ~100x lower latency and ~10x higher bandwidth than Global Memory.",
        "Tree Reduction Algorithm: In each step, the stride is halved. Thread `tid < stride` adds `sdata[tid + stride]` to `sdata[tid]`. Reduces $N$ elements in $\\log_2 N$ parallel steps.",
        "Barrier Synchronization (`__syncthreads()`): Strictly required after writing to shared memory and after each reduction stage to prevent Read-After-Write (RAW) data races.",
        "Shared Memory Bank Conflicts: Shared memory is divided into 32 banks (4-byte words). If threads in a warp access different words in the SAME bank, the accesses are serialized. Stride-halving tree reduction avoids bank conflicts by ensuring active threads map to distinct banks.",
        "Warp Shuffle Primitive (`__shfl_down_sync`): Allows threads within a 32-thread warp to read registers from other threads without shared memory and without `__syncthreads()`."
      ],
      formulas: [
        { name: "Tree Reduction Complexity", latex: "T(N) = \\mathcal{O}(\\log_2 N) \\quad \\text{parallel steps instead of } \\mathcal{O}(N) \\text{ serial additions}" },
        { name: "Atomic Contention Reduction Factor", latex: "\\text{Contention Reduction} = \\frac{N}{\\text{blockDim.x}} \\quad (\\text{e.g. 1024x fewer atomicAdd calls})" }
      ],
      codeSnippet: `// Inside Shared Memory Reduction
__shared__ float sdata[BLOCK_SIZE];
sdata[threadIdx.x] = my_val;
__syncthreads();

// Tree-structured reduction with stride halving
for (int s = blockDim.x / 2; s > 0; s >>= 1) {
    if (threadIdx.x < s) {
        sdata[threadIdx.x] += sdata[threadIdx.x + s];
    }
    __syncthreads(); // Critical barrier!
}

if (threadIdx.x == 0) {
    atomicAdd(trap_p, sdata[0]); // Only 1 atomicAdd per thread block!
}`
    },

    "6.12": {
      title: "Trapezoidal Rule with warpSize Thread Blocks",
      textbookRef: "Pages 328-331",
      summary: "Program 6.14 implements the trapezoidal rule where each thread block has exactly `warpSize` (32) threads. Because all 32 threads in the block belong to the same warp, they execute synchronously in SIMT hardware. The kernel initializes `__shared__ float shared_vals[WARPSZ]`, evaluates the integrand, sums the 32 elements using shared memory or warp shuffles, and thread 0 performs a single `atomicAdd` per block.",
      keyPoints: [
        "Program 6.14: `Dev_trap` using `__shared__ float shared_vals[WARPSZ]` and `Shared_mem_sum(shared_vals)`.",
        "Single-warp Block Simplicity: Within a single warp, warp-synchronous execution eliminates inter-warp coordination overhead.",
        "Textbook Table 6.8 Performance: On Nvidia Titan X, Trap I (atomic) took 3.08 ms, whereas Trap II (32 threads/block) took 0.206 ms (15x speedup!)."
      ]
    },

    "6.13": {
      title: "CUDA Trapezoidal Rule III: Blocks with More Than One Warp",
      textbookRef: "Pages 331-338",
      summary: "While 32 threads/block works, modern GPUs achieve maximum occupancy when thread blocks contain 128, 256, 512, or 1024 threads (multiple warps). Trap III implements a Hierarchical Two-Tier Reduction: Tier 1 reduces within each warp in parallel; Tier 2 reduces across warps within the block. Inter-warp communication requires careful shared memory layout and `__syncthreads()` to avoid race conditions and bank conflicts.",
      keyPoints: [
        "Hierarchical Reduction Steps:",
        "1. Every thread computes its trapezoid and stores it in `shared_vals[my_lane]` inside `thread_calcs`.",
        "2. Intra-warp reduction: Each warp calculates its partial sum (`Shared_mem_sum` or `__shfl_down_sync`).",
        "3. Warp leader (`my_lane == 0`) writes warp sum into a separate shared array: `warp_sum_arr[my_warp] = my_result`.",
        "4. `__syncthreads()` barrier: Ensures all warps have finished before warp 0 reads `warp_sum_arr`.",
        "5. Inter-warp reduction: Warp 0 sums `warp_sum_arr`.",
        "6. Final update: Block thread 0 calls `atomicAdd(trap_p, blk_result)`.",
        "Shared Memory Bank Conflicts (Table 6.9): Storing warp sums at `thread_calcs[0, 32, 64, ...]` would cause all writes to hit Bank 0 (32-way bank conflict). Using a contiguous array `warp_sum_arr[my_warp]` spreads writes across banks 0 through 31, achieving conflict-free concurrent access!",
        "Textbook Table 6.10 Performance: Titan X executes Trap III in 0.141 ms (Warp Shuffle) and 0.150 ms (Shared Memory), a 22x speedup over Trap I!"
      ],
      table6_10: [
        { version: "Original (Trap I Atomic)", gk20a: "20.7 ms", titanX: "3.08 ms", relativeSpeedup: "1.0x (Baseline)" },
        { version: "Trap II (Shared Mem, 32 ths/blk)", gk20a: "15.0 ms", titanX: "0.206 ms", relativeSpeedup: "15.0x" },
        { version: "Trap II (Warp Shuffle, 32 ths/blk)", gk20a: "14.4 ms", titanX: "0.210 ms", relativeSpeedup: "14.7x" },
        { version: "Trap III (Shared Mem, 1024 ths/blk)", gk20a: "14.3 ms", titanX: "0.150 ms", relativeSpeedup: "20.5x" },
        { version: "Trap III (Warp Shuffle, 1024 ths/blk)", gk20a: "12.8 ms", titanX: "0.141 ms", relativeSpeedup: "21.8x" }
      ],
      codeSnippet: `// Program 6.15: CUDA Trap III Kernel (Hierarchical Reduction)
__global__ void Dev_trap(const float a, const float b, const float h, const int n, float* trap_p) {
    __shared__ float thread_calcs[MAX_BLKSZ];
    __shared__ float warp_sum_arr[WARPSZ];
    int my_i = blockDim.x * blockIdx.x + threadIdx.x;
    int my_warp = threadIdx.x / warpSize;
    int my_lane = threadIdx.x % warpSize;
    float* shared_vals = thread_calcs + my_warp * warpSize;
    float blk_result = 0.0;

    shared_vals[my_lane] = 0.0f;
    if (0 < my_i && my_i < n) {
        float my_x = a + my_i * h;
        shared_vals[my_lane] = f(my_x);
    }

    // Step 1: Intra-warp sum
    float my_result = Shared_mem_sum(shared_vals);
    if (my_lane == 0) warp_sum_arr[my_warp] = my_result;
    __syncthreads(); // Inter-warp barrier!

    // Step 2: Inter-warp sum by Warp 0
    if (my_warp == 0) {
        if (threadIdx.x >= blockDim.x / warpSize)
            warp_sum_arr[threadIdx.x] = 0.0f;
        blk_result = Shared_mem_sum(warp_sum_arr);
        if (threadIdx.x == 0) atomicAdd(trap_p, blk_result);
    }
}`
    },

    "6.14": {
      title: "Bitonic Sort Preview",
      textbookRef: "Pages 339-350",
      summary: "Bitonic sort is a comparison-based sorting algorithm with a fixed butterfly communication structure, making it ideal for parallel hardware like GPUs where thread branching overhead is costly. A bitonic sequence first monotonically increases, then decreases. The butterfly stages compare and swap elements at power-of-two strides. In CUDA, threads perform compare-and-swap with zero branch divergence when carefully mapped to butterfly stages.",
      keyPoints: [
        "Bitonic Sequence: A sequence where elements first increase, then decrease (or can be circularly shifted to satisfy this).",
        "Butterfly Network: Fixed data paths where pair comparisons occur without runtime data-dependent branch divergence.",
        "CUDA Advantage: Fixed communication patterns map cleanly to warps and shared memory."
      ]
    }
  },

  examPrep: {
    longQuestions: [
      {
        id: "q1",
        marks: 10,
        question: "Explain GPU architecture and contrast Flynn's SISD, SIMD, and Nvidia's SIMT execution models. Describe the organization of Streaming Multiprocessors (SMs) and Streaming Processors (SPs).",
        answer: `1. Flynn's Taxonomy & Execution Models:
- SISD (Single Instruction, Single Data): Conventional uniprocessor CPU executing one instruction stream on a single scalar data item.
- SIMD (Single Instruction, Multiple Data): A single control unit broadcasts instructions to multiple datapaths. All datapaths execute the same instruction on different data or remain idle.
- SIMT (Single Instruction, Multiple Threads): Nvidia's execution model. The programmer writes thread-level code. Hardware groups 32 threads into a 'warp'. The warp scheduler issues instructions to active threads in lockstep. Unlike pure SIMD, SIMT threads have private registers and instruction pointers, allowing independent thread execution and latency hiding.

2. GPU Architecture Organization:
- Streaming Multiprocessors (SMs): Autonomous execution blocks containing warp schedulers, dispatch units, register files, and shared memory/L1 cache. SMs operate asynchronously.
- Streaming Processors (SPs / CUDA Cores): The arithmetic datapaths inside an SM that execute integer and floating-point operations.
- Warp Organization: 32 threads constitute a warp. All instructions are dispatched at warp granularity.
- Branch Divergence: When threads in a warp evaluate different branches of an if-else statement, the warp serializes both paths (Table 6.1 in textbook), causing an execution penalty.`
      },
      {
        id: "q2",
        marks: 10,
        question: "Explain the CUDA Thread Hierarchy (Threads, Blocks, Grids). Derive the coordinate mapping formulas for 1D arrays and 2D matrices. Explain why ceiling division is required for grid sizing.",
        answer: `1. Thread Hierarchy:
- Threads: The fundamental unit of execution; each thread has private registers.
- Thread Blocks: Groups of up to 1024 threads mapped to a single SM; threads within a block cooperate via shared memory and synchronize via __syncthreads().
- Grid: An array of thread blocks launched by a single kernel invocation.

2. Coordinate Mapping Formulas:
- 1D Global Index:
  int i = blockDim.x * blockIdx.x + threadIdx.x;
  Each block skips 'blockDim.x' elements per block rank, plus the local offset.
- 2D Matrix Coordinates:
  int col = blockDim.x * blockIdx.x + threadIdx.x;
  int row = blockDim.y * blockIdx.y + threadIdx.y;
  int linear_idx = row * width + col;

3. Ceiling Division for Grid Sizing:
When vector length n is not an integer multiple of block size B, integer division n / B truncates and omits elements. Ceiling division ensures sufficient threads:
  gridDim.x = (n + block_size - 1) / block_size;
Threads with i >= n must be guarded by a boundary check: if (i < n).`
      },
      {
        id: "q3",
        marks: 10,
        question: "Differentiate between Explicit Memory Management and Managed (Unified) Memory in CUDA. Provide code snippets illustrating both approaches for Vector Addition.",
        answer: `1. Comparison:
- Explicit Memory: Host explicitly allocates device memory using cudaMalloc(), copies input buffers across PCIe using cudaMemcpyHostToDevice, launches kernel, and copies results back using cudaMemcpyDeviceToHost. High developer control, maximum performance tuning.
- Managed (Unified) Memory: Allocates a single pointer with cudaMallocManaged() accessible by both CPU and GPU. Hardware automatically migrates memory pages over PCIe upon page faults (CC >= 6.0). Requires cudaDeviceSynchronize() before host accesses results.

2. Code Snippets:
[Explicit Memory]
float *hx, *dx;
hx = (float*)malloc(n * sizeof(float));
cudaMalloc(&dx, n * sizeof(float));
cudaMemcpy(dx, hx, n * sizeof(float), cudaMemcpyHostToDevice);
VecAdd<<<grid, block>>>(dx, ...);
cudaMemcpy(hx, dx, n * sizeof(float), cudaMemcpyDeviceToHost);
cudaFree(dx); free(hx);

[Managed Memory]
float *x;
cudaMallocManaged(&x, n * sizeof(float));
// Host initializes x
VecAdd<<<grid, block>>>(x, ...);
cudaDeviceSynchronize(); // Mandatory barrier
// Host reads x
cudaFree(x);`
      },
      {
        id: "q4",
        marks: 10,
        question: "Explain the implementation of CUDA Trapezoidal Rule I. Why does race condition occur, how does atomicAdd() resolve it, and explain why Trapezoidal Rule I suffers from poor performance.",
        answer: `1. Trapezoidal Rule I Implementation:
The definite integral is approximated by dividing [a, b] into n subintervals of width h = (b-a)/n. Each thread calculates one trapezoid: my_trap = f(a + i*h).
Threads accumulate results into a single global accumulator *trap_p.

2. Race Condition:
If threads execute *trap_p += my_trap concurrently, a Read-After-Write conflict occurs:
Thread A reads *trap_p, Thread B reads *trap_p, Thread A writes back, Thread B writes back overwriting Thread A's contribution. Result is mathematically corrupted.

3. atomicAdd() Solution:
atomicAdd(trap_p, my_trap) serializes additions at the hardware memory controller, guaranteeing mutual exclusion.

4. Performance Bottleneck:
When 1,000,000 threads execute atomicAdd on the same memory location, all 1,000,000 additions are executed sequentially. The memory bus and ALU stall waiting in queue. As shown in Pacheco Table 6.5, Trap I on Tegra K1 is slower (33.6 ms) than serial CPU code (20.7 ms)!`
      },
      {
        id: "q5",
        marks: 10,
        question: "Explain CUDA Trapezoidal Rule II with Shared Memory and Tree-Structured Reduction. Explain the purpose of __syncthreads() and describe Shared Memory Bank Conflicts.",
        answer: `1. Trapezoidal Rule II Architecture:
Instead of all threads executing atomicAdd globally, threads in each block store values into fast on-chip shared memory (__shared__ float sdata[]). Threads perform a tree-structured reduction within the block in O(log2 N) steps. Finally, only Thread 0 of each block executes atomicAdd on the global accumulator. This reduces global atomic operations by a factor of blockDim.x (e.g. 1024x fewer atomics!).

2. Purpose of __syncthreads():
__syncthreads() is an intra-block barrier. It guarantees that all threads in the block have reached the barrier and all shared memory writes are visible before any thread proceeds. Without __syncthreads(), faster threads would read uninitialized or stale shared memory values during tree reduction.

3. Shared Memory Bank Conflicts:
Shared memory is divided into 32 banks (4-byte words). If threads in a warp access different words belonging to the same bank, accesses are serialized (e.g. 32-way serialization). Stride-halving reduction avoids bank conflicts by ensuring active threads access distinct banks concurrently.`
      },
      {
        id: "q6",
        marks: 10,
        question: "Explain CUDA Trapezoidal Rule III for thread blocks with more than one warp. Contrast Warp Shuffles (__shfl_down_sync) with Shared Memory Reduction, and explain the hierarchical two-tier reduction.",
        answer: `1. Hierarchical Two-Tier Reduction (Trap III):
Modern GPUs require 128 to 1024 threads per block for high occupancy.
- Tier 1 (Intra-Warp Reduction): Each 32-thread warp performs reduction in parallel (using __shfl_down_sync or shared memory).
- Tier 2 (Inter-Warp Reduction): Warp leaders (lane 0) write their warp sum into a shared array warp_sum_arr[my_warp]. A __syncthreads() barrier synchronizes warps. Then Warp 0 reduces warp_sum_arr. Block Thread 0 performs 1 atomicAdd to the global sum.

2. Warp Shuffles (__shfl_down_sync):
Introduced in Kepler (CC 3.0). Allows threads within a warp to read registers from other threads directly:
  val += __shfl_down_sync(0xffffffff, val, offset);
Advantages:
- Does not use shared memory.
- Does not require __syncthreads() (warp-synchronous).
- Operates at register speed.

3. Performance Comparison (Table 6.10):
On Titan X, Trap I took 3.08 ms, Trap II took 0.206 ms, and Trap III with Warp Shuffle took 0.141 ms (22x faster than Trap I).`
      }
    ],

    quizQuestions: [
      {
        id: 1,
        question: "In Flynn's taxonomy, modern GPU execution via CUDA is classified as:",
        options: ["SISD", "MIMD", "SIMT (Single Instruction, Multiple Threads)", "MISD"],
        answer: 2,
        explanation: "NVIDIA GPUs use the SIMT (Single Instruction, Multiple Threads) model, an evolution of SIMD where threads execute in 32-thread warps with private registers."
      },
      {
        id: 2,
        question: "What is the size of a CUDA warp across all NVIDIA GPU architectures?",
        options: ["16 threads", "32 threads", "64 threads", "128 threads"],
        answer: 1,
        explanation: "A warp is strictly 32 threads across all NVIDIA compute capabilities from Fermi (2.0) to Hopper/Blackwell."
      },
      {
        id: 3,
        question: "What happens when threads within a single warp encounter an if-else branch where half the threads take 'if' and half take 'else'?",
        options: [
          "The threads execute both branches simultaneously on different cores",
          "Branch divergence occurs; the warp executes both branches serially, masking idle threads",
          "The kernel crashes with a hardware exception",
          "The CPU executes the divergent branch"
        ],
        answer: 1,
        explanation: "Branch divergence forces the warp to serialize both paths: threads taking 'if' run while 'else' threads are masked, then vice versa. Total execution time is the sum of both paths."
      },
      {
        id: 4,
        question: "Which formula correctly computes the 1D global thread index in a CUDA grid?",
        options: [
          "threadIdx.x + blockIdx.x",
          "blockDim.x * blockIdx.x + threadIdx.x",
          "gridDim.x * threadIdx.x + blockIdx.x",
          "blockIdx.x * threadIdx.x"
        ],
        answer: 1,
        explanation: "The global thread index is blockDim.x * blockIdx.x + threadIdx.x."
      },
      {
        id: 5,
        question: "Why do CUDA kernel functions declared with __global__ always have a return type of void?",
        options: [
          "Because C++ does not allow return types in templates",
          "Because kernels execute asynchronously across thousands of threads, making a single scalar return value nonsensical",
          "Because GPU hardware has no registers for return values",
          "Because memory can only be written by the host"
        ],
        answer: 1,
        explanation: "Kernels launch thousands of threads simultaneously. Returning a single scalar from thousands of threads has no coherent meaning; results are returned via memory pointers."
      },
      {
        id: 6,
        question: "In CUDA Trapezoidal Rule I, what is the primary cause of poor performance?",
        options: [
          "Too few threads launched",
          "Extreme memory contention caused by every thread calling atomicAdd on the exact same memory address",
          "Floating point rounding errors in f(x)",
          "PCIe bus bandwidth limits"
        ],
        answer: 1,
        explanation: "Having thousands of threads execute atomicAdd on a single global accumulator creates a severe serialization bottleneck at the memory controller."
      },
      {
        id: 7,
        question: "Why is __syncthreads() required between iterations of a tree reduction in shared memory?",
        options: [
          "To flush global memory to the host",
          "To prevent Read-After-Write hazards where faster threads read shared memory before slower threads finish writing",
          "To reboot the warp scheduler",
          "To allocate new registers"
        ],
        answer: 1,
        explanation: "__syncthreads() acts as an intra-block barrier, ensuring all shared memory writes from the current iteration are visible before any thread reads them in the next iteration."
      },
      {
        id: 8,
        question: "How many memory banks exist in modern NVIDIA GPU shared memory?",
        options: ["8 banks", "16 banks", "32 banks", "64 banks"],
        answer: 2,
        explanation: "NVIDIA shared memory is structured into 32 banks (4-byte words each), matching the 32 threads in a warp for single-cycle conflict-free parallel access."
      },
      {
        id: 9,
        question: "What is the main advantage of the __shfl_down_sync() warp primitive over shared memory reduction?",
        options: [
          "It can exchange data between different thread blocks",
          "It exchanges data directly between thread registers without using shared memory or requiring __syncthreads()",
          "It eliminates the need for CUDA cores",
          "It runs on the CPU host"
        ],
        answer: 1,
        explanation: "Warp shuffles exchange data directly register-to-register inside a warp in a single instruction cycle, avoiding shared memory allocations and barrier synchronization."
      },
      {
        id: 10,
        question: "What is the maximum number of threads allowed per thread block on NVIDIA GPUs with Compute Capability >= 2.0?",
        options: ["256", "512", "1024", "2048"],
        answer: 2,
        explanation: "Since Compute Capability 2.0 (Fermi), the maximum number of threads per block is 1024."
      }
    ]
  }
};
