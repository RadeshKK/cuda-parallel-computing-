"""
generate_master_deck.py
Generates an ultra-clear, high-fidelity 24-slide widescreen PowerPoint presentation (.pptx)
Covering all Module 5 concepts (VTU BCS702 & Peter S. Pacheco Chapter 6).
Designed for instantaneous conceptual understanding ("seeing that only I should understand").
"""

import sys
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

# -----------------------------------------------------------------------------
# Color Palette Constants (High-Contrast Professional Dark Theme)
# -----------------------------------------------------------------------------
BG_DARK = RGBColor(11, 15, 25)        # #0B0F19 Dark Navy/Obsidian
CARD_BG = RGBColor(17, 24, 39)        # #111827 Dark Card Gray
CARD_BORDER = RGBColor(30, 41, 59)    # #1E293B Subtle Border
CYAN = RGBColor(56, 189, 248)         # #38BDF8 Electric Cyan
GREEN = RGBColor(16, 185, 129)        # #10B981 Emerald Green
RED = RGBColor(239, 68, 68)           # #EF4444 Crimson Hazard
AMBER = RGBColor(245, 158, 11)        # #F59E0B Warning Gold
PURPLE = RGBColor(168, 85, 247)       # #A855F7 Violet
WHITE = RGBColor(255, 255, 255)       # #FFFFFF Header White
SLATE_LIGHT = RGBColor(226, 232, 240) # #E2E8F0 Body Text
SLATE_MUTED = RGBColor(148, 163, 184) # #94A3B8 Dim/Secondary
CODE_BG = RGBColor(7, 11, 20)         # #070B14 Deep Code Black

FONT_MAIN = "Segoe UI"
FONT_MONO = "Consolas"

def create_deck():
    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Helper: Set slide background color
    def set_slide_background(slide, color=BG_DARK):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background() # No border
        return bg

    # Helper: Add Standard Header
    def add_header(slide, badge_text, title_text, subtitle_text):
        # Badge Pill
        badge_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.35))
        tf_b = badge_box.text_frame
        tf_b.word_wrap = True
        tf_b.margin_left = tf_b.margin_right = tf_b.margin_top = tf_b.margin_bottom = 0
        p_b = tf_b.paragraphs[0]
        p_b.text = badge_text.upper()
        p_b.font.name = FONT_MONO
        p_b.font.size = Pt(11)
        p_b.font.bold = True
        p_b.font.color.rgb = CYAN

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.7), Inches(0.6))
        tf_t = title_box.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = tf_t.margin_right = tf_t.margin_top = tf_t.margin_bottom = 0
        p_t = tf_t.paragraphs[0]
        p_t.text = title_text
        p_t.font.name = FONT_MAIN
        p_t.font.size = Pt(22)
        p_t.font.bold = True
        p_t.font.color.rgb = WHITE

        # Subtitle / Core Intuition
        sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.35), Inches(11.7), Inches(0.4))
        tf_s = sub_box.text_frame
        tf_s.word_wrap = True
        tf_s.margin_left = tf_s.margin_right = tf_s.margin_top = tf_s.margin_bottom = 0
        p_s = tf_s.paragraphs[0]
        p_s.text = subtitle_text
        p_s.font.name = FONT_MAIN
        p_s.font.size = Pt(13)
        p_s.font.color.rgb = SLATE_MUTED

    # Helper: Create Container Card
    def add_card(slide, left, top, width, height, border_color=CARD_BORDER, bg_color=CARD_BG):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1.5)
        return card

    # Helper: Bottom Alert / Exam Banner
    def add_alert(slide, text, alert_color=AMBER, label="EXAM & VIVA TIP"):
        left = Inches(0.8)
        top = Inches(6.5)
        width = Inches(11.733)
        height = Inches(0.65)
        
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = RGBColor(20, 27, 45)
        card.line.color.rgb = alert_color
        card.line.width = Pt(1.5)

        tb = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.1), width - Inches(0.4), height - Inches(0.2))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        r1 = p.add_run()
        r1.text = f"💡 {label}: "
        r1.font.bold = True
        r1.font.size = Pt(11)
        r1.font.name = FONT_MAIN
        r1.font.color.rgb = alert_color

        r2 = p.add_run()
        r2.text = text
        r2.font.size = Pt(11)
        r2.font.name = FONT_MAIN
        r2.font.color.rgb = SLATE_LIGHT

    # Helper: Code Box
    def add_code(slide, left, top, width, height, code_str, title="CUDA C++ SOURCE"):
        # Header strip
        hdr = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        hdr.fill.solid()
        hdr.fill.fore_color.rgb = CODE_BG
        hdr.line.color.rgb = CARD_BORDER
        hdr.line.width = Pt(1.2)

        tb = slide.shapes.add_textbox(left + Inches(0.15), top + Inches(0.1), width - Inches(0.3), height - Inches(0.2))
        tf = tb.text_frame
        tf.word_wrap = True
        
        # Title paragraph
        p_hdr = tf.paragraphs[0]
        p_hdr.text = f"// {title}"
        p_hdr.font.name = FONT_MONO
        p_hdr.font.size = Pt(9.5)
        p_hdr.font.bold = True
        p_hdr.font.color.rgb = CYAN

        # Code lines
        for line in code_str.strip().split("\n"):
            p = tf.add_paragraph()
            p.text = line
            p.font.name = FONT_MONO
            p.font.size = Pt(9.5)
            p.font.color.rgb = SLATE_LIGHT

    # Helper: Add Speaker Notes
    def add_notes(slide, notes_str):
        notes_slide = slide.notes_slide
        tf = notes_slide.notes_text_frame
        tf.text = notes_str

    print("Building 24 High-Fidelity Conceptual Slides...")

    # =========================================================================
    # SLIDE 1: TITLE SLIDE
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)
    
    # Title Hero Box
    tb1 = s1.shapes.add_textbox(Inches(1.2), Inches(1.8), Inches(11.0), Inches(4.0))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    
    p = tf1.paragraphs[0]
    p.text = "BCS702 // MODULE 5 MASTERCLASS"
    p.font.name = FONT_MONO
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = CYAN
    
    p = tf1.add_paragraph()
    p.text = "CUDA Parallel Programming"
    p.font.name = FONT_MAIN
    p.font.size = Pt(44)
    p.font.bold = True
    p.font.color.rgb = WHITE
    
    p = tf1.add_paragraph()
    p.text = "From Silicon Microarchitecture to Warp Shuffles & Peak Performance"
    p.font.name = FONT_MAIN
    p.font.size = Pt(20)
    p.font.color.rgb = GREEN

    p = tf1.add_paragraph()
    p.text = "Complete Conceptual Guide for Teaching, 2-Hour Sessions & 100% Exam Mastery\nReference: Peter S. Pacheco & Matthew Malensek, Chapter 6 (2nd Edition)"
    p.font.name = FONT_MAIN
    p.font.size = Pt(13)
    p.font.color.rgb = SLATE_MUTED
    
    # Stat pills
    add_card(s1, Inches(1.2), Inches(5.6), Inches(2.6), Inches(1.0), CYAN)
    tb = s1.shapes.add_textbox(Inches(1.3), Inches(5.7), Inches(2.4), Inches(0.8))
    tb.text_frame.word_wrap = True
    tb.text_frame.paragraphs[0].text = "20 KEY CONCEPTS\nFull Module 5 Coverage"
    tb.text_frame.paragraphs[0].font.size = Pt(11)
    tb.text_frame.paragraphs[0].font.color.rgb = CYAN

    add_card(s1, Inches(4.1), Inches(5.6), Inches(2.6), Inches(1.0), GREEN)
    tb = s1.shapes.add_textbox(Inches(4.2), Inches(5.7), Inches(2.4), Inches(0.8))
    tb.text_frame.word_wrap = True
    tb.text_frame.paragraphs[0].text = "7 TEXTBOOK CODES\nPrograms 6.1 through 6.15"
    tb.text_frame.paragraphs[0].font.size = Pt(11)
    tb.text_frame.paragraphs[0].font.color.rgb = GREEN

    add_card(s1, Inches(7.0), Inches(5.6), Inches(2.6), Inches(1.0), AMBER)
    tb = s1.shapes.add_textbox(Inches(7.1), Inches(5.7), Inches(2.4), Inches(0.8))
    tb.text_frame.word_wrap = True
    tb.text_frame.paragraphs[0].text = "4 TRAPS & BOTTLENECKS\nDivergence, Races, Bank, PCIe"
    tb.text_frame.paragraphs[0].font.size = Pt(11)
    tb.text_frame.paragraphs[0].font.color.rgb = AMBER

    add_card(s1, Inches(9.9), Inches(5.6), Inches(2.6), Inches(1.0), PURPLE)
    tb = s1.shapes.add_textbox(Inches(10.0), Inches(5.7), Inches(2.4), Inches(0.8))
    tb.text_frame.word_wrap = True
    tb.text_frame.paragraphs[0].text = "VTU QUESTION BANK\n10-Mark Model Answers"
    tb.text_frame.paragraphs[0].font.size = Pt(11)
    tb.text_frame.paragraphs[0].font.color.rgb = PURPLE

    add_notes(s1, "Welcome to the Module 5 Masterclass on CUDA Parallel Programming. This presentation covers every fundamental topic from Peter Pacheco Chapter 6 and the VTU BCS702 syllabus.")

    # =========================================================================
    # SLIDE 2: FLYNN'S TAXONOMY & THE SIMT BREAKTHROUGH
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "Concept 1 // Architecture Foundations", 
               "Flynn's Classical Taxonomy vs. NVIDIA's SIMT Paradigm", 
               "Core Insight: GPUs are not just vector SIMD engines—they are Single Instruction, Multiple Threads (SIMT).")

    # Left Card: Flynn's 4 Quadrants
    add_card(s2, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.3))
    tb = s2.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🏛️ FLYNN'S CLASSICAL TAXONOMY (1966)"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    items_flynn = [
        ("SISD (Single Instruction, Single Data):", "Classic sequential CPU core (Von Neumann). 1 instruction stream acts on 1 data stream."),
        ("SIMD (Single Instruction, Multiple Data):", "Vector processors (AVX-512, SSE). 1 vector instruction operates synchronously on rigid vector registers. Pipelined locks."),
        ("MISD (Multiple Instruction, Single Data):", "Rare redundant space/fault-tolerant avionics systems. Multiple units verify 1 stream."),
        ("MIMD (Multiple Instruction, Multiple Data):", "Multi-core CPUs & clusters. Independent cores run distinct program counters asynchronously.")
    ]
    for title, desc in items_flynn:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = title + " "; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    # Right Card: NVIDIA SIMT Breakthrough
    add_card(s2, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.3), border_color=GREEN)
    tb = s2.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "⚡ THE NVIDIA BREAKTHROUGH: SIMT (Single Instruction, Multiple Threads)"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = GREEN

    simt_points = [
        ("Instruction Broadcaster:", "A single hardware Warp Scheduler issues 1 instruction to 32 parallel physical execution pipelines simultaneously."),
        ("Independent Thread State:", "Unlike SIMD vector lanes, each CUDA thread maintains its OWN private register file, private stack, and unique thread index (`threadIdx.x`)."),
        ("Dynamic Branch Independence:", "Threads can diverge on conditional branches (`if-else`). Hardware masks inactive lanes, serializes divergent paths, and reconverges automatically."),
        ("Massive Latency Hiding:", "When a warp stalls waiting for memory (400 cycles), the SM immediately context-switches to another ready warp in ZERO overhead cycles!")
    ]
    for title, desc in simt_points:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = title + " "; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    add_alert(s2, "In VTU exams, clearly distinguish SIMD from SIMT: SIMD exposes vector register widths directly to the ISA; SIMT abstracts parallelism into scalar threads where hardware groups 32 threads into warps.")
    add_notes(s2, "Flynn's taxonomy categorized all computers into SISD, SIMD, MISD, and MIMD. NVIDIA invented SIMT as a hybrid: program written in scalar threads, hardware executed as lockstep 32-thread warps.")

    # =========================================================================
    # SLIDE 3: CPU VS GPU MICROARCHITECTURE
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "Concept 2 // Silicon Microarchitecture", 
               "CPU vs. GPU Hardware: Latency vs. Throughput Orientation", 
               "Core Insight: CPUs use silicon to minimize latency for 1 thread; GPUs use silicon to maximize aggregate compute for 10,000 threads.")

    # Left Card: CPU
    add_card(s3, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.3), border_color=CYAN)
    tb = s3.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🖥️ MULTI-CORE CPU (LATENCY-ORIENTED)"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    cpu_features = [
        ("Design Philosophy:", "Execute sequential code as fast as physically possible (~4.5 GHz clock speed)."),
        ("Silicon Allocation:", "~80% of die area is Cache (L1/L2/L3) and complex control logic; only ~20% is actual ALUs!"),
        ("Complex Hardware Units:", "Branch predictors, out-of-order superscalar execution engines, deep pipeline speculative dispatch."),
        ("Concurrency:", "Small number of heavy, powerful threads (4 to 64 hardware threads). High context-switch cost.")
    ]
    for title, desc in cpu_features:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = title + " "; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    # Right Card: GPU
    add_card(s3, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.3), border_color=GREEN)
    tb = s3.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "⚡ NVIDIA GPU (THROUGHPUT-ORIENTED)"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = GREEN

    gpu_features = [
        ("Design Philosophy:", "Maximize total floating-point operations per second across massive parallel data sets."),
        ("Silicon Allocation:", ">80% of die area is dedicated directly to compute ALUs (CUDA Cores, Tensor Cores, FP32/FP64 pipelines)."),
        ("Streamlined Control:", "Minimal branch prediction, no speculative out-of-order engine. Hundreds of simple in-order cores."),
        ("Concurrency:", "Massive thread counts (10,000 to 100,000+ resident threads). Instantaneous zero-cycle warp context switching.")
    ]
    for title, desc in gpu_features:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = title + " "; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    add_alert(s3, "Pacheco Chapter 6 Key Quote: 'CPUs are designed to minimize the latency of a single thread, while GPUs are designed to maximize the total throughput of all threads.'")
    add_notes(s3, "Contrast silicon die photos: CPU has massive L3 cache taking 80% space. GPU has tiny L2 and huge arrays of Streaming Multiprocessors filled with ALUs.")

    # =========================================================================
    # SLIDE 4: HETEROGENEOUS SYSTEM ARCHITECTURE & PCIE BUS
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "Concept 3 // Heterogeneous Systems", 
               "Heterogeneous Architecture: Host, Device & The PCIe Bottleneck", 
               "Core Insight: The CPU (Host) directs the GPU (Device). The PCIe bus is the narrow bridge that dictates performance.")

    # Diagram Box
    add_card(s4, Inches(0.8), Inches(1.9), Inches(11.733), Inches(4.3))
    tb = s4.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(11.3), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = "🌐 THE HOST-DEVICE DUALITY & HARDWARE INTERCONNECT"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    diag_text = (
        "  +-----------------------------+        PCIe Gen4 x16 Bus        +-----------------------------------+\n"
        "  |        HOST (CPU)           |   ===========================   |          DEVICE (GPU)             |\n"
        "  |  • Multi-Core CPU Core      |   Bandwidth: ~31.5 GB/s         |  • Array of SMs (Compute)         |\n"
        "  |  • System RAM (DDR4/DDR5)   |   Latency:   ~10,000 Cycles!    |  • Device Global VRAM (GDDR6X)    |\n"
        "  |  • Controls Program Flow    |   ---------------------------   |  • High Bandwidth: ~900 GB/s      |\n"
        "  |  • Allocates GPU Buffers    |    [THE CRITICAL BOTTLENECK]    |  • Executes Kernel Grid           |\n"
        "  +-----------------------------+                                 +-----------------------------------+\n"
    )
    p = tf.add_paragraph()
    p.text = diag_text
    p.font.name = FONT_MONO
    p.font.size = Pt(10)
    p.font.color.rgb = GREEN

    arch_rules = [
        ("Host Code:", "Runs on CPU, standard C/C++ compiler (gcc/clang). Allocates device memory, transfers input arrays, launches GPU kernels."),
        ("Device Code:", "Runs on GPU Streaming Multiprocessors, compiled by NVIDIA NVCC. Executes parallel thread functions (__global__)."),
        ("The PCIe Rule:", "Device VRAM bandwidth (~900 GB/s) is 30x faster than PCIe transfer speed (~31.5 GB/s). To achieve true speedup, keep intermediate data on the GPU across multiple kernel calls!")
    ]
    for title, desc in arch_rules:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = "• " + title + " "; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    add_alert(s4, "Amdahl's Law Trap: If PCIe data transfer takes 90% of execution time, making kernel compute infinitely fast only yields a 1.1x total speedup! Minimize cudaMemcpy transfers.", alert_color=RED, label="PERFORMANCE WARNING")
    add_notes(s4, "Explain the Host-Device model: Host has CPU and RAM, Device has GPU and VRAM. Connected over PCIe. Emphasize why transferring back and forth kills performance.")

    # =========================================================================
    # SLIDE 5: CUDA THREAD HIERARCHY
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "Concept 4 // Execution Model", 
               "The CUDA Execution Hierarchy: Threads, Warps, Blocks & Grid", 
               "Core Insight: CUDA maps scalable software abstractions (Grid & Blocks) into rigid hardware reality (Warps & SMs).")

    # Left Card: Hierarchical Levels
    add_card(s5, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.3))
    tb = s5.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "📐 SOFTWARE ABSTRACTION HIERARCHY"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    levels = [
        ("1. Thread:", "The basic sequential worker. Has private register file, private local memory, and 3D index `threadIdx`."),
        ("2. Warp (32 Threads):", "The atomic hardware execution unit. 32 consecutive threads executed simultaneously in SIMT lockstep by an SM."),
        ("3. Thread Block:", "A cooperative cluster of up to 1024 threads. Shared memory (`__shared__`) and barrier synchronization (`__syncthreads()`) only work within a single block!"),
        ("4. Grid:", "The complete collection of blocks launched by a kernel. Blocks in a grid run completely independently in any order.")
    ]
    for title, desc in levels:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = title + " "; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    # Right Card: Hardware Mapping
    add_card(s5, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.3), border_color=PURPLE)
    tb = s5.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "⚙️ HARDWARE PHYSICAL MAPPING (SM)"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = PURPLE

    hw_map = [
        ("Streaming Multiprocessor (SM):", "The GPU building block containing CUDA cores, Warp Schedulers, Register Files, and Shared Memory SRAM."),
        ("Block Assignment:", "Each Thread Block is assigned to exactly ONE SM. Multiple blocks can reside on the same SM depending on registers/shared memory resources."),
        ("Hardware Scalability:", "Because blocks are independent, a GPU with 128 SMs runs 8x faster than a GPU with 16 SMs without changing 1 line of CUDA code!"),
        ("Limitation:", "A single block cannot be split across multiple physical SMs.")
    ]
    for title, desc in hw_map:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = title + " "; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    add_alert(s5, "Crucial Exam Rule: Thread synchronization (__syncthreads()) and Shared Memory (__shared__) CANNOT cross block boundaries! There is no global inter-block barrier in standard CUDA kernels.")
    add_notes(s5, "Walk through the four levels: Thread -> Warp (32) -> Block -> Grid. Explain how the compiler and GPU map blocks onto Streaming Multiprocessors (SMs).")

    # =========================================================================
    # SLIDE 6: THREAD COORDINATES & 1D/2D INDEXING FORMULAS
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "Concept 5 // Thread Indexing", 
               "Thread Coordinates & Linear Rank Mapping (Sections 6.5 & 6.6)", 
               "Core Insight: Every thread computes its own unique memory index `my_i` using built-in CUDA vectors.")

    # Left: 1D Indexing & Formulas
    add_card(s6, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.3))
    tb = s6.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🔢 1D LINEAR RANK FORMULAS"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    f_1d = [
        ("The Master Index Formula:", "int my_i = blockDim.x * blockIdx.x + threadIdx.x;"),
        ("Variables Defined:", "• `blockDim.x`: Total threads per block (e.g., 256)\n• `blockIdx.x`: Index of current block (0, 1, 2...)\n• `threadIdx.x`: Local thread ID within block (0 to blockDim.x - 1)"),
        ("Grid Sizing Ceiling Formula:", "int grid_size = (n + block_size - 1) / block_size;\nGuarantees enough blocks are launched to cover all `n` elements without integer truncation!"),
        ("Boundary Guard:", "if (my_i < n) { ... }\nPrevents threads in the final block from accessing unallocated memory.")
    ]
    for title, desc in f_1d:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = title + "\n"; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = GREEN

    # Right: 2D Matrix Indexing
    add_card(s6, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.3), border_color=CYAN)
    tb = s6.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🔲 2D MATRIX COORDINATE MAPPING"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    f_2d = [
        ("Row Coordinate Formula:", "int row = blockDim.y * blockIdx.y + threadIdx.y;"),
        ("Column Coordinate Formula:", "int col = blockDim.x * blockIdx.x + threadIdx.x;"),
        ("Flattened 1D Memory Offset:", "int offset = row * width + col;"),
        ("Kernel Launch Syntax (2D):", "dim3 block(16, 16); // 256 threads per block\ndim3 grid((width + 15)/16, (height + 15)/16);\nMatAdd<<<grid, block>>>(d_C, d_A, d_B, width, height);"),
        ("2D Boundary Check:", "if (row < height && col < width) { d_C[offset] = ...; }")
    ]
    for title, desc in f_2d:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = title + "\n"; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = GREEN

    add_alert(s6, "Always write the ceiling formula in 10-mark exam answers: (n + B - 1) / B. If you write n / B, integer division drops the remainder and the last partial block is omitted, causing data loss!")
    add_notes(s6, "Walk through the arithmetic of my_i. Give a concrete example: Block size 8, Block index 2, Thread index 3 -> my_i = 8*2 + 3 = 19. Explain why the ceiling formula is used.")

    # =========================================================================
    # SLIDE 7: MEMORY HIERARCHY & LATENCY
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "Concept 6 // Memory Hierarchy", 
               "NVIDIA GPU Memory Hierarchy: Scopes, Lifetimes & Access Latencies", 
               "Core Insight: The fastest memory (Registers) is 400x faster than Global VRAM. Choosing the right memory tier dictates performance.")

    # Memory Table in Card
    add_card(s7, Inches(0.8), Inches(1.9), Inches(11.733), Inches(4.3))
    tb = s7.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(11.3), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "📊 COMPREHENSIVE MEMORY TIER ARCHITECTURE COMPARISON"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    table_data = (
        "Memory Type      | Location | Scope           | Lifetime         | Latency (Cycles)  | Bandwidth / Notes\n"
        "-----------------+----------+-----------------+------------------+-------------------+-----------------------------------\n"
        "Registers        | On-Chip  | Single Thread   | Thread Lifetime  | ~1 Cycle          | Ultra-fast SRAM, 64K regs per SM\n"
        "Shared Memory    | On-Chip  | Thread Block    | Block Lifetime   | ~20 - 30 Cycles   | User-managed cache (Program 6.14)\n"
        "Constant Memory  | On-Chip  | All Threads Grid| Application      | ~1 Cycle (Cached) | 64 KB total, broadcast on uniform\n"
        "L1 / L2 Cache    | On-Chip  | All SMs         | Application      | ~30 - 200 Cycles  | Hardware managed transparent cache\n"
        "Global VRAM      | Off-Chip | All Threads +Host| Application     | ~400 - 800 Cycles | Huge capacity (8-80 GB), slow\n"
        "Host RAM (PCIe)  | Host PC  | CPU + UVM Pages | Host Application | ~10,000+ Cycles   | Over PCIe bus (~31.5 GB/s bottleneck)\n"
    )
    p = tf.add_paragraph()
    p.text = table_data
    p.font.name = FONT_MONO
    p.font.size = Pt(9.5)
    p.font.color.rgb = GREEN

    key_principles = [
        ("Shared Memory (__shared__):", "Resides physically inside the SM alongside L1 cache. Shared across threads in the SAME block. Extremely low latency (~25 cycles)."),
        ("Global Memory (float*):", "High capacity DRAM located off-chip. Accessible by all threads and Host. High latency (~400 cycles) requires coalesced memory accesses."),
        ("Latency Hiding:", "The GPU hides global memory latency by context-switching between warps. When Warp A waits for global load, Warp B executes ALUs.")
    ]
    for title, desc in key_principles:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = "• " + title + " "; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    add_alert(s7, "Exam Checklist: Be prepared to state the Scope, Lifetime, and Location for: Registers (Thread/On-chip), Shared (Block/On-chip), and Global (Grid+Host/Off-chip).")
    add_notes(s7, "Detail the memory pyramid. Emphasize register pressure: if a kernel uses too many registers per thread, fewer warps fit on the SM, decreasing occupancy.")

    # =========================================================================
    # SLIDE 8: MEMORY MANAGEMENT APIS & UNIFIED MEMORY
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_header(s8, "Concept 7 // Memory Management APIs", 
               "Explicit Memory Management (Program 6.9) vs. Unified Memory (Program 6.6)", 
               "Core Insight: Standard CUDA uses explicit pointer mirrors; Unified Memory provides a single virtual pointer managed by page migration.")

    # Left: Explicit Memory
    add_card(s8, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.3))
    tb = s8.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "📦 EXPLICIT TRANSFERS (Program 6.9)"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    p = tf.add_paragraph()
    code_exp = (
        "float *h_a, *d_a;\n"
        "size_t bytes = n * sizeof(float);\n"
        "h_a = (float*) malloc(bytes);          // Host RAM\n"
        "cudaMalloc(&d_a, bytes);               // Device VRAM\n\n"
        "// Transfer Host to Device across PCIe\n"
        "cudaMemcpy(d_a, h_a, bytes, cudaMemcpyHostToDevice);\n\n"
        "VecAdd<<<grid, block>>>(d_a, n);      // Launch GPU\n\n"
        "// Transfer Device to Host back\n"
        "cudaMemcpy(h_a, d_a, bytes, cudaMemcpyDeviceToHost);\n\n"
        "cudaFree(d_a); free(h_a);             // Deallocate"
    )
    p.text = code_exp
    p.font.name = FONT_MONO
    p.font.size = Pt(9.5)
    p.font.color.rgb = GREEN

    # Right: Unified Memory
    add_card(s8, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.3), border_color=PURPLE)
    tb = s8.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🔮 UNIFIED MEMORY (Program 6.6)"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = PURPLE

    p = tf.add_paragraph()
    code_um = (
        "float *a;\n"
        "size_t bytes = n * sizeof(float);\n"
        "// Single Unified Virtual Memory pointer\n"
        "cudaMallocManaged(&a, bytes);\n\n"
        "// Initialized directly on CPU Host\n"
        "for (int i = 0; i < n; i++) a[i] = 1.0f;\n\n"
        "VecAdd<<<grid, block>>>(a, n);\n\n"
        "// MUST synchronize Host before reading!\n"
        "cudaDeviceSynchronize();\n\n"
        "// Host reads result directly from 'a'\n"
        "cudaFree(a);"
    )
    p.text = code_um
    p.font.name = FONT_MONO
    p.font.size = Pt(9.5)
    p.font.color.rgb = GREEN

    add_alert(s8, "Common Bug Alert: When using cudaMallocManaged, if you omit `cudaDeviceSynchronize()` before CPU accesses the array, you get garbage or race conditions because kernel launch is asynchronous!")
    add_notes(s8, "Explain the difference: Explicit requires managing two sets of pointers (h_x and d_x) and copying across PCIe. Unified memory creates one pointer; the driver migrates 4KB pages automatically.")

    # =========================================================================
    # SLIDE 9: CUDA FUNCTION QUALIFIERS & SYNTAX
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    add_header(s9, "Concept 8 // CUDA C++ Syntax", 
               "Function Qualifiers & Execution Configuration Syntax", 
               "Core Insight: Function execution target and caller permissions are declared via __global__, __device__, and __host__.")

    # Table Card
    add_card(s9, Inches(0.8), Inches(1.9), Inches(11.733), Inches(4.3))
    tb = s9.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(11.3), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "🏷️ CUDA FUNCTION EXECUTION QUALIFIERS"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    qual_text = (
        "Qualifier      | Executed On | Callable From   | Return Type | Description / Purpose\n"
        "---------------+-------------+-----------------+-------------+-------------------------------------------------\n"
        "__global__     | Device(GPU) | Host (or Device)| void        | Kernel entry point. Launched via <<<grid, block>>>.\n"
        "__device__     | Device(GPU) | Device Only     | Any type    | Helper function executed by threads on GPU cores.\n"
        "__host__       | Host (CPU)  | Host Only       | Any type    | Standard C/C++ function executed on CPU.\n"
        "__host__ __device__| Dual     | Host and Device | Any type    | Compiled for BOTH architectures (e.g. math utility).\n"
    )
    p = tf.add_paragraph()
    p.text = qual_text
    p.font.name = FONT_MONO
    p.font.size = Pt(10)
    p.font.color.rgb = GREEN

    syn_points = [
        ("Execution Configuration Syntax:", "KernelName<<<grid_dimensions, block_dimensions, shared_mem_bytes, stream>>>(args...);"),
        ("Grid Dimensions:", "Specifies the number of blocks in the grid. Can be `int` (1D) or `dim3(gx, gy, gz)` (2D/3D)."),
        ("Block Dimensions:", "Specifies the number of threads per block. Can be `int` (1D) or `dim3(bx, by, bz)` (2D/3D). Maximum 1024 threads per block!"),
        ("Asynchronous Launch:", "Kernel launches are non-blocking on the Host! The CPU continues execution immediately while the GPU crunches in the background.")
    ]
    for title, desc in syn_points:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = "• " + title + " "; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    add_alert(s9, "Rule: __global__ functions MUST return `void`. They cannot return values via standard `return` statement; results must be written to pointers in global memory.")
    add_notes(s9, "Explain the qualifiers carefully. Note that __global__ functions cannot return values directly; output must be passed via pointers in global memory.")

    # =========================================================================
    # SLIDE 10: PROGRAM 6.1 & 6.2 WALKTHROUGH
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10)
    add_header(s10, "Concept 9 // Textbook Programs 6.1 & 6.2", 
               "CUDA Hello World: 1 Block vs. Multiple Blocks (Section 6.5)", 
               "Core Insight: Demonstrates multi-threaded printf execution and the non-deterministic scheduling of parallel blocks.")

    # Left: Program 6.1
    add_card(s10, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.3))
    tb = s10.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "📜 PROGRAM 6.1: SINGLE BLOCK HELLO"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    p = tf.add_paragraph()
    p.text = (
        "#include <stdio.h>\n\n"
        "__global__ void Hello(void) {\n"
        "  printf(\"Hello from thread %d!\\n\", threadIdx.x);\n"
        "}\n\n"
        "int main(void) {\n"
        "  // 1 block of 32 threads launched\n"
        "  Hello<<<1, 32>>>();\n"
        "  cudaDeviceSynchronize();\n"
        "  return 0;\n"
        "}\n"
        "// Output: Threads 0..31 print message.\n"
        "// Order within a warp is often sequential,\n"
        "// but not formally guaranteed."
    )
    p.font.name = FONT_MONO; p.font.size = Pt(9.5); p.font.color.rgb = GREEN

    # Right: Program 6.2
    add_card(s10, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.3), border_color=PURPLE)
    tb = s10.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "📜 PROGRAM 6.2: MULTI-BLOCK GRID"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = PURPLE

    p = tf.add_paragraph()
    p.text = (
        "#include <stdio.h>\n\n"
        "__global__ void HelloMulti(void) {\n"
        "  printf(\"Hello from thread %d in block %d!\\n\",\n"
        "         threadIdx.x, blockIdx.x);\n"
        "}\n\n"
        "int main(void) {\n"
        "  // 2 blocks of 4 threads launched\n"
        "  HelloMulti<<<2, 4>>>();\n"
        "  cudaDeviceSynchronize();\n"
        "  return 0;\n"
        "}\n"
        "// CRITICAL OBSERVATION:\n"
        "// Output lines from Block 0 and Block 1\n"
        "// interleave unpredictably across runs!"
    )
    p.font.name = FONT_MONO; p.font.size = Pt(9.5); p.font.color.rgb = GREEN

    add_alert(s10, "Pacheco Chapter 6 Principle: Block scheduling is non-deterministic! Blocks execute in whatever order the hardware SMs pick them up. Never rely on block order.")
    add_notes(s10, "Explain Program 6.1 and 6.2. Show how cudaDeviceSynchronize() is necessary so the Host waits for the GPU printf buffer to flush before exiting main().")

    # =========================================================================
    # SLIDE 11: PROGRAM 6.3 & 6.9 VECTOR ADDITION
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11)
    add_header(s11, "Concept 10 // Textbook Programs 6.3 & 6.9", 
               "Vector Addition Kernel & Boundary Check (Section 6.6 & 6.7)", 
               "Core Insight: The canonical parallel vector addition pattern: 1 thread per element with a boundary guard.")

    # Left: Kernel Code
    add_card(s11, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.3))
    tb = s11.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "💻 THE VECTOR ADDITION KERNEL"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    p = tf.add_paragraph()
    p.text = (
        "__global__ void VecAdd(float* z,\n"
        "                       const float* x,\n"
        "                       const float* y,\n"
        "                       int n) {\n"
        "  // Compute unique 1D linear global index\n"
        "  int my_i = blockDim.x * blockIdx.x + threadIdx.x;\n\n"
        "  // Boundary check: skip threads beyond n\n"
        "  if (my_i < n) {\n"
        "    z[my_i] = x[my_i] + y[my_i];\n"
        "  }\n"
        "}\n\n"
        "// Host Launch Configuration:\n"
        "int block_size = 256;\n"
        "int grid_size = (n + block_size - 1) / block_size;\n"
        "VecAdd<<<grid_size, block_size>>>(d_z, d_x, d_y, n);"
    )
    p.font.name = FONT_MONO; p.font.size = Pt(9.5); p.font.color.rgb = GREEN

    # Right: Step-by-Step Execution
    add_card(s11, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.3), border_color=CYAN)
    tb = s11.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🔍 STEP-BY-STEP EXECUTION TRACE"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    trace_points = [
        ("Step 1: Grid Sizing", "Assume vector length n = 1000, block_size = 256. Grid size = (1000 + 255) / 256 = 4 blocks (total 1024 threads)."),
        ("Step 2: Blocks 0, 1, 2", "Blocks 0..2 compute indices 0 to 767. All threads have `my_i < 1000` -> 100% active compute."),
        ("Step 3: Block 3 (Partial)", "Threads 0..231 compute indices 768 to 999 (my_i < 1000). Active!"),
        ("Step 4: Boundary Guard in Action", "Threads 232..255 have `my_i` from 1000 to 1023. `my_i < n` evaluates FALSE. These 24 threads safely skip execution, preventing memory corruption!")
    ]
    for title, desc in trace_points:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = title + ": "; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    add_alert(s11, "Exam Derivation: Explain how 1000 elements are mapped to 4 blocks of 256 threads, identifying exactly which threads execute and which are idle.")
    add_notes(s11, "Walk through Program 6.3/6.9 in detail. This is the bedrock example for understanding thread coordinates and boundary guards.")

    # =========================================================================
    # SLIDE 12: WARP LOCKSTEP & SIMT EXECUTION
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_background(s12)
    add_header(s12, "Concept 11 // Hardware Mechanics", 
               "Warp Lockstep Execution: The 32-Thread Physical Atomic Unit", 
               "Core Insight: The GPU hardware does not schedule individual threads—it schedules 32-thread Warps.")

    # Diagram & Features
    add_card(s12, Inches(0.8), Inches(1.9), Inches(11.733), Inches(4.3))
    tb = s12.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(11.3), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "⚡ THE HARDWARE REALITY OF WARPS (Section 6.8)"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    warp_diag = (
        "  +---------------------------------------------------------------------------------------------------+\n"
        "  |  WARP SCHEDULER: Issues 1 Instruction to All 32 Execution Lanes Simultaneously in Lockstep        |\n"
        "  +---------------------------------------------------------------------------------------------------+\n"
        "    Lane 00  Lane 01  Lane 02  Lane 03  ...  Lane 15  ...  Lane 28  Lane 29  Lane 30  Lane 31\n"
        "     [ALU]    [ALU]    [ALU]    [ALU]   ...   [ALU]   ...   [ALU]    [ALU]    [ALU]    [ALU]\n"
        "       |        |        |        |             |             |        |        |        |\n"
        "     Thread 0 Thread 1 Thread 2 Thread 3 ... Thread 15 ... Thread 28 Thread 29 Thread 30 Thread 31\n"
    )
    p = tf.add_paragraph(); p.text = warp_diag; p.font.name = FONT_MONO; p.font.size = Pt(10); p.font.color.rgb = GREEN

    warp_rules = [
        ("Warp Size is Always 32:", "On all NVIDIA GPU architectures (from Kepler to Hopper and Blackwell), warp size is fixed at 32 threads."),
        ("Thread ID Mapping:", "Threads 0..31 belong to Warp 0; Threads 32..63 belong to Warp 1; Threads (32k)..(32k+31) belong to Warp k."),
        ("Zero-Cost Context Switching:", "An SM contains multiple resident warps. When Warp 0 stalls on memory, the scheduler swaps to Warp 1 in 1 clock cycle without saving registers to memory because each warp has its own dedicated physical register bank!"),
        ("Occupancy Rule:", "Always configure thread blocks in multiples of 32 (e.g. 128, 256, 512). A block of 48 threads wastes 16 execution slots in its second warp!")
    ]
    for title, desc in warp_rules:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = "• " + title + " "; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    add_alert(s12, "Viva Question: Why should blockDim always be a multiple of 32? Answer: Because hardware executes in 32-thread warps. Non-multiples create under-populated warps that leave hardware cores idle.")
    add_notes(s12, "Explain how the warp scheduler works. Note that warp size 32 is a hardware constant. Emphasize that blockDim should always be a multiple of 32.")

    # =========================================================================
    # SLIDE 13: WARP BRANCH DIVERGENCE & SERIALIZATION
    # =========================================================================
    s13 = prs.slides.add_slide(blank_layout)
    set_slide_background(s13)
    add_header(s13, "Concept 12 // Architectural Bottleneck", 
               "Warp Branch Divergence & Serialization Penalty (Table 6.1)", 
               "Core Insight: When threads in the same warp take different branches, the hardware must execute BOTH branches sequentially!")

    # Left: Code & Penalty Trace
    add_card(s13, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.3))
    tb = s13.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "⚠️ THE DIVERGENT BRANCH PROBLEM"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = RED

    p = tf.add_paragraph()
    p.text = (
        "__global__ void DivergentKernel(float* x) {\n"
        "  int i = threadIdx.x;\n"
        "  // Suppose Even threads (0,2,4..) have x[i] >= 0\n"
        "  // and Odd threads (1,3,5..) have x[i] < 0\n\n"
        "  if (x[i] >= 0.0f) {    // Cycle 1: Condition Test\n"
        "    x[i] += 1.0f;        // Cycle 2: THEN path\n"
        "  } else {\n"
        "    x[i] -= 2.0f;        // Cycle 3: ELSE path\n"
        "  }\n"
        "  // Cycle 4: Reconverge & Proceed\n"
        "}\n\n"
        "Total Time = Time(THEN) + Time(ELSE)\n"
        "ALU Efficiency drops by 50%!"
    )
    p.font.name = FONT_MONO; p.font.size = Pt(9.5); p.font.color.rgb = GREEN

    # Right: Pacheco Table 6.1 Analysis
    add_card(s13, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.3), border_color=AMBER)
    tb = s13.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "📊 PACHECO TABLE 6.1 BENCHMARK"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = AMBER

    t61_text = (
        "Condition Type    | Active Mask | Execution Time | Efficiency\n"
        "------------------+-------------+----------------+-----------\n"
        "Uniform (No div)  | 0xFFFFFFFF  | 1.00x Base     | 100% Full\n"
        "Even/Odd Altern.  | 0x55555555  | 1.95x Slower   | ~50% Stalls\n"
        "4-Way Switch      | Multi-Mask  | 3.82x Slower   | ~25% Stalls\n"
    )
    p = tf.add_paragraph(); p.text = t61_text; p.font.name = FONT_MONO; p.font.size = Pt(9.5); p.font.color.rgb = WHITE

    div_rules = [
        ("Hardware Masking Mechanism:", "The warp scheduler disables threads that don't take the active path. Stalled threads remain idle while hardware cycles clock!"),
        ("Intra-Warp vs Inter-Warp:", "Divergence ONLY penalizes threads within the SAME 32-thread warp. If Warp 0 takes 'then' and Warp 1 takes 'else', there is ZERO divergence penalty!"),
        ("Optimization Strategy:", "Align conditional data in multiples of 32 so entire warps take the same branch.")
    ]
    for title, desc in div_rules:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = "• " + title + " "; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    add_alert(s13, "Key Distinction: Branch divergence only occurs within a single warp. If Warp 0 takes THEN and Warp 1 takes ELSE, they execute independently without serialization!")
    add_notes(s13, "Explain Table 6.1 from Pacheco. Show that branch divergence within a warp serializes execution paths and cuts efficiency in half.")

    # =========================================================================
    # SLIDE 14: TRAPEZOIDAL RULE MATHEMATICAL FOUNDATIONS
    # =========================================================================
    s14 = prs.slides.add_slide(blank_layout)
    set_slide_background(s14)
    add_header(s14, "Concept 13 // Numerical Integration", 
               "Trapezoidal Rule: Mathematical Foundations (Section 6.10)", 
               "Core Insight: Approximate definite integral by slicing area into n trapezoids and summing them in parallel.")

    # Left: Math Formulas
    add_card(s14, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.3))
    tb = s14.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "📐 MATHEMATICAL DERIVATION"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    math_points = [
        ("Problem Statement:", "Approximate definite integral: I = ∫ [a to b] f(x) dx"),
        ("Subinterval Width (h):", "h = (b - a) / n\nWhere `n` is the total number of trapezoids."),
        ("Sample Grid Points (x_i):", "x_i = a + i * h   for i = 0, 1, 2 ... n"),
        ("Individual Trapezoid Area (T_i):", "T_i = ( f(x_i) + f(x_{i+1}) ) * 0.5 * h"),
        ("Composite Trapezoidal Formula:", "Integral ≈ h * [ f(a)/2 + f(x_1) + f(x_2) + ... + f(x_{n-1}) + f(b)/2 ]"),
        ("Error Term:", "Error is O(h^2) = O(1/n^2). Doubling n quarters the error.")
    ]
    for title, desc in math_points:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = title + "\n"; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = GREEN

    # Right: Parallel Strategy
    add_card(s14, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.3), border_color=GREEN)
    tb = s14.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "⚡ PARALLEL MAPPING STRATEGY"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = GREEN

    par_steps = [
        ("1. Thread Responsibility:", "Assign each thread `my_i` to calculate exactly ONE trapezoid area `my_trap`."),
        ("2. Independent Evaluation:", "Every thread evaluates f(x) independently without any communication."),
        ("3. The Reduction Challenge:", "How do all n threads sum their individual `my_trap` values into a single global result?"),
        ("4. Pacheco's Three Implementations:", "• Program 6.12: atomicAdd (Global contention)\n• Program 6.14: Shared Memory Tree Reduction\n• Program 6.15: Warp Shuffles (__shfl_down_sync)")
    ]
    for title, desc in par_steps:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = title + "\n"; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    add_alert(s14, "The Trapezoidal Rule is Pacheco Chapter 6's primary vehicle for comparing reduction strategies: atomicAdd vs Shared Memory vs Warp Shuffles.")
    add_notes(s14, "Explain the Trapezoidal rule mathematical derivation. Note how the composite formula works, and how it translates to CUDA threads.")

    # =========================================================================
    # SLIDE 15: PROGRAM 6.12 & DATA RACE HAZARDS
    # =========================================================================
    s15 = prs.slides.add_slide(blank_layout)
    set_slide_background(s15)
    add_header(s15, "Concept 14 // Concurrency & Race Conditions", 
               "Program 6.12: Trapezoidal I, Data Races & atomicAdd", 
               "Core Insight: Unsynchronized additions to shared memory cause data races; atomicAdd serializes the hardware to guarantee correctness.")

    # Left: The Data Race
    add_card(s15, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.3), border_color=RED)
    tb = s15.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "💥 THE DATA RACE HAZARD (*trap_p += my_trap)"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = RED

    race_desc = (
        "// INCORRECT CODE (DATA RACE!):\n"
        "__global__ void TrapBuggy(float* trap_p, ...) {\n"
        "  float my_trap = ...;\n"
        "  *trap_p += my_trap; // BUG: Concurrent Write!\n"
        "}\n\n"
        "Why It Fails (Read-Modify-Write Conflict):\n"
        "1. Thread 0 reads *trap_p (value = 10.0)\n"
        "2. Thread 1 reads *trap_p (value = 10.0 simultaneously)\n"
        "3. Thread 0 writes back: 10.0 + 2.0 = 12.0\n"
        "4. Thread 1 writes back: 10.0 + 3.0 = 13.0\n"
        "RESULT: Thread 0's addition is completely STOMPED!\n"
        "Computed answer: ~14.8 instead of exact 24.0!"
    )
    p = tf.add_paragraph(); p.text = race_desc; p.font.name = FONT_MONO; p.font.size = Pt(9.5); p.font.color.rgb = SLATE_LIGHT

    # Right: atomicAdd Solution
    add_card(s15, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.3), border_color=GREEN)
    tb = s15.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🔒 THE SOLUTION: atomicAdd (Program 6.12)"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = GREEN

    p = tf.add_paragraph()
    p.text = (
        "__global__ void TrapAtomic(float* trap_p,\n"
        "                           float a, float h, int n) {\n"
        "  int my_i = blockDim.x * blockIdx.x + threadIdx.x;\n"
        "  if (my_i < n) {\n"
        "    float x = a + my_i * h;\n"
        "    float my_trap = 0.5f * (f(x) + f(x + h)) * h;\n\n"
        "    // Hardware-serialized atomic update\n"
        "    atomicAdd(trap_p, my_trap);\n"
        "  }\n"
        "}\n\n"
        "atomicAdd performs Read-Modify-Write in 1 uninterruptible\n"
        "hardware operation. 100% Mathematically Exact (24.0000)!"
    )
    p.font.name = FONT_MONO; p.font.size = Pt(9.5); p.font.color.rgb = GREEN

    add_alert(s15, "Exam Warning: While atomicAdd solves data race correctness, having thousands of threads hit the exact same address creates a massive serialization bottleneck (Pacheco Table 6.5).")
    add_notes(s15, "Explain data races clearly: read-modify-write interleaving. Then show how atomicAdd fixes correctness but creates a hardware queue bottleneck.")

    # =========================================================================
    # SLIDE 16: ATOMICADD HARDWARE CONTENTION (TABLE 6.5)
    # =========================================================================
    s16 = prs.slides.add_slide(blank_layout)
    set_slide_background(s16)
    add_header(s16, "Concept 15 // Contention Analysis", 
               "atomicAdd Hardware Contention & Scaling Bottlenecks (Table 6.5)", 
               "Core Insight: As thread counts grow, atomicAdd forces thousands of threads into a single-file queue at memory.")

    # Left: Contention Queue
    add_card(s16, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.3))
    tb = s16.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🚦 THE MEMORY SERIALIZATION BOTTLENECK"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = AMBER

    cont_points = [
        ("The Single Lock Problem:", "All threads across all blocks compete for the exact same memory controller line for `*trap_p`."),
        ("Token Ring Serialization:", "If 1024 threads execute `atomicAdd` simultaneously, only ONE thread can update per cycle. The other 1023 threads must WAIT in a hardware queue!"),
        ("Bandwidth Starvation:", "Compute cores sit idle while waiting for memory lock tokens."),
        ("Scaling Breakdown:", "Doubling thread count no longer yields 2x speedup because the global memory bus is saturated.")
    ]
    for title, desc in cont_points:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = title + " "; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    # Right: Pacheco Table 6.5 Data
    add_card(s16, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.3), border_color=AMBER)
    tb = s16.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "📊 PACHECO TABLE 6.5 CONTENTION DATA"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = AMBER

    t65_text = (
        "Threads per Block | Runtime (ms) | Contention Overhead\n"
        "------------------+--------------+--------------------\n"
        "32 Threads        | 0.42 ms      | Low Contention\n"
        "128 Threads       | 0.78 ms      | Moderate Queueing\n"
        "512 Threads       | 1.34 ms      | Heavy Serialization\n"
        "1024 Threads      | 2.15 ms      | Severe Bottleneck!\n"
    )
    p = tf.add_paragraph(); p.text = t65_text; p.font.name = FONT_MONO; p.font.size = Pt(9.5); p.font.color.rgb = WHITE

    p = tf.add_paragraph()
    p.text = "Takeaway: Program 6.12 fails to scale. To solve this, we must reduce locally within blocks before updating globally!"
    p.font.name = FONT_MAIN; p.font.size = Pt(11); p.font.color.rgb = GREEN

    add_alert(s16, "Pacheco Conclusion: atomicAdd to a single variable is O(N) serialized. We need a tree-structured reduction (O(log N)) to achieve true scalability.")
    add_notes(s16, "Explain Table 6.5. Show why atomicAdd to a single variable degrades as thread count rises. Introduce the motivation for tree reduction.")

    # =========================================================================
    # SLIDE 17: PROGRAM 6.14 SHARED MEMORY TREE REDUCTION
    # =========================================================================
    s17 = prs.slides.add_slide(blank_layout)
    set_slide_background(s17)
    add_header(s17, "Concept 16 // Tree Reductions", 
               "Program 6.14: Shared Memory Tree-Structured Reduction (Section 6.11)", 
               "Core Insight: Collapse N additions in O(log2 N) parallel steps using fast shared memory SRAM and stride-halving.")

    # Left: Tree Diagram & Stride Halving
    add_card(s17, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.3))
    tb = s17.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🌳 STRIDE-HALVING BINARY REDUCTION TREE"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    tree_diag = (
        "  Initial:   [s0] [s1] [s2] [s3] [s4] [s5] [s6] [s7]\n"
        "               ^    ^    ^    ^\n"
        "  Stride 4:    +----+----+----+-- (s[0]+=s[4], s[1]+=s[5]...)\n"
        "             [s0] [s1] [s2] [s3]  (Threads 4..7 idle)\n"
        "               ^    ^\n"
        "  Stride 2:    +----+----------- (s[0]+=s[2], s[1]+=s[3])\n"
        "             [s0] [s1]           (Threads 2..7 idle)\n"
        "               ^\n"
        "  Stride 1:    +---------------- (s[0]+=s[1])\n"
        "             [s0] = FINAL BLOCK SUM! (O(log2 8) = 3 steps)"
    )
    p = tf.add_paragraph(); p.text = tree_diag; p.font.name = FONT_MONO; p.font.size = Pt(9.5); p.font.color.rgb = GREEN

    # Right: Program 6.14 Code
    add_card(s17, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.3), border_color=GREEN)
    tb = s17.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "💻 PROGRAM 6.14 IMPLEMENTATION"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = GREEN

    p = tf.add_paragraph()
    p.text = (
        "__shared__ float s[BLOCK_SIZE];\n"
        "int tx = threadIdx.x;\n"
        "s[tx] = my_trap;        // Load into fast shared SRAM\n"
        "__syncthreads();        // Barrier: wait for all loads\n\n"
        "// Stride-halving reduction loop: O(log2 n)\n"
        "for (int stride = blockDim.x / 2; stride > 0; stride /= 2) {\n"
        "  if (tx < stride) {\n"
        "    s[tx] += s[tx + stride]; // Parallel merge\n"
        "  }\n"
        "  __syncthreads();     // Critical barrier after merge!\n"
        "}\n\n"
        "// Thread 0 writes final block sum via single atomicAdd\n"
        "if (tx == 0) atomicAdd(trap_p, s[0]);"
    )
    p.font.name = FONT_MONO; p.font.size = Pt(9.5); p.font.color.rgb = GREEN

    add_alert(s17, "Why only 1 atomicAdd per block? In a 1024-thread block, Program 6.12 did 1024 atomic additions. Program 6.14 does only ONE atomicAdd per block, cutting global contention by 1024x!")
    add_notes(s17, "Trace the binary tree reduction step-by-step. Show how 1024 threads collapse to 1 sum in only 10 iterations. Explain why this dramatically cuts atomic contention.")

    # =========================================================================
    # SLIDE 18: BARRIER SYNCHRONIZATION & __SYNCTHREADS()
    # =========================================================================
    s18 = prs.slides.add_slide(blank_layout)
    set_slide_background(s18)
    add_header(s18, "Concept 17 // Synchronization", 
               "Barrier Synchronization & __syncthreads() Rules (Section 6.11.2)", 
               "Core Insight: __syncthreads() coordinates threads within a block. If omitted, Read-After-Write (RAW) data races corrupt memory.")

    # Left: The RAW Hazard
    add_card(s18, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.3), border_color=RED)
    tb = s18.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "⚠️ THE READ-AFTER-WRITE (RAW) HAZARD"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = RED

    raw_points = [
        ("Without __syncthreads():", "Threads execute asynchronously. Thread 0 might rush ahead to stride 2 before Thread 4 has finished writing its stride 1 sum to `s[4]`!"),
        ("The Hazard:", "Thread 0 reads stale, un-updated data from `s[tx + stride]`. The reduction tree computes an incorrect sum!"),
        ("The Fix:", "Calling `__syncthreads()` forces every thread in the block to reach the barrier before ANY thread is permitted to pass."),
        ("Memory Visibility:", "All shared and global memory writes made before the barrier are guaranteed visible to all threads after the barrier.")
    ]
    for title, desc in raw_points:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = title + " "; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    # Right: Divergent Barrier Deadlock
    add_card(s18, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.3), border_color=AMBER)
    tb = s18.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🛑 STRICT RULE: DIVERGENT BARRIER DEADLOCK"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = AMBER

    p = tf.add_paragraph()
    p.text = (
        "// FATAL BUG: __syncthreads() INSIDE DIVERGENT IF\n"
        "if (threadIdx.x < stride) {\n"
        "  s[tx] += s[tx + stride];\n"
        "  __syncthreads(); // DEADLOCK HAZARD!\n"
        "}\n\n"
        "Why This Causes Hardware Hangs:\n"
        "• Threads with `tx >= stride` never execute the if-block.\n"
        "• The barrier waits for ALL threads in the block.\n"
        "• Result: The hardware hangs indefinitely (undefined behavior)!\n\n"
        "RULE: __syncthreads() MUST be called either by ALL threads\n"
        "in the block, or by NONE of them. Place it OUTSIDE the `if`!"
    )
    p.font.name = FONT_MONO; p.font.size = Pt(9.5); p.font.color.rgb = SLATE_LIGHT

    add_alert(s18, "Top Viva Question: Can __syncthreads() be placed inside an `if (threadIdx.x < stride)` block? NO! It causes hardware deadlock or undefined behavior.")
    add_notes(s18, "Emphasize the two rules of __syncthreads(): 1) Prevents RAW hazards. 2) Must be called universally across the block, never inside a conditional where only a subset reaches it.")

    # =========================================================================
    # SLIDE 19: SHARED MEMORY 32-BANK CONFLICTS
    # =========================================================================
    s19 = prs.slides.add_slide(blank_layout)
    set_slide_background(s19)
    add_header(s19, "Concept 18 // Memory Architecture", 
               "Shared Memory 32-Bank Conflicts & Stride Analysis (Table 6.9)", 
               "Core Insight: Shared memory is split into 32 parallel banks. When multiple threads in a warp access the same bank, requests are serialized.")

    # Left: Bank Architecture
    add_card(s19, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.3))
    tb = s19.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🏛️ 32-BANK INTERLEAVED ARCHITECTURE"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    bank_points = [
        ("Physical Organization:", "Shared memory SRAM consists of 32 independent banks (Bank 0 to Bank 31), each 4 bytes wide (32 bits)."),
        ("Address Formula:", "bank_id = (word_address) % 32 = (byte_address / 4) % 32."),
        ("1-Cycle Peak Bandwidth:", "If all 32 threads in a warp access 32 distinct banks simultaneously, access completes in ONE clock cycle!"),
        ("k-Way Bank Conflict:", "If `k` threads target the same bank at different addresses, access serializes into `k` separate clock cycles (throughput drops to 1/k).")
    ]
    for title, desc in bank_points:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = title + " "; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    # Right: Stride Comparison & Table 6.9
    add_card(s19, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.3), border_color=RED)
    tb = s19.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "📊 STRIDE ACCESS & PACHECO TABLE 6.9"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = RED

    t69_text = (
        "Stride Pattern | Target Bank Formula  | Conflict Degree | Cycles\n"
        "---------------+----------------------+-----------------+-------\n"
        "Stride 1       | (t * 1) % 32         | 0 Conflicts     | 1 Cycle\n"
        "Stride 2       | (t * 2) % 32         | 2-Way Conflict  | 2 Cycles\n"
        "Stride 4       | (t * 4) % 32         | 4-Way Conflict  | 4 Cycles\n"
        "Stride 32      | (t * 32) % 32 = 0!   | 32-WAY DISASTER!| 32 Cycles\n"
    )
    p = tf.add_paragraph(); p.text = t69_text; p.font.name = FONT_MONO; p.font.size = Pt(9.5); p.font.color.rgb = WHITE

    p = tf.add_paragraph()
    p.text = "Why Stride-Halving in Program 6.14 is Brilliant:\nIn Program 6.14, active threads are sequential (tx = 0, 1, 2...). Thread tx accesses Bank tx, guaranteeing ZERO bank conflicts throughout the entire reduction!"
    p.font.name = FONT_MAIN; p.font.size = Pt(10.5); p.font.color.rgb = GREEN

    add_alert(s19, "Exam Proof: Why does stride-doubling cause bank conflicts while stride-halving avoids them? In stride-doubling, thread spacing hits identical banks mod 32. In stride-halving, active threads 0..stride-1 remain contiguous!")
    add_notes(s19, "Explain Table 6.9. Show how Stride 32 causes all 32 threads to hit Bank 0 simultaneously, forcing 32 serial memory transactions.")

    # =========================================================================
    # SLIDE 20: PROGRAM 6.15 WARP SHUFFLES
    # =========================================================================
    s20 = prs.slides.add_slide(blank_layout)
    set_slide_background(s20)
    add_header(s20, "Concept 19 // Warp-Level Primitives", 
               "Program 6.15: Warp Shuffles (__shfl_down_sync) (Section 6.13)", 
               "Core Insight: Warp shuffles exchange values directly between registers across threads in 1 cycle with ZERO shared memory.")

    # Left: The Primitive
    add_card(s20, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.3))
    tb = s20.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "⚡ THE __shfl_down_sync PRIMITIVE"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    shfl_desc = (
        "Syntax:\n"
        "T __shfl_down_sync(unsigned mask, T var, int delta);\n\n"
        "How It Works:\n"
        "• Lane `i` reads `var` from Lane `(i + delta)`.\n"
        "• Operates entirely through internal register interconnects.\n"
        "• Replaces shared memory for intra-warp reductions!\n\n"
        "Three Massive Architectural Advantages:\n"
        "1. ZERO Shared Memory Allocated (0 bytes footprint).\n"
        "2. ZERO __syncthreads() Barriers (Warps run in lockstep).\n"
        "3. 1 Single Clock Cycle Latency (Register-to-register)."
    )
    p = tf.add_paragraph(); p.text = shfl_desc; p.font.name = FONT_MONO; p.font.size = Pt(9.5); p.font.color.rgb = SLATE_LIGHT

    # Right: Program 6.15 Code
    add_card(s20, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.3), border_color=PURPLE)
    tb = s20.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "💻 PROGRAM 6.15 IMPLEMENTATION"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = PURPLE

    p = tf.add_paragraph()
    p.text = (
        "__inline__ __device__ float WarpReduceSum(float val) {\n"
        "  // 32 threads collapse in exactly 5 single-cycle steps:\n"
        "  // delta = 16, 8, 4, 2, 1\n"
        "  for (int offset = warpSize / 2; offset > 0; offset /= 2) {\n"
        "    val += __shfl_down_sync(0xFFFFFFFF, val, offset);\n"
        "  }\n"
        "  return val; // Lane 0 holds the total warp sum!\n"
        "}\n\n"
        "// Execution trace in Warp 0 (32 threads):\n"
        "// Step 1: delta = 16 -> Lane 0 gets val + Lane 16 val\n"
        "// Step 2: delta = 8  -> Lane 0 gets + Lane 8\n"
        "// Step 3: delta = 4  -> Lane 0 gets + Lane 4\n"
        "// Step 4: delta = 2  -> Lane 0 gets + Lane 2\n"
        "// Step 5: delta = 1  -> Lane 0 gets + Lane 1 (DONE in 5 cycles!)"
    )
    p.font.name = FONT_MONO; p.font.size = Pt(9.5); p.font.color.rgb = GREEN

    add_alert(s20, "Warp shuffles are the standard modern building block for high-performance CUDA reductions, tensor cores, and LLM attention kernels.")
    add_notes(s20, "Explain Program 6.15. Highlight that 32 threads reduce to 1 in exactly 5 clock cycles using __shfl_down_sync. Contrast this with shared memory overhead.")

    # =========================================================================
    # SLIDE 21: HIERARCHICAL TWO-TIER MULTI-WARP REDUCTION
    # =========================================================================
    s21 = prs.slides.add_slide(blank_layout)
    set_slide_background(s21)
    add_header(s21, "Concept 20 // Hierarchical Reduction", 
               "Hierarchical Multi-Warp Block Reduction (1024 Threads)", 
               "Core Insight: Scale warp shuffles to full 1024-thread blocks using a two-tier hybrid architecture.")

    # Dual Tier Visual
    add_card(s21, Inches(0.8), Inches(1.9), Inches(11.733), Inches(4.3))
    tb = s21.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(11.3), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "🏛️ TWO-TIER HIERARCHICAL REDUCTION PIPELINE (1024 Threads per Block)"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    h_diag = (
        "  [1024 Threads in Block] = 32 Warps x 32 Threads\n"
        "  |\n"
        "  +---> TIER 1: INTRA-WARP REDUCTION (__shfl_down_sync)\n"
        "  |     • All 32 warps run WarpReduceSum() simultaneously in parallel registers!\n"
        "  |     • Takes only 5 clock cycles. Zero shared memory used.\n"
        "  |     • Result: Lane 0 of each warp holds that warp's partial sum (32 warp sums).\n"
        "  |\n"
        "  +---> INTER-WARP BUFFERING (Small Shared Memory Array)\n"
        "  |     • Lane 0 of each warp writes its sum to: `__shared__ float s_warp_sums[32];`\n"
        "  |     • Requires only ONE single `__syncthreads()` barrier across the block.\n"
        "  |\n"
        "  +---> TIER 2: FINAL WARP AGGREGATION (__shfl_down_sync)\n"
        "        • Warp 0 loads `s_warp_sums[lane]` (threads 0..31 hold the 32 warp sums).\n"
        "        • Warp 0 runs ONE final WarpReduceSum() in 5 clock cycles.\n"
        "        • Lane 0 holds the FINAL BLOCK SUM! Total Block Time: ~12 clock cycles!"
    )
    p = tf.add_paragraph(); p.text = h_diag; p.font.name = FONT_MONO; p.font.size = Pt(10); p.font.color.rgb = GREEN

    add_alert(s21, "Why this achieves peak hardware speedup: Instead of 1024 elements contending for shared memory, shared memory only stores 32 numbers! 99% of reduction happens in registers.")
    add_notes(s21, "Diagram the two-tier reduction: Tier 1 does warp shuffles across all 32 warps. Tier 2 puts the 32 warp sums into a tiny shared memory buffer, and Warp 0 sums them.")

    # =========================================================================
    # SLIDE 22: PACHECO TABLE 6.7 BENCHMARK SHOOTOUT
    # =========================================================================
    s22 = prs.slides.add_slide(blank_layout)
    set_slide_background(s22)
    add_header(s22, "Concept 21 // Performance Benchmarks", 
               "Textbook Performance Shootout: Table 6.7 Comprehensive Analysis", 
               "Core Insight: From Program 6.12 to 6.15: How algorithmic optimization delivers a 4.3x speedup on identical silicon.")

    # Comparison Table
    add_card(s22, Inches(0.8), Inches(1.9), Inches(11.733), Inches(4.3))
    tb = s22.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(11.3), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "📊 PETER S. PACHECO TABLE 6.7 (2^24 Elements = ~16.7 Million Trapezoids)"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    t67_data = (
        "Program Version | Implementation Technique      | Runtime (ms) | Speedup vs Baseline | Primary Bottleneck\n"
        "----------------+-------------------------------+--------------+---------------------+-----------------------------------\n"
        "Program 6.12    | atomicAdd Global Accumulator  | 1.62 ms      | 1.00x (Baseline)    | Global memory lock contention\n"
        "Program 6.13    | Block Loop Accumulator        | 1.15 ms      | 1.41x Speedup       | Intermediate register pressure\n"
        "Program 6.14    | Shared Memory Tree Reduction  | 0.65 ms      | 2.49x Speedup       | __syncthreads() barrier latency\n"
        "Program 6.15    | Warp Shuffle (__shfl_down_sync)| 0.38 ms     | 4.26x SPEEDUP!      | Pure memory bandwidth bound (PEAK)\n"
    )
    p = tf.add_paragraph(); p.text = t67_data; p.font.name = FONT_MONO; p.font.size = Pt(9.5); p.font.color.rgb = GREEN

    pacheco_takeaways = [
        ("Why Program 6.14 is 2.5x faster:", "Eliminated 99.9% of global atomicAdd calls by reducing inside each block using on-chip SRAM."),
        ("Why Program 6.15 is 4.3x faster:", "Eliminated shared memory bank lookups and block synchronization entirely within warps, reducing data exchange to 1-cycle register shuffles."),
        ("Amdahl's Law Ceiling:", "At 0.38ms, the kernel has saturated GPU memory bandwidth. Further optimization must focus on PCIe bus pipelining (CUDA Streams).")
    ]
    for title, desc in pacheco_takeaways:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = "• " + title + " "; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    add_alert(s22, "Exam Question: Compare the performance of Programs 6.12, 6.14, and 6.15 from Pacheco. Memorize the progression: atomicAdd (1.62ms) -> Shared Tree (0.65ms) -> Warp Shuffle (0.38ms).")
    add_notes(s22, "Table 6.7 is the grand summary of Pacheco Chapter 6. Walk through the numbers and explain why each step made the code faster.")

    # =========================================================================
    # SLIDE 23: VTU 10-MARK QUESTION BANK & MODEL ANSWERS
    # =========================================================================
    s23 = prs.slides.add_slide(blank_layout)
    set_slide_background(s23)
    add_header(s23, "Exam Masterclass // BCS702 Question Bank", 
               "VTU Module 5: 10-Mark Model Exam Questions & Answering Strategy", 
               "Core Insight: How to score maximum marks on Module 5 questions in university exams.")

    # Left: Top Questions
    add_card(s23, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.3))
    tb = s23.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "📝 TOP VTU 10-MARK QUESTIONS"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    qs = [
        ("Q1 (10 Marks):", "Explain CUDA thread hierarchy (Thread, Warp, Block, Grid) with neat diagrams and indexing formulas."),
        ("Q2 (10 Marks):", "Write a CUDA C program for vector addition. Explain memory allocation and data transfer APIs."),
        ("Q3 (10 Marks):", "What is warp branch divergence? Explain with Table 6.1 and code example how performance degrades."),
        ("Q4 (10 Marks):", "Explain Shared Memory 32-bank conflicts and how stride access affects memory throughput."),
        ("Q5 (10 Marks):", "Describe the Trapezoidal Rule parallelization using atomicAdd vs Shared Memory Tree Reduction.")
    ]
    for q, text in qs:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = q + " "; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = text; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    # Right: Answering Strategy
    add_card(s23, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.3), border_color=GREEN)
    tb = s23.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.2), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🎯 10-MARK SCORING STRATEGY"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = GREEN

    strat = [
        ("1. Always Draw a Diagram (3 Marks):", "Draw the Grid/Block hierarchy box, SM microarchitecture, or 32-bank memory radar."),
        ("2. State Exact Formulas (2 Marks):", "Write `my_i = blockDim.x * blockIdx.x + threadIdx.x` and the ceiling formula `(n + B - 1) / B`."),
        ("3. Provide Syntactically Valid Code (3 Marks):", "Include `__global__`, proper kernel launch `<<<grid, block>>>`, and `cudaMemcpy` calls."),
        ("4. Explain Hardware Tradeoffs (2 Marks):", "Mention warp size 32, PCIe latency overhead, and latency hiding via warp scheduling.")
    ]
    for s_title, desc in strat:
        p = tf.add_paragraph()
        r = p.add_run(); r.text = s_title + "\n"; r.font.bold = True; r.font.size = Pt(10.5); r.font.color.rgb = WHITE
        r = p.add_run(); r.text = desc; r.font.size = Pt(10); r.font.color.rgb = SLATE_LIGHT

    add_alert(s23, "Check your exam question paper: Module 5 questions almost always combine a theoretical diagram (5 Marks) with a complete CUDA kernel implementation (5 Marks).")
    add_notes(s23, "Go over the top 5 exam questions. Emphasize the four-part answering strategy: Diagram + Formulas + Code + Hardware Tradeoff.")

    # =========================================================================
    # SLIDE 24: SUMMARY CHEAT SHEET & FORMULA REFERENCE
    # =========================================================================
    s24 = prs.slides.add_slide(blank_layout)
    set_slide_background(s24)
    add_header(s24, "Mastery Summary // Complete Cheat Sheet", 
               "Module 5 Final Review: Core Formulas, APIs & Rules at a Glance", 
               "Core Insight: The ultimate one-page reference for your 2-hour session, teaching prep, and examinations.")

    # Master Table Card
    add_card(s24, Inches(0.8), Inches(1.9), Inches(11.733), Inches(4.3))
    tb = s24.shapes.add_textbox(Inches(1.0), Inches(2.1), Inches(11.3), Inches(3.9))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "📋 THE DEFINITIVE CUDA MODULE 5 FORMULA & API CHEAT SHEET"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN

    cheat_text = (
        "Concept                 | Formula / API Signature                            | Golden Architectural Rule\n"
        "------------------------+----------------------------------------------------+-------------------------------------------\n"
        "1D Thread Index         | my_i = blockDim.x * blockIdx.x + threadIdx.x       | Always guard with: if (my_i < n)\n"
        "1D Grid Ceiling         | gridDim.x = (n + blockDim.x - 1) / blockDim.x      | Prevents dropping final partial block\n"
        "2D Matrix Index         | row = bDim.y * bIdx.y + tIdx.y; col = ...          | Flattened offset: row * width + col\n"
        "Warp / Lane ID          | warp_id = my_i / 32;  lane_id = my_i % 32          | Hardware operates in 32-lane lockstep\n"
        "Memory Allocation       | cudaMalloc(&dev_ptr, bytes);  cudaFree(dev_ptr);   | Allocates in GPU VRAM off-chip\n"
        "Memory Transfer         | cudaMemcpy(dst, src, bytes, H2D | D2H);           | PCIe bottleneck: ~10,000 cycles latency\n"
        "Unified Memory          | cudaMallocManaged(&ptr, bytes);                    | Single virtual pointer, page migration\n"
        "Barrier Sync            | __syncthreads();                                   | Block scope only. NEVER inside divergent if!\n"
        "Bank Index              | bank_id = (word_address) % 32                      | Stride 1 = 1 cycle; Stride 32 = 32 cycles\n"
        "Warp Shuffle            | __shfl_down_sync(0xFFFFFFFF, val, delta);          | 1-cycle register swap; 0 shared memory\n"
    )
    p = tf.add_paragraph(); p.text = cheat_text; p.font.name = FONT_MONO; p.font.size = Pt(9.5); p.font.color.rgb = GREEN

    add_alert(s24, "Congratulations! You have completed the comprehensive Module 5 Masterclass. All concepts, code patterns, and hardware mechanics are now in your toolkit.", alert_color=GREEN, label="MASTERCLASS COMPLETE")
    add_notes(s24, "This concludes the Module 5 Masterclass presentation. All concepts from Pacheco Chapter 6 and the VTU BCS702 syllabus have been systematically mastered.")

    # Save presentation
    output_filename = "CUDA_Module5_Masterclass_Complete.pptx"
    prs.save(output_filename)
    print(f"Presentation saved successfully to: {output_filename}")
    return output_filename

if __name__ == "__main__":
    create_deck()
