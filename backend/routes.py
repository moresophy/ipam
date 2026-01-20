from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, Subnet, IPAddress
import ipaddress

api_bp = Blueprint('api', __name__)

# --- Auth ---
@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify(status="ok"), 200

@api_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "Username already exists"}), 400
        
    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    
    return jsonify({"msg": "User created successfully"}), 201

@api_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    print(f"Login attempt for: {username}")
    if user:
        print(f"User found. Hash: {user.password_hash}")
        check = user.check_password(password)
        print(f"Password check result: {check}")
        if check:
            access_token = create_access_token(identity=username)
            return jsonify(access_token=access_token), 200
    else:
        print("User not found")
    
    return jsonify({"msg": "Bad username or password"}), 401

@api_bp.route('/auth/change-password', methods=['POST'])
@jwt_required()
def change_password():
    current_user_name = get_jwt_identity()
    user = User.query.filter_by(username=current_user_name).first()
    
    if not user:
        return jsonify({"msg": "User not found"}), 404
        
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not user.check_password(current_password):
        return jsonify({"msg": "Das aktuelle Passwort ist falsch"}), 401
        
    user.set_password(new_password)
    db.session.commit()
    
    return jsonify({"msg": "Passwort erfolgreich geändert"}), 200

@api_bp.route('/auth/me', methods=['GET'])
@jwt_required()
def me():
    current_user = get_jwt_identity()
    return jsonify(username=current_user), 200

# --- Subnets ---
@api_bp.route('/subnets', methods=['GET'])
@jwt_required()
def get_subnets():
    subnets = Subnet.query.all()
    result = []
    for s in subnets:
        result.append({
            "id": s.id,
            "name": s.name,
            "cidr": s.cidr,
            "description": s.description,
            "parent_id": s.parent_id,
            "ip_count": len(s.ips)
        })
    return jsonify(result), 200

@api_bp.route('/subnets', methods=['POST'])
@jwt_required()
def create_subnet():
    data = request.get_json()
    try:
        # Validate CIDR
        new_network = ipaddress.ip_network(data['cidr'])
    except ValueError:
        return jsonify({"msg": "Invalid CIDR format"}), 400
        
    if Subnet.query.filter_by(cidr=data['cidr']).first():
        return jsonify({"msg": "Subnet with this CIDR already exists"}), 400

    new_subnet = Subnet(
        name=data['name'],
        cidr=data['cidr'],
        description=data.get('description', ''),
        parent_id=data.get('parent_id')
    )
    db.session.add(new_subnet)
    db.session.flush()  # Get the ID without committing yet
    
    # Reassign IPs: Find all IPs that should belong to this new subnet
    # Check parent subnet and all its ancestors
    reassigned_count = 0
    if new_subnet.parent_id:
        # Get all IPs from parent and its hierarchy
        def get_parent_chain(subnet_id):
            parent_ids = []
            current = Subnet.query.get(subnet_id)
            while current:
                parent_ids.append(current.id)
                current = Subnet.query.get(current.parent_id) if current.parent_id else None
            return parent_ids
        
        parent_ids = get_parent_chain(new_subnet.parent_id)
        
        # Get all IPs from these parent subnets
        candidate_ips = IPAddress.query.filter(IPAddress.subnet_id.in_(parent_ids)).all()
        
        for ip in candidate_ips:
            try:
                ip_obj = ipaddress.ip_address(ip.ip_address)
                # Check if this IP belongs to the new subnet
                if ip_obj in new_network:
                    # Check if there's no more specific child subnet for this IP
                    current_subnet = Subnet.query.get(ip.subnet_id)
                    current_network = ipaddress.ip_network(current_subnet.cidr)
                    
                    # Only move if the new subnet is more specific (smaller) than current
                    if new_network.prefixlen > current_network.prefixlen:
                        ip.subnet_id = new_subnet.id
                        reassigned_count += 1
            except ValueError:
                continue
    
    db.session.commit()
    
    return jsonify({
        "msg": "Subnet created", 
        "id": new_subnet.id,
        "reassigned_ips": reassigned_count
    }), 201

@api_bp.route('/subnets/<int:id>', methods=['PUT'])
@jwt_required()
def update_subnet(id):
    subnet = Subnet.query.get_or_404(id)
    data = request.get_json()
    
    subnet.name = data.get('name', subnet.name)
    subnet.description = data.get('description', subnet.description)
    # CIDR update is risky without validation of existing IPs, skipping for now or handle carefully
    
    db.session.commit()
    return jsonify({"msg": "Subnet updated"}), 200

@api_bp.route('/subnets/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_subnet(id):
    subnet = Subnet.query.get_or_404(id)
    db.session.delete(subnet)
    db.session.commit()
    return jsonify({"msg": "Subnet deleted"}), 200

# --- IP Addresses ---
@api_bp.route('/subnets/<int:subnet_id>/ips', methods=['GET'])
@jwt_required()
def get_ips(subnet_id):
    subnet = Subnet.query.get_or_404(subnet_id)
    
    # Get all child subnet IDs recursively
    def get_all_child_ids(parent_id):
        children = Subnet.query.filter_by(parent_id=parent_id).all()
        child_ids = [parent_id]
        for child in children:
            child_ids.extend(get_all_child_ids(child.id))
        return child_ids
    
    # Get IPs from this subnet and all child subnets
    all_subnet_ids = get_all_child_ids(subnet_id)
    ips = IPAddress.query.filter(IPAddress.subnet_id.in_(all_subnet_ids)).all()
    
    result = []
    for ip in ips:
        # Get subnet name for display
        ip_subnet = Subnet.query.get(ip.subnet_id)
        result.append({
            "id": ip.id,
            "ip_address": ip.ip_address,
            "dns_name": ip.dns_name,
            "architecture": ip.architecture,
            "function": ip.function,
            "subnet_name": ip_subnet.name if ip_subnet else "",
            "subnet_cidr": ip_subnet.cidr if ip_subnet else ""
        })
    return jsonify(result), 200

@api_bp.route('/ips', methods=['POST'])
@jwt_required()
def add_ip():
    data = request.get_json()
    subnet_id = data.get('subnet_id')
    ip_addr = data.get('ip_address')
    
    # Validate IP address format
    try:
        ip_obj = ipaddress.ip_address(ip_addr)
    except ValueError:
        return jsonify({"msg": "Ungültige IP-Adresse"}), 400
    
    # Get the selected subnet (or its parent hierarchy)
    selected_subnet = Subnet.query.get_or_404(subnet_id)
    
    # Find all subnets that could contain this IP (selected subnet and all its children)
    def get_all_child_ids(parent_id):
        children = Subnet.query.filter_by(parent_id=parent_id).all()
        child_ids = [parent_id]
        for child in children:
            child_ids.extend(get_all_child_ids(child.id))
        return child_ids
    
    all_subnet_ids = get_all_child_ids(subnet_id)
    candidate_subnets = Subnet.query.filter(Subnet.id.in_(all_subnet_ids)).all()
    
    # Find the most specific (smallest) subnet that contains this IP
    best_match = None
    smallest_prefix = -1
    
    for subnet in candidate_subnets:
        try:
            network = ipaddress.ip_network(subnet.cidr)
            if ip_obj in network:
                # Get prefix length (e.g., /24, /16)
                prefix_len = network.prefixlen
                if prefix_len > smallest_prefix:
                    smallest_prefix = prefix_len
                    best_match = subnet
        except ValueError:
            continue
    
    if not best_match:
        return jsonify({"msg": f"IP {ip_addr} passt zu keinem Subnetz in der Hierarchie"}), 400
    
    # Check if IP already exists in the best matching subnet
    if IPAddress.query.filter_by(subnet_id=best_match.id, ip_address=ip_addr).first():
        return jsonify({"msg": f"IP-Adresse existiert bereits in Subnetz {best_match.name}"}), 400

    new_ip = IPAddress(
        subnet_id=best_match.id,
        ip_address=ip_addr,
        dns_name=data.get('dns_name', ''),
        architecture=data.get('architecture', ''),
        function=data.get('function', '')
    )
    db.session.add(new_ip)
    db.session.commit()
    
    return jsonify({
        "msg": "IP hinzugefügt", 
        "id": new_ip.id,
        "assigned_subnet": best_match.name,
        "assigned_cidr": best_match.cidr
    }), 201

@api_bp.route('/ips/<int:id>', methods=['PUT'])
@jwt_required()
def update_ip(id):
    ip = IPAddress.query.get_or_404(id)
    data = request.get_json()
    
    ip.dns_name = data.get('dns_name', ip.dns_name)
    ip.architecture = data.get('architecture', ip.architecture)
    ip.function = data.get('function', ip.function)
    
    db.session.commit()
    return jsonify({"msg": "IP updated"}), 200

@api_bp.route('/ips/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_ip(id):
    ip = IPAddress.query.get_or_404(id)
    db.session.delete(ip)
    db.session.commit()
    return jsonify({"msg": "IP deleted"}), 200

# --- CSV Import/Export ---
import csv
import io
from flask import make_response

@api_bp.route('/export/ips', methods=['GET'])
@jwt_required()
def export_ips():
    ips = IPAddress.query.all()
    
    # Create CSV in memory
    si = io.StringIO()
    cw = csv.writer(si)
    
    # Header
    cw.writerow(['ip_address', 'dns_name', 'architecture', 'function', 'subnet_cidr', 'subnet_name'])
    
    for ip in ips:
        subnet = Subnet.query.get(ip.subnet_id)
        cw.writerow([
            ip.ip_address,
            ip.dns_name,
            ip.architecture,
            ip.function,
            subnet.cidr if subnet else '',
            subnet.name if subnet else ''
        ])
        
    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=ipam_export.csv"
    output.headers["Content-type"] = "text/csv"
    return output

@api_bp.route('/import/ips', methods=['POST'])
@jwt_required()
def import_ips():
    if 'file' not in request.files:
        return jsonify({"msg": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400
        
    if not file.filename.endswith('.csv'):
        return jsonify({"msg": "File must be a CSV"}), 400

    try:
        stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
        csv_input = csv.DictReader(stream)
        
        success_count = 0
        errors = []
        
        for row in csv_input:
            ip_addr = row.get('ip_address')
            if not ip_addr:
                continue
                
            # Basic validation
            try:
                ip_obj = ipaddress.ip_address(ip_addr)
            except ValueError:
                errors.append(f"Invalid IP: {ip_addr}")
                continue
            
            # Find best subnet (Reuse logic from add_ip - extracted for DRY preference, but copying logic here for now to avoid major refactor risk in one go)
            # Fetch all subnets to find best match in python (simpler than complex SQL for hierarchy for now)
            all_subnets = Subnet.query.all()
            best_match = None
            smallest_prefix = -1
            
            for subnet in all_subnets:
                try:
                    network = ipaddress.ip_network(subnet.cidr)
                    if ip_obj in network:
                        if network.prefixlen > smallest_prefix:
                            smallest_prefix = network.prefixlen
                            best_match = subnet
                except ValueError:
                    continue
            
            if not best_match:
                errors.append(f"No subnet found for IP: {ip_addr}")
                continue
                
            # Check or Update
            existing_ip = IPAddress.query.filter_by(subnet_id=best_match.id, ip_address=ip_addr).first()
            
            if existing_ip:
                # Update info
                existing_ip.dns_name = row.get('dns_name', existing_ip.dns_name)
                existing_ip.architecture = row.get('architecture', existing_ip.architecture)
                existing_ip.function = row.get('function', existing_ip.function)
            else:
                # Create new
                new_ip = IPAddress(
                    subnet_id=best_match.id,
                    ip_address=ip_addr,
                    dns_name=row.get('dns_name', ''),
                    architecture=row.get('architecture', ''),
                    function=row.get('function', '')
                )
                db.session.add(new_ip)
                success_count += 1
                
        db.session.commit()
        return jsonify({
            "msg": "Import completed", 
            "success_count": success_count, 
            "errors": errors
        }), 200

    except Exception as e:
        return jsonify({"msg": str(e)}), 500
