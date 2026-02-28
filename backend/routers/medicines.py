from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from models import Medicine, Sale
from schemas import (
    APIResponse,
    MedicineCreate,
    MedicineOut,
    MedicineStatusUpdate,
    MedicineUpdate,
    SaleCreate,
    SaleOut,
)

router = APIRouter(prefix="/medicines", tags=["Medicines"])




def compute_status(quantity: int, expiry_date: date) -> str:
    """Derive the medicine status based on business rules."""
    if quantity == 0:
        return "out_of_stock"
    if expiry_date < date.today():
        return "expired"
    if quantity < 10:
        return "low_stock"
    return "active"


def _medicine_or_404(db: Session, medicine_id: int) -> Medicine:
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine with id {medicine_id} not found",
        )
    return medicine



@router.get("", response_model=APIResponse)
def list_medicines(
    search: str | None = Query(None, description="Search by name or generic name"),
    status_filter: str | None = Query(
        None, alias="status", description="Filter by status"
    ),
    db: Session = Depends(get_db),
):
    """Return all medicines with optional search and status filtering."""
    query = db.query(Medicine)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            Medicine.name.ilike(pattern) | Medicine.generic_name.ilike(pattern)
        )

    if status_filter:
        query = query.filter(Medicine.status == status_filter)

    medicines = query.order_by(Medicine.created_at.desc()).all()
    return APIResponse(
        data=[MedicineOut.model_validate(m) for m in medicines]
    )


@router.post("", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(payload: MedicineCreate, db: Session = Depends(get_db)):
    """Create a new medicine entry."""
    medicine = Medicine(
        **payload.model_dump(),
        status=compute_status(payload.quantity, payload.expiry_date),
    )
    db.add(medicine)
    db.commit()
    db.refresh(medicine)
    return APIResponse(data=MedicineOut.model_validate(medicine))


@router.put("/{medicine_id}", response_model=APIResponse)
def update_medicine(
    medicine_id: int,
    payload: MedicineUpdate,
    db: Session = Depends(get_db),
):
    """Full update of a medicine record."""
    medicine = _medicine_or_404(db, medicine_id)

    for field, value in payload.model_dump().items():
        setattr(medicine, field, value)

    medicine.status = compute_status(medicine.quantity, medicine.expiry_date)
    db.commit()
    db.refresh(medicine)
    return APIResponse(data=MedicineOut.model_validate(medicine))


@router.patch("/{medicine_id}/status", response_model=APIResponse)
def update_medicine_status(
    medicine_id: int,
    payload: MedicineStatusUpdate,
    db: Session = Depends(get_db),
):
    """Manually override the status of a medicine."""
    medicine = _medicine_or_404(db, medicine_id)
    medicine.status = payload.status
    db.commit()
    db.refresh(medicine)
    return APIResponse(data=MedicineOut.model_validate(medicine))




@router.post(
    "/sales",
    response_model=APIResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Sales"],
)
def create_sale(payload: SaleCreate, db: Session = Depends(get_db)):
    """Record a new sale and auto-update medicine stock."""
    medicine = _medicine_or_404(db, payload.medicine_id)

    if medicine.quantity < payload.quantity_sold:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock for this sale",
        )


    medicine.quantity -= payload.quantity_sold
    medicine.status = compute_status(medicine.quantity, medicine.expiry_date)

    sale = Sale(
        medicine_id=payload.medicine_id,
        customer_name=payload.customer_name or "",
        payment_mode=payload.payment_mode or "Cash",
        quantity_sold=payload.quantity_sold,
        total_price=round(payload.quantity_sold * medicine.price, 2),
    )
    db.add(sale)
    db.commit()
    db.refresh(sale)
    return APIResponse(data=SaleOut.model_validate(sale))
