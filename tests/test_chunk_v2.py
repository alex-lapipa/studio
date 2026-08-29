import unittest
from pipeline.chunk_v2 import MAXC, split_long_unit


class ChunkV2Tests(unittest.TestCase):
    def assert_bounded(self, text):
        pieces = split_long_unit(text)
        self.assertTrue(pieces)
        self.assertTrue(all(0 < len(p) <= MAXC for p in pieces))
        return pieces

    def test_exact_boundary(self):
        pieces = self.assert_bounded("x" * MAXC)
        self.assertEqual(len(pieces), 1)

    def test_one_over_boundary(self):
        pieces = self.assert_bounded("x" * (MAXC + 1))
        self.assertGreaterEqual(len(pieces), 2)

    def test_known_analog_lab_pathology_size(self):
        pieces = self.assert_bounded("A" * 11316)
        self.assertGreater(len(pieces), 1)

    def test_sentence_boundary_material(self):
        pieces = self.assert_bounded("Technical sentence about MIDI clock. " * 500)
        self.assertGreater(len(pieces), 1)

    def test_long_word_stream(self):
        pieces = self.assert_bounded("word " * 5000)
        self.assertGreater(len(pieces), 1)


if __name__ == "__main__":
    unittest.main()
