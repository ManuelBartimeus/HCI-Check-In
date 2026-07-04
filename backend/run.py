"""
Flask application entry point.
Run with: python run.py
"""
import os
import sys

# Fix Windows console encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Ensure backend dir is in path
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from config import config_map

env = os.environ.get('FLASK_ENV', 'development')
app = create_app(config_map.get(env, config_map['default']))

if __name__ == '__main__':
    # Auto-seed database on first run
    with app.app_context():
        from app.extensions import db
        from app.models.member import Member

        member_count = Member.query.count()
        if member_count == 0:
            print("[SEED] First startup -- seeding database...")
            try:
                from seed import seed_database
                seed_database(app)
                print("[SEED] Database seeded successfully!")
            except Exception as e:
                print(f"[SEED] Seed failed: {e}")
                import traceback
                traceback.print_exc()
        else:
            print(f"[INFO] Database already has {member_count} members -- skipping seed.")

    port = int(os.environ.get('PORT', 5000))
    print(f"[INFO] Church Attendance API running on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])
