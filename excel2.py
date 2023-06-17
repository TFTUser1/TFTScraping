import pandas as pd
import json
import os

# Dateinamen und Tabellennamen für jede Region
filepaths = [
    {"filepath": "playerlists/global_playerlist.json", "sheet_name": "Global"},
    {"filepath": "playerlists/euw_playerlist.json", "sheet_name": "EUW"},
    {"filepath": "playerlists/kr_playerlist.json", "sheet_name": "KR"},
    {"filepath": "playerlists/na_playerlist.json", "sheet_name": "NA"}
]

# Excel-Datei erstellen
excel_file = "playerlists/playerlists_short.xlsx"
writer = pd.ExcelWriter(excel_file, engine="xlsxwriter")

# JSON-Dateien durchlaufen und den Platz im Leaderboard hinzufügen
for entry in filepaths:
    filepath = entry["filepath"]
    sheet_name = entry["sheet_name"]
    with open(filepath, "r", encoding="utf-8") as json_file:
        data = json.load(json_file)
        entries = []
        for i, entry in enumerate(data):
            entry["leaderboardPosition"] = i + 1  # Platz im Leaderboard
            entries.append(entry)
        df = pd.DataFrame(entries)
        df.to_excel(writer, sheet_name=sheet_name, index=False)

        # Optimal width für jede Spalte setzen
        worksheet = writer.sheets[sheet_name]
        for i, column in enumerate(df.columns):
            column_width = max(df[column].astype(str).map(len).max(), len(column))
            worksheet.set_column(i, i, column_width)

# Schließen des Excel Writers
writer.close()
