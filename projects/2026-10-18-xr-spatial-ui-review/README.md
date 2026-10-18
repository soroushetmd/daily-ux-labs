# XR Spatial UI Review

A dependency-free Python tool that reviews a synthetic XR panel layout and generates a self-contained, accessible HTML report with a top-view visualization and exact data table.

## Problem

Spatial interfaces add distance, viewing angle, physical movement, target size, device resolution, and input method to familiar UI decisions. A flat mockup can hide layout assumptions that deserve discussion before headset testing.

## Interaction

Describe panels in JSON with distance, yaw, pitch, physical width, and target height. Run the CLI to receive explicit review signals and a visual map. The sample museum-guide scenario and every value are synthetic.

## UX decisions

- Each signal exposes its rule, measured evidence, and a review prompt instead of producing an opaque comfort score.
- Red and green plot points are backed by text cards and a complete table, so color is never the only carrier of meaning.
- The report separates prototype assumptions from standards and research findings.
- Thresholds are centralized and configurable for project-specific review.
- Recommendations consistently direct teams toward device testing with representative users.

## Accessibility

The report uses semantic headings and landmarks, an SVG with title and description, a captioned data table with scoped headers, text labels for every status, responsive overflow, strong contrast, and reduced-motion support. User-supplied labels are HTML-escaped.

## Stack and architecture

- Python 3.10+ standard library only
- JSON validation and duplicate-ID checks
- Trigonometric calculation of angular size
- Deterministic rule engine returning typed review signals
- Inline SVG plus an accessible HTML table
- `unittest` test suite

## Run

```bash
make test
make check
make report
```

Then open `sample-report.html` in a browser. No third-party package is required.

## What I learned

Spatial UX reviews are more useful when physical and angular values remain visible. A diagram supports quick pattern recognition, while exact values and review prompts keep the artifact inspectable and avoid presenting early assumptions as facts.

Created by **Soroush Etemadfar**.
