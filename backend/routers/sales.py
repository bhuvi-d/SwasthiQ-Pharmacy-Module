from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from models import Medicine, Sale
from schemas import APIResponse, RecentSale, SaleCreate, SaleOut

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.get("", response_model=APIResponse)
def list_sales(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Return all sales, most recent first."""
    sales = (
        db.query(Sale)
        .join(Medicine)
        .order_by(Sale.created_at.desc())
        .limit(limit)
        .all()
    )
    data = [
        RecentSale(
            id=s.id,
            medicine_name=s.medicine.name,
            customer_name=s.customer_name or "",
            payment_mode=s.payment_mode or "Cash",
            quantity_sold=s.quantity_sold,
            total_price=s.total_price,
            created_at=s.created_at,
        )
        for s in sales
    ]
    return APIResponse(data=data)


@router.get("/{sale_id}", response_model=APIResponse)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    """Retrieve a single sale by ID."""
    sale = db.query(Sale).join(Medicine).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sale with id {sale_id} not found",
        )
    return APIResponse(
        data=RecentSale(
            id=sale.id,
            medicine_name=sale.medicine.name,
            customer_name=sale.customer_name or "",
            payment_mode=sale.payment_mode or "Cash",
            quantity_sold=sale.quantity_sold,
            total_price=sale.total_price,
            created_at=sale.created_at,
        )
    )
