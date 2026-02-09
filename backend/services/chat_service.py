from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import (
    ChatChannel, ChatMessage, User, 
    ChannelMembership, MessageReadReceipt, ChatAttachment
)
from schemas import ChatChannelCreate, ChatMessageCreate
import uuid

class ChatService:
    def __init__(self, db: Session):
        self.db = db

    # Channel Management
    def get_channels(self, property_id: str) -> List[ChatChannel]:
        return self.db.query(ChatChannel).filter(
            ChatChannel.property_id == property_id,
            ChatChannel.is_active == True
        ).all()

    def create_channel(self, channel_data: ChatChannelCreate, creator_id: str) -> ChatChannel:
        new_channel = ChatChannel(
            channel_id=str(uuid.uuid4()),
            property_id=str(channel_data.property_id),
            name=channel_data.name,
            type=channel_data.type
        )
        self.db.add(new_channel)
        
        # Automatically join the creator as owner/admin
        membership = ChannelMembership(
            membership_id=str(uuid.uuid4()),
            channel_id=new_channel.channel_id,
            user_id=creator_id,
            role="owner"
        )
        self.db.add(membership)
        
        self.db.commit()
        self.db.refresh(new_channel)
        return new_channel

    def join_channel(self, channel_id: str, user_id: str, role: str = "member") -> ChannelMembership:
        membership = self.db.query(ChannelMembership).filter(
            ChannelMembership.channel_id == channel_id,
            ChannelMembership.user_id == user_id
        ).first()
        
        if not membership:
            membership = ChannelMembership(
                membership_id=str(uuid.uuid4()),
                channel_id=channel_id,
                user_id=user_id,
                role=role
            )
            self.db.add(membership)
            self.db.commit()
            self.db.refresh(membership)
        return membership

    def leave_channel(self, channel_id: str, user_id: str) -> bool:
        membership = self.db.query(ChannelMembership).filter(
            ChannelMembership.channel_id == channel_id,
            ChannelMembership.user_id == user_id
        ).first()
        if membership:
            self.db.delete(membership)
            self.db.commit()
            return True
        return False

    def get_members(self, channel_id: str) -> List[ChannelMembership]:
        return self.db.query(ChannelMembership).filter(
            ChannelMembership.channel_id == channel_id
        ).all()

    # Message Management
    def create_message(self, message_data: ChatMessageCreate, user_id: str) -> ChatMessage:
        new_message = ChatMessage(
            message_id=str(uuid.uuid4()),
            channel_id=str(message_data.channel_id),
            user_id=str(user_id),
            content=message_data.content,
            message_type=message_data.message_type,
            message_metadata=message_data.message_metadata
        )
        self.db.add(new_message)
        self.db.commit()
        self.db.refresh(new_message)
        return new_message

    def get_messages(self, channel_id: str, limit: int = 50, before_id: Optional[str] = None) -> List[ChatMessage]:
        query = self.db.query(ChatMessage).filter(ChatMessage.channel_id == channel_id)
        
        if before_id:
            ref_msg = self.db.query(ChatMessage).filter(ChatMessage.message_id == before_id).first()
            if ref_msg:
                query = query.filter(ChatMessage.timestamp < ref_msg.timestamp)
        
        return query.order_by(desc(ChatMessage.timestamp)).limit(limit).all()

    def mark_as_read(self, message_id: str, user_id: str) -> MessageReadReceipt:
        receipt = self.db.query(MessageReadReceipt).filter(
            MessageReadReceipt.message_id == message_id,
            MessageReadReceipt.user_id == user_id
        ).first()
        
        if not receipt:
            receipt = MessageReadReceipt(
                receipt_id=str(uuid.uuid4()),
                message_id=message_id,
                user_id=user_id
            )
            self.db.add(receipt)
            # Update membership last_read_at too
            msg = self.db.query(ChatMessage).filter(ChatMessage.message_id == message_id).first()
            if msg:
                membership = self.db.query(ChannelMembership).filter(
                    ChannelMembership.channel_id == msg.channel_id,
                    ChannelMembership.user_id == user_id
                ).first()
                if membership:
                    membership.last_read_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(receipt)
        return receipt

    # Attachment Management
    def add_attachment(self, message_id: str, file_data: Dict[str, Any]) -> ChatAttachment:
        attachment = ChatAttachment(
            attachment_id=str(uuid.uuid4()),
            message_id=message_id,
            file_name=file_data["file_name"],
            file_type=file_data["file_type"],
            file_size=file_data["file_size"],
            file_path=file_data["file_path"]
        )
        self.db.add(attachment)
        self.db.commit()
        self.db.refresh(attachment)
        return attachment

