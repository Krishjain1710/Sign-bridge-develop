"""Parse FSW notation to detect which hand(s) are involved and their movements."""

import re
from typing import List, Tuple
from pose.movement_types import MovementType, MovementDef


def parse_sign_box_center(fsw: str) -> Tuple[int, int]:
    """Extract sign box center from FSW M-token. Returns (cx, cy)."""
    match = re.search(r'M(\d+)x(\d+)', fsw)
    if match:
        return int(match.group(1)), int(match.group(2))
    return 500, 500


def parse_symbol_positions(fsw: str) -> List[Tuple[str, int, int]]:
    """Extract all symbols with their positions from FSW.
    Returns list of (symbol_hex, x, y) tuples.
    """
    pattern = re.compile(r'S([0-9a-fA-F]{5})(\d+)x(\d+)')
    results = []
    for match in pattern.finditer(fsw):
        sym_hex = match.group(1)
        x = int(match.group(2))
        y = int(match.group(3))
        results.append((sym_hex, x, y))
    return results


def determine_hand(sym_x: int, center_x: int) -> str:
    """Determine which hand based on symbol position relative to sign box center."""
    offset = sym_x - center_x
    if abs(offset) <= 20:
        return "both"
    elif offset < 0:
        return "left"
    else:
        return "right"


def classify_movement(sym_hex: str) -> MovementType:
    """Classify a symbol ID into a movement type using ISWA 2010 ranges."""
    try:
        sym_id = int(sym_hex[:3], 16)
    except ValueError:
        return MovementType.IDLE

    variation = 0
    if len(sym_hex) > 3:
        try:
            variation = int(sym_hex[3], 16)
        except ValueError:
            pass

    if 0x205 <= sym_id <= 0x214:
        if variation < 4:
            return MovementType.UP
        elif variation < 8:
            return MovementType.RIGHT
        elif variation < 12:
            return MovementType.DOWN
        else:
            return MovementType.LEFT
    elif 0x215 <= sym_id <= 0x21D:
        return MovementType.CIRCLE
    elif 0x21E <= sym_id <= 0x22F:
        return MovementType.WAVE
    elif 0x230 <= sym_id <= 0x245:
        return MovementType.RIGHT
    elif 0x246 <= sym_id <= 0x260:
        return MovementType.TWIST
    elif 0x261 <= sym_id <= 0x270:
        if variation % 2 == 0:
            return MovementType.PINCH
        else:
            return MovementType.SPREAD
    elif 0x271 <= sym_id <= 0x27F:
        return MovementType.SHAKE
    elif 0x300 <= sym_id <= 0x36D:
        return MovementType.TAP
    elif 0x100 <= sym_id <= 0x204:
        return MovementType.HOLD

    return MovementType.IDLE


def parse_fsw_movements(fsw: str) -> List[MovementDef]:
    """Parse a full FSW string into a list of MovementDefs with hand assignment."""
    center_x, _ = parse_sign_box_center(fsw)
    symbols = parse_symbol_positions(fsw)

    if not symbols:
        return [MovementDef(movement_type=MovementType.IDLE, hand="right")]

    movements = []
    for sym_hex, sym_x, sym_y in symbols:
        move_type = classify_movement(sym_hex)
        if move_type == MovementType.IDLE:
            continue
        hand = determine_hand(sym_x, center_x)
        movements.append(MovementDef(movement_type=move_type, hand=hand))

    if not movements:
        return [MovementDef(movement_type=MovementType.IDLE, hand="right")]

    return movements
