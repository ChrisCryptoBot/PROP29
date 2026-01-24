from fastapi import APIRouter
from typing import Any, Dict, List
from datetime import datetime

router = APIRouter(prefix="/lockdown", tags=["Lockdown"])

_lockdown_state: Dict[str, Any] = {
    "isActive": False,
    "initiatedAt": None,
    "initiatedBy": None,
    "reason": None,
    "affectedZones": ["All Zones"]
}

_hardware_devices: List[Dict[str, Any]] = [
    {
        "id": "door-001",
        "name": "Executive Wing Door",
        "type": "door",
        "location": "Executive Wing",
        "status": "locked",
        "lastActivity": datetime.utcnow().isoformat()
    },
    {
        "id": "alarm-001",
        "name": "Main Lobby Alarm",
        "type": "alarm",
        "location": "Main Lobby",
        "status": "unlocked",
        "lastActivity": datetime.utcnow().isoformat()
    },
    {
        "id": "camera-001",
        "name": "Loading Dock Camera",
        "type": "camera",
        "location": "Loading Dock",
        "status": "locked",
        "lastActivity": datetime.utcnow().isoformat()
    }
]

_lockdown_history: List[Dict[str, Any]] = []


@router.get("/status")
async def get_lockdown_status() -> Dict[str, Any]:
    return {
        "isActive": _lockdown_state["isActive"],
        "initiatedAt": _lockdown_state["initiatedAt"],
        "initiatedBy": _lockdown_state["initiatedBy"],
        "reason": _lockdown_state["reason"],
        "affectedZones": _lockdown_state["affectedZones"]
    }


@router.get("/hardware")
async def get_lockdown_hardware() -> List[Dict[str, Any]]:
    return _hardware_devices


@router.get("/history")
async def get_lockdown_history() -> List[Dict[str, Any]]:
    return _lockdown_history


@router.post("/initiate")
async def initiate_lockdown(payload: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.utcnow().isoformat()
    reason = payload.get("reason")
    affected_zones = payload.get("affectedZones") or ["All Zones"]
    _lockdown_state.update({
        "isActive": True,
        "initiatedAt": now,
        "initiatedBy": "System Operator",
        "reason": reason,
        "affectedZones": affected_zones
    })
    _lockdown_history.insert(0, {
        "id": f"lockdown-{len(_lockdown_history) + 1}",
        "type": "initiated",
        "timestamp": now,
        "initiatedBy": "System Operator",
        "reason": reason,
        "affectedHardware": [device["id"] for device in _hardware_devices],
        "status": "active"
    })
    return {
        "isActive": True,
        "initiatedAt": now,
        "initiatedBy": "System Operator",
        "reason": reason,
        "affectedZones": affected_zones
    }


@router.post("/cancel")
async def cancel_lockdown() -> Dict[str, Any]:
    now = datetime.utcnow().isoformat()
    _lockdown_state.update({
        "isActive": False,
        "initiatedAt": None,
        "initiatedBy": None,
        "reason": None
    })
    _lockdown_history.insert(0, {
        "id": f"lockdown-{len(_lockdown_history) + 1}",
        "type": "cancelled",
        "timestamp": now,
        "initiatedBy": "System Operator",
        "reason": "Operator cancellation",
        "affectedHardware": [device["id"] for device in _hardware_devices],
        "status": "completed"
    })
    return {"isActive": False, "affectedZones": _lockdown_state["affectedZones"]}


@router.post("/test")
async def test_lockdown() -> Dict[str, Any]:
    now = datetime.utcnow().isoformat()
    _lockdown_history.insert(0, {
        "id": f"lockdown-{len(_lockdown_history) + 1}",
        "type": "test",
        "timestamp": now,
        "initiatedBy": "System Operator",
        "reason": "System test",
        "affectedHardware": [device["id"] for device in _hardware_devices],
        "status": "completed"
    })
    return {"success": True, "message": "Lockdown test executed"}
