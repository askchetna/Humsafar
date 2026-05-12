VALID_TRANSITIONS = {

    "searching": ["assigned"],

    "assigned": [
        "accepted",
        "cancelled"
    ],

    "accepted": [
        "started",
        "cancelled"
    ],

    "started": [
        "completed"
    ]
}
