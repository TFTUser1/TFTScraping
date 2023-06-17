import json
import webbrowser
import os

# Pfad zum JSON-Ordner
json_folder_path = r"D:\TFTScraping\playerlists"

# Liste der JSON-Dateien
json_files = [file for file in os.listdir(json_folder_path) if file.endswith(".json")]

# Durchlaufe alle JSON-Dateien
for json_file in json_files:
    # Vollständiger Pfad zur JSON-Datei
    full_path = os.path.join(json_folder_path, json_file)

    # Lade Spielerdaten aus der JSON-Datei
    with open(full_path, 'r') as file:
        player_data = json.load(file)

    # Durchlaufe die ersten 5 Spielerdaten pro Region
    for player in player_data[:5]:
        region_code = player["regionCode"]
        player_name = player["playerName"]

        # Erstelle die URL für die Spielerseite
        url = f"https://lolchess.gg/profile/{region_code}/{player_name}"

        # Öffne die Spielerseite im Standard-Webbrowser
        webbrowser.open(url)
