---
name: create-ticket
description: Crée une issue GitHub structurée (Contexte / Description / Solutions proposées) sur le dépôt Larmik/WarOverlay à partir d'une description de bug ou de feature de l'overlay OBS. À utiliser quand on veut transformer une idée de bug/feature en ticket actionnable sur GitHub Issues.
arguments: [description-bug-ou-feature]
allowed-tools: Read, Grep, Glob, Bash(git log *), Bash(git diff *), Bash(gh issue *), Bash(gh label *), Bash(gh api *), Agent, AskUserQuestion
---

# Création d'une issue GitHub

Description fournie en entrée : **$0**

Ton objectif : créer **une issue GitHub** propre et actionnable sur le dépôt
`Larmik/WarOverlay`, décrivant le bug ou la feature donné(e) en entrée.

> La gestion des tickets se fait sur **GitHub Issues**.
> Le dépôt est **public** : le contenu de l'issue est visible de tous
> — pas de secret (token, id Discord réel…) dans le corps.

## Rappel : ce qu'est le projet

Overlay de stream OBS (page statique `Overlay/index.html` + `currentWarScript.js` +
`warStyle.css`, hébergée sur Firebase Hosting, site `stats-mkworld-overlay`). Il lit en
temps réel la RTDB `stats-mkworld` écrite par l'app Android **Stats MKWorld**
(`/Users/pascal/Desktop/Projets/StatsMKWorld`) : `currentWars/{rosterId}` et `tags/`.
Les feuilles de `Styles/` et les CSS personnalisés collés par les streamers dans OBS
dépendent des ids HTML de l'overlay.

## 1. Comprendre la demande

1. Si `$0` est vide, **arrête-toi** et demande à l'utilisateur la description du bug ou de la feature.
2. Détermine s'il s'agit d'un **bug**, d'une **feature** ou d'un sujet **technique** (refactoring, dette, config, doc — sans changement visible dans OBS) ; en cas de doute, demande, ou déduis-le du ton de la description.
3. **Enquête dans le code** avant d'écrire le ticket (sauf si la demande est purement organisationnelle) :
   - Pour un **bug** : localise le ou les fichiers concernés, comprends le flux (RTDB → callback `onValue` → DOM), et formule des hypothèses sur la cause racine. Cite les fichiers en `chemin:ligne`.
   - Pour une **feature** : identifie où elle s'intègrerait (HTML, script, CSS, partie « modifiable » du CSS) et les contraintes existantes.
   - **Contrat avec l'app** : si le sujet touche aux données lues, vérifie le modèle côté Stats MKWorld (`app/src/main/java/fr/harmoniamk/statsmkworld/model/firebase/*.kt`, `extension/IntegerExtension.kt`, `model/ScoringConstants.kt`, `repository/FirebaseRepository.kt`). Si la correction nécessite aussi un changement dans l'app, dis-le explicitement.
   - Pour une investigation large, délègue à un agent `Explore`.
4. Ne sur-investigue pas : l'objectif est un ticket actionnable, pas un audit complet. Quelques pistes solides valent mieux qu'une analyse exhaustive.

## 2. Rédiger le corps de l'issue

Respecte **exactement** cette structure (c'est le corps de l'issue, sans titre H1 — le titre part dans le champ titre de l'issue). Ton concis et factuel, en français.

````markdown
## 🎯 Contexte
<2 à 4 phrases : où ça se passe dans l'overlay, dans quelles conditions, et pourquoi
ça compte. Donne l'environnement utile (mode war 12p/24p, état de la war dans l'app,
style personnalisé, source OBS…).>

## 🐛 Description / Comportement attendu
<Pour un BUG : comportement observé vs comportement attendu, étapes de
reproduction si connues, fréquence (systématique / intermittent), données
concrètes (ex: rosterId, valeurs).
Pour une FEATURE : ce qu'on veut, le besoin du streamer, les critères
d'acceptation.>

## 🔍 Pistes techniques
<Optionnel mais recommandé pour un bug : fichiers et lignes suspectés
(`chemin:ligne`, y compris côté Stats MKWorld si pertinent), hypothèses de cause
racine classées de la plus probable à la moins probable. Omettre cette section pour
une feature simple.>

## ✅ Solutions proposées
<Liste numérotée de solutions concrètes. Pour chacune : ce qu'on change, où (overlay
et/ou app), et le compromis (effort / risque / portée, release de l'app nécessaire ou
non). Mets en avant la solution recommandée.>

## 📌 Notes
<Optionnel : effets de bord (styles personnalisés existants, ids HTML), points à
valider, liens, dépendances vers d'autres issues.>
````

- GitHub rend le **Markdown** : titres, listes, **gras**, `code inline`, blocs de code, et **task lists** `- [ ]` (cases cliquables). Utilise `- [ ]` pour les critères d'acceptation et les étapes de solution actionnables.
- Paragraphes courts et aérés. Les emojis de section sont volontaires (issue scannable).

## 3. Titre & labels

- **Titre de l'issue** = titre court et explicite **préfixé `[BUG]`, `[FEATURE]` ou `[TECH]`**
  (le préfixe sert au nommage de branche par `/ticket-dev`).
- **Labels de type** : `bug` (bug) ou `enhancement` (feature et technique).
- Pas d'epic, de milestone ni d'autre label : uniquement le label de type.

## 4. Livraison — créer l'issue

Crée l'issue via `gh` (le corps passe par un here-doc pour préserver le Markdown). **Toute issue est ajoutée au board `Stats MKWorld`** (board commun à l'app et à l'overlay) via `--project "Stats MKWorld"` :

```bash
gh issue create -R Larmik/WarOverlay \
  --title "[FEATURE] Titre court" \
  --body-file - \
  --project "Stats MKWorld" \
  --label enhancement <<'BODY'
## 🎯 Contexte
…corps Markdown intégral…
BODY
```

- `--project "Stats MKWorld"` est **systématique** (tout ticket).
- La nouvelle carte arrive sans **Status** (colonne « No Status » du board) : c'est normal, elle sera classée dans une colonne au démarrage.
- Après création, **affiche l'URL de l'issue** renvoyée par `gh` et confirme le numéro `#N`.
- **Ne crée aucun fichier `.md` dans le dépôt** : le ticket vit dans l'issue GitHub, pas dans un fichier versionné.
