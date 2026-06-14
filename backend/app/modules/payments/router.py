import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.modules.payments.models import Payment
from app.modules.payments.schemas import (
    CreatePaymentSchema,
    CompletePaymentSchema,
    PaymentResponse
)
from app.modules.rides.models import Ride
from app.modules.notifications.service import create_notification

router = APIRouter()


@router.post("/create", response_model=PaymentResponse)
def create_payment(
    data: CreatePaymentSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    ride = db.query(Ride).filter(Ride.id == data.ride_id).first()

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    if ride.rider_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your ride")

    if ride.status != "completed":
        raise HTTPException(status_code=400, detail="Ride must be completed first")

    existing = db.query(Payment).filter(
        Payment.ride_id == data.ride_id
    ).first()

    if existing:
        return existing

    payment = Payment(
        id=str(uuid.uuid4()),
        ride_id=ride.id,
        rider_id=ride.rider_id,
        amount=float(ride.fare or 0),
        method=data.method or "cash",
        status="pending"
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    create_notification(
        db,
        user_id=ride.rider_id,
        title="Payment initiated",
        message=f"Payment of ₨{payment.amount} for ride {ride.id[:8]}...",
        notification_type="payment"
    )

    return payment


@router.post("/complete/{payment_id}", response_model=PaymentResponse)
def complete_payment(
    payment_id: str,
    data: CompletePaymentSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    payment = db.query(Payment).filter(Payment.id == payment_id).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.rider_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    payment.status = "completed"
    payment.transaction_ref = data.transaction_ref
    payment.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(payment)

    create_notification(
        db,
        user_id=payment.rider_id,
        title="Payment completed",
        message=f"₨{payment.amount} paid successfully",
        notification_type="payment"
    )

    return payment


@router.get("/my", response_model=list[PaymentResponse])
def my_payments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return db.query(Payment).filter(
        Payment.rider_id == current_user["user_id"]
    ).order_by(Payment.created_at.desc()).all()
