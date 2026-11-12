// Trilingual Support: English, Hindi (हिन्दी), and Malayalam (മലയാളം)

export interface Translations {
  // Common
  common: {
    appName: string;
    welcome: string;
    login: string;
    logout: string;
    email: string;
    password: string;
    phone: string;
    name: string;
    firstName: string;
    lastName: string;
    address: string;
    submit: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    view: string;
    search: string;
    filter: string;
    refresh: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    yes: string;
    no: string;
    all: string;
    none: string;
    select: string;
    download: string;
    upload: string;
    back: string;
    next: string;
    close: string;
    open: string;
    settings: string;
    dashboard: string;
    profileSettings: string;
    helpSupport: string;
    school: string;
    schoolWorkspace: string;
    connectedSchool: string;
    betterSchoolDays: string;
    brighterFutures: string;
    workspaceDescription: string;
    peopleConnected: string;
    learningSupported: string;
    accessProtected: string;
    placeToGrow: string;
    oneCommunity: string;
    welcomeToKrypton: string;
    organizedSchools: string;
  };

  // Auth
  auth: {
    signIn: string;
    signOut: string;
    forgotPassword: string;
    rememberMe: string;
    email: string;
    password: string;
    emailAddress: string;
    enterPassword: string;
    invalidCredentials: string;
    loginSuccess: string;
    logoutSuccess: string;
    sessionExpired: string;
    signingIn: string;
    goodToSeeYou: string;
    signInToWorkspace: string;
    workspaceRouting: string;
    unableToSignIn: string;
    showPassword: string;
    hidePassword: string;
    accessAssigned: string;
    needHelpContact: string;
    needHelp: string;
    contactSupport: string;
    demoCredentials: string;
  };

  // Parent Portal
  parent: {
    family: string;
    portalLogin: string;
    dashboard: string;
    fees: string;
    attendance: string;
    grades: string;
    notifications: string;
    myChildren: string;
    feeBalance: string;
    attendanceRate: string;
    recentGrades: string;
    payFees: string;
    viewAttendance: string;
    viewGrades: string;
    outstanding: string;
    paid: string;
    pending: string;
    payNow: string;
    paymentHistory: string;
    invoices: string;
    receipts: string;
    upiPayment: string;
    enterAmount: string;
    enterPhoneNumber: string;
    paymentSuccess: string;
    paymentFailed: string;
    present: string;
    absent: string;
    late: string;
    excused: string;
    viewReportCard: string;
    downloadReport: string;
    termResults: string;
    subjectPerformance: string;
    overallGrade: string;
    classPosition: string;
    teacherComment: string;
    unreadNotifications: string;
    readAll: string;
    feeReminder: string;
    absenceAlert: string;
    examSchedule: string;
    schoolAnnouncement: string;
  };

  // Teacher Portal
  teacher: {
    portalLogin: string;
    teacherPortal: string;
    teacher: string;
    teaching: string;
    onlyTeachersAllowed: string;
    notATeacher: string;
    parentPortal: string;
    dashboard: string;
    myClasses: string;
    attendance: string;
    grades: string;
    timetable: string;
    performance: string;
    messages: string;
    todaySchedule: string;
    pendingTasks: string;
    classOverview: string;
    markAttendance: string;
    enterGrades: string;
    viewTimetable: string;
    studentList: string;
    classReport: string;
    sendMessage: string;
    unmarkedAttendance: string;
    ungradedAssignments: string;
    unreadMessages: string;
    upcomingClasses: string;
    selectClass: string;
    selectPeriod: string;
    selectDate: string;
    markAllPresent: string;
    markAllAbsent: string;
    submitAttendance: string;
    attendanceMarked: string;
    selectSubject: string;
    selectAssessment: string;
    enterMarks: string;
    maximumMarks: string;
    averageGrade: string;
    highestScore: string;
    lowestScore: string;
    passRate: string;
    submitGrades: string;
    gradesSubmitted: string;
    weekView: string;
    todayView: string;
    currentPeriod: string;
    freeSlot: string;
    performanceAnalytics: string;
    atRiskStudents: string;
    topPerformers: string;
    improvementTrend: string;
    attendanceTrend: string;
    needsAttention: string;
    excellentWork: string;
    composeMessage: string;
    sendToParents: string;
    sendToClass: string;
    messageSubject: string;
    messageBody: string;
    sendViaSMS: string;
    sendViaEmail: string;
    messageSent: string;
    replyReceived: string;
    mobileNav: {
      home: string;
      classes: string;
      attend: string;
      grades: string;
      messages: string;
    };
  };

  // Admin Portal
  admin: {
    platformAdmin: string;
    superAdmin: string;
    administration: string;
    platform: string;
    platformAdministrator: string;
    securityMFA: string;
    auditLogs: string;
    dashboard: string;
    schools: string;
    subscriptions: string;
    users: string;
    systemMonitoring: string;
    support: string;
    reports: string;
    totalSchools: string;
    activeSchools: string;
    trialSchools: string;
    suspendedSchools: string;
    totalStudents: string;
    totalStaff: string;
    monthlyRevenue: string;
    annualRevenue: string;
    pendingPayments: string;
    systemHealth: string;
    recentActivity: string;
    criticalAlerts: string;
    addSchool: string;
    manageSchools: string;
    schoolDetails: string;
    activateSchool: string;
    suspendSchool: string;
    subscriptionPlan: string;
    expiryDate: string;
    renewSubscription: string;
    cancelSubscription: string;
    paymentMethod: string;
    transactionReference: string;
    manageUsers: string;
    createUser: string;
    userRole: string;
    lastLogin: string;
    mfaEnabled: string;
    suspendUser: string;
    activateUser: string;
    uptime: string;
    apiResponse: string;
    databaseStatus: string;
    storageUsage: string;
    activeConnections: string;
    errorRate: string;
    cpuUsage: string;
    memoryUsage: string;
    diskUsage: string;
    serviceHealth: string;
    backupHistory: string;
    runBackup: string;
    supportTickets: string;
    openTickets: string;
    resolvedTickets: string;
    ticketPriority: string;
    announcements: string;
    createAnnouncement: string;
    publishAnnouncement: string;
    mobileNav: {
      dashboard: string;
      schools: string;
      billing: string;
      system: string;
    };
  };

  // Status
  status: {
    active: string;
    inactive: string;
    pending: string;
    approved: string;
    rejected: string;
    completed: string;
    inProgress: string;
    cancelled: string;
    failed: string;
    success: string;
    expired: string;
    trial: string;
    suspended: string;
  };

  // Days & Months
  calendar: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
    january: string;
    february: string;
    march: string;
    april: string;
    may: string;
    june: string;
    july: string;
    august: string;
    september: string;
    october: string;
    november: string;
    december: string;
    today: string;
    yesterday: string;
    tomorrow: string;
    thisWeek: string;
    thisMonth: string;
    thisYear: string;
  };

  // Messages
  messages: {
    confirmDelete: string;
    confirmSuspend: string;
    confirmActivate: string;
    confirmCancel: string;
    operationSuccess: string;
    operationFailed: string;
    noDataFound: string;
    loadingData: string;
    savingChanges: string;
    changesSaved: string;
    errorOccurred: string;
    tryAgain: string;
    areYouSure: string;
    cannotBeUndone: string;
  };
}

export const translations: Record<'en' | 'hi' | 'ml', Translations> = {
  // ENGLISH
  en: {
    common: {
      dashboard: 'Dashboard',
      profileSettings: 'Account settings',
      helpSupport: 'Help & support',
      school: 'School',
      schoolWorkspace: 'SCHOOL WORKSPACE',
      connectedSchool: 'THE CONNECTED SCHOOL',
      betterSchoolDays: 'Better school days.',
      brighterFutures: 'Brighter futures.',
      workspaceDescription: 'A thoughtful workspace for the people who make education happen. Stay connected, simplify the everyday, and keep learning at the heart of it all.',
      peopleConnected: 'People, connected',
      learningSupported: 'Learning, supported',
      accessProtected: 'Access, protected',
      placeToGrow: 'A place to grow.',
      oneCommunity: 'One school. One community. One workspace.',
      welcomeToKrypton: 'WELCOME TO HUSTLERTECH',
      organizedSchools: 'Organized schools. Empowered people.',
      appName: 'HustlerTech School ERP',
      welcome: 'Welcome',
      login: 'Login',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      phone: 'Phone',
      name: 'Name',
      firstName: 'First Name',
      lastName: 'Last Name',
      address: 'Address',
      submit: 'Submit',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      search: 'Search',
      filter: 'Filter',
      refresh: 'Refresh',
      loading: 'Loading',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information',
      yes: 'Yes',
      no: 'No',
      all: 'All',
      none: 'None',
      select: 'Select',
      download: 'Download',
      upload: 'Upload',
      back: 'Back',
      next: 'Next',
      close: 'Close',
      open: 'Open',
      settings: 'Settings',
    },
    auth: {
      email: 'Email address',
      password: 'Password',
      signingIn: 'Signing in…',
      goodToSeeYou: 'Good to see you.',
      signInToWorkspace: 'One account. Your school workspace.',
      workspaceRouting: 'Sign in and we will take you to the workspace assigned to your account.',
      unableToSignIn: 'Unable to sign in. Check your details and try again.',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      accessAssigned: 'Access is assigned by your school administrator.',
      needHelpContact: 'Need help signing in? Contact your school office.',
      needHelp: 'Need help?',
      contactSupport: 'Contact your school office.',
      demoCredentials: 'Local demo accounts',
      signIn: 'Sign In',
      signOut: 'Sign Out',
      forgotPassword: 'Forgot Password?',
      rememberMe: 'Remember Me',
      emailAddress: 'Email Address',
      enterPassword: 'Enter your password',
      invalidCredentials: 'Invalid email or password',
      loginSuccess: 'Login successful',
      logoutSuccess: 'Logged out successfully',
      sessionExpired: 'Your session has expired',
    },
    parent: {
      portalLogin: 'Family portal sign-in',
      family: 'family',
      dashboard: 'Dashboard',
      fees: 'Fees',
      attendance: 'Attendance',
      grades: 'Grades',
      notifications: 'Notifications',
      myChildren: 'My Children',
      feeBalance: 'Fee Balance',
      attendanceRate: 'Attendance Rate',
      recentGrades: 'Recent Grades',
      payFees: 'Pay Fees',
      viewAttendance: 'View Attendance',
      viewGrades: 'View Grades',
      outstanding: 'Outstanding',
      paid: 'Paid',
      pending: 'Pending',
      payNow: 'Pay Now',
      paymentHistory: 'Payment History',
      invoices: 'Invoices',
      receipts: 'Receipts',
      upiPayment: 'UPI / Razorpay Payment',
      enterAmount: 'Enter Amount (₹)',
      enterPhoneNumber: 'Enter Mobile Number (+91)',
      paymentSuccess: 'Payment successful',
      paymentFailed: 'Payment failed',
      present: 'Present',
      absent: 'Absent',
      late: 'Late',
      excused: 'Excused',
      viewReportCard: 'View Report Card',
      downloadReport: 'Download Report',
      termResults: 'Term Results',
      subjectPerformance: 'Subject Performance',
      overallGrade: 'Overall Grade',
      classPosition: 'Class Rank',
      teacherComment: 'Teacher Comment',
      unreadNotifications: 'Unread Notifications',
      readAll: 'Mark All Read',
      feeReminder: 'Fee Reminder',
      absenceAlert: 'Absence Alert',
      examSchedule: 'Exam Schedule',
      schoolAnnouncement: 'School Announcement',
    },
    teacher: {
      portalLogin: 'Teacher portal sign-in',
      teacherPortal: 'Teacher portal',
      teacher: 'Teacher',
      teaching: 'teaching',
      onlyTeachersAllowed: 'This workspace is for teachers.',
      notATeacher: 'Choose the portal for your role.',
      parentPortal: 'Family portal',
      mobileNav: { home: 'Home', classes: 'Classes', attend: 'Attendance', grades: 'Grades', messages: 'Messages' },
      dashboard: 'Dashboard',
      myClasses: 'My Classes',
      attendance: 'Attendance',
      grades: 'Grades',
      timetable: 'Timetable',
      performance: 'Performance',
      messages: 'Messages',
      todaySchedule: "Today's Schedule",
      pendingTasks: 'Pending Tasks',
      classOverview: 'Class Overview',
      markAttendance: 'Mark Attendance',
      enterGrades: 'Enter Grades',
      viewTimetable: 'View Timetable',
      studentList: 'Student List',
      classReport: 'Class Report',
      sendMessage: 'Send Message',
      unmarkedAttendance: 'Unmarked Attendance',
      ungradedAssignments: 'Ungraded Assignments',
      unreadMessages: 'Unread Messages',
      upcomingClasses: 'Upcoming Classes',
      selectClass: 'Select Class',
      selectPeriod: 'Select Period',
      selectDate: 'Select Date',
      markAllPresent: 'Mark All Present',
      markAllAbsent: 'Mark All Absent',
      submitAttendance: 'Submit Attendance',
      attendanceMarked: 'Attendance marked successfully',
      selectSubject: 'Select Subject',
      selectAssessment: 'Select Assessment',
      enterMarks: 'Enter Marks',
      maximumMarks: 'Maximum Marks',
      averageGrade: 'Average Grade',
      highestScore: 'Highest Score',
      lowestScore: 'Lowest Score',
      passRate: 'Pass Rate',
      submitGrades: 'Submit Grades',
      gradesSubmitted: 'Grades submitted successfully',
      weekView: 'Week View',
      todayView: 'Today View',
      currentPeriod: 'Current Period',
      freeSlot: 'Free',
      performanceAnalytics: 'Performance Analytics',
      atRiskStudents: 'At-Risk Students',
      topPerformers: 'Top Performers',
      improvementTrend: 'Improvement Trend',
      attendanceTrend: 'Attendance Trend',
      needsAttention: 'Needs Attention',
      excellentWork: 'Excellent Work',
      composeMessage: 'Compose Message',
      sendToParents: 'Send to Parents',
      sendToClass: 'Send to Class',
      messageSubject: 'Subject',
      messageBody: 'Message',
      sendViaSMS: 'Send via SMS',
      sendViaEmail: 'Send via Email',
      messageSent: 'Message sent successfully',
      replyReceived: 'Reply received',
    },
    admin: {
      superAdmin: 'SUPER ADMIN',
      administration: 'administration',
      platform: 'Platform',
      platformAdministrator: 'Platform administrator',
      securityMFA: 'Security & MFA',
      auditLogs: 'Audit logs',
      mobileNav: { dashboard: 'Dashboard', schools: 'Schools', billing: 'Billing', system: 'System' },
      platformAdmin: 'Platform Admin',
      dashboard: 'Dashboard',
      schools: 'Schools',
      subscriptions: 'Subscriptions',
      users: 'Users',
      systemMonitoring: 'System Monitoring',
      support: 'Support',
      reports: 'Reports',
      totalSchools: 'Total Schools',
      activeSchools: 'Active Schools',
      trialSchools: 'Trial Schools',
      suspendedSchools: 'Suspended Schools',
      totalStudents: 'Total Students',
      totalStaff: 'Total Staff',
      monthlyRevenue: 'Monthly Revenue',
      annualRevenue: 'Annual Revenue',
      pendingPayments: 'Pending Payments',
      systemHealth: 'System Health',
      recentActivity: 'Recent Activity',
      criticalAlerts: 'Critical Alerts',
      addSchool: 'Add School',
      manageSchools: 'Manage Schools',
      schoolDetails: 'School Details',
      activateSchool: 'Activate School',
      suspendSchool: 'Suspend School',
      subscriptionPlan: 'Subscription Plan',
      expiryDate: 'Expiry Date',
      renewSubscription: 'Renew Subscription',
      cancelSubscription: 'Cancel Subscription',
      paymentMethod: 'Payment Method',
      transactionReference: 'Transaction Reference',
      manageUsers: 'Manage Users',
      createUser: 'Create User',
      userRole: 'User Role',
      lastLogin: 'Last Login',
      mfaEnabled: 'MFA Enabled',
      suspendUser: 'Suspend User',
      activateUser: 'Activate User',
      uptime: 'Uptime',
      apiResponse: 'API Response',
      databaseStatus: 'Database Status',
      storageUsage: 'Storage Usage',
      activeConnections: 'Active Connections',
      errorRate: 'Error Rate',
      cpuUsage: 'CPU Usage',
      memoryUsage: 'Memory Usage',
      diskUsage: 'Disk Usage',
      serviceHealth: 'Service Health',
      backupHistory: 'Backup History',
      runBackup: 'Run Backup',
      supportTickets: 'Support Tickets',
      openTickets: 'Open Tickets',
      resolvedTickets: 'Resolved Tickets',
      ticketPriority: 'Priority',
      announcements: 'Announcements',
      createAnnouncement: 'Create Announcement',
      publishAnnouncement: 'Publish Announcement',
    },
    status: {
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
      inProgress: 'In Progress',
      cancelled: 'Cancelled',
      failed: 'Failed',
      success: 'Success',
      expired: 'Expired',
      trial: 'Trial',
      suspended: 'Suspended',
    },
    calendar: {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
      january: 'January',
      february: 'February',
      march: 'March',
      april: 'April',
      may: 'May',
      june: 'June',
      july: 'July',
      august: 'August',
      september: 'September',
      october: 'October',
      november: 'November',
      december: 'December',
      today: 'Today',
      yesterday: 'Yesterday',
      tomorrow: 'Tomorrow',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      thisYear: 'This Year',
    },
    messages: {
      confirmDelete: 'Are you sure you want to delete this?',
      confirmSuspend: 'Are you sure you want to suspend this?',
      confirmActivate: 'Are you sure you want to activate this?',
      confirmCancel: 'Are you sure you want to cancel?',
      operationSuccess: 'Operation completed successfully',
      operationFailed: 'Operation failed',
      noDataFound: 'No data found',
      loadingData: 'Loading data...',
      savingChanges: 'Saving changes...',
      changesSaved: 'Changes saved successfully',
      errorOccurred: 'An error occurred',
      tryAgain: 'Please try again',
      areYouSure: 'Are you sure?',
      cannotBeUndone: 'This action cannot be undone',
    },
  },

  // HINDI (हिन्दी)
  hi: {
    common: {
      dashboard: 'डैशबोर्ड',
      profileSettings: 'खाता सेटिंग्स',
      helpSupport: 'सहायता एवं समर्थन',
      school: 'विद्यालय',
      schoolWorkspace: 'विद्यालय कार्यक्षेत्र',
      connectedSchool: 'जुड़ा हुआ विद्यालय',
      betterSchoolDays: 'बेहतर विद्यालय दिवस।',
      brighterFutures: 'उज्ज्वल भविष्य।',
      workspaceDescription: 'शिक्षा को संभव बनाने वाले सभी लोगों के लिए एक सुव्यवस्थित कार्यक्षेत्र। जुड़े रहें, दैनिक कार्य सरल बनाएं और सीखने को केंद्र में रखें।',
      peopleConnected: 'जुड़े हुए लोग',
      learningSupported: 'शिक्षण सहयोग',
      accessProtected: 'सुरक्षित पहुँच',
      placeToGrow: 'विकास का स्थान।',
      oneCommunity: 'एक विद्यालय। एक समुदाय। एक कार्यक्षेत्र।',
      welcomeToKrypton: 'हसलरटेक में स्वागत है',
      organizedSchools: 'सुसंगठित विद्यालय। सशक्त लोग।',
      appName: 'HustlerTech स्कूल ईआरपी',
      welcome: 'स्वागत है',
      login: 'लॉगिन',
      logout: 'लॉगआउट',
      email: 'ईमेल',
      password: 'पासवर्ड',
      phone: 'फ़ोन',
      name: 'नाम',
      firstName: 'प्रथम नाम',
      lastName: 'अंतिम नाम',
      address: 'पता',
      submit: 'जमा करें',
      cancel: 'रद्द करें',
      save: 'सहेजें',
      delete: 'हटाएं',
      edit: 'संपादित करें',
      view: 'देखें',
      search: 'खोजें',
      filter: 'फ़िल्टर',
      refresh: 'ताज़ा करें',
      loading: 'लोड हो रहा है',
      error: 'त्रुटि',
      success: 'सफल',
      warning: 'चेतावनी',
      info: 'जानकारी',
      yes: 'हाँ',
      no: 'नहीं',
      all: 'सभी',
      none: 'कोई नहीं',
      select: 'चुनें',
      download: 'डाउनलोड',
      upload: 'अपलोड',
      back: 'वापस',
      next: 'अगला',
      close: 'बंद करें',
      open: 'खोलें',
      settings: 'सेटिंग्स',
    },
    auth: {
      email: 'ईमेल पता',
      password: 'पासवर्ड',
      signingIn: 'साइन इन हो रहा है…',
      goodToSeeYou: 'आपका पुनः स्वागत है।',
      signInToWorkspace: 'एक खाता। आपका विद्यालय कार्यक्षेत्र।',
      workspaceRouting: 'साइन इन करें और हम आपको आपके खाते के कार्यक्षेत्र में ले जाएंगे।',
      unableToSignIn: 'साइन इन नहीं हो सका। विवरण जांचें और पुनः प्रयास करें।',
      showPassword: 'पासवर्ड दिखाएं',
      hidePassword: 'पासवर्ड छिपाएं',
      accessAssigned: 'पहुँच आपके विद्यालय प्रशासक द्वारा प्रदान की जाती है।',
      needHelpContact: 'साइन इन में सहायता चाहिए? विद्यालय कार्यालय से संपर्क करें।',
      needHelp: 'सहायता चाहिए?',
      contactSupport: 'विद्यालय कार्यालय से संपर्क करें।',
      demoCredentials: 'डेमो खाते',
      signIn: 'साइन इन',
      signOut: 'साइन आउट',
      forgotPassword: 'पासवर्ड भूल गए?',
      rememberMe: 'मुझे याद रखें',
      emailAddress: 'ईमेल पता',
      enterPassword: 'अपना पासवर्ड दर्ज करें',
      invalidCredentials: 'अमान्य ईमेल या पासवर्ड',
      loginSuccess: 'लॉगिन सफल रहा',
      logoutSuccess: 'सफलतापूर्वक लॉगआउट हो गए',
      sessionExpired: 'आपका सत्र समाप्त हो गया है',
    },
    parent: {
      portalLogin: 'अभिभावक पोर्टल लॉगिन',
      family: 'परिवार',
      dashboard: 'डैशबोर्ड',
      fees: 'शुल्क',
      attendance: 'उपस्थिति',
      grades: 'अंक एवं ग्रेड',
      notifications: 'सूचनाएं',
      myChildren: 'मेरे बच्चे',
      feeBalance: 'बकाया शुल्क',
      attendanceRate: 'उपस्थिति दर',
      recentGrades: 'हाल के परिणाम',
      payFees: 'शुल्क भुगतान करें',
      viewAttendance: 'उपस्थिति देखें',
      viewGrades: 'अंक देखें',
      outstanding: 'बकाया',
      paid: 'भुगतान किया गया',
      pending: 'लंबित',
      payNow: 'अभी भुगतान करें',
      paymentHistory: 'भुगतान इतिहास',
      invoices: 'चालान',
      receipts: 'रसीदें',
      upiPayment: 'UPI / Razorpay भुगतान',
      enterAmount: 'राशि दर्ज करें (₹)',
      enterPhoneNumber: 'मोबाइल नंबर दर्ज करें (+91)',
      paymentSuccess: 'भुगतान सफल रहा',
      paymentFailed: 'भुगतान विफल रहा',
      present: 'उपस्थित',
      absent: 'अनुपस्थित',
      late: 'विलंबित',
      excused: 'स्वीकृत अवकाश',
      viewReportCard: 'प्रगति पत्र देखें',
      downloadReport: 'रिपोर्ट डाउनलोड करें',
      termResults: 'सत्र परिणाम',
      subjectPerformance: 'विषयवार प्रदर्शन',
      overallGrade: 'समग्र ग्रेड',
      classPosition: 'कक्षा रैंक',
      teacherComment: 'शिक्षक टिप्पणी',
      unreadNotifications: 'अपठित सूचनाएं',
      readAll: 'सभी को पठित चिह्नित करें',
      feeReminder: 'शुल्क अनुस्मारक',
      absenceAlert: 'अनुपस्थिति सूचना',
      examSchedule: 'परीक्षा समय-सारिणी',
      schoolAnnouncement: 'विद्यालय घोषणा',
    },
    teacher: {
      portalLogin: 'शिक्षक पोर्टल लॉगिन',
      teacherPortal: 'शिक्षक पोर्टल',
      teacher: 'शिक्षक',
      teaching: 'शिक्षण',
      onlyTeachersAllowed: 'यह कार्यक्षेत्र शिक्षकों के लिए है।',
      notATeacher: 'अपनी भूमिका के लिए सही पोर्टल चुनें।',
      parentPortal: 'अभिभावक पोर्टल',
      mobileNav: { home: 'होम', classes: 'कक्षाएं', attend: 'उपस्थिति', grades: 'अंक', messages: 'संदेश' },
      dashboard: 'डैशबोर्ड',
      myClasses: 'मेरी कक्षाएं',
      attendance: 'उपस्थिति',
      grades: 'अंक',
      timetable: 'समय-सारिणी',
      performance: 'प्रदर्शन',
      messages: 'संदेश',
      todaySchedule: 'आज की समय-सारिणी',
      pendingTasks: 'लंबित कार्य',
      classOverview: 'कक्षा सारांश',
      markAttendance: 'उपस्थिति दर्ज करें',
      enterGrades: 'अंक दर्ज करें',
      viewTimetable: 'समय-सारिणी देखें',
      studentList: 'विद्यार्थी सूची',
      classReport: 'कक्षा रिपोर्ट',
      sendMessage: 'संदेश भेजें',
      unmarkedAttendance: 'अचिह्नित उपस्थिति',
      ungradedAssignments: 'अमूल्यांकित कार्य',
      unreadMessages: 'अपठित संदेश',
      upcomingClasses: 'आगामी कक्षाएं',
      selectClass: 'कक्षा चुनें',
      selectPeriod: 'कालांश चुनें',
      selectDate: 'दिनांक चुनें',
      markAllPresent: 'सभी को उपस्थित चिह्नित करें',
      markAllAbsent: 'सभी को अनुपस्थित चिह्नित करें',
      submitAttendance: 'उपस्थिति जमा करें',
      attendanceMarked: 'उपस्थिति सफलतापूर्वक दर्ज हुई',
      selectSubject: 'विषय चुनें',
      selectAssessment: 'मूल्यांकन चुनें',
      enterMarks: 'अंक दर्ज करें',
      maximumMarks: 'अधिकतम अंक',
      averageGrade: 'औसत ग्रेड',
      highestScore: 'उच्चतम अंक',
      lowestScore: 'न्यूनतम अंक',
      passRate: 'उत्तीर्ण दर',
      submitGrades: 'अंक जमा करें',
      gradesSubmitted: 'अंक सफलतापूर्वक जमा किए गए',
      weekView: 'साप्ताहिक दृश्य',
      todayView: 'आज का दृश्य',
      currentPeriod: 'वर्तमान कालांश',
      freeSlot: 'खाली कालांश',
      performanceAnalytics: 'प्रदर्शन विश्लेषण',
      atRiskStudents: 'सहायता की आवश्यकता वाले विद्यार्थी',
      topPerformers: 'शीर्ष विद्यार्थी',
      improvementTrend: 'सुधार प्रवृत्ति',
      attendanceTrend: 'उपस्थिति प्रवृत्ति',
      needsAttention: 'ध्यान आवश्यक',
      excellentWork: 'उत्कृष्ट कार्य',
      composeMessage: 'संदेश लिखें',
      sendToParents: 'अभिभावकों को भेजें',
      sendToClass: 'कक्षा को भेजें',
      messageSubject: 'विषय',
      messageBody: 'संदेश',
      sendViaSMS: 'SMS द्वारा भेजें',
      sendViaEmail: 'ईमेल द्वारा भेजें',
      messageSent: 'संदेश सफलतापूर्वक भेजा गया',
      replyReceived: 'उत्तर प्राप्त हुआ',
    },
    admin: {
      superAdmin: 'सुपर एडमिन',
      administration: 'प्रशासन',
      platform: 'प्लेटफ़ॉर्म',
      platformAdministrator: 'प्लेटफ़ॉर्म प्रशासक',
      securityMFA: 'सुरक्षा एवं MFA',
      auditLogs: 'ऑडिट लॉग्स',
      mobileNav: { dashboard: 'डैशबोर्ड', schools: 'विद्यालय', billing: 'बिलिंग', system: 'सिस्टम' },
      platformAdmin: 'प्लेटफ़ॉर्म एडमिन',
      dashboard: 'डैशबोर्ड',
      schools: 'विद्यालय',
      subscriptions: 'सदस्यताएं',
      users: 'उपयोगकर्ता',
      systemMonitoring: 'सिस्टम निगरानी',
      support: 'सहायता',
      reports: 'रिपोर्ट्स',
      totalSchools: 'कुल विद्यालय',
      activeSchools: 'सक्रिय विद्यालय',
      trialSchools: 'परीक्षण विद्यालय',
      suspendedSchools: 'निलंबित विद्यालय',
      totalStudents: 'कुल विद्यार्थी',
      totalStaff: 'कुल कर्मचारी',
      monthlyRevenue: 'मासिक राजस्व',
      annualRevenue: 'वार्षिक राजस्व',
      pendingPayments: 'लंबित भुगतान',
      systemHealth: 'सिस्टम स्वास्थ्य',
      recentActivity: 'हाल की गतिविधि',
      criticalAlerts: 'महत्वपूर्ण अलर्ट',
      addSchool: 'विद्यालय जोड़ें',
      manageSchools: 'विद्यालय प्रबंधन',
      schoolDetails: 'विद्यालय विवरण',
      activateSchool: 'विद्यालय सक्रिय करें',
      suspendSchool: 'विद्यालय निलंबित करें',
      subscriptionPlan: 'सदस्यता योजना',
      expiryDate: 'समाप्ति तिथि',
      renewSubscription: 'सदस्यता नवीनीकृत करें',
      cancelSubscription: 'सदस्यता रद्द करें',
      paymentMethod: 'भुगतान माध्यम',
      transactionReference: 'लेन-देन संदर्भ',
      manageUsers: 'उपयोगकर्ता प्रबंधन',
      createUser: 'उपयोगकर्ता बनाएं',
      userRole: 'उपयोगकर्ता भूमिका',
      lastLogin: 'अंतिम लॉगिन',
      mfaEnabled: 'MFA सक्रिय',
      suspendUser: 'उपयोगकर्ता निलंबित करें',
      activateUser: 'उपयोगकर्ता सक्रिय करें',
      uptime: 'अपटाइम',
      apiResponse: 'API प्रतिक्रिया',
      databaseStatus: 'डेटाबेस स्थिति',
      storageUsage: 'संग्रहण उपयोग',
      activeConnections: 'सक्रिय कनेक्शन',
      errorRate: 'त्रुटि दर',
      cpuUsage: 'CPU उपयोग',
      memoryUsage: 'मेमोरी उपयोग',
      diskUsage: 'डिस्क उपयोग',
      serviceHealth: 'सेवा स्वास्थ्य',
      backupHistory: 'बैकअप इतिहास',
      runBackup: 'बैकअप चलाएं',
      supportTickets: 'सहायता टिकट',
      openTickets: 'खुले टिकट',
      resolvedTickets: 'हल किए गए टिकट',
      ticketPriority: 'प्राथमिकता',
      announcements: 'घोषणाएं',
      createAnnouncement: 'घोषणा बनाएं',
      publishAnnouncement: 'घोषणा प्रकाशित करें',
    },
    status: {
      active: 'सक्रिय',
      inactive: 'निष्क्रिय',
      pending: 'लंबित',
      approved: 'स्वीकृत',
      rejected: 'अस्वीकृत',
      completed: 'पूर्ण',
      inProgress: 'प्रगति पर',
      cancelled: 'रद्द',
      failed: 'विफल',
      success: 'सफल',
      expired: 'समाप्त',
      trial: 'परीक्षण',
      suspended: 'निलंबित',
    },
    calendar: {
      monday: 'सोमवार',
      tuesday: 'मंगलवार',
      wednesday: 'बुधवार',
      thursday: 'गुरुवार',
      friday: 'शुक्रवार',
      saturday: 'शनिवार',
      sunday: 'रविवार',
      january: 'जनवरी',
      february: 'फ़रवरी',
      march: 'मार्च',
      april: 'अप्रैल',
      may: 'मई',
      june: 'जून',
      july: 'जुलाई',
      august: 'अगस्त',
      september: 'सितंबर',
      october: 'अक्टूबर',
      november: 'नवंबर',
      december: 'दिसंबर',
      today: 'आज',
      yesterday: 'कल (बीता)',
      tomorrow: 'कल (आगामी)',
      thisWeek: 'इस सप्ताह',
      thisMonth: 'इस माह',
      thisYear: 'इस वर्ष',
    },
    messages: {
      confirmDelete: 'क्या आप वाकई इसे हटाना चाहते हैं?',
      confirmSuspend: 'क्या आप वाकई इसे निलंबित करना चाहते हैं?',
      confirmActivate: 'क्या आप वाकई इसे सक्रिय करना चाहते हैं?',
      confirmCancel: 'क्या आप वाकई इसे रद्द करना चाहते हैं?',
      operationSuccess: 'कार्य सफलतापूर्वक पूर्ण हुआ',
      operationFailed: 'कार्य विफल रहा',
      noDataFound: 'कोई डेटा नहीं मिला',
      loadingData: 'डेटा लोड हो रहा है...',
      savingChanges: 'परिवर्तन सहेजे जा रहे हैं...',
      changesSaved: 'परिवर्तन सफलतापूर्वक सहेजे गए',
      errorOccurred: 'एक त्रुटि हुई',
      tryAgain: 'कृपया पुनः प्रयास करें',
      areYouSure: 'क्या आप सुनिश्चित हैं?',
      cannotBeUndone: 'यह क्रिया पूर्ववत नहीं की जा सकती',
    },
  },

  // MALAYALAM (മലയാളം)
  ml: {
    common: {
      dashboard: 'ഡാഷ്ബോർഡ്',
      profileSettings: 'അക്കൗണ്ട് ക്രമീകരണങ്ങൾ',
      helpSupport: 'സഹായവും പിന്തുണയും',
      school: 'സ്കൂൾ',
      schoolWorkspace: 'സ്കൂൾ വർക്ക്‌സ്‌പേസ്',
      connectedSchool: 'കണക്റ്റഡ് സ്കൂൾ',
      betterSchoolDays: 'മികച്ച സ്കൂൾ ദിനങ്ങൾ.',
      brighterFutures: 'ശോഭനമായ ഭാവി.',
      workspaceDescription: 'വിദ്യാഭ്യാസം സാധ്യമാക്കുന്ന എല്ലാവർക്കുമായി ചിട്ടപ്പെടുത്തിയ വർക്ക്‌സ്‌പേസ്. പരസ്പരം ബന്ധപ്പെട്ടിരിക്കുക, ദൈനംദിന പ്രവർത്തനങ്ങൾ ലളിതമാക്കുക.',
      peopleConnected: 'ബന്ധിപ്പിച്ച സമൂഹം',
      learningSupported: 'പഠന പിന്തുണ',
      accessProtected: 'സുരക്ഷിത പ്രവേശനം',
      placeToGrow: 'വളർച്ചയ്ക്കുള്ള ഇടം.',
      oneCommunity: 'ഒരു സ്കൂൾ. ഒരു സമൂഹം. ഒരു വർക്ക്‌സ്‌പേസ്.',
      welcomeToKrypton: 'ഹസ്‌ലർടെക്കിലേക്ക് സ്വാഗതം',
      organizedSchools: 'സംഘടിത സ്കൂളുകൾ. ശാക്തീകരിക്കപ്പെട്ട സമൂഹം.',
      appName: 'HustlerTech സ്കൂൾ ERP',
      welcome: 'സ്വാഗതം',
      login: 'ലോഗിൻ',
      logout: 'ലോഗൗട്ട്',
      email: 'ഇമെയിൽ',
      password: 'പാസ്‌വേഡ്',
      phone: 'ഫോൺ',
      name: 'പേര്',
      firstName: 'ആദ്യ പേര്',
      lastName: 'അവസാന പേര്',
      address: 'വിലാസം',
      submit: 'സമർപ്പിക്കുക',
      cancel: 'റദ്ദാക്കുക',
      save: 'സംരക്ഷിക്കുക',
      delete: 'നീക്കം ചെയ്യുക',
      edit: 'തിരുത്തുക',
      view: 'കാണുക',
      search: 'തിരയുക',
      filter: 'ഫിൽട്ടർ',
      refresh: 'പുതുക്കുക',
      loading: 'ലോഡ് ചെയ്യുന്നു',
      error: 'പിശക്',
      success: 'വിജയം',
      warning: 'മുന്നറിയിപ്പ്',
      info: 'വിവരം',
      yes: 'അതെ',
      no: 'അല്ല',
      all: 'എല്ലാം',
      none: 'ഒന്നുമില്ല',
      select: 'തിരഞ്ഞെടുക്കുക',
      download: 'ഡൗൺലോഡ്',
      upload: 'അപ്‌ലോഡ്',
      back: 'പിന്നിലേക്ക്',
      next: 'അടുത്തത്',
      close: 'അടയ്ക്കുക',
      open: 'തുറക്കുക',
      settings: 'ക്രമീകരണങ്ങൾ',
    },
    auth: {
      email: 'ഇമെയിൽ വിലാസം',
      password: 'പാസ്‌വേഡ്',
      signingIn: 'സൈൻ ഇൻ ചെയ്യുന്നു…',
      goodToSeeYou: 'വീണ്ടും സ്വാഗതം.',
      signInToWorkspace: 'ഒരു അക്കൗണ്ട്. നിങ്ങളുടെ സ്കൂൾ വർക്ക്‌സ്‌പേസ്.',
      workspaceRouting: 'സൈൻ ഇൻ ചെയ്യുക; നിങ്ങളുടെ അക്കൗണ്ടിനുള്ള വർക്ക്‌സ്‌പേസിലേക്ക് കൊണ്ടുപോകും.',
      unableToSignIn: 'സൈൻ ഇൻ ചെയ്യാനായില്ല. വിവരങ്ങൾ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.',
      showPassword: 'പാസ്‌വേഡ് കാണിക്കുക',
      hidePassword: 'പാസ്‌വേഡ് മറയ്ക്കുക',
      accessAssigned: 'നിങ്ങളുടെ സ്കൂൾ അഡ്മിനിസ്ട്രേറ്ററാണ് പ്രവേശനം നൽകുന്നത്.',
      needHelpContact: 'സൈൻ ഇൻ ചെയ്യാൻ സഹായം വേണോ? സ്കൂൾ ഓഫീസുമായി ബന്ധപ്പെടുക.',
      needHelp: 'സഹായം ആവശ്യമുണ്ടോ?',
      contactSupport: 'സ്കൂൾ ഓഫീസുമായി ബന്ധപ്പെടുക.',
      demoCredentials: 'ഡെമോ അക്കൗണ്ടുകൾ',
      signIn: 'സൈൻ ഇൻ',
      signOut: 'സൈൻ ഔട്ട്',
      forgotPassword: 'പാസ്‌വേഡ് മറന്നോ?',
      rememberMe: 'എന്നെ ഓർക്കുക',
      emailAddress: 'ഇമെയിൽ വിലാസം',
      enterPassword: 'നിങ്ങളുടെ പാസ്‌വേഡ് നൽകുക',
      invalidCredentials: 'ഇമെയിലോ പാസ്‌വേഡോ തെറ്റാണ്',
      loginSuccess: 'ലോഗിൻ വിജയകരം',
      logoutSuccess: 'വിജയകരമായി ലോഗൗട്ട് ചെയ്തു',
      sessionExpired: 'നിങ്ങളുടെ സെഷൻ അവസാനിച്ചു',
    },
    parent: {
      portalLogin: 'രക്ഷാകർത്തൃ പോർട്ടൽ ലോഗിൻ',
      family: 'കുടുംബം',
      dashboard: 'ഡാഷ്ബോർഡ്',
      fees: 'ഫീസ്',
      attendance: 'ഹാജർ',
      grades: 'മാർക്കുകൾ & ഗ്രേഡ്',
      notifications: 'അറിയിപ്പുകൾ',
      myChildren: 'എന്റെ കുട്ടികൾ',
      feeBalance: 'ബാക്കി ഫീസ്',
      attendanceRate: 'ഹാജർ നിരക്ക്',
      recentGrades: 'സമീപകാല മാർക്കുകൾ',
      payFees: 'ഫീസ് അടയ്ക്കുക',
      viewAttendance: 'ഹാജർ കാണുക',
      viewGrades: 'മാർക്കുകൾ കാണുക',
      outstanding: 'കുടിശ്ശിക',
      paid: 'അടച്ചത്',
      pending: 'തീർപ്പുകൽപ്പിക്കാത്തത്',
      payNow: 'ഇപ്പോൾ അടയ്ക്കുക',
      paymentHistory: 'പേയ്‌മെന്റ് ചരിത്രം',
      invoices: 'ഇൻവോയ്‌സുകൾ',
      receipts: 'രസീതുകൾ',
      upiPayment: 'UPI / Razorpay പേയ്‌മെന്റ്',
      enterAmount: 'തുക നൽകുക (₹)',
      enterPhoneNumber: 'മൊബൈൽ നമ്പർ നൽകുക (+91)',
      paymentSuccess: 'പേയ്‌മെന്റ് വിജയകരം',
      paymentFailed: 'പേയ്‌മെന്റ് പരാജയപ്പെട്ടു',
      present: 'ഹാജർ',
      absent: 'അവധി',
      late: 'വൈകി എത്തിയത്',
      excused: 'അനുമതിയുള്ള അവധി',
      viewReportCard: 'റിപ്പോർട്ട് കാർഡ് കാണുക',
      downloadReport: 'റിപ്പോർട്ട് ഡൗൺലോഡ് ചെയ്യുക',
      termResults: 'ടേം ഫലങ്ങൾ',
      subjectPerformance: 'വിഷയാടിസ്ഥാനത്തിലുള്ള പ്രകടനം',
      overallGrade: 'ആകെ ഗ്രേഡ്',
      classPosition: 'ക്ലാസ്സ് റാങ്ക്',
      teacherComment: 'അധ്യാപകന്റെ കുറിപ്പ്',
      unreadNotifications: 'വായിക്കാത്ത അറിയിപ്പുകൾ',
      readAll: 'എല്ലാം വായിച്ചതായി രേഖപ്പെടുത്തുക',
      feeReminder: 'ഫീസ് ഓർമ്മപ്പെടുത്തൽ',
      absenceAlert: 'അവധി അറിയിപ്പ്',
      examSchedule: 'പരീക്ഷാ ടൈംടേബിൾ',
      schoolAnnouncement: 'സ്കൂൾ അറിയിപ്പ്',
    },
    teacher: {
      portalLogin: 'അധ്യാപക പോർട്ടൽ ലോഗിൻ',
      teacherPortal: 'അധ്യാപക പോർട്ടൽ',
      teacher: 'അധ്യാപകൻ',
      teaching: 'അധ്യാപനം',
      onlyTeachersAllowed: 'ഈ വർക്ക്‌സ്‌പേസ് അധ്യാപകർക്കുള്ളതാണ്.',
      notATeacher: 'നിങ്ങളുടെ റോളിനുള്ള പോർട്ടൽ തിരഞ്ഞെടുക്കുക.',
      parentPortal: 'രക്ഷാകർത്തൃ പോർട്ടൽ',
      mobileNav: { home: 'ഹോം', classes: 'ക്ലാസ്സുകൾ', attend: 'ഹാജർ', grades: 'മാർക്കുകൾ', messages: 'സന്ദേശങ്ങൾ' },
      dashboard: 'ഡാഷ്ബോർഡ്',
      myClasses: 'എന്റെ ക്ലാസ്സുകൾ',
      attendance: 'ഹാജർ',
      grades: 'മാർക്കുകൾ',
      timetable: 'ടൈംടേബിൾ',
      performance: 'പ്രകടനം',
      messages: 'സന്ദേശങ്ങൾ',
      todaySchedule: 'ഇന്നത്തെ ഷെഡ്യൂൾ',
      pendingTasks: 'ബാക്കിയുള്ള ജോലികൾ',
      classOverview: 'ക്ലാസ്സ് അവലോകനം',
      markAttendance: 'ഹാജർ രേഖപ്പെടുത്തുക',
      enterGrades: 'മാർക്കുകൾ നൽകുക',
      viewTimetable: 'ടൈംടേബിൾ കാണുക',
      studentList: 'വിദ്യാർത്ഥികളുടെ പട്ടിക',
      classReport: 'ക്ലാസ്സ് റിപ്പോർട്ട്',
      sendMessage: 'സന്ദേശം അയയ്ക്കുക',
      unmarkedAttendance: 'രേഖപ്പെടുത്താത്ത ഹാജർ',
      ungradedAssignments: 'മൂല്യനിർണ്ണയം ബാക്കിയുള്ളവ',
      unreadMessages: 'വായിക്കാത്ത സന്ദേശങ്ങൾ',
      upcomingClasses: 'വരാനിരിക്കുന്ന ക്ലാസ്സുകൾ',
      selectClass: 'ക്ലാസ്സ് തിരഞ്ഞെടുക്കുക',
      selectPeriod: 'പിരീഡ് തിരഞ്ഞെടുക്കുക',
      selectDate: 'തീയതി തിരഞ്ഞെടുക്കുക',
      markAllPresent: 'എല്ലാവരെയും ഹാജരാക്കുക',
      markAllAbsent: 'എല്ലാവരെയും അവധിയാക്കുക',
      submitAttendance: 'ഹാജർ സമർപ്പിക്കുക',
      attendanceMarked: 'ഹാജർ വിജയകരമായി രേഖപ്പെടുത്തി',
      selectSubject: 'വിഷയം തിരഞ്ഞെടുക്കുക',
      selectAssessment: 'പരീക്ഷ തിരഞ്ഞെടുക്കുക',
      enterMarks: 'മാർക്കുകൾ നൽകുക',
      maximumMarks: 'പരമാവധി മാർക്ക്',
      averageGrade: 'ശരാശരി ഗ്രേഡ്',
      highestScore: 'ഉയർന്ന മാർക്ക്',
      lowestScore: 'കുറഞ്ഞ മാർക്ക്',
      passRate: 'വിജയശതമാനം',
      submitGrades: 'മാർക്കുകൾ സമർപ്പിക്കുക',
      gradesSubmitted: 'മാർക്കുകൾ വിജയകരമായി സമർപ്പിച്ചു',
      weekView: 'ആഴ്ച കാഴ്ച',
      todayView: 'ഇന്നത്തെ കാഴ്ച',
      currentPeriod: 'നിലവിലെ പിരീഡ്',
      freeSlot: 'ഒഴിവ് സമയം',
      performanceAnalytics: 'പ്രകടന വിശകലനം',
      atRiskStudents: 'പ്രത്യേക ശ്രദ്ധ ആവശ്യമുള്ളവർ',
      topPerformers: 'മികച്ച പ്രകടനം കാഴ്ചവെച്ചവർ',
      improvementTrend: 'പുരോഗതി പ്രവണത',
      attendanceTrend: 'ഹാജർ പ്രവണത',
      needsAttention: 'ശ്രദ്ധ ആവശ്യമാണ്',
      excellentWork: 'മികച്ച പ്രവർത്തനം',
      composeMessage: 'സന്ദേശം എഴുതുക',
      sendToParents: 'രക്ഷിതാക്കൾക്ക് അയയ്ക്കുക',
      sendToClass: 'ക്ലാസ്സിന് അയയ്ക്കുക',
      messageSubject: 'വിഷയം',
      messageBody: 'സന്ദേശം',
      sendViaSMS: 'SMS വഴി അയയ്ക്കുക',
      sendViaEmail: 'ഇമെയിൽ വഴി അയയ്ക്കുക',
      messageSent: 'സന്ദേശം വിജയകരമായി അയച്ചു',
      replyReceived: 'മറുപടി ലഭിച്ചു',
    },
    admin: {
      superAdmin: 'സൂപ്പർ അഡ്മിൻ',
      administration: 'ഭരണവിഭാഗം',
      platform: 'പ്ലാറ്റ്‌ഫോം',
      platformAdministrator: 'പ്ലാറ്റ്‌ഫോം അഡ്മിനിസ്ട്രേറ്റർ',
      securityMFA: 'സുരക്ഷയും MFA-യും',
      auditLogs: 'ഓഡിറ്റ് ലോഗുകൾ',
      mobileNav: { dashboard: 'ഡാഷ്ബോർഡ്', schools: 'സ്കൂളുകൾ', billing: 'ബില്ലിംഗ്', system: 'സിസ്റ്റം' },
      platformAdmin: 'പ്ലാറ്റ്‌ഫോം അഡ്മിൻ',
      dashboard: 'ഡാഷ്ബോർഡ്',
      schools: 'സ്കൂളുകൾ',
      subscriptions: 'സബ്സ്ക്രിപ്ഷനുകൾ',
      users: 'ഉപയോക്താക്കൾ',
      systemMonitoring: 'സിസ്റ്റം നിരീക്ഷണം',
      support: 'പിന്തുണ',
      reports: 'റിപ്പോർട്ടുകൾ',
      totalSchools: 'ആകെ സ്കൂളുകൾ',
      activeSchools: 'സജീവ സ്കൂളുകൾ',
      trialSchools: 'ട്രയൽ സ്കൂളുകൾ',
      suspendedSchools: 'താൽക്കാലികമായി നിർത്തിയവ',
      totalStudents: 'ആകെ വിദ്യാർത്ഥികൾ',
      totalStaff: 'ആകെ ജീവനക്കാർ',
      monthlyRevenue: 'പ്രതിമാസ വരുമാനം',
      annualRevenue: 'വാർഷിക വരുമാനം',
      pendingPayments: 'ലഭിക്കാനുള്ള തുക',
      systemHealth: 'സിസ്റ്റം ആരോഗ്യം',
      recentActivity: 'സമീപകാല പ്രവർത്തനങ്ങൾ',
      criticalAlerts: 'പ്രധാന മുന്നറിയിപ്പുകൾ',
      addSchool: 'സ്കൂൾ ചേർക്കുക',
      manageSchools: 'സ്കൂളുകൾ നിയന്ത്രിക്കുക',
      schoolDetails: 'സ്കൂൾ വിവരങ്ങൾ',
      activateSchool: 'സ്കൂൾ സജീവമാക്കുക',
      suspendSchool: 'സ്കൂൾ സസ്പെൻഡ് ചെയ്യുക',
      subscriptionPlan: 'സബ്സ്ക്രിപ്ഷൻ പ്ലാൻ',
      expiryDate: 'കാലാവധി അവസാനിക്കുന്ന തീയതി',
      renewSubscription: 'സബ്സ്ക്രിപ്ഷൻ പുതുക്കുക',
      cancelSubscription: 'സബ്സ്ക്രിപ്ഷൻ റദ്ദാക്കുക',
      paymentMethod: 'പേയ്‌മെന്റ് രീതി',
      transactionReference: 'ഇടപാട് റഫറൻസ്',
      manageUsers: 'ഉപയോക്താക്കളെ നിയന്ത്രിക്കുക',
      createUser: 'ഉപയോക്താവിനെ സൃഷ്ടിക്കുക',
      userRole: 'ഉപയോക്തൃ റോൾ',
      lastLogin: 'അവസാന ലോഗിൻ',
      mfaEnabled: 'MFA സജീവം',
      suspendUser: 'ഉപയോക്താവിനെ സസ്പെൻഡ് ചെയ്യുക',
      activateUser: 'ഉപയോക്താവിനെ സജീവമാക്കുക',
      uptime: 'അപ്‌ടൈം',
      apiResponse: 'API പ്രതികരണം',
      databaseStatus: 'ഡാറ്റാബേസ് നില',
      storageUsage: 'സ്റ്റോറേജ് ഉപയോഗം',
      activeConnections: 'സജീവ കണക്ഷനുകൾ',
      errorRate: 'പിശക് നിരക്ക്',
      cpuUsage: 'CPU ഉപയോഗം',
      memoryUsage: 'മെമ്മറി ഉപയോഗം',
      diskUsage: 'ഡിസ്ക് ഉപയോഗം',
      serviceHealth: 'സേവന നില',
      backupHistory: 'ബാക്കപ്പ് ചരിത്രം',
      runBackup: 'ബാക്കപ്പ് എടുക്കുക',
      supportTickets: 'സപ്പോർട്ട് ടിക്കറ്റുകൾ',
      openTickets: 'തുറന്ന ടിക്കറ്റുകൾ',
      resolvedTickets: 'പരിഹരിച്ച ടിക്കറ്റുകൾ',
      ticketPriority: 'മുൻഗണന',
      announcements: 'അറിയിപ്പുകൾ',
      createAnnouncement: 'അറിയിപ്പ് തയ്യാറാക്കുക',
      publishAnnouncement: 'അറിയിപ്പ് പ്രസിദ്ധീകരിക്കുക',
    },
    status: {
      active: 'സജീവം',
      inactive: 'നിഷ്ക്രിയം',
      pending: 'തീർപ്പുകൽപ്പിക്കാത്തത്',
      approved: 'അംഗീകരിച്ചു',
      rejected: 'നിരസിച്ചു',
      completed: 'പൂർത്തിയായി',
      inProgress: 'പുരോഗമിക്കുന്നു',
      cancelled: 'റദ്ദാക്കി',
      failed: 'പരാജയപ്പെട്ടു',
      success: 'വിജയം',
      expired: 'കാലഹരണപ്പെട്ടു',
      trial: 'ട്രയൽ',
      suspended: 'താൽക്കാലികമായി നിർത്തി',
    },
    calendar: {
      monday: 'തിങ്കൾ',
      tuesday: 'ചൊവ്വ',
      wednesday: 'ബുധൻ',
      thursday: 'വ്യാഴം',
      friday: 'വെള്ളി',
      saturday: 'ശനി',
      sunday: 'ഞായർ',
      january: 'ജനുവരി',
      february: 'ഫെബ്രുവരി',
      march: 'മാർച്ച്',
      april: 'ഏപ്രിൽ',
      may: 'മേയ്',
      june: 'ജൂൺ',
      july: 'ജൂലൈ',
      august: 'ഓഗസ്റ്റ്',
      september: 'സെപ്റ്റംബർ',
      october: 'ഒക്ടോബർ',
      november: 'നവംബർ',
      december: 'ഡിസംബർ',
      today: 'ഇന്ന്',
      yesterday: 'ഇന്നലെ',
      tomorrow: 'നാളെ',
      thisWeek: 'ഈ ആഴ്ച',
      thisMonth: 'ഈ മാസം',
      thisYear: 'ഈ വർഷം',
    },
    messages: {
      confirmDelete: 'ഇത് നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?',
      confirmSuspend: 'ഇത് താൽക്കാലികമായി നിർത്തണമെന്ന് ഉറപ്പാണോ?',
      confirmActivate: 'ഇത് സജീവമാക്കണമെന്ന് ഉറപ്പാണോ?',
      confirmCancel: 'ഇത് റദ്ദാക്കണമെന്ന് ഉറപ്പാണോ?',
      operationSuccess: 'പ്രവർത്തനം വിജയകരമായി പൂർത്തിയായി',
      operationFailed: 'പ്രവർത്തനം പരാജയപ്പെട്ടു',
      noDataFound: 'വിവരങ്ങൾ ഒന്നും കണ്ടെത്തിയില്ല',
      loadingData: 'വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നു...',
      savingChanges: 'മാറ്റങ്ങൾ സംരക്ഷിക്കുന്നു...',
      changesSaved: 'മാറ്റങ്ങൾ വിജയകരമായി സംരക്ഷിച്ചു',
      errorOccurred: 'ഒരു പിശക് സംഭവിച്ചു',
      tryAgain: 'ദയവായി വീണ്ടും ശ്രമിക്കുക',
      areYouSure: 'നിങ്ങൾക്ക് ഉറപ്പാണോ?',
      cannotBeUndone: 'ഈ പ്രവൃത്തി തിരിച്ചെടുക്കാൻ കഴിയില്ല',
    },
  },
};

// Helper function to get translations
export const getTranslations = (locale: 'en' | 'hi' | 'ml'): Translations => {
  return translations[locale] || translations.en;
};

// Helper function to format currency (INR paise -> ₹)
export const formatCurrency = (amount: number, locale: 'en' | 'hi' | 'ml' = 'en'): string => {
  const intlLocale = locale === 'hi' ? 'hi-IN' : locale === 'ml' ? 'ml-IN' : 'en-IN';
  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount / 100);
};

// Helper function to format date
export const formatDate = (date: string | Date, locale: 'en' | 'hi' | 'ml' = 'en'): string => {
  const intlLocale = locale === 'hi' ? 'hi-IN' : locale === 'ml' ? 'ml-IN' : 'en-IN';
  return new Date(date).toLocaleDateString(intlLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
