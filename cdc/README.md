# CDC Pipeline - OpenG2P ATI to OAN UI

Real-time data pipeline connecting OpenG2P (ATI) farmer registry to the OAN React UI.

## Files

- `farmer_cdc_reader.py` - Watches PostgreSQL WAL and fires Celery tasks on farmer changes
- `tasks.py` - Celery worker that processes events and publishes to Redis
- `ws_server.py` - WebSocket server that pushes live events to OAN UI browser
- `farmer_registry_api.py` - FastAPI REST server serving farmer data on port 8001

## Setup

```bash
pip install -r requirements.txt
```

## Run (4 terminals needed)

```bash
# Terminal 1 - Celery Worker
celery -A tasks worker --loglevel=info

# Terminal 2 - WebSocket Server
python ws_server.py

# Terminal 3 - CDC Reader
python farmer_cdc_reader.py

# Terminal 4 - Farmer Registry API
python farmer_registry_api.py
```

## Requirements

- PostgreSQL WAL level = logical
- Replication slot: farmer_cdc_slot
- Publication: farmer_pub
- Redis running on localhost:6379
- ati_db accessible with odoo17 user
