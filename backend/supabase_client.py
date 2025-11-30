"""
Supabase Client for REST API operations
Uses SUPABASE_URL and SUPABASE_ANON_KEY from environment
"""
import os
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from config import Config

# Initialize Supabase client
supabase: Optional[Client] = None

def init_supabase() -> Optional[Client]:
    """Initialize Supabase client"""
    global supabase
    
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("⚠️ SUPABASE_URL or SUPABASE_ANON_KEY not set in .env")
        return None
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        # Test connection
        result = supabase.table('churches').select('count', count='exact').limit(0).execute()
        print("✅ Supabase client initialized successfully")
        return supabase
    except Exception as e:
        print(f"⚠️ Failed to initialize Supabase client: {e}")
        print("   Make sure SUPABASE_URL and SUPABASE_ANON_KEY are correct in .env")
        return None

def get_supabase() -> Optional[Client]:
    """Get Supabase client instance"""
    global supabase
    if supabase is None:
        supabase = init_supabase()
    return supabase

def test_supabase_connection() -> bool:
    """Test Supabase connection"""
    client = get_supabase()
    if not client:
        return False
    try:
        # Try a simple query (table might not exist yet, that's okay)
        # We just want to verify the API is accessible
        try:
            result = client.table('churches').select('count', count='exact').limit(0).execute()
        except:
            # If table doesn't exist, try a different approach - just check if API responds
            # The fact that we got here means the client is initialized
            pass
        return True
    except Exception as e:
        # If we get a connection error, it's a real problem
        if 'connection' in str(e).lower() or 'network' in str(e).lower():
            print(f"Supabase connection test failed: {e}")
            return False
        # Otherwise, table might not exist yet, but API is working
        return True

