import http.server
import os
import sys
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Ensure api directory is treated as a package
# We need to make sure 'api' is importable.
# Since dev_server.py is in root, 'import api' should work.
# However, for relative imports within api/ to work (e.g. 'from .voices import ...'),
# 'api' must be treated as a package.

# Workaround for implicit namespace package issue if __init__.py is missing:
# We can just try importing.
try:
    from api import tts
    from api import get_voices
except ImportError as e:
    # If it fails due to relative import, we might need to help it.
    print(f"Import Error: {e}")
    print("Ensure api/__init__.py exists or you are running with Python 3.3+")
    # Create __init__.py if it doesn't exist to make it a proper package
    if not os.path.exists(os.path.join('api', '__init__.py')):
        print("Creating api/__init__.py to support package imports...")
        with open(os.path.join('api', '__init__.py'), 'w') as f:
            f.write('')
        from api import tts
        from api import get_voices

class DispatcherHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path).path
        if parsed_path == '/api/get_voices':
            # Delegate to get_voices.handler
            # The handler class in get_voices.py is named 'handler'
            get_voices.handler.do_GET(self)
        else:
            self.send_error(404, "Not Found")

    def do_POST(self):
        parsed_path = urlparse(self.path).path
        if parsed_path == '/api/tts':
            # Delegate to tts.handler
            # The handler class in tts.py is named 'handler'
            tts.handler.do_POST(self)
        else:
            self.send_error(404, "Not Found")
            
    def do_OPTIONS(self):
        # Handle CORS preflight if needed, or delegate
        # Vercel functions might handle this, but for local dev we might need it.
        # Since Next.js rewrites, it's same-origin, so CORS might not be needed.
        self.send_response(200)
        self.end_headers()

def run(server_class=http.server.HTTPServer, handler_class=DispatcherHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting python dev server on port {port}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    print("Server stopped.")

if __name__ == "__main__":
    run()
