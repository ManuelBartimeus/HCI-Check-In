"""
CSV Import route — bulk member import.
"""
import io
import pandas as pd
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..extensions import db
from ..models.member import Member

import_bp = Blueprint('import', __name__)


@import_bp.route('/api/import/members', methods=['POST'])
@jwt_required()
def import_members():
    """
    Import members from CSV.
    Rules:
    - Use only the first column
    - Ignore empty rows
    - Ignore duplicates (case-insensitive)
    - Trim whitespace
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided. Send a multipart form with key "file"'}), 400

    file = request.files['file']

    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400

    if not file.filename.lower().endswith('.csv'):
        return jsonify({'error': 'Only CSV files are accepted'}), 400

    try:
        content = file.read().decode('utf-8-sig')  # strip BOM if present
        df = pd.read_csv(io.StringIO(content), header=None, usecols=[0])
    except Exception as e:
        return jsonify({'error': f'Failed to parse CSV: {str(e)}'}), 400

    # Extract and clean names from first column
    raw_names = df.iloc[:, 0].dropna().astype(str).str.strip().tolist()
    raw_names = [n for n in raw_names if n]  # remove empty strings

    # Fetch existing names (case-insensitive set)
    existing = {m.name.lower() for m in Member.query.with_entities(Member.name).all()}

    imported = []
    skipped = []
    duplicates = []
    errors = []

    for name in raw_names:
        if not name:
            skipped.append(name)
            continue
        if len(name) > 200:
            errors.append({'name': name, 'reason': 'Name too long'})
            continue
        if name.lower() in existing:
            duplicates.append(name)
            continue

        try:
            member = Member(name=name)
            db.session.add(member)
            existing.add(name.lower())
            imported.append(name)
        except Exception as e:
            errors.append({'name': name, 'reason': str(e)})

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

    return jsonify({
        'imported': len(imported),
        'imported_names': imported,
        'skipped': len(skipped),
        'duplicates': len(duplicates),
        'duplicate_names': duplicates,
        'errors': len(errors),
        'error_details': errors,
        'total_processed': len(raw_names),
    }), 200
