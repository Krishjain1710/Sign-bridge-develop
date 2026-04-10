"""Legacy-compatible wrapper around the two-hand parser.

Returns simple movement string lists for backward compatibility,
but the main animation system should use two_hand_parser.parse_fsw_movements() directly.
"""

from pose.two_hand_parser import parse_fsw_movements


def parse_signwriting(signwriting: str):
    """Extract movement strings from FSW. Returns list of movement name strings."""
    movement_defs = parse_fsw_movements(signwriting)
    return [m.movement_type.value for m in movement_defs]
