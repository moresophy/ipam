from app import app
from models import db, User

with app.app_context():
    if not User.query.filter_by(username='admin').first():
        user = User(username='admin')
        user.set_password('password')
        db.session.add(user)
        db.session.commit()
        print("Admin user created: admin/password")
    else:
        print("Admin user already exists")
