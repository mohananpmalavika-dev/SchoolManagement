'use client';
import type { ReactNode } from 'react';

export type PrintableThemeId =
  | 'rainy'
  | 'animals'
  | 'birds'
  | 'fruits'
  | 'flowers'
  | 'vehicles'
  | 'sea'
  | 'sky'
  | 'numbers'
  | 'alphabet'
  | 'colours'
  | 'home'
  | 'festivals'
  | 'hygiene'
  | 'shapes'
  | 'custom';

export type PrintableKind = 'COLOURING' | 'WORKSHEET';

export interface PrintableThemeOption {
  id: PrintableThemeId;
  label: string;
  ariaSubject: string;
}

export const PRINTABLE_THEME_OPTIONS: PrintableThemeOption[] = [
  { id: 'rainy', label: 'Rainy season & monsoon', ariaSubject: 'rain cloud, umbrella, raindrops and paper boat' },
  { id: 'animals', label: 'Animals & pets', ariaSubject: 'friendly elephant, cat and rabbit' },
  { id: 'birds', label: 'Birds & butterflies', ariaSubject: 'butterfly, bird on a branch and bee' },
  { id: 'fruits', label: 'Fruits & vegetables', ariaSubject: 'apple, mango, banana, grapes and carrot' },
  { id: 'flowers', label: 'Flowers & garden', ariaSubject: 'sunflower, leafy tree and potted plant' },
  { id: 'vehicles', label: 'Vehicles & transport', ariaSubject: 'school bus, car, sailboat and airplane' },
  { id: 'sea', label: 'Sea & water life', ariaSubject: 'smiling fish, sea turtle, starfish and bubbles' },
  { id: 'sky', label: 'Sky, sun & space', ariaSubject: 'smiling sun, crescent moon, stars and rocket' },
  { id: 'numbers', label: 'Numbers & counting', ariaSubject: 'large numbers 1 to 4 with countable pictures' },
  { id: 'alphabet', label: 'Letters & reading', ariaSubject: 'large letter blocks, open book and pencil' },
  { id: 'colours', label: 'Colours & rainbow', ariaSubject: 'rainbow, clouds, paint palette and crayons' },
  { id: 'home', label: 'Home, family & school', ariaSubject: 'cozy house, garden tree, sun and pathway' },
  { id: 'festivals', label: 'Festivals & celebrations', ariaSubject: 'floral pookkalam, festive lamp and balloons' },
  { id: 'hygiene', label: 'Body, health & cleanliness', ariaSubject: 'handprint, soap bubbles, toothbrush and water drops' },
  { id: 'shapes', label: 'Shapes & patterns', ariaSubject: 'patterned circle, square, triangle, star and heart' },
  { id: 'custom', label: 'Custom theme frame', ariaSubject: 'themed drawing and colouring frame' },
];

// Order matters for compound words in Indic scripts:
// e.g. മഴവില്ല് (rainbow) contains മഴ (rain); പൂമ്പാറ്റ (butterfly) and പൂക്കളം (pookkalam) contain പൂ (flower).
const THEME_RULES: { id: Exclude<PrintableThemeId, 'custom'>; pattern: RegExp }[] = [
  {
    id: 'colours',
    pattern: /rainbow|colou?rs?|paint|crayon|മഴവില്ല|നിറ|വർണ്ണ|ചായ|इंद्रधनुष|रंग/i,
  },
  {
    id: 'festivals',
    pattern:
      /festival|celebrat|onam|vishu|diwali|deepavali|christmas|eid|holi|birthday|pookkalam|rangoli|diya|lamp|balloon|cake|ഉത്സവ|ആഘോഷ|ഓണം|വിഷു|പൂക്കളം|ദീപാവലി|വിളക്ക്|പിറന്നാൾ|ക്രിസ്മസ്|त्योहार|उत्सव|दिवाली|दीया|जन्मदिन|ओणम|होली/i,
  },
  {
    id: 'birds',
    pattern:
      /bird|butterfly|butterflies|duck|owl|peacock|parrot|crow|hen|chick|bee|insect|nest|feather|wing|പക്ഷി|ചിത്രശലഭ|പൂമ്പാറ്റ|താറാവ്|മയിൽ|തത്ത|കിളി|തേനീച്ച|पक्षी|चिड़िया|तितली|बतख|मोर|तोता/i,
  },
  {
    id: 'rainy',
    pattern:
      /rain|monsoon|umbrella|puddle|cloud|weather|storm|drizzle|wet|മഴ|കുട|മേഘ|തുള്ളി|മൺസൂൺ|बारिश|वर्षा|बरसात|छाता|बादल|मौसम/i,
  },
  {
    id: 'sea',
    pattern:
      /fish|sea|ocean|pond|river|beach|whale|dolphin|octopus|turtle|tortoise|frog|crab|aquatic|marine|water\s*animal|മത്സ്യ|മീൻ|കടൽ|കുളം|പുഴ|ആമ|തവള|ഞണ്ട്|मछली|समुद्र|तालाब|नदी|कछुआ|मेंढक/i,
  },
  {
    id: 'animals',
    pattern:
      /animal|pet|farm|jungle|zoo|wild|elephant|cat|dog|cow|rabbit|bunny|lion|tiger|monkey|bear|deer|goat|horse|മൃഗ|ആന|പൂച്ച|നായ|പശു|മുയൽ|സിംഹ|കുരങ്ങ|കരടി|മാൻ|जानवर|पशु|हाथी|बिल्ली|कुत्ता|गाय|खरगोश|शेर|बंदर/i,
  },
  {
    id: 'fruits',
    pattern:
      /fruit|vegetable|veggie|food|eat|nutrition|apple|mango|banana|grape|orange|carrot|tomato|watermelon|pineapple|പഴ|പച്ചക്കറി|ആപ്പിൾ|മാങ്ങ|വാഴപ്പഴ|മുന്തിരി|ഭക്ഷണ|ആഹാര|फल|सब्ज़|सब्ज|सेब|आम|केला|अंगूर|गाजर|भोजन/i,
  },
  {
    id: 'flowers',
    pattern:
      /flower|garden|tree|plant|leaf|leaves|nature|forest|seed|lotus|rose|sunflower|hibiscus|പൂ|തോട്ട|മരം|ചെടി|ഇല|പ്രകൃതി|കാട്|താമര|फूल|बगीचा|पेड़|पौधा|पत्ती|प्रकृति|कमल/i,
  },
  {
    id: 'vehicles',
    pattern:
      /vehicle|transport|travel|traffic|road|bus|car|train|boat|ship|aeroplane|airplane|plane|bicycle|cycle|truck|auto|വാഹന|യാത്ര|ബസ്|കാർ|തീവണ്ടി|ട്രെയിൻ|ബോട്ട്|വള്ളം|കപ്പൽ|വിമാന|സൈക്കിൾ|यातायात|वाहन|बस|कार|रेल|नाव|जहाज़|हवाई/i,
  },
  {
    id: 'sky',
    pattern:
      /sun|moon|star|sky|space|rocket|planet|day\s*(and|&)\s*night|night|morning|സൂര്യ|ചന്ദ്ര|നക്ഷത്ര|ആകാശ|ബഹിരാകാശ|റോക്കറ്റ്|പകൽ|രാത്രി|सूरज|सूर्य|चाँद|चांद|तारा|आकाश|अंतरिक्ष|रात/i,
  },
  {
    id: 'numbers',
    pattern: /number|count|math|digit|123|എണ്ണ|സംഖ്യ|അക്ക|ഗണിത|गिन|संख्या|अंक|गणित/i,
  },
  {
    id: 'alphabet',
    pattern:
      /alphabet|letter|abc|phonic|vowel|consonant|reading|book|story\s*book|writing|അക്ഷര|സ്വരാക്ഷര|വ്യഞ്ജന|വായന|പുസ്തക|എഴുത്ത്|अक्षर|वर्णमाला|किताब|पढ़ना/i,
  },
  {
    id: 'home',
    pattern:
      /home|house|family|school|classroom|friend|village|neighbour|neighbor|community|helper|mother|father|വീട്|കുടുംബ|സ്കൂൾ|വിദ്യാലയ|കൂട്ടുകാര|അമ്മ|അച്ഛൻ|घर|परिवार|स्कूल|विद्यालय|दोस्त/i,
  },
  {
    id: 'hygiene',
    pattern:
      /body|hand|wash|brush|teeth|tooth|health|clean|hygiene|bath|soap|sense|ശരീര|കൈ|പല്ല്|ആരോഗ്യ|ശുചിത്വ|കുളി|സോപ്പ്|शरीर|हाथ|दाँत|स्वच्छ|स्वास्थ्य|साबुन/i,
  },
  {
    id: 'shapes',
    pattern:
      /shape|circle|square|triangle|rectangle|geometry|pattern|ആകൃതി|വൃത്ത|ചതുര|ത്രികോണ|आकार|गोला|वर्ग|त्रिकोण/i,
  },
];

function matchText(text: string): Exclude<PrintableThemeId, 'custom'> | null {
  if (!text) return null;
  for (const rule of THEME_RULES) {
    if (rule.pattern.test(text)) return rule.id;
  }
  return null;
}

export function resolvePrintableTheme(
  theme?: string | null,
  title?: string | null,
  body?: string | null
): PrintableThemeId {
  return matchText(theme || '') || matchText(title || '') || matchText(body || '') || 'custom';
}

export function printableThemeMeta(id: PrintableThemeId): PrintableThemeOption {
  return PRINTABLE_THEME_OPTIONS.find((item) => item.id === id) || PRINTABLE_THEME_OPTIONS[PRINTABLE_THEME_OPTIONS.length - 1];
}

function localizedText(language: string, en: string, ml: string, hi: string) {
  return language === 'Malayalam' ? ml : language === 'Hindi' ? hi : en;
}

type MotifId =
  | 'cloud'
  | 'umbrella'
  | 'raindrop'
  | 'boat'
  | 'elephant'
  | 'cat'
  | 'rabbit'
  | 'butterfly'
  | 'bird'
  | 'bee'
  | 'apple'
  | 'banana'
  | 'grapes'
  | 'carrot'
  | 'sunflower'
  | 'tree'
  | 'leaf'
  | 'bus'
  | 'car'
  | 'plane'
  | 'fish'
  | 'turtle'
  | 'starfish'
  | 'sun'
  | 'moon'
  | 'star'
  | 'rocket'
  | 'rainbow'
  | 'crayon'
  | 'palette'
  | 'house'
  | 'heart'
  | 'pookkalam'
  | 'diya'
  | 'balloon'
  | 'hand'
  | 'soap'
  | 'tooth'
  | 'circle'
  | 'square'
  | 'triangle';

/** Crisp black-and-white vector motif drawn in a normalized 100x100 coordinate box. */
function Motif({ id, x = 0, y = 0, scale = 1 }: { id: MotifId; x?: number; y?: number; scale?: number }) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      fill="white"
      stroke="black"
      strokeWidth={3.8 / Math.max(scale, 0.55)}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {id === 'cloud' && (
        <>
          <path d="M24 68 H76 A16 16 0 0 0 78 37 A22 22 0 0 0 36 30 A18 18 0 0 0 24 68 Z" />
          <circle cx="42" cy="48" r="2.2" fill="black" />
          <circle cx="58" cy="48" r="2.2" fill="black" />
          <path d="M44 55 Q50 61 56 55" fill="none" />
          <path d="M34 76 L31 85 M50 78 L47 87 M66 76 L63 85" fill="none" />
        </>
      )}
      {id === 'umbrella' && (
        <>
          <path d="M12 52 A38 34 0 0 1 88 52 Q76 45 64 52 Q50 45 36 52 Q24 45 12 52 Z" />
          <path d="M50 18 Q36 34 36 52 M50 18 Q64 34 64 52" fill="none" />
          <line x1="50" y1="12" x2="50" y2="18" />
          <path d="M50 50 V78 A8 8 0 0 1 34 78" fill="none" />
        </>
      )}
      {id === 'raindrop' && (
        <>
          <path d="M50 12 C68 38 78 52 78 65 A28 28 0 0 1 22 65 C22 52 32 38 50 12 Z" />
          <circle cx="42" cy="60" r="2.2" fill="black" />
          <circle cx="58" cy="60" r="2.2" fill="black" />
          <path d="M44 68 Q50 74 56 68" fill="none" />
        </>
      )}
      {id === 'boat' && (
        <>
          <path d="M12 62 H88 L74 82 H26 Z" />
          <path d="M26 62 L50 22 L74 62 Z" />
          <line x1="50" y1="22" x2="50" y2="62" />
          <path d="M10 88 Q24 82 38 88 T66 88 T92 88" fill="none" />
        </>
      )}
      {id === 'elephant' && (
        <>
          <ellipse cx="46" cy="56" rx="28" ry="22" />
          <rect x="25" y="70" width="11" height="18" rx="4" />
          <rect x="52" y="70" width="11" height="18" rx="4" />
          <circle cx="68" cy="44" r="16" />
          <path d="M82 46 Q94 54 88 70 Q84 76 78 72" fill="none" />
          <ellipse cx="55" cy="46" rx="10" ry="14" />
          <circle cx="72" cy="40" r="2.2" fill="black" />
          <path d="M18 56 Q10 60 12 68" fill="none" />
        </>
      )}
      {id === 'cat' && (
        <>
          <path d="M26 36 L22 14 L42 26 Z" />
          <path d="M74 36 L78 14 L58 26 Z" />
          <circle cx="50" cy="48" r="26" />
          <circle cx="40" cy="44" r="2.4" fill="black" />
          <circle cx="60" cy="44" r="2.4" fill="black" />
          <path d="M46 53 L54 53 L50 58 Z" fill="black" />
          <path d="M42 62 Q50 68 58 62" fill="none" />
          <path d="M14 48 H30 M16 56 H30 M70 48 H86 M70 56 H84" fill="none" />
          <path d="M32 72 Q50 86 68 72" fill="none" />
        </>
      )}
      {id === 'rabbit' && (
        <>
          <ellipse cx="38" cy="24" rx="8" ry="18" />
          <ellipse cx="62" cy="24" rx="8" ry="18" />
          <circle cx="50" cy="58" r="24" />
          <circle cx="41" cy="54" r="2.4" fill="black" />
          <circle cx="59" cy="54" r="2.4" fill="black" />
          <ellipse cx="50" cy="61" rx="3.5" ry="2.5" fill="black" />
          <path d="M43 68 Q50 74 57 68" fill="none" />
          <path d="M20 60 H32 M68 60 H80" fill="none" />
        </>
      )}
      {id === 'butterfly' && (
        <>
          <ellipse cx="30" cy="38" rx="18" ry="16" />
          <ellipse cx="70" cy="38" rx="18" ry="16" />
          <ellipse cx="34" cy="66" rx="14" ry="13" />
          <ellipse cx="66" cy="66" rx="14" ry="13" />
          <circle cx="28" cy="38" r="5" />
          <circle cx="72" cy="38" r="5" />
          <rect x="44" y="26" width="12" height="54" rx="6" />
          <path d="M46 26 Q38 14 32 16 M54 26 Q62 14 68 16" fill="none" />
        </>
      )}
      {id === 'bird' && (
        <>
          <ellipse cx="48" cy="58" rx="24" ry="18" />
          <circle cx="68" cy="40" r="14" />
          <path d="M81 38 L94 42 L81 46 Z" />
          <path d="M24 54 L10 46 L14 62 Z" />
          <path d="M36 56 Q48 48 58 60 Q46 66 36 56 Z" />
          <circle cx="71" cy="38" r="2.2" fill="black" />
          <path d="M42 76 V88 M54 76 V88 M36 88 H62" fill="none" />
        </>
      )}
      {id === 'bee' && (
        <>
          <ellipse cx="42" cy="32" rx="12" ry="16" />
          <ellipse cx="58" cy="32" rx="12" ry="16" />
          <ellipse cx="50" cy="60" rx="28" ry="18" />
          <line x1="38" y1="43" x2="38" y2="77" />
          <line x1="52" y1="42" x2="52" y2="78" />
          <line x1="66" y1="44" x2="66" y2="76" />
          <circle cx="28" cy="56" r="2.2" fill="black" />
          <path d="M78 60 L88 60" />
        </>
      )}
      {id === 'apple' && (
        <>
          <path d="M50 32 C34 22 16 34 18 58 C20 80 36 88 50 82 C64 88 80 80 82 58 C84 34 66 22 50 32 Z" />
          <path d="M50 32 Q50 18 56 12" fill="none" />
          <path d="M52 22 Q70 12 74 26 Q62 32 52 22 Z" />
        </>
      )}
      {id === 'banana' && (
        <>
          <path d="M24 78 C46 84 74 68 82 32 C84 24 76 18 72 24 C66 48 48 64 26 66 C18 68 18 76 24 78 Z" />
          <path d="M72 24 L78 16 L84 20 L80 28" fill="none" />
        </>
      )}
      {id === 'grapes' && (
        <>
          <path d="M50 14 V28 M50 22 Q66 14 70 24 Q60 30 50 22 Z" />
          <circle cx="36" cy="40" r="10" />
          <circle cx="50" cy="40" r="10" />
          <circle cx="64" cy="40" r="10" />
          <circle cx="43" cy="56" r="10" />
          <circle cx="57" cy="56" r="10" />
          <circle cx="50" cy="72" r="10" />
        </>
      )}
      {id === 'carrot' && (
        <>
          <path d="M32 34 Q50 26 68 34 L50 88 Z" />
          <path d="M50 30 Q40 14 32 18 M50 30 V12 M50 30 Q60 14 68 18" fill="none" />
          <line x1="40" y1="48" x2="52" y2="48" />
          <line x1="46" y1="62" x2="58" y2="62" />
        </>
      )}
      {id === 'sunflower' && (
        <>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <ellipse
              key={deg}
              cx="50"
              cy="22"
              rx="8"
              ry="14"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="18" />
          <circle cx="44" cy="47" r="2.2" fill="black" />
          <circle cx="56" cy="47" r="2.2" fill="black" />
          <path d="M44 55 Q50 61 56 55" fill="none" />
        </>
      )}
      {id === 'tree' && (
        <>
          <rect x="42" y="56" width="16" height="32" rx="3" />
          <path d="M26 60 A18 18 0 0 1 28 32 A22 20 0 0 1 72 32 A18 18 0 0 1 74 60 Z" />
          <line x1="20" y1="88" x2="80" y2="88" />
        </>
      )}
      {id === 'leaf' && (
        <>
          <path d="M22 76 C20 40 44 18 82 18 C82 56 60 80 22 76 Z" />
          <path d="M16 84 L72 28" fill="none" />
          <path d="M40 60 L38 42 M54 46 L52 32 M44 56 L62 56" fill="none" />
        </>
      )}
      {id === 'bus' && (
        <>
          <rect x="12" y="28" width="76" height="44" rx="10" />
          <rect x="20" y="36" width="16" height="16" rx="2" />
          <rect x="42" y="36" width="16" height="16" rx="2" />
          <rect x="64" y="36" width="16" height="16" rx="2" />
          <circle cx="30" cy="74" r="10" />
          <circle cx="70" cy="74" r="10" />
          <circle cx="30" cy="74" r="3" />
          <circle cx="70" cy="74" r="3" />
        </>
      )}
      {id === 'car' && (
        <>
          <path d="M14 54 L26 34 H68 L82 54 Z" />
          <rect x="10" y="52" width="80" height="22" rx="8" />
          <line x1="48" y1="34" x2="48" y2="52" />
          <circle cx="28" cy="74" r="10" />
          <circle cx="72" cy="74" r="10" />
        </>
      )}
      {id === 'plane' && (
        <>
          <path d="M16 54 L84 44 C90 44 90 54 82 56 L22 62 L12 46 L20 46 Z" />
          <path d="M42 50 L56 22 L66 24 L56 48 Z" />
          <path d="M44 58 L56 80 L64 78 L56 56 Z" />
        </>
      )}
      {id === 'fish' && (
        <>
          <path d="M24 50 L8 32 V68 Z" />
          <ellipse cx="56" cy="50" rx="32" ry="22" />
          <circle cx="72" cy="44" r="2.6" fill="black" />
          <path d="M74 56 Q80 58 86 54" fill="none" />
          <path d="M44 34 Q52 50 44 66 M56 32 Q62 50 56 68" fill="none" />
        </>
      )}
      {id === 'turtle' && (
        <>
          <path d="M20 62 A30 28 0 0 1 76 62 Z" />
          <circle cx="84" cy="54" r="10" />
          <circle cx="87" cy="51" r="2" fill="black" />
          <rect x="26" y="62" width="12" height="14" rx="4" />
          <rect x="58" y="62" width="12" height="14" rx="4" />
          <path d="M36 42 L48 36 L60 42 L60 54 L48 60 L36 54 Z" fill="none" />
        </>
      )}
      {id === 'starfish' && (
        <path d="M50 12 L61 36 L88 40 L68 58 L73 84 L50 71 L27 84 L32 58 L12 40 L39 36 Z" />
      )}
      {id === 'sun' && (
        <>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="50"
              y1="10"
              x2="50"
              y2="22"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="22" />
          <circle cx="43" cy="46" r="2.2" fill="black" />
          <circle cx="57" cy="46" r="2.2" fill="black" />
          <path d="M43 55 Q50 61 57 55" fill="none" />
        </>
      )}
      {id === 'moon' && (
        <path d="M64 16 A34 34 0 1 0 80 74 A26 26 0 1 1 64 16 Z" />
      )}
      {id === 'star' && (
        <path d="M50 12 L61 36 L88 40 L68 58 L73 84 L50 71 L27 84 L32 58 L12 40 L39 36 Z" />
      )}
      {id === 'rocket' && (
        <>
          <path d="M50 12 C64 26 68 48 66 72 H34 C32 48 36 26 50 12 Z" />
          <path d="M34 56 L18 74 H34 Z" />
          <path d="M66 56 L82 74 H66 Z" />
          <circle cx="50" cy="42" r="9" />
          <path d="M42 74 L50 90 L58 74" />
        </>
      )}
      {id === 'rainbow' && (
        <>
          <path d="M12 72 A38 38 0 0 1 88 72" fill="none" />
          <path d="M22 72 A28 28 0 0 1 78 72" fill="none" />
          <path d="M32 72 A18 18 0 0 1 68 72" fill="none" />
          <circle cx="18" cy="74" r="10" />
          <circle cx="82" cy="74" r="10" />
        </>
      )}
      {id === 'crayon' && (
        <>
          <path d="M34 34 L50 10 L66 34 Z" />
          <rect x="34" y="34" width="32" height="52" rx="4" />
          <line x1="34" y1="48" x2="66" y2="48" />
          <line x1="34" y1="72" x2="66" y2="72" />
        </>
      )}
      {id === 'palette' && (
        <>
          <path d="M50 16 C24 16 12 34 14 54 C16 74 34 84 52 82 C62 80 62 70 58 66 C54 62 60 56 68 58 C80 60 88 48 84 34 C80 22 66 16 50 16 Z" />
          <circle cx="32" cy="40" r="6" />
          <circle cx="48" cy="30" r="6" />
          <circle cx="66" cy="36" r="6" />
          <circle cx="32" cy="60" r="6" />
        </>
      )}
      {id === 'house' && (
        <>
          <path d="M12 48 L50 16 L88 48 Z" />
          <rect x="20" y="48" width="60" height="38" />
          <rect x="42" y="60" width="16" height="26" />
          <rect x="26" y="56" width="12" height="12" />
          <rect x="62" y="56" width="12" height="12" />
        </>
      )}
      {id === 'heart' && (
        <path d="M50 82 C20 62 14 40 26 26 C36 16 48 22 50 32 C52 22 64 16 74 26 C86 40 80 62 50 82 Z" />
      )}
      {id === 'pookkalam' && (
        <>
          <circle cx="50" cy="50" r="36" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <ellipse
              key={deg}
              cx="50"
              cy="26"
              rx="7"
              ry="12"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="12" />
        </>
      )}
      {id === 'diya' && (
        <>
          <path d="M50 16 C60 30 62 40 50 48 C38 40 40 30 50 16 Z" />
          <path d="M16 56 Q50 48 84 56 C78 78 64 84 50 84 C36 84 22 78 16 56 Z" />
        </>
      )}
      {id === 'balloon' && (
        <>
          <ellipse cx="50" cy="40" rx="22" ry="26" />
          <path d="M46 66 L50 72 L54 66" />
          <path d="M50 72 Q42 80 50 90" fill="none" />
        </>
      )}
      {id === 'hand' && (
        <path d="M32 86 V54 L22 46 C18 42 22 34 28 38 L34 44 V22 C34 16 42 16 42 22 V40 V16 C42 10 52 10 52 16 V40 V18 C52 12 62 12 62 18 V42 V28 C62 22 72 22 72 28 V62 C72 78 62 86 50 86 Z" />
      )}
      {id === 'soap' && (
        <>
          <rect x="18" y="42" width="64" height="36" rx="14" />
          <rect x="30" y="52" width="40" height="16" rx="6" />
          <circle cx="28" cy="24" r="8" />
          <circle cx="48" cy="18" r="6" />
          <circle cx="70" cy="26" r="9" />
        </>
      )}
      {id === 'tooth' && (
        <>
          <path d="M28 24 C20 34 20 52 26 78 C28 86 38 86 42 74 L50 62 L58 74 C62 86 72 86 74 78 C80 52 80 34 72 24 C64 16 54 20 50 26 C46 20 36 16 28 24 Z" />
          <circle cx="40" cy="42" r="2.2" fill="black" />
          <circle cx="60" cy="42" r="2.2" fill="black" />
          <path d="M43 50 Q50 56 57 50" fill="none" />
        </>
      )}
      {id === 'circle' && <circle cx="50" cy="50" r="34" />}
      {id === 'square' && <rect x="18" y="18" width="64" height="64" rx="4" />}
      {id === 'triangle' && <path d="M50 14 L86 82 H14 Z" />}
    </g>
  );
}

const WORKSHEET_SETS: Record<
  Exclude<PrintableThemeId, 'custom' | 'numbers' | 'alphabet'>,
  {
    pairs: [MotifId, MotifId, MotifId];
    traceIcon: MotifId;
    traceGoal: MotifId;
    countIcon: MotifId;
    countValue: number;
    tracePath: string;
  }
> = {
  rainy: {
    pairs: ['cloud', 'umbrella', 'boat'],
    traceIcon: 'cloud',
    traceGoal: 'boat',
    countIcon: 'raindrop',
    countValue: 4,
    tracePath: 'M86 384 Q122 356 158 384 T230 384 T302 384',
  },
  animals: {
    pairs: ['elephant', 'cat', 'rabbit'],
    traceIcon: 'rabbit',
    traceGoal: 'carrot',
    countIcon: 'cat',
    countValue: 3,
    tracePath: 'M86 402 Q114 352 142 402 Q170 352 198 402 Q226 352 254 402 Q280 352 304 402',
  },
  birds: {
    pairs: ['butterfly', 'bird', 'bee'],
    traceIcon: 'butterfly',
    traceGoal: 'sunflower',
    countIcon: 'bird',
    countValue: 3,
    tracePath: 'M86 392 C118 346 156 346 184 392 C212 430 250 346 304 388',
  },
  fruits: {
    pairs: ['apple', 'banana', 'grapes'],
    traceIcon: 'apple',
    traceGoal: 'carrot',
    countIcon: 'apple',
    countValue: 4,
    tracePath: 'M86 388 L130 360 L174 410 L218 360 L262 410 L304 384',
  },
  flowers: {
    pairs: ['sunflower', 'tree', 'leaf'],
    traceIcon: 'bee',
    traceGoal: 'sunflower',
    countIcon: 'sunflower',
    countValue: 3,
    tracePath: 'M86 388 Q122 354 158 388 T230 388 T302 388',
  },
  vehicles: {
    pairs: ['bus', 'boat', 'plane'],
    traceIcon: 'bus',
    traceGoal: 'house',
    countIcon: 'car',
    countValue: 3,
    tracePath: 'M86 388 H304',
  },
  sea: {
    pairs: ['fish', 'turtle', 'starfish'],
    traceIcon: 'fish',
    traceGoal: 'starfish',
    countIcon: 'fish',
    countValue: 4,
    tracePath: 'M86 388 Q122 358 158 388 T230 388 T302 388',
  },
  sky: {
    pairs: ['sun', 'moon', 'rocket'],
    traceIcon: 'rocket',
    traceGoal: 'moon',
    countIcon: 'star',
    countValue: 4,
    tracePath: 'M86 404 Q146 350 206 394 T304 366',
  },
  colours: {
    pairs: ['rainbow', 'palette', 'crayon'],
    traceIcon: 'crayon',
    traceGoal: 'rainbow',
    countIcon: 'crayon',
    countValue: 4,
    tracePath: 'M86 406 Q195 344 304 406',
  },
  home: {
    pairs: ['house', 'tree', 'heart'],
    traceIcon: 'house',
    traceGoal: 'tree',
    countIcon: 'heart',
    countValue: 4,
    tracePath: 'M86 388 L140 364 L194 408 L248 364 L304 388',
  },
  festivals: {
    pairs: ['pookkalam', 'diya', 'balloon'],
    traceIcon: 'balloon',
    traceGoal: 'pookkalam',
    countIcon: 'balloon',
    countValue: 4,
    tracePath: 'M86 368 Q140 412 195 368 Q250 412 304 368',
  },
  hygiene: {
    pairs: ['hand', 'soap', 'tooth'],
    traceIcon: 'soap',
    traceGoal: 'hand',
    countIcon: 'raindrop',
    countValue: 4,
    tracePath: 'M86 388 Q122 358 158 388 T230 388 T302 388',
  },
  shapes: {
    pairs: ['circle', 'square', 'triangle'],
    traceIcon: 'circle',
    traceGoal: 'star',
    countIcon: 'star',
    countValue: 4,
    tracePath: 'M86 388 L138 358 L190 412 L242 358 L304 388',
  },
};

function ColouringScene({
  themeId,
  themeText,
  language,
}: {
  themeId: PrintableThemeId;
  themeText: string;
  language: string;
}) {
  const safeTheme = (themeText || 'My Picture').trim().slice(0, 42);
  let scene: ReactNode;

  switch (themeId) {
    case 'rainy':
      scene = (
        <g stroke="black" strokeWidth="3.8" fill="white" strokeLinecap="round" strokeLinejoin="round">
          {/* Sky clouds */}
          <path d="M68 118 H212 A26 26 0 0 0 216 68 A38 36 0 0 0 144 54 A30 30 0 0 0 68 118 Z" />
          <circle cx="122" cy="86" r="3" fill="black" />
          <circle cx="152" cy="86" r="3" fill="black" />
          <path d="M127 98 Q137 108 147 98" fill="none" />

          <path d="M478 104 H622 A24 24 0 0 0 626 58 A34 32 0 0 0 560 44 A28 28 0 0 0 478 104 Z" />

          {/* Big raindrops to colour */}
          {[
            [95, 148],
            [155, 162],
            [215, 144],
            [510, 134],
            [565, 152],
            [615, 132],
          ].map(([cx, cy], idx) => (
            <path
              key={idx}
              d={`M${cx} ${cy} C${cx + 12} ${cy + 18} ${cx + 16} ${cy + 28} ${cx + 16} ${cy + 34} A16 16 0 0 1 ${cx - 16} ${cy + 34} C${cx - 16} ${cy + 28} ${cx - 12} ${cy + 18} ${cx} ${cy} Z`}
            />
          ))}

          {/* Giant central umbrella */}
          <path d="M225 232 A125 104 0 0 1 475 232 Q435 212 395 232 Q350 212 305 232 Q265 212 225 232 Z" />
          <path d="M350 128 Q302 178 305 232 M350 128 Q398 178 395 232" fill="none" />
          <line x1="350" y1="112" x2="350" y2="128" />
          <path d="M350 226 V324 A20 20 0 0 1 310 324" fill="none" strokeWidth="5" />

          {/* Puddle & paper boat */}
          <ellipse cx="145" cy="364" rx="92" ry="22" />
          <path d="M492 346 H634 L608 380 H518 Z" />
          <path d="M518 346 L563 272 L608 346 Z" />
          <line x1="563" y1="272" x2="563" y2="346" />
          <path d="M464 388 Q500 374 536 388 T608 388 T664 388" fill="none" />
        </g>
      );
      break;

    case 'animals':
      scene = (
        <g stroke="black" strokeWidth="3.8" fill="white" strokeLinecap="round" strokeLinejoin="round">
          {/* Rolling ground & sun */}
          <path d="M20 358 Q185 318 350 352 T680 344 V400 H20 Z" />
          <Motif id="sun" x={578} y={24} scale={0.9} />

          {/* Big friendly elephant */}
          <g transform="translate(54 108) scale(2.4)">
            <ellipse cx="46" cy="56" rx="28" ry="22" />
            <rect x="25" y="70" width="11" height="20" rx="4" />
            <rect x="52" y="70" width="11" height="20" rx="4" />
            <circle cx="68" cy="44" r="16" />
            <path d="M82 46 Q96 54 90 70 Q84 78 78 72" fill="none" />
            <ellipse cx="55" cy="46" rx="10" ry="14" />
            <circle cx="72" cy="40" r="2.2" fill="black" />
            <path d="M18 56 Q10 60 12 68" fill="none" />
          </g>

          {/* Smiling cat & playful rabbit */}
          <Motif id="cat" x={346} y={184} scale={1.65} />
          <Motif id="rabbit" x={516} y={196} scale={1.55} />
        </g>
      );
      break;

    case 'birds':
      scene = (
        <g stroke="black" strokeWidth="3.8" fill="white" strokeLinecap="round" strokeLinejoin="round">
          {/* Branch with leaves */}
          <path d="M24 316 Q210 278 440 318 Q560 336 676 296" fill="none" strokeWidth="6" />
          <Motif id="leaf" x={58} y={288} scale={0.75} />
          <Motif id="leaf" x={578} y={292} scale={0.75} />

          {/* Giant symmetrical butterfly */}
          <Motif id="butterfly" x={76} y={54} scale={2.25} />
          {/* Friendly bird perched on branch */}
          <Motif id="bird" x={338} y={120} scale={2.0} />
          {/* Little bee & flower */}
          <Motif id="bee" x={538} y={56} scale={1.25} />
          <Motif id="sunflower" x={534} y={226} scale={1.15} />
        </g>
      );
      break;

    case 'fruits':
      scene = (
        <g stroke="black" strokeWidth="3.8" fill="white" strokeLinecap="round" strokeLinejoin="round">
          {/* Table surface */}
          <line x1="28" y1="364" x2="672" y2="364" strokeWidth="4" />
          <Motif id="apple" x={46} y={52} scale={1.85} />
          <Motif id="grapes" x={256} y={42} scale={1.95} />
          <Motif id="banana" x={476} y={52} scale={1.85} />
          <Motif id="carrot" x={154} y={208} scale={1.7} />
          {/* Large mango */}
          <g transform="translate(382 214)">
            <path d="M72 24 C118 24 148 56 144 98 C140 132 108 148 64 144 C30 140 14 114 26 88 C36 68 38 24 72 24 Z" />
            <path d="M76 24 Q82 8 92 4" fill="none" />
            <path d="M84 14 Q112 6 116 24 Q98 30 84 14 Z" />
          </g>
        </g>
      );
      break;

    case 'flowers':
      scene = (
        <g stroke="black" strokeWidth="3.8" fill="white" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 356 Q200 326 360 354 T680 348 V400 H20 Z" />
          <Motif id="sun" x={568} y={24} scale={0.95} />
          <Motif id="tree" x={36} y={92} scale={2.65} />
          {/* Tall smiling sunflower */}
          <line x1="390" y1="226" x2="390" y2="356" strokeWidth="5" />
          <path d="M390 296 Q344 276 346 312 Q370 320 390 296 Z" />
          <path d="M390 278 Q436 258 434 294 Q410 302 390 278 Z" />
          <Motif id="sunflower" x={300} y={70} scale={1.8} />
          {/* Potted plant & butterfly */}
          <path d="M532 296 H622 L608 358 H546 Z" />
          <line x1="577" y1="228" x2="577" y2="296" strokeWidth="4" />
          <Motif id="sunflower" x={522} y={142} scale={1.1} />
          <Motif id="butterfly" x={456} y={42} scale={0.95} />
        </g>
      );
      break;

    case 'vehicles':
      scene = (
        <g stroke="black" strokeWidth="3.8" fill="white" strokeLinecap="round" strokeLinejoin="round">
          {/* Sky plane & sun */}
          <Motif id="plane" x={44} y={24} scale={1.45} />
          <Motif id="sun" x={576} y={20} scale={0.9} />
          {/* Road */}
          <line x1="20" y1="276" x2="680" y2="276" strokeWidth="4" />
          <line x1="20" y1="312" x2="680" y2="312" strokeWidth="4" />
          <line x1="40" y1="294" x2="660" y2="294" strokeDasharray="24 18" strokeWidth="3" />
          {/* School bus & car */}
          <Motif id="bus" x={54} y={118} scale={2.0} />
          <Motif id="car" x={286} y={142} scale={1.7} />
          {/* Boat on water strip */}
          <Motif id="boat" x={492} y={204} scale={1.8} />
          <path d="M24 374 Q64 358 104 374 T184 374 T264 374 T344 374 T424 374 T504 374 T584 374 T676 374" fill="none" />
        </g>
      );
      break;

    case 'sea':
      scene = (
        <g stroke="black" strokeWidth="3.8" fill="white" strokeLinecap="round" strokeLinejoin="round">
          {/* Ocean surface waves */}
          <path d="M20 62 Q68 42 116 62 T212 62 T308 62 T404 62 T500 62 T596 62 T680 62" fill="none" />
          {/* Seaweed */}
          <path d="M62 396 Q44 352 66 312 Q86 272 60 232" fill="none" strokeWidth="5" />
          <path d="M636 396 Q616 348 640 304 Q662 260 634 220" fill="none" strokeWidth="5" />
          {/* Big fish, turtle, starfish, bubbles */}
          <Motif id="fish" x={86} y={88} scale={2.35} />
          <Motif id="turtle" x={378} y={178} scale={2.05} />
          <Motif id="starfish" x={156} y={292} scale={1.0} />
          <circle cx="338" cy="112" r="14" />
          <circle cx="366" cy="86" r="10" />
          <circle cx="516" cy="112" r="16" />
          <circle cx="552" cy="88" r="10" />
        </g>
      );
      break;

    case 'sky':
      scene = (
        <g stroke="black" strokeWidth="3.8" fill="white" strokeLinecap="round" strokeLinejoin="round">
          <Motif id="sun" x={44} y={36} scale={1.85} />
          <Motif id="rocket" x={256} y={76} scale={2.45} />
          <Motif id="moon" x={498} y={40} scale={1.6} />
          <Motif id="star" x={76} y={266} scale={1.1} />
          <Motif id="star" x={542} y={258} scale={1.15} />
          {/* Ringed planet */}
          <g transform="translate(476 218)">
            <ellipse cx="48" cy="36" rx="46" ry="12" transform="rotate(-16 48 36)" />
            <circle cx="48" cy="36" r="24" />
          </g>
        </g>
      );
      break;

    case 'numbers': {
      const items: { num: string; icon: MotifId; count: number; x: number; y: number }[] = [
        { num: '1', icon: 'sun', count: 1, x: 26, y: 24 },
        { num: '2', icon: 'apple', count: 2, x: 358, y: 24 },
        { num: '3', icon: 'star', count: 3, x: 26, y: 218 },
        { num: '4', icon: 'fish', count: 4, x: 358, y: 218 },
      ];
      scene = (
        <g stroke="black" strokeWidth="3" fill="white">
          {items.map((card) => (
            <g key={card.num}>
              <rect x={card.x} y={card.y} width="316" height="176" rx="14" />
              <text
                x={card.x + 54}
                y={card.y + 124}
                textAnchor="middle"
                fontSize="108"
                fontWeight="900"
                fill="white"
                stroke="black"
                strokeWidth="4"
                fontFamily="system-ui, sans-serif"
              >
                {card.num}
              </text>
              {Array.from({ length: card.count }).map((_, i) => {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const ix = card.x + 122 + col * 86;
                const iy = card.count <= 2 ? card.y + 44 : card.y + 12 + row * 78;
                return <Motif key={i} id={card.icon} x={ix} y={iy} scale={0.78} />;
              })}
            </g>
          ))}
        </g>
      );
      break;
    }

    case 'alphabet': {
      const letters =
        language === 'Malayalam'
          ? ['അ', 'ആ', 'ഇ']
          : language === 'Hindi'
            ? ['अ', 'आ', 'इ']
            : ['A', 'B', 'C'];
      const icons: MotifId[] = ['apple', 'boat', 'cat'];
      scene = (
        <g stroke="black" strokeWidth="3.5" fill="white" strokeLinecap="round" strokeLinejoin="round">
          {letters.map((letter, index) => {
            const bx = 32 + index * 218;
            return (
              <g key={letter}>
                <rect x={bx} y="30" width="200" height="236" rx="16" />
                <text
                  x={bx + 100}
                  y="144"
                  textAnchor="middle"
                  fontSize="96"
                  fontWeight="900"
                  fill="white"
                  stroke="black"
                  strokeWidth="3.5"
                  fontFamily="system-ui, sans-serif"
                >
                  {letter}
                </text>
                <Motif id={icons[index]} x={bx + 54} y={168} scale={0.9} />
              </g>
            );
          })}
          {/* Open storybook at bottom */}
          <path d="M180 300 Q265 280 350 304 Q435 280 520 300 V386 Q435 366 350 388 Q265 366 180 386 Z" />
          <line x1="350" y1="304" x2="350" y2="388" />
          <line x1="208" y1="326" x2="322" y2="326" />
          <line x1="208" y1="348" x2="322" y2="348" />
          <line x1="378" y1="326" x2="492" y2="326" />
          <line x1="378" y1="348" x2="492" y2="348" />
        </g>
      );
      break;
    }

    case 'colours': {
      const colourNames =
        language === 'Malayalam'
          ? ['ചുവപ്പ്', 'നീല', 'മഞ്ഞ', 'പച്ച']
          : language === 'Hindi'
            ? ['लाल', 'नीला', 'पीला', 'हरा']
            : ['Red', 'Blue', 'Yellow', 'Green'];
      scene = (
        <g stroke="black" strokeWidth="3.8" fill="white" strokeLinecap="round" strokeLinejoin="round">
          {/* Giant rainbow arcs */}
          <path d="M96 226 A254 196 0 0 1 604 226" fill="none" />
          <path d="M132 226 A218 164 0 0 1 568 226" fill="none" />
          <path d="M168 226 A182 132 0 0 1 532 226" fill="none" />
          <path d="M204 226 A146 100 0 0 1 496 226" fill="none" />
          <path d="M240 226 A110 68 0 0 1 460 226" fill="none" />
          {/* Clouds under rainbow ends */}
          <path d="M44 252 H174 A22 22 0 0 0 176 208 A32 30 0 0 0 116 196 A24 24 0 0 0 44 252 Z" />
          <path d="M524 252 H654 A22 22 0 0 0 656 208 A32 30 0 0 0 596 196 A24 24 0 0 0 524 252 Z" />
          {/* Four big colour-labelled crayons */}
          {colourNames.map((label, idx) => {
            const cx = 62 + idx * 158;
            return (
              <g key={label}>
                <Motif id="crayon" x={cx} y={266} scale={1.1} />
                <text
                  x={cx + 55}
                  y="394"
                  textAnchor="middle"
                  fontSize="18"
                  fontWeight="700"
                  fill="black"
                  stroke="none"
                  fontFamily="system-ui, sans-serif"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </g>
      );
      break;
    }

    case 'home':
      scene = (
        <g stroke="black" strokeWidth="3.8" fill="white" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 358 Q200 330 360 356 T680 350 V400 H20 Z" />
          <Motif id="sun" x={568} y={24} scale={0.95} />
          <Motif id="tree" x={36} y={120} scale={2.35} />
          {/* Large cozy house */}
          <rect x="444" y="96" width="32" height="58" />
          <path d="M246 184 L388 76 L530 184 Z" />
          <rect x="276" y="184" width="224" height="172" />
          <path d="M356 356 V264 A32 28 0 0 1 420 264 V356 Z" />
          <circle cx="408" cy="312" r="4" fill="black" />
          <rect x="298" y="212" width="44" height="44" />
          <line x1="320" y1="212" x2="320" y2="256" />
          <line x1="298" y1="234" x2="342" y2="234" />
          <rect x="434" y="212" width="44" height="44" />
          <line x1="456" y1="212" x2="456" y2="256" />
          <line x1="434" y1="234" x2="478" y2="234" />
          {/* Stepping stones & flower */}
          <ellipse cx="388" cy="378" rx="28" ry="9" />
          <Motif id="sunflower" x={556} y={232} scale={1.2} />
        </g>
      );
      break;

    case 'festivals':
      scene = (
        <g stroke="black" strokeWidth="3.8" fill="white" strokeLinecap="round" strokeLinejoin="round">
          {/* Festive bunting flags */}
          <path d="M24 38 Q350 86 676 38" fill="none" />
          {[76, 166, 256, 346, 436, 526, 616].map((x) => (
            <path key={x} d={`M${x - 24} 54 L${x} 94 L${x + 24} 54 Z`} />
          ))}
          {/* Large central Pookkalam / Mandala */}
          <Motif id="pookkalam" x={218} y={108} scale={2.65} />
          {/* Festive lamp & balloons */}
          <Motif id="diya" x={34} y={182} scale={1.75} />
          <Motif id="balloon" x={500} y={128} scale={1.45} />
          <Motif id="balloon" x={564} y={188} scale={1.35} />
        </g>
      );
      break;

    case 'hygiene':
      scene = (
        <g stroke="black" strokeWidth="3.8" fill="white" strokeLinecap="round" strokeLinejoin="round">
          <Motif id="hand" x={36} y={70} scale={2.5} />
          <Motif id="soap" x={274} y={214} scale={1.7} />
          <Motif id="tooth" x={474} y={84} scale={2.1} />
          <circle cx="318" cy="112" r="24" />
          <circle cx="378" cy="84" r="18" />
          <circle cx="418" cy="134" r="14" />
          <Motif id="raindrop" x={452} y={288} scale={0.95} />
          <Motif id="raindrop" x={556} y={288} scale={0.95} />
        </g>
      );
      break;

    case 'shapes':
      scene = (
        <g stroke="black" strokeWidth="3.8" fill="white" strokeLinecap="round" strokeLinejoin="round">
          {/* Patterned friendly shapes */}
          <circle cx="122" cy="116" r="68" />
          <circle cx="102" cy="102" r="4" fill="black" />
          <circle cx="142" cy="102" r="4" fill="black" />
          <path d="M102 130 Q122 148 142 130" fill="none" />

          <rect x="276" y="48" width="136" height="136" rx="10" />
          <line x1="276" y1="116" x2="412" y2="116" strokeDasharray="8 8" />
          <line x1="344" y1="48" x2="344" y2="184" strokeDasharray="8 8" />

          <path d="M568 44 L644 184 H492 Z" />
          <circle cx="568" cy="134" r="22" />

          <Motif id="star" x={56} y={230} scale={1.5} />
          <Motif id="heart" x={272} y={230} scale={1.5} />
          {/* Diamond */}
          <path d="M568 232 L636 306 L568 380 L500 306 Z" />
          <path d="M568 262 L608 306 L568 350 L528 306 Z" />
        </g>
      );
      break;

    case 'custom':
    default:
      scene = (
        <g stroke="black" strokeWidth="3.5" fill="white" strokeLinecap="round" strokeLinejoin="round">
          {/* Decorative top banner showing the actual theme */}
          <path d="M120 30 H580 L562 56 L580 82 H120 L138 56 Z" />
          <text
            x="350"
            y="64"
            textAnchor="middle"
            fontSize="24"
            fontWeight="800"
            fill="black"
            stroke="none"
            fontFamily="system-ui, sans-serif"
          >
            {safeTheme}
          </text>
          {/* Corner colouring ornaments */}
          <Motif id="star" x={28} y={24} scale={0.72} />
          <Motif id="star" x={600} y={24} scale={0.72} />
          {/* Open illustrated picture frame for custom theme */}
          <rect x="52" y="102" width="596" height="216" rx="18" strokeDasharray="10 8" />
          <text
            x="350"
            y="214"
            textAnchor="middle"
            fontSize="18"
            fill="#444"
            stroke="none"
            fontFamily="system-ui, sans-serif"
          >
            {localizedText(
              language,
              `Draw & colour: ${safeTheme}`,
              `വരച്ച് നിറം നൽകാം: ${safeTheme}`,
              `चित्र बनाएँ और रंग भरें: ${safeTheme}`
            )}
          </text>
          {/* Four colour-test crayons along bottom */}
          {[96, 232, 368, 504].map((x) => (
            <Motif key={x} id="crayon" x={x} y={326} scale={0.82} />
          ))}
        </g>
      );
      break;
  }

  return (
    <svg
      className="w-full border-2 border-black rounded-xl bg-white"
      viewBox="0 0 700 420"
      role="img"
      data-printable-kind="COLOURING"
      data-printable-theme={themeId}
      aria-label={`Printable colouring scene for ${safeTheme}: ${printableThemeMeta(themeId).ariaSubject}`}
    >
      <rect x="6" y="6" width="688" height="408" rx="14" fill="white" stroke="black" strokeWidth="2.5" />
      {scene}
    </svg>
  );
}

function WorksheetScene({
  themeId,
  themeText,
  language,
  body,
}: {
  themeId: PrintableThemeId;
  themeText: string;
  language: string;
  body?: string;
}) {
  const safeTheme = (themeText || 'Theme').trim().slice(0, 42);
  const matchHeading = localizedText(
    language,
    '1. Draw a line to match',
    '1. ഒരുപോലെയുള്ള ചിത്രങ്ങൾ വരച്ച് യോജിപ്പിക്കാം',
    '1. एक जैसे चित्रों को रेखा से मिलाएँ'
  );
  const traceHeading = localizedText(
    language,
    '2. Trace along the dotted line',
    '2. പൊട്ടുവരയിലൂടെ വരയ്ക്കാം',
    '2. बिंदु रेखा पर पेंसिल चलाएँ'
  );
  const countHeading = localizedText(
    language,
    '3. Count and colour',
    '3. എണ്ണി നിറം നൽകാം',
    '3. गिनें और रंग भरें'
  );

  // Special Numbers worksheet: count items on left -> match numeral on right + trace 1 2 3 4
  if (themeId === 'numbers') {
    const rows: { count: number; icon: MotifId; rightDigit: string }[] = [
      { count: 1, icon: 'sun', rightDigit: '2' },
      { count: 2, icon: 'apple', rightDigit: '3' },
      { count: 3, icon: 'star', rightDigit: '1' },
    ];
    return (
      <svg
        className="w-full border-2 border-black rounded-xl bg-white"
        viewBox="0 0 700 460"
        role="img"
        data-printable-kind="WORKSHEET"
        data-printable-theme="numbers"
        aria-label={`Printable counting and matching worksheet for ${safeTheme}`}
      >
        <rect x="6" y="6" width="688" height="448" rx="14" fill="white" stroke="black" strokeWidth="2.5" />
        <text x="28" y="36" fontSize="18" fontWeight="700" fill="black" fontFamily="system-ui, sans-serif">
          {localizedText(
            language,
            '1. Count the pictures and match the number',
            '1. ചിത്രങ്ങൾ എണ്ണി ശരിയായ സംഖ്യയുമായി യോജിപ്പിക്കാം',
            '1. चित्र गिनें और सही संख्या से मिलाएँ'
          )}
        </text>
        {rows.map((row, idx) => {
          const ry = 54 + idx * 80;
          const cy = ry + 34;
          return (
            <g key={row.count}>
              <rect x="32" y={ry} width="210" height="68" rx="12" fill="white" stroke="black" strokeWidth="2" />
              {Array.from({ length: row.count }).map((_, i) => (
                <Motif key={i} id={row.icon} x={44 + i * 62} y={ry + 6} scale={0.56} />
              ))}
              <circle cx="268" cy={cy} r="7" fill="black" />
              <circle cx="516" cy={cy} r="7" fill="black" />
              <rect x="544" y={ry} width="112" height="68" rx="12" fill="white" stroke="black" strokeWidth="2.5" />
              <text
                x="600"
                y={ry + 50}
                textAnchor="middle"
                fontSize="44"
                fontWeight="800"
                fill="white"
                stroke="black"
                strokeWidth="2.5"
                fontFamily="system-ui, sans-serif"
              >
                {row.rightDigit}
              </text>
            </g>
          );
        })}
        <line x1="24" y1="304" x2="676" y2="304" stroke="black" strokeWidth="2" strokeDasharray="6 6" />
        <text x="28" y="334" fontSize="18" fontWeight="700" fill="black" fontFamily="system-ui, sans-serif">
          {localizedText(
            language,
            '2. Trace and colour the numbers',
            '2. സംഖ്യകൾ പൊട്ടുവരയിലൂടെ എഴുതി നിറം നൽകാം',
            '2. संख्याओं पर पेंसिल चलाएँ और रंग भरें'
          )}
        </text>
        {['1', '2', '3', '4'].map((num, idx) => (
          <g key={num}>
            <rect
              x={36 + idx * 162}
              y="348"
              width="142"
              height="90"
              rx="12"
              fill="white"
              stroke="black"
              strokeWidth="2"
            />
            <text
              x={107 + idx * 162}
              y="416"
              textAnchor="middle"
              fontSize="68"
              fontWeight="800"
              fill="white"
              stroke="black"
              strokeWidth="2.5"
              strokeDasharray="6 5"
              fontFamily="system-ui, sans-serif"
            >
              {num}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  // Special Alphabet worksheet: language-aware letter matching + stroke tracing
  if (themeId === 'alphabet') {
    const leftLetters =
      language === 'Malayalam'
        ? ['അ', 'ആ', 'ഇ']
        : language === 'Hindi'
          ? ['अ', 'आ', 'इ']
          : ['A', 'B', 'C'];
    const rightLetters = [leftLetters[1], leftLetters[2], leftLetters[0]];
    return (
      <svg
        className="w-full border-2 border-black rounded-xl bg-white"
        viewBox="0 0 700 460"
        role="img"
        data-printable-kind="WORKSHEET"
        data-printable-theme="alphabet"
        aria-label={`Printable letter matching and tracing worksheet for ${safeTheme}`}
      >
        <rect x="6" y="6" width="688" height="448" rx="14" fill="white" stroke="black" strokeWidth="2.5" />
        <text x="28" y="36" fontSize="18" fontWeight="700" fill="black" fontFamily="system-ui, sans-serif">
          {localizedText(
            language,
            '1. Match the same letters',
            '1. ഒരുപോലെയുള്ള അക്ഷരങ്ങൾ യോജിപ്പിക്കാം',
            '1. एक जैसे अक्षरों को मिलाएँ'
          )}
        </text>
        {leftLetters.map((letter, idx) => {
          const ry = 54 + idx * 80;
          const cy = ry + 34;
          return (
            <g key={letter}>
              <rect x="52" y={ry} width="110" height="68" rx="12" fill="white" stroke="black" strokeWidth="2.5" />
              <text
                x="107"
                y={ry + 48}
                textAnchor="middle"
                fontSize="42"
                fontWeight="800"
                fill="black"
                fontFamily="system-ui, sans-serif"
              >
                {letter}
              </text>
              <circle cx="192" cy={cy} r="7" fill="black" />
              <circle cx="508" cy={cy} r="7" fill="black" />
              <rect x="538" y={ry} width="110" height="68" rx="12" fill="white" stroke="black" strokeWidth="2.5" />
              <text
                x="593"
                y={ry + 48}
                textAnchor="middle"
                fontSize="42"
                fontWeight="800"
                fill="white"
                stroke="black"
                strokeWidth="2.2"
                fontFamily="system-ui, sans-serif"
              >
                {rightLetters[idx]}
              </text>
            </g>
          );
        })}
        <line x1="24" y1="304" x2="676" y2="304" stroke="black" strokeWidth="2" strokeDasharray="6 6" />
        <text x="28" y="334" fontSize="18" fontWeight="700" fill="black" fontFamily="system-ui, sans-serif">
          {traceHeading}
        </text>
        <path
          d="M54 374 H220 M264 398 L302 354 L340 398 L378 354 L416 398 M460 380 Q494 348 528 380 T596 380 T652 380"
          fill="none"
          stroke="black"
          strokeWidth="4"
          strokeDasharray="8 8"
          strokeLinecap="round"
        />
        <circle cx="54" cy="374" r="6" fill="black" />
        <circle cx="264" cy="398" r="6" fill="black" />
        <circle cx="460" cy="380" r="6" fill="black" />
      </svg>
    );
  }

  // Custom / unmatched theme worksheet: pre-writing tracing paths + themed task/drawing boxes
  if (themeId === 'custom') {
    const numberedLines = (body || '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^\d+[.)]\s+/.test(line))
      .slice(0, 4)
      .map((line) => line.replace(/^\d+[.)]\s*/, '').slice(0, 38));
    return (
      <svg
        className="w-full border-2 border-black rounded-xl bg-white"
        viewBox="0 0 700 460"
        role="img"
        data-printable-kind="WORKSHEET"
        data-printable-theme="custom"
        aria-label={`Printable activity worksheet for ${safeTheme}`}
      >
        <rect x="6" y="6" width="688" height="448" rx="14" fill="white" stroke="black" strokeWidth="2.5" />
        <text x="28" y="36" fontSize="18" fontWeight="700" fill="black" fontFamily="system-ui, sans-serif">
          {localizedText(
            language,
            `1. Trace the paths for: ${safeTheme}`,
            `1. പൊട്ടുവരയിലൂടെ വരയ്ക്കാം: ${safeTheme}`,
            `1. बिंदु रेखा पर पेंसिल चलाएँ: ${safeTheme}`
          )}
        </text>
        {/* Three big pre-writing paths */}
        <g fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 9">
          <path d="M72 78 H624" />
          <path d="M72 132 Q132 98 192 132 T312 132 T432 132 T552 132 T624 132" />
          <path d="M72 190 L132 158 L192 190 L252 158 L312 190 L372 158 L432 190 L492 158 L552 190 L624 166" />
        </g>
        {[78, 132, 190].map((y) => (
          <circle key={y} cx="52" cy={y} r="9" fill="black" />
        ))}
        {[78, 132, 166].map((y, idx) => (
          <Motif key={idx} id="star" x={628} y={y - 24} scale={0.46} />
        ))}

        <line x1="24" y1="224" x2="676" y2="224" stroke="black" strokeWidth="2" strokeDasharray="6 6" />
        <text x="28" y="254" fontSize="18" fontWeight="700" fill="black" fontFamily="system-ui, sans-serif">
          {localizedText(
            language,
            `2. Draw and explore: ${safeTheme}`,
            `2. വരച്ച് കണ്ടെത്താം: ${safeTheme}`,
            `2. बनाएँ और खोजें: ${safeTheme}`
          )}
        </text>
        {[0, 1, 2, 3].map((idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const bx = 28 + col * 332;
          const by = 268 + row * 88;
          return (
            <g key={idx}>
              <rect x={bx} y={by} width="312" height="76" rx="12" fill="white" stroke="black" strokeWidth="2.2" />
              <circle cx={bx + 24} cy={by + 24} r="13" fill="white" stroke="black" strokeWidth="2" />
              <text
                x={bx + 24}
                y={by + 29}
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="black"
                fontFamily="system-ui, sans-serif"
              >
                {idx + 1}
              </text>
              {numberedLines[idx] && (
                <text
                  x={bx + 46}
                  y={by + 29}
                  fontSize="12"
                  fill="#222"
                  fontFamily="system-ui, sans-serif"
                >
                  {numberedLines[idx]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // Standard themed worksheet: Match themed pairs + Trace themed path + Count themed items
  const spec = WORKSHEET_SETS[themeId];
  const rightOrder: [MotifId, MotifId, MotifId] = [spec.pairs[1], spec.pairs[2], spec.pairs[0]];

  return (
    <svg
      className="w-full border-2 border-black rounded-xl bg-white"
      viewBox="0 0 700 460"
      role="img"
      data-printable-kind="WORKSHEET"
      data-printable-theme={themeId}
      aria-label={`Printable themed worksheet for ${safeTheme}: ${printableThemeMeta(themeId).ariaSubject}`}
    >
      <rect x="6" y="6" width="688" height="448" rx="14" fill="white" stroke="black" strokeWidth="2.5" />

      {/* Section 1: Match the themed pictures */}
      <text x="28" y="36" fontSize="18" fontWeight="700" fill="black" fontFamily="system-ui, sans-serif">
        {matchHeading}
      </text>
      {spec.pairs.map((leftMotif, idx) => {
        const ry = 50 + idx * 80;
        const cy = ry + 34;
        return (
          <g key={`${leftMotif}-${idx}`}>
            <rect x="46" y={ry} width="84" height="68" rx="12" fill="white" stroke="black" strokeWidth="2" />
            <Motif id={leftMotif} x={56} y={ry + 2} scale={0.64} />
            <circle cx="158" cy={cy} r="7" fill="black" />
            <circle cx="542" cy={cy} r="7" fill="black" />
            <rect x="570" y={ry} width="84" height="68" rx="12" fill="white" stroke="black" strokeWidth="2" />
            <Motif id={rightOrder[idx]} x={580} y={ry + 2} scale={0.64} />
          </g>
        );
      })}

      {/* Divider */}
      <line x1="24" y1="300" x2="676" y2="300" stroke="black" strokeWidth="2" strokeDasharray="6 6" />

      {/* Section 2: Trace along the dotted path */}
      <rect x="24" y="314" width="356" height="128" rx="12" fill="white" stroke="black" strokeWidth="2" />
      <text x="38" y="338" fontSize="15" fontWeight="700" fill="black" fontFamily="system-ui, sans-serif">
        {traceHeading}
      </text>
      <Motif id={spec.traceIcon} x={30} y={360} scale={0.54} />
      <path
        d={spec.tracePath}
        fill="none"
        stroke="black"
        strokeWidth="4"
        strokeDasharray="9 8"
        strokeLinecap="round"
      />
      <Motif id={spec.traceGoal} x={312} y={360} scale={0.54} />

      {/* Section 3: Count and colour */}
      <rect x="394" y="314" width="282" height="128" rx="12" fill="white" stroke="black" strokeWidth="2" />
      <text x="408" y="338" fontSize="15" fontWeight="700" fill="black" fontFamily="system-ui, sans-serif">
        {countHeading}
      </text>
      {Array.from({ length: spec.countValue }).map((_, i) => (
        <Motif
          key={i}
          id={spec.countIcon}
          x={404 + i * (spec.countValue === 4 ? 48 : 62)}
          y={366}
          scale={spec.countValue === 4 ? 0.48 : 0.56}
        />
      ))}
      <rect x="612" y="362" width="50" height="56" rx="10" fill="white" stroke="black" strokeWidth="3" />
    </svg>
  );
}

export function PreschoolPrintableSvg({
  kind,
  theme,
  title,
  body,
  language,
  overrideTheme,
}: {
  kind: PrintableKind;
  theme: string;
  title?: string;
  body?: string;
  language: string;
  overrideTheme?: PrintableThemeId | 'auto';
}) {
  const autoTheme = resolvePrintableTheme(theme, title, body);
  const resolvedTheme: PrintableThemeId =
    overrideTheme && overrideTheme !== 'auto' ? overrideTheme : autoTheme;
  const drawLabel = localizedText(
    language,
    'My own drawing',
    'എന്റെ സ്വന്തം ചിത്രം',
    'मेरा अपना चित्र'
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-4 border-b border-black pb-2 text-sm font-medium">
        <span>
          {localizedText(
            language,
            'Name: ____________________________',
            'പേര്: ____________________________',
            'नाम: ____________________________'
          )}
        </span>
        <span>
          {localizedText(
            language,
            'Date: ________________',
            'തീയതി: ________________',
            'दिनांक: ________________'
          )}
        </span>
      </div>
      {kind === 'COLOURING' ? (
        <ColouringScene themeId={resolvedTheme} themeText={theme || title || ''} language={language} />
      ) : (
        <WorksheetScene
          themeId={resolvedTheme}
          themeText={theme || title || ''}
          language={language}
          body={body}
        />
      )}
      <div
        className="my-4 h-44 border-2 border-black rounded-xl p-3"
        aria-label="Blank space for your own drawing"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">
          {drawLabel}
        </span>
      </div>
    </div>
  );
}
