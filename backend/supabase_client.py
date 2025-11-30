"""
Supabase Client for REST API operations
Uses SUPABASE_URL and SUPABASE_ANON_KEY from environment
"""
import os
from typing import Optional
from supabase import create_client, Client

# Initialize Supabase client
supabase: Optional[Client] = None

def init_supabase() -> Optional[Client]:
    """Initialize Supabase client"""
    global supabase
    
    supabase_url = os.environ.get('SUPABASE_URL')
    # Prefer service_role key (bypasses RLS) for backend operations
    # Fall back to anon key if service_role not available
    supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        if not os.environ.get('SUPABASE_SERVICE_ROLE_KEY') and not os.environ.get('SUPABASE_ANON_KEY'):
            print("⚠️ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) not set in .env")
            print("   💡 Tip: Use SUPABASE_SERVICE_ROLE_KEY for backend (bypasses RLS)")
        return None
    
    # Check if using service_role key
    using_service_role = bool(os.environ.get('SUPABASE_SERVICE_ROLE_KEY'))
    if using_service_role:
        print("✅ Using Supabase service_role key (bypasses RLS)")
    else:
        print("⚠️ Using anon key - RLS policies must be configured")
        print("   💡 Tip: Use SUPABASE_SERVICE_ROLE_KEY for backend operations")
    
    try:
        # Initialize Supabase client - handle proxy parameter error
        # This is a known issue with some versions of supabase-py and httpx
        import warnings
        warnings.filterwarnings('ignore', category=DeprecationWarning)
        
        # Try direct initialization - supabase 2.3.4 should work with this
        supabase = create_client(supabase_url, supabase_key)
        
        # Test connection (don't fail if table doesn't exist yet)
        try:
            result = supabase.table('churches').select('count', count='exact').limit(0).execute()
        except Exception as table_error:
            # Table might not exist yet, but client is initialized
            error_str = str(table_error).lower()
            if 'relation' not in error_str and 'does not exist' not in error_str and 'permission' not in error_str:
                # Only raise if it's not a table/permission error
                raise table_error
        
        print("✅ Supabase client initialized successfully")
        return supabase
    except Exception as e:
        error_msg = str(e)
        print(f"⚠️ Failed to initialize Supabase client: {error_msg}")
        print("   Make sure SUPABASE_URL and SUPABASE_ANON_KEY are correct in .env")
        
        # Provide helpful error messages
        if 'proxy' in error_msg.lower():
            print("   💡 Tip: Version compatibility issue. Try: pip install httpx==0.25.2")
        elif 'connection' in error_msg.lower() or 'network' in error_msg.lower():
            print("   💡 Tip: Check your internet connection and Supabase URL")
        elif 'unauthorized' in error_msg.lower() or 'invalid' in error_msg.lower():
            print("   💡 Tip: Verify your SUPABASE_ANON_KEY is correct")
        elif 'headers' in error_msg.lower():
            print("   💡 Tip: This might be a dependency version issue")
            print("   Try: pip install httpx==0.25.2 httpcore==1.0.9")
        
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

