from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Medicine, Sale
from schemas import (
    APIResponse,
    ItemsSold,
    LowStockItem,
    PurchaseSummary,
    RecentSale,
    SalesSummary,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/sales-summary", response_model=APIResponse)
def sales_summary(db: Session = Depends(get_db)):
    """Total revenue and number of sale transactions."""
    result = db.query(
        func.coalesce(func.sum(Sale.total_price), 0).label("total_sales"),
        func.count(Sale.id).label("total_transactions"),
    ).first()

    return APIResponse(
        data=SalesSummary(
            total_sales=float(result.total_sales),
            total_transactions=result.total_transactions,
        )
    )


@router.get("/items-sold", response_model=APIResponse)
def items_sold(db: Session = Depends(get_db)):
    """Total quantity of individual items sold across all transactions."""
    total = (
        db.query(func.coalesce(func.sum(Sale.quantity_sold), 0)).scalar()
    )
    return APIResponse(data=ItemsSold(total_items_sold=int(total)))


@router.get("/low-stock", response_model=APIResponse)
def low_stock(db: Session = Depends(get_db)):
    """Medicines that are low on stock or out of stock."""
    medicines = (
        db.query(Medicine)
        .filter(Medicine.status.in_(["low_stock", "out_of_stock"]))
        .order_by(Medicine.quantity.asc())
        .all()
    )
    return APIResponse(
        data=[LowStockItem.model_validate(m) for m in medicines]
    )


@router.get("/purchase-summary", response_model=APIResponse)
def purchase_summary(db: Session = Depends(get_db)):
    """Total number of medicine entries and the overall stock value."""
    result = db.query(
        func.count(Medicine.id).label("total_medicines"),
        func.coalesce(func.sum(Medicine.quantity * Medicine.price), 0).label(
            "total_stock_value"
        ),
    ).first()

    return APIResponse(
        data=PurchaseSummary(
            total_medicines=result.total_medicines,
            total_stock_value=float(result.total_stock_value),
        )
    )


@router.get("/recent-sales", response_model=APIResponse)
def recent_sales(db: Session = Depends(get_db)):
    """Last 10 sales with the associated medicine name."""
    sales = (
        db.query(Sale)
        .join(Medicine)
        .order_by(Sale.created_at.desc())
        .limit(10)
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
