from pydantic import BaseModel, Field
from typing import Optional

class StartContainerRequest(BaseModel):
    template: str = Field(..., example="postgres")
    duration_minutes: int = Field(default=60, ge=5, le=480)

class ContainerResponse(BaseModel):
    id: str
    name: str
    template: str
    port: int
    status: str
    started_at: str

class ContainerStats(BaseModel):
    id: str
    cpu_percent: float
    ram_mb: float
    ram_limit_mb: float
    ram_percent: float