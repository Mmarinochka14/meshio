import requests
from django.conf import settings


class UnisenderServiceError(Exception):
    pass


def subscribe_email_to_unisender(email: str) -> dict:
    api_key = settings.UNISENDER_API_KEY
    list_id = settings.UNISENDER_LIST_ID
    base_url = settings.UNISENDER_BASE_URL.rstrip("/")

    if not api_key or not list_id:
        raise UnisenderServiceError(
            "Unisender API key or list ID is not configured."
        )

    url = f"{base_url}/subscribe"

    payload = {
        "format": "json",
        "api_key": api_key,
        "list_ids": str(list_id),
        "fields[email]": email,
        "double_optin": "0",
        "overwrite": "2",
    }

    response = requests.post(url, data=payload, timeout=30)

    try:
        data = response.json()
    except Exception:
        raise UnisenderServiceError(
            f"Unisender returned invalid response: {response.text}"
        )

    if not response.ok:
        raise UnisenderServiceError(
            f"Unisender request failed: {response.status_code} {data}"
        )

    if data.get("error"):
        raise UnisenderServiceError(data["error"])

    return data