import os

folder_path = "playerlists"

# Überprüfe, ob der angegebene Pfad ein Ordner ist
if os.path.isdir(folder_path):
    # Gehe durch alle Dateien und Unterordner im Ordner
    for root, dirs, files in os.walk(folder_path, topdown=False):
        for file_name in files:
            file_path = os.path.join(root, file_name)
            # Lösche die Datei
            os.remove(file_path)
        for dir_name in dirs:
            dir_path = os.path.join(root, dir_name)
            # Lösche den Unterordner
            os.rmdir(dir_path)

    # Überprüfe erneut, ob der Ordner leer ist
    if not os.listdir(folder_path):
        print("Der Ordner ist leer.")
    else:
        print("Der Ordner enthält noch Dateien oder Unterordner und wurde nicht gelöscht.")
else:
    print("Der angegebene Pfad ist kein Ordner.")
