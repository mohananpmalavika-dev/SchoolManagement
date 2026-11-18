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
      'Use the large outlines on the printable sheet. Choose colours and create a picture connected to the theme. Ask: “Tell me about your picture.” Offer chunky crayons. Staying inside the outline is optional.',
      'പ്രിന്റ് ചെയ്യാവുന്ന ഷീറ്റിലെ വലിയ ആകൃതികൾ ഉപയോഗിക്കുക. ഇഷ്ടനിറങ്ങൾ തിരഞ്ഞെടുത്ത് വിഷയവുമായി ബന്ധപ്പെട്ട ചിത്രം ഉണ്ടാക്കട്ടെ. “ചിത്രത്തെക്കുറിച്ച് പറയാമോ?” എന്ന് ചോദിക്കുക. വലിയ ക്രയോണുകൾ നൽകുക. വരയ്ക്കുള്ളിൽ മാത്രം നിറയ്ക്കണമെന്ന് നിർബന്ധിക്കരുത്.',
      'प्रिंट पन्ने के बड़े आकारों में मनपसंद रंग भरकर विषय से जुड़ा चित्र बनाएँ। पूछें “अपने चित्र के बारे में बताओ।” मोटे क्रेयॉन दें। रेखा के भीतर रंगना ज़रूरी नहीं है।'
    ),
    WORKSHEET: t(
      '1. Point to two matching shapes.\n2. Connect matching shapes with a line or a finger.\n3. Draw something you noticed about the theme in the blank box.\n4. Tell an adult about your drawing; the adult can write your words.\nNo score or time limit.',
      '1. ഒരുപോലെയുള്ള ആകൃതികൾ ചൂണ്ടിക്കാണിക്കുക.\n2. വരകൊണ്ടോ വിരൽകൊണ്ടോ അവയെ ബന്ധിപ്പിക്കുക.\n3. വിഷയത്തിൽ ശ്രദ്ധിച്ച കാര്യം ഒഴിഞ്ഞ കളത്തിൽ വരയ്ക്കുക.\n4. ചിത്രത്തെക്കുറിച്ച് പറയുക. മുതിർന്നവർ കുട്ടിയുടെ വാക്കുകൾ എഴുതട്ടെ.\nമാർക്കും സമയപരിധിയും വേണ്ട.',
      '1. दो एक जैसे आकार दिखाएँ।\n2. मिलते आकारों को रेखा या उँगली से जोड़ें।\n3. खाली खाने में विषय से जुड़ा चित्र बनाएँ।\n4. चित्र के बारे में बताएँ; वयस्क बच्चे के शब्द लिख सकता है।\nअंक या समय सीमा न रखें।'
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
