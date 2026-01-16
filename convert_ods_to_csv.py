import pandas as pd
import ipaddress
import csv
import sys

def convert_ods_to_csv(input_file, output_file):
    try:
        # Read ODS file
        df = pd.read_excel(input_file, engine='odf', header=None)
        
        extracted_data = []
        
        # Columns based on analysis:
        # 0: Bezeichnung (dns_name)
        # 1: Typ (architecture)
        # 2: OS (function)
        # 3: IP (ip_address)
        # 4: FQDN (description, maybe append to function?)

        # Start from row 2 (index 2), as 0 is empty and 1 is header
        for index, row in df.iloc[2:].iterrows():
            row_list = [str(x) if not pd.isna(x) else '' for x in row]
            
            name = row_list[0].strip()
            ip_val = row_list[3].strip()
            
            # Filter: only entries with a name
            if name and ip_val:
                try:
                    # Validate IP
                    ipaddress.ip_address(ip_val)
                    
                    typ = row_list[1].strip()
                    os_val = row_list[2].strip()
                    fqdn = row_list[4].strip()
                    
                    if fqdn and fqdn != '---':
                         # Append FQDN to function if it contains useful info
                         if os_val and os_val != '---':
                             os_val = f"{os_val} ({fqdn})"
                         else:
                             os_val = fqdn

                    if typ == '---': typ = ""
                    if os_val == '---': os_val = ""

                    # Map to known architectures if possible, or keep original
                    # 'virtuell' -> 'Virtual'
                    if typ.lower() == 'virtuell':
                        typ = 'Virtual'
                    
                    # Assume /24 subnet for 10.1.0.x
                    subnet_cidr = "10.1.0.0/24"

                    extracted_data.append({
                        'ip_address': ip_val,
                        'dns_name': name,
                        'architecture': typ,
                        'function': os_val,
                        'subnet_cidr': subnet_cidr,
                        'subnet_name': ''
                    })
                    
                except ValueError:
                    # Invalid IP
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
    convert_ods_to_csv('moresophy_new.ods', 'moresophy_new_import.csv')
