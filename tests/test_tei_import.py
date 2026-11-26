import csv
import json
import tempfile
import unittest
from pathlib import Path

from backend.import_tei import build_bundle, write_bundle
from backend.mock_api import ApiError, MockAPI


def tei(title, *, year=2025, doi="", body="", refs=""):
    date = f'<date type="published" when="{year}"/>' if year else ""
    identifier = f'<idno type="DOI">{doi}</idno>' if doi else ""
    return f"""<TEI xmlns="http://www.tei-c.org/ns/1.0">
      <teiHeader><fileDesc><titleStmt><title>{title}</title></titleStmt>
      <sourceDesc><biblStruct><analytic>{identifier}<author><persName>
      <forename>Jane</forename><surname>Doe</surname></persName></author></analytic>
      <monogr><imprint>{date}</imprint></monogr></biblStruct></sourceDesc>
      </fileDesc><profileDesc><abstract>A unique abstract term.</abstract></profileDesc></teiHeader>
      <text><body>{body or '<p>No citations.</p>'}</body>
      <back><div><listBibl>{refs}</listBibl></div></back></text></TEI>"""


class TEIImportTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(dir=Path.cwd())
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.catalog = [{"paper_id": "P0001", "tei": "source.xml"},
                        {"paper_id": "P0002", "tei": "target.xml"}]
        self.source = self.root / "source.xml"
        self.source.write_text(tei(
            "Source study",
            body="""<div><head>Experiments</head><p>We use
              <ref type="bibr" coords="3,0,0,10,10" target="#b0 #b1">[1,2]</ref>.
              We compare <ref type="bibr" target="#b0">[1]</ref>.
              <ref type="bibr">[?]</ref><ref type="bibr" target="#missing">[3]</ref></p></div>""",
            refs="""<biblStruct xml:id="b0"><analytic><title>Older title</title>
                <idno type="DOI">https://doi.org/10.1234/TARGET</idno></analytic></biblStruct>
                <biblStruct xml:id="b1"><analytic><title>Outside corpus</title></analytic>
                <monogr><imprint><date when="2022"/></imprint></monogr></biblStruct>""",
        ), encoding="utf-8")
        (self.root / "target.xml").write_text(tei("Target study", doi="10.1234/target"), encoding="utf-8")

    def build(self):
        return build_bundle(self.catalog, self.root)

    def test_tei_occurrences_and_csv_keep_counts(self):
        papers, documents, refs, citations, report = self.build()
        self.assertEqual(papers[0]["authors"], ["Jane Doe"])
        self.assertEqual(report[0]["markers_without_target"], 1)
        self.assertEqual(report[0]["unknown_targets"], 1)
        self.assertEqual(len(refs), 2)
        self.assertEqual(len(citations), 3)
        self.assertEqual(len({row["citation_id"] for row in citations}), 3)
        self.assertEqual(citations[0]["target_paper_id"], "P0002")
        self.assertEqual(citations[0]["match_method"], "identifier")
        self.assertEqual(citations[0]["page"], 3)
        self.assertIsNone(citations[2]["page"])
        self.assertEqual(citations[0]["section"], "Experiments")
        passage = next(row for row in documents[0]["passages"]
                       if row["passage_id"] == citations[0]["passage_id"])
        self.assertEqual(passage["text"], citations[2]["citation_context"])
        self.assertIn("We compare", passage["text"])
        output = self.root / "bundle"
        write_bundle(output, (papers, documents, refs, citations, report))
        with (output / "paper_edges.csv").open(encoding="utf-8", newline="") as file:
            rows = list(csv.DictReader(file))
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["stance"], "")
        self.assertEqual(rows[0]["confidence"], "")
        with self.assertRaisesRegex(ValueError, "output already exists"):
            write_bundle(output, self.build())

    def test_ids_survive_catalog_order_and_bibliography_renumbering(self):
        baseline = self.build()
        self.catalog.reverse()
        self.assertEqual(self.build(), baseline)
        content = self.source.read_text(encoding="utf-8")
        self.source.write_text(content.replace("b0", "b12"), encoding="utf-8")
        self.assertEqual([row["citation_id"] for row in self.build()[3]],
                         [row["citation_id"] for row in baseline[3]])

    def test_duplicate_identifiers_missing_year_and_path_escape_fail(self):
        (self.root / "target.xml").write_text(tei("Target study", year=None), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "provide catalog year"):
            self.build()
        self.catalog[1].update(year=2024, doi="10.1234/shared")
        self.catalog[0]["doi"] = "10.1234/shared"
        with self.assertRaisesRegex(ValueError, "identifier already assigned"):
            self.build()
        self.catalog[0]["tei"] = "../source.xml"
        with self.assertRaisesRegex(ValueError, "leaves the input directory"):
            self.build()

    def test_ambiguous_title_does_not_create_a_graph_edge(self):
        (self.root / "other.xml").write_text(tei("Outside corpus"), encoding="utf-8")
        (self.root / "duplicate.xml").write_text(tei("Outside corpus"), encoding="utf-8")
        self.catalog.extend([{"paper_id": "P0003", "tei": "other.xml"},
                             {"paper_id": "P0004", "tei": "duplicate.xml"}])
        record = next(row for row in self.build()[3] if row["bibliography_id"] == "b1")
        self.assertEqual(record["match_method"], "ambiguous")
        self.assertIsNone(record["target_paper_id"])

    def test_bundle_api_keeps_cell_and_graph_drilldown_consistent(self):
        output = self.root / "bundle"
        write_bundle(output, self.build())
        api = MockAPI(data_dir=self.root / "does-not-exist", bundle=output)
        dispatch = api.dispatch
        matrix, _ = dispatch("/api/v0/experimental/citation-matrix", {"source_paper_id": "P0001"})
        self.assertEqual(len(matrix["cols"]), 1)
        graph, _ = dispatch("/api/v0/graph", {"level": "paper"})
        resolved_ids = set()
        for cell in matrix["cells"]:
            query = {"source_paper_id": cell["source_paper_id"], "reference_id": cell["reference_id"]}
            hits, meta = dispatch("/api/v0/experimental/citations", {**query, "size": "1"})
            self.assertEqual(cell["count"], meta["total"])
            self.assertEqual(len(hits), 1)
            all_hits, _ = dispatch("/api/v0/experimental/citations", query)
            resolved_ids.update(row["citation_id"] for row in all_hits if row["target_paper_id"])
        self.assertEqual(resolved_ids, {row["id"] for row in graph["edges"]})
        for edge in graph["edges"]:
            detail, _ = dispatch("/api/v0/experimental/citations/" + edge["id"], {})
            self.assertEqual(detail["target_paper_id"], edge["target"])
        papers, _ = dispatch("/api/v0/papers", {"query": "unique abstract term"})
        self.assertEqual(len(papers), 2)
        self.assertEqual(dispatch("/api/v0/claims", {})[0], [])
        with self.assertRaises(ApiError) as failure:
            dispatch("/api/v0/experimental/citations", {"source_paper_id": "P0001"})
        self.assertEqual(failure.exception.status, 400)
        # The disk output contains only the reference metadata and text expected by the handoff.
        self.assertEqual(json.loads((output / "parsed_documents.json").read_text("utf-8"))["version"], 1)

    def test_attach_analysis_reuses_claim_routes_and_rejects_foreign_ids(self):
        output = self.root / "bundle"
        write_bundle(output, self.build())
        analysis = self.root / "analysis"
        analysis.mkdir()
        claim = {"claim_id": "C0001", "paper_id": "P0001", "finding": "The study compares a method.",
                 "problem": "Which method works?", "status": "Unresolved",
                 "created_at": "2025-01-01T00:00:00Z", "evidence_ids": ["E0001"]}
        evidence = {"evidence_id": "E0001", "paper_id": "P0001", "claim_id": "C0001",
                    "stance": "Support", "quote": "We compare"}
        (analysis / "claims.json").write_text(json.dumps([claim]), encoding="utf-8")
        path = analysis / "evidence.json"
        path.write_text(json.dumps([evidence]), encoding="utf-8")
        api = MockAPI(bundle=output, analysis_dir=analysis)
        self.assertEqual(api.dispatch("/api/v0/claims/C0001/evidence", {})[0], [evidence])
        path.write_text(json.dumps([{**evidence, "paper_id": "P9999"}]), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "paper_id references unknown Paper"):
            MockAPI(bundle=output, analysis_dir=analysis)
