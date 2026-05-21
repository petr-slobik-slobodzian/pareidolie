#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Pareidolia Lab Elite Server..."
python3 -m http.server 8000 &
sleep 2
open http://localhost:8000
echo "Lab is now running at http://localhost:8000"
echo "Press Ctrl+C in this terminal to stop the server."
wait
