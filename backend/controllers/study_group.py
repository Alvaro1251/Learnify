from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from models.study_group import (
    StudyGroupCreate,
    StudyGroupResponse,
    StudyGroupDetailResponse,
    SharedFileRequest,
    ChatMessageRequest,
)
from services.study_group_service import (
    create_study_group,
    get_study_group_by_id,
    get_public_study_groups,
    get_user_study_groups,
    request_to_join,
    accept_join_request,
    leave_study_group,
    share_file,
    add_chat_message,
    get_study_group_messages,
    create_study_group_indexes,
)
from config.database import get_database
from config.websocket_manager import manager
from controllers.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

router = APIRouter(prefix="/study-groups", tags=["study-groups"])


@router.post("/create", response_model=StudyGroupDetailResponse)
async def create_study_group_endpoint(
    group_data: StudyGroupCreate,
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    try:
        await create_study_group_indexes(db)
        group = await create_study_group(db, group_data, str(current_user.id))
        return group
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/public", response_model=List[StudyGroupResponse])
async def get_public_groups(db: AsyncIOMotorDatabase = Depends(get_database)):
    groups = await get_public_study_groups(db)
    return groups


@router.get("/my/groups", response_model=List[StudyGroupResponse])
async def get_my_groups(
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    groups = await get_user_study_groups(db, str(current_user.id))
    return groups


@router.get("/{group_id}", response_model=StudyGroupDetailResponse)
async def get_group_details(
    group_id: str, db: AsyncIOMotorDatabase = Depends(get_database)
):
    group = await get_study_group_by_id(db, group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Study group not found"
        )
    return group


@router.post("/{group_id}/join")
async def join_study_group(
    group_id: str,
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    group = await request_to_join(db, group_id, str(current_user.id))
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Study group not found"
        )

    if group.is_public:
        return {"message": "Successfully joined the group"}
    else:
        return {"message": "Join request sent. Waiting for owner approval."}


@router.post("/{group_id}/accept-request/{user_id}")
async def accept_join_request_endpoint(
    group_id: str,
    user_id: str,
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    group = await accept_join_request(db, group_id, user_id, str(current_user.id))
    if not group:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized or request not found",
        )
    return {"message": "Join request accepted"}


@router.post("/{group_id}/leave")
async def leave_group(
    group_id: str,
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    success = await leave_study_group(db, group_id, str(current_user.id))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Study group not found"
        )
    return {"message": "Successfully left the group"}


@router.post("/{group_id}/share-file")
async def share_file_endpoint(
    group_id: str,
    file_data: SharedFileRequest,
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    group = await share_file(
        db, group_id, file_data.file_url, str(current_user.id)
    )
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found or not a member",
        )
    return {"message": "File shared successfully", "group": group}


@router.get("/{group_id}/messages")
async def get_messages(
    group_id: str,
    limit: int = 50,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    messages = await get_study_group_messages(db, group_id, limit)
    return {"messages": messages}


@router.websocket("/ws/{group_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    group_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    await manager.connect(group_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            sender_id = data.get("sender_id")
            content = data.get("content")

            if sender_id and content:
                try:
                    group = await add_chat_message(db, group_id, content, sender_id)
                    if group and group.chat:
                        last_message = group.chat[-1]
                        # Ensure sender_name is properly set (use sender as fallback)
                        sender_name = last_message.sender or sender_id
                        message_data = {
                            "type": "message",
                            "sender_id": str(last_message.sender_id) if last_message.sender_id else sender_id,
                            "sender": sender_name,
                            "sender_name": sender_name,
                            "content": content,
                            "timestamp": str(last_message.timestamp),
                        }
                        await manager.broadcast(group_id, message_data)
                    else:
                        print(f"Failed to add message: group={group}, sender_id={sender_id}, content={content}")
                        # Send error message back to sender
                        await manager.send_personal_message(
                            websocket,
                            {
                                "type": "error",
                                "message": "No se pudo enviar el mensaje. Verifica que seas miembro del grupo.",
                            },
                        )
                except Exception as e:
                    print(f"Error processing chat message: {e}")
                    import traceback
                    traceback.print_exc()
                    # Send error message back to sender
                    try:
                        await manager.send_personal_message(
                            websocket,
                            {
                                "type": "error",
                                "message": f"Error al enviar mensaje: {str(e)}",
                            },
                        )
                    except:
                        pass
    except WebSocketDisconnect:
        manager.disconnect(group_id, websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        import traceback
        traceback.print_exc()
        manager.disconnect(group_id, websocket)
