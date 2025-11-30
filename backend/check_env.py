from dotenv import load_dotenv
import os

load_dotenv()
db_url = os.getenv("DATABASE_URL")
if db_url:
    print("DATABASE_URL found")
else:
    print("DATABASE_URL NOT found")
