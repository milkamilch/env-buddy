from pydantic import BaseModel, Field
from typing import Optional

class StartContainerRequest(BaseModel):
    template: str = Field(..., example="postgres")
    duration_minutes: int = Field(default=60, ge=5, le=480)
    env_overrides: dict[str, str] = {}
    host_port: Optional[int] = None
    container_name: Optional[str] = None
    mem_limit: Optional[str] = None  # e.g. "512m", "1g"
    cpu_limit: Optional[float] = None  # e.g. 0.5 = 50% of one CPU core
    password: Optional[str] = None

class StackContainerSpec(BaseModel):
    service_name:   str
    image:          str
    internal_port:  int
    env:            dict[str, str] = {}
    host_port:      Optional[int] = None
    container_name: Optional[str] = None

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