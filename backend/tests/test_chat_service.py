
import pytest
from services.chat_service import ChatService
from schemas import ChatChannelCreate, ChatMessageCreate
from models import User
from datetime import datetime
import uuid

class TestChatService:
    @pytest.fixture
    def service(self, db_session):
        return ChatService(db_session)

    @pytest.fixture
    def chat_property(self, db_session):
        # Need a property for channels
        from services.system_admin_service import SystemAdminService
        from schemas import PropertyCreate, PropertyType
        
        sa_service = SystemAdminService(db_session)
        prop = sa_service.create_property(
            PropertyCreate(
                property_name="Chat Test Prop",
                property_type=PropertyType.HOTEL,
                address={}, contact_info={}, room_count=1, capacity=1, timezone="UTC"
            ),
            creator_id="system"
        )
        return prop

    @pytest.fixture
    def chat_user(self, db_session):
        # Need a user
        from services.system_admin_service import SystemAdminService
        from schemas import UserCreate
        sa_service = SystemAdminService(db_session)
        return sa_service.create_user(
            UserCreate(
                email="chatuser@example.com",
                username="chatuser",
                first_name="Chat",
                last_name="User",
                password="password",
                phone="555-CHAT"
            ),
            creator_id="system"
        )

    def test_create_channel(self, service, chat_property, chat_user):
        channel = service.create_channel(
            ChatChannelCreate(
                name="General",
                property_id=chat_property.property_id,
                type="public"
            ),
            creator_id=chat_user.user_id
        )
        assert channel.channel_id is not None
        assert channel.name == "General"
        
        # Check membership created for creator
        members = service.get_members(channel.channel_id)
        assert len(members) == 1
        assert members[0].user_id == chat_user.user_id
        assert members[0].role == "owner"

    def test_membership_management(self, service, chat_property, chat_user):
        channel = service.create_channel(
            ChatChannelCreate(name="Members Only", property_id=chat_property.property_id),
            creator_id="system"
        )
        
        # Join
        membership = service.join_channel(channel.channel_id, chat_user.user_id)
        assert membership.user_id == chat_user.user_id
        assert membership.channel_id == channel.channel_id
        
        members = service.get_members(channel.channel_id)
        assert any(m.user_id == chat_user.user_id for m in members)
        
        # Leave
        success = service.leave_channel(channel.channel_id, chat_user.user_id)
        assert success is True
        
        members = service.get_members(channel.channel_id)
        assert not any(m.user_id == chat_user.user_id for m in members)

    def test_send_message_and_read_receipt(self, service, chat_property, chat_user):
        channel = service.create_channel(
            ChatChannelCreate(name="Random", property_id=chat_property.property_id),
            creator_id=chat_user.user_id
        )
        
        msg = service.create_message(
            ChatMessageCreate(
                channel_id=channel.channel_id,
                content="Hello World",
                message_type="text"
            ),
            user_id=chat_user.user_id
        )
        assert msg.content == "Hello World"
        
        # Read receipt
        receipt = service.mark_as_read(msg.message_id, chat_user.user_id)
        assert receipt.message_id == msg.message_id
        assert receipt.user_id == chat_user.user_id
        
        # Check membership last_read_at
        membership = service.join_channel(channel.channel_id, chat_user.user_id)
        assert membership.last_read_at is not None

    def test_attachments(self, service, chat_property, chat_user):
        channel = service.create_channel(
            ChatChannelCreate(name="Media", property_id=chat_property.property_id),
            creator_id=chat_user.user_id
        )
        msg = service.create_message(
            ChatMessageCreate(channel_id=channel.channel_id, content="See attached"),
            user_id=chat_user.user_id
        )
        
        attachment = service.add_attachment(msg.message_id, {
            "file_name": "photo.jpg",
            "file_type": "image/jpeg",
            "file_size": 1024,
            "file_path": "/uploads/photo.jpg"
        })
        assert attachment.file_name == "photo.jpg"
        assert attachment.message_id == msg.message_id
        
        # Verify message has attachment
        msgs = service.get_messages(channel.channel_id)
        assert len(msgs[0].attachments) == 1
        assert msgs[0].attachments[0].file_name == "photo.jpg"

