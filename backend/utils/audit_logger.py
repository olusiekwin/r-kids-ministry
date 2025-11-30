"""
Audit Logging Utility
Logs user activities to the audit_logs table for admin tracking
"""
from datetime import datetime
from typing import Optional, Dict, Any
import json

def log_activity(
    supabase_client,
    church_id: str,
    user_id: Optional[str],
    action_performed: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """
    Log an activity to the audit_logs table
    
    Args:
        supabase_client: Supabase client instance
        church_id: ID of the church
        user_id: ID of the user performing the action
        action_performed: Action name (e.g., 'LOGIN', 'CREATE_USER', 'UPDATE_CHILD', 'CHECK_IN')
        entity_type: Type of entity affected (e.g., 'user', 'child', 'guardian')
        entity_id: ID of the entity affected
        details: Additional details as a dictionary
        ip_address: IP address of the request
        user_agent: User agent string from the request
    """
    if not supabase_client:
        # If Supabase not available, just print (for development)
        print(f"📋 AUDIT: {action_performed} by user {user_id} - {entity_type}:{entity_id}")
        if details:
            print(f"   Details: {json.dumps(details, indent=2)}")
        return
    
    try:
        audit_entry = {
            'church_id': church_id,
            'user_id': user_id,
            'action_performed': action_performed,
            'entity_type': entity_type,
            'entity_id': entity_id,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'details': json.dumps(details) if details else None,
            'timestamp': datetime.now().isoformat()
        }
        
        result = supabase_client.table('audit_logs').insert(audit_entry).execute()
        
        if result.data:
            print(f"✅ Audit logged: {action_performed} by user {user_id}")
        else:
            print(f"⚠️ Failed to log audit: {action_performed}")
            
    except Exception as e:
        print(f"⚠️ Error logging audit: {e}")
        import traceback
        traceback.print_exc()

def get_user_from_token(users_db: Dict, token: str) -> Optional[Dict]:
    """Get user information from token"""
    if token in users_db:
        return users_db[token]
    return None

def extract_ip_address(request) -> Optional[str]:
    """Extract IP address from Flask request"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    return request.remote_addr

def extract_user_agent(request) -> Optional[str]:
    """Extract user agent from Flask request"""
    return request.headers.get('User-Agent')

