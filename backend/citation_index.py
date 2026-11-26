"""Lookup and matrix projection for TEI citation bundles."""

import json
from collections import defaultdict


class CitationIndex:
    def __init__(self, path, papers):
        payload = json.loads(path.read_text(encoding="utf-8"))
        if payload["version"] != 1:
            raise ValueError("unsupported citation bundle version")
        self.papers = papers
        self.references = {row["reference_id"]: row for row in payload["references"]}
        if len(self.references) != len(payload["references"]):
            raise ValueError("duplicate reference ID in citation bundle")
        self.by_id = {}
        self.by_cell = defaultdict(list)
        self.graph_edges = []
        for row in payload["citations"]:
            cid = row["citation_id"]
            pid = row["source_paper_id"]
            reference_id = row["reference_id"]
            target = row["target_paper_id"]
            if cid in self.by_id or pid not in papers or reference_id not in self.references:
                raise ValueError("invalid citation ID, source paper or reference")
            if target != self.references[reference_id]["paper_id"] or (
                target is not None and target not in papers
            ):
                raise ValueError("invalid target paper in citation bundle")
            self.by_id[cid] = row
            self.by_cell[(pid, reference_id)].append(row)
            if target:
                self.graph_edges.append({"id": cid, "source": pid, "target": target,
                                         "type": "Cites", "weight": None})

    def matrix(self, source=None):
        papers = [paper for pid, paper in sorted(self.papers.items()) if source in (None, pid)]
        cells = [{"source_paper_id": pid, "reference_id": rid, "count": len(rows)}
                 for (pid, rid), rows in sorted(self.by_cell.items()) if source in (None, pid)]
        used = {cell["reference_id"] for cell in cells}
        return {
            "rows": [self.references[rid] for rid in sorted(used)],
            "cols": [{"paper_id": paper["paper_id"], "title": paper["title"]} for paper in papers],
            "cells": cells,
        }
