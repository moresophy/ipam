import pandas as pd
import ipaddress
import csv
import sys

def convert_excel_to_csv(input_file, output_file):
    try:
        df = pd.read_excel(input_file, header=None)
        
        extracted_data = []
        current_subnet_cidr = ""
        current_subnet_name = ""

        # Column indices (0-based) for the 3 tables
        # Table 1: Bez=5, Typ=6, OS=7, IP=8, FQDN=9
        # Table 2: Bez=11, Typ=12, OS=13, IP=14, FQDN=15
        # Table 3: Bez=17, Typ=18, OS=19, IP=20, FQDN=21
        tables = [
            {'bez': 5, 'typ': 6, 'os': 7, 'ip': 8, 'fqdn': 9},
            {'bez': 11, 'typ': 12, 'os': 13, 'ip': 14, 'fqdn': 15},
            {'bez': 17, 'typ': 18, 'os': 19, 'ip': 20, 'fqdn': 21}
        ]

        for index, row in df.iterrows():
            # Check for Subnet Info (simplistic approach based on observed row 10 & 13)
            # Row 10 col 1 is 'NetzID:', col 2 is ID. Row 13 col 1 is 'CIDR:', col 2 is '/24'.
            # We can just look for "NetzID:" string in the row
            row_list = [str(x) if not pd.isna(x) else '' for x in row]
            
            # Try to find NetzID
            for i, cell in enumerate(row_list):
                if isinstance(cell, str) and 'NetzID:' in cell:
                    # Next cell might be the ID
                    if i + 1 < len(row_list):
                        net_id = row_list[i+1].strip()
                        # Verify formatting? assume valid for now.
                        # Look for CIDR in subsequent rows? Or just assume /24 or look for it?
                        # In the sample, CIDR: /24 is 3 rows down.
                        # For simplicity, if we see 'NetzID:', we can try to grab the /24 from the dataframe if we know the offset, 
                        # or just search locally. 
                        # Let's try to look ahead in the dataframe for "CIDR:" in the same column
                        try:
                            cidr_suffix = "/24" # Default
                            # Look in next 5 rows for CIDR
                            for offset in range(1, 6):
                                if index + offset < len(df):
                                    check_row = df.iloc[index + offset]
                                    if check_row[i] == 'CIDR:':
                                        cidr_suffix = str(check_row[i+1]).strip()
                                        break
                            current_subnet_cidr = f"{net_id}{cidr_suffix}"
                        except:
                            pass
            
            # Iterate through the 3 potential tables in this row
            for t in tables:
                if t['ip'] < len(row):
                    ip_val = str(row[t['ip']]).strip()
                    
                    # Clean up IP (remove separate lines if any, e.g. "(womöglich...)")
                    ip_val = ip_val.split('\n')[0].split('(')[0].strip()
                    
                    if ip_val and ip_val.lower() != 'ip':
                        try:
                            # Validate IP
                            ipaddress.ip_address(ip_val)
                            
                            # It's a valid IP
                            bez = str(row[t['bez']]).strip() if t['bez'] < len(row) else ""
                            typ = str(row[t['typ']]).strip() if t['typ'] < len(row) else ""
                            os_val = str(row[t['os']]).strip() if t['os'] < len(row) else ""
                            
                            # Filter out placeholders
                            if bez == 'nan': bez = ""
                            if typ == 'nan': typ = ""
                            if os_val == 'nan': os_val = ""
                            if os_val == '---': os_val = ""
                            
                            extracted_data.append({
                                'ip_address': ip_val,
                                'dns_name': bez,
                                'architecture': typ,
                                'function': os_val,
                                'subnet_cidr': current_subnet_cidr,
                                'subnet_name': ''
                            })
                        except ValueError:
                            # Not an IP
                            pass

        # Write to CSV
        with open(output_file, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['ip_address', 'dns_name', 'architecture', 'function', 'subnet_cidr', 'subnet_name'])
            writer.writeheader()
            writer.writerows(extracted_data)
            
        print(f"Successfully converted {len(extracted_data)} rows to {output_file}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    convert_excel_to_csv('moresophy.xlsx', 'moresophy_import.csv')
