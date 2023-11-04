# Hjemmekorps

Hjemmekorps skal inspirere til hjemmeøving ved å gjøre leksene til en del av felles prosjekter. Øve-opptak hjemmefra settes automatisk sammen til små låter som kan spilles av på neste samspill-øvelse.


## Teknisk

Hjemmekorps er et Node.js - basert prosjekt. Det bruker Sanity.io til å lagre data.

For å kjøre et lokalt test/utviklings-miljø må du gjøre følgende:

1. Sørg for at Node.js er installert og virker
1. `git clone` dette repoet
1. `npm install` eller `yarn install`
1. Legg noen hemmeligheter i `config/overrides.json` - omtrent slik

```
{
	"site": {
		"tokensecret": "local-test-secret-nonsense-to-encrypt-tokens"
	},
	"sanity": {
		"dataset": "test",
		"token": "token-you-get-from-manage.sanity.io"
	},
	"mailgun": {
		"apikey": ""
	}
}
```
1. Kjør `./prep-files.sh` for å kopiere noen JS-filer som må serveres statisk fra node_modules til korrekt plass
1. Nå skal du kunne kjøre `npm run dev` eller `yarn run dev`

## Database

Prosjektet bruker Sanity.io til det meste av data som lagres, men noe går også til en Postgres server. For å kjøre lokalt må denne settes opp og miljøvariabelen `DATABASE_URL` settes korrekt, for eksempel med `export DATABASE_URL=postgresql://localhost/hjemmekorps`. Kjør `node migrate.js` for å lage tabeller og struktur.

## Redis

Prosjektet bruker også Redis. Sørg for at Redis er installert og kjører.

## Test admin-tilgang

For å bruke admin-sidene må du lage en innloggings-lenke med å kjøre `node scripts/make-login-link.js EPOST` der EPOST er epostadressa til en admin-bruker som er opprettet under "Innhold > Admin" i Sanity. Du får opp to lenker, kopier den med `localhost:3000` og kjør `npm start dev` og gå til lenka.
