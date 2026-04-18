import os
import django
import json

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.authentication.models import User, Worker
from apps.inventory.models import Material
from apps.issues.models import Issue

DUMPED_DATA = {
    "users": [{"email": "student@campus.edu", "username": "student", "first_name": "Rahul", "last_name": "Sharma", "role": "student", "department": ""}, {"email": "student2@campus.edu", "username": "student2", "first_name": "Priya", "last_name": "Patel", "role": "student", "department": ""}, {"email": "greeshma@unifix.edu", "username": "greeshma@unifix.edu", "first_name": "Patil", "last_name": "Greeeshma", "role": "student", "department": "CSE"}, {"email": "riteesha@unifix.edu", "username": "Riteesha", "first_name": "Riteesha", "last_name": "Kammakatla", "role": "student", "department": "CSE"}, {"email": "rajesh.kumar@system.com", "username": "rajesh.kumar", "first_name": "Rajesh", "last_name": "Kumar", "role": "supervisor", "department": "Electrical"}, {"email": "anil.sharma@system.com", "username": "anil.sharma", "first_name": "Anil", "last_name": "Sharma", "role": "supervisor", "department": "Plumbing"}, {"email": "suresh.reddy@system.com", "username": "suresh.reddy", "first_name": "Suresh", "last_name": "Reddy", "role": "supervisor", "department": "Civil"}, {"email": "praveen.naidu@system.com", "username": "praveen.naidu", "first_name": "Praveen", "last_name": "Naidu", "role": "supervisor", "department": "HVAC"}, {"email": "mahesh.gupta@system.com", "username": "mahesh.gupta", "first_name": "Mahesh", "last_name": "Gupta", "role": "supervisor", "department": "Maintenance"}, {"email": "kiran.patel@system.com", "username": "kiran.patel", "first_name": "Kiran", "last_name": "Patel", "role": "supervisor", "department": "IT Infrastructure"}], 
    "issues": [{"title": "Regarding sockets", "description": "sockets are not working", "status": "Assigned", "priority": "Medium", "category": "Electrical", "location": "Yamuna 914", "created_by__email": "riteesha@unifix.edu", "assigned_supervisor__email": None}, {"title": "regarding sockets", "description": "sockets are not working", "status": "Assigned", "priority": "Medium", "category": "Electrical", "location": "Yamuna 914", "created_by__email": "greeshma@unifix.edu", "assigned_supervisor__email": None}, {"title": "Broken Chair", "description": "All chairs are broken in classroom", "status": "Resolved", "priority": "Low", "category": "Furniture", "location": "SR block ,614", "created_by__email": "greeshma@unifix.edu", "assigned_supervisor__email": None}, {"title": "NO drinking water", "description": "Cool drinking water is not available in hostel", "status": "Assigned", "priority": "Medium", "category": "Plumbing", "location": "Godavari, 514", "created_by__email": "student@campus.edu", "assigned_supervisor__email": None}, {"title": "Regarding fan", "description": "fan isnt working", "status": "Escalated", "priority": "Low", "category": "Electrical", "location": "Yamuna,510", "created_by__email": "greeshma@unifix.edu", "assigned_supervisor__email": None}, {"title": "regarding fan", "description": "fan isnt working", "status": "Escalated", "priority": "Low", "category": "Electrical", "location": "Yamuna,510", "created_by__email": "riteesha@unifix.edu", "assigned_supervisor__email": None}, {"title": "Water leak near hostel corridor", "description": "There is a severe water leak near the 3rd floor corridor of Hostel A. The floor is very slippery and dangerous.", "status": "Escalated", "priority": "Critical", "category": "Plumbing", "location": "Hostel A, 3rd Floor", "created_by__email": "riteesha@unifix.edu", "assigned_supervisor__email": None}, {"title": "wifi not working", "description": "in hostel room wifi is not working", "status": "Assigned", "priority": "Medium", "category": "Network", "location": "Yamuna,510", "created_by__email": "riteesha@unifix.edu", "assigned_supervisor__email": None}, {"title": "wifi issue", "description": "In hostel room wifi is not working.", "status": "Assigned", "priority": "Medium", "category": "Network", "location": "Yamuna,510", "created_by__email": "greeshma@unifix.edu", "assigned_supervisor__email": None}, {"title": "regarding broken tap", "description": "theres a broken tap and water lekage", "status": "Escalated", "priority": "High", "category": "Plumbing", "location": "c block 8 th floor", "created_by__email": "riteesha@unifix.edu", "assigned_supervisor__email": None}, {"title": "regarding broken tap", "description": "theres a tap broken and water lekage", "status": "Escalated", "priority": "High", "category": "Plumbing", "location": "c block 8 th floor", "created_by__email": "greeshma@unifix.edu", "assigned_supervisor__email": None}, {"title": "Regarding Water Leakage", "description": "There's a water lekage", "status": "Escalated", "priority": "High", "category": "Plumbing", "location": "c block 8 th floor", "created_by__email": "riteesha@unifix.edu", "assigned_supervisor__email": None}, {"title": "regarding water leakage", "description": "There's a water leakage", "status": "Escalated", "priority": "High", "category": "Plumbing", "location": "c block 8 th floor", "created_by__email": "greeshma@unifix.edu", "assigned_supervisor__email": None}, {"title": "Regarding Cupboard", "description": "Cupboard lock is not working", "status": "Resolved", "priority": "Low", "category": "Carpentry", "location": "Yamuna,510", "created_by__email": "riteesha@unifix.edu", "assigned_supervisor__email": None}, {"title": "regarding Water leakage", "description": "tap water leakage in washroom", "status": "Escalated", "priority": "Medium", "category": "General", "location": "Yamuna,510", "created_by__email": "riteesha@unifix.edu", "assigned_supervisor__email": None}, {"title": "Regarding AC", "description": "AC isn't working", "status": "Escalated", "priority": "Medium", "category": "General", "location": "c block room no 718", "created_by__email": "riteesha@unifix.edu", "assigned_supervisor__email": None}, {"title": "Regarding AC", "description": "AC isn't working.", "status": "Escalated", "priority": "Medium", "category": "General", "location": "c block room no 718", "created_by__email": "greeshma@unifix.edu", "assigned_supervisor__email": None}, {"title": "AC not working in Computer Lab", "description": "The air conditioner in the computer lab has stopped working. Students are uncomfortable.", "status": "Escalated", "priority": "High", "category": "HVAC", "location": "Computer Lab, Block B", "created_by__email": "student@campus.edu", "assigned_supervisor__email": None}, {"title": "Broken chair in Cafeteria", "description": "One of the chairs near the entrance is broken and someone might fall.", "status": "Resolved", "priority": "Low", "category": "Furniture", "location": "Cafeteria", "created_by__email": "student2@campus.edu", "assigned_supervisor__email": None}, {"title": "Network down in Library", "description": "Wi-Fi is completely inaccessible in the main reading room of the library.", "status": "In Progress", "priority": "High", "category": "Network", "location": "Central Library, Main Room", "created_by__email": "student2@campus.edu", "assigned_supervisor__email": None}, {"title": "Broken fan in Room 204", "description": "The ceiling fan in Room 204 Science Block is making a loud noise and then stopping.", "status": "Assigned", "priority": "Medium", "category": "Electrical", "location": "Science Block, Room 204", "created_by__email": "student@campus.edu", "assigned_supervisor__email": None}, {"title": "Water leak near hostel corridor", "description": "There is a severe water leak near the 3rd floor corridor of Hostel A. The floor is very slippery and dangerous.", "status": "Open", "priority": "High", "category": "Plumbing", "location": "Hostel A, 3rd Floor", "created_by__email": "student@campus.edu", "assigned_supervisor__email": None}]
}

WORKERS_DATA = {
    "Electrical": [("Ravi Kumar", "Electrician", "free"), ("Sunil Yadav", "Electrician", "busy"), ("Deepak Singh", "Helper", "free")],
    "Plumbing": [("Ramesh Verma", "Plumber", "free"), ("Mukesh Yadav", "Plumber", "busy"), ("Pankaj Mishra", "Helper", "free")],
    "Civil": [("Srinivas Rao", "Mason", "busy"), ("Venkatesh", "Helper", "free"), ("Prasad", "Carpenter", "free")],
    "HVAC": [("Imran Khan", "AC Technician", "free"), ("Arif Shaikh", "Technician", "busy"), ("Salman", "Helper", "free")],
    "Maintenance": [("Ashok Kumar", "Technician", "free"), ("Manoj Singh", "Technician", "busy"), ("Dinesh", "Helper", "free")],
    "IT Infrastructure": [("Rahul Mehta", "Network Engineer", "busy"), ("Jay Shah", "Support Staff", "free"), ("Amit Patel", "Technician", "free")]
}

MATERIALS_DATA = {
    "Electrical": [("Copper Wire", 500, 350, 150), ("Switch Boards", 100, 60, 40), ("Circuit Breakers", 50, 30, 20)],
    "Plumbing": [("PVC Pipes", 200, 120, 80), ("Pipe Joints", 300, 200, 100), ("Water Taps", 80, 50, 30)],
    "Civil": [("Cement Bags", 500, 300, 200), ("Sand (tons)", 50, 30, 20), ("Bricks", 5000, 3000, 2000)],
    "HVAC": [("AC Units", 40, 25, 15), ("Copper Pipes", 150, 100, 50), ("Refrigerant Gas", 60, 40, 20)],
    "Maintenance": [("Tool Kits", 20, 12, 8), ("Lubricants", 100, 70, 30), ("Spare Parts", 200, 120, 80)],
    "IT Infrastructure": [("Routers", 30, 20, 10), ("LAN Cables", 500, 300, 200), ("Switches", 25, 15, 10)]
}

def seed():
    print("Starting Comprehensive Live Seeding...")
    
    # 1. Admin
    admin_email = "adminunifix@gmail.com"
    admin, created = User.objects.get_or_create(
        email=admin_email,
        defaults={"username": "admin", "first_name": "System", "last_name": "Admin", "role": "admin"}
    )
    admin.set_password("admin123")
    admin.role = "admin"
    admin.save()
    print("Admin account verified.")

    # 2. Users (Students, Faculty, Supervisors)
    users_dict = {}
    for u_data in DUMPED_DATA["users"]:
        user, created = User.objects.get_or_create(
            email=u_data["email"],
            defaults={
                "username": u_data["username"],
                "first_name": u_data["first_name"],
                "last_name": u_data["last_name"],
                "role": u_data["role"],
                "department": u_data["department"]
            }
        )
        if created:
            user.set_password("Password123!")
            user.save()
        users_dict[u_data["email"]] = user
    print(f"Synced {len(users_dict)} users.")

    # 3. Workers
    for dept, workers in WORKERS_DATA.items():
        # Find supervisor for this dept
        supe = User.objects.filter(role='supervisor', department=dept).first()
        for name, role, status in workers:
            Worker.objects.get_or_create(
                name=name, supervisor=supe,
                defaults={"role_type": role, "status": status, "is_active": True}
            )
    print("Workers synced.")

    # 4. Materials
    for dept, materials in MATERIALS_DATA.items():
        supe = User.objects.filter(role='supervisor', department=dept).first()
        for name, total, avail, used in materials:
            Material.objects.get_or_create(
                material_name=name, supervisor=supe,
                defaults={"total_quantity": total, "available_quantity": avail, "used_quantity": used}
            )
    print("Inventory synced.")

    # 5. Issues
    for i_data in DUMPED_DATA["issues"]:
        reporter = users_dict.get(i_data["created_by__email"])
        if not reporter: continue
        
        Issue.objects.create(
            title=i_data["title"],
            description=i_data["description"],
            status=i_data["status"],
            priority=i_data["priority"],
            category=i_data["category"],
            location=i_data["location"],
            created_by=reporter
        )
    print(f"Synced {len(DUMPED_DATA['issues'])} ticket records.")
    
    print("\n------------------------------")
    print("FULL MIGRATION SUCCESSFUL!")
    print("Your live site now matches your local laptop.")
    print("------------------------------")

if __name__ == "__main__":
    seed()
