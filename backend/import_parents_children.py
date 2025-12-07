#!/usr/bin/env python3
"""
Script to import parents and children data into the R-KIDS system.

Usage:
    python import_parents_children.py

This script reads parent and child data and creates records in the database.
"""

import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from supabase_client import get_supabase, get_default_church_id


def parse_date(date_str: str) -> Optional[str]:
    """
    Parse various date formats and return YYYY-MM-DD format.
    
    Handles formats like:
    - 2/5/2014 (M/D/YYYY)
    - 6/10/2017 (M/D/YYYY)
    - 12th March 2016
    - 3rd October 2016
    - 22nd September 2019
    - 15102012 (DDMMYYYY)
    - 10/09/2013 (DD/MM/YYYY)
    - 24 April 2013
    - 28/09/2017 (DD/MM/YYYY)
    - 07/06/2012 (DD/MM/YYYY)
    - 22-08-2011 (DD-MM-YYYY)
    - 1st May 2015
    - 1st May 2015. (with trailing period)
    - 10 April (no year, assume current year or skip)
    - 20 September (no year, assume current year or skip)
    """
    if not date_str or not date_str.strip():
        return None
    
    date_str = date_str.strip().rstrip('.')  # Remove trailing periods
    
    # Try different date formats
    formats = [
        # M/D/YYYY or MM/DD/YYYY
        ("%m/%d/%Y", lambda s: re.match(r'^\d{1,2}/\d{1,2}/\d{4}$', s)),
        # DD/MM/YYYY
        ("%d/%m/%Y", lambda s: re.match(r'^\d{1,2}/\d{1,2}/\d{4}$', s)),
        # DD-MM-YYYY
        ("%d-%m-%Y", lambda s: re.match(r'^\d{1,2}-\d{1,2}-\d{4}$', s)),
        # DDMMYYYY (8 digits)
        ("%d%m%Y", lambda s: re.match(r'^\d{8}$', s)),
        # YYYY-MM-DD (already correct format)
        ("%Y-%m-%d", lambda s: re.match(r'^\d{4}-\d{2}-\d{2}$', s)),
    ]
    
    for fmt, matcher in formats:
        if matcher(date_str):
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue
    
    # Handle ordinal dates like "12th March 2016", "3rd October 2016", "22nd September 2019"
    ordinal_pattern = r'(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})'
    match = re.match(ordinal_pattern, date_str, re.IGNORECASE)
    if match:
        day, month_name, year = match.groups()
        try:
            month_num = datetime.strptime(month_name, "%B").month
            dt = datetime(int(year), month_num, int(day))
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass
    
    # Handle dates without year like "10 April", "20 September"
    # We'll estimate year based on reasonable age (assuming child is 3-15 years old)
    # This is a heuristic - these dates should be manually corrected
    no_year_pattern = r'(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)'
    match = re.match(no_year_pattern, date_str, re.IGNORECASE)
    if match:
        day, month_name = match.groups()
        try:
            month_num = datetime.strptime(month_name, "%B").month
            # Estimate year assuming child is 5-10 years old (born 2014-2019)
            # This is a rough estimate - these should be manually corrected
            estimated_year = 2017  # Middle of reasonable range
            dt = datetime(estimated_year, month_num, int(day))
            print(f"⚠️  WARNING: Date '{date_str}' has no year, using estimated year {estimated_year}. Please verify and correct manually.")
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass
    
    # Handle "DD.MM.YYYY" format
    if re.match(r'^\d{1,2}\.\d{1,2}\.\d{4}$', date_str):
        try:
            dt = datetime.strptime(date_str, "%d.%m.%Y")
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass
    
    print(f"⚠️  Warning: Could not parse date '{date_str}', skipping")
    return None


def normalize_phone(phone: str) -> Optional[str]:
    """Normalize phone number by removing spaces and special characters.
    If multiple numbers are provided (separated by / or 'or'), use the first one.
    """
    if not phone:
        return None
    
    # Handle multiple phone numbers - take the first one
    phone = phone.strip()
    if '/' in phone:
        phone = phone.split('/')[0].strip()
    elif ' or ' in phone.lower():
        phone = phone.split(' or ')[0].strip()
    
    # Remove spaces, dashes, and keep only digits and +
    normalized = re.sub(r'[^\d+]', '', phone)
    # If it starts with +254, keep it; otherwise ensure it starts with 0 or +254
    if normalized.startswith('+254'):
        return normalized
    elif normalized.startswith('254'):
        return '+' + normalized
    elif normalized.startswith('0'):
        return normalized
    elif len(normalized) >= 9:
        # Assume it's a Kenyan number without country code
        return '0' + normalized if not normalized.startswith('0') else normalized
    return normalized


def normalize_email(email: str) -> Optional[str]:
    """Normalize email by taking the first one if multiple are provided."""
    if not email:
        return None
    # Handle multiple emails separated by | or or
    email = email.strip()
    if '|' in email:
        email = email.split('|')[0].strip()
    elif ' or ' in email.lower():
        email = email.split(' or ')[0].strip()
    return email.lower() if email else None


def parse_data_row(row: List[str]) -> Dict:
    """Parse a row of data into structured format."""
    if len(row) < 5:
        return None
    
    parent_name = row[0].strip() if len(row) > 0 else ""
    parent_email = normalize_email(row[1].strip() if len(row) > 1 else "")
    parent_phone = normalize_phone(row[2].strip() if len(row) > 2 else "")
    child_name = row[3].strip() if len(row) > 3 else ""
    child_dob = parse_date(row[4].strip() if len(row) > 4 else "")
    
    return {
        "parent_name": parent_name,
        "parent_email": parent_email,
        "parent_phone": parent_phone,
        "child_name": child_name,
        "child_dob": child_dob,
    }


def main():
    """Main function to import parents and children."""
    
    # Raw data from user
    raw_data = """Coletta Njeri Mwangangi	coletmwangangi@gmail.com	0728811866	Nathan Mugisha 	2/5/2014
Coletta Njeri Mwangangi	coletmwangangi@gmail.com	0728811866	Kyle King	6/10/2017
Coletta Njeri Mwangangi	coletmwangangi@gmail.com	0728811866	Bella McKenna	7/22/2018
Caroline Musya 	cmukulu@gmail.com	0731662120	Adrian Mwandawiro	8/29/2012
Caroline Chege 	carolinewchege@gmail.com	0711859532	Zuri Mwari	12/22/2013
Genevieve Achieng 	gennieachie@gmail.com	0721145413	Fifine Keira 	12th March 2016
Genevieve Achieng 	gennieachie@gmail.com	0721145413	Amalu Merab	3rd October 2016
Genevieve Achieng 	gennieachie@gmail.com	0721145413	Abrielle Naysa	22nd September 2019
Judy Wawira 	j.wawira01@gmail.com	0717262734	Jabari Kyalo 	15102012
Irene Mapelu 	irnaanyu@gmail.com	0720570306	Akim Sifa	10/09/2013
Irene Mapelu 	irnaanyu@gmail.com	0720570306	Alicah Mayah	20/09/2015
Irene Mapelu 	irnaanyu@gmail.com	0720570306	Amira Folorunso 	30/05/2017
Lorraine Achieng 	Lachieng2008@gmail.com 	0757846206	Carl Macnehemiah 	24 April 2013
Lorraine Achieng 	Lachieng2008@gmail.com 	0757846206	Ariannah Rachael Hawii	6 January 2016
Lorraine Achieng 	Lachieng2008@gmail.com 	0757846206	Gabriel Hawi	17th May 2020
Lorraine Achieng 	Lachieng2008@gmail.com 	0757846206	Wendy Yuliana Malaika	3rd February 2018
Daniel Mutwiri & Eve Ouma	eveouma86@gmail.com	0707639662	Jonathan Mutwiri 	28/09/2017
Daniel Mutwiri and Eve Ouma 	eveouma86@gmail.com	0707639662	Olivia Mutwiri 	24/06/2019
Daniel Mutwiri and Eve Ouma 	eveouma86@gmail.com	0707639662	Noah Mutwiri 	21/01/2021
RUTH NAMAEMBA KHISA 	Khisar@yahoo.com 	+254725056771 	Kylie Imani 	07/06/2012
RUTH NAMAEMBA KHISA 	Khisar@yahoo.com 	+254725056771 	Zarinah Zolani 	17/11/2016
Wanjuki Kiarago 	jkiarago@gmail.com 	0782105369	Naima T. Matambanadzo 	22-08-2011
Wanjuki Kiarago 	jkiarago@gmail.com 	0782105369	Judah T. Matambanadzo 	23-09-2014
CAROLINE KAGIA 	carolinekagiawellness@gmail.com	0757576980	KELLY KAGIA	1st May 2015.
Getrude Jeruto 	gkerich88@gmail.com	0726585806	Palmer KeKe Jepkorir	16/11/2017
David Maingi Tirima and Irene Maingi	tirimadavid@gmail.com or irenemutheu15@gmail.com	0722495695 or 0715002041	Gabriel Maingi	4th May 2015
Tony Menza 	tonymenza7@gmail.com 	0725 455 662 	Chessy Wairimu 	10 April
Tony Menza 	tonymenza7@gmail.com 	0725455662	Elssy Wangui 	20 September 
Amos Odidi	amos.odidi@gmail.com	0721936885/0724439777	Cayden Dylan	25th Oct 2012
EVERLYNE WANJIRU MURIGU	EVESHIRO92@GMAIL.COM	0717393096	CALEB BARAKA MWANGI	23RD MARCH 2018
Irene wambani muloma	irenemuloma@gmail.com	+254729542619	Janet Naiga Wanjau	9th May 2011
Mbeti Karen Florence 	karenmbeti@gmail.com	0795096223	Kylee Wanna Kuli	27.01.2012
Ruth Mushi Amwayi 	ramwayi@safaricom.co.ke 	0722 507464 	Nemayian Koitamet Kina	25-11-2014
Martha Muthoni 	muthonikiyo@gmail.com	0728994723 or 0725743124	Imani Lucy Mwanduka	1/12/2020
Gracejoy Wanjohi 	gjoykawan@yahoo.com 	0720409637	Ivan Jabari 	11/12/2015
Joyce Gichinga 	gichingajoyce08@gmail.com	0798078496	Marsha waitherero wangari	6/03/2016
Gladys Muturi 	gladysmuturin@gmail.com	0722731849	Arianna Ikenye	07 Aug 2017
Violet Vihenda 	vvihenda2@gmail.com	0729483322	Ethan Owera Omondi 	26/09/2012
Violet Vihenda 	vvihenda2@gmail.com	0729493322	Ayanah Ava Omondi	12/08/2018
Gladys Muturi 	gladysmuturin@gmail.com	0722731849	Wendo Ikenye	22nd Oct 2021
Nick Kamau & Mwende Kamau	judymwende.mwende@gmail.com	0723754123	Joshua Thayu Kamau	15/04/2015
Nick and Mwende Kamau	judymwende.mwende@gmail.com	0723754123	Judah Mutana Kamau	01/04/2017
Nick and Mwende Kamau	judymwende.mwende@gmail.com	0723754123	Levi Enzi Kamau	05/10/2019
Richard Itambo | Wanjiku Itambo	richardmwandoe@gmail.com | shikuitambo@gmail.com	0724852901 | 0734820160	Jaden Itambo	24/11/2014
Richard Itambo | Wanjiku Itambo	richardmwandoe@gmail.com | shikuitambo@gmail.com	0724852901 | 0734820160	Tal Itambo	06/01/2017
Eva Ngovi	eva.ngovi@gmail.com	0722819310	Genesis Tunu-Nuru	20/06/2021
Mary Ndunge Kioko	maryk.yona@gmail.com	+254720760883	Iden Hawi Yona	07/07/2011
Rose Njeri isika	rnkahurani@gmail.com	0707491016	Nathan isika	9/01/2012
Sophy Inyanji Mukhongo 	sophiemukhongo@gmail.com	0718882221	Caidyn Israel Mukhongo 	09/05/2018
Yvonne Wawira Kinyua	Yvonne.wawira@gmail.com	0728826070	Ariella Kaki	27/04/2015
Yvonne Wawira 	Yvonne.wawira@gmail.com	0728826070	Reign Baraka 	04/04/2021"""
    
    # Parse data
    rows = []
    for line in raw_data.strip().split('\n'):
        if not line.strip():
            continue
        # Split by tab
        parts = line.split('\t')
        if len(parts) >= 5:
            parsed = parse_data_row(parts)
            if parsed:
                rows.append(parsed)
    
    # Group by parent email (since same parent can have multiple children)
    parents_map: Dict[str, Dict] = {}
    children_by_parent: Dict[str, List[Dict]] = {}
    
    for row in rows:
        email = row["parent_email"]
        if not email:
            print(f"⚠️  Skipping row with no email: {row['parent_name']}")
            continue
        
        if email not in parents_map:
            parents_map[email] = {
                "name": row["parent_name"],
                "email": email,
                "phone": row["parent_phone"],
            }
            children_by_parent[email] = []
        
        # Add child to this parent
        if row["child_name"] and row["child_dob"]:
            children_by_parent[email].append({
                "name": row["child_name"],
                "date_of_birth": row["child_dob"],
            })
        elif row["child_name"]:
            print(f"⚠️  Skipping child '{row['child_name']}' - invalid date of birth")
    
    # Get Supabase client
    client = get_supabase()
    if client is None:
        print("❌ Failed to initialize Supabase client")
        return
    
    church_id = get_default_church_id()
    if church_id is None:
        print("❌ Failed to get church ID")
        return
    
    print(f"✅ Using church_id: {church_id}")
    print(f"📊 Found {len(parents_map)} unique parents with {sum(len(children) for children in children_by_parent.values())} children")
    
    # Create parents first
    created_parents: Dict[str, str] = {}  # email -> guardian_id
    skipped_parents = []
    
    for email, parent_data in parents_map.items():
        try:
            # Check if parent already exists
            existing = (
                client.table("guardians")
                .select("guardian_id, parent_id")
                .eq("church_id", church_id)
                .eq("email", email)
                .eq("relationship", "Primary")
                .limit(1)
                .execute()
            )
            
            if existing.data:
                guardian_id = existing.data[0]["guardian_id"]
                parent_id = existing.data[0]["parent_id"]
                created_parents[email] = guardian_id
                print(f"✓ Parent already exists: {parent_data['name']} ({parent_id})")
                continue
            
            # Get next parent code
            count_res = (
                client.table("guardians")
                .select("guardian_id", count="exact")
                .eq("church_id", church_id)
                .execute()
            )
            existing_count = getattr(count_res, "count", None)
            if existing_count is None:
                existing_count = len(count_res.data or [])
            
            parent_code = f"RS{existing_count + 1:03d}"
            
            # Create parent
            payload = {
                "church_id": church_id,
                "parent_id": parent_code,
                "name": parent_data["name"],
                "email": parent_data["email"],
                "phone": parent_data["phone"],
                "relationship": "Primary",
                "is_primary": True,
            }
            
            created = client.table("guardians").insert(payload).execute()
            if created.data:
                guardian_id = created.data[0]["guardian_id"]
                created_parents[email] = guardian_id
                print(f"✓ Created parent: {parent_data['name']} ({parent_code})")
            else:
                skipped_parents.append(parent_data["name"])
                print(f"⚠️  Failed to create parent: {parent_data['name']}")
        except Exception as exc:
            print(f"❌ Error creating parent {parent_data['name']}: {exc}")
            skipped_parents.append(parent_data["name"])
    
    # Create children
    created_children = 0
    skipped_children = []
    
    for email, children in children_by_parent.items():
        if email not in created_parents:
            print(f"⚠️  Skipping children for {email} - parent not created")
            skipped_children.extend([c["name"] for c in children])
            continue
        
        guardian_id = created_parents[email]
        
        # Get parent_id (like RS073) for registration_id generation
        parent_info = (
            client.table("guardians")
            .select("parent_id")
            .eq("guardian_id", guardian_id)
            .limit(1)
            .execute()
        )
        parent_prefix = parent_info.data[0]["parent_id"] if parent_info.data else "RS001"
        
        for child_data in children:
            try:
                # Check if child already exists (by name and parent)
                existing = (
                    client.table("children")
                    .select("child_id, registration_id")
                    .eq("church_id", church_id)
                    .eq("parent_id", guardian_id)
                    .eq("name", child_data["name"])
                    .limit(1)
                    .execute()
                )
                
                if existing.data:
                    print(f"  ✓ Child already exists: {child_data['name']} ({existing.data[0]['registration_id']})")
                    continue
                
                # Count existing children for this parent to generate registration_id
                children_count_res = (
                    client.table("children")
                    .select("child_id", count="exact")
                    .eq("church_id", church_id)
                    .eq("parent_id", guardian_id)
                    .execute()
                )
                child_number = (children_count_res.count or 0) + 1
                registration_id = f"{parent_prefix}/{str(child_number).zfill(2)}"
                
                # Create child
                payload = {
                    "church_id": church_id,
                    "parent_id": guardian_id,
                    "registration_id": registration_id,
                    "name": child_data["name"],
                    "date_of_birth": child_data["date_of_birth"],
                }
                
                created = client.table("children").insert(payload).execute()
                if created.data:
                    created_children += 1
                    print(f"  ✓ Created child: {child_data['name']} ({registration_id})")
                else:
                    skipped_children.append(child_data["name"])
                    print(f"  ⚠️  Failed to create child: {child_data['name']}")
            except Exception as exc:
                print(f"  ❌ Error creating child {child_data['name']}: {exc}")
                skipped_children.append(child_data["name"])
    
    # Summary
    print("\n" + "="*60)
    print("📊 IMPORT SUMMARY")
    print("="*60)
    print(f"Parents created/found: {len(created_parents)}")
    if skipped_parents:
        print(f"Parents skipped: {len(skipped_parents)}")
    print(f"Children created: {created_children}")
    if skipped_children:
        print(f"Children skipped: {len(skipped_children)}")
    print("="*60)


if __name__ == "__main__":
    main()

