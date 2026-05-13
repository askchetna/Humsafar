from math import radians
from math import sin
from math import cos
from math import sqrt
from math import atan2


def calculate_eta(
    driver_lat,
    driver_lng,
    rider_lat,
    rider_lng
):

    R = 6371

    dlat = radians(
        rider_lat - driver_lat
    )

    dlng = radians(
        rider_lng - driver_lng
    )

    a = (
        sin(dlat / 2) ** 2
        +
        cos(radians(driver_lat))
        *
        cos(radians(rider_lat))
        *
        sin(dlng / 2) ** 2
    )

    c = 2 * atan2(
        sqrt(a),
        sqrt(1 - a)
    )

    distance = R * c

    # AVERAGE CITY SPEED
    speed = 30

    eta_minutes = (
        distance / speed
    ) * 60

    return round(
        eta_minutes,
        2
    )