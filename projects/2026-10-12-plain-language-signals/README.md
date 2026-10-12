# Plain Language Signals

A small C11 command-line tool that reviews public-service copy for mechanical patterns that deserve a human content-design pass. It generates a self-contained, accessible HTML report. Created by **Soroush Etemadfar**.

## Problem

Service notices often accumulate administrative wording, long sentences, and abbreviations that domain experts understand but residents may not. Automated “readability scores” can look authoritative while hiding why text is difficult.

## Interaction

Give the tool a UTF-8 text file and an output path. It separates the copy into sentences, counts words, and records three explicit signal types:

- sentences longer than 25 words;
- a small, visible list of administrative phrases;
- all-capital abbreviations that may need a definition.

The report shows the exact evidence, a rewrite prompt, and every source sentence. A zero-signal result still asks for human review.

## UX decisions

- Findings are traceable to a sentence instead of collapsed into an opaque grade.
- Suggestions are prompts, not automatic rewrites that could change legal meaning.
- The configured jargon list is intentionally small and visible in source code.
- The report states that it is not certification, accessibility conformance, legal review, or user research.
- The included notice and abbreviation are synthetic.

## Accessibility

- Semantic headings, sections, articles, and ordered source sentences.
- Labels and evidence communicate status without relying on color.
- Responsive finding layout, system fonts, strong contrast, and logical reading order.
- HTML-escaped source content prevents input from breaking report markup.

## Stack and architecture

- C11 and the standard library only
- One-pass sentence extraction followed by explicit rule checks
- Self-contained HTML and CSS output
- Five C tests plus a clean-copy integration check

This is a compact prototype, not a full natural-language parser. Sentence boundaries, abbreviations, and non-English text need a more capable tokenizer in production.

## Build and run

Requires a C11 compiler and `make`:

```bash
make
./plain-language sample-copy.txt report.html
```

Open `report.html` in a browser.

## Test and regenerate the sample

```bash
make test
make demo
```

No dependency file is required because only the C standard library is used.

## What I learned

Content tooling is more trustworthy when every warning exposes its rule and evidence. For public-service UX, the final quality check still belongs with content experts and representative readers—not a numeric score.
