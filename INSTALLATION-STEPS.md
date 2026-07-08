Recommended backup to use
Use: pos_backup.dump

It is the latest backup in the repo.

Step 1: Install PostgreSQL
On Windows:

Download from https://www.postgresql.org/download/windows/
Install with default settings
Take note of:
PostgreSQL version
port (usually 5432)
user postgres
password you choose
Step 2: Copy the backup file
Copy pos_backup.dump from this project folder to the other laptop.

Step 3: Create a new local database
Open PowerShell or command prompt and run:
psql -U postgres -c "CREATE DATABASE pos_db;"

If your user is not postgres, replace it accordingly.

If psql is not in PATH, use the PostgreSQL bin folder path:
"C:\Program Files\PostgreSQL\<version>\bin\psql.exe" -U postgres -c "CREATE DATABASE pos_db;"

Step 4: Restore the dump into the database
From the folder where pos_backup.dump is located:
pg_restore -U postgres -d pos_db -v pos_backup.dump

If the dump file is in a different folder, include that path.

If you see permissions or ownership errors, add:
pg_restore -U postgres -d pos_db -v --no-owner pos_backup.dump

Step 5: Configure the app on the other laptop
In the backend folder, set DATABASE_URL in your environment:

Example .env or local Windows environment:
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/pos_db

Replace:

postgres with your DB user
yourpassword with your password
pos_db with the database name if different
Step 6: Start the app
In backend:
npm install
npm run dev

If the backend uses Prisma, also run:
npx prisma generate

Notes
If you prefer a SQL file instead of .dump, use pos_backup.sql or pos_backup_fixed.sql.
For .sql restore:
psql -U postgres -d pos_db -f pos_backup.sql

If you want, I can also give you a one-line restore command that includes the exact Windows paths for your laptop.
