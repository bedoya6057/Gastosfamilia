import psycopg2

# Database connection details
DB_REF = "uzojtvokbzqkbbgmeore"
DB_PASSWORD = "cbnmpp2344&&"
DB_NAME = "postgres"
DB_USER = f"postgres.{DB_REF}"
DB_HOST = "aws-1-us-east-1.pooler.supabase.com" 
DB_PORT = "5432"

connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

try:
    print(f"Connecting to Supabase database {DB_REF} via {DB_HOST}...")
    conn = psycopg2.connect(connection_string)
    cur = conn.cursor()
    
    # Read schema.sql
    schema_path = r"C:\Users\sodexo\Laptop Sodexo Sincronizada\OneDrive\Documentos\Sodexo\Laptop Sodexo\Documentos\Nueva carpeta\GastosCasa\schema.sql"
    with open(schema_path, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    print("Executing schema.sql...")
    cur.execute(sql)
    conn.commit()
    
    print("SUCCESS: Database schema executed and tables created.")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"ERROR: Failed to execute schema: {e}")
