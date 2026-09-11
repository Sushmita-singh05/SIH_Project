"""
Hint Engine Ladder (Scaffold)
"""
class ProgressiveHintEngine:
    LADDER = {
        1: "Conceptual orientation hint",
        2: "Transformation & intermediate step hint",
        3: "Exact mathematical solution"
    }

    @classmethod
    def get_hint(cls, level: int) -> str:
        return cls.LADDER.get(level, cls.LADDER[1])
