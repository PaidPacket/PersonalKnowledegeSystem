import React, { useEffect, useState } from 'react';
import {
  DEFAULT_PRESENTATION_META,
  PresentationMeta,
  generatePptxFile,
} from '../services/presentationGenerator';

interface PresentationDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PresentationDeckModal: React.FC<PresentationDeckModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [showNotes, setShowNotes] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [meta, setMeta] = useState<PresentationMeta>(DEFAULT_PRESENTATION_META);

  const TOTAL_SLIDES = 11;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide((s) => Math.min(TOTAL_SLIDES, s + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlide((s) => Math.max(1, s - 1));
      } else if (e.key === 'Escape') {
        if (isEditingMeta) {
          setIsEditingMeta(false);
        } else {
          onClose();
        }
      } else if (e.key.toLowerCase() === 'n') {
        setShowNotes((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditingMeta, onClose]);

  if (!isOpen) return null;

  const handleDownloadPptx = async () => {
    try {
      setIsExporting(true);
      await generatePptxFile(meta);
    } catch (err) {
      console.error('Failed to export PPTX:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Software Engineering Project Presentation Deck"
      className="fixed inset-0 z-50 flex flex-col bg-[#060e20] text-[#dae2fd] select-none"
    >
      {/* Top Deck Control Header */}
      <header className="h-14 px-6 bg-[#0b1326] border-b border-[#2d3449] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-[20px]">
              slideshow
            </span>
            <span className="font-semibold text-sm tracking-wide text-white">
              PROJECT PRESENTATION DECK
            </span>
            <span className="font-code-inline text-[11px] px-2 py-0.5 rounded bg-[#171f33] text-[#c0c1ff] border border-[#2d3449]">
              16:9 Academic Edition
            </span>
          </div>

          <div className="h-4 w-[1px] bg-[#2d3449]" />

          <span className="text-xs text-[#908fa0]">
            Slide <strong className="text-white">{currentSlide}</strong> of {TOTAL_SLIDES}
          </span>
        </div>

        {/* Center Slide Jump Quick Select */}
        <div className="hidden md:flex items-center gap-1 bg-[#131b2e] p-1 rounded border border-[#2d3449]">
          {Array.from({ length: TOTAL_SLIDES }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setCurrentSlide(num)}
              className={`w-7 h-6 rounded text-xs font-mono transition-colors ${
                currentSlide === num
                  ? 'bg-[#c0c1ff] text-[#0d0096] font-bold shadow-sm'
                  : 'text-[#908fa0] hover:text-white hover:bg-[#222a3d]'
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        {/* Actions: Edit Placeholders, Speaker Notes, PPTX Download, Close */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsEditingMeta((prev) => !prev)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              isEditingMeta
                ? 'bg-[#222a3d] border-[#4edea3] text-[#4edea3]'
                : 'bg-[#131b2e] border-[#2d3449] text-[#dae2fd] hover:bg-[#171f33]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">edit</span>
            <span className="hidden sm:inline">Edit Team &amp; Info</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNotes((prev) => !prev)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              showNotes
                ? 'bg-[#222a3d] border-[#c0c1ff] text-[#c0c1ff]'
                : 'bg-[#131b2e] border-[#2d3449] text-[#dae2fd] hover:bg-[#171f33]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">notes</span>
            <span className="hidden sm:inline">Presenter Notes (N)</span>
          </button>

          <a
            href="/api/download-presentation"
            download="Knowledge_Management_Platform_Presentation.pptx"
            className="px-3.5 py-1.5 rounded bg-[#4edea3] text-[#002113] hover:bg-[#6ffbbe] text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
            title="Direct Download PowerPoint Presentation (.pptx)"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Direct PPTX File</span>
          </a>

          <div className="h-4 w-[1px] bg-[#2d3449]" />

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#171f33] text-[#908fa0] hover:text-white transition-colors"
            title="Exit Presentation"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      </header>

      {/* Main Slide Viewing Stage */}
      <div className="flex-1 flex overflow-hidden relative justify-center items-center p-4 lg:p-8 bg-[#060e20]">
        {/* 16:9 Constrained Slide Surface */}
        <div className="w-full max-w-[1280px] aspect-[16/9] max-h-full bg-[#0b1326] border border-[#2d3449] rounded-xl shadow-2xl flex flex-col justify-between overflow-hidden relative">
          {/* Slide Content Rendered by Index */}
          <div className="flex-1 p-6 md:p-10 flex flex-col justify-between overflow-y-auto">
            {currentSlide === 1 && <Slide1Title meta={meta} />}
            {currentSlide === 2 && <Slide2Problem />}
            {currentSlide === 3 && <Slide3Solution />}
            {currentSlide === 4 && <Slide4Objectives />}
            {currentSlide === 5 && <Slide5CoreFeatures />}
            {currentSlide === 6 && <Slide6KnowledgeManagement />}
            {currentSlide === 7 && <Slide7AdvancedExploration />}
            {currentSlide === 8 && <Slide8Architecture />}
            {currentSlide === 9 && <Slide9Roadmap />}
            {currentSlide === 10 && <Slide10FutureScope />}
            {currentSlide === 11 && <Slide11Conclusion meta={meta} />}
          </div>

          {/* Slide Bottom Watermark Bar */}
          <footer className="h-9 px-8 bg-[#090f20] border-t border-[#1e293b] flex items-center justify-between text-[11px] text-[#908fa0] shrink-0 font-mono">
            <span>Knowledge Management &amp; Note-Taking Platform</span>
            <span>SLIDE {currentSlide} / {TOTAL_SLIDES}</span>
          </footer>
        </div>

        {/* Floating Left/Right Navigation Arrows */}
        <button
          type="button"
          onClick={() => setCurrentSlide((s) => Math.max(1, s - 1))}
          disabled={currentSlide === 1}
          aria-label="Previous Slide"
          className="absolute left-6 p-3 rounded-full bg-[#131b2e]/80 hover:bg-[#222a3d] border border-[#2d3449] text-white disabled:opacity-20 transition-all backdrop-blur-md shadow-lg"
        >
          <span className="material-symbols-outlined text-[24px]">chevron_left</span>
        </button>
        <button
          type="button"
          onClick={() => setCurrentSlide((s) => Math.min(TOTAL_SLIDES, s + 1))}
          disabled={currentSlide === TOTAL_SLIDES}
          aria-label="Next Slide"
          className="absolute right-6 p-3 rounded-full bg-[#131b2e]/80 hover:bg-[#222a3d] border border-[#2d3449] text-white disabled:opacity-20 transition-all backdrop-blur-md shadow-lg"
        >
          <span className="material-symbols-outlined text-[24px]">chevron_right</span>
        </button>
      </div>

      {/* Optional Presenter Speaker Notes Drawer */}
      {showNotes && (
        <aside className="h-40 bg-[#0b1326] border-t border-[#2d3449] p-4 px-8 overflow-y-auto shrink-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#4edea3] mb-1">
              <span>SPEAKER TALKING POINTS · SLIDE {currentSlide}</span>
              <button
                type="button"
                onClick={() => setShowNotes(false)}
                className="text-[#908fa0] hover:text-white"
              >
                Hide
              </button>
            </div>
            <p className="text-xs text-[#dae2fd] leading-relaxed">
              {SPEAKER_NOTES[currentSlide - 1]}
            </p>
          </div>
          <div className="text-[10px] text-[#908fa0] font-mono">
            Tip: Press <kbd className="bg-[#171f33] px-1 py-0.5 rounded border border-[#2d3449]">←</kbd> and <kbd className="bg-[#171f33] px-1 py-0.5 rounded border border-[#2d3449]">→</kbd> or <kbd className="bg-[#171f33] px-1 py-0.5 rounded border border-[#2d3449]">Space</kbd> to transition slides.
          </div>
        </aside>
      )}

      {/* Team Meta Editor Modal */}
      {isEditingMeta && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div className="w-full max-w-xl bg-[#0b1326] border border-[#2d3449] rounded-xl p-6 space-y-4 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2d3449] pb-3">
              <h3 className="font-semibold text-base text-[#4edea3]">
                Customize Presentation &amp; Team Details
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingMeta(false)}
                className="text-[#908fa0] hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#908fa0] mb-1">College / Institute Name</label>
                <input
                  type="text"
                  value={meta.collegeName}
                  onChange={(e) => setMeta({ ...meta, collegeName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-[#131b2e] border border-[#2d3449] text-white outline-none focus:border-[#4edea3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#908fa0] mb-1">Department</label>
                  <input
                    type="text"
                    value={meta.department}
                    onChange={(e) => setMeta({ ...meta, department: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-[#131b2e] border border-[#2d3449] text-white outline-none focus:border-[#4edea3]"
                  />
                </div>
                <div>
                  <label className="block text-[#908fa0] mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={meta.academicYear}
                    onChange={(e) => setMeta({ ...meta, academicYear: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-[#131b2e] border border-[#2d3449] text-white outline-none focus:border-[#4edea3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#908fa0] mb-1">Project Guide / Supervisor</label>
                <input
                  type="text"
                  value={meta.projectGuide}
                  onChange={(e) => setMeta({ ...meta, projectGuide: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-[#131b2e] border border-[#2d3449] text-white outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="block text-[#908fa0] mb-1">Seven Team Members &amp; Roll Numbers</label>
                <div className="space-y-1.5">
                  {meta.teamMembers.map((m, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) => {
                          const updated = [...meta.teamMembers];
                          updated[idx].name = e.target.value;
                          setMeta({ ...meta, teamMembers: updated });
                        }}
                        placeholder={`Member ${idx + 1} Name`}
                        className="flex-1 px-2.5 py-1 rounded bg-[#131b2e] border border-[#2d3449] text-white outline-none"
                      />
                      <input
                        type="text"
                        value={m.rollNo}
                        onChange={(e) => {
                          const updated = [...meta.teamMembers];
                          updated[idx].rollNo = e.target.value;
                          setMeta({ ...meta, teamMembers: updated });
                        }}
                        placeholder="Roll No"
                        className="w-32 px-2.5 py-1 rounded bg-[#131b2e] border border-[#2d3449] text-white outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#2d3449]">
              <button
                type="button"
                onClick={() => setIsEditingMeta(false)}
                className="px-4 py-1.5 rounded bg-[#4edea3] text-[#002113] font-semibold text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// INDIVIDUAL SLIDE RENDERING COMPONENTS
// ==========================================

const SlideHeader: React.FC<{ kicker: string; title: string }> = ({ kicker, title }) => (
  <div className="border-b border-[#2d3449]/70 pb-3 mb-4">
    <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#4edea3] block mb-0.5">
      {kicker}
    </span>
    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
      {title}
    </h2>
  </div>
);

// SLIDE 1
const Slide1Title: React.FC<{ meta: PresentationMeta }> = ({ meta }) => (
  <div className="flex flex-col justify-between h-full py-2">
    <div className="text-center space-y-1">
      <div className="text-[11px] font-mono tracking-wider uppercase text-[#4edea3] font-semibold">
        {meta.collegeName}
      </div>
      <div className="text-xs text-[#908fa0]">
        {meta.department} · {meta.academicYear}
      </div>
    </div>

    <div className="text-center space-y-3 my-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#131b2e] border border-[#2d3449] text-xs text-[#c0c1ff] mb-1">
        <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
        Final Software Engineering Project Defense
      </div>
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
        Knowledge Management &amp; Note-Taking Platform
      </h1>
      <p className="text-sm md:text-base text-[#c0c1ff] max-w-2xl mx-auto font-medium">
        A centralized workspace to create, organize, connect, and explore knowledge.
      </p>

      {/* Guide Banner */}
      <div className="inline-block mt-2 px-4 py-1.5 rounded-lg bg-[#131b2e] border border-[#2d3449] text-xs text-[#dae2fd]">
        <span className="text-[#908fa0] uppercase tracking-wider text-[10px] font-mono mr-2">
          Project Guide:
        </span>
        <strong className="text-[#4edea3] font-semibold">{meta.projectGuide}</strong>
      </div>
    </div>

    {/* Team Members Grid (7 members) */}
    <div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-[#908fa0] mb-2 font-semibold text-center">
        PROJECT DEVELOPMENT TEAM
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {meta.teamMembers.map((m, i) => (
          <div
            key={i}
            className="p-2 rounded bg-[#131b2e] border border-[#2d3449] text-center"
          >
            <div className="text-[11px] font-semibold text-white truncate">{m.name}</div>
            <div className="text-[10px] text-[#c0c1ff] font-mono truncate">{m.rollNo}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// SLIDE 2
const Slide2Problem: React.FC = () => (
  <div className="flex flex-col justify-between h-full">
    <SlideHeader
      kicker="01 / Context &amp; Problem Analysis"
      title="The Problem with Scattered Knowledge"
    />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 items-center">
      <div className="space-y-3">
        <div className="p-3.5 rounded-lg bg-[#131b2e] border border-[#2d3449]">
          <h4 className="text-sm font-semibold text-[#ffb95f] flex items-center gap-2">
            <span>📁</span> Information Fragmentation
          </h4>
          <p className="text-xs text-[#c7c4d7] mt-1 leading-relaxed">
            Notes, specifications, and code snippets are spread across disconnected editors, chat logs, and local text files.
          </p>
        </div>
        <div className="p-3.5 rounded-lg bg-[#131b2e] border border-[#2d3449]">
          <h4 className="text-sm font-semibold text-[#ffb95f] flex items-center gap-2">
            <span>📉</span> Organization Scale Breakdown
          </h4>
          <p className="text-xs text-[#c7c4d7] mt-1 leading-relaxed">
            Rigid folder hierarchies fail when knowledge belongs to multiple domains (e.g. Concurrency &amp; System Design).
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-3.5 rounded-lg bg-[#131b2e] border border-[#2d3449]">
          <h4 className="text-sm font-semibold text-[#ffb95f] flex items-center gap-2">
            <span>🔗</span> Disconnected Insights &amp; Isolation
          </h4>
          <p className="text-xs text-[#c7c4d7] mt-1 leading-relaxed">
            Traditional tools treat files as isolated islands. Bidirectional references and relational graphs are missing.
          </p>
        </div>
        <div className="p-3.5 rounded-lg bg-[#131b2e] border border-[#2d3449]">
          <h4 className="text-sm font-semibold text-[#ffb95f] flex items-center gap-2">
            <span>⏳</span> Slow Retrieval &amp; Lost Context
          </h4>
          <p className="text-xs text-[#c7c4d7] mt-1 leading-relaxed">
            Users waste valuable hours manually re-searching concepts because contextual connections were never mapped.
          </p>
        </div>
      </div>
    </div>
  </div>
);

// SLIDE 3
const Slide3Solution: React.FC = () => (
  <div className="flex flex-col justify-between h-full">
    <SlideHeader
      kicker="02 / Architectural Proposition"
      title="One Connected Knowledge Workspace"
    />
    <p className="text-xs text-[#c0c1ff] mb-3">
      A unified software engineering environment that elevates passive note storage into an interconnected personal knowledge graph.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 flex-1 items-stretch">
      {[
        { step: '01', title: 'Create Notes', desc: 'Markdown-compatible rich editor with YAML frontmatter, task checklists, and code snippets.' },
        { step: '02', title: 'Organize Files', desc: 'Dual-paradigm structure: hierarchical folder trees + non-hierarchical taxonomic tags (#tag).' },
        { step: '03', title: 'Connect Links', desc: 'First-class [[WikiLinks]] with alias and heading resolution, deriving bidirectional relationships.' },
        { step: '04', title: 'Explore Visually', desc: 'Interactive force-directed Knowledge Graph and spatial 2D Canvas for architectural concept mapping.' },
        { step: '05', title: 'Retrieve Instantly', desc: 'Sub-millisecond Cmd+K command palette with full-vault indexing and local-first IndexedDB storage.' },
      ].map((p, idx) => (
        <div
          key={p.step}
          className={`p-3.5 rounded-lg bg-[#131b2e] border flex flex-col justify-between ${
            idx === 2 ? 'border-[#4edea3] shadow-lg' : 'border-[#2d3449]'
          }`}
        >
          <div>
            <span className="text-2xl font-extrabold text-[#4edea3] font-mono">{p.step}</span>
            <h4 className="text-sm font-bold text-white mt-2">{p.title}</h4>
            <p className="text-[11px] text-[#908fa0] mt-2 leading-relaxed">{p.desc}</p>
          </div>
          <span className="text-[10px] text-[#c0c1ff] font-mono mt-3">Verified Module</span>
        </div>
      ))}
    </div>
  </div>
);

// SLIDE 4
const Slide4Objectives: React.FC = () => (
  <div className="flex flex-col justify-between h-full">
    <SlideHeader
      kicker="03 / Requirements &amp; Scope"
      title="Project Objectives &amp; Target Users"
    />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 items-stretch">
      {/* Objectives */}
      <div className="p-4 rounded-xl bg-[#131b2e] border border-[#2d3449] flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#4edea3] mb-3">
            Key Engineering Objectives
          </h3>
          <ul className="space-y-2.5 text-xs text-[#dae2fd]">
            <li className="flex items-start gap-2">
              <span className="text-[#4edea3] font-bold">✓</span>
              <span><strong>Structured Technical Workspace:</strong> High-density 3-pane layout optimized for deep reading and system design writing.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#4edea3] font-bold">✓</span>
              <span><strong>Markdown Integrity:</strong> Full round-trip fidelity between visual editing, YAML frontmatter, and canonical raw markdown files.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#4edea3] font-bold">✓</span>
              <span><strong>Automated Link Derivation:</strong> Dynamic calculation of incoming backlinks and outgoing references without manual indexing.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#4edea3] font-bold">✓</span>
              <span><strong>Local-First Guarantee:</strong> 100% functionality offline using browser IndexedDB and Web Storage with zero telemetry.</span>
            </li>
          </ul>
        </div>
        <div className="pt-3 border-t border-[#2d3449] text-[11px] text-[#908fa0] font-mono">
          System Standard: RFC 7763 / CommonMark &amp; Obsidian WikiLink Syntax
        </div>
      </div>

      {/* Target Users */}
      <div className="p-4 rounded-xl bg-[#131b2e] border border-[#2d3449] flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#c0c1ff] mb-3">
            Target User Personas
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-2 rounded bg-[#0b1326] border border-[#2d3449]/60">
              <strong className="text-white block">Software Engineers &amp; Architects</strong>
              <span className="text-[#908fa0] text-[11px]">System design checklists, concurrency invariants, ADRs, and code references.</span>
            </div>
            <div className="p-2 rounded bg-[#0b1326] border border-[#2d3449]/60">
              <strong className="text-white block">Researchers &amp; Academics</strong>
              <span className="text-[#908fa0] text-[11px]">Cross-disciplinary literature mapping, citations, and structured YAML metadata.</span>
            </div>
            <div className="p-2 rounded bg-[#0b1326] border border-[#2d3449]/60">
              <strong className="text-white block">Engineering Students</strong>
              <span className="text-[#908fa0] text-[11px]">Course modules, daily revision journals, algorithm summaries, and exam prep.</span>
            </div>
          </div>
        </div>
        <div className="pt-3 border-t border-[#2d3449] text-[11px] text-[#908fa0] font-mono">
          Focus: Deep technical endurance with zero UI clutter
        </div>
      </div>
    </div>
  </div>
);

// SLIDE 5
const Slide5CoreFeatures: React.FC = () => (
  <div className="flex flex-col justify-between h-full">
    <SlideHeader
      kicker="04 / Core Features"
      title="Desktop-Grade Note-Taking Workspace"
    />
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 items-center">
      {/* Feature Bullet List */}
      <div className="md:col-span-5 space-y-2.5">
        {[
          { title: 'Markdown Rich Editor', detail: 'Live prose preview, syntax-highlighted Java/TS code blocks, and 1-click copy.' },
          { title: 'Hierarchical Explorer', detail: 'Nested folder trees with breadcrumbs, quick filter (⌘F), and pinned bookmarks.' },
          { title: 'Multi-Tab Navigation', detail: 'Simultaneous note tabs with active indicators, closing triggers, and split panes.' },
          { title: 'Interactive Checklists', detail: 'Persistent task states, strikes, and inline code formatting for tech workflows.' },
          { title: 'Live Document Metrics', detail: 'Real-time word, character, and read-time counters in a fixed bottom status bar.' },
        ].map((item, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-[#131b2e] border border-[#2d3449]">
            <h4 className="text-xs font-bold text-[#4edea3]">{item.title}</h4>
            <p className="text-[11px] text-[#c7c4d7] mt-0.5 leading-snug">{item.detail}</p>
          </div>
        ))}
      </div>

      {/* Embedded Real Project Screenshot */}
      <div className="md:col-span-7 h-full flex flex-col justify-center">
        <div className="rounded-xl overflow-hidden border border-[#2d3449] shadow-xl bg-[#0b1326]">
          <div className="h-6 px-3 bg-[#131b2e] border-b border-[#2d3449] flex items-center justify-between text-[10px] text-[#908fa0] font-mono">
            <span>ACTUAL IMPLEMENTATION · 3-PANE EDITOR WORKSPACE</span>
            <span>1440 × 900</span>
          </div>
          <img
            src="/presentation/editor.png"
            alt="Actual Editor Workspace Screenshot"
            className="w-full h-auto object-cover max-h-[300px]"
          />
        </div>
        <span className="text-[10px] text-[#908fa0] text-center mt-1.5 font-mono">
          Figure 5.1: Live screenshot of Your Notes 3-pane artisan editor with YAML properties &amp; comparison matrix.
        </span>
      </div>
    </div>
  </div>
);

// SLIDE 6
const Slide6KnowledgeManagement: React.FC = () => (
  <div className="flex flex-col justify-between h-full">
    <SlideHeader
      kicker="05 / Relational Intelligence"
      title="Turning Notes into Connected Knowledge"
    />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 items-stretch">
      {[
        {
          term: 'Internal [[WikiLinks]]',
          subtitle: 'Bidirectional Synaptic Linking',
          desc: 'Clickable links connecting notes effortlessly. Automatically resolves by note title, filename, or YAML frontmatter alias, supporting section anchors (#Section).',
          code: '[[Virtual Threads & Loom|Loom Architecture]]',
        },
        {
          term: 'Automated Backlink Index',
          subtitle: 'Contextual Ingestion Engine',
          desc: 'Reverse lookup index identifying all notes pointing to the active document. Displays live contextual surrounding sentences so users understand link relevance.',
          code: 'Linked References (4) → System Design Checklist',
        },
        {
          term: 'Taxonomic Tags (#tags)',
          subtitle: 'Fluid Cross-Folder Categorization',
          desc: 'Non-hierarchical classification allowing documents across 01 - Computer Science and 03 - Distributed Systems to be queried by #java/concurrency or #system-design.',
          code: '#java/concurrency (14) · #architecture/oop (28)',
        },
        {
          term: 'YAML Frontmatter Properties',
          subtitle: 'Structured Data Integrity',
          desc: 'Standardized document metadata specifying status (in-progress, verified), creation dates, priority (high, medium), and search aliases for deterministic sorting.',
          code: 'tags: [java, loom] · status: in-progress · priority: high',
        },
      ].map((km, i) => (
        <div key={i} className="p-4 rounded-xl bg-[#131b2e] border border-[#2d3449] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{km.term}</h3>
              <span className="text-[10px] font-mono text-[#4edea3] uppercase font-semibold">
                {km.subtitle}
              </span>
            </div>
            <p className="text-xs text-[#c7c4d7] mt-2 leading-relaxed">{km.desc}</p>
          </div>
          <div className="mt-3 p-2 rounded bg-[#0b1326] border border-[#2d3449]/60 font-mono text-[11px] text-[#c0c1ff] truncate">
            {km.code}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// SLIDE 7
const Slide7AdvancedExploration: React.FC = () => (
  <div className="flex flex-col justify-between h-full">
    <SlideHeader
      kicker="06 / Advanced Exploration"
      title="Explore Information Beyond Folders"
    />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 items-stretch">
      {/* Graph Card */}
      <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#2d3449] flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-mono text-[#4edea3] uppercase font-bold">Topological Visualizer</span>
          <h3 className="text-sm font-bold text-white mt-0.5">Interactive Knowledge Graph</h3>
          <p className="text-[11px] text-[#908fa0] mt-1.5 leading-snug">
            Force-directed node graph mapping document connections with in-degree/out-degree telemetry and domain filtering.
          </p>
        </div>
        <div className="rounded-lg overflow-hidden border border-[#2d3449] my-2">
          <img
            src="/presentation/graph.png"
            alt="Knowledge Graph View"
            className="w-full h-32 object-cover"
          />
        </div>
        <span className="text-[10px] text-[#c0c1ff] font-mono">12 Nodes · 29 Directed Synapses</span>
      </div>

      {/* Canvas Card */}
      <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#4edea3] flex flex-col justify-between shadow-lg">
        <div>
          <span className="text-[10px] font-mono text-[#4edea3] uppercase font-bold">Spatial Decomposition</span>
          <h3 className="text-sm font-bold text-white mt-0.5">Spatial Architecture Canvas</h3>
          <p className="text-[11px] text-[#908fa0] mt-1.5 leading-snug">
            2D freeform concept map connecting cards with directional vectors, linked directly to vault documentation.
          </p>
        </div>
        <div className="rounded-lg overflow-hidden border border-[#2d3449] my-2">
          <img
            src="/presentation/canvas.png"
            alt="Spatial Canvas View"
            className="w-full h-32 object-cover"
          />
        </div>
        <span className="text-[10px] text-[#4edea3] font-mono">Direct Note-Card Linking</span>
      </div>

      {/* Structured Views */}
      <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#2d3449] flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-mono text-[#ffb95f] uppercase font-bold">Database Views</span>
          <h3 className="text-sm font-bold text-white mt-0.5">Structured Technical Matrix</h3>
          <p className="text-[11px] text-[#908fa0] mt-1.5 leading-snug">
            Tabular comparison matrices with clean tabular numerals, property querying, and frontmatter sorting.
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-[#0b1326] border border-[#2d3449] text-[10px] font-mono space-y-1.5 my-2">
          <div className="flex justify-between border-b border-[#2d3449] pb-1 text-[#908fa0]">
            <span>Metric</span>
            <span>Platform</span>
            <span className="text-[#4edea3]">Virtual</span>
          </div>
          <div className="flex justify-between text-white">
            <span>Stack Size</span>
            <span>~1 MB</span>
            <span className="text-[#4edea3]">~few KB</span>
          </div>
          <div className="flex justify-between text-white">
            <span>Switch Time</span>
            <span>~1-2 µs</span>
            <span className="text-[#4edea3]">~nanosecs</span>
          </div>
        </div>
        <span className="text-[10px] text-[#c0c1ff] font-mono">Zero-Jitter Tabular Numerals</span>
      </div>
    </div>
  </div>
);

// SLIDE 8
const Slide8Architecture: React.FC = () => (
  <div className="flex flex-col justify-between h-full">
    <SlideHeader
      kicker="07 / Software Architecture"
      title="Proposed Technology Stack &amp; Layered Architecture"
    />
    <div className="space-y-3 flex-1 flex flex-col justify-center">
      {[
        {
          layer: 'Layer 1: Presentation & Workspace UI',
          tech: 'React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · Obsidian Slate Tokens · Material Icons',
          role: 'Renders 3-pane desktop stage, accessibility tree, tab controls, and fluid responsive layouts.',
          color: 'border-[#4edea3] text-[#4edea3]',
        },
        {
          layer: 'Layer 2: Editor Engine & Domain Graph AST',
          tech: 'Custom Markdown AST / Tiptap AST · vaultEngine.ts · Pure Unit-Tested Logic (node:test)',
          role: 'Parses [[WikiLinks]], resolves aliases/headings, rewrites links on rename, and calculates backlinks.',
          color: 'border-[#c0c1ff] text-[#c0c1ff]',
        },
        {
          layer: 'Layer 3: Local Persistence & Storage',
          tech: 'IndexedDB (YourNotesKnowledgeVaultDB) · Web Storage API · Dexie-Ready Repository Pattern',
          role: 'Local-first offline operation. Instant hydration from localStorage + asynchronous transactional IDB writes.',
          color: 'border-[#ffb95f] text-[#ffb95f]',
        },
        {
          layer: 'Layer 4: High-Thinking & Future Cloud Backend',
          tech: 'Express.js · @google/genai (gemini-4-argon, ThinkingLevel.HIGH) · Future: Supabase PostgreSQL & RLS',
          role: 'Server-side high-thinking architectural synthesis; future E2EE delta sync and user authentication.',
          color: 'border-[#2d3449] text-[#dae2fd]',
        },
      ].map((l, i) => (
        <div key={i} className={`p-3 rounded-lg bg-[#131b2e] border ${l.color}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">{l.layer}</span>
            <span className="text-[10px] font-mono text-[#c0c1ff] bg-[#0b1326] px-2 py-0.5 rounded border border-[#2d3449]">
              {l.tech}
            </span>
          </div>
          <p className="text-[11px] text-[#c7c4d7] mt-1">{l.role}</p>
        </div>
      ))}
    </div>
  </div>
);

// SLIDE 9
const Slide9Roadmap: React.FC = () => (
  <div className="flex flex-col justify-between h-full">
    <SlideHeader
      kicker="08 / Engineering Roadmap"
      title="Implementation Milestones &amp; Verification Status"
    />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 items-stretch">
      {[
        { id: 'M1', title: 'Data Model & Specification', status: 'VERIFIED', desc: 'Normalized NoteRecord, FolderRecord, and Link AST specifications.' },
        { id: 'M2', title: 'Obsidian Slate UI Shell', status: 'VERIFIED', desc: '3-pane workspace with top bar, left rail, center stage & inspector.' },
        { id: 'M3', title: 'Editor & Local Persistence', status: 'VERIFIED', desc: 'IndexedDB & localStorage engine with .md import/export.' },
        { id: 'M4', title: 'WikiLinks & Rename Engine', status: 'VERIFIED', desc: 'Bidirectional link resolution, backlinks & rename propagation.' },
        { id: 'M5', title: 'Daily Journal & Bookmarks', status: 'VERIFIED', desc: 'Timestamped engineering logs, bookmarks, and TOC outline.' },
        { id: 'M6', title: 'Graph & Spatial Canvas', status: 'VERIFIED', desc: 'Interactive node-link graph visualizer and spatial concept canvas.' },
        { id: 'M7', title: 'High-Thinking AI Engine', status: 'VERIFIED', desc: 'Server-side gemini-4-argon synthesis with ThinkingLevel.HIGH.' },
        { id: 'M8', title: 'End-to-End Automated Tests', status: 'VERIFIED', desc: 'Unit testing via node:test and Playwright headless verification.' },
      ].map((m) => (
        <div key={m.id} className="p-3 rounded-lg bg-[#131b2e] border border-[#2d3449] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-base font-extrabold text-[#4edea3] font-mono">{m.id}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00a572]/20 text-[#4edea3] font-bold">
                {m.status}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white mt-1.5">{m.title}</h4>
            <p className="text-[10px] text-[#908fa0] mt-1 leading-snug">{m.desc}</p>
          </div>
          <span className="text-[9px] text-[#c0c1ff] font-mono mt-2">Zero Regressions</span>
        </div>
      ))}
    </div>
  </div>
);

// SLIDE 10
const Slide10FutureScope: React.FC = () => (
  <div className="flex flex-col justify-between h-full">
    <SlideHeader
      kicker="09 / Future Horizons"
      title="Future Scope &amp; Planned Capabilities"
    />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 flex-1 items-stretch">
      {[
        { cat: 'Cloud Sync', title: 'End-to-End Encrypted Sync', desc: 'Delta-based cloud sync using Supabase PostgreSQL with Row Level Security (RLS).' },
        { cat: 'Collaboration', title: 'Real-Time Multi-User CRDTs', desc: 'Simultaneous multiplayer editing on shared engineering canvases and note buffers.' },
        { cat: 'Ecosystem', title: 'Sandboxed Plugin System', desc: 'Community extensions for LaTeX rendering, Mermaid diagrams, and Git commits.' },
        { cat: 'Cross-Platform', title: 'Desktop & Mobile Wrappers', desc: 'Lightweight Tauri/Electron desktop client with local filesystem access.' },
        { cat: 'Intelligence', title: 'Semantic Vector Embeddings', desc: 'AI-assisted automatic link suggestions, semantic search, and document summarization.' },
        { cat: 'Publishing', title: 'Digital Garden Web Export', desc: '1-click static site generation to publish interactive notes as public documentation.' },
      ].map((item, i) => (
        <div key={i} className="p-3.5 rounded-lg bg-[#131b2e] border border-[#2d3449] flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#ffb95f]">{item.cat}</span>
            <h4 className="text-xs font-bold text-white mt-1">{item.title}</h4>
            <p className="text-[11px] text-[#c7c4d7] mt-1.5 leading-relaxed">{item.desc}</p>
          </div>
          <span className="text-[10px] text-[#4edea3] font-mono mt-2">Post-Release Target</span>
        </div>
      ))}
    </div>
  </div>
);

// SLIDE 11
const Slide11Conclusion: React.FC<{ meta: PresentationMeta }> = ({ meta }) => (
  <div className="flex flex-col justify-between h-full py-2">
    <SlideHeader
      kicker="10 / Project Evaluation"
      title="Building a Connected Knowledge System"
    />

    {/* Centerpiece Quote */}
    <div className="my-auto p-6 rounded-2xl bg-[#131b2e] border-2 border-[#4edea3] text-center max-w-3xl mx-auto shadow-2xl">
      <div className="text-xs font-mono uppercase tracking-widest text-[#4edea3] mb-2 font-bold">
        CORE PHILOSOPHY &amp; IMPACT
      </div>
      <blockquote className="text-xl md:text-2xl font-bold text-white tracking-tight leading-relaxed">
        “Not just a place to store notes — a workspace to build, connect, and explore knowledge.”
      </blockquote>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs font-mono text-[#c0c1ff]">
        <span>Local-First Longevity</span>
        <span>•</span>
        <span>Bidirectional [[WikiLinks]]</span>
        <span>•</span>
        <span>Topological Graph &amp; Canvas</span>
        <span>•</span>
        <span>High-Thinking Synthesis</span>
      </div>
    </div>

    {/* Final 3 Takeaways */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
      <div className="p-3 rounded-lg bg-[#131b2e] border border-[#2d3449] text-center">
        <strong className="text-xs text-white block">1. Technical Ergonomics</strong>
        <span className="text-[11px] text-[#908fa0]">Markdown fidelity with distraction-free 3-pane spatial density.</span>
      </div>
      <div className="p-3 rounded-lg bg-[#131b2e] border border-[#2d3449] text-center">
        <strong className="text-xs text-white block">2. Relational Intelligence</strong>
        <span className="text-[11px] text-[#908fa0]">Knowledge graphs &amp; backlinks replace rigid, dead folder silos.</span>
      </div>
      <div className="p-3 rounded-lg bg-[#131b2e] border border-[#2d3449] text-center">
        <strong className="text-xs text-white block">3. Data Sovereignty</strong>
        <span className="text-[11px] text-[#908fa0]">Offline-first IndexedDB guarantees user ownership forever.</span>
      </div>
    </div>

    {/* Evaluation Thank You */}
    <div className="flex items-center justify-between pt-3 border-t border-[#2d3449] text-xs">
      <div className="text-[#908fa0]">
        Supervised by <strong className="text-white">{meta.projectGuide}</strong>
      </div>
      <div className="text-sm font-bold text-[#4edea3] uppercase tracking-wider">
        Thank You · Questions &amp; Evaluation Welcome
      </div>
    </div>
  </div>
);

// Presenter Talking Points
const SPEAKER_NOTES = [
  // Slide 1
  'Welcome professors, evaluators, and colleagues. Today we present our software engineering project: "Knowledge Management & Note-Taking Platform". We will demonstrate how our system solves information fragmentation through an Obsidian-inspired local-first architecture with bidirectional linking, interactive graphs, and spatial canvases.',
  // Slide 2
  'To understand the motivation: technical knowledge workers suffer from "Scattered Knowledge". Traditional folder trees force users into a single hierarchical path, breaking down when an idea intersects multiple engineering disciplines. Furthermore, linear text notes fail to retain context, leading to repetitive re-researching.',
  // Slide 3
  'Our proposed solution introduces "One Connected Knowledge Workspace". We structure the platform around five pillars: Creating Markdown notes, Organizing via dual folders and tags, Connecting through [[WikiLinks]], Exploring topologically with Graphs and Canvases, and Retrieving via instant Cmd+K command indexing.',
  // Slide 4
  'Here we define our project scope: delivering strict Markdown compatibility without proprietary format lock-in, automated relationship discovery, and 100% offline-first reliability. Our primary personas are software architects, researchers, and engineering students who require prolonged deep reading endurance.',
  // Slide 5
  'Looking at our core desktop interface shown on screen: we implemented an authentic 3-pane layout matching the Obsidian Slate design system. On the left is the file tree; the center stage houses our multi-tab editor with collapsible YAML properties, interactive checklists, code snippets with copy buttons, and tabular matrices; on the right is our contextual inspector.',
  // Slide 6
  'Slide 6 highlights our core knowledge management algorithms: first-class [[WikiLinks]] that resolve by note title, filename, or YAML alias; a reverse-lookup backlink engine that extracts surrounding context sentences; cross-folder #tags; and typed frontmatter properties that enable database-style filtering.',
  // Slide 7
  'Beyond folders, we built visual exploration modes: the Knowledge Graph maps the entire vault topologically with real-time in-degree and out-degree metrics; the Canvas provides a spatial 2D whiteboard for system architecture; and our Structured Views present tabular comparison metrics with zero layout jitter.',
  // Slide 8
  'Our software architecture is organized into four clean layers: React 19 and Tailwind CSS v4 on the presentation layer; our pure, zero-DOM vaultEngine.ts for link derivation; IndexedDB and Web Storage for local persistence; and an Express backend powering Gemini 4 Argon high-thinking synthesis with future readiness for Supabase RLS cloud synchronization.',
  // Slide 9
  'This slide displays our implementation roadmap across 8 major milestones—from initial data modeling to full E2E testing. Every milestone has been verified and tested, with zero regressions and clean Playwright automated browser verification.',
  // Slide 10
  'For future horizons, our architecture is designed for extensibility: cloud synchronization with end-to-end encryption, multi-user real-time collaboration using CRDTs, a sandboxed plugin ecosystem, and local semantic embeddings for AI-assisted knowledge discovery.',
  // Slide 11
  'In conclusion, our platform is not just a place to store text files—it is an active workspace to build, connect, and explore knowledge. Thank you, and we look forward to your questions, feedback, and project evaluation.',
];
