from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, Field




class APIResponse(BaseModel):
    success: bool = True
    data: Any = None




class MedicineCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    generic_name: str = Field(..., min_length=1, max_length=255)
    batch_no: str = Field(..., min_length=1, max_length=100)
    expiry_date: date
    quantity: int = Field(..., ge=0)
    price: float = Field(..., gt=0)
    mrp: Optional[float] = Field(0, ge=0)
    supplier: Optional[str] = Field("", max_length=255)


class MedicineUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    generic_name: str = Field(..., min_length=1, max_length=255)
    batch_no: str = Field(..., min_length=1, max_length=100)
    expiry_date: date
    quantity: int = Field(..., ge=0)
    price: float = Field(..., gt=0)
    mrp: Optional[float] = Field(0, ge=0)
    supplier: Optional[str] = Field("", max_length=255)


class MedicineStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|low_stock|expired|out_of_stock)$")


class MedicineOut(BaseModel):
    id: int
    name: str
    generic_name: str
    batch_no: str
    expiry_date: date
    quantity: int
    price: float
    mrp: Optional[float] = None
    supplier: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}




class SaleCreate(BaseModel):
    medicine_id: int
    quantity_sold: int = Field(..., gt=0)
    customer_name: Optional[str] = Field("", max_length=255)
    payment_mode: Optional[str] = Field("Cash", max_length=50)


class SaleOut(BaseModel):
    id: int
    medicine_id: int
    customer_name: Optional[str] = None
    payment_mode: Optional[str] = None
    quantity_sold: int
    total_price: float
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}




class SalesSummary(BaseModel):
    total_sales: float
    total_transactions: int


class ItemsSold(BaseModel):
    total_items_sold: int


class LowStockItem(BaseModel):
    id: int
    name: str
    generic_name: str
    quantity: int
    status: str

    model_config = {"from_attributes": True}


class PurchaseSummary(BaseModel):
    total_medicines: int
    total_stock_value: float


class RecentSale(BaseModel):
    id: int
    medicine_name: str
    customer_name: Optional[str] = None
    payment_mode: Optional[str] = None
    quantity_sold: int
    total_price: float
    created_at: Optional[datetime] = None
