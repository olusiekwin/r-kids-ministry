# Import Parents and Children Data

This script imports parent and child data into the R-KIDS system.

## Usage

1. Make sure your Supabase environment variables are set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_ANON_KEY`)

2. Run the import script:
   ```bash
   cd backend
   python import_parents_children.py
   ```

## What the script does

1. **Parses the data**: Extracts parent and child information from the provided data
2. **Normalizes data**:
   - Email addresses (handles multiple emails, takes first one)
   - Phone numbers (handles multiple numbers, normalizes format)
   - Dates (handles various formats like M/D/YYYY, DD/MM/YYYY, ordinal dates, etc.)
3. **Groups by parent**: Groups children by parent email (since same parent can have multiple children)
4. **Creates parents**: Creates guardian records in the `guardians` table
5. **Creates children**: Creates child records linked to their parents

## Date Format Support

The script handles various date formats:
- `2/5/2014` (M/D/YYYY)
- `6/10/2017` (M/D/YYYY)
- `10/09/2013` (DD/MM/YYYY)
- `12th March 2016` (ordinal dates)
- `15102012` (DDMMYYYY)
- `22-08-2011` (DD-MM-YYYY)
- `27.01.2012` (DD.MM.YYYY)
- `1st May 2015.` (with trailing period)

**Note**: Dates without years (like "10 April") will use an estimated year (2017) and should be manually corrected after import.

## Important Notes

- The script checks for existing parents/children and skips duplicates
- Parent codes are auto-generated (RS001, RS002, etc.)
- Child registration IDs are auto-generated (RS001/01, RS001/02, etc.)
- If a parent already exists (by email), children will be added to that existing parent
- The script will print warnings for any data that couldn't be parsed

## Output

The script will print:
- ✓ Successfully created/found parents and children
- ⚠️ Warnings for data that needs attention
- ❌ Errors that prevented creation
- 📊 Summary at the end with counts



