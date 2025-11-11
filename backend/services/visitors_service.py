"""
Visitors Management Service for PROPER 2.9
Handles visitor registration, check-in/check-out, and visitor tracking
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from database import SessionLocal
from models import Visitor, VisitorLog, VisitorBadge
from schemas import VisitorCreate, VisitorLogCreate
from fastapi import HTTPException, status
import logging
import json
import secrets

logger = logging.getLogger(__name__)

class VisitorsService:
    """Service for managing visitor operations"""
    
    @staticmethod
    async def register_visitor(visitor: VisitorCreate, user_id: str) -> Dict[str, Any]:
        """Register a new visitor"""
        db = SessionLocal()
        try:
            # Check if visitor already exists
            existing_visitor = db.query(Visitor).filter(
                Visitor.property_id == visitor.property_id,
                Visitor.email == visitor.email
            ).first()
            
            if existing_visitor:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Visitor with this email already exists"
                )
            
            # Create visitor
            db_visitor = Visitor(
                property_id=visitor.property_id,
                first_name=visitor.first_name,
                last_name=visitor.last_name,
                email=visitor.email,
                phone=visitor.phone,
                company=visitor.company,
                purpose_of_visit=visitor.purpose_of_visit,
                host_user_id=visitor.host_user_id,
                expected_arrival=visitor.expected_arrival,
                expected_departure=visitor.expected_departure,
                special_requirements=visitor.special_requirements,
                status="registered"
            )
            
            db.add(db_visitor)
            db.commit()
            db.refresh(db_visitor)
            
            return {
                "visitor_id": db_visitor.visitor_id,
                "first_name": db_visitor.first_name,
                "last_name": db_visitor.last_name,
                "email": db_visitor.email,
                "status": db_visitor.status,
                "registration_date": db_visitor.created_at.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error registering visitor: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to register visitor"
            )
        finally:
            db.close()
    
    @staticmethod
    async def check_in_visitor(visitor_id: str, user_id: str) -> Dict[str, Any]:
        """Check in a visitor"""
        db = SessionLocal()
        try:
            visitor = db.query(Visitor).filter(Visitor.visitor_id == visitor_id).first()
            
            if not visitor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Visitor not found"
                )
            
            if visitor.status == "checked_in":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Visitor is already checked in"
                )
            
            # Generate visitor badge
            badge_number = f"VB{datetime.utcnow().strftime('%Y%m%d')}{secrets.token_hex(3).upper()}"
            
            # Create visitor badge
            badge = VisitorBadge(
                visitor_id=visitor_id,
                badge_number=badge_number,
                issued_by=user_id,
                issued_at=datetime.utcnow(),
                status="active"
            )
            
            db.add(badge)
            
            # Update visitor status
            visitor.status = "checked_in"
            visitor.actual_arrival = datetime.utcnow()
            
            # Create visitor log entry
            log_entry = VisitorLog(
                visitor_id=visitor_id,
                property_id=visitor.property_id,
                event_type="check_in",
                timestamp=datetime.utcnow(),
                location="main_entrance",
                processed_by=user_id,
                notes="Visitor checked in successfully"
            )
            
            db.add(log_entry)
            db.commit()
            
            return {
                "visitor_id": visitor_id,
                "badge_number": badge_number,
                "check_in_time": datetime.utcnow().isoformat(),
                "status": "checked_in",
                "message": "Visitor checked in successfully"
            }
            
        except Exception as e:
            logger.error(f"Error checking in visitor: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to check in visitor"
            )
        finally:
            db.close()
    
    @staticmethod
    async def check_out_visitor(visitor_id: str, user_id: str) -> Dict[str, Any]:
        """Check out a visitor"""
        db = SessionLocal()
        try:
            visitor = db.query(Visitor).filter(Visitor.visitor_id == visitor_id).first()
            
            if not visitor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Visitor not found"
                )
            
            if visitor.status != "checked_in":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Visitor is not checked in"
                )
            
            # Update visitor status
            visitor.status = "checked_out"
            visitor.actual_departure = datetime.utcnow()
            
            # Deactivate visitor badge
            badge = db.query(VisitorBadge).filter(
                VisitorBadge.visitor_id == visitor_id,
                VisitorBadge.status == "active"
            ).first()
            
            if badge:
                badge.status = "returned"
                badge.returned_at = datetime.utcnow()
                badge.returned_to = user_id
            
            # Create visitor log entry
            log_entry = VisitorLog(
                visitor_id=visitor_id,
                property_id=visitor.property_id,
                event_type="check_out",
                timestamp=datetime.utcnow(),
                location="main_entrance",
                processed_by=user_id,
                notes="Visitor checked out successfully"
            )
            
            db.add(log_entry)
            db.commit()
            
            # Calculate visit duration
            duration = None
            if visitor.actual_arrival and visitor.actual_departure:
                duration = (visitor.actual_departure - visitor.actual_arrival).total_seconds() / 3600  # hours
            
            return {
                "visitor_id": visitor_id,
                "check_out_time": datetime.utcnow().isoformat(),
                "visit_duration_hours": round(duration, 2) if duration else None,
                "status": "checked_out",
                "message": "Visitor checked out successfully"
            }
            
        except Exception as e:
            logger.error(f"Error checking out visitor: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to check out visitor"
            )
        finally:
            db.close()
    
    @staticmethod
    async def get_visitors(
        property_id: str,
        status: Optional[str] = None,
        host_user_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get visitors with filtering"""
        db = SessionLocal()
        try:
            query = db.query(Visitor).filter(Visitor.property_id == property_id)
            
            if status:
                query = query.filter(Visitor.status == status)
            if host_user_id:
                query = query.filter(Visitor.host_user_id == host_user_id)
            if start_date:
                query = query.filter(Visitor.created_at >= start_date)
            if end_date:
                query = query.filter(Visitor.created_at <= end_date)
            
            visitors = query.order_by(Visitor.created_at.desc()).all()
            
            return [
                {
                    "visitor_id": visitor.visitor_id,
                    "property_id": visitor.property_id,
                    "first_name": visitor.first_name,
                    "last_name": visitor.last_name,
                    "email": visitor.email,
                    "phone": visitor.phone,
                    "company": visitor.company,
                    "purpose_of_visit": visitor.purpose_of_visit,
                    "host_user_id": visitor.host_user_id,
                    "expected_arrival": visitor.expected_arrival.isoformat() if visitor.expected_arrival else None,
                    "expected_departure": visitor.expected_departure.isoformat() if visitor.expected_departure else None,
                    "actual_arrival": visitor.actual_arrival.isoformat() if visitor.actual_arrival else None,
                    "actual_departure": visitor.actual_departure.isoformat() if visitor.actual_departure else None,
                    "special_requirements": visitor.special_requirements,
                    "status": visitor.status,
                    "created_at": visitor.created_at.isoformat()
                }
                for visitor in visitors
            ]
            
        except Exception as e:
            logger.error(f"Error getting visitors: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve visitors"
            )
        finally:
            db.close()
    
    @staticmethod
    async def get_visitor_logs(
        visitor_id: Optional[str] = None,
        property_id: Optional[str] = None,
        event_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get visitor logs with filtering"""
        db = SessionLocal()
        try:
            query = db.query(VisitorLog)
            
            if visitor_id:
                query = query.filter(VisitorLog.visitor_id == visitor_id)
            if property_id:
                query = query.filter(VisitorLog.property_id == property_id)
            if event_type:
                query = query.filter(VisitorLog.event_type == event_type)
            if start_date:
                query = query.filter(VisitorLog.timestamp >= start_date)
            if end_date:
                query = query.filter(VisitorLog.timestamp <= end_date)
            
            logs = query.order_by(VisitorLog.timestamp.desc()).all()
            
            return [
                {
                    "log_id": log.log_id,
                    "visitor_id": log.visitor_id,
                    "property_id": log.property_id,
                    "event_type": log.event_type,
                    "timestamp": log.timestamp.isoformat(),
                    "location": log.location,
                    "processed_by": log.processed_by,
                    "notes": log.notes
                }
                for log in logs
            ]
            
        except Exception as e:
            logger.error(f"Error getting visitor logs: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve visitor logs"
            )
        finally:
            db.close()
    
    @staticmethod
    async def get_current_visitors(property_id: str) -> List[Dict[str, Any]]:
        """Get currently checked-in visitors"""
        db = SessionLocal()
        try:
            visitors = db.query(Visitor).filter(
                Visitor.property_id == property_id,
                Visitor.status == "checked_in"
            ).all()
            
            current_visitors = []
            for visitor in visitors:
                # Get active badge
                badge = db.query(VisitorBadge).filter(
                    VisitorBadge.visitor_id == visitor.visitor_id,
                    VisitorBadge.status == "active"
                ).first()
                
                current_visitors.append({
                    "visitor_id": visitor.visitor_id,
                    "first_name": visitor.first_name,
                    "last_name": visitor.last_name,
                    "company": visitor.company,
                    "purpose_of_visit": visitor.purpose_of_visit,
                    "host_user_id": visitor.host_user_id,
                    "check_in_time": visitor.actual_arrival.isoformat() if visitor.actual_arrival else None,
                    "badge_number": badge.badge_number if badge else None,
                    "duration_hours": round((datetime.utcnow() - visitor.actual_arrival).total_seconds() / 3600, 2) if visitor.actual_arrival else None
                })
            
            return current_visitors
            
        except Exception as e:
            logger.error(f"Error getting current visitors: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve current visitors"
            )
        finally:
            db.close()
    
    @staticmethod
    async def update_visitor_info(
        visitor_id: str, 
        updates: Dict[str, Any], 
        user_id: str
    ) -> Dict[str, str]:
        """Update visitor information"""
        db = SessionLocal()
        try:
            visitor = db.query(Visitor).filter(Visitor.visitor_id == visitor_id).first()
            
            if not visitor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Visitor not found"
                )
            
            # Update fields
            for field, value in updates.items():
                if hasattr(visitor, field):
                    setattr(visitor, field, value)
            
            db.commit()
            
            return {
                "message": "Visitor information updated successfully",
                "visitor_id": visitor_id
            }
            
        except Exception as e:
            logger.error(f"Error updating visitor info: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update visitor information"
            )
        finally:
            db.close()
    
    @staticmethod
    async def get_visitor_analytics(property_id: str, timeframe: str = "30d") -> Dict[str, Any]:
        """Get visitor analytics"""
        db = SessionLocal()
        try:
            # Calculate time range
            end_time = datetime.utcnow()
            if timeframe == "7d":
                start_time = end_time - timedelta(days=7)
            elif timeframe == "30d":
                start_time = end_time - timedelta(days=30)
            elif timeframe == "90d":
                start_time = end_time - timedelta(days=90)
            else:
                start_time = end_time - timedelta(days=30)
            
            # Get visitors
            visitors = db.query(Visitor).filter(
                Visitor.property_id == property_id,
                Visitor.created_at >= start_time
            ).all()
            
            # Get visitor logs
            logs = db.query(VisitorLog).filter(
                VisitorLog.property_id == property_id,
                VisitorLog.timestamp >= start_time
            ).all()
            
            # Calculate analytics
            total_visitors = len(visitors)
            checked_in_visitors = len([v for v in visitors if v.status == "checked_in"])
            checked_out_visitors = len([v for v in visitors if v.status == "checked_out"])
            registered_visitors = len([v for v in visitors if v.status == "registered"])
            
            total_check_ins = len([l for l in logs if l.event_type == "check_in"])
            total_check_outs = len([l for l in logs if l.event_type == "check_out"])
            
            # Company breakdown
            companies = {}
            for visitor in visitors:
                if visitor.company:
                    companies[visitor.company] = companies.get(visitor.company, 0) + 1
            
            # Purpose breakdown
            purposes = {}
            for visitor in visitors:
                purpose = visitor.purpose_of_visit
                purposes[purpose] = purposes.get(purpose, 0) + 1
            
            # Daily visitor count
            daily_visitors = {}
            for visitor in visitors:
                date = visitor.created_at.date().isoformat()
                daily_visitors[date] = daily_visitors.get(date, 0) + 1
            
            # Average visit duration
            visit_durations = []
            for visitor in visitors:
                if visitor.actual_arrival and visitor.actual_departure:
                    duration = (visitor.actual_departure - visitor.actual_arrival).total_seconds() / 3600
                    visit_durations.append(duration)
            
            avg_visit_duration = sum(visit_durations) / len(visit_durations) if visit_durations else 0
            
            return {
                "timeframe": timeframe,
                "total_visitors": total_visitors,
                "checked_in_visitors": checked_in_visitors,
                "checked_out_visitors": checked_out_visitors,
                "registered_visitors": registered_visitors,
                "total_check_ins": total_check_ins,
                "total_check_outs": total_check_outs,
                "check_in_rate": (total_check_ins / total_visitors * 100) if total_visitors > 0 else 0,
                "avg_visit_duration_hours": round(avg_visit_duration, 2),
                "companies": companies,
                "purposes": purposes,
                "daily_visitors": daily_visitors,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting visitor analytics: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve visitor analytics"
            )
        finally:
            db.close()
    
    @staticmethod
    async def validate_visitor_badge(badge_number: str, property_id: str) -> Dict[str, Any]:
        """Validate visitor badge"""
        db = SessionLocal()
        try:
            badge = db.query(VisitorBadge).join(Visitor).filter(
                VisitorBadge.badge_number == badge_number,
                Visitor.property_id == property_id,
                VisitorBadge.status == "active"
            ).first()
            
            if not badge:
                return {
                    "valid": False,
                    "message": "Invalid or inactive badge"
                }
            
            visitor = badge.visitor
            
            return {
                "valid": True,
                "visitor_id": visitor.visitor_id,
                "visitor_name": f"{visitor.first_name} {visitor.last_name}",
                "company": visitor.company,
                "purpose_of_visit": visitor.purpose_of_visit,
                "issued_at": badge.issued_at.isoformat(),
                "check_in_time": visitor.actual_arrival.isoformat() if visitor.actual_arrival else None
            }
            
        except Exception as e:
            logger.error(f"Error validating visitor badge: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to validate visitor badge"
            )
        finally:
            db.close() 