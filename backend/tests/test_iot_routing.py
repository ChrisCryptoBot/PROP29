from fastapi import status


def test_iot_environmental_routes(client, auth_headers):
    response = client.get("/api/iot/environmental", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK


def test_hardware_control_route_requires_role(client, auth_headers):
    response = client.post(
        "/api/hardware/lockers/TEST_LOCKER/release",
        json={"reason": "test"},
        headers=auth_headers,
    )
    assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED)
