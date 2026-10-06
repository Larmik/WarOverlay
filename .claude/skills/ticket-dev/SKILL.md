---
name: ticket-dev
description: Prend un ticket (numéro/URL d'issue GitHub de Larmik/WarOverlay, ou texte collé), crée une branche nommée d'après le titre, délègue les modifications de code à l'agent ticket-worker, commit / push / crée la PR vers master en liant l'issue, itère sur les retours, puis fusionne sur validation explicite. À utiliser quand on veut traiter un ticket de bout en bout.
arguments: [numero-ou-url-issue-github-ou-texte]
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash, Agent, SendMessage, AskUserQuestion, Skill
---

# Traitement d'un ticket de bout en bout

Entrée fournie : **$0**

Tu es l'**orchestrateur**. Tu pilotes un flux interactif sur plusieurs tours de
conversation. Les modifications de code sont **déléguées** à l'agent
`ticket-worker` ; toi, tu gères l'acquisition du ticket, la branche, les
échanges avec l'utilisateur et **toutes** les opérations git.

Règle d'or : **dès que `ticket-worker` a rendu la main** (première passe), tu
**commits systématiquement** (message = **nom de la branche**), tu **push**, et tu
**crées la PR si elle n'existe pas encore** (étape 5), **puis** tu attends les
retours. Chaque round de retours ré-applique des modifs via le worker et **re-commit
+ push** sur la même branche (la PR se met à jour). La validation finale de
l'utilisateur sert à **fusionner** la PR, pas à autoriser le premier commit.

(Ceci est l'**exception assumée** à la règle générale « pas de git sans demande »,
propre au flux `/ticket-dev` : l'utilisateur a explicitement demandé ce
commit/push/PR automatique après chaque passe du worker.)

**Déploiement** : fusionner sur `master` ne déploie rien. `firebase deploy --only hosting`
ne se lance **que sur demande explicite** de l'utilisateur (l'overlay est en production
dans les sources OBS des streamers).

## 1. Acquérir le ticket

Les tickets vivent sur **GitHub Issues** (dépôt `Larmik/WarOverlay`). L'entrée
peut arriver sous trois formes :

- **Numéro d'issue** (`#42` ou `42`) ou **URL d'issue GitHub** → récupère-la avec
  `gh issue view <n> -R Larmik/WarOverlay --json number,title,body,labels,milestone`.
  **Mémorise le numéro `#N`** : il servira à lier la PR à l'issue (étape 5). Si le
  numéro n'existe pas, **arrête-toi et demande**.
- **Texte brut collé** (souvent au format `create-ticket` : titre préfixé
  `[BUG]`/`[FEATURE]`/`[TECH]`, sections Contexte / Description / Solutions proposées) →
  utilise-le tel quel. Il n'y a alors pas d'issue à lier (sauf si l'utilisateur en
  fournit le numéro). Propose éventuellement de créer d'abord l'issue via
  `/create-ticket`.

Si `$0` est vide, **arrête-toi** et demande à l'utilisateur le numéro/URL de
l'issue (ou de coller le ticket). Ne continue pas sans un titre et une description
exploitables.

Si la solution retenue exige aussi un changement dans l'app **Stats MKWorld**
(contrat RTDB : `currentWars/`, `tags/`), signale-le à l'utilisateur : ce flux ne
modifie que l'overlay ; la partie app se traite par un ticket du dépôt
`Larmik/Stats-MKWorld`.

## 2. Synchroniser puis créer la branche

**Avant toute chose** : synchronise `master` et crée **toujours** ta branche à
partir de celle-ci. Ne délègue jamais à l'agent, n'ouvre jamais de branche, tant
que ce point de départ n'est pas garanti.

1. Si le working tree contient des modifications non commitées, **arrête-toi et
   demande** quoi en faire (les embarquer dans le ticket, les stasher…) — ne les perds
   jamais.
2. Synchronise le dépôt : `git fetch origin`, puis `git checkout master` et
   `git pull --ff-only`. La branche par défaut du projet est **master**. Ne crée jamais
   la branche depuis une autre branche courante : reviens explicitement sur `master`
   à jour d'abord.
3. **Condense le titre** du ticket en un nom de branche :
   - retire le préfixe `[BUG]` / `[FEATURE]` / `[TECH]` et les emojis ;
   - garde **4 à 5 mots** signifiants (les mots-clés du titre) ;
   - `snake_case`, minuscules, sans accents ni caractères spéciaux, **sans
     préfixe de type**.
   - Exemple : `[BUG] L'overlay plante quand la war en cours est supprimée`
     → `overlay_plante_war_supprimee`.
4. Crée la branche depuis un `master` à jour : `git checkout -b <nom>`.
5. Annonce à l'utilisateur le nom de branche créé.

## 3. Déléguer les modifications à l'agent `ticket-worker`

Lance l'agent `ticket-worker` (via l'outil Agent, `subagent_type: "ticket-worker"`)
avec un prompt contenant :

- le **contenu intégral du ticket** ;
- le **nom de la branche** ;
- la consigne : faire les modifications nécessaires, **ne faire aucune opération
  git** (lecture `git diff`/`git status` permise), exécuter la **relecture finale**
  de son § 4 sur son diff, puis retourner un résumé (fichiers touchés + décisions +
  résultat de la relecture).

**Conserve l'identifiant de l'agent** : les rounds de feedback suivants doivent
continuer *le même* agent via `SendMessage` (il garde le contexte du ticket et des
fichiers déjà modifiés).

Quand l'agent rend la main (première passe), passe par l'**étape 4** (contrôle
avant commit), puis **enchaîne directement sur l'étape 5** (commit = nom de branche +
push + PR si absente), **puis** relaie son résumé à l'utilisateur et **attends** ses
retours.

## 4. Contrôle avant chaque commit

Avant **chaque** commit (première passe et rounds de retours) :

1. Vérifie que le résumé du worker contient le résultat de sa relecture finale
   (§ 4 de `.claude/agents/ticket-worker.md`). S'il manque, renvoie-le via
   `SendMessage` pour qu'il l'exécute.
2. Relis toi-même `git diff master...HEAD` + `git diff` (non commité) en ciblant :
   - accès non gardé aux données RTDB (`war`, `tags`, `tracks`, `penalties` pouvant
     être `null`/absents) ;
   - champ lu non conforme au modèle de l'app (`teamOpponent` est un **tableau** de
     rosterIds, mode 24p si `teamOpponent.length > 1`) ;
   - id HTML renommé/supprimé (casse `Styles/*.css` et les CSS personnalisés des
     streamers) ;
   - `console.log` de debug, code mort ou commenté ;
   - secret/token ajouté (la config Firebase web existante est publique par nature).
3. Un écart → renvoie-le au worker (même agent) avant de commiter. Un écart
   **assumé** (hors périmètre, décision utilisateur) → signale-le à l'utilisateur et
   propose de créer une issue via `/create-ticket`.

## 5. Commit / push / PR (systématique, dès la fin du worker)

**À faire dès que le worker a rendu la main (première passe), sans attendre de
validation** :

1. `git add -A` puis commit avec pour **message le nom de la branche**. Termine le
   message par :

   ```
   Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
   ```
2. `git push -u origin <nom-de-branche>`.
3. **Crée la PR si elle n'existe pas encore** (`gh pr view <branche>` pour vérifier).
   Base = **`master`** (toujours). Titre = titre du ticket ; corps = résumé du
   changement + `Closes #N` (si issue GitHub). Termine le corps par :

   ```
   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```
4. Si le changement impacte l'installation, l'URL, la personnalisation CSS ou les
   polices : mettre à jour `README.md` (et `Styles/README.md` si besoin), puis
   re-commit + push sur la branche de la PR.
5. Affiche l'URL de la PR (et rappelle le `#N` de l'issue liée), puis **attends les
   retours** de l'utilisateur.

## 6. Boucle de retours (chaque round re-commit + push)

Tant que l'utilisateur donne des retours :

- **Continue le même agent** `ticket-worker` via `SendMessage` avec le détail des
  retours (il garde son contexte). Demande-lui de :
  1. appliquer les corrections directement ;
  2. signaler tout retour qui exprime une **préférence générale et durable** : tu
     proposeras alors à l'utilisateur de la consigner (ex. dans un `CLAUDE.md` ou une
     rule `.claude/rules/`) — rien n'est créé sans sa confirmation. Un retour
     purement spécifique à ce ticket ne génère rien ;
  3. refaire la relecture finale (§ 4 du worker) sur le nouveau diff.
- Puis **contrôle avant commit (étape 4)**, **re-commit (message = nom de branche) +
  push** sur la même branche (la PR se met à jour automatiquement), relaie le résumé
  et **attends** de nouveau.

## 7. Validation / fusion

La **validation finale** de l'utilisateur sert à **fusionner** la PR. Avant de la
proposer comme « fait », vérifier que le ticket est couvert (critères d'acceptation de
l'issue), que le rendu reste compatible avec les styles existants (`Styles/`) et que le
calcul des scores reste cohérent avec l'app (barème, 12p/24p). Lister les écarts
éventuels : tant qu'il en reste, rester en boucle de retours.

### Après fusion (obligatoire, ne jamais oublier)

1. `gh pr merge <n> --merge`, puis vérifier que l'issue `#N` est bien **fermée**
   (`Closes #N`) ; sinon `gh issue close <N> -R Larmik/WarOverlay`.
2. **Passer l'issue dans la colonne « Terminé »** du board « Stats MKWorld »
   (projet `2`, owner `Larmik`) — la fermeture ne la déplace PAS automatiquement.
   Filtrer sur le dépôt : le board contient aussi les issues de `Stats-MKWorld`, dont
   les numéros se recouvrent :
   ```bash
   ITEM=$(gh project item-list 2 --owner Larmik --limit 300 --format json \
     -q '.items[] | select(.content.number==<N> and .content.repository=="Larmik/WarOverlay") | .id')
   gh project item-edit --id "$ITEM" --project-id PVT_kwHOAi0L9s4BdjcN \
     --field-id PVTSSF_lAHOAi0L9s4BdjcNzhYELEw --single-select-option-id 5348c84d
   ```
   Vérifier ensuite que le statut lu vaut bien `Terminé`.
3. Revenir sur `master` à jour (`git checkout master && git pull --ff-only`).
4. Rappeler à l'utilisateur que le déploiement (`firebase deploy --only hosting`) reste
   à lancer s'il le souhaite.
