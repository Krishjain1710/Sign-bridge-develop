from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.api.health import router


def test_root_route_exists_for_browser_checks():
    app = FastAPI()
    app.include_router(router)
    client = TestClient(app)

    response = client.get("/")
    assert response.status_code == 200
