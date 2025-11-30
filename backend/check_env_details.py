import sys
import prisma
import os

print(f"Executable: {sys.executable}")
print(f"Prisma Location: {os.path.dirname(prisma.__file__)}")
print("Sys Path:")
for p in sys.path:
    print(p)
