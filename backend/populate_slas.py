from apps.issues.models import SLA

slas = [
    {"category": "Electrical", "response_time": 2, "resolution_time": 24},
    {"category": "Plumbing", "response_time": 2, "resolution_time": 24},
    {"category": "Cleaning", "response_time": 1, "resolution_time": 12},
    {"category": "Network", "response_time": 4, "resolution_time": 48},
    {"category": "Carpentry", "response_time": 24, "resolution_time": 72},
    {"category": "Infrastructure", "response_time": 24, "resolution_time": 120},
    {"category": "General", "response_time": 24, "resolution_time": 72},
]

for sla_data in slas:
    obj, created = SLA.objects.get_or_create(category=sla_data["category"], defaults=sla_data)
    if not created:
        SLA.objects.filter(category=sla_data["category"]).update(**sla_data)
print("SLAs populated successfully.")
