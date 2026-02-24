# BLL Checklists And Templates

Use this file as your live working tracker.

## 1. Rubric Completion Checklist

## 1.1 Inhalt (40%)

- [ ] Leitfrage is precise, measurable, and central to all chapters.
- [ ] At least two alternative methods are compared and evaluated.
- [ ] Chosen method is justified with explicit criteria.
- [ ] Empirical evidence is reproducible and clearly presented.
- [ ] Results interpretation directly answers Leitfrage.
- [ ] Interdisciplinary contribution is explicit (not a footnote).

## 1.2 Aufbau (15%)

- [ ] Introduction states problem, relevance, Leitfrage, and method overview.
- [ ] Theoretical framework defines research context and gap.
- [ ] Method chapter is structured and reproducible.
- [ ] Results chapter is objective and evidence-first.
- [ ] Conclusion only claims what evidence supports.

## 1.3 Arbeitsprozess (10%)

- [ ] Reflection chapter exists as dedicated section.
- [ ] Setbacks and failed approaches are explicitly analyzed.
- [ ] Major pivots and decision rationale are documented.
- [ ] Limits of the work are acknowledged without defensiveness.

## 1.4 Formale Aspekte (10%)

- [ ] One citation style is used consistently.
- [ ] In-text references and bibliography are fully aligned.
- [ ] Abstract/Kurzfassung is present and concise.
- [ ] Figures/tables list and appendix are complete.
- [ ] Declaration/originality package is complete.

## 1.5 Colloquium (25%)

- [ ] Thesenpapier contains 4-6 assertive, debatable theses.
- [ ] Thesis statements are evidence-linked to written work.
- [ ] 10-minute presentation outline is prepared.
- [ ] Defense question bank and answer anchors are prepared.

## 2. Technical Readiness Checklist

- [ ] Backend middleware dependencies exist and are wired correctly.
- [ ] Schema and write paths match (`accessLogs`, timestamps, actor fields).
- [ ] Runtime/tooling versions are pinned and documented.
- [ ] Frontend strict TypeScript passes.
- [ ] CI workflows are syntactically valid.
- [ ] API security model is explicit and enforceable.
- [ ] Recurrence behavior is implemented and validated.
- [ ] No critical TODOs remain unresolved in core flows.

## 3. Submission Package Checklist

- [ ] Written BLL document (final).
- [ ] Thesenpapier (1-2 pages).
- [ ] Appendix (evidence, diagrams, selected technical artifacts).
- [ ] Reproducibility notes (environment + method steps).
- [ ] Bibliography and source package.
- [ ] Originality/declaration components.
- [ ] Colloquium prep notes.

## 4. Templates

## 4.1 Leitfrage Template

```md
Leitfrage:
Inwieweit verbessert [Methode A] im Vergleich zu [Methode B] die [Metrik] 
im Kontext [Schulzugangsszenario] unter [Daten-/Betriebsbedingungen]?
```

## 4.2 Hypotheses Template

```md
H1: [Methode A] reduziert [Fehlerart] gegenüber [Methode B] um mindestens [X%].
H2: [Methode A] hält die mittlere Entscheidungszeit unter [Y ms].
H3: [Bedingung Z] beeinflusst [Metrik Q] signifikant.
```

## 4.3 Method Chapter Template

```md
1. Design
- Ziel der Untersuchung
- Vergleichsansatz

2. Datenbasis
- Datenquellen
- Stichprobe / Testfälle
- Vorverarbeitung

3. Messung
- Primäre Metriken
- Sekundäre Metriken
- Messprotokoll

4. Reproduzierbarkeit
- Umgebung
- Schrittfolge
- Konfiguration

5. Limitationen
- Technische Grenzen
- Datenbias
- Zeit-/Ressourcenlimit
```

## 4.4 Results Template

```md
Ergebnisse:
- Metrik A: [Wert], Vergleich: [Differenz]
- Metrik B: [Wert], Vergleich: [Differenz]

Interpretation:
- Bezug zu H1: [bestätigt/widerlegt/teilweise]
- Bezug zu H2: [bestätigt/widerlegt/teilweise]
- Bezug zu Leitfrage: [klare, evidenzbasierte Antwort]
```

## 4.5 Reflection Chapter Template

```md
1. Ausgangsannahmen und erste Entscheidungen
2. Was nicht funktioniert hat (mit Gründen)
3. Kritische Pivot-Entscheidungen
4. Methodische Selbstkritik
5. Gelerntes und nächste Iteration
```

## 4.6 Interdisciplinary Chapter Template

```md
1. Recht/Datenschutz
- Datenminimierung
- Rollen- und Zugriffskontrolle
- Risiken und Gegenmaßnahmen

2. Ethik
- Fehlentscheidungen und Folgen
- Fairness/Bias

3. Organisation/Ökonomie
- Schulprozess-Auswirkungen
- Wartungs-/Betriebskosten
- Skalierbarkeit
```

## 4.7 Thesenpapier Template

```md
Titel / Name / Datum / Prüfungskontext

These 1: [klar, streitbar, evidenzpflichtig]
Beleganker: [Kapitel/Figur/Metrik]

These 2: [...]
Beleganker: [...]

These 3: [...]
Beleganker: [...]

These 4: [...]
Beleganker: [...]

(optional) These 5-6

Kernliteratur:
- [Quelle 1]
- [Quelle 2]
- [Quelle 3]
```

## 4.8 Evidence Logging Template

```md
Experiment-ID:
Datum:
Version/Commit:
Umgebung:
Datensatz/Testfälle:

Metriken:
- Accuracy:
- False Positives:
- False Negatives:
- Latency (avg/p95):
- Fehlerfälle:

Interpretation:
- Aussagekraft:
- Limitation:
```

