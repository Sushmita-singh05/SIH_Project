"""Unit tests for QuantumSimulator scaffold"""
import unittest
from backend.quantum.simulator import QuantumSimulator

class TestQuantumSimulator(unittest.TestCase):
    def test_simulator_scaffold(self):
        sim = QuantumSimulator(default_shots=1024)
        res = sim.run({})
        self.assertEqual(res["shots"], 1024)
        self.assertIn("counts", res)

if __name__ == "__main__":
    unittest.main()
