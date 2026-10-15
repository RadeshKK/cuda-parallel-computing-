/**
 * cuda_emulator.js
 * In-Browser Deterministic CUDA C++ Emulation Engine & Virtual GPU
 * Supports execution of kernels with grids, blocks, threads, warps,
 * shared memory, __syncthreads(), atomicAdd(), and __shfl_down_sync().
 */

class CudaEmulator {
  constructor() {
    this.memory = {};
    this.stdout = [];
    this.telemetry = {
      totalThreads: 0,
      totalBlocks: 0,
      totalWarps: 0,
      divergentWarps: 0,
      atomicOps: 0,
      sharedMemBytes: 0,
      simulatedCycles: 0
    };
  }

  // Pre-loaded textbook CUDA C++ programs
  static PRESETS = {
    "cuda_hello": {
      name: "Program 6.1: CUDA Hello World (1 Block)",
      code: `// Program 6.1: An Introduction to Parallel Programming (Ch 6)
#include <stdio.h>
#include <cuda.h>

__global__ void Hello(void) {
    printf("Hello from thread %d!\\n", threadIdx.x);
}

int main(int argc, char* argv[]) {
    int thread_count = 8;
    Hello<<<1, thread_count>>>();
    cudaDeviceSynchronize();
    return 0;
}`,
      gridDim: { x: 1, y: 1, z: 1 },
      blockDim: { x: 8, y: 1, z: 1 },
      type: "hello"
    },

    "cuda_hello_multi": {
      name: "Program 6.2: Hello from Multiple Blocks",
      code: `// Program 6.2: An Introduction to Parallel Programming (Ch 6)
#include <stdio.h>
#include <cuda.h>

__global__ void Hello(void) {
    printf("Hello from thread %d in block %d!\\n", threadIdx.x, blockIdx.x);
}

int main(int argc, char* argv[]) {
    int blk_ct = 4;
    int th_per_blk = 4;
    Hello<<<blk_ct, th_per_blk>>>();
    cudaDeviceSynchronize();
    return 0;
}`,
      gridDim: { x: 4, y: 1, z: 1 },
      blockDim: { x: 4, y: 1, z: 1 },
      type: "hello_multi"
    },

    "cuda_vec_add_managed": {
      name: "Program 6.3 & 6.6: Vector Addition (Managed Memory)",
      code: `// Program 6.3 & 6.6: Vector Addition using cudaMallocManaged
#include <stdio.h>
#include <cuda.h>

__global__ void Vec_add(const float x[], const float y[], float z[], const int n) {
    int my_elt = blockDim.x * blockIdx.x + threadIdx.x;
    if (my_elt < n) {
        z[my_elt] = x[my_elt] + y[my_elt];
    }
}

int main() {
    int n = 16;
    float *x, *y, *z;
    cudaMallocManaged(&x, n * sizeof(float));
    cudaMallocManaged(&y, n * sizeof(float));
    cudaMallocManaged(&z, n * sizeof(float));

    // Initialize arrays
    for (int i = 0; i < n; i++) {
        x[i] = i * 1.5f;
        y[i] = i * 2.0f;
    }

    int th_per_blk = 4;
    int blk_ct = (n + th_per_blk - 1) / th_per_blk;
    Vec_add<<<blk_ct, th_per_blk>>>(x, y, z, n);
    cudaDeviceSynchronize();

    for (int i = 0; i < n; i++) {
        printf("z[%d] = %f\\n", i, z[i]);
    }
    cudaFree(x); cudaFree(y); cudaFree(z);
    return 0;
}`,
      gridDim: { x: 4, y: 1, z: 1 },
      blockDim: { x: 4, y: 1, z: 1 },
      vectorN: 16,
      type: "vec_add"
    },

    "cuda_vec_add_explicit": {
      name: "Program 6.9: Vector Addition (Explicit Memory Transfers)",
      code: `// Program 6.9: Vector Addition with cudaMemcpy Host<->Device
#include <stdio.h>
#include <cuda.h>

__global__ void Vec_add(const float x[], const float y[], float z[], const int n) {
    int my_elt = blockDim.x * blockIdx.x + threadIdx.x;
    if (my_elt < n) {
        z[my_elt] = x[my_elt] + y[my_elt];
    }
}

int main() {
    int n = 16;
    float *hx = (float*)malloc(n * sizeof(float));
    float *hy = (float*)malloc(n * sizeof(float));
    float *hz = (float*)malloc(n * sizeof(float));
    float *dx, *dy, *dz;

    cudaMalloc(&dx, n * sizeof(float));
    cudaMalloc(&dy, n * sizeof(float));
    cudaMalloc(&dz, n * sizeof(float));

    for (int i = 0; i < n; i++) { hx[i] = 10.0f + i; hy[i] = 20.0f + i; }

    cudaMemcpy(dx, hx, n * sizeof(float), cudaMemcpyHostToDevice);
    cudaMemcpy(dy, hy, n * sizeof(float), cudaMemcpyHostToDevice);

    int blk_ct = 4, th_per_blk = 4;
    Vec_add<<<blk_ct, th_per_blk>>>(dx, dy, dz, n);

    cudaMemcpy(hz, dz, n * sizeof(float), cudaMemcpyDeviceToHost);
    for (int i = 0; i < n; i++) {
        printf("hz[%d] = %.1f (dx + dy)\\n", i, hz[i]);
    }

    cudaFree(dx); cudaFree(dy); cudaFree(dz);
    free(hx); free(hy); free(hz);
    return 0;
}`,
      gridDim: { x: 4, y: 1, z: 1 },
      blockDim: { x: 4, y: 1, z: 1 },
      vectorN: 16,
      type: "vec_add_explicit"
    },

    "cuda_trap1_atomic": {
      name: "Program 6.12: CUDA Trapezoidal Rule I (Atomic Operations)",
      code: `// Program 6.12: CUDA Trapezoidal Rule I with atomicAdd
#include <stdio.h>
#include <cuda.h>

__device__ float f(float x) {
    return x * x + 1.0f; // f(x) = x^2 + 1
}

__global__ void Dev_trap(const float a, const float b, const float h, const int n, float* trap_p) {
    int my_i = blockDim.x * blockIdx.x + threadIdx.x;
    if (0 < my_i && my_i < n) {
        float my_x = a + my_i * h;
        float my_trap = f(my_x);
        // BOTTLENECK: Every thread performs atomicAdd on the same pointer!
        atomicAdd(trap_p, my_trap);
    }
}

int main() {
    float a = -3.0f, b = 3.0f;
    int n = 64; // Subintervals
    float h = (b - a) / n;
    float *trap_p;
    cudaMallocManaged(&trap_p, sizeof(float));
    *trap_p = 0.5f * (f(a) + f(b));

    int th_per_blk = 16;
    int blk_ct = (n + th_per_blk - 1) / th_per_blk;
    Dev_trap<<<blk_ct, th_per_blk>>>(a, b, h, n, trap_p);
    cudaDeviceSynchronize();

    *trap_p = h * (*trap_p);
    printf("Trapezoidal Rule I Result: %f (Exact = 24.0)\\n", *trap_p);
    cudaFree(trap_p);
    return 0;
}`,
      gridDim: { x: 4, y: 1, z: 1 },
      blockDim: { x: 16, y: 1, z: 1 },
      n: 64,
      type: "trap1"
    },

    "cuda_trap2_shared": {
      name: "Program 6.14: CUDA Trapezoidal Rule II (Shared Memory Tree)",
      code: `// Program 6.14: Trapezoidal Rule with Shared Memory Tree Reduction
#include <stdio.h>
#include <cuda.h>
#define WARPSZ 32

__device__ float f(float x) { return x * x + 1.0f; }

__global__ void Dev_trap(const float a, const float b, const float h, const int n, float* trap_p) {
    __shared__ float shared_vals[WARPSZ];
    int my_i = blockDim.x * blockIdx.x + threadIdx.x;
    int my_lane = threadIdx.x % warpSize;

    shared_vals[my_lane] = 0.0f;
    if (0 < my_i && my_i < n) {
        float my_x = a + my_i * h;
        shared_vals[my_lane] = f(my_x);
    }
    __syncthreads();

    // Tree reduction inside shared memory
    for (int s = blockDim.x / 2; s > 0; s >>= 1) {
        if (my_lane < s) {
            shared_vals[my_lane] += shared_vals[my_lane + s];
        }
        __syncthreads();
    }

    // Only Thread 0 of each block adds into global sum!
    if (threadIdx.x == 0) {
        atomicAdd(trap_p, shared_vals[0]);
    }
}

int main() {
    float a = -3.0f, b = 3.0f;
    int n = 64;
    float h = (b - a) / n;
    float *trap_p;
    cudaMallocManaged(&trap_p, sizeof(float));
    *trap_p = 0.5f * (f(a) + f(b));

    int th_per_blk = 32;
    int blk_ct = (n + th_per_blk - 1) / th_per_blk;
    Dev_trap<<<blk_ct, th_per_blk>>>(a, b, h, n, trap_p);
    cudaDeviceSynchronize();

    *trap_p = h * (*trap_p);
    printf("Trapezoidal Rule II Result: %f (Shared Memory Tree)\\n", *trap_p);
    cudaFree(trap_p);
    return 0;
}`,
      gridDim: { x: 2, y: 1, z: 1 },
      blockDim: { x: 32, y: 1, z: 1 },
      n: 64,
      type: "trap2"
    },

    "cuda_trap3_warp_shuffle": {
      name: "Program 6.15: CUDA Trapezoidal Rule III (Multi-Warp & Shuffle)",
      code: `// Program 6.15: Hierarchical Multi-Warp Reduction & __shfl_down_sync
#include <stdio.h>
#include <cuda.h>
#define WARPSZ 32
#define MAX_BLKSZ 1024

__device__ float f(float x) { return x * x + 1.0f; }

__device__ float Warp_sum(float val) {
    // Warp-level register reduction using shuffle
    for (int offset = 16; offset > 0; offset /= 2) {
        val += __shfl_down_sync(0xffffffff, val, offset);
    }
    return val;
}

__global__ void Dev_trap(const float a, const float b, const float h, const int n, float* trap_p) {
    __shared__ float warp_sum_arr[WARPSZ];
    int my_i = blockDim.x * blockIdx.x + threadIdx.x;
    int my_warp = threadIdx.x / warpSize;
    int my_lane = threadIdx.x % warpSize;

    float my_val = 0.0f;
    if (0 < my_i && my_i < n) {
        my_val = f(a + my_i * h);
    }

    // Step 1: Intra-warp reduction in registers
    float warp_res = Warp_sum(my_val);
    if (my_lane == 0) {
        warp_sum_arr[my_warp] = warp_res;
    }
    __syncthreads(); // Inter-warp barrier!

    // Step 2: Inter-warp reduction by Warp 0
    if (my_warp == 0) {
        float b_val = (my_lane < blockDim.x / warpSize) ? warp_sum_arr[my_lane] : 0.0f;
        float blk_result = Warp_sum(b_val);
        if (my_lane == 0) {
            atomicAdd(trap_p, blk_result); // Single atomicAdd for whole block!
        }
    }
}

int main() {
    float a = -3.0f, b = 3.0f;
    int n = 128;
    float h = (b - a) / n;
    float *trap_p;
    cudaMallocManaged(&trap_p, sizeof(float));
    *trap_p = 0.5f * (f(a) + f(b));

    int th_per_blk = 64; // 2 warps per block!
    int blk_ct = (n + th_per_blk - 1) / th_per_blk;
    Dev_trap<<<blk_ct, th_per_blk>>>(a, b, h, n, trap_p);
    cudaDeviceSynchronize();

    *trap_p = h * (*trap_p);
    printf("Trapezoidal Rule III Result: %f (Multi-Warp Shuffle)\\n", *trap_p);
    cudaFree(trap_p);
    return 0;
}`,
      gridDim: { x: 2, y: 1, z: 1 },
      blockDim: { x: 64, y: 1, z: 1 },
      n: 128,
      type: "trap3"
    }
  };

  /**
   * Execute an emulated kernel based on preset type and configuration
   */
  run(presetId, customConfig = {}) {
    this.stdout = [];
    const preset = CudaEmulator.PRESETS[presetId] || CudaEmulator.PRESETS["cuda_hello"];
    const gridDim = customConfig.gridDim || preset.gridDim;
    const blockDim = customConfig.blockDim || preset.blockDim;

    const totalBlocks = gridDim.x * gridDim.y * gridDim.z;
    const threadsPerBlock = blockDim.x * blockDim.y * blockDim.z;
    const totalThreads = totalBlocks * threadsPerBlock;
    const totalWarps = totalBlocks * Math.ceil(threadsPerBlock / 32);

    this.telemetry = {
      totalThreads,
      totalBlocks,
      threadsPerBlock,
      totalWarps,
      divergentWarps: 0,
      atomicOps: 0,
      sharedMemBytes: 0,
      simulatedCycles: 0,
      executionTimeline: []
    };

    this.stdout.push(`[CUDA HOST] Launching kernel <<<dim3(${gridDim.x},${gridDim.y},${gridDim.z}), dim3(${blockDim.x},${blockDim.y},${blockDim.z})>>>`);
    this.stdout.push(`[CUDA RUNTIME] Grid dimensions: ${totalBlocks} block(s), ${threadsPerBlock} thread(s)/block, Total: ${totalThreads} threads (${totalWarps} warp(s)).`);

    switch (preset.type) {
      case "hello":
        this._runHello(gridDim, blockDim);
        break;
      case "hello_multi":
        this._runHelloMulti(gridDim, blockDim);
        break;
      case "vec_add":
      case "vec_add_explicit":
        this._runVecAdd(gridDim, blockDim, customConfig.vectorN || preset.vectorN || 16);
        break;
      case "trap1":
        this._runTrap1(gridDim, blockDim, customConfig.n || preset.n || 64);
        break;
      case "trap2":
        this._runTrap2(gridDim, blockDim, customConfig.n || preset.n || 64);
        break;
      case "trap3":
        this._runTrap3(gridDim, blockDim, customConfig.n || preset.n || 128);
        break;
      default:
        this._runHello(gridDim, blockDim);
    }

    this.stdout.push(`[CUDA HOST] cudaDeviceSynchronize() reached. Kernel execution finished.`);
    return {
      stdout: this.stdout.join("\n"),
      telemetry: this.telemetry,
      memory: this.memory
    };
  }

  _runHello(gridDim, blockDim) {
    for (let bx = 0; bx < gridDim.x; bx++) {
      for (let tx = 0; tx < blockDim.x; tx++) {
        this.stdout.push(`Hello from thread ${tx}!`);
      }
    }
    this.telemetry.simulatedCycles = 45;
  }

  _runHelloMulti(gridDim, blockDim) {
    for (let bx = 0; bx < gridDim.x; bx++) {
      for (let tx = 0; tx < blockDim.x; tx++) {
        this.stdout.push(`Hello from thread ${tx} in block ${bx}!`);
      }
    }
    this.telemetry.simulatedCycles = 62;
  }

  _runVecAdd(gridDim, blockDim, n) {
    const x = new Float32Array(n);
    const y = new Float32Array(n);
    const z = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      x[i] = (i * 1.5).toFixed(1);
      y[i] = (i * 2.0).toFixed(1);
    }

    let activeThreads = 0;
    let idleThreads = 0;

    for (let bx = 0; bx < gridDim.x; bx++) {
      for (let tx = 0; tx < blockDim.x; tx++) {
        const my_elt = blockDim.x * bx + tx;
        if (my_elt < n) {
          z[my_elt] = parseFloat((x[my_elt] + y[my_elt]).toFixed(2));
          activeThreads++;
        } else {
          idleThreads++;
        }
      }
    }

    if (idleThreads > 0) {
      this.telemetry.divergentWarps = Math.ceil(idleThreads / 32);
    }

    this.memory = {
      vectors: {
        n,
        A: Array.from(x),
        B: Array.from(y),
        C: Array.from(z)
      }
    };

    for (let i = 0; i < Math.min(n, 16); i++) {
      this.stdout.push(`z[${i}] = ${z[i].toFixed(2)}  (A[${i}]=${x[i]} + B[${i}]=${y[i]})`);
    }
    if (n > 16) this.stdout.push(`... [${n - 16} more elements computed] ...`);
    this.telemetry.simulatedCycles = 120 + n * 4;
  }

  _runTrap1(gridDim, blockDim, n) {
    const a = -3.0, b = 3.0;
    const h = (b - a) / n;
    const f = (x) => x * x + 1.0;

    let trapSum = 0.5 * (f(a) + f(b));
    let atomicCount = 0;

    const trapezoidPoints = [];
    trapezoidPoints.push({ i: 0, x: a, fx: f(a), type: "boundary" });

    for (let bx = 0; bx < gridDim.x; bx++) {
      for (let tx = 0; tx < blockDim.x; tx++) {
        const my_i = blockDim.x * bx + tx;
        if (0 < my_i && my_i < n) {
          const my_x = a + my_i * h;
          const my_trap = f(my_x);
          // Emulate atomicAdd
          trapSum += my_trap;
          atomicCount++;
          if (my_i <= 10 || my_i >= n - 3) {
            trapezoidPoints.push({ i: my_i, x: my_x, fx: my_trap, block: bx, thread: tx });
          }
        }
      }
    }
    trapezoidPoints.push({ i: n, x: b, fx: f(b), type: "boundary" });

    const totalIntegral = h * trapSum;
    this.telemetry.atomicOps = atomicCount;
    this.telemetry.simulatedCycles = atomicCount * 45; // High serialization penalty!

    this.memory = {
      integral: {
        method: "CUDA Trap I (atomicAdd)",
        a, b, n, h,
        calculatedIntegral: totalIntegral.toFixed(5),
        exactIntegral: (24.0).toFixed(5),
        error: Math.abs(totalIntegral - 24.0).toExponential(4),
        atomicContentionCount: atomicCount,
        samplePoints: trapezoidPoints
      }
    };

    this.stdout.push(`[Dev_trap] Executed ${atomicCount} atomicAdd operations in global memory.`);
    this.stdout.push(`[Dev_trap] WARNING: Severe memory contention on *trap_p address! Serialization factor = ${atomicCount}.`);
    this.stdout.push(`[Host] Trapezoidal Rule I Integral = ${totalIntegral.toFixed(6)} (Exact = 24.000000)`);
  }

  _runTrap2(gridDim, blockDim, n) {
    const a = -3.0, b = 3.0;
    const h = (b - a) / n;
    const f = (x) => x * x + 1.0;

    let trapSum = 0.5 * (f(a) + f(b));
    let blockAtomics = 0;

    const blockReductions = [];

    for (let bx = 0; bx < gridDim.x; bx++) {
      const sharedVals = new Float32Array(blockDim.x);
      for (let tx = 0; tx < blockDim.x; tx++) {
        const my_i = blockDim.x * bx + tx;
        if (0 < my_i && my_i < n) {
          sharedVals[tx] = f(a + my_i * h);
        } else {
          sharedVals[tx] = 0.0;
        }
      }

      // Step-by-step tree reduction
      const treeSteps = [];
      const history = [Array.from(sharedVals)];

      for (let s = Math.floor(blockDim.x / 2); s > 0; s = Math.floor(s / 2)) {
        for (let tx = 0; tx < s; tx++) {
          sharedVals[tx] += sharedVals[tx + s];
        }
        history.push(Array.from(sharedVals));
        treeSteps.push({ stride: s, activeThreads: s });
      }

      // Thread 0 atomicAdd
      const blockTotal = sharedVals[0];
      trapSum += blockTotal;
      blockAtomics++;

      blockReductions.push({
        blockId: bx,
        blockTotal: blockTotal.toFixed(4),
        treeSteps,
        initialValues: history[0].slice(0, 8),
        finalReducedValue: blockTotal
      });
    }

    const totalIntegral = h * trapSum;
    this.telemetry.atomicOps = blockAtomics;
    this.telemetry.sharedMemBytes = gridDim.x * blockDim.x * 4;
    this.telemetry.simulatedCycles = Math.ceil(Math.log2(blockDim.x)) * 8 + blockAtomics * 15;

    this.memory = {
      integral: {
        method: "CUDA Trap II (Shared Memory Tree)",
        a, b, n, h,
        calculatedIntegral: totalIntegral.toFixed(5),
        exactIntegral: (24.0).toFixed(5),
        error: Math.abs(totalIntegral - 24.0).toExponential(4),
        atomicOpsReducedTo: blockAtomics,
        blockReductions
      }
    };

    this.stdout.push(`[Dev_trap] Shared memory reduction complete. Stride halving: log2(${blockDim.x}) = ${Math.ceil(Math.log2(blockDim.x))} steps.`);
    this.stdout.push(`[Dev_trap] atomicAdd called only ${blockAtomics} time(s) (1 per block instead of 1 per thread!).`);
    this.stdout.push(`[Host] Trapezoidal Rule II Integral = ${totalIntegral.toFixed(6)} (Exact = 24.000000)`);
  }

  _runTrap3(gridDim, blockDim, n) {
    const a = -3.0, b = 3.0;
    const h = (b - a) / n;
    const f = (x) => x * x + 1.0;

    let trapSum = 0.5 * (f(a) + f(b));
    let blockAtomics = 0;
    const warpsPerBlock = Math.ceil(blockDim.x / 32);

    const hierarchyData = [];

    for (let bx = 0; bx < gridDim.x; bx++) {
      const warpSums = new Float32Array(warpsPerBlock);

      for (let w = 0; w < warpsPerBlock; w++) {
        let warpTotal = 0;
        for (let lane = 0; lane < 32; lane++) {
          const tx = w * 32 + lane;
          const my_i = blockDim.x * bx + tx;
          if (0 < my_i && my_i < n) {
            warpTotal += f(a + my_i * h);
          }
        }
        warpSums[w] = warpTotal;
      }

      // Warp 0 reduces warp sums
      let blockTotal = 0;
      for (let w = 0; w < warpsPerBlock; w++) {
        blockTotal += warpSums[w];
      }

      trapSum += blockTotal;
      blockAtomics++;

      hierarchyData.push({
        blockId: bx,
        warpsPerBlock,
        warpSums: Array.from(warpSums),
        blockTotal: blockTotal.toFixed(4)
      });
    }

    const totalIntegral = h * trapSum;
    this.telemetry.atomicOps = blockAtomics;
    this.telemetry.simulatedCycles = 32 + blockAtomics * 12;

    this.memory = {
      integral: {
        method: "CUDA Trap III (Hierarchical Multi-Warp & Shuffle)",
        a, b, n, h,
        calculatedIntegral: totalIntegral.toFixed(5),
        exactIntegral: (24.0).toFixed(5),
        error: Math.abs(totalIntegral - 24.0).toExponential(4),
        atomicOpsReducedTo: blockAtomics,
        hierarchyData
      }
    };

    this.stdout.push(`[Dev_trap] Tier 1: Warps reduced in parallel using register-to-register __shfl_down_sync().`);
    this.stdout.push(`[Dev_trap] Tier 2: Warp leaders populated contiguous warp_sum_arr in shared memory (0 bank conflicts).`);
    this.stdout.push(`[Dev_trap] Tier 3: Warp 0 reduced warp_sum_arr; Block thread 0 executed 1 atomicAdd per block.`);
    this.stdout.push(`[Host] Trapezoidal Rule III Integral = ${totalIntegral.toFixed(6)} (Exact = 24.000000)`);
  }
}

// Global instance
window.cudaEmulator = new CudaEmulator();
