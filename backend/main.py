from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import dashboard, medicines, sales

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SwasthiQ Pharmacy API",
    description="Backend API for the Pharmacy Module – manage medicines, sales, and dashboard analytics.",
    version="1.0.0",
)

# CORS – allow all origins during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(medicines.router)
app.include_router(sales.router)
app.include_router(dashboard.router)


@app.get("/", tags=["Root"])
def root():
    return {"message": "SwasthiQ Pharmacy API is running"}
