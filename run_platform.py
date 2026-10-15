#!/usr/bin/env python3
"""
run_platform.py
CUDA Parallel Programming Platform Launcher for Module 5
Automatically serves the web platform and opens it in the default browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PORT = 8080

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        if "404" in format % args or "500" in format % args:
            sys.stderr.write(f"[{self.log_date_time_string()}] {format % args}\n")

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    port = PORT
    for attempt_port in range(8080, 8120):
        try:
            with socketserver.TCPServer(("127.0.0.1", attempt_port), QuietHandler) as test_socket:
                port = attempt_port
                break
        except OSError:
            continue

    url = f"http://localhost:{port}/index.html"
    print("=" * 70)
    print("CUDA PARALLEL PROGRAMMING // MODULE 5 MASTERCLASS PLATFORM")
    print("Based on Peter S. Pacheco & Matthew Malensek, 2nd Edition")
    print("BCS702 Syllabus: GPU Programming with CUDA")
    print("=" * 70)
    print(f"Server running at: {url}")
    print("2-Hour Interactive Session Keynote Deck Ready (20 Slides)")
    print("8 Live 60 FPS HTML5 Canvas Simulations Loaded")
    print("Virtual CUDA Sandbox with Real Deterministic Emulation Active")
    print("VTU Exam Question Bank & 10-Question Knowledge Check Ready")
    print("=" * 70)
    print("Press Ctrl+C to stop the local server.\n")

    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"Could not open browser automatically: {e}")

    try:
        with socketserver.TCPServer(("127.0.0.1", port), QuietHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Server stopped. Good luck with your Module 5 session!]")

if __name__ == "__main__":
    main()
