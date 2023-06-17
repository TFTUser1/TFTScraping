import os
import json

folder_path = r"D:\TFTScraping\playerlists"

# Liste der JSON-Dateien im angegebenen Ordner
file_list = os.listdir(folder_path)

for file_name in file_list:
    # Überprüfe, ob die Datei eine JSON-Datei ist
    if file_name.endswith(".json"):
        file_path = os.path.join(folder_path, file_name)
        
        with open(file_path, "r", encoding="utf-8") as file:
            data = json.load(file)
        
        # Behalte nur die ersten 100 Einträge
        processed_data = data[:20]
        
        with open(file_path, "w", encoding="utf-8") as output_file:
            json.dump(processed_data, output_file)
 