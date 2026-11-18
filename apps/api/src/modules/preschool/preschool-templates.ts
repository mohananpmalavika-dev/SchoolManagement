import { GeneratePreschoolDto } from './preschool.dto';

// Original editable templates. Never label deterministic templates as AI output.
export function preschoolTemplate(input: GeneratePreschoolDto) {
  const { theme, kind, language } = input;
  const t = (en: string, ml: string, hi: string) =>
    language === 'Malayalam' ? ml : language === 'Hindi' ? hi : en;
  const intro = t(
    `Explore “${theme}” with large pictures. Invite children to look, name, point or gesture. Accept home-language responses.`,
    `“${theme}” വലിയ ചിത്രങ്ങളിലൂടെ പരിചയപ്പെടാം. കാണാനും പേര് പറയാനും ചൂണ്ടിക്കാണിക്കാനും അവസരം നൽകുക. മാതൃഭാഷയിലെ മറുപടികളും സ്വീകരിക്കുക.`,
    `“${theme}” को बड़े चित्रों से जानें। बच्चे देखकर, बोलकर या इशारे से बताएँ। घर की भाषा में भी जवाब स्वीकार करें।`
  );
  const visualItems = (() => {
    if (/rainbow|colou?r|മഴവില്ല|നിറ|इंद्रधनुष|रंग/i.test(theme))
      return t('rainbow, clouds and crayons', 'മഴവില്ല്, മേഘങ്ങൾ, ക്രയോണുകൾ', 'इंद्रधनुष, बादल और क्रेयॉन');
    if (/festival|onam|diwali|pookkalam|ഉത്സവ|ഓണം|പൂക്കളം|ദീപാവലി|त्योहार|दिवाली|ओणम/i.test(theme))
      return t('pookkalam, festive lamp and balloons', 'പൂക്കളം, വിളക്ക്, ബലൂണുകൾ', 'फूलों की रंगोली, दीया और गुब्बारे');
    if (/bird|butterfly|പക്ഷി|ചിത്രശലഭ|പൂമ്പാറ്റ|पक्षी|तितली/i.test(theme))
      return t('butterfly, bird and bee', 'ചിത്രശലഭം, പക്ഷി, തേനീച്ച', 'तितली, चिड़िया और मधुमक्खी');
    if (/rain|monsoon|umbrella|cloud|മഴ|കുട|മേഘ|बारिश|वर्षा|छाता/i.test(theme))
      return t('rain cloud, umbrella, raindrops and paper boat', 'മേഘം, കുട, മഴത്തുള്ളികൾ, കടലാസുതോണി', 'बादल, छाता, बारिश की बूँदें और कागज़ की नाव');
    if (/fish|sea|ocean|pond|turtle|മത്സ്യ|മീൻ|കടൽ|കുളം|ആമ|मछली|समुद्र|कछुआ/i.test(theme))
      return t('fish, sea turtle, starfish and bubbles', 'മത്സ്യം, ആമ, നക്ഷത്രമത്സ്യം, കുമിളകൾ', 'मछली, कछुआ, स्टारफ़िश और बुलबुले');
    if (/animal|pet|farm|jungle|elephant|cat|dog|cow|മൃഗ|ആന|പൂച്ച|നായ|പശു|മുയൽ|जानवर|पशु|हाथी|बिल्ली/i.test(theme))
      return t('elephant, cat and rabbit', 'ആന, പൂച്ച, മുയൽ', 'हाथी, बिल्ली और खरगोश');
    if (/fruit|vegetable|apple|mango|banana|പഴ|പച്ചക്കറി|ആപ്പിൾ|മാങ്ങ|फल|सब्ज|सेब|आम/i.test(theme))
      return t('apple, mango, banana, grapes and carrot', 'ആപ്പിൾ, മാങ്ങ, വാഴപ്പഴം, മുന്തിരി, കാരറ്റ്', 'सेब, आम, केला, अंगूर और गाजर');
    if (/flower|garden|tree|plant|leaf|nature|പൂ|തോട്ട|മരം|ചെടി|ഇല|फूल|बगीचा|पेड़|पौधा/i.test(theme))
      return t('sunflower, leafy tree and garden plant', 'സൂര്യകാന്തിപ്പൂവ്, മരം, ചെടി', 'सूरजमुखी, पेड़ और पौधा');
    if (/vehicle|transport|bus|car|train|boat|plane|വാഹന|ബസ്|കാർ|ട്രെയിൻ|ബോട്ട്|വിമാന|वाहन|बस|कार|नाव/i.test(theme))
      return t('school bus, car, boat and airplane', 'സ്കൂൾ ബസ്, കാർ, ബോട്ട്, വിമാനം', 'स्कूल बस, कार, नाव और हवाई जहाज़');
    if (/sun|moon|star|sky|space|rocket|സൂര്യ|ചന്ദ്ര|നക്ഷത്ര|ആകാശ|റോക്കറ്റ്|सूरज|चाँद|तारा|आकाश/i.test(theme))
      return t('sun, crescent moon, stars and rocket', 'സൂര്യൻ, ചന്ദ്രൻ, നക്ഷത്രങ്ങൾ, റോക്കറ്റ്', 'सूरज, चाँद, तारे और रॉकेट');
    if (/number|count|എണ്ണ|സംഖ്യ|गिन|संख्या/i.test(theme))
      return t('numbers 1 to 4 with countable pictures', '1 മുതൽ 4 വരെയുള്ള സംഖ്യകളും ചിത്രങ്ങളും', '1 से 4 तक संख्याएँ और चित्र');
    if (/alphabet|letter|abc|reading|book|അക്ഷര|വായന|പുസ്തക|अक्षर|वर्णमाला|किताब/i.test(theme))
      return t('large letters and storybook pictures', 'വലിയ അക്ഷരങ്ങളും ചിത്രപുസ്തകവും', 'बड़े अक्षर और कहानी की किताब');
    if (/home|house|family|school|വീട്|കുടുംബ|സ്കൂൾ|घर|परिवार|स्कूल/i.test(theme))
      return t('house, garden tree and sun', 'വീട്, മരം, സൂര്യൻ', 'घर, पेड़ और सूरज');
    if (/body|hand|wash|brush|teeth|health|clean|ശരീര|കൈ|പല്ല്|ആരോഗ്യ|ശുചിത്വ|शरीर|हाथ|दाँत|स्वच्छ/i.test(theme))
      return t('handprint, soap bubbles and smiling tooth', 'കൈപ്പത്തി, സോപ്പുകുമിളകൾ, പല്ല്', 'हाथ, साबुन के बुलबुले और दाँत');
    if (/shape|circle|square|triangle|ആകൃതി|വൃത്ത|ചതുര|ത്രികോണ|आकार|गोला|वर्ग/i.test(theme))
      return t('circle, square, triangle, star and heart', 'വൃത്തം, ചതുരം, ത്രികോണം, നക്ഷത്രം, ഹൃദയം', 'गोला, वर्ग, त्रिकोण, तारा और दिल');
    return '';
  })();
  const visualPrompt = visualItems
    ? t(
        ` (${visualItems})`,
        ` (${visualItems})`,
        ` (${visualItems})`
      )
    : '';
  const tasks: Record<string, string> = {
    LESSON_PLAN: t(
      'Welcome circle (3 min): Share a picture and ask what children notice.\nExplore: Name and match two large pictures together.\nPlay: Children choose a picture, describe it or copy a movement.\nReflect (2 min): Ask what they discovered. Record the help that each child used.',
      'സ്വാഗതവട്ടം (3 മിനിറ്റ്): ചിത്രം കാണിച്ച് ശ്രദ്ധിച്ച കാര്യം ചോദിക്കുക.\nഅന്വേഷണം: രണ്ട് വലിയ ചിത്രങ്ങൾക്ക് പേര് പറയുകയും പൊരുത്തപ്പെടുത്തുകയും ചെയ്യുക.\nകളി: ചിത്രം തിരഞ്ഞെടുക്കാനും വിവരിക്കാനും ചലനം അനുകരിക്കാനും അവസരം നൽകുക.\nഅവലോകനം (2 മിനിറ്റ്): കണ്ടെത്തിയ കാര്യം ചോദിക്കുക. നൽകിയ സഹായം രേഖപ്പെടുത്തുക.',
      'स्वागत गोला (3 मिनट): चित्र दिखाकर पूछें कि क्या देखा।\nखोज: दो बड़े चित्रों के नाम बोलें और मिलान करें।\nखेल: बच्चे चित्र चुनें, बताएँ या गति की नकल करें।\nसमापन (2 मिनट): खोज के बारे में पूछें और दी गई सहायता लिखें।'
    ),
    ACTIVITY: t(
      '1. Place two large pictures on a mat.\n2. Model naming and matching.\n3. Let children choose, match or point.\n4. Play in pairs with supported turn-taking.\n5. Celebrate effort and note the support offered.',
      '1. പായയിൽ രണ്ട് വലിയ ചിത്രങ്ങൾ വെക്കുക.\n2. പേര് പറയുന്നതും പൊരുത്തപ്പെടുത്തുന്നതും കാണിക്കുക.\n3. കുട്ടികൾ തിരഞ്ഞെടുക്കുകയോ ചൂണ്ടിക്കാണിക്കുകയോ ചെയ്യട്ടെ.\n4. സഹായത്തോടെ ഊഴമെടുത്ത് കളിക്കുക.\n5. ശ്രമത്തെ അഭിനന്ദിക്കുകയും സഹായം രേഖപ്പെടുത്തുകയും ചെയ്യുക.',
      '1. चटाई पर दो बड़े चित्र रखें।\n2. नाम बोलकर मिलान करके दिखाएँ।\n3. बच्चे चुनें, मिलाएँ या इशारा करें।\n4. जोड़ी में बारी-बारी खेलें।\n5. प्रयास की सराहना करें और सहायता लिखें।'
    ),
    STORY: t(
      'Mina’s discovery\nMina brought a picture to the circle. “What do you notice?” she asked. Ali pointed to a shape. Leela described a colour. Mina waited for each friend’s turn. Together they made a new picture, each adding one big mark. “We all noticed different things,” said Mina. They displayed their work and smiled.\nAsk: How did Mina help everyone join? Let children invent another ending.',
      'മീനയുടെ കണ്ടെത്തൽ\nമീന ഒരു ചിത്രം കൂട്ടുകാർക്ക് കാണിച്ചു. “എന്തൊക്കെ കാണാം?” അവൾ ചോദിച്ചു. അലി ഒരു ആകൃതി ചൂണ്ടിക്കാട്ടി. ലീല ഒരു നിറം പറഞ്ഞു. ഓരോ കൂട്ടുകാരനും പറയാൻ മീന കാത്തിരുന്നു. എല്ലാവരും ഓരോ വര വരച്ച് പുതിയ ചിത്രം ഉണ്ടാക്കി. “നമ്മൾ വ്യത്യസ്ത കാര്യങ്ങൾ കണ്ടു,” മീന പറഞ്ഞു. ചിത്രം പ്രദർശിപ്പിച്ച് അവർ സന്തോഷിച്ചു.\nഎല്ലാവർക്കും പങ്കെടുക്കാൻ മീന എന്തു ചെയ്തു? മറ്റൊരു അവസാനം കുട്ടികൾ പറയട്ടെ.',
      'मीना की खोज\nमीना एक चित्र लेकर आई। “तुम्हें क्या दिखता है?” उसने पूछा। अली ने आकार दिखाया। लीला ने रंग बताया। मीना ने सबकी बारी का इंतज़ार किया। सबने एक-एक बड़ी रेखा बनाकर नया चित्र तैयार किया। “हम सबने अलग बातें देखीं,” मीना ने कहा। सब मुस्कुराए।\nपूछें: मीना ने सबको कैसे शामिल किया? बच्चे नया अंत बताएँ।'
    ),
    RHYME: t(
      'Look and listen, clap with me,\nSo many things for us to see.\nTake a turn and share a smile,\nLet us wonder for a while.\nRepeat slowly. Invite a gesture between verses; clapping is optional.',
      'കാണാം കേൾക്കാം കൂട്ടുകാരേ,\nകൈകൾ കൊട്ടാം മെല്ലെ മെല്ലെ.\nഊഴമെടുത്ത് പുഞ്ചിരിക്കാം,\nഒത്തുചേർന്ന് കളിച്ചിടാം.\nമെല്ലെ ആവർത്തിക്കുക. വരികൾക്കിടയിൽ ചലനങ്ങൾ ചേർക്കാം. കൈകൊട്ടൽ നിർബന്ധമല്ല.',
      'देखो सुनो, मुस्काओ साथ,\nधीरे ताली, मिलकर हाथ।\nअपनी बारी आने दो,\nसबको भी बतलाने दो।\nधीरे दोहराएँ। बीच में क्रिया जोड़ें। ताली बजाना वैकल्पिक है।'
    ),
    FLASHCARDS: t(
      'Prepare four large picture cards:\nCARD 1 — NAME: One familiar example with a large printed name.\nCARD 2 — COLOUR: One large colour patch from the example.\nCARD 3 — SHAPE: One outline to trace in the air.\nCARD 4 — ACTION: A related gesture to imitate.\nShow one at a time. Accept pointing instead of speech.',
      'നാല് വലിയ ചിത്രകാർഡുകൾ തയ്യാറാക്കുക:\nകാർഡ് 1 — പേര്: പരിചിതമായ ചിത്രവും വലിയ അക്ഷരത്തിലുള്ള പേരും.\nകാർഡ് 2 — നിറം: ചിത്രത്തിലെ ഒരു നിറം.\nകാർഡ് 3 — ആകൃതി: വായുവിൽ പിന്തുടരാൻ ഒരു ആകൃതി.\nകാർഡ് 4 — ചലനം: അനുകരിക്കാൻ ഒരു ചലനം.\nഒന്നൊന്നായി കാണിക്കുക. ചൂണ്ടിക്കാണിച്ചും മറുപടി നൽകാം.',
      'चार बड़े कार्ड बनाएँ:\nकार्ड 1 — नाम: परिचित चित्र और बड़े अक्षरों में नाम।\nकार्ड 2 — रंग: चित्र का एक बड़ा रंग।\nकार्ड 3 — आकार: हवा में उँगली से बनाने के लिए आकार।\nकार्ड 4 — क्रिया: नकल करने के लिए क्रिया।\nएक समय पर एक दिखाएँ। इशारे से जवाब भी स्वीकार करें।'
    ),
    COLOURING: t(
      `Colour the large “${theme}” picture${visualPrompt} on the printable sheet. Invite children to choose colours freely and talk about what they see. Ask: “Tell me about your picture.” Offer chunky crayons. Staying inside the lines is optional.`,
      `പ്രിന്റ് ചെയ്യാവുന്ന ഷീറ്റിലെ “${theme}” എന്ന വിഷയവുമായി ബന്ധപ്പെട്ട വലിയ ചിത്രത്തിന്${visualPrompt} ഇഷ്ടനിറങ്ങൾ നൽകുക. കാണുന്ന കാര്യങ്ങളെക്കുറിച്ച് സംസാരിക്കാൻ കുട്ടികളെ പ്രോത്സാഹിപ്പിക്കുക. “ചിത്രത്തെക്കുറിച്ച് പറയാമോ?” എന്ന് ചോദിക്കുക. വലിയ ക്രയോണുകൾ നൽകുക. വരയ്ക്കുള്ളിൽ മാത്രം നിറയ്ക്കണമെന്ന് നിർബന്ധിക്കരുത്.`,
      `प्रिंट पन्ने पर “${theme}” से जुड़े बड़े चित्र${visualPrompt} में मनपसंद रंग भरें। बच्चों से पूछें “अपने चित्र के बारे में बताओ।” मोटे क्रेयॉन दें। रेखा के भीतर रंगना ज़रूरी नहीं है।`
    ),
    WORKSHEET: t(
      `1. Look at the “${theme}” pictures${visualPrompt} and connect matching pairs with a line or a finger.\n2. Trace along the dotted path slowly with a crayon.\n3. Count and colour the themed pictures in the box.\n4. Draw your own “${theme}” picture in the blank space and tell an adult about it.\nNo score or time limit.`,
      `1. “${theme}” എന്ന വിഷയത്തിലെ ഒരുപോലെയുള്ള ചിത്രങ്ങൾ${visualPrompt} കണ്ടെത്തി വരകൊണ്ടോ വിരൽകൊണ്ടോ യോജിപ്പിക്കുക.\n2. പൊട്ടുവരയിലൂടെ ക്രയോൺ ഉപയോഗിച്ച് മെല്ലെ വരയ്ക്കുക.\n3. കളത്തിലെ ചിത്രങ്ങൾ എണ്ണി നിറം നൽകുക.\n4. ഒഴിഞ്ഞ കളത്തിൽ “${theme}” സംബന്ധിച്ച സ്വന്തം ചിത്രം വരച്ച് അതിനെക്കുറിച്ച് പറയുക.\nമാർക്കും സമയപരിധിയും വേണ്ട.`,
      `1. “${theme}” से जुड़े एक जैसे चित्रों${visualPrompt} को रेखा या उँगली से जोड़ें।\n2. बिंदु रेखा पर धीरे-धीरे क्रेयॉन चलाएँ।\n3. खाने में दिए चित्रों को गिनें और रंग भरें।\n4. खाली खाने में “${theme}” से जुड़ा अपना चित्र बनाएँ और उसके बारे में बताएँ।\nअंक या समय सीमा न रखें।`
    ),
    GAME: t(
      'Picture explorers\nPlace large pictures in a clear, accessible area. Describe one without naming it. Children may walk, point or tell an adult which picture matches. Take turns giving clues. Play cooperatively; nobody is eliminated. End by sharing a favourite discovery.',
      'ചിത്രം കണ്ടെത്താം\nതടസ്സങ്ങളില്ലാത്ത സ്ഥലത്ത് വലിയ ചിത്രങ്ങൾ വെക്കുക. പേര് പറയാതെ ഒരു ചിത്രം വിവരിക്കുക. കുട്ടികൾക്ക് നടന്നോ ചൂണ്ടിക്കാണിച്ചോ പറഞ്ഞോ തിരഞ്ഞെടുക്കാം. ഊഴമെടുത്ത് സൂചനകൾ നൽകുക. ആരെയും പുറത്താക്കാതെ ഒരുമിച്ച് കളിക്കുക. ഇഷ്ടപ്പെട്ട കണ്ടെത്തൽ പറയട്ടെ.',
      'चित्र खोजी\nखुली और सुलभ जगह में बड़े चित्र रखें। बिना नाम लिए एक चित्र बताएँ। बच्चे चलकर, इशारे से या बोलकर उसे चुनें। बारी-बारी संकेत दें। सब मिलकर खेलें; किसी को बाहर न करें। अपनी पसंद की खोज बताएँ।'
    ),
    OBSERVATION_SHEET: t(
      'Observe during play:\n□ Communicates a choice with words, signs or gestures.\n□ Tries matching or sorting.\n□ Explores a large drawing tool.\n□ Shares space or takes a supported turn.\n□ Requests help or a break.\nRecord date, context, exact action/words, support offered and next opportunity. Leave unobserved skills blank. Do not infer a diagnosis.',
      'കളിക്കിടെ നിരീക്ഷിക്കുക:\n□ വാക്കുകളോ ആംഗ്യങ്ങളോ ഉപയോഗിച്ച് തിരഞ്ഞെടുപ്പ് അറിയിക്കുന്നു.\n□ പൊരുത്തപ്പെടുത്താനോ തരംതിരിക്കാനോ ശ്രമിക്കുന്നു.\n□ വലിയ വരയ്ക്കാനുള്ള ഉപകരണം ഉപയോഗിക്കുന്നു.\n□ സഹായത്തോടെ ഊഴമെടുക്കുന്നു.\n□ സഹായമോ ഇടവേളയോ ആവശ്യപ്പെടുന്നു.\nതീയതി, സാഹചര്യം, കൃത്യമായ പ്രവൃത്തി/വാക്കുകൾ, സഹായം, അടുത്ത അവസരം എന്നിവ രേഖപ്പെടുത്തുക. കാണാത്ത കഴിവുകൾ ഒഴിച്ചിടുക. രോഗനിർണയം നടത്തരുത്.',
      'खेलते समय देखें:\n□ शब्द या इशारे से पसंद बताता है।\n□ मिलान या छँटाई की कोशिश करता है।\n□ बड़े चित्र उपकरण का उपयोग करता है।\n□ सहायता से बारी लेता है।\n□ मदद या विराम माँगता है।\nतारीख, संदर्भ, सही क्रिया/शब्द, सहायता और अगला अवसर लिखें। न देखे कौशल खाली छोड़ें। निदान न करें।'
    ),
  };
  if (kind === 'FLASHCARDS') {
    const colourTheme = /colou?r|നിറ|रंग/i.test(theme);
    const numberTheme = /number|count|എണ്ണ|സംഖ്യ|गिन|संख्या/i.test(theme);
    const animalTheme = /animal|pet|മൃഗ|जानवर|पशु/i.test(theme);
    const words = colourTheme
      ? t('Red|Blue|Yellow|Green', 'ചുവപ്പ്|നീല|മഞ്ഞ|പച്ച', 'लाल|नीला|पीला|हरा')
      : numberTheme
        ? t('One|Two|Three|Four', 'ഒന്ന്|രണ്ട്|മൂന്ന്|നാല്', 'एक|दो|तीन|चार')
        : animalTheme
          ? t('Cat|Dog|Cow|Bird', 'പൂച്ച|നായ|പശു|പക്ഷി', 'बिल्ली|कुत्ता|गाय|पक्षी')
          : t(
              'Circle|Square|Triangle|Star',
              'വൃത്തം|ചതുരം|ത്രികോണം|നക്ഷത്രം',
              'गोला|वर्ग|त्रिकोण|तारा'
            );
    tasks.FLASHCARDS =
      words
        .split('|')
        .map((word, i) => `${i + 1}. ${word}`)
        .join('\n') +
      '\n\n' +
      t(
        'Draw a large matching picture above each word. Show one card at a time. Invite naming, pointing or an action. For an unfamiliar theme, replace these starter words before publishing.',
        'ഓരോ വാക്കിനും മുകളിൽ വലിയ ചിത്രം വരയ്ക്കുക. ഓരോ കാർഡും പ്രത്യേകം കാണിക്കുക. പേര് പറഞ്ഞോ ചൂണ്ടിക്കാണിച്ചോ ചലനം കാണിച്ചോ പങ്കെടുക്കാം. വിഷയത്തിന് യോജിച്ച വാക്കുകൾ പരിശോധിച്ച് മാറ്റുക.',
        'हर शब्द के ऊपर बड़ा चित्र बनाएँ। एक समय पर एक कार्ड दिखाएँ। बोलकर, इशारे या क्रिया से भाग लेने दें। विषय के अनुसार शब्द जाँचकर बदलें।'
      );
  }
  return {
    title: `${theme} · ${kind.replace(/_/g, ' ')}`,
    body:
      intro +
      '\n\n' +
      tasks[kind] +
      '\n\n' +
      t(
        'Safety: Adult supervision; large age-appropriate materials; no small loose parts or food tasting. Offer a seated or quiet alternative. Never force participation.',
        'സുരക്ഷ: മുതിർന്നവരുടെ മേൽനോട്ടവും വലിയ വസ്തുക്കളും വേണം. ചെറിയ ഭാഗങ്ങളും ഭക്ഷണം രുചിക്കുന്നതും ഒഴിവാക്കുക. ഇരുന്നോ ശാന്തമായോ പങ്കെടുക്കാൻ അവസരം നൽകുക. നിർബന്ധിക്കരുത്.',
        'सुरक्षा: वयस्क की देखरेख और बड़े सामान का उपयोग करें। छोटे टुकड़े या भोजन चखना न रखें। बैठकर या शांत तरीके से भाग लेने दें। भागीदारी के लिए बाध्य न करें।'
      ),
    materials: t(
      'Large picture cards; paper; chunky crayons; clear space; adult supervision.',
      'വലിയ ചിത്രകാർഡുകൾ; കടലാസ്; വലിയ ക്രയോണുകൾ; തടസ്സങ്ങളില്ലാത്ത സ്ഥലം; മുതിർന്നവരുടെ മേൽനോട്ടം.',
      'बड़े चित्र कार्ड; कागज़; मोटे क्रेयॉन; खाली जगह; वयस्क की देखरेख।'
    ),
    learningGoals: t(
      'Express a choice; notice similarities; practise taking turns; explore through play. Adapt to each child’s age and access needs.',
      'തിരഞ്ഞെടുപ്പ് അറിയിക്കുക; സാമ്യങ്ങൾ ശ്രദ്ധിക്കുക; ഊഴമെടുക്കുക; കളിയിലൂടെ പഠിക്കുക. പ്രായത്തിനും ആവശ്യങ്ങൾക്കും അനുസരിച്ച് മാറ്റുക.',
      'पसंद बताना; समानताएँ देखना; बारी लेना; खेलकर खोजना। हर बच्चे की उम्र और ज़रूरत के अनुसार बदलें।'
    ),
    _source: 'TEMPLATE',
  };
}

export function preschoolGuidance(input: {
  question: string;
  language: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}) {
  const t = (en: string, ml: string, hi: string) =>
    input.language === 'Malayalam' ? ml : input.language === 'Hindi' ? hi : en;
  const settlingPattern = /cr(y|ies|ying)|settle|separat|drop[\s-]?off|കര|അമ്മ|रो|अलग/i;
  const sharingPattern = /shar|turn|fight|ഊഴ|പങ്ക|बारी|बाँट|लड़/i;
  const recentUserHistory = (input.history ?? [])
    .filter((item) => item.role === 'user')
    .slice(-4)
    .map((item) => item.content)
    .join(' ');
  const directSettling = settlingPattern.test(input.question);
  const directSharing = sharingPattern.test(input.question);
  const settling =
    directSettling || (!directSharing && settlingPattern.test(recentUserHistory));
  const sharing =
    directSharing || (!directSettling && sharingPattern.test(recentUserHistory));
  return {
    answer: settling
      ? t(
          'Use a predictable arrival routine and a calm familiar adult. Acknowledge the child’s feelings in simple words. Offer a choice of two quiet activities and allow time to observe before joining. Agree a consistent goodbye routine with the family. Record what helped and review it with the parent.',
          'സ്ഥിരമായ വരവേൽപ്പും പരിചിതമായ മുതിർന്നവരുടെ സാന്നിധ്യവും ഒരുക്കുക. കുട്ടിയുടെ വികാരങ്ങൾ ലളിതമായ വാക്കുകളിൽ അംഗീകരിക്കുക. ശാന്തമായ രണ്ട് പ്രവർത്തനങ്ങളിൽ ഒന്ന് തിരഞ്ഞെടുക്കാൻ അവസരം നൽകുക. പങ്കെടുക്കും മുമ്പ് നിരീക്ഷിക്കാൻ സമയം നൽകുക. കുടുംബവുമായി സ്ഥിരമായ വിടപറയൽ രീതി തീരുമാനിക്കുക. സഹായിച്ച കാര്യങ്ങൾ രേഖപ്പെടുത്തി രക്ഷിതാവുമായി പങ്കിടുക.',
          'एक तय स्वागत दिनचर्या और परिचित शांत वयस्क रखें। सरल शब्दों में बच्चे की भावना स्वीकार करें। दो शांत गतिविधियों में से चुनने दें। जुड़ने से पहले देखने का समय दें। परिवार के साथ एक समान विदाई तरीका तय करें। जो मददगार रहा उसे लिखकर अभिभावक से चर्चा करें।'
        )
      : sharing
        ? t(
            'Model a short turn with a large shared resource. Name whose turn it is, give a clear next turn, and offer a second activity while waiting. Help children use words or gestures to request a turn. Notice small attempts to cooperate. Avoid forced sharing or comparing children.',
            'ഒരു വലിയ കളിവസ്തു ഉപയോഗിച്ച് ചെറിയ ഊഴം കാണിക്കുക. ഇപ്പോൾ ആരുടെ ഊഴമാണെന്നും അടുത്തത് ആരാണെന്നും പറയുക. കാത്തിരിക്കുമ്പോൾ മറ്റൊരു പ്രവർത്തനം നൽകുക. വാക്കുകളോ ആംഗ്യങ്ങളോ ഉപയോഗിച്ച് ഊഴം ചോദിക്കാൻ സഹായിക്കുക. സഹകരിക്കാനുള്ള ചെറിയ ശ്രമങ്ങളെ ശ്രദ്ധിക്കുക. നിർബന്ധിച്ചുള്ള പങ്കിടലും താരതമ്യവും ഒഴിവാക്കുക.',
            'एक बड़े साझा सामान के साथ छोटी बारी लेकर दिखाएँ। बताएँ अभी किसकी बारी है और अगली किसकी होगी। इंतज़ार के लिए दूसरी गतिविधि दें। शब्द या इशारे से बारी माँगने में मदद करें। सहयोग की छोटी कोशिशों को पहचानें। ज़बरदस्ती साझा करवाने और तुलना करने से बचें।'
          )
        : t(
            'Start with one clear play-based goal and a short demonstration. Offer children a choice of materials or ways to respond. Plan a movement option and a quiet alternative. Observe participation, the support offered and a possible next step. Use Activities & plans to prepare an age-specific teaching draft; adapt it before sharing.',
            'കളിയിലൂടെ നേടാവുന്ന ഒരു ലക്ഷ്യവും ചെറിയ മാതൃകയും തിരഞ്ഞെടുക്കുക. വസ്തുക്കളും പ്രതികരിക്കാനുള്ള രീതിയും തിരഞ്ഞെടുക്കാൻ കുട്ടികൾക്ക് അവസരം നൽകുക. ചലനപ്രവർത്തനവും ശാന്തമായ മറ്റൊരു വഴിയും ഒരുക്കുക. പങ്കാളിത്തവും നൽകിയ സഹായവും അടുത്ത ഘട്ടവും രേഖപ്പെടുത്തുക. പ്രായത്തിന് അനുയോജ്യമായ കരട് തയ്യാറാക്കാൻ പ്രവർത്തനങ്ങളുടെ വിഭാഗം ഉപയോഗിക്കുക. പങ്കിടുന്നതിന് മുമ്പ് മാറ്റങ്ങൾ വരുത്തുക.',
            'खेल पर आधारित एक स्पष्ट लक्ष्य और छोटा प्रदर्शन चुनें। सामान या जवाब देने के तरीके में विकल्प दें। गति वाली गतिविधि और शांत विकल्प रखें। भागीदारी, दी गई सहायता और अगला कदम लिखें। उम्र के अनुसार मसौदा बनाने के लिए गतिविधियों वाला भाग उपयोग करें और साझा करने से पहले बदलें।'
          ),
    suggestedActivities: [
      t(
        'Picture-choice welcome circle',
        'ചിത്രം തിരഞ്ഞെടുക്കുന്ന സ്വാഗതവട്ടം',
        'चित्र चुनने वाला स्वागत गोला'
      ),
      t(
        'Cooperative drawing with large crayons',
        'വലിയ ക്രയോണുകൾ ഉപയോഗിച്ച് കൂട്ടമായി ചിത്രം വരയ്ക്കൽ',
        'मोटे क्रेयॉन से मिलकर चित्र बनाना'
      ),
      t(
        'Action rhyme with seated alternatives',
        'ഇരുന്നും പങ്കെടുക്കാവുന്ന ചലനപ്പാട്ട്',
        'बैठकर भी करने योग्य क्रिया कविता'
      ),
    ],
    _source: 'TEMPLATE',
  };
}
