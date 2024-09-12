from datetime import date

from app.dependencies import check_admin
from app.repositories.usage_analysis import (
    find_bots_sorted_by_price,
    find_users_sorted_by_price,
)
from app.routes.schemas.admin import (
    UsagePerBotOutput,
    UsagePerUserOutput,
)
from app.routes.schemas.bot import Knowledge
from app.user import User
from fastapi import APIRouter, Depends, Request

router = APIRouter(tags=["admin"])

# TODO: public bot은 없으나 추후 봇별 가격 조회 기능 구현시 참고용으로 삭제하지 않음
@router.get("/admin/public-bots", response_model=list[UsagePerBotOutput])
async def get_all_public_bots(
    limit: int = 100,
    start: str | None = None,
    end: str | None = None,
    admin_check=Depends(check_admin),
):
    """Get all public bots. This is intended to be used by admin.
    NOTE:
    - limit: must be lower than 1000.
    - start: start date of the period to be analyzed. The format is `YYYYMMDDHH`.
    - end: end date of the period to be analyzed. The format is `YYYYMMDDHH`.
    - If start and end are not specified, start is set to today's 00:00 and end is set to 23:00.
    - The result is sorted by the total price in descending order.
    """
    bots = await find_bots_sorted_by_price(limit=limit, from_=start, to_=end)

    return [
        UsagePerBotOutput(
            id=bot.id,
            title=bot.title,
            description=bot.description,
            owner_user_id=bot.owner_user_id,
            total_price=bot.total_price,
        )
        for bot in bots
    ]


@router.get("/admin/users", response_model=list[UsagePerUserOutput])
async def get_users(
    limit: int = 100,
    start: str | None = None,
    end: str | None = None,
    admin_check=Depends(check_admin),
):
    """Get all users. This is intended to be used by admin.
    NOTE:
    - limit: must be lower than 1000.
    - start: start date of the period to be analyzed. The format is `YYYYMMDDHH`.
    - end: end date of the period to be analyzed. The format is `YYYYMMDDHH`.
    - If start and end are not specified, start is set to today's 00:00 and end is set to 23:00.
    - The result is sorted by the total price in descending order.
    """
    users = await find_users_sorted_by_price(limit=limit, from_=start, to_=end)

    return [
        UsagePerUserOutput(
            id=user.id,
            email=user.email,
            total_price=user.total_price,
        )
        for user in users
    ]