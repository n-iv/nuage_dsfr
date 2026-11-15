#!/usr/bin/env python3
"""Contrôle de forme des feuilles CSS avant archive : un commentaire jamais
fermé ou une accolade orpheline font sauter des règles sans aucune erreur.
Usage : lint-css.py css/*.css ; code de sortie 1 au premier défaut."""
import re
import sys

defauts = 0
for chemin in sys.argv[1:]:
    texte = open(chemin, encoding="utf8").read()
    ligne = lambda pos: texte.count("\n", 0, pos) + 1
    # Un « /* » à l'intérieur d'un commentaire : le précédent n'a pas été fermé.
    for m in re.finditer(r"/\*(.*?)\*/", texte, flags=re.S):
        dedans = m.group(1).find("/*")
        if dedans >= 0:
            print(f"{chemin}:{ligne(m.start())}: commentaire jamais fermé (un autre s'ouvre ligne {ligne(m.start() + 2 + dedans)})")
            defauts += 1
    nu = re.sub(r"/\*.*?\*/", lambda m: re.sub(r"[^\n]", " ", m.group(0)), texte, flags=re.S)
    nu = re.sub(r'"(?:\\.|[^"\\\n])*"|\'(?:\\.|[^\'\\\n])*\'', lambda m: " " * len(m.group(0)), nu)
    if "/*" in nu:
        print(f"{chemin}:{ligne(nu.find('/*'))}: commentaire ouvert jusqu'à la fin du fichier")
        defauts += 1
    niveau = 0
    for pos, car in enumerate(nu):
        if car == "{":
            niveau += 1
        elif car == "}":
            niveau -= 1
            if niveau < 0:
                print(f"{chemin}:{ligne(pos)}: accolade fermante en trop")
                defauts += 1
                niveau = 0
    if niveau:
        print(f"{chemin}: {niveau} accolade(s) jamais fermée(s)")
        defauts += 1
sys.exit(1 if defauts else 0)
