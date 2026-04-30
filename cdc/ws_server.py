import asyncio
import json
import redis.asyncio as aioredis
import websockets
from datetime import datetime

CONNECTED_CLIENTS = set()
REDIS_CHANNEL = "oan_ui_events"
WS_HOST = "localhost"
WS_PORT = 8765

async def ws_handler(websocket):
    client_id = id(websocket)
    CONNECTED_CLIENTS.add(websocket)
    print(f"[WS] Client connected: {client_id} (total: {len(CONNECTED_CLIENTS)})")

    try:
        await websocket.send(json.dumps({
            "type": "connected",
            "message": "ATI OpenG2P CDC live feed connected",
            "timestamp": datetime.now().isoformat(),
        }))

        # Listen for incoming messages (from Airflow DAG)
        async for raw_message in websocket:
            try:
                data = json.loads(raw_message)
                source = data.get("source", "unknown")
                print(f"[WS] Received from {source} → broadcasting to {len(CONNECTED_CLIENTS)} UI client(s)")

                # Tag the message with pipeline label for UI display
                if source == "airflow_cdc":
                    data["pipeline_label"] = "🟡 Airflow CDC (1-min poll)"
                else:
                    data["pipeline_label"] = "🟢 PostgreSQL WAL CDC (real-time)"

                # Broadcast to all connected UI clients
                dead = set()
                for client in CONNECTED_CLIENTS.copy():
                    if client == websocket:
                        continue  # don't echo back to sender
                    try:
                        await client.send(json.dumps(data))
                    except Exception:
                        dead.add(client)
                CONNECTED_CLIENTS -= dead

            except json.JSONDecodeError:
                print(f"[WS] Non-JSON message received, ignoring")

    except websockets.exceptions.ConnectionClosedOK:
        pass
    except Exception as e:
        print(f"[WS] Client error: {e}")
    finally:
        CONNECTED_CLIENTS.discard(websocket)
        print(f"[WS] Client disconnected (total: {len(CONNECTED_CLIENTS)})")

async def redis_listener():
    print(f"[Redis] Subscribing to channel: {REDIS_CHANNEL}")
    r = await aioredis.from_url("redis://localhost:6379/0")
    pubsub = r.pubsub()
    await pubsub.subscribe(REDIS_CHANNEL)
    print("[Redis] Waiting for events from Celery...")
    async for message in pubsub.listen():
        if message["type"] != "message":
            continue
        raw = message["data"]
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8")

        # Tag Redis/Celery messages as PostgreSQL WAL CDC
        try:
            data = json.loads(raw)
            data["pipeline_label"] = "🟢 PostgreSQL WAL CDC (real-time)"
            raw = json.dumps(data)
        except Exception:
            pass

        print(f"[Redis] Event → pushing to {len(CONNECTED_CLIENTS)} client(s)")
        dead = set()
        for client in CONNECTED_CLIENTS.copy():
            try:
                await client.send(raw)
            except Exception:
                dead.add(client)
        CONNECTED_CLIENTS -= dead

async def main():
    print(f"Starting WebSocket server on ws://{WS_HOST}:{WS_PORT}")
    ws_server = await websockets.serve(ws_handler, WS_HOST, WS_PORT)
    print("WebSocket server ready — waiting for OAN UI to connect...")
    await asyncio.gather(
        ws_server.wait_closed(),
        redis_listener(),
    )

if __name__ == "__main__":
    asyncio.run(main())
