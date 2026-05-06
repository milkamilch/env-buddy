import requests


def call_webhook(url: str, event: str, payload: dict) -> None:
    if not url:
        return
    try:
        requests.post(url, json={"event": event, **payload}, timeout=5)
    except Exception:
        pass
