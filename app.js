// ═══════════════════════════════════════════════════════════════
// APP.JS — Champion App Main Logic
// ═══════════════════════════════════════════════════════════════

// ── SOUND ENGINE ───────────────────────────────────────────────
const SFX = (() => {
  let ctx = null;
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }
  function play(freq, type, dur, vol=0.18, delay=0) {
    try {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0, c.currentTime + delay);
      g.gain.linearRampToValueAtTime(vol, c.currentTime + delay + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
      o.start(c.currentTime + delay);
      o.stop(c.currentTime + delay + dur);
    } catch(e) {}
  }
  return {
    habit() {
      play(523, 'sine', 0.18, 0.15);
      play(784, 'sine', 0.22, 0.10, 0.05);
      play(1047,'sine', 0.30, 0.08, 0.12);
    },
    quest() {
      play(392, 'triangle', 0.12, 0.12);
      play(523, 'triangle', 0.12, 0.12, 0.08);
      play(659, 'triangle', 0.12, 0.12, 0.16);
      play(784, 'sine',     0.22, 0.14, 0.26);
    },
    goal() {
      [523,659,784,659,1047].forEach((f,i) => play(f,'sine',0.22,0.12,i*0.08));
    },
    tap() { play(880, 'sine', 0.06, 0.06); },
    perfect() {
      [523,659,784,659,1047,1319].forEach((f,i) => play(f,'sine',0.20,0.10,i*0.09));
    }
  };
})();

// ── CONSTANTS ──────────────────────────────────────────────────
const DAYS_PL    = ["Niedziela","Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota"];
const DAYS_SHORT = ["Nd","Pn","Wt","Śr","Cz","Pt","Sb"];
const MONTHS_PL  = ["stycznia","lutego","marca","kwietnia","maja","czerwca","lipca","sierpnia","września","października","listopada","grudnia"];

const HABITS = [
  {id:"water",    emoji:"💧", label:"Szklanka wody",            desc:"500ml po przebudzeniu",                                  days:[0,1,2,3,4,5,6], xp:10, color:"#00ffcc"},
  {id:"reading",  emoji:"📖", label:"Czytanie książki",          desc:"1 rozdział",                                             days:[0,1,2,3,4,5,6], xp:15, color:"#4488ff"},
  {id:"lang",     emoji:"🌍", label:"Nauka języka obcego",       desc:"20 minut dziennie",                                      days:[0,1,2,3,4,5,6], xp:20, color:"#9b59ff"},
  {id:"plan",     emoji:"📝", label:"Wieczorne planowanie",       desc:"3 priorytety na następny dzień",                         days:[0,1,2,3,4,5,6], xp:15, color:"#c8ff00"},
  {id:"gratitude",emoji:"✨", label:"Praktyka wdzięczności",      desc:"5 rzeczy za które jestem wdzięczny + 2 zwycięstwa dnia", days:[0,1,2,3,4,5,6], xp:15, color:"#ffcc00"},
  {id:"money",    emoji:"💰", label:"Zapisanie wydatków",         desc:"Zapisuj po każdej zapłacie",                             days:[0,1,2,3,4,5,6], xp:10, color:"#ffcc00"},
  {id:"noscreen", emoji:"🚫", label:"Bez scrollowania",           desc:"Nie wyłączaj blokady",                                   days:[0,1,2,3,4,5,6], xp:25, color:"#ff3d5a"},
  {id:"ai",       emoji:"🤖", label:"Nauka AI / Technologii",     desc:"30 min · Pn, Pt, Sob",                                   days:[1,5,6],         xp:20, color:"#00ffcc"},
  {id:"finance",  emoji:"📊", label:"Finanse i Biznes",           desc:"30 min · Czw, Sob",                                      days:[4,6],           xp:20, color:"#ffcc00"},
  {id:"cooking",  emoji:"🍳", label:"Gotowanie posiłku",          desc:"Piątek · Niedziela",                                     days:[5,0],           xp:15, color:"#ff7f50"},
  {id:"review",   emoji:"🔍", label:"Przegląd tygodnia",          desc:"Tylko Niedziela",                                        days:[0],             xp:30, color:"#9b59ff"},
];

// ── MICRO QUESTS (100, spersonalizowane) ───────────────────────
const ALL_QUESTS = [
  // ── ODKRYWANIE LUDZI I BIOGRAFII ──
  {id:"q1",  label:"Zbadaj biografię osoby którą podziwiasz — znajdź 3 rzeczy których nie wiedziałeś", xp:20, win:"Biografie to skrócone podręczniki życia. Właśnie przeżyłeś czyjeś doświadczenia w 30 minut."},
  {id:"q2",  label:"Dowiedz się skąd pochodzi założyciel Twojej ulubionej firmy i jak zaczynał", xp:20, win:"Każde imperium zaczynało się w garażu lub sypialni. Teraz wiesz od czego."},
  {id:"q3",  label:"Znajdź wywiad z kimś kogo podziwiasz i zapisz 3 rzeczy których Cię nauczył", xp:25, win:"Wywiad to mentoring za darmo. Właśnie z niego skorzystałeś."},
  {id:"q4",  label:"Przeczytaj o dzieciństwie jednej wybitnej osoby — jak wyglądało ich życie zanim stali się sławni", xp:20, win:"Nikt nie rodził się na szczycie. To krzepiące i motywujące jednocześnie."},
  {id:"q5",  label:"Dowiedz się kto jest najbogatszym człowiekiem w Polsce i co zbudował", xp:15, win:"Znajomość lokalnych historii sukcesu daje bardziej realistyczny wzorzec niż Elon Musk."},
  {id:"q6",  label:"Zbadaj historię życia kogoś kto zaczynał od zera i zbudował coś wielkiego", xp:25, win:"Zero do bohatera to nie mit — to powtarzający się wzorzec w historii."},
  {id:"q7",  label:"Przeczytaj o błędzie który popełnił ktoś sławny i jak sobie z nim poradził", xp:20, win:"Odporność psychiczna wielkich ludzi to ich prawdziwy sekret. Właśnie go poznajesz."},
  {id:"q8",  label:"Znajdź osobę która mówi Twoim językiem obcym jako ojczystym i dowiedz się czegoś o jej życiu", xp:20, win:"Język to okno na konkretnego człowieka, nie tylko na kraj."},

  // ── UPADKI FIRM I LEKCJE BIZNESOWE ──
  {id:"q9",  label:"Zbadaj dlaczego Nokia straciła rynek telefonów — co poszło nie tak?", xp:25, win:"Nokia miała wszystko i straciła wszystko przez arogancję. Lekcja warta miliardy."},
  {id:"q10", label:"Dowiedz się dlaczego Blockbuster odrzucił ofertę kupna Netflixa za 50 mln dolarów", xp:25, win:"Blockbuster mógł być Netflixem. Nie był. Wiesz już dlaczego branże umierają."},
  {id:"q11", label:"Zbadaj upadek Kodaka — firmy która wynalazła aparat cyfrowy, ale go ukryła", xp:25, win:"Kodak bał się własnego wynalazku. Innowacja wewnątrz firmy bywa trudniejsza niż z zewnątrz."},
  {id:"q12", label:"Przeczytaj o upadku Enronu — największym oszustwie korporacyjnym w historii USA", xp:30, win:"Enron to lekcja o tym jak kultura firmy może stać się bronią masowego rażenia."},
  {id:"q13", label:"Dowiedz się dlaczego MySpace przegrał z Facebookiem mimo że był pierwszy", xp:20, win:"Bycie pierwszym nie wystarczy. Liczy się kto słucha użytkowników. Facebook słuchał."},
  {id:"q14", label:"Zbadaj historię upadku jednej polskiej firmy którą kiedyś znałeś", xp:20, win:"Lokalne przykłady uczą więcej niż case studies z Harvardu. Masz teraz własny."},
  {id:"q15", label:"Dowiedz się czym był kryzys finansowy 2008 roku i kto na nim zarobił", xp:30, win:"2008 zmienił świat. Kto rozumie co się stało, rozumie jak działa naprawdę kapitalizm."},
  {id:"q16", label:"Zbadaj dlaczego Yahoo odrzuciło ofertę kupna od Microsoftu za 44 miliardy dolarów", xp:25, win:"44 miliardy odrzucone. Yahoo warte dziś ułamek. Decyzje mają konsekwencje dekadami."},

  // ── KULTURA I JĘZYK OBCY ──
  {id:"q17", label:"Dowiedz się o 3 zupełnie różnych tradycjach z kraju którego języka się uczysz", xp:20, win:"Tradycje to skompresowana historia narodu. Teraz rozumiesz więcej niż słowa."},
  {id:"q18", label:"Zbadaj co jest absolutnie kultowe w kulturze popularnej kraju Twojego języka obcego", xp:15, win:"Kultura popularna to najszybszy klucz do serca każdego języka."},
  {id:"q19", label:"Dowiedz się jak wygląda typowy dzień licealisty w kraju którego języka się uczysz", xp:20, win:"Codzienność innych kultur obala stereotypy i otwiera głowę."},
  {id:"q20", label:"Znajdź 5 słów w Twoim języku obcym które nie mają odpowiednika po polsku", xp:25, win:"Każde takie słowo to inny sposób myślenia o rzeczywistości. Język kształtuje umysł."},
  {id:"q21", label:"Przeczytaj o historii kraju którego języka się uczysz — 1 ważne wydarzenie którego nie znałeś", xp:20, win:"Historia narodu to klucz do zrozumienia dlaczego ludzie tam są jacy są."},
  {id:"q22", label:"Dowiedz się jak działa system podatkowy lub emerytalny w kraju Twojego języka obcego", xp:20, win:"Finanse publiczne różnych krajów to okno na ich wartości i priorytety."},
  {id:"q23", label:"Zbadaj co jedzą na śniadanie w kraju którego języka się uczysz i dlaczego", xp:15, win:"Jedzenie to najgłębsza kultura. Dowiedziałeś się czegoś czego nie ma w podręczniku."},
  {id:"q24", label:"Znajdź muzyka lub artystę z kraju Twojego języka obcego i dowiedz się o nim więcej", xp:15, win:"Muzyka łączy język z emocjami. To najszybsza droga do prawdziwej płynności."},

  // ── TECHNOLOGIA OD WEWNĄTRZ ──
  {id:"q25", label:"Dowiedz się jak naprawdę działa algorytm TikToka — co decyduje co widzisz", xp:25, win:"Rozumiesz maszynę która Cię wciągała. Teraz jesteś przed nią, nie za nią."},
  {id:"q26", label:"Zbadaj jak Google zarabia pieniądze — jaki jest ich prawdziwy produkt", xp:20, win:"Jeśli coś jest darmowe, produktem jesteś Ty. Teraz wiesz co to znaczy w praktyce."},
  {id:"q27", label:"Dowiedz się czym jest open source i znajdź 3 narzędzia których używasz a nie wiedziałeś że są open source", xp:20, win:"Open source to jeden z najpiękniejszych wynalazków w historii technologii."},
  {id:"q28", label:"Zbadaj jak powstał internet — od ARPANET do dzisiaj w 10 minutach", xp:20, win:"Internet zaczynał jako projekt militarny. Historia technologii jest zawsze zaskakująca."},
  {id:"q29", label:"Dowiedz się co to jest Moore's Law i dlaczego przestaje działać", xp:20, win:"Moore's Law napędzał 50 lat postępu. To co teraz będzie je zastępować — to Twoja era."},
  {id:"q30", label:"Zbadaj jak działa GPS — satelity, sygnały, dokładność", xp:15, win:"Używasz GPS kilkadziesiąt razy dziennie. Teraz wiesz jak to działa od środka."},
  {id:"q31", label:"Dowiedz się czym jest blockchain i znajdź 1 zastosowanie inne niż kryptowaluty", xp:20, win:"Blockchain to technologia szukająca problemu. Właśnie znalazłeś jeden."},
  {id:"q32", label:"Zbadaj historię pierwszego iPhone'a — jak Steve Jobs zmienił branżę w 1 prezentacji", xp:20, win:"Prezentacja z 2007 roku to studium storytellingu i wizji. Obejrzyj ją kiedyś."},
  {id:"q33", label:"Dowiedz się czym jest quantum computing i co zmieni w ciągu 20 lat", xp:25, win:"Komputery kwantowe złamią dzisiejsze szyfrowanie. To nie sci-fi — to plan na 2030."},
  {id:"q34", label:"Napisz skrypt w Pythonie który robi cokolwiek — choćby wyświetla Twoje imię 10 razy", xp:35, win:"Pierwsza linijka kodu to granica której większość ludzi nie przekroczy. Ty ją właśnie przekroczyłeś."},
  {id:"q35", label:"Zbadaj jak działa szyfrowanie end-to-end w WhatsApp — prościej niż myślisz", xp:20, win:"Twoje wiadomości są szyfrowane matematyką której rozłożenie zajęłoby miliardy lat. Nieźle."},

  // ── FINANSE I PSYCHOLOGIA PIENIĘDZY ──
  {id:"q36", label:"Dowiedz się czym jest 'lifestyle inflation' i jak niszczy bogactwo nawet wysokich zarobków", xp:20, win:"Zarabiasz więcej, wydajesz więcej. To pułapka w której tkwi 90% ludzi. Ty ją widzisz."},
  {id:"q37", label:"Zbadaj historię Warrena Buffetta — jak zaczął inwestować i ile miał lat", xp:20, win:"Buffett kupił pierwszą akcję w wieku 11 lat. Twój czas nie minął. Właśnie się zaczął."},
  {id:"q38", label:"Dowiedz się co to jest 'efekt IKEA' — dlaczego cenimy bardziej to co sami zrobiliśmy", xp:15, win:"Psychologia wartości jest wszędzie. Teraz widzisz ją w tym co kupujesz i jak się czujesz."},
  {id:"q39", label:"Zbadaj jak działa marketing strachu i pilności — FOMO, countdown timers, 'ostatnie sztuki'", xp:20, win:"Widzisz teraz manipulacje których wcześniej nie dostrzegałeś. To immunitet na wydawanie."},
  {id:"q40", label:"Dowiedz się czym jest 'opportunity cost' — ukryty koszt każdej decyzji finansowej", xp:20, win:"Każda złotówka którą wydajesz to złotówka która nie pracuje. Teraz to czujesz."},
  {id:"q41", label:"Zbadaj dlaczego lotto to podatek na nieumiejętność liczenia prawdopodobieństwa", xp:15, win:"Szansa wygranej w Lotto to 1 do 14 milionów. Teraz rozumiesz jak działa nadzieja na skróty."},
  {id:"q42", label:"Dowiedz się co to jest 'dollar cost averaging' i jak stosuje to zwykły inwestor", xp:25, win:"Regularność pokonuje timing. To jedna z najważniejszych strategii inwestycyjnych. Prosta jak cegła."},
  {id:"q43", label:"Zbadaj jak Amazon budował przez lata bez zysku i dlaczego Bezos miał rację", xp:25, win:"Amazon był bez zysku przez dekadę. Długoterminowe myślenie to rzadka supermoc."},
  {id:"q44", label:"Dowiedz się co to jest 'sunk cost fallacy' i znajdź przykład z własnego życia", xp:20, win:"Wrzucasz pieniądze w coś złego bo już tyle włożyłeś? Właśnie to przestaniesz robić."},
  {id:"q45", label:"Zbadaj historię kryptowaluty Bitcoin — kto ją stworzył i dlaczego do dziś nie wiemy", xp:25, win:"Satoshi Nakamoto to największa tajemnica technologiczna XXI wieku. I jeden z najbogatszych."},

  // ── PSYCHOLOGIA I DZIAŁANIE UMYSŁU ──
  {id:"q46", label:"Dowiedz się czym jest 'growth mindset' wg Carol Dweck i jak zmienia wyniki w nauce", xp:20, win:"Jedno badanie zmieniło podejście do edukacji na świecie. Teraz masz je w głowie."},
  {id:"q47", label:"Zbadaj czym jest 'deep work' wg Cal Newporta — i dlaczego jest rzadkością", xp:20, win:"Głęboka praca to supermoc epoki rozproszenia. Rozumiesz teraz dlaczego tak trudno Ci się skupić."},
  {id:"q48", label:"Dowiedz się co mówi nauka o prokrastynacji — to nie lenistwo, to regulacja emocji", xp:20, win:"Prokrastynacja to unikanie dyskomfortu, nie zadania. Właśnie dostałeś klucz do walki z nią."},
  {id:"q49", label:"Zbadaj jak działa dopamina i dlaczego powiadomienia są zaprojektowane żeby Cię uzależnić", xp:25, win:"Twój mózg produkuje dopaminę w oczekiwaniu nagrody, nie przy jej otrzymaniu. To zmienia wszystko."},
  {id:"q50", label:"Dowiedz się co to jest 'confirmation bias' — dlaczego szukamy informacji które potwierdzają to co już wiemy", xp:20, win:"Każdy ma tę słabość. Kto ją zna, może ją kontrolować. Teraz Ty możesz."},
  {id:"q51", label:"Zbadaj czym jest efekt placebo i jak silny jest naprawdę — przykłady z badań", xp:20, win:"Przekonanie zmienia biologię. To nie metafora — to udokumentowana medycyna."},
  {id:"q52", label:"Dowiedz się o eksperymencie Stanford ze Stanfordzkimi Więzieniami i co mówi o ludzkim zachowaniu", xp:25, win:"Władza zmienia ludzi szybciej niż myślimy. To jedna z najbardziej niepokojących lekcji psychologii."},
  {id:"q53", label:"Zbadaj czym jest 'imposter syndrome' — i sprawdź czy go masz", xp:20, win:"70% ludzi sukcesu odczuwa imposter syndrome. Nie jesteś sam. I to nie jest prawda o Tobie."},
  {id:"q54", label:"Dowiedz się co to jest 'second-order thinking' — jak myślą inwestorzy i strategowie", xp:25, win:"Większość myśli: co się stanie. Nieliczni: co się stanie po tym co się stanie. Teraz Ty też."},

  // ── HISTORIA KTÓRA ZMIENIA PERSPEKTYWĘ ──
  {id:"q55", label:"Zbadaj historię powstania internetu — jak 3 zdania wysłane w 1969 roku zmieniły świat", xp:20, win:"Pierwszy message wysłany przez internet brzmiał 'LO' bo system się zawiesił po 2 literach. Tyle wystarczyło."},
  {id:"q56", label:"Dowiedz się czym była rewolucja przemysłowa i jak zmieniła codzienne życie zwykłych ludzi", xp:20, win:"Żyjemy w erze porównywalnej do rewolucji przemysłowej. To co robimy teraz będą studiować za 100 lat."},
  {id:"q57", label:"Zbadaj historię szczepionek — kto je wynalazł i jak uratowały miliardy ludzi", xp:20, win:"Edward Jenner wstrzyknął 8-latkowi chorobę krowią w 1796. Brak etyki komitetu. I zmienił historię."},
  {id:"q58", label:"Dowiedz się co to był Projekt Manhattan i jakie miał etyczne konsekwencje", xp:25, win:"Naukowcy stworzyli broń i przestraszyli się jej skutków. To najważniejszy dylemat etyczny nauki."},
  {id:"q59", label:"Zbadaj jak Japonia odbudowała się po II Wojnie Światowej i stała się drugą gospodarką świata", xp:25, win:"Z ruin do potęgi w 30 lat. Japonia pokazała że kultura i determinacja zmieniają wszystko."},
  {id:"q60", label:"Dowiedz się o upadku Związku Radzieckiego — co się naprawdę stało i dlaczego tak szybko", xp:25, win:"Imperium rozpadło się w ciągu miesięcy. Systemy wydające się wieczne mogą zniknąć z dnia na dzień."},
  {id:"q61", label:"Zbadaj historię Nikoli Tesli — geniusz który umarł w biedzie mimo że zmienił świat", xp:20, win:"Tesla vs Edison to historia wizji vs biznesu. Geniusz bez strategii finansowej przegrywa."},
  {id:"q62", label:"Dowiedz się jak powstał YouTube — od garażu do 2 miliardów użytkowników w 15 lat", xp:20, win:"YouTube startował jako portal randkowy. Pomysły zmieniają się pod wpływem użytkowników. Zawsze."},

  // ── ŚWIAT I GLOBALNE PERSPEKTYWY ──
  {id:"q63", label:"Zbadaj kraj z innego kontynentu którego prawie nic nie wiesz — 3 zaskakujące fakty", xp:15, win:"Świat jest większy i ciekawszy niż go sobie wyobrażamy. Właśnie się o tym przekonałeś."},
  {id:"q64", label:"Dowiedz się jak wygląda system edukacji w Finlandii i dlaczego jest uważany za najlepszy", xp:20, win:"Finlandia nie ma prac domowych ani rankingów. I ma najlepiej wykształconych ludzi. Zastanów się."},
  {id:"q65", label:"Zbadaj czym jest Singapore i jak zostało jednym z najbogatszych krajów świata w 50 lat", xp:25, win:"Singapur nie miał zasobów, wody ani ziemi. Miał tylko jedną rzecz: właściwą politykę i determinację."},
  {id:"q66", label:"Dowiedz się jak działa gospodarka Niemiec — dlaczego Mittelstand to sekret ich sukcesu", xp:20, win:"Gospodarka Niemiec opiera się na małych firmach rodzinnych, nie gigantach. To zaskakuje wszystkich."},
  {id:"q67", label:"Zbadaj co to jest 'brain drain' i dlaczego Polska traci talenty do Zachodu", xp:20, win:"Emigracja mózgów to problem który dotyczy Ciebie bezpośrednio — jako potencjalnego talentu lub pracodawcy."},
  {id:"q68", label:"Dowiedz się jak Chiny zbudowały gospodarkę od jednej z najuboższych do drugiej na świecie w 40 lat", xp:25, win:"Najszybszy wzrost w historii ludzkości. Niezależnie od polityki — to jest studium z ekonomii."},

  // ── KREATYWNOŚĆ I PROJEKTY ──
  {id:"q69", label:"Wymyśl produkt lub usługę która rozwiązuje problem który sam widzisz każdego dnia", xp:25, win:"Najlepsze startupy rozwiązują problemy założycieli. Właśnie siebie sprawdziłeś jako founder."},
  {id:"q70", label:"Zbadaj jak Airbnb i Uber zbudowały biznesy bez własnych aktywów — model platform", xp:25, win:"Airbnb nie ma hoteli, Uber nie ma samochodów. Platforma to najpotężniejszy model biznesowy XXI w."},
  {id:"q71", label:"Stwórz swój 'media diet' — oceń skąd czerpiesz informacje i czy to dobre źródła", xp:20, win:"Garbage in, garbage out. Jakość informacji które konsumujesz kształtuje jakość Twojego myślenia."},
  {id:"q72", label:"Nagraj 60-sekundowe video wyjaśniające coś czego się ostatnio nauczyłeś", xp:25, win:"Feynman mówił: jeśli nie możesz wyjaśnić prosto, nie rozumiesz. Właśnie to sprawdziłeś."},
  {id:"q73", label:"Napisz 1-stronicowe streszczenie ostatniej książki którą czytałeś własnymi słowami", xp:20, win:"Streszczenie własnymi słowami to najtwardszy test rozumienia. Zdałeś go."},
  {id:"q74", label:"Zbadaj jak Pixar tworzy filmy — ich proces kreatywny i kultura 'braintrust'", xp:20, win:"Pixar stworzył kulturę gdzie każdy może krytykować każdego. I dzięki temu robi arcydzieła."},
  {id:"q75", label:"Napisz list do założyciela firmy lub twórcy treści których śledzisz — nawet jeśli go nie wyślesz", xp:20, win:"Pisanie listu wymaga konkretności. Właśnie odkryłeś co naprawdę cenisz w tej osobie."},

  // ── FILOZOFIA I ŻYCIE ──
  {id:"q76", label:"Dowiedz się czym jest stoicyzm i znajdź 1 zasadę którą możesz zastosować dziś", xp:20, win:"Stoicyzm przetrwał 2000 lat bo działa. Marcus Aurelius rządził imperium tymi zasadami."},
  {id:"q77", label:"Zbadaj czym jest 'memento mori' — jak świadomość śmierci zmienia podejście do życia", xp:25, win:"Starożytni Rzymianie mieli sługę który szeptał 'pamiętaj że umrzesz' w czasie triumfów. Dobry pomysł."},
  {id:"q78", label:"Dowiedz się o koncepcji ikigai — japońskim połączeniu pasji, misji, zawodu i powołania", xp:20, win:"Ikigai to odpowiedź na pytanie 'po co wstaję rano'. Wiesz już gdzie szukać swojego."},
  {id:"q79", label:"Zbadaj czym jest 'via negativa' — jak usuwanie złego jest często ważniejsze niż dodawanie dobrego", xp:20, win:"Zamiast dodawać nawyki — usuń co Ci przeszkadza. To prostsze i skuteczniejsze."},
  {id:"q80", label:"Dowiedz się o koncepcji 'skin in the game' Nassima Taleba — kto ryzykuje własną skórą?", xp:25, win:"Kto nie ryzykuje własnym, nie powinien decydować o cudzym. Zasada która zmienia jak oceniasz rady."},
  {id:"q81", label:"Zbadaj czym jest 'inversion thinking' — rozwiązywanie problemów od końca, jak Munger", xp:20, win:"Charlie Munger mówił: powiedz mi gdzie umrę, a tam nie pójdę. Odwracanie problemów działa."},
  {id:"q82", label:"Dowiedz się o koncepcji 'antifragility' — co rośnie pod wpływem stresu zamiast łamać się", xp:25, win:"Kości wzmacniają się pod obciążeniem. Ludzie sukcesu też. Teraz masz dla tego słowo."},

  // ── SAMOPOZNANIE I WYZWANIA ──
  {id:"q83", label:"Napisz list do siebie za 5 lat — co chcesz żeby tamten Ty o Tobie wiedział", xp:30, win:"Rozmawiasz z przyszłą wersją siebie. Ona czyta to dziś z dumą albo ze wstydem. Ty decydujesz."},
  {id:"q84", label:"Zbadaj teorię 'five regrets of the dying' — czego żałują umierający ludzie", xp:25, win:"Bronnie Ware spędziła lata przy umierających. Żaden nie żałował że za mało pracował."},
  {id:"q85", label:"Stwórz swój 'user manual' — dokument jak najlepiej z Tobą pracować i co Cię motywuje", xp:30, win:"Samoświadomość to fundament. Właśnie stworzyłeś najważniejszy dokument o sobie."},
  {id:"q86", label:"Zbadaj czym jest 'deliberate practice' wg Andersa Ericssona — jak naprawdę się mistrzostwo", xp:25, win:"10 000 godzin to mit. Ericsson mówił o 10 000 godzinach ukierunkowanego, bolesnego treningu. Inna sprawa."},
  {id:"q87", label:"Poproś kogoś o szczerą krytyczną opinię o jednej Twojej cesze i przyjmij ją bez defensywności", xp:40, win:"Feedback to najszybsza pętla uczenia się. Odwaga jego przyjęcia jest rzadka. Masz ją."},
  {id:"q88", label:"Zacznij projekt który odkładałeś — cokolwiek, choć 15 minut", xp:60, win:"Gotowość nie przychodzi przed działaniem. Przychodzi w jego trakcie. Właśnie to odkryłeś."},
  {id:"q89", label:"Znajdź coś w co wierzysz mocno i zbadaj najsilniejszy kontrargument przeciwko temu", xp:35, win:"Stalowe przekonania to takie które przetrwały najlepsze kontrargumenty. Sprawdziłeś swoje."},
  {id:"q90", label:"Dowiedz się o 'asymmetric upside' — dlaczego warto próbować rzeczy gdzie możesz dużo zyskać a mało stracić", xp:25, win:"Opcjonalność to jeden z najważniejszych konceptów w budowaniu życia. Właśnie go rozumiesz."},

  // ── OSTATNIE 10 — GŁĘBSZE QUESTY ──
  {id:"q91", label:"Zbadaj historię powstania firmy którą codziennie używasz i była blisko bankructwa", xp:25, win:"Apple było 90 dni od bankructwa w 1997. Disney zbankrutował kilka razy. Wytrwanie to strategia."},
  {id:"q92", label:"Dowiedz się o 'butterfly effect' — jak małe decyzje zmieniają historię świata", xp:20, win:"Arcyksiążę Franciszek Ferdynand przeżyłby zamach gdyby jego kierowca skręcił w lewo. I nie byłoby WWI."},
  {id:"q93", label:"Zbadaj czym jest 'Overton window' — jak zmienia się to co społeczeństwo uważa za normalne", xp:25, win:"Rzeczy niemożliwe stają się normalne. Geje, kobiety głosujące, smartfony. Kto rozumie Overton — rozumie zmiany."},
  {id:"q94", label:"Dowiedz się jak działa propaganda i znajdź 3 techniki które są używane dziś w mediach", xp:30, win:"Odporność na manipulację zaczyna się od jej rozpoznania. Właśnie zacząłeś ją budować."},
  {id:"q95", label:"Zbadaj historię SpaceX — jak Elon Musk prawie stracił wszystko trzy razy w 6 lat", xp:25, win:"Falcon 1 eksplodował 3 razy. Przy czwartym starcie weszło na orbitę. Trwanie ma cenę i nagrodę."},
  {id:"q96", label:"Dowiedz się czym jest 'compounding knowledge' — jak wiedza rośnie jak odsetki gdy łączy się dziedziny", xp:25, win:"Charlie Munger czyta 5 godzin dziennie i łączy biologie z ekonomią z psychologią. To jego sekret."},
  {id:"q97", label:"Zbadaj jak TED Talks stało się globalnym zjawiskiem — i przeczytaj o jednym prelegencie z którego możesz się nauczyć", xp:20, win:"TED zaczął od 18 minut. Format zmuszający do esencji. Wiedza bez lania wody."},
  {id:"q98", label:"Dowiedz się co to jest 'Pareto principle' i znajdź gdzie 20% Twoich działań daje 80% wyników", xp:20, win:"20% spraw tworzy 80% wartości. Które 20% to Twoje? To najważniejsze pytanie produktywności."},
  {id:"q99", label:"Zbadaj historię Elon Muska przed Teslą i SpaceX — co robił i skąd ma pieniądze", xp:20, win:"Musk zarobił pierwsze miliony na Zip2 i PayPal. Potem postawił wszystko na Mars. To nie jest szczęście."},
  {id:"q100",label:"Stwórz swoje osobiste 'manifesto' — 10 zasad według których chcesz żyć i podejmować decyzje", xp:50, win:"Zasady to decyzje podjęte z wyprzedzeniem. Nie musisz już myśleć w trudnych momentach — masz kodeks."},
];

const LEVELS = [
  {lvl:1,  name:"Nowicjusz",  icon:"🌱", xp:0,    desc:"Dopiero zaczynasz. Każda droga zaczyna się od pierwszego kroku."},
  {lvl:2,  name:"Uczeń",      icon:"📚", xp:120,  desc:"Zaczynasz dostrzegać wzorce. Nauka staje się nawykiem."},
  {lvl:3,  name:"Praktykant", icon:"⚡", xp:240,  desc:"Masz fundamenty. Czas zbudować na nich coś trwałego."},
  {lvl:4,  name:"Adept",      icon:"🔥", xp:360,  desc:"Dyscyplina stała się Twoją drugą naturą."},
  {lvl:5,  name:"Wojownik",   icon:"⚔️", xp:480,  desc:"Nie poddajesz się gdy jest ciężko. To rzadka cecha."},
  {lvl:6,  name:"Mistrz",     icon:"🛡️", xp:600,  desc:"Twoje nawyki działają nawet gdy nie masz motywacji."},
  {lvl:7,  name:"Ekspert",    icon:"🎯", xp:720,  desc:"Inni pytają Cię o radę. Wiesz co robisz."},
  {lvl:8,  name:"Lider",      icon:"👑", xp:840,  desc:"Inspirujesz innych samym swoim istnieniem."},
  {lvl:9,  name:"Wizjoner",   icon:"🌟", xp:960,  desc:"Widzisz dalej niż inni. Działasz zanim inni pomyślą."},
  {lvl:10, name:"Legenda",    icon:"🏆", xp:1080, desc:"Najwyższy poziom. Osiągnąłeś coś czego większość nie spróbuje."},
];

const BADGES = [
  {id:"b1",  e:"🌱", name:"Pierwszy krok",     desc:"Odznacz swój pierwszy nawyk",             cond:s=>s.habitsTotal>=1},
  {id:"b2",  e:"🔥", name:"Tydzień z rzędu",   desc:"7 dni streaka na jednym nawyku",          cond:s=>s.maxStreak>=7},
  {id:"b3",  e:"💎", name:"Perfekcjonista",     desc:"Ukończ wszystkie nawyki w jeden dzień",   cond:s=>s.perfectDays>=1},
  {id:"b4",  e:"⚡", name:"500 XP",            desc:"Zdobądź 500 punktów doświadczenia",       cond:s=>s.xp>=500},
  {id:"b5",  e:"🏆", name:"1000 XP",           desc:"Zdobądź 1000 punktów doświadczenia",      cond:s=>s.xp>=1000},
  {id:"b6",  e:"🗡️", name:"Łowca questów",     desc:"Ukończ 10 mikro-questów",                 cond:s=>s.questsDone>=10},
  {id:"b7",  e:"🎯", name:"Ambitny",            desc:"Ukończ 5 celów",                          cond:s=>s.goalsCompleted>=5},
  {id:"b8",  e:"💰", name:"Kontroler kasy",     desc:"Zapisz 20 wydatków",                      cond:s=>s.expensesCount>=20},
  {id:"b9",  e:"🌟", name:"Quest Hunter 50",    desc:"Ukończ 50 mikro-questów",                 cond:s=>s.questsDone>=50},
  {id:"b10", e:"👑", name:"Legenda 2000 XP",    desc:"Osiągnij 2000 XP",                        cond:s=>s.xp>=2000},
  {id:"b11", e:"📚", name:"Czytelnik",          desc:"Przeczytaj 20 rozdziałów",                cond:s=>s.chaptersRead>=20},
  {id:"b12", e:"🍳", name:"Kucharz",            desc:"Ugotuj 10 posiłków",                      cond:s=>s.mealsCooked>=10},
  {id:"b13", e:"🌊", name:"Hydro-champion",     desc:"Wypij poranną wodę 14 razy",              cond:s=>s.waterCount>=14},
  {id:"b14", e:"🗣️", name:"Poliglota",          desc:"Ucz się języka 30 razy",                  cond:s=>s.langCount>=30},
  {id:"b15", e:"🧘", name:"Detoks mistrz",      desc:"7 razy bez scrollowania",                 cond:s=>s.noscreenCount>=7},
  {id:"b16", e:"🔭", name:"Strateg",            desc:"Zrób 4 przeglądy tygodnia",               cond:s=>s.weeklyReviews>=4},
  {id:"b17", e:"💹", name:"Finansista",         desc:"Ucz się finansów 10 razy",                cond:s=>s.financeCount>=10},
  {id:"b18", e:"🤖", name:"Tech Master",        desc:"Ucz się AI/Tech 15 razy",                 cond:s=>s.aiCount>=15},
  {id:"b19", e:"📝", name:"Planista",           desc:"Planuj wieczorami 21 razy",               cond:s=>s.planCount>=21},
  {id:"b20", e:"💫", name:"Wdzięczny wojownik", desc:"Praktykuj wdzięczność 30 razy",           cond:s=>s.gratitudeCount>=30},
];

const GOAL_CATS = ["🎯 Cel","📚 Nauka","💪 Fitness","💰 Finanse","🚀 Projekt","🤝 Relacje"];
const EXP_CATS  = ["🍕 Jedzenie","🎮 Rozrywka","📚 Nauka","👕 Ubrania","🚌 Transport","💊 Zdrowie","🎁 Inne"];

// ── STATE ──────────────────────────────────────────────────────
let S = {
  xp: 0,
  completed: [],
  streaks: {},
  goals: [],
  todos: [],
  doneQuests: [],
  expenses: [],
  currentQuest: null,
  weekSel: new Date().getDay(),
  lastDate: new Date().toDateString(),
  weekHistory: {},   // { "2024-W12": { habitId: true/false, ... }, ... }
  stats: {
    maxStreak:0, perfectDays:0, habitsTotal:0,
    questsDone:0, goalsCompleted:0, goalsAdded:0, expensesCount:0,
    chaptersRead:0, mealsCooked:0, waterCount:0, langCount:0,
    noscreenCount:0, weeklyReviews:0, financeCount:0, aiCount:0,
    planCount:0, gratitudeCount:0,
  },
};

const todayIdx = new Date().getDay();
function getTodayHabits() { return HABITS.filter(h => h.days.includes(todayIdx)); }
function xpToLvl(xp)    { return Math.min(Math.floor(xp/120), 9); }
function xpInLvl(xp)    { return xp % 120; }
function getLevelObj(xp){ return LEVELS[xpToLvl(xp)]; }

// ── PERSIST STATE ──────────────────────────────────────────────
function getWeekKey(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`;
}
function getDayKey(dateStr) {
  // Returns "YYYY-MM-DD"
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toISOString().slice(0,10);
}
function archiveTodayToHistory(dateStr, completedIds) {
  if (!S.weekHistory) S.weekHistory = {};
  const dk = getDayKey(dateStr);
  // For each habit that was scheduled that day, record done/not
  const dow = new Date(dateStr).getDay();
  const scheduled = HABITS.filter(h=>h.days.includes(dow));
  if (scheduled.length === 0) return;
  S.weekHistory[dk] = {};
  scheduled.forEach(h => {
    S.weekHistory[dk][h.id] = completedIds.includes(h.id);
  });
  // Keep only last 56 days (8 weeks)
  const keys = Object.keys(S.weekHistory).sort();
  if (keys.length > 56) keys.slice(0, keys.length-56).forEach(k=>delete S.weekHistory[k]);
}

function saveState() {
  try { localStorage.setItem('championState', JSON.stringify(S)); } catch(e) {}
}
function loadState() {
  try {
    const saved = localStorage.getItem('championState');
    if (saved) {
      const parsed = JSON.parse(saved);
      const today = new Date().toDateString();
      if (parsed.lastDate !== today) {
        // Archive yesterday before resetting
        archiveTodayToHistory(parsed.lastDate || today, parsed.completed || []);
        parsed.completed = [];
        parsed.lastDate = today;
      }
      S = { ...S, ...parsed };
      if (!S.weekHistory) S.weekHistory = {};
      if (!S.todos) S.todos = [];
    }
  } catch(e) {}
  S.lastDate = new Date().toDateString();
}

// ── PARTICLES & EFFECTS ────────────────────────────────────────
function spawnBurst(x, y, color="#c8ff00", count=14) {
  const cont = document.getElementById("burst-container");
  for (let i = 0; i < count; i++) {
    const angle = (360/count)*i + Math.random()*10;
    const dist  = 40 + Math.random()*50;
    const px    = Math.cos(angle*Math.PI/180)*dist;
    const py    = Math.sin(angle*Math.PI/180)*dist;
    const el    = document.createElement("div");
    el.className = "particle";
    el.style.cssText = `left:${x}px;top:${y}px;background:${i%3===0?"#fff":color};--px:${px}px;--py:${py}px;animation-delay:${i*0.025}s;`;
    cont.appendChild(el);
    setTimeout(()=>el.remove(), 900);
  }
}

let toastTimer = null;
function showWin(msg, color) {
  const el = document.getElementById("win-toast");
  el.textContent = msg;
  el.style.color = color || "var(--g2)";
  el.style.borderColor = color ? color + "66" : "rgba(255,133,161,0.45)";
  el.style.boxShadow = color
    ? `0 8px 48px ${color}30, 0 0 0 1px ${color}18`
    : "0 8px 48px rgba(255,133,161,0.2)";
  el.className = "";
  void el.offsetWidth;
  el.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{
    el.classList.add("hide");
    setTimeout(()=>{ el.className = ""; }, 400);
  }, 5500);
}

function spawnXpFloat(xpVal, x, y) {
  const cont = document.getElementById("xp-floats");
  const el   = document.createElement("div");
  el.className  = "xp-float";
  el.style.left = (x-24)+"px";
  el.style.top  = (y-20)+"px";
  el.textContent= "+"+xpVal+" XP";
  cont.appendChild(el);
  setTimeout(()=>el.remove(), 1300);
}

// ── TABS ────────────────────────────────────────────────────────
let currentTab = "today";
window.switchTab = function(tab) {
  document.querySelectorAll(".tab-content").forEach(el=>el.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(el=>el.classList.remove("active"));
  document.getElementById("tab-"+tab).classList.add("active");
  const btn = document.querySelector(`[data-tab="${tab}"]`);
  if (btn) btn.classList.add("active");
  currentTab = tab;
  renderTab(tab);
};
function renderTab(tab) {
  if (tab==="today")   renderToday();
  if (tab==="week")    renderWeek();
  if (tab==="quests")  renderQuests();
  if (tab==="goals")   renderGoals();
  if (tab==="finance") renderFinance();
  if (tab==="level")   renderLevel();
}

// ── BAR HTML ───────────────────────────────────────────────────
function barHTML(val, max, color="var(--g)", h=8) {
  const pct = max===0?0:Math.min((val/max)*100,100);
  return `<div class="bar-wrap" style="height:${h}px"><div class="bar-fill" style="width:${pct}%;background:linear-gradient(90deg,${color},${color}bb);box-shadow:0 0 8px ${color}88;"></div></div>`;
}

// ── MINI HEADER STRIP ─────────────────────────────────────────
function renderHeader() {
  const lv   = getLevelObj(S.xp);
  const inLv = xpInLvl(S.xp);
  const th   = getTodayHabits();
  const done = S.completed.filter(id=>th.find(h=>h.id===id)).length;
  const pct  = th.length > 0 ? Math.round((done/th.length)*100) : 0;
  const allDone = th.length > 0 && done === th.length;
  document.getElementById("header-card").innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
          <div style="display:flex;align-items:baseline;gap:6px;">
            <span style="font-size:15px;font-weight:900;color:${allDone?"var(--gold)":"var(--txt)"};">${pct}%</span>
            <span style="font-size:11px;color:var(--mut);">dziś · ${done}/${th.length} nawyków</span>
          </div>
          <div style="display:flex;align-items:baseline;gap:5px;">
            <span style="font-size:13px;font-weight:800;color:var(--gold);">${lv.icon} ${lv.name}</span>
            <span style="font-size:10px;color:var(--mut);font-family:var(--mono);">${inLv}/120</span>
          </div>
        </div>
        <div style="display:flex;gap:5px;height:5px;">
          <div style="flex:${th.length||1};background:var(--bord);border-radius:3px;overflow:hidden;">
            <div style="width:${th.length?Math.min((done/th.length)*100,100):0}%;height:100%;background:var(--g);border-radius:3px;box-shadow:0 0 6px var(--g);transition:width 0.4s;"></div>
          </div>
          <div style="width:1px;background:rgba(255,255,255,0.06);flex-shrink:0;"></div>
          <div style="flex:1;background:var(--bord);border-radius:3px;overflow:hidden;">
            <div style="width:${Math.min((inLv/120)*100,100)}%;height:100%;background:var(--gold);border-radius:3px;box-shadow:0 0 6px var(--gold)66;transition:width 0.4s;"></div>
          </div>
        </div>
      </div>
    </div>
    ${allDone?`<div style="text-align:center;font-size:11px;font-weight:800;color:var(--gold);margin-top:6px;letter-spacing:1px;" class="neon-pulse">✦ IDEALNY DZIEŃ · +50 XP ✦</div>`:""}`;
}

// ── TODAY ──────────────────────────────────────────────────────
function renderToday() {
  const daily   = HABITS.filter(h=>h.days.length===7);
  const special = HABITS.filter(h=>h.days.length<7&&h.days.includes(todayIdx));
  let html = `<div class="fade-up">`;
  if (daily.length) {
    html += `<div class="slabel">Codzienne</div><div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px;">`;
    daily.forEach(h=>{ html+=habitCardHTML(h); });
    html += `</div>`;
  }
  if (special.length) {
    html += `<div class="slabel" style="--mut:var(--g2);">Dzisiaj dodatkowo</div><div style="display:flex;flex-direction:column;gap:10px;">`;
    special.forEach(h=>{ html+=habitCardHTML(h); });
    html += `</div>`;
  }
  html += `</div>`;
  document.getElementById("tab-today").innerHTML = html;
}
function habitCardHTML(h) {
  const done   = S.completed.includes(h.id);
  const streak = S.streaks[h.id]||0;
  const sf     = streak>=7?"animation:streakFire 1s ease infinite;":"";
  return `<div class="habit-card${done?" done":""}" style="--habit-color:${h.color}" onclick="toggleHabit('${h.id}',event)">
    ${done?`<div style="position:absolute;inset:0;border-radius:16px;opacity:0.05;background:radial-gradient(circle at 20% 50%,${h.color} 0%,transparent 60%);pointer-events:none;"></div>`:""}
    <div class="habit-emoji-box" style="${done?`background:${h.color}22;border-color:${h.color}44;`:""}">${h.emoji}</div>
    <div style="flex:1;min-width:0;">
      <div class="habit-label">${h.label}</div>
      <div class="habit-desc">${h.desc}</div>
      ${streak>0?`<div class="habit-streak"><span style="${sf}">🔥</span>&nbsp;${streak} dzień z rzędu</div>`:""}
    </div>
    <div class="habit-xp">+${h.xp}xp</div>
    <div class="habit-check">${done?"✓":""}</div>
  </div>`;
}
window.toggleHabit = function(id, event) {
  const habit  = HABITS.find(h=>h.id===id);
  if (!habit) return;
  const isDone = S.completed.includes(id);
  const rect   = event.currentTarget.getBoundingClientRect();
  const cx = rect.left+rect.width/2, cy = rect.top+rect.height/2;

  if (!isDone) {
    S.completed.push(id);
    S.xp += habit.xp;
    S.streaks[id] = (S.streaks[id]||0)+1;
    S.stats.habitsTotal++;
    S.stats.maxStreak = Math.max(S.stats.maxStreak, S.streaks[id]);
    if (id==="reading")   S.stats.chaptersRead++;
    if (id==="cooking")   S.stats.mealsCooked++;
    if (id==="water")     S.stats.waterCount++;
    if (id==="lang")      S.stats.langCount++;
    if (id==="noscreen")  S.stats.noscreenCount++;
    if (id==="review")    S.stats.weeklyReviews++;
    if (id==="finance")   S.stats.financeCount++;
    if (id==="ai")        S.stats.aiCount++;
    if (id==="plan")      S.stats.planCount++;
    if (id==="gratitude") S.stats.gratitudeCount++;

    const th    = getTodayHabits();
    const nowD  = S.completed.filter(x=>th.find(h=>h.id===x)).length;
    if (nowD===th.length && th.length>0) {
      S.xp += 50; S.stats.perfectDays++;
    }
    spawnBurst(cx,cy,habit.color);
    spawnXpFloat(habit.xp,cx,cy);
    const win = window.getHabitWin ? window.getHabitWin(id) : "Nawyk zaliczony!";
    SFX.habit();
    // Perfect day bonus sound
    const th2 = getTodayHabits();
    if (S.completed.filter(x=>th2.find(h=>h.id===x)).length === th2.length && th2.length>0) {
      setTimeout(()=>SFX.perfect(), 350);
    }
    showWin(win, habit.color);
  } else {
    S.completed = S.completed.filter(x=>x!==id);
    S.xp = Math.max(0, S.xp-habit.xp);
    S.streaks[id] = Math.max(0,(S.streaks[id]||1)-1);
  }
  saveState();
  renderHeader();
  renderToday();
};

// ── WEEK ────────────────────────────────────────────────────────
function renderWeek() {
  const sel      = S.weekSel;
  const dayH     = HABITS.filter(h=>h.days.includes(sel));
  let daySel     = `<div class="scroll-x" style="margin-bottom:20px;">`;
  DAYS_SHORT.forEach((d,i)=>{
    const isToday=i===todayIdx,isSel=i===sel,dh=HABITS.filter(h=>h.days.includes(i));
    daySel+=`<button onclick="selWeekDay(${i})" style="flex-shrink:0;min-width:52px;padding:10px 8px;border-radius:14px;border:1px solid ${isSel?"var(--g)":"var(--bord)"};background:${isSel?"rgba(200,255,0,0.1)":"var(--card)"};cursor:pointer;box-shadow:${isSel?"0 0 16px rgba(200,255,0,0.2)":"none"};transition:all 0.2s;">
      <div style="font-size:9px;font-family:var(--mono);letter-spacing:1px;color:${isSel?"var(--g)":isToday?"var(--g2)":"var(--mut)"};margin-bottom:4px;text-transform:uppercase;">${d}</div>
      <div style="font-size:13px;font-weight:800;color:${isSel?"var(--g)":"var(--txt)"};">${dh.length}</div>
      <div style="font-size:9px;color:var(--mut);">zadań</div>
      ${isToday?`<div style="width:4px;height:4px;border-radius:50%;background:var(--g);margin:4px auto 0;box-shadow:0 0 6px var(--g);"></div>`:""}
    </button>`;
  });
  daySel+=`</div>`;

  let detail = `<div class="card" style="margin-bottom:20px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div><div style="font-weight:800;font-size:18px;">${DAYS_PL[sel]}</div><div style="font-size:11px;color:var(--mut);font-family:var(--mono);">${dayH.length} nawyków</div></div><div style="font-size:28px;font-weight:900;color:var(--g);text-shadow:0 0 16px var(--g);">${dayH.length}</div></div>`;
  dayH.forEach(h=>{
    const st=S.streaks[h.id]||0;
    detail+=`<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--bord);">
      <div style="width:38px;height:38px;border-radius:10px;font-size:18px;display:flex;align-items:center;justify-content:center;background:${h.color}15;border:1px solid ${h.color}33;flex-shrink:0;">${h.emoji}</div>
      <div style="flex:1;"><div style="font-size:14px;font-weight:600;">${h.label}</div><div style="font-size:11px;color:var(--mut);">${h.desc}</div></div>
      <div style="font-size:9px;font-family:var(--mono);color:${h.color};background:${h.color}15;border:1px solid ${h.color}33;border-radius:6px;padding:3px 7px;">+${h.xp}xp</div>
      ${st>0?`<div style="font-size:10px;color:var(--gold);">🔥${st}</div>`:""}
    </div>`;
  });
  detail+=`</div>`;

  let grid=`<div class="slabel" style="margin-bottom:12px;">Rozkład tygodnia</div>`;
  HABITS.forEach(h=>{
    grid+=`<div style="margin-bottom:10px;background:var(--card);border:1px solid var(--bord);border-radius:12px;padding:12px 14px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><span>${h.emoji}</span><span style="font-size:13px;font-weight:600;">${h.label}</span></div>
      <div style="display:flex;gap:4px;">`;
    DAYS_SHORT.forEach((d,i)=>{
      const active=h.days.includes(i),isToday=i===todayIdx;
      grid+=`<div style="flex:1;height:26px;border-radius:6px;font-size:9px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-weight:700;background:${active?h.color+"22":"var(--bg3)"};border:1px solid ${active?h.color+"44":"var(--bord)"};color:${active?h.color:"var(--mut)"};${isToday?`outline:2px solid ${h.color}88;outline-offset:1px;`:""}">${d}</div>`;
    });
    grid+=`</div></div>`;
  });

  document.getElementById("tab-week").innerHTML=`<div class="fade-up">${daySel}${detail}${grid}</div>`;
}
window.selWeekDay=function(i){ S.weekSel=i; renderWeek(); };

// ── QUESTS (SLOT MACHINE) ──────────────────────────────────────
// ── QUEST DRAW STATE ──────────────────────────────────────────
let questDrawing = false; // true while animating

function renderQuests() {
  const done   = S.doneQuests.length;
  const doneXp = S.doneQuests.reduce((s,id)=>{const q=ALL_QUESTS.find(x=>x.id===id);return s+(q?.xp||0);},0);
  const avail  = ALL_QUESTS.filter(q=>!S.doneQuests.includes(q.id));
  const hasResult = S.currentQuest && !S.doneQuests.includes(S.currentQuest.id);

  // ── DRAW BOX ──
  let drawBox = "";
  if (avail.length === 0) {
    drawBox = `<div style="background:linear-gradient(135deg,#1a1200,#1a0008);border:2px solid var(--gold);border-radius:22px;padding:36px 20px;text-align:center;margin-bottom:20px;">
      <div style="font-size:48px;margin-bottom:12px;">🏆</div>
      <div style="font-size:18px;font-weight:800;color:var(--gold);">Wszystkie questy ukończone!</div>
      <div style="font-size:12px;color:var(--mut);margin-top:8px;">Jesteś absolutną legendą.</div>
    </div>`;
  } else if (hasResult) {
    // Show result card
    const q   = S.currentQuest;
    const xpC = q.xp>=40?"var(--gold)":q.xp>=25?"var(--g2)":"var(--g)";
    drawBox = `<div id="quest-result-box" style="
      background:linear-gradient(135deg,#060c1a,#08101e);
      border:2px solid rgba(220,40,80,0.5); border-radius:22px; padding:26px 20px;
      text-align:center; margin-bottom:20px;
      box-shadow:0 0 40px rgba(220,40,80,0.1), 0 0 0 1px rgba(255,133,161,0.06);
      animation:questReveal 0.5s cubic-bezier(0.34,1.56,0.64,1) both;">
      <div style="font-size:10px;color:var(--mut);font-family:var(--mono);letter-spacing:3px;margin-bottom:14px;">TWÓJ QUEST</div>
      <div style="font-size:16px;font-weight:800;color:var(--txt);line-height:1.5;margin-bottom:16px;">${q.label}</div>
      <div style="display:inline-block;padding:6px 16px;border-radius:20px;font-family:var(--mono);font-weight:800;font-size:13px;color:${xpC};background:${xpC}22;border:1px solid ${xpC}55;margin-bottom:20px;">+${q.xp} XP</div>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button onclick="completeCurrentQuest()" style="background:linear-gradient(135deg,#ff85a1,#e8608a);color:#fff;border:none;border-radius:14px;padding:13px 28px;font-weight:800;font-size:14px;font-family:var(--font);box-shadow:0 4px 20px rgba(255,133,161,0.4);transition:transform 0.15s;" onmousedown="this.style.transform='scale(0.96)'" onmouseup="this.style.transform='scale(1)'">✓ Wykonane!</button>
        <button onclick="reDrawQuest()" style="background:rgba(220,40,80,0.1);color:#ff5070;border:1px solid rgba(220,40,80,0.35);border-radius:14px;padding:13px 18px;font-size:13px;font-family:var(--font);">🎲 Inne</button>
      </div>
    </div>`;
  } else {
    // Idle draw button — crimson style
    drawBox = `<div id="quest-draw-idle" style="
      background:linear-gradient(135deg,#06080e,#08101a);
      border:2px dashed rgba(220,40,80,0.4); border-radius:22px;
      padding:32px 20px; text-align:center; margin-bottom:20px;
      cursor:pointer; transition:all 0.2s;"
      onclick="drawQuest()"
      onmouseenter="this.style.borderColor='rgba(220,40,80,0.75)';this.style.boxShadow='0 0 28px rgba(220,40,80,0.12)'"
      onmouseleave="this.style.borderColor='rgba(220,40,80,0.4)';this.style.boxShadow='none'">
      <div id="draw-dice" style="font-size:44px;margin-bottom:12px;">🎲</div>
      <div style="font-size:17px;font-weight:800;color:#ff5070;margin-bottom:6px;">Losuj quest</div>
      <div style="font-size:12px;color:var(--mut);">${avail.length} dostępnych</div>
    </div>`;
  }

  // ── DONE LIST ──
  let doneList = "";
  if (S.doneQuests.length > 0) {
    doneList = `<div class="slabel" style="margin-bottom:10px;">Ostatnio ukończone</div>`;
    [...S.doneQuests].reverse().slice(0,5).forEach(id=>{
      const q=ALL_QUESTS.find(x=>x.id===id); if(!q)return;
      const xpC=q.xp>=40?"var(--red)":q.xp>=25?"var(--gold)":"var(--g)";
      doneList+=`<div class="quest-done-item">
        <div style="font-size:14px;color:var(--g);flex-shrink:0;">✓</div>
        <div style="flex:1;font-size:12px;color:var(--mut);text-decoration:line-through;line-height:1.4;">${q.label}</div>
        <div style="font-size:11px;font-family:var(--mono);color:${xpC};flex-shrink:0;">+${q.xp}</div>
      </div>`;
    });
  }

  document.getElementById("tab-quests").innerHTML=`<div class="fade-up">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px;">
      <div class="card" style="padding:12px;text-align:center;"><div style="font-size:18px;font-weight:900;color:var(--g);">${done}</div><div style="font-size:9px;color:var(--mut);font-family:var(--mono);letter-spacing:1px;">ZROBIONE</div></div>
      <div class="card" style="padding:12px;text-align:center;"><div style="font-size:18px;font-weight:900;color:var(--g2);">${avail.length}</div><div style="font-size:9px;color:var(--mut);font-family:var(--mono);letter-spacing:1px;">DOSTĘPNE</div></div>
      <div class="card" style="padding:12px;text-align:center;"><div style="font-size:18px;font-weight:900;color:var(--gold);">${doneXp}</div><div style="font-size:9px;color:var(--mut);font-family:var(--mono);letter-spacing:1px;">XP ZDOBYTE</div></div>
    </div>
    <div style="margin-bottom:18px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="font-size:12px;font-weight:700;">Quest Progress</span>
        <span style="font-size:11px;font-family:var(--mono);color:var(--g);">${Math.round((done/ALL_QUESTS.length)*100)}%</span>
      </div>
      ${barHTML(done,ALL_QUESTS.length,"var(--g)",8)}
    </div>
    ${drawBox}
    ${doneList}
  </div>`;
}

// ── DRAW QUEST — dice-roll animation ──────────────────────────
function runDrawAnimation() {
  const avail = ALL_QUESTS.filter(q=>!S.doneQuests.includes(q.id));
  if (!avail.length || questDrawing) return;
  questDrawing = true;

  // Pick winner immediately
  const winner = avail[Math.floor(Math.random()*avail.length)];
  S.currentQuest = winner;

  // Animate the idle box
  const box   = document.getElementById("quest-draw-idle");
  const dice  = document.getElementById("draw-dice");
  const label = box ? box.querySelector('div[style*="font-size:17px"]') : null;

  // Spin dice faces
  if (dice) {
    let spins = 0;
    const faces = ["⚀","⚁","⚂","⚃","⚄","⚅","🎲"];
    const spinInterval = setInterval(()=>{
      dice.textContent = faces[spins % faces.length];
      dice.style.transform = `rotate(${spins * 60}deg) scale(${1 + Math.sin(spins)*0.15})`;
      spins++;
      if (spins > 14) {
        clearInterval(spinInterval);
        dice.textContent = "✨";
        dice.style.transform = "scale(1.3)";
      }
    }, 80);
  }

  // Flash random quest names
  if (label) {
    let flashes = 0;
    const flashInterval = setInterval(()=>{
      const rnd = avail[Math.floor(Math.random()*avail.length)];
      label.style.opacity = "0";
      setTimeout(()=>{
        label.textContent = rnd.label;
        label.style.opacity = "1";
        label.style.color = "var(--mut)";
        label.style.fontSize = "11px";
      }, 40);
      flashes++;
      if (flashes > 12) {
        clearInterval(flashInterval);
        setTimeout(()=>{
          questDrawing = false;
          renderQuests();
          const rect = document.getElementById("tab-quests").getBoundingClientRect();
          spawnBurst(window.innerWidth/2, rect.top + 200, "#ff85a1", 12);
        }, 120);
      }
    }, 90);
  } else {
    setTimeout(()=>{ questDrawing=false; renderQuests(); }, 1200);
  }
}

window.drawQuest = function() {
  // Called from idle state
  runDrawAnimation();
};

window.reDrawQuest = function() {
  // Called from result state — go back to idle first, then animate
  S.currentQuest = null;
  renderQuests();          // renders idle box
  setTimeout(()=>{ runDrawAnimation(); }, 50); // small delay for DOM update
};

window.completeCurrentQuest = function() {
  const q = S.currentQuest;
  if (!q||S.doneQuests.includes(q.id)) return;
  S.doneQuests.push(q.id);
  S.xp += q.xp;
  S.stats.questsDone++;
  const xpC = q.xp>=40?"#ff3d5a":q.xp>=25?"#ffcc00":"#c8ff00";
  spawnBurst(window.innerWidth/2, window.innerHeight/2, xpC, 22);
  spawnXpFloat(q.xp, window.innerWidth/2, window.innerHeight/2);
  SFX.quest();
  showWin(q.win);
  S.currentQuest = null;
  saveState();
  renderHeader();
  renderQuests();
};

// ── GOALS ──────────────────────────────────────────────────────
let selGoalCat = GOAL_CATS[0];
function renderGoals() {
  const active=S.goals.filter(g=>!g.done), done=S.goals.filter(g=>g.done);
  document.getElementById("tab-goals").innerHTML=`<div class="fade-up">
    <div class="card" style="margin-bottom:20px;">
      <div style="font-size:13px;font-weight:800;color:var(--g);margin-bottom:12px;">+ Nowy cel</div>
      <input class="inp" id="goal-inp" placeholder="Co chcesz osiągnąć?" style="margin-bottom:10px;" onkeydown="if(event.key==='Enter')addGoal()">
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;" id="gcat-pills">
        ${GOAL_CATS.map((c,i)=>`<button class="pill pill-sm${i===0&&selGoalCat===GOAL_CATS[0]?" active":selGoalCat===c?" active":""}" onclick="selGCat(this,'${c}')">${c}</button>`).join("")}
      </div>
      <div style="display:flex;gap:8px;">
        <input type="date" class="inp inp-mono" id="goal-dl" style="flex:1;color:var(--mut);color-scheme:dark;">
        <button onclick="addGoal()" style="background:var(--g);color:#000;border:none;border-radius:10px;padding:10px 20px;font-weight:800;font-size:14px;font-family:var(--font);transition:all 0.2s;" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">Dodaj</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
      <div class="card" style="padding:14px;text-align:center;"><div style="font-size:28px;font-weight:900;color:var(--g2);">${active.length}</div><div style="font-size:10px;color:var(--mut);font-family:var(--mono);">W TRAKCIE</div></div>
      <div class="card" style="padding:14px;text-align:center;"><div style="font-size:28px;font-weight:900;color:var(--gold);">${done.length}</div><div style="font-size:10px;color:var(--mut);font-family:var(--mono);">OSIĄGNIĘTE</div></div>
    </div>
    ${active.length?`<div class="slabel" style="margin-bottom:10px;">Aktywne cele</div>${active.map(g=>goalHTML(g)).join("")}`:""}
    ${done.length?`<div class="slabel" style="margin-bottom:10px;color:var(--gold);">Osiągnięte 🏆</div>${done.map(g=>goalHTML(g)).join("")}`:""}
    ${S.goals.length===0?`<div style="text-align:center;color:var(--mut);padding:50px 0;font-size:14px;">Nie masz jeszcze żadnych celów.<br><span style="color:var(--g);">Dodaj swój pierwszy!</span></div>`:""}
  </div>`;
  renderTodos();
}
window.selGCat=function(el,cat){document.querySelectorAll("#gcat-pills .pill").forEach(p=>p.classList.remove("active"));el.classList.add("active");selGoalCat=cat;};
window.addGoal=function(){
  const title=document.getElementById("goal-inp").value.trim();
  const dl=document.getElementById("goal-dl").value;
  if(!title)return;
  S.goals.push({id:Date.now(),title,cat:selGoalCat,deadline:dl,done:false});
  S.stats.goalsAdded++;
  saveState(); renderGoals();
};
window.toggleGoal=function(id){
  const g=S.goals.find(x=>x.id===id);if(!g)return;
  if(!g.done){
    S.xp+=30; S.stats.goalsCompleted++;
    const win=window.getGoalWin?window.getGoalWin():"Cel osiągnięty! Brawo!";
    spawnBurst(window.innerWidth/2,window.innerHeight/2,"#ffcc00",22);
    spawnXpFloat(30,window.innerWidth/2,window.innerHeight/2);
    SFX.goal();
    showWin(win);
    saveState(); renderHeader();
  }
  g.done=!g.done;
  saveState(); renderGoals();
};
window.deleteGoal=function(id){S.goals=S.goals.filter(g=>g.id!==id);saveState();renderGoals();};
function goalHTML(g){
  return `<div class="goal-card${g.done?" done":""}">
    <button class="check-circle${g.done?" done":""}" onclick="toggleGoal(${g.id})">${g.done?"✓":""}</button>
    <div style="flex:1;"><div style="font-size:10px;color:var(--mut);font-family:var(--mono);margin-bottom:3px;">${g.cat}</div><div style="font-size:14px;font-weight:700;color:${g.done?"var(--mut)":"var(--txt)"};${g.done?"text-decoration:line-through;":""}">${g.title}</div>${g.deadline?`<div style="font-size:10px;color:var(--mut);margin-top:4px;font-family:var(--mono);">📅 ${g.deadline}</div>`:""}</div>
    <button class="del-btn" onclick="deleteGoal(${g.id})">×</button>
  </div>`;
}

// ── TODO LIST ──────────────────────────────────────────────────
function renderTodos() {
  const open = S.todos.filter(t=>!t.done);
  const done = S.todos.filter(t=>t.done);
  const tab = document.getElementById("tab-goals");
  if (!tab) return;
  // append or update todo section below goals
  let todoDiv = document.getElementById("todo-section");
  if (!todoDiv) {
    todoDiv = document.createElement("div");
    todoDiv.id = "todo-section";
    tab.querySelector(".fade-up").appendChild(todoDiv);
  }
  todoDiv.innerHTML = `
    <div style="height:1px;background:var(--bord);margin:24px 0 20px;"></div>
    <div style="font-size:13px;font-weight:800;color:var(--g2);margin-bottom:14px;letter-spacing:0.5px;">📋 Lista TO-DO</div>
    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;gap:8px;">
        <input class="inp" id="todo-inp" placeholder="Dodaj zadanie..." style="flex:1;" onkeydown="if(event.key==='Enter')addTodo()">
        <button onclick="addTodo()" style="background:var(--g);color:#000;border:none;border-radius:10px;padding:10px 18px;font-weight:800;font-size:13px;font-family:var(--font);white-space:nowrap;">+ Dodaj</button>
      </div>
    </div>
    ${open.length===0&&done.length===0
      ? `<div style="text-align:center;color:var(--mut);padding:28px 0;font-size:13px;">Brak zadań. Dodaj swoje pierwsze!</div>`
      : ``}
    ${open.map(t=>`
      <div class="goal-card" style="--accent:var(--g2);">
        <button class="check-circle" onclick="toggleTodo(${t.id})" style="border-color:rgba(255,179,198,0.4);"></button>
        <div style="flex:1;min-width:0;">
          <div style="font-size:14px;font-weight:600;color:var(--txt);">${t.text}</div>
          ${t.added?`<div style="font-size:10px;color:var(--mut);margin-top:2px;font-family:var(--mono);">📅 ${t.added}</div>`:""}
        </div>
        <button class="del-btn" onclick="deleteTodo(${t.id})">×</button>
      </div>`).join("")}
    ${done.length>0?`<div style="font-size:10px;color:var(--mut);font-family:var(--mono);letter-spacing:2px;margin:12px 0 8px;">ZROBIONE</div>`:""}
    ${done.slice(0,5).map(t=>`
      <div class="goal-card done">
        <button class="check-circle done" onclick="toggleTodo(${t.id})">✓</button>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;color:var(--mut);text-decoration:line-through;">${t.text}</div>
          ${t.completedDate?`<div style="font-size:10px;color:var(--mut);margin-top:2px;font-family:var(--mono);">✓ ${t.completedDate}</div>`:""}
        </div>
        <button class="del-btn" onclick="deleteTodo(${t.id})">×</button>
      </div>`).join("")}
  `;
}
window.addTodo = function() {
  const inp = document.getElementById("todo-inp");
  const text = inp ? inp.value.trim() : "";
  if (!text) return;
  if (!S.todos) S.todos = [];
  const now = new Date();
  const dateStr = `${now.getDate()}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`;
  S.todos.unshift({ id: Date.now(), text, done: false, added: dateStr });
  SFX.tap();
  saveState();
  renderTodos();
  if (inp) inp.value = "";
};
window.toggleTodo = function(id) {
  const t = S.todos.find(x=>x.id===id);
  if (!t) return;
  t.done = !t.done;
  if (t.done) {
    const now = new Date();
    t.completedDate = `${now.getDate()}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`;
    SFX.goal();
    showWin("✓ Zadanie ukończone! Małe kroki budują wielkie zmiany.", "#ffcc00");
    spawnBurst(window.innerWidth/2, window.innerHeight/2, "#ffcc00", 14);
  }
  saveState();
  renderTodos();
};
window.deleteTodo = function(id) {
  S.todos = S.todos.filter(x=>x.id!==id);
  saveState();
  renderTodos();
};

// ── FINANCE ─────────────────────────────────────────────────────
let selExpCat=EXP_CATS[0];
function renderFinance(){
  const total=S.expenses.reduce((s,e)=>s+e.amount,0);
  const bycat={};S.expenses.forEach(e=>{bycat[e.cat]=(bycat[e.cat]||0)+e.amount;});
  const top=Object.entries(bycat).sort((a,b)=>b[1]-a[1]);

  let breakdown="";
  if(top.length){
    breakdown=`<div class="card" style="margin-bottom:16px;"><div style="font-size:13px;font-weight:700;margin-bottom:14px;">💸 Gdzie idzie kasa</div>`;
    top.slice(0,6).forEach(([c,v])=>{
      const pct=total>0?Math.round((v/total)*100):0;
      breakdown+=`<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;font-size:12px;"><span>${c}</span><div style="display:flex;gap:8px;align-items:center;"><span style="font-family:var(--mono);color:var(--mut);font-size:11px;">${pct}% budżetu</span><span style="font-family:var(--mono);color:var(--g2);font-weight:700;">${v.toFixed(2)} zł</span></div></div>${barHTML(v,total||1,"var(--g2)",5)}</div>`;
    });
    breakdown+=`</div>`;
  }

  let list="";
  if(S.expenses.length){
    list=`<div style="display:flex;flex-direction:column;gap:8px;">`;
    [...S.expenses].reverse().slice(0,20).forEach(e=>{
      list+=`<div class="expense-row"><div style="font-size:20px;">${e.cat.split(" ")[0]}</div><div style="flex:1;"><div style="font-size:13px;font-weight:600;">${e.desc}</div><div style="font-size:10px;color:var(--mut);font-family:var(--mono);">${e.date} · ${e.cat}</div></div><div style="font-family:var(--mono);font-weight:800;color:var(--red);font-size:14px;">-${e.amount.toFixed(2)} zł</div><button class="del-btn" onclick="delExp(${e.id})">×</button></div>`;
    });
    list+=`</div>`;
  }

  document.getElementById("tab-finance").innerHTML=`<div class="fade-up">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
      <div class="card card-glow" style="padding:16px;"><div style="font-size:10px;color:var(--mut);font-family:var(--mono);margin-bottom:4px;">WYDANO ŁĄCZNIE</div><div style="font-size:26px;font-weight:900;color:var(--red);">${total.toFixed(0)}</div><div style="font-size:11px;color:var(--mut);">złotych</div></div>
      <div class="card card-glow" style="padding:16px;"><div style="font-size:10px;color:var(--mut);font-family:var(--mono);margin-bottom:4px;">TRANSAKCJI</div><div style="font-size:26px;font-weight:900;color:var(--g);">${S.expenses.length}</div><div style="font-size:11px;color:var(--mut);">zapisanych</div></div>
    </div>
    ${breakdown}
    <div class="card" style="margin-bottom:16px;">
      <div style="font-size:13px;font-weight:800;color:var(--g);margin-bottom:12px;">+ Nowy wydatek</div>
      <div style="display:flex;gap:8px;margin-bottom:8px;">
        <input type="number" id="exp-am" placeholder="Kwota" class="inp inp-mono inp-sm">
        <input id="exp-de" placeholder="Opis" class="inp" style="flex:1;" onkeydown="if(event.key==='Enter')addExp()">
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;" id="ecat-pills">
        ${EXP_CATS.map((c,i)=>`<button class="pill pill-sm${selExpCat===c?" active":""}" onclick="selEC(this,'${c}')">${c}</button>`).join("")}
      </div>
      <button onclick="addExp()" style="width:100%;background:var(--g);color:#000;border:none;border-radius:10px;padding:12px;font-weight:800;font-family:var(--font);font-size:14px;">Dodaj wydatek</button>
    </div>
    ${list}
  </div>`;
}
window.selEC=function(el,cat){document.querySelectorAll("#ecat-pills .pill").forEach(p=>p.classList.remove("active"));el.classList.add("active");selExpCat=cat;};
window.addExp=function(){
  const a=parseFloat(document.getElementById("exp-am").value);
  const d=document.getElementById("exp-de").value.trim();
  if(!a||!d)return;
  S.expenses.push({id:Date.now(),amount:a,desc:d,cat:selExpCat,date:new Date().toLocaleDateString("pl")});
  S.stats.expensesCount++;
  saveState();renderFinance();
};
window.delExp=function(id){S.expenses=S.expenses.filter(e=>e.id!==id);saveState();renderFinance();};

// ── OSIĄGNIĘCIA (Achievements + History) ──────────────────────
let histViewWeek = 0; // 0 = current week, -1 = last week, etc.

function renderLevel(){
  const lv=getLevelObj(S.xp), inLv=xpInLvl(S.xp);
  const bs={...S.stats,xp:S.xp};
  const earnedBadges = BADGES.filter(b=>b.cond(bs));

  // ── LEVEL HERO ──
  const levelHero = `
    <div style="background:linear-gradient(160deg,#100616,#0a0614,#0e0616);border:1px solid rgba(255,133,161,0.2);border-radius:20px;padding:22px 20px;text-align:center;margin-bottom:16px;position:relative;overflow:hidden;">
      <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,rgba(199,125,255,0.07)0%,transparent 60%);pointer-events:none;"></div>
      <div style="display:flex;align-items:center;justify-content:center;gap:16px;">
        <div style="font-size:44px;" class="float-anim">${lv.icon}</div>
        <div style="text-align:left;">
          <div style="font-size:24px;font-weight:900;color:var(--gold);text-shadow:0 0 20px rgba(255,204,0,0.4);">${lv.name}</div>
          <div style="font-size:11px;color:var(--mut);font-family:var(--mono);">Poziom ${lv.lvl} · ${S.xp} XP łącznie</div>
        </div>
      </div>
      <div style="margin-top:14px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
          <span style="font-size:10px;color:var(--mut);font-family:var(--mono);">DO POZIOMU ${lv.lvl+1}</span>
          <span style="font-size:10px;color:var(--gold);font-family:var(--mono);">${inLv}/120</span>
        </div>
        ${barHTML(inLv,120,"var(--gold)",8)}
      </div>
    </div>`;

  // ── BADGES ──
  let badgesHTML = `<div class="slabel" style="margin-bottom:10px;">Odznaki ${earnedBadges.length}/${BADGES.length}</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px;">`;
  BADGES.forEach(b=>{
    const e=b.cond(bs);
    badgesHTML+=`<div title="${b.name}: ${b.desc}" style="background:var(--card);border:1px solid ${e?"rgba(255,133,161,0.3)":"var(--bord)"};border-radius:12px;padding:10px 6px;text-align:center;opacity:${e?1:0.35};">
      <div style="font-size:24px;">${b.e}</div>
      <div style="font-size:9px;color:${e?"var(--g)":"var(--mut)"};margin-top:4px;font-weight:700;line-height:1.2;">${b.name}</div>
    </div>`;
  });
  badgesHTML += `</div>`;

  // ── STATS COUNTERS ──
  const counters=[
    {e:"🔥",l:"Max streak",v:S.stats.maxStreak},
    {e:"💎",l:"Idealne dni",v:S.stats.perfectDays},
    {e:"🗡️",l:"Questy",v:S.stats.questsDone},
    {e:"🎯",l:"Cele",v:S.stats.goalsCompleted},
    {e:"📖",l:"Rozdziały",v:S.stats.chaptersRead},
    {e:"🍳",l:"Posiłki",v:S.stats.mealsCooked},
    {e:"💧",l:"Woda",v:S.stats.waterCount},
    {e:"🌍",l:"Język",v:S.stats.langCount},
    {e:"🚫",l:"Detox",v:S.stats.noscreenCount},
    {e:"🤖",l:"AI/Tech",v:S.stats.aiCount},
    {e:"📊",l:"Finanse",v:S.stats.financeCount},
    {e:"🔍",l:"Przeglądy",v:S.stats.weeklyReviews},
  ];
  let cHTML=`<div class="slabel" style="margin-bottom:10px;">Statystyki</div><div class="counter-grid" style="margin-bottom:20px;">`;
  counters.forEach(c=>{cHTML+=`<div class="counter-item"><div style="font-size:20px;">${c.e}</div><div><div style="font-size:18px;font-weight:900;color:var(--g);line-height:1;">${c.v}</div><div style="font-size:9px;color:var(--mut);">${c.l}</div></div></div>`;});
  cHTML+=`</div>`;

  // ── STREAK LIST ──
  let stHTML=`<div class="slabel" style="margin-bottom:10px;">Streaki nawyków</div><div style="margin-bottom:20px;">`;
  HABITS.forEach(h=>{
    const st=S.streaks[h.id]||0;
    stHTML+=`<div style="background:var(--card);border:1px solid var(--bord);border-radius:10px;padding:9px 14px;margin-bottom:6px;display:flex;align-items:center;gap:10px;">
      <span style="font-size:16px;">${h.emoji}</span>
      <span style="flex:1;font-size:12px;font-weight:600;">${h.label}</span>
      <span style="font-family:var(--mono);font-size:12px;color:${st>=7?"var(--gold)":st>0?"var(--g)":"var(--mut)"};">${st>0?`🔥 ${st}`:"—"}</span>
    </div>`;
  });
  stHTML+=`</div>`;

  // ── WEEKLY HISTORY ──
  const histHTML = buildHistoryHTML();

  // ── LEVEL MAP ──
  let lvlList=`<div class="slabel" style="margin-bottom:10px;">Mapa poziomów</div><div style="margin-bottom:20px;">`;
  LEVELS.forEach(l=>{
    const cur=xpToLvl(S.xp)===l.lvl-1, passed=S.xp>=l.xp;
    lvlList+=`<div class="level-row${cur?" current":!passed?" locked":""}">
      <div style="font-size:26px;flex-shrink:0;">${l.icon}</div>
      <div style="flex:1;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:1px;">
        <span style="font-weight:800;font-size:14px;color:${cur?"var(--g)":"var(--txt)"};">${l.name}</span>
        ${cur?`<span style="font-size:9px;background:var(--g);color:#000;border-radius:5px;padding:1px 5px;font-family:var(--mono);font-weight:700;">TERAZ</span>`:""}
      </div><div style="font-size:10px;color:var(--mut);line-height:1.4;">${l.desc}</div></div>
      <div style="font-family:var(--mono);font-size:10px;color:${passed?"var(--gold)":"var(--mut)"};text-align:right;flex-shrink:0;">${l.xp} XP</div>
    </div>`;
  });
  lvlList+=`</div>`;

  // ── RESET ──
  const resetHTML = `
    <div style="padding-top:20px;border-top:1px solid var(--bord);">
      <div style="font-size:10px;color:var(--mut);text-align:center;margin-bottom:10px;font-family:var(--mono);letter-spacing:2px;">STREFA NIEBEZPIECZNA</div>
      <button onclick="confirmReset()" style="width:100%;padding:13px;background:transparent;border:1px solid rgba(255,61,90,0.25);border-radius:14px;color:rgba(255,100,120,0.5);font-size:13px;font-weight:700;font-family:var(--font);cursor:pointer;transition:all 0.2s;"
        onmouseenter="this.style.borderColor='rgba(255,61,90,0.7)';this.style.color='#ff3d5a';this.style.background='rgba(255,61,90,0.05)'"
        onmouseleave="this.style.borderColor='rgba(255,61,90,0.25)';this.style.color='rgba(255,100,120,0.5)';this.style.background='transparent'">
        🗑️ Zresetuj wszystkie dane
      </button>
    </div>`;

  document.getElementById("tab-level").innerHTML=`<div class="fade-up">
    ${levelHero}${badgesHTML}${cHTML}${histHTML}${stHTML}${lvlList}${resetHTML}
  </div>`;
}

// ── WEEKLY HISTORY BUILDER ─────────────────────────────────────
function buildHistoryHTML() {
  const history = S.weekHistory || {};
  const today = new Date();

  // Build list of last 8 weeks
  let html = `<div class="slabel" style="margin-bottom:10px;">Historia tygodniowa</div>`;

  for (let w = 0; w < 8; w++) {
    // Get all days in this relative week (w=0 is this week, w=1 is last week, etc.)
    // Find Monday of (today - w*7)
    const refDay = new Date(today);
    refDay.setDate(today.getDate() - w * 7);
    // Find Monday of that week
    const mon = new Date(refDay);
    mon.setDate(refDay.getDate() - ((refDay.getDay() + 6) % 7));

    const days = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(mon);
      day.setDate(mon.getDate() + d);
      days.push(day);
    }

    // Check if week has any data or is current week
    const isCurrentWeek = w === 0;
    const weekDays = days.map(d=>d.toISOString().slice(0,10));
    const hasData = isCurrentWeek || weekDays.some(dk=>history[dk]);
    if (!hasData) continue;

    // Week label
    const monStr = `${days[0].getDate()}.${String(days[0].getMonth()+1).padStart(2,'0')}`;
    const sunStr = `${days[6].getDate()}.${String(days[6].getMonth()+1).padStart(2,'0')}`;
    const weekLabel = isCurrentWeek ? "Ten tydzień" : w===1 ? "Poprzedni tydzień" : `${monStr}–${sunStr}`;

    // Count total done / total scheduled for the week
    let weekDone = 0, weekTotal = 0;
    const dayRows = days.map(day => {
      const dk = day.toISOString().slice(0,10);
      const dow = day.getDay();
      const scheduled = HABITS.filter(h=>h.days.includes(dow));
      if (scheduled.length === 0) return null;

      const isFuture = day > today;
      const isToday = dk === today.toISOString().slice(0,10);

      let dayDone = 0;
      let habitDots = "";
      scheduled.forEach(h => {
        let done = false;
        if (isToday) {
          done = S.completed.includes(h.id);
        } else if (history[dk]) {
          done = history[dk][h.id] === true;
        }
        if (done) dayDone++;
        if (!isFuture) weekTotal++;
        if (done && !isFuture) weekDone++;
        const dotColor = done ? h.color : isFuture ? "transparent" : "#2a1438";
        const dotBorder = done ? "none" : isFuture ? `1px dashed #2a1438` : `1px solid #2a1438`;
        habitDots += `<div title="${h.label}" style="width:8px;height:8px;border-radius:50%;background:${dotColor};border:${dotBorder};flex-shrink:0;"></div>`;
      });

      const allDone = dayDone === scheduled.length;
      const dayNames = ["Nd","Pn","Wt","Śr","Cz","Pt","Sb"];
      const todayHighlight = isToday ? `border:1px solid rgba(255,133,161,0.4);background:rgba(255,133,161,0.04);` : "";
      const futureOp = isFuture ? "opacity:0.35;" : "";

      return `<div style="background:var(--card);border-radius:10px;padding:8px 10px;${todayHighlight}${futureOp}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;">
          <span style="font-size:10px;font-weight:700;color:${isToday?"var(--g)":"var(--txt)"};">${dayNames[dow]}</span>
          <span style="font-size:9px;font-family:var(--mono);color:${allDone&&!isFuture?"var(--gold)":"var(--mut)"};">${isFuture?"":allDone?"💎":""+dayDone+"/"+scheduled.length}</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:3px;">${habitDots}</div>
      </div>`;
    }).filter(Boolean);

    if (dayRows.length === 0) continue;
    const weekPct = weekTotal > 0 ? Math.round((weekDone/weekTotal)*100) : 0;

    html += `<div style="background:var(--bg3);border:1px solid var(--bord);border-radius:14px;padding:14px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-size:12px;font-weight:800;color:${isCurrentWeek?"var(--g)":"var(--txt)"};">${weekLabel}</span>
        <span style="font-size:11px;font-family:var(--mono);color:${weekPct>=80?"var(--gold)":weekPct>=50?"var(--g)":"var(--mut)"};">${weekDone}/${weekTotal} · ${weekPct}%</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">${dayRows.join("")}</div>
    </div>`;
  }

  html += `<div style="margin-bottom:20px;"></div>`;
  return html;
}

// ── RESET WITH CONFIRMATION ────────────────────────────────────
window.confirmReset = function() {
  const overlay = document.createElement("div");
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);`;
  overlay.innerHTML = `
    <div style="background:linear-gradient(135deg,#060c1a,#080816);border:1px solid rgba(255,61,90,0.4);border-radius:22px;padding:28px 24px;max-width:340px;width:100%;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">⚠️</div>
      <div style="font-size:18px;font-weight:900;color:var(--txt);margin-bottom:8px;">Na pewno?</div>
      <div style="font-size:13px;color:var(--mut);line-height:1.6;margin-bottom:24px;">To usunie <strong style="color:var(--g)">cały postęp</strong> — XP, questy, cele, wydatki, streaki. Tego nie można cofnąć.</div>
      <div style="display:flex;gap:10px;">
        <button onclick="this.closest('[style*=fixed]').remove()" style="flex:1;padding:13px;background:var(--bg3);border:1px solid var(--bord);border-radius:12px;color:var(--txt);font-size:14px;font-weight:700;font-family:var(--font);cursor:pointer;">Anuluj</button>
        <button onclick="doReset();this.closest('[style*=fixed]').remove()" style="flex:1;padding:13px;background:linear-gradient(135deg,#ff3d5a,#cc1a35);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:800;font-family:var(--font);cursor:pointer;box-shadow:0 4px 16px rgba(255,61,90,0.4);">Resetuj</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
};

window.doReset = function() {
  try { localStorage.removeItem('championState'); } catch(e) {}
  S = {
    xp:0, completed:[], streaks:{}, goals:[], todos:[], doneQuests:[], expenses:[],
    currentQuest:null, weekSel:new Date().getDay(),
    lastDate:new Date().toDateString(),
    stats:{maxStreak:0,perfectDays:0,habitsTotal:0,questsDone:0,goalsCompleted:0,
      goalsAdded:0,expensesCount:0,chaptersRead:0,mealsCooked:0,waterCount:0,
      langCount:0,noscreenCount:0,weeklyReviews:0,financeCount:0,aiCount:0,
      planCount:0,gratitudeCount:0},
  };
  renderHeader();
  switchTab('today');
};

// ── AUTO DATE REFRESH ──────────────────────────────────────────
function checkDateChange() {
  const today = new Date().toDateString();
  if (S.lastDate && S.lastDate !== today) {
    archiveTodayToHistory(S.lastDate, S.completed);
    S.completed = [];
    S.lastDate  = today;
    saveState();
    renderHeader();
    if (currentTab === 'today') renderToday();
  }
}
setInterval(checkDateChange, 60000); // check every minute

// ── INIT ────────────────────────────────────────────────────────
loadState();
renderHeader();
renderToday();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(() => console.log('SW registered'))
      .catch(err => console.log('SW error:', err));
  });
}
