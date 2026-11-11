# PokéSurvivor Wiki

Wiki de fans, non officiel, du jeu PokéSurvivor. Une seule page autonome, sans dépendance.

- `src/template.html`, `src/style.css`, `src/app.js`, `src/arceus.html` : le code du site
- `data/data.json` : les données du jeu (Pokémon, talents, attaques, objets, nouveautés…)
- `data/sprites.webp` : la feuille unique des 966 sprites (48 px, 32 colonnes)
- `fonts/` : Albert Sans et Pixelify Sans (licence OFL)
- `build.py` : assemble tout dans `dist/index.html`
- `test.py` : tests de bout en bout avec Playwright (Chromium)

```bash
python3 build.py     # régénère dist/index.html
python3 test.py      # lance les tests
```

Déploiement : `dist/index.html` suffit. Sur Netlify, déposer le dossier `dist`
ou relier le dépôt (le fichier `netlify.toml` publie `dist`).

Données et sprites : dépôt open source JPTER78/pokesurvivor (code sous licence
PolyForm Noncommercial, sprites CC BY-NC 4.0). Usage non commercial uniquement.
