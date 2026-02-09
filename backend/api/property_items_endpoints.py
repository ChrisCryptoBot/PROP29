"""
Property Items API Endpoints
Unified export for Lost & Found and Packages.
Enforces authentication and property-level access.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime
import csv
from io import StringIO

from services.lost_found_service import LostFoundService
from services.package_service import PackageService
from api.auth_dependencies import get_current_user
from models import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/property-items", tags=["Property Items"])


@router.get("/export")
async def export_unified(
    format: str = Query("csv", description="Export format: pdf or csv"),
    start_date: Optional[datetime] = Query(None, description="Start date (ISO)"),
    end_date: Optional[datetime] = Query(None, description="End date (ISO)"),
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    include_lost_found: bool = Query(True, description="Include Lost & Found items"),
    include_packages: bool = Query(True, description="Include Packages"),
    current_user: User = Depends(get_current_user),
):
    """Unified export: Lost & Found and/or Packages as CSV or PDF (PDF = L&F only)."""
    try:
        fmt = format.lower() if format else "csv"
        if fmt not in ("csv", "pdf"):
            raise HTTPException(status_code=400, detail="Format must be csv or pdf")

        parts = []

        if include_lost_found:
            lf_content = await LostFoundService.export_report(
                user_id=str(current_user.user_id),
                format=fmt,
                property_id=property_id,
                start_date=start_date,
                end_date=end_date,
                status=None,
                item_type=None,
            )
            parts.append(("lost_found", lf_content))

        if include_packages and fmt == "csv":
            packages = await PackageService.get_packages(
                user_id=str(current_user.user_id),
                property_id=property_id,
                status=None,
                guest_id=None,
            )
            # Optional date filter (received_at)
            if start_date or end_date:
                filtered = []
                for p in packages:
                    rec = getattr(p, "received_at", None)
                    if rec is None:
                        filtered.append(p)
                        continue
                    rec_dt = rec if hasattr(rec, "year") else None
                    if rec_dt is None:
                        try:
                            rec_dt = datetime.fromisoformat(str(rec).replace("Z", "+00:00"))
                        except Exception:
                            filtered.append(p)
                            continue
                    if start_date and rec_dt < start_date:
                        continue
                    if end_date and rec_dt > end_date:
                        continue
                    filtered.append(p)
                packages = filtered

            out = StringIO()
            w = csv.writer(out)
            w.writerow(["Package ID", "Tracking Number", "Sender", "Status", "Received At", "Description"])
            for p in packages:
                rec_at = getattr(p, "received_at", None)
                rec_str = rec_at.isoformat() if rec_at and hasattr(rec_at, "isoformat") else str(rec_at or "")
                status_val = getattr(p, "status", "")
                if hasattr(status_val, "value"):
                    status_val = status_val.value
                w.writerow([
                    getattr(p, "package_id", ""),
                    getattr(p, "tracking_number", ""),
                    getattr(p, "sender_name", ""),
                    status_val,
                    rec_str,
                    getattr(p, "description", "") or "",
                ])
            packages_csv = out.getvalue().encode("utf-8")
            parts.append(("packages", packages_csv))

        if not parts:
            raise HTTPException(status_code=400, detail="Select at least one of include_lost_found or include_packages")

        if fmt == "pdf":
            # PDF: only L&F supported
            content = parts[0][1]
            media_type = "application/pdf"
            filename = f"property-items-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.pdf"
        else:
            # CSV: combine sections
            if len(parts) == 1:
                content = parts[0][1]
            else:
                lf_csv = parts[0][1].decode("utf-8") if isinstance(parts[0][1], bytes) else parts[0][1]
                pkg_csv = parts[1][1].decode("utf-8") if isinstance(parts[1][1], bytes) else parts[1][1]
                content = ("LOST & FOUND ITEMS\n" + lf_csv + "\n\nPACKAGES\n" + pkg_csv).encode("utf-8")
            media_type = "text/csv"
            filename = f"property-items-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.csv"

        return StreamingResponse(
            iter([content]),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Property items export failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Export failed. Please try again.")
