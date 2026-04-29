import psycopg2
import psycopg2.extras
from datetime import datetime
from celery import Celery

# ── Celery app reference ──────────────────────────────────────────
celery_app = Celery(
    "ati_tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
)

# ── DB Connection Config ──────────────────────────────────────────
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "ati_db",
    "user": "odoo17",
    "password": "odoo17",
}

SLOT_NAME = "farmer_cdc_slot"
PUBLICATION = "farmer_pub"


def process_farmer_change(payload):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if isinstance(payload, bytes):
        text = payload.decode("utf-8", errors="replace")
    else:
        text = payload

    # Detect operation type from WAL first byte
    if text.startswith("B") or text.startswith("C"):
        return  # skip BEGIN and COMMIT — not useful

    if text.startswith("I"):
        operation = "INSERT"
    elif text.startswith("U"):
        operation = "UPDATE"
    elif text.startswith("D"):
        operation = "DELETE"
    else:
        return  # skip everything else

    print(f"[{timestamp}] {operation} detected — sending to Celery...")

    # ── KEY CHANGE: fire a Celery task instead of just printing ──
    celery_app.send_task(
        "tasks.process_farmer_change_task",
        args=[operation, "res_partner", text[:500]],
    )

    print(f"[{timestamp}] Celery task queued successfully")


def read_cdc_changes():
    print("Connecting to ati_db...")
    conn = psycopg2.connect(
        connection_factory=psycopg2.extras.LogicalReplicationConnection,
        **DB_CONFIG,
    )
    cur = conn.cursor(cursor_factory=psycopg2.extras.ReplicationCursor)

    print(f"Starting replication on slot: {SLOT_NAME}")
    cur.start_replication(
        slot_name=SLOT_NAME,
        decode=False,
        options={
            "proto_version": "1",
            "publication_names": PUBLICATION,
        },
    )

    print("CDC reader started. Listening for farmer changes...")
    print("Changes will now be sent to Celery worker\n")

    def consume(msg):
        try:
            process_farmer_change(msg.payload)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            msg.cursor.send_feedback(flush_lsn=msg.data_start)

    try:
        cur.consume_stream(consume)
    except KeyboardInterrupt:
        print("\nCDC reader stopped.")
    finally:
        cur.close()
        conn.close()
        print("Connection closed.")


if __name__ == "__main__":
    read_cdc_changes()