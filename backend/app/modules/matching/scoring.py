VEHICLE_MATCH_BONUS = {
    "economy": 0,
    "comfort": 10,
    "premium": 20,
    "bike": 5,
    "delivery": 15
}


def calculate_driver_score(
    distance,
    vehicle_type="economy",
    ride_type="standard"
):

    base = 1000 - distance

    vehicle_bonus = VEHICLE_MATCH_BONUS.get(vehicle_type, 0)

    if ride_type == "delivery" and vehicle_type in ("delivery", "bike"):
        vehicle_bonus += 50

    return base + vehicle_bonus
