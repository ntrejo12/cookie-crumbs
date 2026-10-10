from fastapi import Header


def get_current_user_id(x_user_id: str = Header(...)) -> str:
    return x_user_id