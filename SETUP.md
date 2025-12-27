# 🚀 Quick Start Guide

Je app is klaar! Volg deze stappen om het volledig op te zetten:

## Stap 1: Supabase Project Aanmaken

1. Ga naar https://supabase.com en maak een gratis account
2. Klik op "New Project"
3. Vul de projectnaam in (bijv. "mijn-boeken")
4. Kies een wachtwoord en regio (kies "eu-central-1" voor Europa)
5. Wacht tot het project is aangemaakt (duurt ~2 minuten)

## Stap 2: Database Setup

1. In je Supabase dashboard, ga naar **SQL Editor** (in de sidebar)
2. Klik op "New query"
3. Open het bestand `supabase-schema.sql` in je project
4. Kopieer de volledige inhoud
5. Plak het in de SQL editor in Supabase
6. Klik op **RUN** rechtsonder

✅ Je database is nu opgezet!

## Stap 3: API Credentials Koppelen

1. In Supabase, ga naar **Settings** > **API** (in de sidebar)
2. Kopieer de volgende waarden:
   - **Project URL** (bijv. `https://xxxxxxxxxxxx.supabase.co`)
   - **anon public** key (lange string onder "Project API keys")

3. Open het bestand `.env.local` in je project
4. Vervang de dummy waarden:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=je-project-url-hier
   NEXT_PUBLIC_SUPABASE_ANON_KEY=je-anon-key-hier
   ```

## Stap 4: Testen

1. Als de dev server nog draait, stop hem met `Ctrl+C` in de terminal
2. Start opnieuw: `npm run dev`
3. Open http://localhost:3000
4. Registreer een test account
5. Voeg wat boeken toe en test de functionaliteit!

## Stap 5 (Optioneel): Deployen naar Vercel

1. Push je code naar GitHub (maak eerst een .gitignore met `.env.local` erin)
2. Ga naar https://vercel.com en log in met GitHub
3. Klik "New Project" en importeer je repository
4. Voeg environment variables toe:
   - `NEXT_PUBLIC_SUPABASE_URL` = je Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = je Supabase anon key
5. Klik "Deploy"

Je app is nu live! 🎉

## Troubleshooting

**"Invalid API credentials"**: Check of je de juiste URL en key hebt gekopieerd uit Supabase

**Database errors**: Zorg dat je de SQL schema volledig hebt uitgevoerd in Supabase

**Login werkt niet**: Check of je Supabase project actief is en de auth is ingeschakeld

## Features om te testen

- ✅ Registreren en inloggen
- ✅ Boek toevoegen met verschillende statussen
- ✅ Boek bewerken en verwijderen
- ✅ Ratings en reviews toevoegen
- ✅ Tags gebruiken
- ✅ Privacy instellen (publiek/privé)
- ✅ Vrienden toevoegen (zoek op username)
- ✅ Vriendverzoeken accepteren
- ✅ Vriendenprofiel bekijken
- ✅ Dashboard statistieken

## Wat nu?

De basis MVP is klaar! Je kunt uitbreiden met:
- Open Library API integratie voor boekinformatie
- Foto uploads voor boekomslagen
- Dark mode
- Export functionaliteit
- Reading challenges

Veel plezier met je reading tracker! 📚

---

**Hulp nodig?** Check de `README.md` voor meer details.
