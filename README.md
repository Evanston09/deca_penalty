# DECA Prepared Event Penalty Checker

A free, privacy-first web tool that checks DECA prepared event PDF submissions for common formatting penalties — **entirely in your browser**. No files are uploaded to any server.

## What It Does

Upload your DECA prepared event PDF and select your event. The tool validates your submission against official DECA formatting requirements and calculates a penalty score (out of 100) based on:

- **Statement of Integrity** — whether you've signed the Prepared Event Statement of Assurances and Academic Integrity
- **Page Limit** — checks your page count against the event's maximum (−5 points per extra page)
- **Page Dimensions** — verifies correct sizing (8.5×11" for written events, 1920×1080px for pitch events)
- **Document Structure** — looks for required sections (title page, table of contents, and event-specific sections like Executive Summary, Bibliography, etc.)
- **Page Numbering** — confirms clear, visible page numbers on content pages

Results include an expandable checklist showing exactly what passed and what didn't, with page previews highlighting where issues were found. Score a perfect 100 and you get confetti.

## Supported Events

Covers all major DECA prepared event categories:

- **Business Operations Research** — Business Services, Buying & Merchandising, Finance, Hospitality & Tourism, Sports & Entertainment Marketing
- **Project Management** — Business Solutions, Career Development, Community Awareness, Community Giving, Financial Literacy, Sales
- **Entrepreneurship** — Innovation Plan, Start-Up Business Plan, Independent Business Plan, International Business Plan, Business Growth Plan, Franchise Business Plan
- **Integrated Marketing Campaign** — Event, Service, Product
- **Stock Market Game**

## Getting Started

```bash
npm install
npm run dev
```

### Other Commands

```bash
npm run build      # Type-check and build for production
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

A Nix dev shell is also available via `nix develop` (provides Node.js 23).

## How It Works

All processing happens client-side using [pdf.js](https://mozilla.github.io/pdf.js/) to parse the uploaded PDF. The tool extracts text content and page metadata directly in the browser, then runs validation checks against the selected event's requirements. Pages are rendered to off-screen canvases to generate preview images shown in the results.

## Limitations

PDF parsing is inherently difficult — PDFs are drawing instructions, not structured documents. The biggest source of inaccuracy is **text embedded as images** (common in DECA submissions). If you can't highlight/select the text in your PDF viewer, the parser can't read it either.

OCR or AI could solve this, but the tool intentionally runs entirely locally to protect your privacy and stay free. See the [Limitations page](/) in the app for more details.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui (Radix UI primitives)
- pdf.js for client-side PDF parsing
- Deployed on Netlify

## Contributing

Contributions are welcome! This is an open-source project — feel free to open issues or submit pull requests.

## License

Open source.
