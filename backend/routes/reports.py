"""Reports Routes - For generating attendance and other reports"""

from flask import Blueprint, jsonify, request

from supabase_client import get_supabase, get_default_church_id

reports_bp = Blueprint("reports", __name__)


@reports_bp.get("/attendance")
def get_attendance_report():
    """Get attendance report with optional filters."""
    period = request.args.get("period")  # e.g., "week", "month", "year"
    group = request.args.get("group")

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get attendance summary data
        query = (
            client.table("attendance_summary")
            .select("*, groups(name)")
            .eq("church_id", church_id)
        )
        
        if group:
            # Filter by group name
            query = query.eq("groups.name", group)

        res = query.order("date", desc=True).limit(100).execute()
        
        reports = []
        for row in res.data or []:
            group_data = row.get("groups")
            reports.append({
                "id": row["summary_id"],
                "groupId": row.get("group_id"),
                "groupName": group_data.get("name") if group_data else None,
                "date": row.get("date"),
                "presentCount": row.get("present_count", 0),
                "absentCount": row.get("absent_count", 0),
                "attendanceRate": (
                    (row.get("present_count", 0) / (row.get("present_count", 0) + row.get("absent_count", 0)) * 100)
                    if (row.get("present_count", 0) + row.get("absent_count", 0)) > 0
                    else 0
                ),
            })
        return jsonify({"data": reports})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error getting attendance report: {exc}")
        return jsonify({"error": "Failed to get attendance report"}), 500


@reports_bp.get("/export")
def export_report():
    """Export report in specified format (CSV/Excel)."""
    format_type = request.args.get("format", "csv")  # csv or excel

    client = get_supabase()
    if client is None:
        return jsonify({"error": "Supabase not configured"}), 500

    church_id = get_default_church_id()
    if church_id is None:
        return jsonify({"error": "No church configured"}), 500

    try:
        # Get attendance data
        res = (
            client.table("attendance_summary")
            .select("*, groups(name)")
            .eq("church_id", church_id)
            .order("date", desc=True)
            .limit(1000)
            .execute()
        )

        # For now, return JSON (in production, generate CSV/Excel)
        # Frontend can handle the conversion
        reports = []
        for row in res.data or []:
            group_data = row.get("groups")
            reports.append({
                "date": row.get("date"),
                "group": group_data.get("name") if group_data else None,
                "present": row.get("present_count", 0),
                "absent": row.get("absent_count", 0),
            })

        if format_type == "csv":
            # Return as JSON, frontend can convert to CSV
            return jsonify({"data": reports, "format": "csv"})
        else:
            # Return as JSON, frontend can convert to Excel
            return jsonify({"data": reports, "format": "excel"})
    except Exception as exc:  # pragma: no cover
        print(f"⚠️ Error exporting report: {exc}")
        return jsonify({"error": "Failed to export report"}), 500

