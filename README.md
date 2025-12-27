# 📚 Mijn Boeken - Reading Tracker

Een moderne, rustige webapp waar je je gelezen boeken kunt bijhouden en delen met vrienden.

## ✨ Features

- **Boekenbeheer**: Voeg boeken toe die je wilt lezen, momenteel leest, of al hebt gelezen
- **Reviews & Ratings**: Geef je boeken een beoordeling (1-5 sterren) en schrijf persoonlijke notities
- **Tags**: Organiseer je boeken met vrij invoerbare tags
- **Vrienden**: Voeg vrienden toe en bekijk hun openbare boekenlijsten
- **Statistieken**: Zie je leesvoortgang, gemiddelde beoordelingen en meer
- **Privacy**: Bepaal per boek of je het openbaar of privé wilt houden

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database + Authentication)
- **Hosting**: Vercel (gratis tier)

## 🚀 Setup

### 1. Supabase Project Opzetten

1. Ga naar [supabase.com](https://supabase.com) en maak een gratis account aan
2. Maak een nieuw project aan
3. Ga naar `SQL Editor` in de Supabase dashboard
4. Kopieer de inhoud van `supabase-schema.sql` en voer deze uit
5. Ga naar `Settings > API` en kopieer:
   - `Project URL`
   - `anon public` key

### 2. Lokaal Project Configureren

1. Clone dit project
2. Installeer dependencies:
   ```bash
   npm install
   ```

3. Maak een `.env.local` file aan en vul je Supabase credentials in:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=je-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=je-anon-key
   ```

4. Start de development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### 3. Deployen naar Vercel

1. Push je code naar GitHub
2. Ga naar [vercel.com](https://vercel.com) en maak een account aan
3. Klik op "New Project" en importeer je GitHub repository
4. Voeg je environment variables toe in de Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy! 🚀

## 📖 Gebruik

1. **Registreren**: Maak een account aan met email en wachtwoord
2. **Boeken toevoegen**: Klik op "Nieuw boek" en vul de details in
3. **Status bijwerken**: Wijzig de status van je boeken naar "Wil lezen", "Aan het lezen", of "Gelezen"
4. **Vrienden toevoegen**: Zoek vrienden via hun gebruikersnaam en stuur een verzoek
5. **Vrienden bekijken**: Bekijk de openbare boekenlijsten van je vrienden

## 🎨 Design Principes

- **Minimalistisch**: Clean en rustig design zonder visuele ruis
- **Intuïtief**: Logische flow en duidelijke navigatie
- **Mobile-first**: Werkt perfect op alle apparaten
- **Focus op inhoud**: Boeken staan centraal, niet de UI

## 🔒 Privacy

- Boeken kunnen openbaar of privé worden ingesteld
- Alleen geaccepteerde vrienden kunnen je openbare boeken zien
- Alle data is veilig opgeslagen in Supabase met Row Level Security

## 📝 Database Schema

- **profiles**: Gebruikersprofielen
- **books**: Boeken met status, ratings, en reviews
- **tags**: Vrij invoerbare tags voor boeken
- **book_tags**: Many-to-many relatie tussen boeken en tags
- **friendships**: Vriendschappen met status (pending/accepted)

## 🆓 Gratis Hosting

Dit project is volledig gratis te hosten:
- **Supabase**: Free tier tot 500MB database + 50.000 gebruikers
- **Vercel**: Unlimited hobby projects

## 🔮 Mogelijke Uitbreidingen

- Boekinformatie ophalen via Open Library API
- Leesstatus tracking (voortgang percentage)
- Jaarlijkse reading challenges
- Boekenclub functies
- Export naar Goodreads/andere platforms
- Dark mode

---

Veel leesplezier! 📚✨

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
