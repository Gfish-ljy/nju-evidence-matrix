"""Import local GROBID TEI into a new EvidenceMatrix paper/citation bundle."""

import argparse
import csv
import hashlib
import json
import re
import shutil
import tempfile
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from xml.etree import ElementTree as ET

TEI = "http://www.tei-c.org/ns/1.0"
NS = {"t": TEI}
XML_ID = "{http://www.w3.org/XML/1998/namespace}id"
EDGE_FIELDS = ("source_paper_id", "target_paper_id", "citation_context",
               "section", "stance", "confidence")
ARXIV = re.compile(r"(?:\d{4}\.\d{4,5}|[a-z][a-z.-]*/\d{7})(?:v\d+)?", re.I)
PASSAGES = {"p", "ab", "head", "note", "item", "figDesc", "cell"}
CATALOG_FIELDS = {"paper_id", "tei", "year", "title", "venue", "doi", "arxiv_id",
                  "citation_count", "is_selected"}


def compact(value):
    return " ".join(value.split())


def text(node):
    return compact("".join(node.itertext())) if node is not None else ""


def tag(node):
    return node.tag.removeprefix(f"{{{TEI}}}")


def digest(*parts):
    content = json.dumps(parts, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def title_key(value):
    value = unicodedata.normalize("NFKC", value).casefold()
    return "".join(char for char in value if char.isalnum())


def doi_key(value):
    value = value.strip().casefold()
    for prefix in ("https://doi.org/", "http://doi.org/", "https://dx.doi.org/", "doi:"):
        value = value.removeprefix(prefix)
    return value.strip() if re.fullmatch(r"10\.\d{4,9}/\S+", value.strip()) else None


def arxiv_key(value):
    value = re.sub(r"^(?:arxiv:\s*|https?://arxiv\.org/(?:abs|pdf)/)", "", value.strip(), flags=re.I)
    value = re.sub(r"(?:\.pdf|\s*\[[^\]]+\])$", "", value, flags=re.I).strip()
    if ARXIV.fullmatch(value):
        return re.sub(r"v\d+$", "", value.casefold())
    return None


def identifiers(node):
    values = {"doi": set(), "arxiv_id": set()}
    if node is not None:
        for item in node.findall(".//t:idno", NS):
            kind = item.get("type", "").casefold()
            if kind in {"doi", "arxiv"}:
                field, normalize = ("doi", doi_key) if kind == "doi" else ("arxiv_id", arxiv_key)
                value = normalize(text(item))
                if value:
                    values[field].add(value)
    return {key: next(iter(items)) if len(items) == 1 else None for key, items in values.items()}


def publication_year(node):
    if node is not None:
        dates = node.findall(".//t:imprint/t:date", NS)
        for date in sorted(dates, key=lambda item: item.get("type") != "published"):
            raw = date.get("when") or text(date)
            year = re.search(r"\b(?:19\d{2}|20\d{2}|2100)\b", raw)
            if year:
                return int(year.group())
    return None


def read_tei(path):
    source = path.read_text(encoding="utf-8-sig")
    if re.search(r"<!\s*(?:DOCTYPE|ENTITY)\b", source, re.I):
        raise ValueError("TEI must not contain a DTD or entity declaration")
    root = ET.fromstring(source)
    if root.tag != f"{{{TEI}}}TEI" or root.find("./t:text/t:body", NS) is None:
        raise ValueError("expected a GROBID TEI document with a text body")
    return root


def read_catalog(catalog, tei_dir):
    if not isinstance(catalog, list) or not catalog:
        raise ValueError("catalog must be a non-empty JSON array")
    base = tei_dir.resolve()
    seen_ids, seen_paths = set(), set()
    documents = []
    for item in catalog:
        if not isinstance(item, dict) or set(item) - CATALOG_FIELDS:
            raise ValueError("invalid catalog record or unknown field")
        pid = item.get("paper_id")
        if not isinstance(pid, str) or not re.fullmatch(r"P[0-9]{4}", pid) or pid in seen_ids:
            raise ValueError(f"invalid or duplicate paper_id: {pid!r}")
        filename = item.get("tei")
        if not isinstance(filename, str) or not filename or Path(filename).anchor:
            raise ValueError(f"{pid}: tei must be a path relative to the TEI directory")
        path = (base / filename).resolve()
        if not path.is_relative_to(base) or path in seen_paths:
            raise ValueError(f"{pid}: TEI path leaves the input directory or is reused")
        seen_ids.add(pid)
        seen_paths.add(path)
        try:
            for field in ("title", "venue", "doi", "arxiv_id"):
                if field in item and (not isinstance(item[field], str) or not compact(item[field])):
                    raise ValueError(f"{field} must be a non-empty string")
            if "is_selected" in item and type(item["is_selected"]) is not bool:
                raise ValueError("is_selected must be a boolean")
            if "citation_count" in item and (
                type(item["citation_count"]) is not int or item["citation_count"] < 0
            ):
                raise ValueError("citation_count must be a non-negative integer")
            root = read_tei(path)
            header = root.find("t:teiHeader", NS)
            if header is None:
                raise ValueError("TEI header is missing")
            bibliography = header.find(".//t:sourceDesc/t:biblStruct", NS)
            ids = identifiers(header)
            for field, normalize in (("doi", doi_key), ("arxiv_id", arxiv_key)):
                if field in item:
                    ids[field] = normalize(item[field])
                    if ids[field] is None:
                        raise ValueError(f"invalid {field}")
            year = item.get("year", publication_year(bibliography))
            if type(year) is not int or not 1900 <= year <= 2100:
                raise ValueError("publication year missing or invalid; provide catalog year")
            title = item.get("title") or text(header.find(".//t:titleStmt/t:title", NS))
            if not title and bibliography is not None:
                title = text(bibliography.find("t:analytic/t:title", NS))
            if not title:
                raise ValueError("paper title missing; provide catalog title")
            authors = []
            if bibliography is not None:
                for author in bibliography.findall("t:analytic/t:author/t:persName", NS):
                    authors.append(" ".join(filter(None, (text(part) for part in author))) or text(author))
            doi, arxiv_id = ids["doi"], ids["arxiv_id"]
            paper = {
                "paper_id": pid, "title": compact(title), "authors": [a for a in authors if a],
                "year": year, "venue": item.get("venue"), "doi": doi,
                "url": f"https://doi.org/{doi}" if doi else (
                    f"https://arxiv.org/abs/{arxiv_id}" if arxiv_id else None
                ),
                "pdf_path": None, "citation_count": item.get("citation_count", 0),
                "is_selected": item.get("is_selected", True), "selection_reason": None,
            }
        except (OSError, ValueError, ET.ParseError) as error:
            raise ValueError(f"{pid}: {error}") from error
        documents.append((paper, ids, root))
    return sorted(documents, key=lambda item: item[0]["paper_id"])


def reference_index(root):
    result = {}
    for node in root.findall("./t:text/t:back//t:listBibl/t:biblStruct", NS):
        target = node.get(XML_ID)
        if not target:
            continue
        if target in result:
            raise ValueError(f"duplicate bibliography target {target}")
        analytic = node.find("t:analytic", NS)
        title = (analytic.find("t:title", NS) if analytic is not None
                 else node.find("t:monogr/t:title", NS))
        result[target] = {"title": text(title) or None, "year": publication_year(node),
                          **identifiers(node)}
    return result


class CorpusIndex:
    def __init__(self, documents):
        self.papers = {paper["paper_id"]: ids for paper, ids, _ in documents}
        self.years = {paper["paper_id"]: paper["year"] for paper, _, _ in documents}
        self.by_identifier = {}
        self.by_title = defaultdict(set)
        for paper, ids, _ in documents:
            pid = paper["paper_id"]
            for field, value in ids.items():
                if value:
                    key = (field, value)
                    if key in self.by_identifier:
                        raise ValueError(f"{pid}: identifier already assigned to {self.by_identifier[key]}")
                    self.by_identifier[key] = pid
            self.by_title[title_key(paper["title"])].add(pid)

    def resolve(self, reference):
        known = {field: reference[field] for field in ("doi", "arxiv_id") if reference[field]}
        exact = {self.by_identifier[(field, value)] for field, value in known.items()
                 if (field, value) in self.by_identifier}
        if len(exact) > 1:
            return None, "ambiguous"
        if exact:
            candidate = next(iter(exact))
        else:
            normalized = title_key(reference["title"] or "")
            candidates = self.by_title[normalized] if normalized else set()
            if len(candidates) != 1:
                return None, "ambiguous" if candidates else "unmatched"
            candidate = next(iter(candidates))
            year = reference["year"]
            if year is not None and abs(self.years[candidate] - year) > 1:
                return None, "conflict"
        if any(self.papers[candidate].get(field) not in (None, value) for field, value in known.items()):
            return None, "conflict"
        return candidate, "identifier" if exact else "title"


def reference_identity(reference):
    for field in ("doi", "arxiv_id"):
        if reference[field]:
            return field, reference[field]
    normalized = title_key(reference["title"] or "")
    if normalized and reference["year"]:
        return "title_year", normalized, reference["year"]
    return None


def reference_id(pid, target, identity, matched, status):
    if matched:
        return matched
    if status == "unmatched" and identity:
        return "ref:" + digest(*identity)
    return "ref:" + digest(pid, target)


def page_from_coords(node):
    pages = {int(match.group(1)) for part in node.get("coords", "").split(";")
             if (match := re.match(r"^([1-9][0-9]*),", part.strip()))}
    return next(iter(pages)) if len(pages) == 1 else None


def extract_document(pid, root, corpus):
    body = root.find("./t:text/t:body", NS)
    bibliography = reference_index(root)
    passage_counts = Counter()
    citations, passages = [], {}
    metadata = {}
    stats = Counter()
    citation_counts = Counter()

    def visit(node, section=(), owner=None):
        name = tag(node)
        if name == "div":
            head = text(node.find("t:head", NS))
            if head:
                section = (*section, head)
        if name in PASSAGES:
            owner = node
            excerpt = text(node)
            if excerpt:
                key = digest(pid, section, excerpt)
                passage_counts[key] += 1
                passage_id = f"passage:{key}:{passage_counts[key]}"
                passages[node] = {"passage_id": passage_id, "section": " / ".join(section) or None,
                                  "page": page_from_coords(node), "text": excerpt}
        if name == "ref" and node.get("type") == "bibr":
            stats["tei_markers"] += 1
            targets = dict.fromkeys(value.removeprefix("#") for value in node.get("target", "").split())
            if not targets:
                stats["markers_without_target"] += 1
            passage = passages.get(owner)
            for target in targets:
                if target not in bibliography:
                    stats["unknown_targets"] += 1
                    continue
                if passage is None:
                    key = digest(pid, section, text(node))
                    passage_counts[key] += 1
                    passage = {"passage_id": f"passage:{key}:{passage_counts[key]}",
                               "section": " / ".join(section) or None,
                               "page": page_from_coords(node), "text": text(node)}
                    passages[node] = passage
                reference = bibliography[target]
                matched, status = corpus.resolve(reference)
                identity = reference_identity(reference)
                ref_id = reference_id(pid, target, identity, matched, status)
                # Preserve each local bibliography entry even when several entries share a matrix row.
                metadata.setdefault(ref_id, {"reference_id": ref_id, "paper_id": matched, **reference})
                key = digest(passage["passage_id"], identity or target, text(node))
                citation_counts[key] += 1
                citations.append({
                    "citation_id": f"citation:{key}:{citation_counts[key]}",
                    "source_paper_id": pid, "reference_id": ref_id,
                    "target_paper_id": matched, "bibliography_id": target,
                    "match_method": status, "marker": text(node),
                    "passage_id": passage["passage_id"], "section": passage["section"],
                    "page": page_from_coords(node) or passage["page"],
                    "citation_context": passage["text"],
                })
                stats["citation_records"] += 1
                stats[f"match_{status}"] += 1
        for child in node:
            visit(child, section, owner)

    visit(body)
    abstract = text(root.find("./t:teiHeader/t:profileDesc/t:abstract", NS))
    document = {"paper_id": pid, "abstract": abstract or None, "passages": list(passages.values())}
    return document, metadata, citations, dict(stats)


def build_bundle(catalog, tei_dir):
    sources = read_catalog(catalog, tei_dir)
    corpus = CorpusIndex(sources)
    papers = [paper for paper, _, _ in sources]
    by_id = {paper["paper_id"]: paper for paper in papers}
    documents, references, citations, stats = [], {}, [], []
    for paper, _, root in sources:
        pid = paper["paper_id"]
        document, bibliography, occurrences, diagnostics = extract_document(pid, root, corpus)
        documents.append(document)
        for rid, reference in bibliography.items():
            if rid in by_id:
                reference = {**reference, "title": by_id[rid]["title"], "year": by_id[rid]["year"],
                             **corpus.papers[rid]}
            references.setdefault(rid, reference)
        citations.extend(occurrences)
        stats.append({"paper_id": pid, **diagnostics})
    return papers, documents, sorted(references.values(), key=lambda ref: ref["reference_id"]), citations, stats


def write_bundle(output, bundle):
    output = output.resolve()
    if output.exists():
        raise ValueError("output already exists; choose a new bundle directory")
    output.parent.mkdir(parents=True, exist_ok=True)
    papers, documents, references, citations, stats = bundle
    staging = Path(tempfile.mkdtemp(prefix=".tei-import-", dir=output.parent))
    try:
        for name, value in (
            ("paper_nodes.json", papers),
            ("parsed_documents.json", {"version": 1, "documents": documents}),
            ("citations.json", {"version": 1, "references": references, "citations": citations}),
            ("ingestion_report.json", {"version": 1, "papers": stats}),
        ):
            (staging / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n",
                                        encoding="utf-8")
        with (staging / "paper_edges.csv").open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(file, EDGE_FIELDS)
            writer.writeheader()
            for citation in citations:
                if citation["target_paper_id"]:
                    writer.writerow({key: citation.get(key) for key in EDGE_FIELDS})
        staging.rename(output)
    finally:
        if staging.exists():
            shutil.rmtree(staging)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, required=True)
    parser.add_argument("--tei-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        catalog = json.loads(args.catalog.read_text(encoding="utf-8-sig"))
        bundle = build_bundle(catalog, args.tei_dir)
        write_bundle(args.output, bundle)
    except (OSError, ValueError, ET.ParseError) as error:
        parser.exit(1, f"Import failed: {error}\n")
    papers, _, references, citations, _ = bundle
    print(f"Imported {len(papers)} papers, {len(references)} cited works and {len(citations)} citation records.")


if __name__ == "__main__":
    main()
