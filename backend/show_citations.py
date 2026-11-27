"""Show a citation matrix cell and its source passages without starting HTTP."""

import argparse
import textwrap
from pathlib import Path

from backend.mock_api import ApiError, MockAPI


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle", type=Path, required=True)
    parser.add_argument("--source", required=True, help="Source paper_id")
    parser.add_argument("--reference", required=True, help="Reference ID from the matrix row")
    args = parser.parse_args()

    try:
        api = MockAPI(bundle=args.bundle)
        source = api.get("papers", args.source)
        query = {"source_paper_id": args.source, "reference_id": args.reference, "size": "100"}
        rows, meta = api.dispatch("/api/v0/experimental/citations", query)
        reference = api.citations.references[args.reference]
    except (ApiError, OSError, ValueError, KeyError) as error:
        parser.exit(1, f"Cannot show the citation cell: {error}\n")

    target = reference["title"] or args.reference
    print(f"{source['title']} -> {target}")
    print(f"Citation occurrences: {meta['total']}")
    for index, row in enumerate(rows, start=1):
        location = row["section"] or "(no section)"
        if row["page"] is not None:
            location += f", page {row['page']}"
        print(f"\n{index}. {location} [{row['marker']}]")
        print(textwrap.fill(row["citation_context"], width=100))
    if meta["total"] > len(rows):
        print("\nShowing the first 100 records. Use the API pagination to view the rest.")


if __name__ == "__main__":
    main()
