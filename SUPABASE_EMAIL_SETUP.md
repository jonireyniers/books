# Supabase Email Templates voor Bookly

## Template 1: Confirm Signup (Email Verificatie)

Kopieer deze template in Supabase Dashboard → Authentication → Email Templates → "Confirm signup":

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 40px;">
    <div style="display: inline-block; padding: 20px;">
      <h1 style="color: #155e68; font-size: 32px; margin: 0; font-weight: 600; letter-spacing: -0.5px;">Bookly</h1>
    </div>
  </div>

  <!-- Main Content -->
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px;">
    
    <h2 style="color: #155e68; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">Welkom bij Bookly!</h2>
    
    <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Bedankt voor je registratie. Je bent nu slechts één stap verwijderd van het bijhouden van je leesavonturen.
    </p>
    
    <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
      Klik op de onderstaande knop om je email adres te bevestigen:
    </p>
    
    <!-- Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background-color: #155e68; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 16px;">
        Bevestig je email adres
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Of kopieer deze link in je browser:<br>
      <span style="color: #155e68; word-break: break-all;">{{ .ConfirmationURL }}</span>
    </p>
    
  </div>
  
  <!-- Footer -->
  <div style="text-align: center; margin-top: 30px;">
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0;">
      Deze link is 24 uur geldig.
    </p>
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
      Als je deze email niet hebt aangevraagd, kun je deze veilig negeren.
    </p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Veel leesplezier!<br>
      <strong style="color: #155e68;">Het Bookly team</strong>
    </p>
  </div>
  
</div>
```

---

## Template 2: Reset Password (Wachtwoord Vergeten)

Kopieer deze template in "Reset Password":

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 40px;">
    <div style="display: inline-block; padding: 20px;">
      <h1 style="color: #155e68; font-size: 32px; margin: 0; font-weight: 600; letter-spacing: -0.5px;">Bookly</h1>
    </div>
  </div>

  <!-- Main Content -->
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px;">
    
    <h2 style="color: #155e68; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">Wachtwoord resetten</h2>
    
    <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Je hebt een verzoek ingediend om je wachtwoord te resetten voor je Bookly account.
    </p>
    
    <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
      Klik op de onderstaande knop om een nieuw wachtwoord in te stellen:
    </p>
    
    <!-- Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background-color: #155e68; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 16px;">
        Reset je wachtwoord
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Of kopieer deze link in je browser:<br>
      <span style="color: #155e68; word-break: break-all;">{{ .ConfirmationURL }}</span>
    </p>
    
  </div>
  
  <!-- Footer -->
  <div style="text-align: center; margin-top: 30px;">
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0;">
      Deze link is 1 uur geldig.
    </p>
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
      Als je dit verzoek niet hebt ingediend, kun je deze email veilig negeren.<br>
      Je wachtwoord wordt pas gewijzigd nadat je op de link hebt geklikt.
    </p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      <strong style="color: #155e68;">Het Bookly team</strong>
    </p>
  </div>
  
</div>
```

---

## Template 3: Magic Link (Passwordless Login)

Kopieer deze template in "Magic Link":

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 40px;">
    <div style="display: inline-block; padding: 20px;">
      <h1 style="color: #155e68; font-size: 32px; margin: 0; font-weight: 600; letter-spacing: -0.5px;">Bookly</h1>
    </div>
  </div>

  <!-- Main Content -->
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px;">
    
    <h2 style="color: #155e68; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">Inloggen bij Bookly</h2>
    
    <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Klik op de onderstaande knop om in te loggen op je Bookly account:
    </p>
    
    <!-- Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background-color: #155e68; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 16px;">
        Inloggen
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Of kopieer deze link in je browser:<br>
      <span style="color: #155e68; word-break: break-all;">{{ .ConfirmationURL }}</span>
    </p>
    
  </div>
  
  <!-- Footer -->
  <div style="text-align: center; margin-top: 30px;">
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0;">
      Deze link is 1 uur geldig en kan maar één keer worden gebruikt.
    </p>
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
      Als je niet hebt geprobeerd in te loggen, kun je deze email veilig negeren.
    </p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      <strong style="color: #155e68;">Het Bookly team</strong>
    </p>
  </div>
  
</div>
```

---

## Template 4: Change Email Address

Kopieer deze template in "Change Email Address":

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 40px;">
    <div style="display: inline-block; padding: 20px;">
      <h1 style="color: #155e68; font-size: 32px; margin: 0; font-weight: 600; letter-spacing: -0.5px;">Bookly</h1>
    </div>
  </div>

  <!-- Main Content -->
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px;">
    
    <h2 style="color: #155e68; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">Email adres wijzigen</h2>
    
    <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Je hebt een verzoek ingediend om je email adres te wijzigen voor je Bookly account.
    </p>
    
    <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
      Klik op de onderstaande knop om de wijziging te bevestigen:
    </p>
    
    <!-- Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background-color: #155e68; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 16px;">
        Bevestig nieuwe email
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Of kopieer deze link in je browser:<br>
      <span style="color: #155e68; word-break: break-all;">{{ .ConfirmationURL }}</span>
    </p>
    
  </div>
  
  <!-- Footer -->
  <div style="text-align: center; margin-top: 30px;">
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0;">
      Deze link is 24 uur geldig.
    </p>
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
      Als je deze wijziging niet hebt aangevraagd, neem dan contact met ons op.
    </p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      <strong style="color: #155e68;">Het Bookly team</strong>
    </p>
  </div>
  
</div>
```

---

## Installatie Instructies

1. **Open je Supabase Dashboard**
   - Ga naar https://supabase.com/dashboard
   - Selecteer je project

2. **Navigeer naar Email Templates**
   - Klik op "Authentication" in het linker menu
   - Klik op "Email Templates"

3. **Pas elke template aan**
   - Selecteer een template type (Confirm signup, Reset Password, etc.)
   - Verwijder de bestaande inhoud
   - Kopieer en plak de nieuwe template
   - Klik op "Save"

4. **Test je templates**
   - Doe een nieuwe registratie om de Confirm Signup email te testen
   - Gebruik "Wachtwoord vergeten" om de Reset Password email te testen

## Design Features

✅ **Moderne, minimalistisch design**
✅ **Bookly branding met teal kleur (#155e68)**
✅ **Mobile-responsive**
✅ **Duidelijke call-to-action buttons**
✅ **Professionele typografie**
✅ **Consistente styling met je website**

## Extra Tips

- De templates gebruiken inline CSS omdat veel email clients geen externe stylesheets ondersteunen
- Alle kleuren zijn afgestemd op je Bookly huisstijl
- De buttons zijn groot en duidelijk voor betere conversie
- Alternatieve links zijn voorzien voor gebruikers die de button niet kunnen klikken
