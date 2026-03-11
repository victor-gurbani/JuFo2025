import os
import re
import subprocess

BIB_FILE = "references.bib"
PDF_DIR = "printed_sources"
OUT_TEX = "merged_sources.tex"

def get_bib_entries(bib_path):
    with open(bib_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    entries = {}
    raw_entries = content.split("@")
    for raw in raw_entries[1:]:
        key_match = re.search(r"^[^{]+\{([^,]+),", raw)
        if not key_match:
            continue
        key = key_match.group(1).strip()
        entries[key] = "@" + raw.strip()
    return entries

def main():
    entries = get_bib_entries(BIB_FILE)
    
    tex_lines = [
        r"\documentclass[12pt,a4paper]{article}",
        r"\usepackage{pdfpages}",
        r"\usepackage[utf8]{inputenc}",
        r"\usepackage[T1]{fontenc}",
        r"\usepackage{lmodern}",
        r"\usepackage{microtype}",
        r"\usepackage{hyperref}",
        r"\usepackage{xcolor}",
        r"\usepackage{tabularx}",
        r"\usepackage{setspace}",
        r"\usepackage[left=2.5cm,right=2.0cm,top=2.0cm,bottom=2.0cm]{geometry}",
        r"\setstretch{1.35}",
        r"\setlength{\parindent}{0pt}",
        r"\setlength{\parskip}{0.5em}",
        r"\definecolor{titlecolor}{RGB}{0, 51, 102}",
        r"\begin{document}",
        r"",
        r"% Title page",
        r"\begin{titlepage}",
        r"\thispagestyle{empty}",
        r"\centering",
        r"",
        r"{\large Deutsche Schule Madrid\par}",
        r"\vspace{0.5cm}",
        r"{\normalsize Abiturjahrgang 2026\par}",
        r"\vspace{1.5cm}",
        r"",
        r"{\color{titlecolor}\rule{\linewidth}{1pt}}",
        r"\vspace{1.5cm}",
        r"",
        r"{\Large\color{titlecolor}\textbf{Besondere Lernleistung (BLL) -- Begleitmaterial}\par}",
        r"\vspace{1.2cm}",
        r"{\fontsize{32}{40}\selectfont\color{titlecolor}\textbf{Anhang:}\par}",
        r"\vspace{0.4cm}",
        r"{\fontsize{36}{44}\selectfont\color{titlecolor}\textbf{Literatur \& Quellen}\par}",
        r"\vspace{1.5cm}",
        r"{\Large \textbf{Projekt:} Digitale Schul-Zugangskontrolle\par}",
        r"\vspace{0.5cm}",
        r"{\normalsize Ein hybrides System zur Zugangs- und Auslasskontrolle: Digitalisierung von Papierprozessen und Verhinderung von Missbrauch durch die Kombination von passiver RFID-Technologie und lokaler KI-Gesichtserkennung\par}",
        r"",
        r"\vspace{1.5cm}",
        r"{\color{titlecolor}\rule{\linewidth}{1pt}}",
        r"\vspace{2.5cm}",
        r"\begin{tabularx}{0.9\textwidth}{>{\bfseries}p{3.8cm}X}",
        r"Verfasser/in: & Victor Gurbani \\",
        r"Erstkorrektor: & Steffen Ramin \\",
        r"Zweitkorrektor: & Stephan Seel \\",
        r"Abgabedatum: & 13. März 2026 \\",
        r"\end{tabularx}",
        r"",
        r"\vfill",
        r"\end{titlepage}",
        r"\newpage",
        r"",
        r"% Table of contents",
        r"\tableofcontents",
        r"\newpage"
    ]
    
    for filename in sorted(os.listdir(PDF_DIR)):
        if not filename.endswith(".pdf"):
            continue
            
        key = filename[:-4]
        # Paths for pdflatex should ideally use forward slashes. 
        # os.path.join creates valid paths, but we ensure it's relative
        pdf_path = f"{PDF_DIR}/{filename}"
        
        bib_text = entries.get(key, "No BibTeX entry found.")
        
        # Escape special characters for the section title
        safe_key = key.replace("_", "\\_")
        
        tex_lines.append(r"\phantomsection")
        tex_lines.append(fr"\addcontentsline{{toc}}{{section}}{{{safe_key}}}")
        tex_lines.append(r"\vspace*{5cm}")
        tex_lines.append(r"\begin{center}")
        tex_lines.append(fr"\Huge \textbf{{Source: {safe_key}}}")
        tex_lines.append(r"\end{center}")
        tex_lines.append(r"\vspace{2cm}")
        tex_lines.append(r"\begin{verbatim}")
        tex_lines.append(bib_text)
        tex_lines.append(r"\end{verbatim}")
        tex_lines.append(r"\newpage")
        
        tex_lines.append(fr"\includepdf[pages=-]{{{pdf_path}}}")
        
    tex_lines.append(r"\end{document}")
    
    with open(OUT_TEX, "w", encoding="utf-8") as f:
        f.write("\n".join(tex_lines))
        
    print(f"Generated {OUT_TEX}")
    print("Compiling with pdflatex...")
    
    # Run pdflatex twice to generate the Table of Contents correctly
    subprocess.run(["pdflatex", "-interaction=nonstopmode", OUT_TEX])
    subprocess.run(["pdflatex", "-interaction=nonstopmode", OUT_TEX])
    
    print("Done! The final output is merged_sources.pdf")

if __name__ == "__main__":
    main()