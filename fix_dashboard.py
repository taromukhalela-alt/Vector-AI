with open('app.py','r',encoding='utf-8') as f:
    content = f.read()

# Replace the dashboard_data function
old = '''@app.route("/api/dashboard")
def dashboard_data():
    """Dashboard live data feed."""
    payload = _generate_dashboard_payload()
    return jsonify(payload)'''

new = '''@app.route("/api/dashboard")
def dashboard_data():
    """Legacy dashboard API — disabled (redirected to notes)"""
    return jsonify({
        "stats": {},
        "charts": {"line": [], "bar": [], "gauge": 0},
        "recent_questions": [],
        "sessions": []
    })'''

if old in content:
    content = content.replace(old, new)
    with open('app.py','w',encoding='utf-8') as f:
        f.write(content)
    print('Fixed dashboard_data function')
else:
    print('Pattern not found - checking current state')
    # Show what's there
    idx = content.find('@app.route("/api/dashboard")')
    if idx >= 0:
        print('Found at index:', idx)
        print(content[idx:idx+200])
