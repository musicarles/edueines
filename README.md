# Edueines

Catàleg col·laboratiu d'eines digitals amb avantatges per al professorat. Cada fitxa explica què ofereix l'eina, com s'hi pot accedir i quines condicions cal complir, i no es publica mai sense revisió i verificació manual.

Aplicació web en català, responsiva i accessible, feta amb **React 19**, **TypeScript**, **Vite**, **Tailwind CSS 4**, **React Router** i **Firebase** (opcional).

---

## Funcionalitats

### Àrea pública

- Inici amb cercador, xifres del catàleg, eines destacades, novetats i categories.
- Catàleg amb cerca instantània i filtres per categoria, avantatge, nivell educatiu, estat de verificació i ordre (alfabètic, novetats, popularitat).
- Fitxa de cada eina amb descripció, utilitats educatives, condicions d'accés, registre, nivells, data de verificació, font oficial i indicador visual de verificació.
- Formulari de proposta sense compte, amb desament automàtic, validació, prevenció de duplicats i confirmació amb referència.
- Avís «Aquesta informació ha canviat» des de cada fitxa.

### Administració

- Accés restringit amb rols `superadmin`, `admin`, `editor` i `consultor`.
- Tauler amb l'estat del catàleg i les tasques pendents.
- Propostes: filtres, revisió, edició, aprovació, rebuig i fusió de duplicats.
- Eines: edició completa, publicació, verificació, arxiu i restauració.
- Categories: creació, edició, activació i ordre.
- Usuaris i permisos, invitacions i restabliment de contrasenya (mode local).
- Avisos de canvi enviats per la comunitat.
- Historial immutable de totes les accions.
- Configuració: mode de dades, importació inicial, restabliment local i exportació JSON.

### Circuit de revisió

1. Una persona envia una proposta → estat **Pendent de revisió**.
2. L'equip la revisa, pot corregir-ne les dades i marca **En revisió**.
3. Quan es comprova la font oficial, s'aprova:
   - **Aprova i publica** crea una fitxa **Publicada** amb verificació vigent.
   - **Aprova sense publicar** crea una fitxa **Verificada**.
4. Es pot **rebutjar** amb motiu o **fusionar** amb una fitxa existent.
5. Cada 6 mesos cal tornar a verificar. Si venç el termini, la fitxa passa a **Cal actualitzar** i mostra un avís; no s'amaga automàticament.
6. Les eines **No vigent** i les propostes pendents no apareixen al catàleg públic.

---

## Posada en marxa en local

Requisits: **Node 22+** i npm.

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

Obre `http://127.0.0.1:5173`.

El mode per defecte és `local`: les dades es guarden a **IndexedDB** del navegador. El catàleg inicial (12 eines i 12 categories) es carrega automàticament el primer cop.

### Accés de demostració

- Usuari: `admin`
- Contrasenya: `crp1617G`

> El mode local és només per provar l'aplicació. Les contrasenyes es desen com a hash PBKDF2, però les dades no es comparteixen entre persones ni navegadors. Per a un equip real, fes servir Firebase.

---

## Mode Firebase (producció)

### 1. Crea el projecte

1. Ves a la [consola de Firebase](https://console.firebase.google.com/) i crea un projecte.
2. Activa **Firestore Database** (mode producció).
3. Activa **Authentication** i els proveïdors:
   - **Correu electrònic/contrasenya** (per al personal).
   - **Anònim** (perquè les persones sense compte puguin enviar propostes i avisos).
4. Afegeix una aplicació web i copia'n la configuració.

### 2. Configura les variables

Crea `.env.local` (o defineix-les a GitHub Actions):

```env
VITE_DATA_MODE=firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_ADMIN_EMAIL=admin@edueines.cat
VITE_BASE_PATH=/
```

Les claus `VITE_FIREBASE_*` són públiques per disseny. La seguretat depèn de les regles de Firestore, no d'amagar-les.

### 3. Publica les regles

```bash
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

El fitxer `firestore.rules` inclou:

- lectura pública només de les eines `publicada` / `cal_actualitzar` i de les categories actives;
- creació de propostes i avisos amb sessió anònima;
- lectura i escriptura del catàleg només per al personal actiu;
- gestió de comptes i invitacions només per al superadministrador;
- historial i verificacions immutables des del client.

### 4. Crea el primer administrador

El primer compte no es pot crear des de l'aplicació perquè encara no hi ha cap administrador. Fes-ho manualment:

1. A **Authentication → Users**, crea un usuari amb correu i contrasenya.
2. Copia'n l'**UID**.
3. A **Firestore**, crea el document `admins/{UID}`:

```json
{
  "uid": "UID_DE_FIREBASE",
  "email": "admin@edueines.cat",
  "username": "admin",
  "displayName": "Administrador",
  "role": "superadmin",
  "active": true,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "lastLoginAt": null
}
```

4. Opcionalment, crea `users/{UID}` amb el mateix correu, nom i rol.
5. Inicia sessió a `/admin/entrar`.

A partir d'aquí, la resta de comptes es poden convidar o gestionar des de **Usuaris i permisos**. Recorda que el compte també ha d'existir a Firebase Authentication.

### 5. Carrega el catàleg inicial

En mode Firebase no es carrega sol. Entra a **Configuració → Importa el catàleg inicial**. Després revisa i verifica cada fitxa abans de publicar-la.

---

## Desplegament a GitHub Pages

El projecte ja inclou `.github/workflows/deploy.yml`:

1. Puja el repositori a GitHub.
2. A **Settings → Pages**, tria **GitHub Actions** com a font.
3. A **Settings → Secrets and variables → Actions**, afegeix els secrets `VITE_FIREBASE_*` i `VITE_ADMIN_EMAIL`.
4. Si vols sobreescriure el mode, crea la variable `VITE_DATA_MODE=firebase`.
5. Fes push a `main` o `master`.

El workflow:

- instal·la dependències amb `npm ci`;
- executa les proves;
- compila amb `VITE_BASE_PATH=/nom-del-repositori/`;
- publica `dist` a GitHub Pages.

Per a un domini propi o un lloc d'usuari (`usuari.github.io`), posa `VITE_BASE_PATH=/`.

La compilació genera també `dist/404.html` i `dist/.nojekyll`, de manera que les rutes de React Router funcionen en recarregar la pàgina.

---

## Estructura del projecte

```
src/
  components/        UI, layout, targetes, formularis i administració
  pages/             Pàgines públiques
  pages/admin/       Tauler, propostes, eines, categories, usuaris…
  lib/
    auth/            Sessió local (PBKDF2) i Firebase Auth
    store/           Adapters IndexedDB i Firestore amb la mateixa interfície
    catalog.ts       Filtres, ordenació, verificació i estadístiques
    workflow.ts      Aprovació, verificació, publicació, arxiu i avisos
    duplicates.ts    Prevenció de duplicats per nom i domini
    schemas.ts       Validació amb Zod
    seed-data.ts     Catàleg inicial de 12 eines
    types.ts         Model de dades
tests/               Proves unitàries de domini
firestore.rules      Regles de seguretat de Firestore
firebase.json        Configuració de Firestore, Hosting i emuladors
```

### Model de dades

Col·leccions de Firestore / magatzems d'IndexedDB:

| Col·lecció | Contingut |
| --- | --- |
| `tools` | Fitxes d'eines i estat de verificació |
| `categories` | Categories del catàleg |
| `proposals` | Propostes ciutadanes i decisions |
| `admins` | Comptes amb accés a l'administració |
| `users` | Perfils públics del personal |
| `verifications` | Historial de verificacions |
| `history` | Registre immutable de canvis |
| `reports` | Avisos de canvi |
| `invites` | Invitacions pendents |
| `locks` | Bloquejos de noms i dominis |
| `meta` | Marcadors interns |

Els adapters `src/lib/store/local.ts` i `src/lib/store/firebase.ts` implementen la mateixa interfície `Store`, de manera que la resta de l'aplicació no depèn del backend.

---

## Rols i permisos

| Permís | superadmin | admin | editor | consultor |
| --- | :---: | :---: | :---: | :---: |
| Veure eines i propostes | ✅ | ✅ | ✅ | ✅ |
| Editar eines i revisar propostes | ✅ | ✅ | ✅ | ❌ |
| Publicar, verificar i arxivar eines | ✅ | ✅ | ❌ | ❌ |
| Aprovar propostes i gestionar categories | ✅ | ✅ | ❌ | ❌ |
| Gestionar avisos | ✅ | ✅ | ✅ | ❌ |
| Veure l'historial | ✅ | ✅ | ✅ | ✅ |
| Exportar còpies | ✅ | ✅ | ❌ | ❌ |
| Gestionar usuaris i configuració | ✅ | ❌ | ❌ | ❌ |

Els permisos s'apliquen a la interfície i, en mode Firebase, també a les regles de Firestore.

---

## Scripts

```bash
npm run dev       # servidor de desenvolupament
npm run build     # comprovació TypeScript + compilació
npm run preview   # previsualitza la compilació
npm test          # proves unitàries (Vitest)
npm run test:watch
```

---

## Notes de seguretat

- Cap proposta ni fitxa es publica automàticament.
- L'aprovació i la verificació són sempre accions manuals.
- L'historial no es pot editar ni esborrar des de la interfície.
- En mode Firebase, les escriptures públiques queden limitades a crear propostes i avisos amb estat inicial.
- No incloguis secrets al repositori: les claus de Firebase són públiques, però les contrasenyes i els fitxers `.env.local` no.
- Revisa periòdicament els comptes amb rol de superadministrador i desactiva els que ja no calguin.
