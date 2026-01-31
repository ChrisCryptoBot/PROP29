from fastapi import APIRouter, Depends, HTTPException, Header, Body, Query
from fastapi.responses import StreamingResponse
from typing import Any, Dict, Optional, List
import csv
import io
from datetime import datetime
from api.auth_dependencies import get_current_user_optional, verify_hardware_ingest_key
from models import User
from schemas import (
    AccessControlEmergencyRequest,
    AccessControlEmergencyResponse,
    AccessControlUserCreate,
    AccessControlUserUpdate,
    AccessPointCreate,
    AccessPointUpdate,
    AccessControlSyncEventsRequest,
    AccessControlAuditCreate,
    AgentEventCreate
)
from services.access_control_service import AccessControlService

router = APIRouter(prefix="/access-control", tags=["Access Control"])


@router.get("/points")
async def get_access_points(
    property_id: Optional[str] = None,
    current_user: User | None = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    user_id = str(current_user.user_id) if current_user else None
    data = await AccessControlService.get_access_points(property_id, user_id)
    return {"data": data, "pagination": {"page": 1, "limit": len(data), "total": len(data), "totalPages": 1}}


@router.post("/points")
async def create_access_point(
    payload: AccessPointCreate,
    property_id: Optional[str] = None,
    current_user: User | None = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    user_id = str(current_user.user_id) if current_user else None
    data = await AccessControlService.create_access_point(payload.dict(), property_id, user_id)
    return {"data": data, "message": "Access point created", "success": True}


@router.put("/points/{point_id}")
async def update_access_point(
    point_id: str,
    payload: AccessPointUpdate,
    current_user: User | None = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    data = await AccessControlService.update_access_point(point_id, payload.dict(exclude_unset=True))
    return {"data": data, "message": "Access point updated", "success": True}


@router.delete("/points/{point_id}")
async def delete_access_point(
    point_id: str,
    current_user: User | None = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    await AccessControlService.delete_access_point(point_id)
    return {"success": True}


@router.get("/users")
async def get_access_users(
    property_id: Optional[str] = None,
    current_user: User | None = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    user_id = str(current_user.user_id) if current_user else None
    data = await AccessControlService.get_access_users(property_id, user_id)
    return {"data": data, "pagination": {"page": 1, "limit": len(data), "total": len(data), "totalPages": 1}}


@router.post("/users")
async def create_access_user(
    payload: AccessControlUserCreate,
    property_id: Optional[str] = None,
    current_user: User | None = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    user_id = str(current_user.user_id) if current_user else None
    data = await AccessControlService.create_access_user(payload.dict(), property_id, user_id)
    return {"data": data, "message": "Access user created", "success": True}


@router.put("/users/{user_id}")
async def update_access_user(
    user_id: str,
    payload: AccessControlUserUpdate,
    current_user: User | None = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    data = await AccessControlService.update_access_user(user_id, payload.dict(exclude_unset=True))
    return {"data": data, "message": "Access user updated", "success": True}


@router.delete("/users/{user_id}")
async def delete_access_user(
    user_id: str,
    current_user: User | None = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    await AccessControlService.delete_access_user(user_id)
    return {"success": True}


@router.get("/events")
async def get_access_events(
    property_id: Optional[str] = None,
    action: Optional[str] = None,
    userId: Optional[str] = None,
    accessPointId: Optional[str] = None,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    current_user: User | None = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    user_id = str(current_user.user_id) if current_user else None
    filters = {
        "action": action,
        "userId": userId,
        "accessPointId": accessPointId,
        "startDate": startDate,
        "endDate": endDate
    }
    data = await AccessControlService.get_access_events_summary(property_id, user_id, filters)
    return {"data": data, "pagination": {"page": 1, "limit": len(data), "total": len(data), "totalPages": 1}}


@router.post("/events/sync")
async def sync_access_events(
    payload: AccessControlSyncEventsRequest,
    property_id: Optional[str] = None,
    current_user: User | None = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    user_id = str(current_user.user_id) if current_user else None
    data = await AccessControlService.sync_cached_events(
        payload.access_point_id,
        payload.events,
        property_id,
        user_id
    )
    return {"data": data, "message": "Events synced", "success": True}


@router.post("/events/agent")
async def create_agent_event(
    payload: AgentEventCreate,
    property_id: Optional[str] = None,
    current_user: User | None = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    """
    Endpoint for agent mobile devices to submit access events.
    Events are created with review_status='pending' and require manager approval.
    
    Features:
    - Idempotency: Duplicate events (same idempotency_key) are rejected
    - Source tracking: Tracks agent_id, device_id, and metadata
    - Auto-validation: Validates access point and user exist
    """
    user_id = str(current_user.user_id) if current_user else None
    
    # Check idempotency if key provided
    if payload.idempotency_key:
        existing = await AccessControlService.check_idempotency(payload.idempotency_key)
        if existing:
            return {
                "data": existing,
                "message": "Event already submitted (idempotent)",
                "success": True,
                "duplicate": True
            }
    
    data = await AccessControlService.create_agent_event(
        payload.dict(),
        property_id,
        user_id
    )
    return {"data": data, "message": "Agent event submitted for review", "success": True}


@router.put("/events/{event_id}/review")
async def review_agent_event(
    event_id: str,
    action: str,  # 'approve' or 'reject'
    reason: Optional[str] = None,
    current_user: User | None = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    """
    Endpoint for managers to review agent-submitted events.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    user_id = str(current_user.user_id)
    data = await AccessControlService.review_agent_event(
        event_id,
        action,
        reason,
        user_id
    )
    return {"data": data, "message": f"Event {action}d", "success": True}


@router.get("/metrics")
async def get_access_metrics(
    property_id: Optional[str] = None,
    current_user: User | None = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    user_id = str(current_user.user_id) if current_user else None
    data = await AccessControlService.get_access_metrics(property_id, user_id)
    return {"data": data}


@router.post("/emergency/lockdown", response_model=AccessControlEmergencyResponse)
async def emergency_lockdown(
    payload: AccessControlEmergencyRequest,
    current_user: User | None = Depends(get_current_user_optional)
):
    user_id = str(current_user.user_id) if current_user else None
    return await AccessControlService.apply_emergency_mode(
        "lockdown",
        payload.property_id,
        user_id,
        payload.reason,
        payload.timeout_minutes
    )


@router.post("/emergency/unlock", response_model=AccessControlEmergencyResponse)
async def emergency_unlock(
    payload: AccessControlEmergencyRequest,
    current_user: User | None = Depends(get_current_user_optional)
):
    user_id = str(current_user.user_id) if current_user else None
    return await AccessControlService.apply_emergency_mode(
        "unlock",
        payload.property_id,
        user_id,
        payload.reason,
        payload.timeout_minutes
    )


@router.post("/emergency/restore", response_model=AccessControlEmergencyResponse)
async def emergency_restore(
    payload: AccessControlEmergencyRequest,
    current_user: User | None = Depends(get_current_user_optional)
):
    user_id = str(current_user.user_id) if current_user else None
    return await AccessControlService.apply_emergency_mode(
        "restore",
        payload.property_id,
        user_id,
        payload.reason,
        payload.timeout_minutes
    )


@router.post("/ai-behavior-analysis")
async def ai_behavior_analysis() -> Dict[str, Any]:
    return {"anomalies": []}


@router.post("/audit")
async def create_access_control_audit_entry(
    payload: AccessControlAuditCreate,
    property_id: Optional[str] = None,
    current_user: User | None = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    user_id = str(current_user.user_id) if current_user else None
    data = await AccessControlService.create_audit_entry(payload, property_id, user_id)
    return {"data": data, "success": True}


@router.get("/audit")
async def get_access_control_audit_entries(
    property_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User | None = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    data = await AccessControlService.get_audit_entries(property_id, limit, offset)
    return {"data": data, "pagination": {"page": 1, "limit": limit, "total": len(data), "totalPages": 1}}


@router.post("/ai-behavior-profiles")
async def ai_behavior_profiles() -> Dict[str, Any]:
    return {"profiles": []}


@router.post("/ai-classify-event")
async def ai_classify_event() -> Dict[str, Any]:
    return {
        "isAnomalous": False,
        "confidence": 0.5,
        "reasoning": "Simulation mode (AI not enabled)",
        "riskLevel": "low"
    }


def _build_simple_pdf(lines: List[str]) -> bytes:
    def escape_pdf_text(text: str) -> str:
        return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    y_position = 760
    content_lines: List[str] = []
    for line in lines:
        content_lines.append(f"BT /F1 12 Tf 72 {y_position} Td ({escape_pdf_text(line)}) Tj ET")
        y_position -= 16
    content_stream = "\n".join(content_lines)
    content_bytes = content_stream.encode("utf-8")

    parts: List[bytes] = [b"%PDF-1.4\n"]
    offsets: List[int] = []

    def add_object(obj_number: int, body: str) -> None:
        offsets.append(sum(len(part) for part in parts))
        parts.append(f"{obj_number} 0 obj\n{body}\nendobj\n".encode("utf-8"))

    add_object(1, "<< /Type /Catalog /Pages 2 0 R >>")
    add_object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    add_object(
        3,
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        "/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>"
    )
    add_object(4, f"<< /Length {len(content_bytes)} >>\nstream\n{content_stream}\nendstream")
    add_object(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    xref_start = sum(len(part) for part in parts)
    xref = ["xref", f"0 {len(offsets) + 1}", "0000000000 65535 f "]
    for offset in offsets:
        xref.append(f"{offset:010d} 00000 n ")
    trailer = [
        "trailer",
        f"<< /Size {len(offsets) + 1} /Root 1 0 R >>",
        "startxref",
        str(xref_start),
        "%%EOF"
    ]
    parts.append(("\n".join(xref + trailer) + "\n").encode("utf-8"))
    return b"".join(parts)


@router.get("/events/export")
async def export_access_events(
    format: str = "csv",
    property_id: Optional[str] = None,
    current_user: User | None = Depends(get_current_user_optional)
):
    user_id = str(current_user.user_id) if current_user else None
    events = await AccessControlService.get_access_events_summary(property_id, user_id)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    if format.lower() == "json":
        return {"data": events, "generated_at": datetime.utcnow().isoformat()}
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Event ID", "User", "Access Point", "Action", "Timestamp", "Location", "Method"])
    for event in events:
        writer.writerow([
            event["id"],
            event["userName"],
            event["accessPointName"],
            event["action"],
            event["timestamp"],
            event["location"],
            event["accessMethod"]
        ])
    output.seek(0)
    filename = f"access_events_{timestamp}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/points/{point_id}/heartbeat")
async def access_point_heartbeat(
    point_id: str,
    body: Optional[Dict[str, Any]] = Body(None),
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> Dict[str, Any]:
    """
    Record heartbeat from access point hardware device.
    Auth: JWT or X-API-Key (hardware).
    
    Updates last_heartbeat timestamp and connection status.
    """
    if current_user is None and not x_api_key:
        raise HTTPException(status_code=401, detail="Authentication required")
    if current_user is None and x_api_key:
        await verify_hardware_ingest_key(x_api_key)
    
    device_id = (body or {}).get("device_id") if body else None
    data = await AccessControlService.record_access_point_heartbeat(
        point_id,
        device_id,
        (body or {}).get("firmware_version"),
        (body or {}).get("battery_level"),
        (body or {}).get("sensor_status")
    )
    return {"ok": True, "point_id": point_id, "data": data}


@router.get("/points/health")
async def access_points_health(
    property_id: Optional[str] = Query(None),
    current_user: User | None = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    """
    Get access point health status (last_heartbeat, connection_status).
    Returns heartbeat data for all access points or filtered by property_id.
    """
    data = await AccessControlService.get_access_points_health(property_id)
    return {"data": data}


@router.post("/points/register")
async def register_hardware_device(
    payload: Dict[str, Any] = Body(...),
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> Dict[str, Any]:
    """
    Register a new hardware access point device (Plug & Play).
    Auth: X-API-Key (hardware) required.
    
    Payload:
    {
        "device_id": "unique-device-id",
        "device_type": "door" | "gate" | "elevator" | "turnstile" | "barrier",
        "firmware_version": "1.0.0",
        "hardware_vendor": "VendorName",
        "mac_address": "00:11:22:33:44:55",
        "ip_address": "192.168.1.100",
        "location": "Building A - Main Entrance",
        "capabilities": ["card", "biometric", "pin"]
    }
    """
    if current_user is None and not x_api_key:
        raise HTTPException(status_code=401, detail="Authentication required")
    if current_user is None and x_api_key:
        await verify_hardware_ingest_key(x_api_key)
    
    data = await AccessControlService.register_hardware_device(payload)
    return {"data": data, "message": "Device registered successfully", "success": True}


@router.get("/reports/export")
async def export_access_report(
    format: str = "pdf",
    property_id: Optional[str] = None,
    current_user: User | None = Depends(get_current_user_optional)
):
    user_id = str(current_user.user_id) if current_user else None
    metrics = await AccessControlService.get_access_metrics(property_id, user_id)
    generated_at = datetime.utcnow().isoformat()
    report_lines = [
        "Access Control Summary Report",
        f"Generated at: {generated_at}",
        f"Total Access Points: {metrics['totalAccessPoints']}",
        f"Active Access Points: {metrics['activeAccessPoints']}",
        f"Total Users: {metrics['totalUsers']}",
        f"Active Users: {metrics['activeUsers']}",
        f"Today's Access Events: {metrics['todayAccessEvents']}",
        f"Denied Events Today: {metrics['deniedAccessEvents']}",
        f"Security Score: {metrics['securityScore']}"
    ]
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Metric", "Value"])
        for key, value in [
            ("Total Access Points", metrics["totalAccessPoints"]),
            ("Active Access Points", metrics["activeAccessPoints"]),
            ("Total Users", metrics["totalUsers"]),
            ("Active Users", metrics["activeUsers"]),
            ("Today's Access Events", metrics["todayAccessEvents"]),
            ("Denied Events Today", metrics["deniedAccessEvents"]),
            ("Security Score", metrics["securityScore"]),
            ("Generated At", generated_at)
        ]:
            writer.writerow([key, value])
        output.seek(0)
        filename = f"access_control_report_{timestamp}.csv"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    pdf_bytes = _build_simple_pdf(report_lines)
    filename = f"access_control_report_{timestamp}.pdf"
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
