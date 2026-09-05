/**
 * Auth language helper — the SINGLE language state shared by the Login/Signup
 * pages and errorHandler.parseApiError().
 *
 * One localStorage key ("language") holds the selection made on Login/Signup
 * ("en" | "hi" | "gu"). Nothing else in the application reads this key — the
 * main application intentionally stays in English.
 */

export const LANGUAGE_STORAGE_KEY = "language";

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "gu", label: "ગુજરાતી" },
];

function normalizeLanguage(lang) {
  return lang === "hi" || lang === "gu" ? lang : "en";
}

export function getSavedLanguage() {
  try {
    return normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return "en";
  }
}

export function saveLanguage(lang) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizeLanguage(lang));
  } catch {
    /* storage unavailable — selection stays in-memory only */
  }
}

/* ── Login page strings ─────────────────────────────────── */
export const LOGIN_TRANSLATIONS = {
  en: {
    signIn: "Sign In",
    subtitle: "Select your role and authenticate to continue.",
    workEmail: "Work Email",
    password: "Password",
    forgotPassword: "Forgot password?",
    signingIn: "Signing in...",
    dontHaveAccount: "Don't have an account?",
    createOneFree: "Create one for free",
    signInFailed: "Sign in failed. Please try again.",
    emailRequired: "Work email is required.",
    emailInvalid: "Enter a valid email address.",
    passwordRequired: "Password is required.",
    passwordMinLength: "Password must be at least 6 characters.",
    rolePortal: {
      customer: "Customer Portal",
      sales_executive: "Sales Executive Portal",
      admin: "Admin Portal",
    },
    pitchTitle: "Close better deals.",
    pitchHighlight: "Faster. Together.",
    pitch: "DealFlow360 connects your sales team, customers, and finance in one seamless negotiation and approval platform — purpose-built for B2B commerce.",
    features: [
      "Real-time quotation negotiation & counter-offers",
      "Multi-level approval workflows with audit logs",
      "Customer self-service portal with live pricing",
    ],
  },
  hi: {
    signIn: "साइन इन करें",
    subtitle: "जारी रखने के लिए अपनी भूमिका चुनें और प्रमाणीकरण करें।",
    workEmail: "कार्य ईमेल",
    password: "पासवर्ड",
    forgotPassword: "पासवर्ड भूल गए?",
    signingIn: "साइन इन हो रहा है...",
    dontHaveAccount: "खाता नहीं है?",
    createOneFree: "मुफ़्त में बनाएं",
    signInFailed: "साइन इन विफल रहा। कृपया पुनः प्रयास करें।",
    emailRequired: "कार्य ईमेल आवश्यक है।",
    emailInvalid: "मान्य ईमेल पता दर्ज करें।",
    passwordRequired: "पासवर्ड आवश्यक है।",
    passwordMinLength: "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।",
    rolePortal: {
      customer: "ग्राहक पोर्टल",
      sales_executive: "सेल्स एग्जीक्यूटिव पोर्टल",
      admin: "एडमिन पोर्टल",
    },
    pitchTitle: "बेहतर सौदे करें।",
    pitchHighlight: "तेज़। साथ मिलकर।",
    pitch: "DealFlow360 आपकी सेल्स टीम, ग्राहकों और वित्त को एक ही सहज नेगोशिएशन और अप्रूवल प्लेटफ़ॉर्म में जोड़ता है — खास तौर पर B2B कॉमर्स के लिए बनाया गया।",
    features: [
      "रीयल-टाइम कोटेशन नेगोशिएशन और काउंटर-ऑफ़र",
      "ऑडिट लॉग के साथ मल्टी-लेवल अप्रूवल वर्कफ़्लो",
      "लाइव प्राइसिंग के साथ ग्राहक सेल्फ़-सर्विस पोर्टल",
    ],
  },
  gu: {
    signIn: "સાઇન ઇન કરો",
    subtitle: "ચાલુ રાખવા માટે તમારી ભૂમિકા પસંદ કરો અને પ્રમાણીકરણ કરો.",
    workEmail: "કામનું ઈમેલ",
    password: "પાસવર્ડ",
    forgotPassword: "પાસવર્ડ ભૂલી ગયા છો?",
    signingIn: "સાઇન ઇન થઈ રહ્યું છે...",
    dontHaveAccount: "ખાતું નથી?",
    createOneFree: "મફતમાં બનાવો",
    signInFailed: "સાઇન ઇન નિષ્ફળ ગયું. કૃપા કરીને ફરી પ્રયાસ કરો.",
    emailRequired: "કામનું ઈમેલ જરૂરી છે.",
    emailInvalid: "માન્ય ઈમેલ સરનામું દાખલ કરો.",
    passwordRequired: "પાસવર્ડ જરૂરી છે.",
    passwordMinLength: "પાસવર્ડ ઓછામાં ઓછા 6 અક્ષરોનો હોવો જોઈએ.",
    rolePortal: {
      customer: "ગ્રાહક પોર્ટલ",
      sales_executive: "સેલ્સ એક્ઝિક્યુટિવ પોર્ટલ",
      admin: "એડમિન પોર્ટલ",
    },
    pitchTitle: "વધુ સારા સોદા કરો.",
    pitchHighlight: "ઝડપથી. સાથે મળીને.",
    pitch: "DealFlow360 તમારી સેલ્સ ટીમ, ગ્રાહકો અને નાણાંને એક જ સરળ નેગોશિએશન અને એપ્રૂવલ પ્લેટફોર્મમાં જોડે છે — ખાસ B2B કોમર્સ માટે બનાવેલું.",
    features: [
      "રીયલ-ટાઇમ કોટેશન નેગોશિએશન અને કાઉન્ટર-ઓફર",
      "ઓડિટ લોગ સાથે મલ્ટી-લેવલ એપ્રૂવલ વર્કફ્લો",
      "લાઇવ પ્રાઇસિંગ સાથે ગ્રાહક સેલ્ફ-સર્વિસ પોર્ટલ",
    ],
  },
};

/* ── Signup page strings ────────────────────────────────── */
export const SIGNUP_TRANSLATIONS = {
  en: {
    step: "Step",
    of: "of",
    back: "Back",
    accountCreated: "Account created!",
    welcome: "Welcome to DealFlow360,",
    redirecting: "Redirecting to sign in...",
    yourWorkEmail: "Your work email",
    emailHint: "If your company already uses DealFlow360, we'll connect you automatically.",
    continueBtn: "Continue",
    alreadyHaveAccount: "Already have an account?",
    signIn: "Sign in",
    createYourAccount: "Create Your Account",
    fullName: "Full Name",
    phoneNumber: "Phone number",
    password: "Password",
    passwordPlaceholder: "Min 8 chars, uppercase, number",
    confirmPassword: "Confirm Password",
    confirmPlaceholder: "Re-enter password",
    legalPrefix: "By signing up, I agree to the Company's",
    privacy: "Privacy Statement",
    legalAnd: "and",
    terms: "Terms of Service",
    legalSuffix: "",
    creatingAccount: "Creating account...",
    createAccount: "Create Account",
    signupFailed: "Signup failed. Please try again.",
    leftTitle: "Stop losing deals to slow approvals.",
    leftTagline: "Start negotiating. Start winning.",
    leftFeatures: [
      "Real-time counter-offers between customer & sales",
      "Multi-level approval engine with governance rules",
      "Customer self-service portal with live pricing",
    ],
    emailRequired: "Work email is required.",
    emailInvalid: "Enter a valid work email address.",
    nameRequired: "Full name is required.",
    nameMinLength: "Name must be at least 2 characters.",
    phoneRequired: "Phone number is required.",
    phoneInvalid: "Enter a valid phone number (7-12 digits).",
    passwordRequired: "Password is required.",
    passwordMinLength: "Password must be at least 8 characters.",
    passwordUppercase: "Password must contain at least one uppercase letter.",
    passwordNumber: "Password must contain at least one number.",
    confirmPasswordRequired: "Please confirm your password.",
    passwordsDoNotMatch: "Passwords do not match.",
    strength: { weak: "Weak", fair: "Fair", good: "Good", strong: "Strong" },
  },
  hi: {
    step: "स्टेप",
    of: "/",
    back: "वापस",
    accountCreated: "खाता बन गया!",
    welcome: "DealFlow360 में आपका स्वागत है,",
    redirecting: "साइन इन पर रीडायरेक्ट किया जा रहा है...",
    yourWorkEmail: "आपका कार्य ईमेल",
    emailHint: "अगर आपकी कंपनी पहले से DealFlow360 इस्तेमाल करती है, तो हम आपको अपने आप जोड़ देंगे।",
    continueBtn: "आगे बढ़ें",
    alreadyHaveAccount: "पहले से खाता है?",
    signIn: "साइन इन",
    createYourAccount: "अपना खाता बनाएं",
    fullName: "पूरा नाम",
    phoneNumber: "फ़ोन नंबर",
    password: "पासवर्ड",
    passwordPlaceholder: "कम से कम 8 अक्षर, अपरकेस, नंबर",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    confirmPlaceholder: "पासवर्ड फिर से दर्ज करें",
    legalPrefix: "साइन अप करके, मैं कंपनी की",
    privacy: "प्राइवेसी स्टेटमेंट",
    legalAnd: "और",
    terms: "सेवा की शर्तों",
    legalSuffix: "से सहमत हूँ।",
    creatingAccount: "खाता बनाया जा रहा है...",
    createAccount: "खाता बनाएं",
    signupFailed: "साइन अप विफल रहा। कृपया पुनः प्रयास करें।",
    leftTitle: "धीमी अप्रूवल की वजह से सौदे न खोएं।",
    leftTagline: "नेगोशिएट करना शुरू करें। जीतना शुरू करें।",
    leftFeatures: [
      "ग्राहक और सेल्स के बीच रीयल-टाइम काउंटर-ऑफ़र",
      "गवर्नेंस नियमों के साथ मल्टी-लेवल अप्रूवल इंजन",
      "लाइव प्राइसिंग के साथ ग्राहक सेल्फ़-सर्विस पोर्टल",
    ],
    emailRequired: "कार्य ईमेल आवश्यक है।",
    emailInvalid: "मान्य कार्य ईमेल पता दर्ज करें।",
    nameRequired: "पूरा नाम आवश्यक है।",
    nameMinLength: "नाम कम से कम 2 अक्षरों का होना चाहिए।",
    phoneRequired: "फ़ोन नंबर आवश्यक है।",
    phoneInvalid: "मान्य फ़ोन नंबर दर्ज करें (7-12 अंक)।",
    passwordRequired: "पासवर्ड आवश्यक है।",
    passwordMinLength: "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।",
    passwordUppercase: "पासवर्ड में कम से कम एक बड़ा अक्षर होना चाहिए।",
    passwordNumber: "पासवर्ड में कम से कम एक नंबर होना चाहिए।",
    confirmPasswordRequired: "कृपया पासवर्ड की पुष्टि करें।",
    passwordsDoNotMatch: "पासवर्ड मेल नहीं खाते।",
    strength: { weak: "कमज़ोर", fair: "ठीक-ठाक", good: "अच्छा", strong: "मज़बूत" },
  },
  gu: {
    step: "સ્ટેપ",
    of: "/",
    back: "પાછળ",
    accountCreated: "ખાતું બની ગયું!",
    welcome: "DealFlow360 માં આપનું સ્વાગત છે,",
    redirecting: "સાઇન ઇન પર રીડાયરેક્ટ કરવામાં આવી રહ્યું છે...",
    yourWorkEmail: "તમારું કામનું ઈમેલ",
    emailHint: "જો તમારી કંપની પહેલેથી DealFlow360 વાપરે છે, તો અમે તમને આપપે આપ કનેક્ટ કરીશું.",
    continueBtn: "આગળ વધો",
    alreadyHaveAccount: "પહેલેથી ખાતું છે?",
    signIn: "સાઇન ઇન",
    createYourAccount: "તમારું ખાતું બનાવો",
    fullName: "પૂરું નામ",
    phoneNumber: "ફોન નંબર",
    password: "પાસવર્ડ",
    passwordPlaceholder: "ઓછામાં ઓછા 8 અક્ષરો, કેપિટલ, નંબર",
    confirmPassword: "પાસવર્ડની પુષ્ટિ કરો",
    confirmPlaceholder: "પાસવર્ડ ફરી દાખલ કરો",
    legalPrefix: "સાઇન અપ કરીને, હું કંપનીની",
    privacy: "પ્રાઇવસી સ્ટેટમેન્ટ",
    legalAnd: "અને",
    terms: "સેવાની શરતો",
    legalSuffix: "સાથે સંમત છું.",
    creatingAccount: "ખાતું બનાવવામાં આવી રહ્યું છે...",
    createAccount: "ખાતું બનાવો",
    signupFailed: "સાઇન અપ નિષ્ફળ ગયું. કૃપા કરીને ફરી પ્રયાસ કરો.",
    leftTitle: "ધીમી એપ્રૂવલ્સને કારણે સોદા ગુમ ન કરો.",
    leftTagline: "નેગોશિએટ કરવાનું શરૂ કરો. જીતવાનું શરૂ કરો.",
    leftFeatures: [
      "ગ્રાહક અને સેલ્સ વચ્ચે રીયલ-ટાઇમ કાઉન્ટર-ઓફર",
      "ગવર્નન્સ નિયમો સાથે મલ્ટી-લેવલ એપ્રૂવલ એન્જિન",
      "લાઇવ પ્રાઇસિંગ સાથે ગ્રાહક સેલ્ફ-સર્વિસ પોર્ટલ",
    ],
    emailRequired: "કામનું ઈમેલ જરૂરી છે.",
    emailInvalid: "માન્ય કામનું ઈમેલ સરનામું દાખલ કરો.",
    nameRequired: "પૂરું નામ જરૂરી છે.",
    nameMinLength: "નામ ઓછામાં ઓછા 2 અક્ષરોનું હોવું જોઈએ.",
    phoneRequired: "ફોન નંબર જરૂરી છે.",
    phoneInvalid: "માન્ય ફોન નંબર દાખલ કરો (7-12 અંક).",
    passwordRequired: "પાસવર્ડ જરૂરી છે.",
    passwordMinLength: "પાસવર્ડ ઓછામાં ઓછા 8 અક્ષરોનો હોવો જોઈએ.",
    passwordUppercase: "પાસવર્ડમાં ઓછામાં ઓછો એક કેપિટલ લેટર હોવો જોઈએ.",
    passwordNumber: "પાસવર્ડમાં ઓછામાં ઓછો એક નંબર હોવો જોઈએ.",
    confirmPasswordRequired: "કૃપા કરીને તમારો પાસવર્ડ કન્ફર્મ કરો.",
    passwordsDoNotMatch: "પાસવર્ડ મેળ ખાતા નથી.",
    strength: { weak: "નબળો", fair: "બરાબર", good: "સારો", strong: "મજબૂત" },
  },
};

