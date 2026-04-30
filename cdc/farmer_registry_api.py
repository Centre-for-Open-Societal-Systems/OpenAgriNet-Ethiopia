from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
import psycopg2
import psycopg2.extras
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Farmer Registry API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── DB Connection Config ──────────────────────────────────────────
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "ati_db",
    "user": "odoo17",
    "password": "odoo17",
}


def get_db_connection():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.cursor_factory = psycopg2.extras.RealDictCursor
    return conn


# ── Pydantic Model ────────────────────────────────────────────────
class FarmerProfile(BaseModel):
    # Identity
    id: int
    unique_id: Optional[str]
    farmer_id: Optional[str]

    # Names
    name: Optional[str]  # full display name (Odoo default)
    given_name: Optional[str]  # first name (Latin)
    family_name: Optional[str]  # last name (Latin)
    addl_name: Optional[str]  # middle / additional name
    first_name_amh: Optional[str]  # first name Amharic
    family_name_amh: Optional[str]  # last name Amharic
    gf_name_amh: Optional[str]  # grandfather name Amharic
    gf_name_eng: Optional[str]  # grandfather name English

    # Contact
    phone: Optional[str]
    mobile: Optional[str]
    email: Optional[str]

    # Demographics
    gender: Optional[str]
    birthdate: Optional[Any]  # date → maps to dob in JSX
    age_int: Optional[int]  # pre-computed age from DB
    birth_place: Optional[str]
    martial_status: Optional[str]  # DB column has typo (no 'i')
    marital_status: Optional[str]  # standard field
    education: Optional[str]
    education_level: Optional[str]

    # Location (resolved names via JOINs)
    region: Optional[Any]
    zone: Optional[Any]
    woreda: Optional[Any]
    kebele: Optional[Any]
    village: Optional[str]  # street / address field used as village
    city: Optional[str]
    street: Optional[str]
    street2: Optional[str]
    partner_latitude: Optional[float]
    partner_longitude: Optional[float]

    # Registry / Status
    state: Optional[str]
    approval_status: Optional[str]
    is_registrant: Optional[bool]
    is_group: Optional[bool]
    is_farmer: Optional[str]
    registration_date: Optional[Any]

    # Farming Details
    farming_type: Optional[str]
    land_ownership: Optional[str]
    total_land_area: Optional[float]
    total_land_owned_area: Optional[float]
    total_land_rent_area: Optional[float]
    total_land_crop_sharing_area: Optional[float]

    # Agricultural inputs
    do_you_use_fertilizer: Optional[str]
    do_you_use_pesticide: Optional[str]
    do_you_use_insecticide: Optional[str]
    do_you_use_improved_seed: Optional[str]
    access_to_machinery: Optional[str]
    irrigation_types: Optional[str]
    has_finance_access: Optional[str]

    # Cooperative / Commodity
    primary_cooperatives: Optional[Any]  # FK id → resolved name via JOIN
    cooperative_unions: Optional[Any]
    primary_commodity: Optional[Any]

    # Household
    size_of_family: Optional[int]
    number_of_children_in_family: Optional[int]
    number_of_males_in_family: Optional[int]
    number_of_females_in_family: Optional[int]
    hh_is_household_head: Optional[str]
    other_farmer_in_hh: Optional[str]
    is_psnp_user: Optional[bool]

    # Socioeconomic
    income: Optional[float]
    annual_income: Optional[str]
    income_sources: Optional[str]
    employment_status: Optional[str]
    owns_livestock: Optional[str]
    owns_house: Optional[str]
    type_of_land_owned: Optional[str]
    housing_type: Optional[str]
    water_access: Optional[str]
    electricity_access: Optional[str]

    # Disability / vulnerability
    is_disabled: Optional[str]
    type_of_disability: Optional[str]
    num_disabled: Optional[int]
    num_preg_lact_women: Optional[int]
    num_malnourished_children: Optional[int]

    # Membership flags
    is_member_of_primary_cooperative: Optional[str]
    is_member_of_cooperative_union: Optional[str]
    is_member_in_farmer_cluster: Optional[str]
    role_in_farmer_cluster: Optional[str]

    # Misc
    has_personal_phone: Optional[str]
    has_national_id: Optional[str]
    other_vulnerable_status: Optional[str]
    belong_to_protected_groups: Optional[str]
    caste_ethnic_group: Optional[str]
    rejection_reason: Optional[str]


# ── SQL helper ────────────────────────────────────────────────────
# Returns every column the JSX needs via a single JOIN query.
# Resolved FK names: region, zone, woreda, kebele, cooperative, commodity.
FARMER_SELECT_SQL = """
    SELECT
        rp.id,
        rp.unique_id,
        rp.farmer_id,

        -- Names
        rp.name,
        rp.given_name,
        rp.family_name,
        rp.addl_name,
        rp.first_name_amh,
        rp.family_name_amh,
        rp.gf_name_amh,
        rp.gf_name_eng,

        -- Contact
        rp.phone,
        rp.mobile,
        rp.email,

        -- Demographics
        rp.gender,
        rp.birthdate,
        rp.age_int,
        rp.birth_place,
        rp.martial_status,
        rp.marital_status,
        rp.education,
        rp.education_level,

        -- Location (resolved)
        gr.name  AS region,
        gz.name  AS zone,
        gw.name  AS woreda,
        gk.name  AS kebele,
        rp.street  AS village,     -- street used as village/got
        rp.city,
        rp.street,
        rp.street2,
        rp.partner_latitude,
        rp.partner_longitude,

        -- Registry / Status
        rp.state,
        rp.approval_status,
        rp.is_registrant,
        rp.is_group,
        rp.is_farmer,
        rp.registration_date,

        -- Farming
        rp.farming_type,
        rp.land_ownership,
        rp.total_land_area,
        rp.total_land_owned_area,
        rp.total_land_rent_area,
        rp.total_land_crop_sharing_area,

        -- Inputs
        rp.do_you_use_fertilizer,
        rp.do_you_use_pesticide,
        rp.do_you_use_insecticide,
        rp.do_you_use_improved_seed,
        rp.access_to_machinery,
        rp.irrigation_types,
        rp.has_finance_access,

        -- Cooperative / Commodity (resolved names)
        pc.name  AS primary_cooperatives,
        cu.name  AS cooperative_unions,
        cm.name  AS primary_commodity,

        -- Household
        rp.size_of_family,
        rp.number_of_children_in_family,
        rp.number_of_males_in_family,
        rp.number_of_females_in_family,
        rp.hh_is_household_head,
        rp.other_farmer_in_hh,
        rp.is_psnp_user,

        -- Socioeconomic
        rp.income,
        rp.annual_income,
        rp.income_sources,
        rp.employment_status,
        rp.owns_livestock,
        rp.owns_house,
        rp.type_of_land_owned,
        rp.housing_type,
        rp.water_access,
        rp.electricity_access,

        -- Disability / vulnerability
        rp.is_disabled,
        rp.type_of_disability,
        rp.num_disabled,
        rp.num_preg_lact_women,
        rp.num_malnourished_children,

        -- Membership flags
        rp.is_member_of_primary_cooperative,
        rp.is_member_of_cooperative_union,
        rp.is_member_in_farmer_cluster,
        rp.role_in_farmer_cluster,

        -- Misc
        rp.has_personal_phone,
        rp.has_national_id,
        rp.other_vulnerable_status,
        rp.belong_to_protected_groups,
        rp.caste_ethnic_group,
        rp.rejection_reason

    FROM res_partner rp
    LEFT JOIN g2p_region        gr  ON rp.region              = gr.id
    LEFT JOIN g2p_zone          gz  ON rp.zone                = gz.id
    LEFT JOIN g2p_woreda        gw  ON rp.woreda              = gw.id
    LEFT JOIN g2p_kebele        gk  ON rp.kebele              = gk.id
    LEFT JOIN res_partner       pc  ON rp.primary_cooperatives = pc.id
    LEFT JOIN res_partner       cu  ON rp.cooperative_unions   = cu.id
    LEFT JOIN res_partner       cm  ON rp.primary_commodity    = cm.id
"""

WHERE_FARMER = "WHERE rp.is_registrant = true AND rp.is_farmer = 'yes'"


def serialize(row: dict) -> dict:
    """Convert any non-serialisable types (date, Decimal) to strings."""
    import datetime, decimal
    out = {}
    for k, v in row.items():
        if isinstance(v, (datetime.date, datetime.datetime)):
            out[k] = v.isoformat()
        elif isinstance(v, decimal.Decimal):
            out[k] = float(v)
        else:
            out[k] = v
    return out


# ── Routes ────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "message": "Farmer Registry API is running 🌾",
        "version": "2.0.0",
        "scope": "Full farmer profiles from OpenG2P CDC"
    }


@app.get("/farmers", response_model=List[FarmerProfile])
def get_all_farmers(limit: int = 100, offset: int = 0):
    """Return full farmer profiles from OpenG2P CDC."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            f"{FARMER_SELECT_SQL} {WHERE_FARMER} ORDER BY rp.id DESC LIMIT %s OFFSET %s",
            (limit, offset),
        )
        rows = cur.fetchall()
        return [serialize(dict(r)) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


@app.get("/farmers/stats/summary")
def get_farmer_stats():
    """Summary statistics."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(f"""
            SELECT
                COUNT(*)                                         AS total_registrants,
                COUNT(*) FILTER (WHERE is_group = false)        AS total_individuals,
                COUNT(*) FILTER (WHERE is_group = true)         AS total_groups,
                COUNT(*) FILTER (WHERE gender = 'Male')         AS male_count,
                COUNT(*) FILTER (WHERE gender = 'Female')       AS female_count,
                COUNT(*) FILTER (WHERE approval_status = 'approved') AS approved_count,
                COUNT(*) FILTER (WHERE approval_status = 'draft')    AS draft_count
            FROM res_partner
            {WHERE_FARMER}
        """)
        return serialize(dict(cur.fetchone()))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


@app.get("/farmers/search/{name}")
def search_farmer_by_name(name: str):
    """Search by name (EN or Amharic)."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            f"{FARMER_SELECT_SQL} {WHERE_FARMER} "
            "AND (rp.name ILIKE %s OR rp.first_name_amh ILIKE %s OR rp.family_name_amh ILIKE %s) "
            "ORDER BY rp.name LIMIT 20",
            (f"%{name}%", f"%{name}%", f"%{name}%"),
        )
        rows = cur.fetchall()
        results = [serialize(dict(r)) for r in rows]
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


@app.get("/farmers/{farmer_id}", response_model=FarmerProfile)
def get_farmer_by_id(farmer_id: int):
    """Single farmer by numeric DB id."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            f"{FARMER_SELECT_SQL} {WHERE_FARMER} AND rp.id = %s",
            (farmer_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Farmer not found")
        return serialize(dict(row))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
