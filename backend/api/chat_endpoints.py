from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from database import get_db
from api.auth_dependencies import get_current_user
from models import User
from schemas import (
    ChatChannelCreate, ChatChannelResponse, 
    ChatMessageCreate, ChatMessageResponse,
    ChannelMembershipResponse, MessageReadReceiptResponse,
    ChatAttachmentResponse
)
from services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["Team Chat"])

def get_service(db: Session = Depends(get_db)):
    return ChatService(db)

@router.get("/channels", response_model=List[ChatChannelResponse])
async def get_channels(
    property_id: str,
    service: ChatService = Depends(get_service),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List chat channels for a property."""
    from api.auth_utils import check_property_access
    check_property_access(db, current_user, property_id)
    return service.get_channels(property_id)

@router.post("/channels", response_model=ChatChannelResponse, status_code=status.HTTP_201_CREATED)
async def create_channel(
    channel_data: ChatChannelCreate,
    service: ChatService = Depends(get_service),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chat channel."""
    from api.auth_utils import check_property_access
    check_property_access(db, current_user, str(channel_data.property_id))
    return service.create_channel(channel_data, current_user.user_id)

@router.post("/channels/{channel_id}/join", response_model=ChannelMembershipResponse)
async def join_channel(
    channel_id: str,
    role: str = "member",
    service: ChatService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Join a chat channel."""
    return service.join_channel(channel_id, current_user.user_id, role)

@router.delete("/channels/{channel_id}/leave")
async def leave_channel(
    channel_id: str,
    service: ChatService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Leave a chat channel."""
    success = service.leave_channel(channel_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Membership not found")
    return {"status": "left"}

@router.get("/channels/{channel_id}/members", response_model=List[ChannelMembershipResponse])
async def get_members(
    channel_id: str,
    service: ChatService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """List members of a channel."""
    return service.get_members(channel_id)

@router.get("/channels/{channel_id}/messages", response_model=List[ChatMessageResponse])
async def get_messages(
    channel_id: str,
    limit: int = 50,
    before_id: Optional[str] = None,
    service: ChatService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Get message history for a channel."""
    messages = service.get_messages(channel_id, limit, before_id)
    
    response = []
    for msg in messages:
        sender_name = "Unknown"
        if msg.sender:
            sender_name = f"{msg.sender.first_name} {msg.sender.last_name}"
        
        response.append(ChatMessageResponse(
            message_id=msg.message_id,
            channel_id=msg.channel_id,
            user_id=msg.user_id,
            content=msg.content,
            timestamp=msg.timestamp,
            message_type=msg.message_type,
            message_metadata=msg.message_metadata,
            sender_name=sender_name,
            attachments=[ChatAttachmentResponse.from_orm(a) for a in msg.attachments],
            read_receipts=[MessageReadReceiptResponse.from_orm(r) for r in msg.read_receipts]
        ))
    return response

@router.post("/channels/{channel_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    channel_id: str,
    message_data: ChatMessageCreate,
    service: ChatService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Send a message via REST (alternative to WebSocket)."""
    if str(message_data.channel_id) != channel_id:
        raise HTTPException(status_code=400, detail="Channel ID mismatch")
        
    msg = service.create_message(message_data, current_user.user_id)
    sender_name = f"{current_user.first_name} {current_user.last_name}"
    
    return ChatMessageResponse(
        message_id=msg.message_id,
        channel_id=msg.channel_id,
        user_id=msg.user_id,
        content=msg.content,
        timestamp=msg.timestamp,
        message_type=msg.message_type,
        message_metadata=msg.message_metadata,
        sender_name=sender_name,
        attachments=[],
        read_receipts=[]
    )

@router.post("/messages/{message_id}/read", response_model=MessageReadReceiptResponse)
async def mark_as_read(
    message_id: str,
    service: ChatService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Mark a message as read."""
    return service.mark_as_read(message_id, current_user.user_id)

@router.post("/messages/{message_id}/attachments", response_model=ChatAttachmentResponse)
async def add_attachment(
    message_id: str,
    file_name: str,
    file_type: str,
    file_size: int,
    file_path: str,
    service: ChatService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Add an attachment to a message."""
    file_data = {
        "file_name": file_name,
        "file_type": file_type,
        "file_size": file_size,
        "file_path": file_path
    }
    return service.add_attachment(message_id, file_data)

