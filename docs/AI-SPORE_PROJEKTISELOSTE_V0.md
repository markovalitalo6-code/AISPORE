# AI Spore – Projektiseloste

**Versio:** 0.1  
**Päivämäärä:** 2025-11-21  
**Laatija:** OJ + Gemini + Claude

---

## 1. Johdanto & Yhteenveto

### 1.1 Johdanto
_Tähän lyhyt kuvaus AI Spore -projektista, sen luonteesta ja kontekstista meme-token -ekosysteemissä._

### 1.2 Yhteenveto
_Tiivistetty kuvaus projektin päämääristä, keskeisistä komponenteista ja innovatiivisista piirteistä._

### 1.3 Tarkoitus
_Tämän dokumentin tarkoitus ja kohdeyleisö (OJ ja kehitystiimi)._

---

## 2. Projektin tavoite

### 2.1 Päämäärä
_Yhteisölle jatkuvan peli- ja sisältömekanismin luominen, joka lisää hypeä ja sitoutumista ennen AI Spore -tokenin varsinaista lanseerausta._

### 2.2 Keskeiset tavoitteet
- Yhteisön aktiivisuuden ja sitoutumisen kasvattaminen.  
- Positiivisen mielikuvan rakentaminen tokenista.  
- Käyttäjien palkitseminen osallistumisesta.  
- Ainutlaatuisen ja interaktiivisen käyttäjäkokemuksen tarjoaminen.

---

## 3. Projektin komponentit

### 3.1 Telegram Bot
#### 3.1.1 Toiminnot
_Kuvaus botin päätoiminnoista (esim. käyttäjien interaktio, pelimekaniikat, ilmoitukset, referral-järjestelmä)._

#### 3.1.2 Käyttöliittymä
_Miten käyttäjät ovat vuorovaikutuksessa botin kanssa._

#### 3.1.3 Keskeiset komennot/ominaisuudet
_Lista tärkeimmistä komennoista ja toiminnoista._

### 3.2 Chest Overlay
#### 3.2.1 Kuvaus
_Mikä chest overlay on ja missä sitä käytetään (esim. OBS-striimeissä)._

#### 3.2.2 Toiminnot
_Mitä visuaalisia elementtejä se esittää (animaatiot, tilastot, ilmoitukset)._

#### 3.2.3 Synkronointi
_Miten overlay synkronoituu botin ja taustajärjestelmän kanssa._

### 3.3 Päivittäiset tapahtumat
#### 3.3.1 Kuvaus
_Mitä päivittäisiä tapahtumia järjestetään (arvonnat, haasteet, tietovisat)._

#### 3.3.2 Mekaniikka
_Miten käyttäjät osallistuvat ja miten heidät palkitaan._

#### 3.3.3 Sisällön hallinta
_Miten päivittäistä sisältöä luodaan ja hallitaan._

### 3.4 Referral- & Badge-järjestelmä
#### 3.4.1 Referral-järjestelmä
_Miten käyttäjät voivat kutsua uusia jäseniä ja miten heitä palkitaan._

#### 3.4.2 Badge-järjestelmä
_Miten käyttäjät ansaitsevat ja keräävät badgeja._

#### 3.4.3 Palkitseminen
_Miten referralit ja badget vaikuttavat palkintoihin tai statukseen._

### 3.5 Yhteisöpelit & Mekaniikat
#### 3.5.1 Pelikonseptit
_Kuvaus keskeisistä yhteisöpeleistä._

#### 3.5.2 Osallistumismekanismit
_Miten käyttäjät voivat osallistua._

#### 3.5.3 Palkintojärjestelmä
_Miten voittajat ja osallistujat palkitaan._

---

## 4. Tekninen arkkitehtuuri

### 4.1 Yleiskatsaus
_Korkean tason kuvaus järjestelmän osista ja niiden suhteista._

### 4.2 Bot-komponentti
#### 4.2.1 Teknologiat
_Telegraf (Node.js), dotenv jne._

#### 4.2.2 Moduulit/Palvelut
_Botin sisäinen rakenne, komennot, event-käsittelijät, datavirrat._

### 4.3 Overlay-komponentti
#### 4.3.1 Teknologiat
_React / Vite._

#### 4.3.2 Komponentit
_Overlayn visuaaliset ja toiminnalliset osat._

#### 4.3.3 Datan synkronointi
_Miten overlay saa datan (canon.json, websocket/API tms.)._

### 4.4 Data & Canons
#### 4.4.1 Datan tallennus
_Mitä dataa tallennetaan (käyttäjädata, pelitilanne, referralit, badget)._

#### 4.4.2 Datan muoto
_JSON (canon.json, käyttäjädata)._  

#### 4.4.3 Tietokantaratkaisu
_Onko käytössä erillinen tietokanta vai tiedostopohjainen tallennus._

### 4.5 Node.js -skriptit
#### 4.5.1 Kuvaus
_Päivittäiset skriptit, smoke-testit, referral-store jne._

#### 4.5.2 Ajastus
_Miten skriptit suoritetaan (cron, PM2, tms.)._

---

## 5. Ympäristöt

### 5.1 Kehitysympäristö
_Kuvaus paikallisesta dev-ympäristöstä (Mac, Node, pnpm, jne.)._

### 5.2 Testiympäristö
_Mahdollinen erillinen testiympäristö._

### 5.3 Tuotantoympäristö
_Mihin deployataan ja miten konfiguroidaan._

---

## 6. Tiedostorakenne

### 6.1 Projektin juurihakemisto
_Yleiskuvaus kansioista (src, config, data, scripts, logs, snapshots)._

### 6.2 Keskeiset hakemistot ja tiedostot
_Tarkempi kuvaus tärkeimmistä kansioista ja tiedostoista._

### 6.3 Nimeämiskäytännöt
_Mahdolliset nimeämissäännöt._

---

## 7. Työnkulku (OJ / Claude / Gemini)

### 7.1 Nykyinen työnkulku
_Miten kehitystyö tällä hetkellä etenee._

### 7.2 Refaktorointi ja kehitys
_Miten uudet ominaisuudet kehitetään ja integroidaan._

### 7.3 Testaus
_Miten ja milloin testaus suoritetaan._

### 7.4 Dokumentointi
_Miten dokumentaatiota ylläpidetään._

### 7.5 Yhteistyö
_Miten OJ, Claude ja Gemini toimivat yhdessä._

---

## 8. Julkaisusuunnitelma

### 8.1 Ennen tokenin lanseerausta
_Välitavoitteet ja toimenpiteet ennen virallista julkaisua._

### 8.2 Tokenin lanseeraus
_Mitä tehdään lanseerauksen yhteydessä._

### 8.3 Lanseerauksen jälkeiset vaiheet
_Tulevaisuuden suunnitelmat (esim. Magic Eden -integraatio)._

---

## 9. Riskit & varmistukset

### 9.1 Tunnistetut riskit
_Tekniset, yhteisölliset ja markkinointiin liittyvät riskit._

### 9.2 Riskienhallinta
_Miten riskeihin varaudutaan._

### 9.3 Varmistukset
_Varmuuskopiot, vakaus, tietoturva._

---

## 10. Liitteet

### 10.1 canon.json – esimerkki
_Esimerkkirakenne._

### 10.2 Käyttäjädatan rakenne
_Esimerkki users.json / referrals.json -datasta._

### 10.3 Visuaaliset luonnokset
_Luonnokset overlaysta, chesteistä jne._

### 10.4 Muut linkit
_Linkit repoihin, design-resursseihin jne._
