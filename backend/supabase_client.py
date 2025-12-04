"""
Supabase client helper for the R-KIDS backend.

Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY
from environment (see database/README.md for setup).
"""

import os
from typing import Optional

from supabase import Client, create_client

SUPABASE_URL_ENV = "SUPABASE_URL"
SERVICE_ROLE_ENV = "SUPABASE_SERVICE_ROLE_KEY"
ANON_KEY_ENV = "SUPABASE_ANON_KEY"

_client: Optional[Client] = None


def init_supabase() -> Optional[Client]:
    """Initialise Supabase client once and reuse."""
    global _client

    supabase_url = os.environ.get(SUPABASE_URL_ENV)
    supabase_key = os.environ.get(SERVICE_ROLE_ENV) or os.environ.get(ANON_KEY_ENV)

    if not supabase_url or not supabase_key:
        print(
            "⚠️  Supabase not configured. "
            f"Set {SUPABASE_URL_ENV} and {SERVICE_ROLE_ENV} (or {ANON_KEY_ENV})."
        )
        return None

    try:
        _client = create_client(supabase_url, supabase_key)
        print("✅ Supabase client initialised")
    except Exception as exc:  # pragma: no cover - defensive logging
        print(f"❌ Failed to initialise Supabase client: {exc}")
        _client = None

    return _client


def get_supabase() -> Optional[Client]:
    """Get a Supabase client instance (initialising lazily)."""
    global _client
    if _client is None:
        return init_supabase()
    return _client


def get_default_church_id() -> Optional[str]:
    """
    Get or create the default church for this deployment.

    Mirrors the design in USER_CASE_FLOW and database schema:
    - churches table exists
    - we either reuse the first church or create
      'Ruach South Assembly' with default settings.
    """
    client = get_supabase()
    if client is None:
        return None

    try:
        # Try to fetch an existing church
        res = client.table("churches").select("church_id").limit(1).execute()
        if res.data:
            return res.data[0]["church_id"]

        # Create default church
        payload = {
            "name": "Ruach South Assembly",
            "location": "Growth Happens Here",
            "settings": {},
        }
        created = client.table("churches").insert(payload).execute()
        if created.data:
            church_id = created.data[0]["church_id"]
            print(f"✅ Created default church: {church_id}")
            return church_id
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting/creating default church: {exc}")

    return None


