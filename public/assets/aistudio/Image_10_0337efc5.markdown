---
name: Obsidian Slate
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '500'
    lineHeight: 1.5rem
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.75rem
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.625rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-md:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1.125rem
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.04em
  code-inline:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
  code-block:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.375rem
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-desktop: 1rem
  margin: 0.75rem
  margin-desktop: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.375rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system is engineered for deep focus, sustained technical thinking, and personal knowledge management. Built desktop-first, it evokes the quiet precision of an artisan editor and the reliability of a high-performance terminal. The interface gets out of the way of thought, treating typography, hierarchy, and spatial structure as first-class citizens.

The design movement combines **Minimalism** with **Engineered Utility**:
- Dense, data-rich layouts with zero unnecessary ornamentation or decorative gradients.
- Structural boundary clarity through crisp, 1px low-contrast dividers rather than heavy shadows.
- Calibrated typographic rhythm that makes reading markdown, editing frontmatter, and scanning nested tree hierarchies effortless over hours of deep work.
- Tactile, deliberate interactions where hover states, collapses, and pane-splits feel fast, mechanical, and predictable.

## Colors

The palette establishes an optical dark workspace using slate and charcoal foundations calibrated to eliminate eye fatigue. Rather than pure black (#000000), deep blue-tinted slates retain depth across panel layers.

### Surface Tiers
- **Canvas Base (`#090d16`):** The ground level for inactive or recessed app frames, status bars, and gutter backgrounds.
- **Surface Default (`#0f172a` - slate-900):** The primary writing canvas and main active pane background.
- **Surface Raised (`#1e293b` - slate-800):** File explorer trees, tool sidebars, floating popovers, and sticky headers.
- **Surface Overlay (`#334155` - slate-700):** Hover feedback, selected file rows, active tab indicators, and modal surfaces.

### Accents & State Roles
- **Primary Accent (`#6366f1` - indigo-500):** Reserved for intentional actions: active cursor, markdown wiki-links (`[[Note]]`), focused tab indicator lines, primary command bar highlights, and keyboard navigation rings.
- **Secondary Accent (`#10b981` - emerald-500):** File sync state "saved", successful git commits, pass status indicators, and clean graph view clusters.
- **Tertiary Accent (`#f59e0b` - amber-500):** Unsaved buffer indicators, merge warnings, search query highlights, and stale links.
- **Critical / Danger (`#ef4444` - rose-500):** Broken cross-links, destructive file deletion, and parse errors.

### Borders & Dividers
- **Structural Border (`#1e293b` - slate-800):** 1px boundary dividing panels, splits, tab bars, and explorer headers.
- **Interactive Border (`#334155` - slate-700):** Visual delineation on hover, inputs, and active pane borders.

## Typography

Typography prioritizes prolonged reading endurance, markdown syntactic clarity, and screen space efficiency.

- **Primary Typeface (Inter):** Applied across UI chromes, tree nodes, frontmatter keys, and long-form document text. Its tall x-height and neutral geometry ensure legibility even at small sidebar sizes (`0.8125rem`).
- **Code & Syntax Typeface (JetBrains Mono):** Dedicated to code blocks, inline backticks, metadata tags, path indicators, and hotkey legends. Feature ligatures enabled for clear programming operators.
- **Vertical Rhythm:** Document body prose utilizes a relaxed `1.75rem` line height on `1rem` base font to facilitate scanning, while sidebar hierarchies and tree lists use compact `1.25rem` heights to maximize vertical density.
- **Headings:** Headings within document views carry negative letter tracking to offset larger glyph widths and sit cleanly beside line numbers and folding arrows.

## Layout & Spacing

The workspace uses a multi-pane split layout governed by strict spatial density. The desktop layout divides horizontally into three primary zones: collapsible navigation sidebar (left), fluid multi-pane editing stage (center), and collapsible contextual inspector/backlinks/outline (right).

### Multi-Pane Architecture
- **Sidebar Navigation:** Fixed base width at `240px`, resizable between `180px` and `420px`. Collapses to a slim `44px` icon dock.
- **Inspector Panel:** Fixed base width at `280px`, collapsible to full hide.
- **Content Stage:** Fluid width spanning remaining viewport width. In single-pane view, default prose width is bounded to `720px` centered to maintain 65–80 characters per line, expandable to full width for wide code tables and canvas views.
- **Pane Splitters:** 1px visual border flanked by a 6px transparent target strip for effortless resize grabbing.

### Spacing Density
- Tree view items utilize `space-xs` (4px) vertical gaps and `space-sm` (6px) padding for an authentic developer tool feel.
- Form inputs, command palette rows, and modal list items operate on `space-sm` to `space-md`.
- Document prose containers use `space-xl` top and bottom margins for comfortable breathing room.

## Elevation & Depth

Visual hierarchy does not rely on diffuse, fluffy drop-shadows. Instead, this design system establishes depth through **Tonal Layering** accompanied by **Crisp Low-Contrast Outlines**.

1. **Base Layer (Elevation 0):** Background frame and sidebar rails (`#090d16`). Receded and non-interactive.
2. **Document Canvas (Elevation 1):** Active note editor (`#0f172a`). Demarcated from base rail with a clean 1px border (`#1e293b`).
3. **Hover & Dropdown Sheets (Elevation 2):** Context menus, tooltips, and file search results. Rendered in `#1e293b` with a hairline 1px border in `#334155` and a tight ambient drop (`0 4px 12px rgba(0, 0, 0, 0.45)`).
4. **Command Palette & Modal Dialogs (Elevation 3):** Floating centered surfaces (`#1e293b`) with dual boundaries: an interior highlight hairline (`rgba(255, 255, 255, 0.05)`) and an exterior structural border (`#334155`), suspended over an opaque backdrop blur (`backdrop-filter: blur(8px); background: rgba(9, 13, 22, 0.6)`).
5. **Active Focus States:** Never elevated with shadows; marked by a 1px inner or outer outline of `#6366f1` (indigo-500).

## Shapes

The geometric approach is **Soft (`roundedness: 1`)**, matching the technical, rectangular posture of a code editor while avoiding sharp industrial corners.

- **Base Radius (`0.25rem` / 4px):** Applied to inline code badges, tree items, sidebar action buttons, status pills, and form inputs.
- **Container Radius (`0.5rem` / 8px):** Applied to modal cards, command palette containers, floating contextual popovers, and preview embeds.
- **Pill Exceptions:** Tags (`#technical-writing`) use a slightly higher pill radius when isolated, but inside dense tables and metadata panels, they conform strictly to 4px soft corners to respect horizontal scanlines.

## Components

### Buttons & Icon Triggers
- **Ghost (Default Toolbar Actions):** Transparent background, text/icon in slate-400 (`#94a3b8`). On hover: background `#1e293b`, icon shifts to slate-100 (`#f1f5f9`).
- **Primary Action:** Solid indigo background (`#6366f1`), text in `#ffffff`, 4px border radius. Used sparingly (e.g., "Publish Note", "Commit Changes").
- **Icon Buttons:** Fixed 28x28px or 24x24px bounds for folding chevrons, split icons, and pinned tabs with centered vector glyphs.

### File Tree & Navigation Nodes
- **Row Anatomy:** `26px` row height. Nested indent increments of `12px` per depth level with a faint `1px` guide line (`#1e293b`).
- **States:** Hover triggers background `#1e293b` with `4px` corner rounding. Active file triggers `#1e293b` with a solid `#6366f1` 2px vertical indicator bar on the left edge.
- **Icons:** Folders use muted slate icons; file types indicate syntax (markdown, canvas, image, code) with subtle color distinction.

### Editor Tabs
- **Tab Bar:** Flush against the top of the pane, height `36px`, background `#090d16`.
- **Active Tab:** Matches editor surface (`#0f172a`), bordered top with `#6366f1` (2px height), subtle 1px slate-800 dividers on left and right.
- **Inactive Tab:** Slate-400 text, no top border, transparent background. Hover adds subtle `#1e293b` background. Close button appears on hover.

### Inputs & Command Palette
- **Inline Inputs:** Background `#090d16`, border 1px `#1e293b`, text `#f1f5f9`, placeholder `#475569`. Focus shifts border to `#6366f1`.
- **Command Palette (`Ctrl/Cmd + K`):** Fixed width `600px`, centered in the upper third of the viewport. Features a borderless top search input with `JetBrains Mono` shortcut hints on the right. Search results highlight matched substrings in `#6366f1`.

### Markdown Elements & Code Blocks
- **Inline Code:** Background `#1e293b`, border 1px `#334155`, text `#e2e8f0`, padding `2px 6px`, radius `4px`.
- **Code Blocks:** Full-width container in `#090d16`, bordered by `#1e293b`, language indicator pill anchored at top-right, copy button visible on hover.
- **Wiki-links (`[[Internal Reference]]`):** Text color `#818cf8` with subtle dashed underline; transitions to solid underline and `#a5b4fc` on hover.

### Checkboxes & Task Lists
- **Task Item:** Custom 14x14px square checkbox, 3px border radius, border 1.5px `#475569`.
- **Checked State:** Background `#6366f1`, white checkmark glyph. Attached task label receives `#64748b` color and line-through text decoration.