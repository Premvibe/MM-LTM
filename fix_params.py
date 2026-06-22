import glob, os, re

files = glob.glob("/Users/prem/Downloads/MY Downloads/Vs code/MM/MM-LTM/manzil-connect/src/pages/*.tsx")

def fix_params_def(content):
    # Find something like:
    # const params = user?.role === 'fellow' 
    #   ? `?role=fellow&email=${user.email}` 
    #   : '';
    # And replace with the program manager part
    
    # Simple regex substitution for the common single line case:
    # const params = user?.role === 'fellow' ? `?role=fellow&email=${user.email}` : '';
    p1 = r"const params = user\?\.role === 'fellow' \? `\?role=fellow&email=\$\{user\.email\}` : '';"
    repl1 = "const params = user?.role === 'fellow' ? `?role=fellow&email=${user.email}` : user?.role === 'program_manager' ? `?role=program_manager&email=${user.email}` : '';"
    
    content = re.sub(p1, repl1, content)
    
    # Multiline case in CentresPage, SessionsPage, AttendancePage, FeedbackPage, StudentsPage
    p2 = r"const params = user\?\.role === 'fellow'\s*\n\s*\? `\?role=fellow&email=\$\{user\.email\}`\s*\n\s*: '';"
    repl2 = "const params = user?.role === 'fellow' \n        ? `?role=fellow&email=${user.email}` \n        : user?.role === 'program_manager' \n          ? `?role=program_manager&email=${user.email}` \n          : '';"
    content = re.sub(p2, repl2, content)
    
    # ReportsPage (already has program_manager, let's fix it if missing fellow)
    # Actually ReportsPage only has program manager right now.
    
    return content

def fix_api_get(content):
    # Fix api.get("/assessments") -> api.get(`/assessments${params}`) etc.
    # Where params is available.
    
    # Replace exact strings:
    content = content.replace('api.get("/assessments")', 'api.get(`/assessments${params || ""}`)')
    content = content.replace('api.get("/fellows")', 'api.get(`/fellows${params || ""}`)')
    content = content.replace('api.get("/students")', 'api.get(`/students${params || ""}`)')
    content = content.replace('api.get("/centres")', 'api.get(`/centres${params || ""}`)')
    content = content.replace('api.get("/sessions")', 'api.get(`/sessions${params || ""}`)')
    content = content.replace('api.get("/quality")', 'api.get(`/quality${params || ""}`)')
    
    # For params that might be named roleParam or something else
    content = content.replace('api.get(`/assessments${params || ""}`)', 'api.get(`/assessments${typeof params !== "undefined" ? params : ""}`)')
    
    return content

for f in files:
    with open(f, 'r') as file:
        original = file.read()
    
    content = fix_params_def(original)
    
    # specific fixes
    if "AssessmentsPage.tsx" in f:
        content = content.replace('api.get("/assessments")', 'api.get(`/assessments${params}`)')
        content = content.replace('api.get("/fellows")', 'api.get(`/fellows${params}`)')
    elif "StudentsPage.tsx" in f:
        content = content.replace('api.get(`/assessments`)', 'api.get(`/assessments${params}`)')
    elif "QualityPage.tsx" in f:
        content = content.replace('api.get("/assessments")', 'api.get(`/assessments${params}`)')
        content = content.replace('api.get("/fellows")', 'api.get(`/fellows${params}`)')
        content = content.replace('api.get("/students")', 'api.get(`/students${params}`)')
    elif "AdminsPage.tsx" in f:
        pass # Admin page sees all anyway?
    elif "DashboardPage.tsx" in f:
        pass # Dashboard uses roleParams etc.
        
    if original != content:
        with open(f, 'w') as file:
            file.write(content)
        print("Updated", os.path.basename(f))

