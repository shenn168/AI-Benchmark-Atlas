// =============================================
// AI Benchmark Atlas — Initial Offline Knowledge Base
// 12 Core Benchmarks + Model Scores
// =============================================

const INITIAL_BENCHMARKS = [
  {
    id: "swe-bench-verified",
    name: "SWE-bench Verified",
    category: "Coding",
    icon: "🛠️",
    shortDescription: "Real-world software bug fixing from GitHub issues.",
    levels: {
      nonTechnical: {
        title: "Plain English",
        content: "The AI pretends to be a software engineer and fixes real bugs in big, messy real-world coding projects taken from actual GitHub issues. A high score means the AI is excellent at reading code, spotting problems, and writing correct fixes — basically ready for real software-development jobs."
      },
      intermediate: {
        title: "Intermediate",
        content: "SWE-bench Verified is a curated subset of SWE-bench where each task has been human-verified for correctness. The AI receives a GitHub issue description and the full repository context, then must produce a working patch (code diff) that resolves the issue. Tasks span real open-source Python projects like Django, Flask, scikit-learn, and sympy. The benchmark measures functional correctness — the generated patch must pass the project's existing test suite plus new tests specific to the issue. This tests the model's ability to understand large codebases, localize bugs, and produce minimal correct fixes."
      },
      expert: {
        title: "Expert / Research-Level",
        content: "SWE-bench Verified (Jimenez et al., 2024) is a refined partition of the original SWE-bench dataset. From the initial 2,294 task instances mined from 12 popular Python repositories, the Verified subset filters down to approximately 500 instances that have been manually validated by software engineers to confirm (a) the issue description is unambiguous, (b) the gold patch is correct and minimal, and (c) the test assertions faithfully capture the fix. Evaluation uses the pass@1 metric under an execution-based harness: the model's generated patch is applied to the repository at the exact pre-fix commit, and the full test suite (including fail-to-pass and pass-to-pass tests) is executed. The benchmark specifically targets long-context code understanding, cross-file dependency resolution, and adherence to project-specific conventions. State-of-the-art agents typically combine retrieval-augmented generation (RAG) over the repository with iterative self-debugging loops. Known limitations include the Python-only scope, potential train-test contamination for models trained on GitHub data post-2023, and the absence of multi-turn interactive debugging."
      }
    },
    scores: [
      { model: "Claude Opus 4", score: 72.5, date: "2025-06" },
      { model: "Claude Sonnet 4", score: 72.7, date: "2025-06" },
      { model: "GPT-4o", score: 38.4, date: "2024-05" },
      { model: "Gemini 2.5 Pro", score: 63.8, date: "2025-03" },
      { model: "o3", score: 69.1, date: "2025-04" }
    ],
    sources: [
      "https://www.swebench.com/",
      "https://arxiv.org/abs/2310.06770"
    ],
    dateAdded: "2025-01-01",
    lastUpdated: "2025-06-25"
  },
  {
    id: "swe-bench-pro",
    name: "SWE-bench Pro",
    category: "Coding",
    icon: "⚙️",
    shortDescription: "Tougher professional-grade software engineering challenges.",
    levels: {
      nonTechnical: {
        title: "Plain English",
        content: "A tougher, more professional version of the software-engineering test. The AI faces harder, more realistic coding challenges like a senior developer would. A high score means the AI can handle complex, production-level code problems that go beyond simple bug fixes."
      },
      intermediate: {
        title: "Intermediate",
        content: "SWE-bench Pro raises the difficulty bar from SWE-bench Verified by selecting issues that require deeper architectural understanding, multi-file changes, and more sophisticated reasoning. Tasks may involve refactoring, adding new features with backward compatibility, or resolving complex merge-conflict-style issues. The evaluation framework remains execution-based, but the complexity of required changes and the size of the relevant code context are significantly higher. Models must demonstrate not just bug-fixing ability but genuine software engineering judgment."
      },
      expert: {
        title: "Expert / Research-Level",
        content: "SWE-bench Pro extends the SWE-bench evaluation paradigm to a curated set of professional-difficulty instances that specifically target multi-step reasoning over large codebases. Selection criteria emphasize issues where the gold patch spans multiple files, requires understanding of design patterns (e.g., observer, factory, middleware chains), or involves non-trivial API surface changes with downstream effects. The benchmark also includes instances where the issue description is intentionally sparse, requiring the agent to infer intent from failing test cases or user-reported behavior. Evaluation still uses execution-based pass@1 against the project's test suite, but the expected patch complexity (measured in lines changed, files touched, and cyclomatic complexity delta) is substantially higher. This benchmark is specifically designed to separate models that can handle 'junior developer' tasks from those capable of 'senior engineer' reasoning — including impact analysis, regression awareness, and idiomatic code generation within established codebases."
      }
    },
    scores: [
      { model: "Claude Opus 4", score: 45.2, date: "2025-06" },
      { model: "Claude Sonnet 4", score: 36.6, date: "2025-06" },
      { model: "o3", score: 40.0, date: "2025-04" },
      { model: "Gemini 2.5 Pro", score: 32.9, date: "2025-03" }
    ],
    sources: [
      "https://www.swebench.com/"
    ],
    dateAdded: "2025-01-01",
    lastUpdated: "2025-06-25"
  },
  {
    id: "swe-bench-multilingual",
    name: "SWE-bench Multilingual",
    category: "Coding",
    icon: "🌐",
    shortDescription: "Bug-fixing across multiple programming languages.",
    levels: {
      nonTechnical: {
        title: "Plain English",
        content: "Same bug-fixing task, but now in many different programming languages like Python, Java, JavaScript, TypeScript, Go, Rust, and more. A high score means the AI is a flexible coder that works across languages, not just one — like a developer who's fluent in several programming languages."
      },
      intermediate: {
        title: "Intermediate",
        content: "SWE-bench Multilingual extends the SWE-bench framework beyond Python to real-world projects in Java, JavaScript, TypeScript, Go, Rust, C++, and other languages. Each task follows the same structure — a GitHub issue paired with a repository snapshot — but now the model must navigate language-specific idioms, build systems (Maven, npm, Cargo, etc.), testing frameworks, and type systems. This tests whether a model's coding ability is genuinely general-purpose or narrowly trained on one language's patterns."
      },
      expert: {
        title: "Expert / Research-Level",
        content: "SWE-bench Multilingual systematically evaluates cross-lingual transfer in code generation and repair tasks. The dataset is constructed by applying the SWE-bench mining methodology to popular repositories across 7+ programming languages, creating parallel evaluation conditions that control for task difficulty while varying the language dimension. Key evaluation challenges include: language-specific AST manipulation, heterogeneous build/test toolchains (pytest vs. JUnit vs. Jest vs. go test vs. cargo test), statically-typed vs. dynamically-typed language reasoning, and memory-management-aware patching (C/C++/Rust). The benchmark reveals whether models exhibit language bias — i.e., disproportionately strong Python performance due to training data distribution — and measures true polyglot software engineering capability. Evaluation uses language-appropriate execution harnesses with pass@1 against project-native test suites."
      }
    },
    scores: [
      { model: "Claude Opus 4", score: 61.7, date: "2025-06" },
      { model: "Claude Sonnet 4", score: 56.0, date: "2025-06" },
      { model: "o3", score: 48.3, date: "2025-04" },
      { model: "Gemini 2.5 Pro", score: 46.1, date: "2025-03" }
    ],
    sources: [
      "https://www.swebench.com/"
    ],
    dateAdded: "2025-01-01",
    lastUpdated: "2025-06-25"
  },
  {
    id: "swe-bench-multimodal",
    name: "SWE-bench Multimodal",
    category: "Coding",
    icon: "👁️",
    shortDescription: "Bug-fixing using both code and visual information.",
    levels: {
      nonTechnical: {
        title: "Plain English",
        content: "Bug-fixing where the AI also has to understand pictures or screenshots — like error messages shown as images, broken UI layouts, or visual glitches in apps. A high score means the AI can combine code knowledge with visual clues, which is very useful for real debugging in apps or websites."
      },
      intermediate: {
        title: "Intermediate",
        content: "SWE-bench Multimodal adds a visual dimension to software engineering tasks. Issues include screenshots of broken UIs, error dialogs, incorrect chart renderings, or visual regression images. The model must interpret both the textual issue description and the accompanying images to diagnose the problem and generate a code fix. This requires combining computer vision (understanding what looks wrong in a screenshot) with traditional code reasoning (knowing which CSS, HTML, or rendering logic to change). It tests the kind of visual debugging that frontend developers and QA engineers do daily."
      },
      expert: {
        title: "Expert / Research-Level",
        content: "SWE-bench Multimodal is a vision-language extension of the SWE-bench framework where task instances include one or more images as part of the issue context. Images may be screenshots of UI regressions, annotated error states, expected-vs-actual rendering comparisons, or data visualization artifacts. The model must jointly reason over the visual content and the codebase to produce a correct patch. This benchmark specifically targets the intersection of multimodal understanding and code generation — a capability gap in most current LLMs. Evaluation challenges include: pixel-level visual diff interpretation, mapping visual elements to DOM/rendering code, understanding CSS layout models from screenshots, and correlating visual artifacts with specific code paths. The execution-based evaluation remains identical to standard SWE-bench (pass@1 against test suites), but the information bottleneck introduced by visual-only context makes this substantially harder than text-only variants."
      }
    },
    scores: [
      { model: "Claude Opus 4", score: 45.0, date: "2025-06" },
      { model: "Claude Sonnet 4", score: 38.2, date: "2025-06" },
      { model: "o3", score: 28.0, date: "2025-04" },
      { model: "Gemini 2.5 Pro", score: 32.0, date: "2025-03" }
    ],
    sources: [
      "https://www.swebench.com/"
    ],
    dateAdded: "2025-01-01",
    lastUpdated: "2025-06-25"
  },
  {
    id: "terminal-bench-2",
    name: "Terminal-Bench 2.0",
    category: "Computer Use",
    icon: "💻",
    shortDescription: "Completing real tasks using the command-line terminal.",
    levels: {
      nonTechnical: {
        title: "Plain English",
        content: "The AI uses the old-school command line (that black screen with typed commands) to complete tasks like managing files, running programs, installing software, or configuring servers. A high score means the AI can act like a power-user or system administrator who's comfortable in the terminal."
      },
      intermediate: {
        title: "Intermediate",
        content: "Terminal-Bench 2.0 evaluates an AI's ability to operate a command-line interface to accomplish real system administration and development tasks. The AI must compose and execute shell commands, interpret their output, handle errors, chain commands with pipes, navigate file systems, manipulate text with tools like grep/sed/awk, manage processes, and configure system settings. Tasks range from simple (rename files matching a pattern) to complex (set up a web server, debug a failing build, parse log files). The benchmark measures task completion accuracy — not just whether the commands are syntactically correct, but whether the final system state matches the expected outcome."
      },
      expert: {
        title: "Expert / Research-Level",
        content: "Terminal-Bench 2.0 is an agentic benchmark that evaluates autonomous terminal operation in sandboxed Linux environments. The agent receives a natural language task description and must interact with a bash shell over multiple turns to achieve a specified end state. Evaluation is state-based: after the agent signals completion, a verification script inspects the filesystem, process table, network configuration, or application output to determine success. Tasks are stratified by difficulty tier: L1 (single-command), L2 (multi-step sequential), L3 (conditional/branching workflows), and L4 (open-ended system administration). Key challenges include: error recovery from failed commands, long-horizon planning with intermediate state verification, tool selection among overlapping utilities (e.g., find vs. locate vs. fd), and environment adaptation (detecting installed packages, shell flavor, OS distribution). The benchmark specifically penalizes unnecessary destructive operations and rewards idiomatic, minimal command sequences. Version 2.0 introduces longer task horizons and multi-service orchestration tasks (e.g., Docker, systemd, cron)."
      }
    },
    scores: [
      { model: "Claude Opus 4", score: 63.8, date: "2025-06" },
      { model: "Claude Sonnet 4", score: 55.0, date: "2025-06" },
      { model: "o3", score: 48.7, date: "2025-04" },
      { model: "Gemini 2.5 Pro", score: 42.0, date: "2025-03" }
    ],
    sources: [
      "https://terminal-bench.com/"
    ],
    dateAdded: "2025-01-01",
    lastUpdated: "2025-06-25"
  },
  {
    id: "gpqa-diamond",
    name: "GPQA Diamond",
    category: "Science",
    icon: "🔬",
    shortDescription: "Graduate-level science questions that are Google-proof.",
    levels: {
      nonTechnical: {
        title: "Plain English",
        content: "Extremely hard graduate-level science questions in physics, chemistry, and biology that are 'Google-proof' — even experts struggle, and you can't just look up the answer. A high score means the AI has deep, expert-level scientific knowledge and reasoning, almost like a PhD student acing a tough oral exam."
      },
      intermediate: {
        title: "Intermediate",
        content: "GPQA (Graduate-Level Google-Proof Q&A) Diamond is the hardest subset of the GPQA benchmark. Questions are written by PhD-level experts and validated to ensure that non-experts (even with Google access) cannot answer them, while domain experts can. Topics span physics, chemistry, and biology at graduate-to-research level. Questions are multiple-choice (4 options) but require deep, multi-step scientific reasoning — not just factual recall. The 'Diamond' subset is filtered for the highest difficulty and highest expert-vs-non-expert accuracy gap, making it a true test of whether the AI has internalized expert scientific knowledge."
      },
      expert: {
        title: "Expert / Research-Level",
        content: "GPQA Diamond (Rein et al., 2023) is the most discriminative partition of the GPQA benchmark, constructed via a rigorous adversarial filtering process. Domain expert PhDs write questions in their specialty, which are then validated by (a) other domain experts (target: >65% accuracy) and (b) skilled non-experts with unrestricted internet access (target: <35% accuracy). The Diamond subset retains only questions with the highest discrimination index (expert accuracy minus non-expert accuracy). The dataset contains approximately 198 questions spanning sub-fields including quantum mechanics, organic chemistry, molecular biology, astrophysics, and biochemistry. Evaluation is standard 4-way multiple-choice accuracy. The benchmark is specifically designed to resist test-time retrieval strategies and measure genuine parametric knowledge combined with multi-hop scientific reasoning. Known challenges include: questions requiring numerical estimation with physical intuition, multi-concept synthesis across sub-disciplines, and reasoning about edge cases in established scientific theories. GPQA Diamond has become a key discriminator between models that have surface-level scientific text exposure and those exhibiting deeper conceptual understanding."
      }
    },
    scores: [
      { model: "Claude Opus 4", score: 79.3, date: "2025-06" },
      { model: "Claude Sonnet 4", score: 76.0, date: "2025-06" },
      { model: "o3", score: 83.3, date: "2025-04" },
      { model: "GPT-4o", score: 53.6, date: "2024-05" },
      { model: "Gemini 2.5 Pro", score: 84.0, date: "2025-03" }
    ],
    sources: [
      "https://arxiv.org/abs/2311.12022"
    ],
    dateAdded: "2025-01-01",
    lastUpdated: "2025-06-25"
  },
  {
    id: "mmmu",
    name: "MMMU",
    category: "Multimodal",
    icon: "📚",
    shortDescription: "College-level questions combining text, images, and diagrams.",
    levels: {
      nonTechnical: {
        title: "Plain English",
        content: "College-level questions from many fields — science, art, business, law, engineering, and more — that require understanding both text AND images like diagrams, charts, photographs, and equations. A high score means the AI is great at 'seeing' pictures and text together and reasoning across subjects, like a smart student who can read a textbook with lots of charts."
      },
      intermediate: {
        title: "Intermediate",
        content: "MMMU (Massive Multi-discipline Multimodal Understanding) is a comprehensive benchmark with 11,500 questions spanning 30 subjects and 183 subfields across 6 core disciplines (Art & Design, Business, Science, Health & Medicine, Humanities & Social Science, Tech & Engineering). Each question includes one or more images (diagrams, charts, photographs, maps, musical scores, chemical structures, circuit diagrams, etc.) that are essential to answering correctly. The benchmark evaluates whether multimodal AI models can perform expert-level perception and reasoning — not just recognize objects in images, but integrate visual information with domain knowledge to solve real academic problems."
      },
      expert: {
        title: "Expert / Research-Level",
        content: "MMMU (Yue et al., 2024) evaluates multimodal models on expert-level tasks requiring college-level subject knowledge and deliberate cross-modal reasoning. The dataset is sourced from college exams, textbooks, and quizzes, ensuring ecological validity. Questions are categorized by cognitive skill level: recognition, comprehension, application, analysis, synthesis, and evaluation (aligned with Bloom's taxonomy). Image types are taxonomized into 30+ categories including function graphs, geometric diagrams, tables, medical images (X-rays, histology), engineering schematics, and artistic works. Evaluation uses both multiple-choice accuracy and open-ended response matching. Key benchmark properties: (1) images are not merely decorative — removing them makes questions unanswerable, (2) questions require domain-specific visual literacy (e.g., reading circuit diagrams differs from reading pie charts), (3) difficulty is calibrated to undergraduate-to-graduate level. MMMU has become the standard benchmark for measuring genuine multimodal reasoning as opposed to superficial image captioning. Known limitations include Western-centric academic framing and potential OCR-bypass strategies for text-heavy images."
      }
    },
    scores: [
      { model: "Claude Opus 4", score: 75.4, date: "2025-06" },
      { model: "Claude Sonnet 4", score: 72.0, date: "2025-06" },
      { model: "GPT-4o", score: 69.1, date: "2024-05" },
      { model: "Gemini 2.5 Pro", score: 81.7, date: "2025-03" },
      { model: "o3", score: 74.9, date: "2025-04" }
    ],
    sources: [
      "https://mmmu-benchmark.github.io/",
      "https://arxiv.org/abs/2311.16502"
    ],
    dateAdded: "2025-01-01",
    lastUpdated: "2025-06-25"
  },
  {
    id: "usamo",
    name: "USAMO",
    category: "Math",
    icon: "🧮",
    shortDescription: "Super-challenging mathematical olympiad proof problems.",
    levels: {
      nonTechnical: {
        title: "Plain English",
        content: "Super-challenging high-school math competition problems from the USA Mathematical Olympiad that require creative proofs and deep thinking. These aren't calculator problems — they require elegant reasoning and original ideas. A high score means the AI has outstanding math intelligence and can solve problems that even the best math students find brutal."
      },
      intermediate: {
        title: "Intermediate",
        content: "USAMO (United States of America Mathematical Olympiad) problems are proof-based competition mathematics at the highest pre-university level. Problems span number theory, combinatorics, geometry, and algebra, but rarely involve computation — instead they require constructing rigorous mathematical proofs. A typical USAMO problem might ask: 'Prove that for all positive integers n, [some property] holds.' The AI must produce a valid proof, not just a numerical answer. Evaluation requires human or AI judges to assess proof correctness, completeness, and rigor. This tests mathematical creativity, logical deduction, and the ability to discover non-obvious proof strategies."
      },
      expert: {
        title: "Expert / Research-Level",
        content: "The USAMO benchmark evaluates formal mathematical reasoning at the olympiad level, requiring models to generate complete proofs for competition problems historically given to the top ~250 high school mathematicians in the United States. Problems are drawn from the four classical olympiad domains: number theory (divisibility, modular arithmetic, Diophantine equations), combinatorics (counting arguments, graph theory, pigeonhole principle), geometry (synthetic and analytic, often involving clever constructions), and algebra (inequalities, functional equations, polynomials). Evaluation is the most significant challenge: proofs must be assessed for logical validity, not surface textual similarity. Current approaches use either (a) human expert grading on the official 0-7 USAMO rubric, (b) formal verification by translating to Lean/Isabelle/Coq proof assistants, or (c) LLM-as-judge with calibrated rubrics. The benchmark is particularly revealing because it requires long-horizon reasoning (proofs often span 20+ logical steps), creative insight (choosing the right proof technique is often the hardest part), and the ability to handle mathematical objects symbolically rather than numerically. State-of-the-art models typically achieve scores well below human gold medalists, though progress has been rapid."
      }
    },
    scores: [
      { model: "Claude Opus 4", score: 56.0, date: "2025-06" },
      { model: "Claude Sonnet 4", score: 40.0, date: "2025-06" },
      { model: "o3", score: 55.7, date: "2025-04" },
      { model: "Gemini 2.5 Pro", score: 50.0, date: "2025-03" }
    ],
    sources: [
      "https://artofproblemsolving.com/wiki/index.php/USAMO"
    ],
    dateAdded: "2025-01-01",
    lastUpdated: "2025-06-25"
  },
  {
    id: "graphwalks-bfs",
    name: "GraphWalks BFS 256K-1M",
    category: "Reasoning",
    icon: "🕸️",
    shortDescription: "Navigating enormous networks using breadth-first search.",
    levels: {
      nonTechnical: {
        title: "Plain English",
        content: "The AI has to explore and navigate enormous 'maps' (called graphs) with hundreds of thousands to a million connections using a specific method called Breadth-First Search. A high score means the AI can keep track of huge, complex networks of information without getting lost — useful for things like social networks, road systems, or knowledge databases."
      },
      intermediate: {
        title: "Intermediate",
        content: "GraphWalks BFS tests whether a model can correctly execute a Breadth-First Search traversal on large graphs — networks of interconnected nodes ranging from 256,000 to 1 million edges. The AI is given a textual description of a graph (as an adjacency list or edge list) and must output the correct BFS traversal order from a given starting node. This tests long-context processing (the graph description itself can be hundreds of thousands of tokens), working memory (keeping track of visited nodes and the BFS queue), and algorithmic faithfulness (following the BFS algorithm exactly, not approximating). It's a pure test of whether the model can act as a reliable computational engine over structured data."
      },
      expert: {
        title: "Expert / Research-Level",
        content: "GraphWalks BFS 256K-1M is a synthetic benchmark designed to stress-test the long-context reasoning and working memory capabilities of LLMs. Graphs are procedurally generated with controlled properties (node count, edge density, diameter, clustering coefficient) and serialized as textual adjacency lists. The model must perform exact BFS traversal — producing the correct visit order — which requires maintaining an implicit queue data structure and visited-set across the entire context window. The benchmark scales from 256K-token to 1M-token graph descriptions, directly testing the effective context utilization of models claiming ultra-long context windows. Key findings from this benchmark: (1) most models degrade severely beyond 128K tokens even with adequate context length, (2) performance is highly sensitive to graph serialization format, (3) models often exhibit 'shortcut' behaviors (approximating BFS with heuristics) rather than faithful algorithm execution. The benchmark is particularly important for evaluating claims about long-context capabilities, as it cannot be solved by attending only to local neighborhoods — correct BFS requires global state tracking. Metrics include exact-match traversal accuracy, Kendall tau correlation with gold ordering, and frontier correctness at each BFS level."
      }
    },
    scores: [
      { model: "Claude Opus 4", score: 90.0, date: "2025-06" },
      { model: "Claude Sonnet 4", score: 65.0, date: "2025-06" },
      { model: "Gemini 2.5 Pro", score: 71.8, date: "2025-03" },
      { model: "o3", score: 45.2, date: "2025-04" }
    ],
    sources: [],
    dateAdded: "2025-01-01",
    lastUpdated: "2025-06-25"
  },
  {
    id: "hle",
    name: "HLE (Humanity's Last Exam)",
    category: "General Intelligence",
    icon: "🧠",
    shortDescription: "The world's hardest questions across all subjects.",
    levels: {
      nonTechnical: {
        title: "Plain English",
        content: "Humanity's Last Exam is a collection of the world's hardest questions across many subjects. One version lets the AI use no extra tools; the other lets it use tools like calculators or search. A high score means the AI has near-human or super-human general intelligence and can tackle the toughest problems humanity can pose, especially when allowed to use helpful tools."
      },
      intermediate: {
        title: "Intermediate",
        content: "HLE (Humanity's Last Exam) is a crowd-sourced benchmark containing extremely difficult questions submitted by domain experts across dozens of fields — mathematics, physics, philosophy, medicine, law, history, linguistics, and more. Each question is designed to be at the frontier of human expertise. The benchmark is evaluated in two modes: (1) 'no tools' where the model relies purely on its parametric knowledge and reasoning, and (2) 'with tools' where the model can use calculators, code execution, or web search. The gap between these two scores reveals how much a model benefits from tool augmentation. HLE is designed to be a moving target — as AI improves, harder questions can be added to maintain discriminative power."
      },
      expert: {
        title: "Expert / Research-Level",
        content: "HLE (Humanity's Last Exam) is a community-driven, adversarially-constructed benchmark aiming to define the upper bound of AI evaluation. Questions are solicited from verified domain experts (PhD-holders, competition winners, professional practitioners) with the explicit instruction to 'write questions that no current AI can answer.' The dataset spans 50+ academic and professional domains with deliberate emphasis on questions requiring: (a) deep specialization (e.g., obscure theorems, rare clinical presentations), (b) multi-domain synthesis (e.g., combining physics intuition with biological constraints), (c) creative reasoning that resists pattern matching (e.g., novel mathematical conjectures). The dual evaluation protocol (no-tools vs. with-tools) is specifically designed to disentangle parametric knowledge from agentic capability. The 'with tools' setting allows code interpreter, calculator, and web retrieval — measuring the AI's ability to decompose hard problems and leverage external resources. Known challenges: question quality is heterogeneous due to crowd-sourcing, some questions may be ambiguous without additional context, and the benchmark's difficulty is poorly calibrated (some 'easy' questions slip through). Despite these limitations, HLE has become the de facto ceiling benchmark for general AI capability assessment."
      }
    },
    scores: [
      { model: "Claude Opus 4", score: 26.3, date: "2025-06", note: "with tools" },
      { model: "Claude Sonnet 4", score: 18.0, date: "2025-06", note: "with tools" },
      { model: "o3", score: 20.3, date: "2025-04", note: "with tools" },
      { model: "Gemini 2.5 Pro", score: 21.6, date: "2025-03", note: "with tools" },
      { model: "Claude Opus 4", score: 10.5, date: "2025-06", note: "no tools" },
      { model: "o3", score: 12.0, date: "2025-04", note: "no tools" }
    ],
    sources: [
      "https://lastexam.ai/"
    ],
    dateAdded: "2025-01-01",
    lastUpdated: "2025-06-25"
  },
  {
    id: "charxiv-reasoning",
    name: "CharXiv Reasoning",
    category: "Multimodal",
    icon: "📈",
    shortDescription: "Understanding and reasoning about charts from research papers.",
    levels: {
      nonTechnical: {
        title: "Plain English",
        content: "Understanding and reasoning about charts, graphs, and scientific figures taken from real research papers. There's a no-tools and with-tools version. A high score means the AI is excellent at 'reading' visual data like charts and answering tricky questions about them — a key skill for science, business, or data analysis."
      },
      intermediate: {
        title: "Intermediate",
        content: "CharXiv Reasoning presents the AI with charts and graphs extracted from real arXiv research papers, paired with questions that require understanding what the visualization shows and reasoning about it. Questions go beyond simple 'read the value' tasks — they ask about trends, comparisons, implications, and relationships between data series. The 'no tools' version tests pure visual reasoning; the 'with tools' version allows the AI to use code execution or other aids. This benchmark is particularly relevant for real-world applications where AI assists researchers, analysts, and business professionals in interpreting visual data."
      },
      expert: {
        title: "Expert / Research-Level",
        content: "CharXiv Reasoning (Wang et al., 2024) is a chart understanding benchmark sourced from figures in arXiv papers across multiple scientific disciplines. The dataset includes a taxonomy of chart types (line, bar, scatter, heatmap, box plot, violin plot, radar, Sankey, etc.) and question types (descriptive, comparative, inferential, and compositional). The 'Reasoning' split specifically targets questions that cannot be answered by simple visual extraction — they require multi-step inference, trend extrapolation, cross-series comparison, or understanding of statistical concepts depicted in the chart. Evaluation in the 'with tools' condition allows code interpreter access, enabling the model to extract numerical values and compute statistics programmatically. Key evaluation metrics include exact-match accuracy for closed-form questions and GPT-4-judge scoring for open-ended reasoning questions. The benchmark addresses a critical gap between generic VQA benchmarks (which use simple photos) and the specialized visual literacy required for scientific and analytical work. Known challenges include OCR noise from figure rasterization, ambiguous axis labels, and the need for domain-specific priors to interpret field-specific visualization conventions."
      }
    },
    scores: [
      { model: "Claude Opus 4", score: 90.0, date: "2025-06", note: "with tools" },
      { model: "Claude Sonnet 4", score: 85.4, date: "2025-06", note: "with tools" },
      { model: "Gemini 2.5 Pro", score: 85.0, date: "2025-03", note: "with tools" },
      { model: "o3", score: 80.3, date: "2025-04", note: "with tools" },
      { model: "Claude Opus 4", score: 85.0, date: "2025-06", note: "no tools" },
      { model: "Claude Sonnet 4", score: 80.0, date: "2025-06", note: "no tools" }
    ],
    sources: [
      "https://arxiv.org/abs/2406.18521",
      "https://charxiv.github.io/"
    ],
    dateAdded: "2025-01-01",
    lastUpdated: "2025-06-25"
  },
  {
    id: "osworld",
    name: "OSWorld",
    category: "Computer Use",
    icon: "🖥️",
    shortDescription: "Operating a full computer desktop to complete real tasks.",
    levels: {
      nonTechnical: {
        title: "Plain English",
        content: "The AI acts like a human sitting at a real computer desktop — clicking, typing, opening apps, filling forms, browsing the web, managing files, and more to finish everyday computer tasks. A high score means the AI can independently use a full computer operating system to get real work done, like a helpful personal assistant that actually controls your PC."
      },
      intermediate: {
        title: "Intermediate",
        content: "OSWorld evaluates AI agents on their ability to complete real-world tasks on a full computer operating system (Ubuntu Linux desktop). Tasks include things like: 'Download this PDF and rename it,' 'Create a spreadsheet with this data,' 'Find and change a system setting,' or 'Compose an email with an attachment.' The AI sees the screen as screenshots and can perform actions like mouse clicks, keyboard typing, and application interactions. This tests end-to-end computer operation — not just knowing what to do, but physically navigating a GUI to do it. The benchmark uses automated verification scripts to check whether the task was completed correctly."
      },
      expert: {
        title: "Expert / Research-Level",
        content: "OSWorld (Xie et al., 2024) is an agentic benchmark that evaluates multimodal AI agents on 369 real-world computer tasks executed in live Ubuntu virtual machines. The agent observes the desktop via screenshots (or accessibility trees) and acts through keyboard/mouse control APIs. Tasks span multiple applications (LibreOffice, Firefox, Thunderbird, GIMP, terminal, file manager, system settings) and are categorized by domain: office productivity, web browsing, system administration, multimedia editing, and software development. Each task has an automated execution-based evaluation function that inspects the final system state (file contents, application state, system configuration) for correctness. Key design principles: (1) tasks are grounded in real applications running on a real OS — not simulated environments, (2) multi-step tasks require sequential reasoning and error recovery, (3) the observation space (full desktop screenshots) is realistic and noisy. The benchmark reveals that even state-of-the-art multimodal agents struggle with tasks that humans find routine — highlighting gaps in spatial reasoning (knowing where to click), temporal planning (correct ordering of GUI interactions), and environment robustness (handling unexpected pop-ups, loading delays, or UI variations). OSWorld has become the primary benchmark for computer-use agent evaluation, succeeding earlier web-only benchmarks by demanding full-spectrum GUI interaction capability."
      }
    },
    scores: [
      { model: "Claude Opus 4", score: 49.2, date: "2025-06" },
      { model: "Claude Sonnet 4", score: 42.0, date: "2025-06" },
      { model: "o3", score: 35.6, date: "2025-04" },
      { model: "Gemini 2.5 Pro", score: 38.0, date: "2025-03" },
      { model: "GPT-4o", score: 12.2, date: "2024-05" }
    ],
    sources: [
      "https://os-world.github.io/",
      "https://arxiv.org/abs/2404.07972"
    ],
    dateAdded: "2025-01-01",
    lastUpdated: "2025-06-25"
  }
];

const BENCHMARK_CATEGORIES = [
  { id: "all", label: "All", icon: "📋" },
  { id: "Coding", label: "Coding", icon: "🛠️" },
  { id: "Science", label: "Science", icon: "🔬" },
  { id: "Math", label: "Math", icon: "🧮" },
  { id: "Multimodal", label: "Multimodal", icon: "📚" },
  { id: "Reasoning", label: "Reasoning", icon: "🕸️" },
  { id: "General Intelligence", label: "General Intelligence", icon: "🧠" },
  { id: "Computer Use", label: "Computer Use", icon: "🖥️" }
];