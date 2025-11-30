import asyncio
from app.db.prisma import db

async def main():
    try:
        # Just check if the attribute exists, don't need to connect
        if hasattr(db, 'message'):
            print("SUCCESS: db.message exists")
        else:
            print("FAILURE: db.message does NOT exist")
            # List attributes to see what's there
            print("Available attributes:", dir(db))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
