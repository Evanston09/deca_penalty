# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DECA Prepared Event Penalty Checker — a React web app that validates DECA competition PDF submissions against official formatting rules. Users upload a PDF, select their event, and get a penalty score based on page limits, dimensions, structure (required sections), and page numbering.

Deployed on Netlify with SPA redirect config.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — TypeScript check + Vite build (`tsc -b && vite build`)
- `npm run lint` — ESLint
- `npm run preview` — preview production build
- Nix dev shell available via `nix develop` (provides Node.js 23)

## Architecture

**Routing**: React Router v7 with BrowserRouter. Routes defined in `src/main.tsx`:
- `/` — Upload page (PDF upload + event selection)
- `/results` — Results page (displays validation results)
- `/limitations` — Limitations page
- `*` — 404 error

State is passed from Upload to Results via `react-router` navigation state (not URL params or global state).

**PDF Validation Pipeline** (`src/lib/`):
1. `pdfChecker.ts` — orchestrator. Takes `UserParams` (PDF link, event name, integrity checkbox), loads PDF via `pdfjs-dist`, runs all validators, computes penalty score (starts at 100, deducts points).
2. `validators/EventValidator.ts` — core validator class. Configured differently for Pitch vs Written events:
   - **Pitch**: 20 page max, 1920x1080px dimensions, title on page 2, TOC on page 3
   - **Written**: 22 page max, 8.5x11" dimensions, title on page 1, TOC on page 2
   - Validates: page limit, dimensions, document structure (title, TOC, required sections), clear page numbering
3. `validators/textExtrators.ts` — text extraction using pdfjs-dist. Uses `BaseTextExtractor` abstract class with `PdfJsTextExtractor` implementation. Renders pages to `OffscreenCanvas` for image blobs.
4. `decaEvents.ts` — event registry (`DECA_EVENTS_OBJECT`). Maps event names to required sections, category, and format type (Pitch/Written). Sections can have multiple acceptable name variants (array of strings).
5. `ValidatorTypes.ts` — shared types (`PDFParams`, `UserParams`, `StructureConfig`, `Result`, `EventFormat` enum, etc.)

**UI Stack**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin), shadcn/ui components (new-york style, in `src/components/ui/`), Radix UI primitives, Lucide icons, Montserrat font.

**Path alias**: `@` maps to `./src` (configured in `vite.config.ts`).

**Custom theme colors**: `deca-blue` (#0072CE) and `deca-blue-hover` (#005DA8) defined in `src/index.css`.
