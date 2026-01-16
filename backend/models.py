from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Subnet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    cidr = db.Column(db.String(20), unique=True, nullable=False)
    description = db.Column(db.String(200))
    parent_id = db.Column(db.Integer, db.ForeignKey('subnet.id'), nullable=True)
    subnets = db.relationship('Subnet', backref=db.backref('parent', remote_side=[id]), lazy=True)
    ips = db.relationship('IPAddress', backref='subnet', lazy=True, cascade="all, delete-orphan")

class IPAddress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subnet_id = db.Column(db.Integer, db.ForeignKey('subnet.id'), nullable=False)
    ip_address = db.Column(db.String(20), nullable=False)
    dns_name = db.Column(db.String(100))
    architecture = db.Column(db.String(50)) # VM, Bare Metal, etc.
    function = db.Column(db.String(100))
