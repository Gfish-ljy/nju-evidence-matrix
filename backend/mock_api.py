"""Read-only HTTP API for the EvidenceMatrix MVP fixtures."""

import argparse
import csv
import hashlib
import json
import logging
import re
from collections import Counter
from pathlib import Path
from urllib.parse import parse_qs
from wsgiref.simple_server import make_server

ROOT = Path(__file__).resolve().parent.parent
FILES = {
    "papers": ("paper_nodes.json", "paper_id"),
    "claims": ("claims.json", "claim_id"),
    "conditions": ("conditions.json", "condition_id"),
    "evidence": ("evidence.json", "evidence_id"),
    "relations": ("claim_edges.json", "relation_id"),
    "clusters": ("clusters.json", "cluster_id"),
    "knowledge-states": ("knowledge_states.json", None),
    "updates": ("updates.json", "update_id"),
}
STATUS = {200: "OK", 204: "No Content", 400: "Bad Request", 404: "Not Found",
          422: "Unprocessable Entity", 500: "Internal Server Error"}
LOCAL_ORIGIN = re.compile(r"https?://(?:localhost|127\.0\.0\.1|\[::1\])(?::[0-9]+)?")


class ApiError(Exception):
    def __init__(self, status, code, message, **details):
        super().__init__(message)
        self.status = status
        self.body = {"code": code, "message": message, "details": details}


def invalid(field, message):
    return ApiError(400, "INVALID_PARAM", message, param=field)


def integer(query, field, default=None, minimum=1, maximum=None):
    raw = query.get(field)
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError:
        raise invalid(field, f"{field} must be an integer") from None
    if value < minimum or (maximum is not None and value > maximum):
        raise invalid(field, f"{field} is out of range")
    return value


def boolean(query, field):
    raw = query.get(field)
    if raw is None:
        return None
    if raw.lower() not in {"true", "false"}:
        raise invalid(field, f"{field} must be true or false")
    return raw.lower() == "true"


def exact(rows, **filters):
    return [row for row in rows
            if all(value is None or row.get(field) == value for field, value in filters.items())]


def ordered(rows, field, descending=False):
    present = [row for row in rows if row.get(field) is not None]
    missing = [row for row in rows if row.get(field) is None]
    return sorted(present, key=lambda row: row[field], reverse=descending) + missing


def paginate(rows, query, default_sort, allowed_sorts=()):
    page = integer(query, "page", 1)
    size = integer(query, "size", 20, maximum=100)
    field, direction = default_sort
    if allowed_sorts and "sort" in query:
        field, _, direction = query["sort"].partition(":")
        if field not in allowed_sorts or direction not in {"asc", "desc"}:
            raise invalid("sort", "sort must be a supported field followed by :asc or :desc")
    result = ordered(rows, field, direction == "desc")
    offset = (page - 1) * size
    return result[offset:offset + size], {"page": page, "size": size, "total": len(result)}


class MockAPI:
    def __init__(self, data_dir=ROOT / "mock"):
        self.rows = {name: json.loads((data_dir / file).read_text(encoding="utf-8"))
                     for name, (file, _) in FILES.items()}
        self.by_id = {name: {row[key]: row for row in self.rows[name]}
                      for name, (_, key) in FILES.items() if key}
        with (data_dir / "paper_edges.csv").open(encoding="utf-8", newline="") as file:
            self.paper_edges = []
            occurrences = Counter()
            for edge in csv.DictReader(file):
                content = json.dumps(edge, sort_keys=True, ensure_ascii=False).encode("utf-8")
                fingerprint = hashlib.sha256(content).hexdigest()
                occurrences[fingerprint] += 1
                edge_id = f"citation:{fingerprint}:{occurrences[fingerprint]}"
                self.paper_edges.append({"id": edge_id, "source": edge["source_paper_id"],
                                         "target": edge["target_paper_id"], "type": "Cites",
                                         "weight": float(edge["confidence"])})
        schema = json.loads((ROOT / "docs/schema_v0.json").read_text(encoding="utf-8"))
        self.defs = schema["$defs"]

    def enum(self, query, field, definition, *, required=False):
        values = self.defs[definition]["enum"] if isinstance(definition, str) else definition
        value = query.get(field)
        if (value is not None or required) and value not in values:
            raise invalid(field, f"{field} must be one of: {', '.join(values)}")
        return value

    def get(self, table, identifier):
        row = self.by_id[table].get(identifier)
        if row is None:
            raise ApiError(404, "NOT_FOUND", f"{table} record {identifier} not found")
        return row

    def graph(self, query):
        level = self.enum(query, "level", ("paper", "claim", "cluster"), required=True)
        state = self.enum(query, "state", "KnowledgeStateType")
        types = ("Cites",) if level == "paper" else "RelationType"
        relation = self.enum(query, "relation_type", types)
        window = query.get("time_window")
        start, end = 1900, 2100
        if window is not None:
            if not re.fullmatch(r"[0-9]{4}-[0-9]{4}", window):
                raise invalid("time_window", "time_window must have the form YYYY-YYYY")
            start, end = map(int, window.split("-"))
            if start > end:
                raise invalid("time_window", "time_window start must not exceed its end")
        if level == "cluster" or (level == "paper" and state is not None):
            raise ApiError(422, "UNSUPPORTED", "This graph projection is pending contract review")

        papers = {p["paper_id"]: p for p in self.rows["papers"] if start <= p["year"] <= end}
        if level == "paper":
            nodes = [{"id": pid, "type": "paper", "label": p["title"], "state": None,
                      "size": p.get("citation_count", 0), "year": p["year"]}
                     for pid, p in papers.items()]
            edges = self.paper_edges
        else:
            nodes = [{"id": c["claim_id"], "type": "claim", "label": c["finding"],
                      "state": c["status"], "size": len(c["evidence_ids"]),
                      "evidence_count": len(c["evidence_ids"]), "paper_id": c["paper_id"],
                      "year": papers[c["paper_id"]]["year"]}
                     for c in exact(self.rows["claims"], status=state) if c["paper_id"] in papers]
            edges = [{"id": r["relation_id"], "source": r["source_claim_id"],
                      "target": r["target_claim_id"], "type": r["type"], "weight": r["confidence"],
                      "condition_comparability": r["condition_comparability"]}
                     for r in exact(self.rows["relations"], type=relation)]
        ids = {node["id"] for node in nodes}
        edges = [edge for edge in edges if edge["source"] in ids and edge["target"] in ids]
        return {"nodes": sorted(nodes, key=lambda node: node["id"]),
                "edges": sorted(edges, key=lambda edge: edge["id"])}

    def dispatch(self, path, query):
        if not path.startswith("/api/v0/"):
            raise ApiError(404, "NOT_FOUND", "Route not found")
        parts = path.removeprefix("/api/v0/").strip("/").split("/")
        if len(parts) == 2 and parts[0] == "papers":
            return self.get("papers", parts[1]), {}
        if parts[0] == "claims" and len(parts) in (2, 3):
            if len(parts) == 3 and parts[2] != "evidence":
                raise ApiError(404, "NOT_FOUND", "Route not found")
            claim = self.get("claims", parts[1])
            if len(parts) == 2:
                condition = self.by_id["conditions"].get(claim.get("condition_id"))
                return {"claim": claim, "condition": condition}, {}
            evidence_ids = claim["evidence_ids"]
            rows = [self.get("evidence", eid) for eid in evidence_ids]
            return paginate(exact(rows, stance=self.enum(query, "stance", "StanceType")),
                            query, ("page", "asc"))
        if len(parts) != 1:
            raise ApiError(404, "NOT_FOUND", "Route not found")
        route = parts[0]

        if route == "papers":
            rows = exact(self.rows[route], year=integer(query, "year"), venue=query.get("venue"),
                         is_selected=boolean(query, "selected"))
            term = query.get("query", "").casefold()
            rows = [row for row in rows if term in row["title"].casefold()]
            return paginate(rows, query, ("paper_id", "asc"),
                            ("paper_id", "title", "year", "venue", "citation_count", "quality_score"))
        if route == "claims":
            rows = exact(self.rows[route], paper_id=query.get("paper_id"),
                         cluster_id=query.get("cluster_id"),
                         status=self.enum(query, "state", "KnowledgeStateType"))
            return paginate(rows, query, ("claim_id", "asc"),
                            ("claim_id", "paper_id", "cluster_id", "status", "created_at"))
        if route == "relations":
            rows = exact(self.rows[route], source_claim_id=query.get("source_claim_id"),
                         target_claim_id=query.get("target_claim_id"),
                         type=self.enum(query, "type", "RelationType"))
            return paginate(rows, query, ("relation_id", "asc"))
        if route == "clusters":
            rows = exact(self.rows[route], level=self.enum(query, "level", "ClusterLevelType"))
            return ordered(rows, "cluster_id"), {"total": len(rows)}
        if route == "graph":
            return self.graph(query), {}
        if route == "matrix":
            self.enum(query, "row", ("claim", "cluster"), required=True)
            self.enum(query, "col", ("method", "dataset", "condition", "metric"), required=True)
            self.enum(query, "state", "KnowledgeStateType")
            raise ApiError(422, "UNSUPPORTED", "Evidence matrix aggregation is pending contract review")
        if route == "knowledge-states":
            if not query.get("claim_id"):
                raise invalid("claim_id", "claim_id is required")
            rows = exact(self.rows[route], claim_id=query["claim_id"])
            return ordered(rows, "version", descending=True), {"total": len(rows)}
        if route == "updates":
            rows = exact(self.rows[route], claim_id=query.get("claim_id"), reviewed=boolean(query, "reviewed"))
            return paginate(rows, query, ("timestamp", "desc"))
        raise ApiError(404, "NOT_FOUND", "Route not found")

    def __call__(self, environ, start_response):
        method = environ["REQUEST_METHOD"]
        path = environ["PATH_INFO"]
        origin = environ.get("HTTP_ORIGIN", "")
        headers = [("Vary", "Origin")]
        if LOCAL_ORIGIN.fullmatch(origin):
            headers.extend([("Access-Control-Allow-Origin", origin),
                            ("Access-Control-Allow-Methods", "GET, OPTIONS"),
                            ("Access-Control-Allow-Headers", "Content-Type")])
        if method == "OPTIONS" and path.startswith("/api/v0/"):
            start_response("204 No Content", headers)
            return [b""]
        status = 200
        try:
            if method == "POST" and re.fullmatch(r"/api/v0/review/claims/[^/]+/?", path):
                raise ApiError(422, "UNSUPPORTED", "Review writes are pending contract review")
            if method != "GET":
                raise ApiError(404, "NOT_FOUND", "Route not found")
            query = {key: values[0] for key, values in
                     parse_qs(environ.get("QUERY_STRING", ""), keep_blank_values=True).items()}
            data, meta = self.dispatch(path, query)
            response = {"data": data, "meta": meta, "error": None}
        except ApiError as error:
            status = error.status
            response = {"data": None, "meta": {}, "error": error.body}
        except Exception:
            logging.exception("Mock API request failed")
            status = 500
            response = {"data": None, "meta": {}, "error": {
                "code": "INTERNAL", "message": "Internal server error", "details": {}}}
        body = json.dumps(response, ensure_ascii=False).encode("utf-8")
        headers.extend([("Content-Type", "application/json; charset=utf-8"),
                        ("Content-Length", str(len(body)))])
        start_response(f"{status} {STATUS[status]}", headers)
        return [body]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    with make_server("127.0.0.1", args.port, MockAPI()) as server:
        print(f"EvidenceMatrix mock API: http://127.0.0.1:{server.server_port}/api/v0", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
