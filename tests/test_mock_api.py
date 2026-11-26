import json
import unittest
from wsgiref.util import setup_testing_defaults

from backend.mock_api import MockAPI


class MockAPITest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = MockAPI()

    def request(self, route, method="GET", origin=""):
        path, _, query = route.partition("?")
        env = {}
        setup_testing_defaults(env)
        env.update(PATH_INFO="/api/v0/" + path, QUERY_STRING=query,
                   REQUEST_METHOD=method, HTTP_ORIGIN=origin)
        response = []
        body = b"".join(self.app(env, lambda status, headers: response.extend(
            (int(status.split()[0]), dict(headers)))))
        return *response, json.loads(body) if body else None

    def test_browse_papers(self):
        status, _, body = self.request("papers?selected=true&size=2&page=2&sort=paper_id:desc")
        self.assertEqual(status, 200)
        self.assertEqual(body["meta"], {"page": 2, "size": 2, "total": 5})
        self.assertEqual([row["paper_id"] for row in body["data"]], ["P0003", "P0002"])
        for row in body["data"]:
            self.assertEqual(self.request(f"papers/{row['paper_id']}")[2]["data"], row)

    def test_claim_condition_and_cross_paper_evidence(self):
        status, _, body = self.request("claims/C0010")
        self.assertEqual(status, 200)
        self.assertEqual(body["data"]["condition"]["claim_id"], "C0010")
        status, _, body = self.request("claims/C0010/evidence?stance=Contrast")
        self.assertEqual(status, 200)
        self.assertEqual(body["meta"]["total"], 1)
        evidence = body["data"][0]
        self.assertEqual((evidence["evidence_id"], evidence["paper_id"]), ("E0022", "P0004"))
        self.assertTrue(evidence["quote"])

    def test_graph_filters_keep_only_edges_with_visible_endpoints(self):
        status, _, body = self.request("graph?level=claim&relation_type=Supports")
        self.assertEqual(status, 200)
        self.assertGreater(len(body["data"]["edges"]), 0)
        self.assertTrue(all(edge["type"] == "Supports" for edge in body["data"]["edges"]))
        for query in ("level=claim&time_window=2024-2024", "level=paper&time_window=2023-2024"):
            status, _, body = self.request("graph?" + query)
            self.assertEqual(status, 200)
            nodes = {node["id"] for node in body["data"]["nodes"]}
            self.assertGreater(len(nodes), 0)
            for edge in body["data"]["edges"]:
                self.assertTrue({edge["source"], edge["target"]} <= nodes)

    def test_existing_reads_and_error_envelopes(self):
        for route in ("claims?paper_id=P0003", "relations?type=Contradicts", "clusters",
                      "updates?claim_id=C0010", "knowledge-states?claim_id=C0010"):
            with self.subTest(route=route):
                status, _, body = self.request(route)
                self.assertEqual(status, 200)
                self.assertIsNone(body["error"])
                self.assertGreater(body["meta"]["total"], 0)
        for route, expected, code in (
            ("papers?size=101", 400, "INVALID_PARAM"),
            ("claims?state=unknown", 400, "INVALID_PARAM"),
            ("graph?level=paper&time_window=2026-2022", 400, "INVALID_PARAM"),
            ("claims/C9999/evidence", 404, "NOT_FOUND"),
            ("graph?level=cluster", 422, "UNSUPPORTED"),
            ("matrix?row=claim&col=condition", 422, "UNSUPPORTED"),
        ):
            with self.subTest(route=route):
                status, _, body = self.request(route)
                self.assertEqual(status, expected)
                self.assertIsNone(body["data"])
                self.assertEqual(body["error"]["code"], code)
        self.assertEqual(self.request("review/claims/C0010", method="POST")[0], 422)

    def test_local_cors(self):
        origin = "http://localhost:5173"
        status, headers, body = self.request("graph", method="OPTIONS", origin=origin)
        self.assertEqual(status, 204)
        self.assertEqual(headers["Access-Control-Allow-Origin"], origin)
        self.assertIsNone(body)
        self.assertNotIn("Access-Control-Allow-Origin", self.request(
            "papers", origin="https://outside.example")[1])


if __name__ == "__main__":
    unittest.main()
