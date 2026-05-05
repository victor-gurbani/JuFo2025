# BLL LaTeX Structure

This folder provides a complete BLL-focused LaTeX scaffold so you can rewrite the full documentation in a structured way.

## Compile

From this folder:

```bash
cd BLL-LaTeX
latexmk -pdf main.tex
```

Thesenpapier:

```bash
cd BLL-LaTeX/thesenpapier
latexmk -pdf thesenpapier.tex
```

If `biblatex` is used, `latexmk` will trigger `biber` automatically.

## File layout

- `main.tex`: main BLL document (front matter, main text, back matter, appendices)
- `references.bib`: bibliography database starter
- `.gitignore`: TeX build artifacts
- `sections/00_titelblatt.tex`: title page
- `sections/01_kurzfassung.tex`: abstract
- `sections/02_einleitung.tex`: introduction
- `sections/03_theoretischer_hintergrund.tex`: theory and research state
- `sections/04_methodik_und_umsetzung.tex`: methods and implementation
- `sections/05_ergebnisse_und_evaluation.tex`: results and evaluation
- `sections/06_reflexion_arbeitsprozess.tex`: reflection chapter (process grade)
- `sections/07_fazit_und_ausblick.tex`: conclusion and outlook
- `sections/08_rubrik_check.tex`: internal BLL rubric checklist table
- `sections/09_unterstuetzungsleistungen.tex`: support/transparency statement
- `sections/10_selbststaendigkeitserklaerung.tex`: declaration of originality
- `sections/A_anhang_materialien.tex`: appendix A for extra material
- `sections/B_anhang_reproduzierbarkeit.tex`: appendix B for reproducibility
- `thesenpapier/thesenpapier.tex`: 1-2 page colloquium thesis paper template

## Why this structure

- Mirrors your modular style from `JuFoArbeit_RegionalRunde_v2.tex`
- Covers BLL scoring dimensions explicitly (content, structure, process reflection, formality)
- Keeps rewrite workflow efficient: chapter-by-chapter edits with full-document compileability
