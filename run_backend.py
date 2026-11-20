import os
from backend.app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print("=" * 60)
    print(f"  DineFlow Restaurant Management System - Backend API")
    print(f"  Running on: http://127.0.0.1:{port}")
    print("=" * 60)
    app.run(host="0.0.0.0", port=port, debug=True)
