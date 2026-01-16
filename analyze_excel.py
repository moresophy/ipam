import pandas as pd
import sys

# Load the excel file
try:
    # Read entire sheet as a dataframe without header initially to see structure
    df = pd.read_excel('moresophy.xlsx', header=None)
    
    # Print first 50 rows to inspect structure
    print("First 50 rows of data:")
    for index, row in df.head(50).iterrows():
        # Clean row: replace NaN with empty string
        cleaned_row = [str(x) if not pd.isna(x) else '' for x in row]
        print(f"Row {index}: {cleaned_row}")

except Exception as e:
    print(f"Error: {e}")
