from celery import Celery
import json
from datetime import datetime
import redis

# ── Celery App ────────────────────────────────────────────────────
app = Celery(
    "ati_tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
)

app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Africa/Addis_Ababa",
    enable_utc=True,
)


# ── Task: Process Farmer Change ───────────────────────────────────
@app.task(name="tasks.process_farmer_change_task", bind=True, max_retries=3)
def process_farmer_change_task(self, operation: str, table: str, raw_payload: str):
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] Celery received: {operation} on {table}")

        event = {
            "type": "farmer_change",
            "operation": operation,
            "table": table,
            "timestamp": timestamp,
            "raw": raw_payload[:300],
        }

        # Publish to Redis channel so WebSocket server picks it up
        r = redis.Redis(host="localhost", port=6379, db=0)
        r.publish("oan_ui_events", json.dumps(event))

        print(f"[{timestamp}] Event published to Redis channel 'oan_ui_events'")
        return {"status": "ok"}

    except Exception as exc:
        print(f"Task failed: {exc}")
        raise self.retry(exc=exc, countdown=5)