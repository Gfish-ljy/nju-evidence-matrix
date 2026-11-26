"""Validate the shared MVP mock data against the schema and cross-file IDs."""

import csv
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker
from jsonschema.exceptions import SchemaError

ROOT = Path(__file__).resolve().parent.parent
TABLES = {
    "Paper": ("paper_nodes.json", ("paper_id",)),
    "Claim": ("claims.json", ("claim_id",)),
    "Condition": ("conditions.json", ("condition_id",)),
    "Relation": ("claim_edges.json", ("relation_id",)),
    "Evidence": ("evidence.json", ("evidence_id",)),
    "Cluster": ("clusters.json", ("cluster_id",)),
    "KnowledgeState": ("knowledge_states.json", ("claim_id", "version")),
    "UpdateLog": ("updates.json", ("update_id",)),
}
REFERENCES = {
    "Claim": {"paper_id": "Paper", "condition_id": "Condition",
              "cluster_id": "Cluster", "evidence_ids": "Evidence"},
    "Condition": {"claim_id": "Claim"},
    "Relation": {"source_claim_id": "Claim", "target_claim_id": "Claim",
                 "evidence_ids": "Evidence"},
    "Evidence": {"paper_id": "Paper", "claim_id": "Claim"},
    "Cluster": {"claim_ids": "Claim"},
    "KnowledgeState": {"claim_id": "Claim", "basis_evidence_ids": "Evidence"},
    "UpdateLog": {"claim_id": "Claim", "delta_evidence_ids": "Evidence"},
    "PaperEdge": {"source_paper_id": "Paper", "target_paper_id": "Paper"},
}
PAPER_EDGE_COLUMNS = [
    "source_paper_id", "target_paper_id", "citation_context",
    "section", "stance", "confidence",
]


def validate(mock_dir: Path, schema_path: Path) -> list[str]:
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    errors = []
    records = {}
    keys = {name: set() for name in TABLES}

    for name, (filename, primary_key) in TABLES.items():
        data = json.loads((mock_dir / filename).read_text(encoding="utf-8"))
        if not isinstance(data, list):
            errors.append(f"{filename}: expected a JSON array")
            continue

        validator = Draft202012Validator(
            {"$defs": schema["$defs"], "$ref": f"#/$defs/{name}"},
            format_checker=FormatChecker(),
        )
        for index, row in enumerate(data, start=1):
            location = f"{filename} record {index}"
            violations = list(validator.iter_errors(row))
            if violations:
                for error in violations:
                    errors.append(f"{location} {error.json_path}: {error.message}")
                continue

            values = tuple(row[field] for field in primary_key)
            if values in keys[name]:
                errors.append(f"{location}: duplicate primary key {values!r}")
            keys[name].add(values)
            records.setdefault(name, []).append((location, row))

    with (mock_dir / "paper_edges.csv").open(encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file, strict=True)
        if reader.fieldnames != PAPER_EDGE_COLUMNS:
            errors.append("paper_edges.csv: unexpected header or column order")
        else:
            for row in reader:
                location = f"paper_edges.csv line {reader.line_num}"
                if None in row or any(value is None for value in row.values()):
                    errors.append(f"{location}: wrong number of columns")
                    continue
                records.setdefault("PaperEdge", []).append((location, row))

    # Avoid reporting foreign keys as missing when their target rows failed validation.
    if errors:
        return errors

    for name, fields in REFERENCES.items():
        for location, row in records.get(name, []):
            for field, target in fields.items():
                value = row.get(field)
                if value is None:
                    continue
                values = value if isinstance(value, list) else [value]
                for item in values:
                    if (item,) not in keys[target]:
                        errors.append(f"{location}: {field} references unknown {target} {item!r}")

    latest_states = {}
    for _, state in records.get("KnowledgeState", []):
        previous = latest_states.get(state["claim_id"])
        if previous is None or state["version"] > previous["version"]:
            latest_states[state["claim_id"]] = state
    for location, claim in records.get("Claim", []):
        state = latest_states.get(claim["claim_id"])
        if state is not None and claim["status"] != state["state"]:
            errors.append(f"{location}: status differs from the latest KnowledgeState")

    return errors


def main() -> int:
    try:
        errors = validate(ROOT / "mock", ROOT / "docs" / "schema_v0.json")
    except (OSError, ValueError, csv.Error, SchemaError) as error:
        print(f"Mock validation could not run: {error}", file=sys.stderr)
        return 1
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print("Mock schema and cross-file checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

