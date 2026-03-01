import pandas as pd
import os

path = "app/ml/upi_transactions_2024.csv"
if os.path.exists(path):
    df = pd.read_csv(path)
    print("--- RAW COLUMNS ---")
    for c in df.columns:
        print(f"'{c}' | Length: {len(c)} | Repr: {repr(c)}")
    
    # Normalize like the engine does
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    print("\n--- NORMALIZED COLUMNS ---")
    print(df.columns.tolist())
    
    if 'status' in df.columns:
        print("\n--- UNIQUE STATUS ---")
        print(df['status'].unique().tolist())
    else:
        print("\nERROR: 'status' column not found after normalization!")
    
    if 'merchant_category' in df.columns:
        print("\n--- UNIQUE CATEGORIES (First 10) ---")
        print(df['merchant_category'].unique().tolist()[:10])
    
    if 'amount' in df.columns:
        print("\n--- AMOUNT STATS ---")
        print(df['amount'].describe())
else:
    print(f"File not found: {path}")
