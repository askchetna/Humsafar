ALLOWED_TRANSITIONS = {
    "searching": ["assigned", "cancelled"],
    "assigned": ["accepted", "cancelled", "searching"],
    "accepted": ["arrived", "cancelled"],
    "arrived": ["started", "cancelled"],
    "started": ["completed"],
    "completed": [],
    "cancelled": []
}


def can_transition(current_status, new_status):
    allowed = ALLOWED_TRANSITIONS.get(current_status, [])
    return new_status in allowed
