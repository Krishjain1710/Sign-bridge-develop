def parse_signwriting(signwriting: str):
    """
    Extract basic movement intents from SignWriting string
    """

    movements = []

    if "↑" in signwriting:
        movements.append("UP")
    if "↓" in signwriting:
        movements.append("DOWN")
    if "→" in signwriting:
        movements.append("RIGHT")
    if "←" in signwriting:
        movements.append("LEFT")
    if "↺" in signwriting or "↻" in signwriting:
        movements.append("CIRCLE")

    if not movements:
        movements.append("IDLE")

    return movements
