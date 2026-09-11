"""Unit tests for CircuitParser scaffold"""
import unittest
from backend.quantum.circuit_parser import CircuitParser

class TestCircuitParser(unittest.TestCase):
    def test_circuit_parser_scaffold(self):
        data = {"operations": [{"gate": "H", "qubit": 0, "step": 0}]}
        ops = CircuitParser.parse_frontend_json(data)
        self.assertEqual(len(ops), 1)
        self.assertEqual(ops[0]["gate"], "H")

if __name__ == "__main__":
    unittest.main()
