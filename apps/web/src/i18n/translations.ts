// Bilingual Support: English and Swahili (Kenyan Language)

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
    mpesaPayment: string;
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

export const translations: Record<'en' | 'sw', Translations> = {
  // ENGLISH
  en: {
    common: {
      dashboard: "Dashboard",
      profileSettings: "Account settings",
      helpSupport: "Help & support",
      school: "School",
      schoolWorkspace: "SCHOOL WORKSPACE",
      connectedSchool: "THE CONNECTED SCHOOL",
      betterSchoolDays: "Better school days.",
      brighterFutures: "Brighter futures.",
      workspaceDescription: "A thoughtful workspace for the people who make education happen. Stay connected, simplify the everyday, and keep learning at the heart of it all.",
      peopleConnected: "People, connected",
      learningSupported: "Learning, supported",
      accessProtected: "Access, protected",
      placeToGrow: "A place to grow.",
      oneCommunity: "One school. One community. One workspace.",
      welcomeToKrypton: "WELCOME TO HUSTLERTECH",
      organizedSchools: "Organized schools. Empowered people.",

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
      email: "Email address",
      password: "Password",
      signingIn: "Signing in…",
      goodToSeeYou: "Good to see you.",
      signInToWorkspace: "One account. Your school workspace.",
      workspaceRouting: "Sign in and we?ll take you to the workspace assigned to your account.",
      unableToSignIn: "Unable to sign in. Check your details and try again.",
      showPassword: "Show password",
      hidePassword: "Hide password",
      accessAssigned: "Access is assigned by your school administrator.",
      needHelpContact: "Need help signing in? Contact your school office.",
      needHelp: "Need help?",
      contactSupport: "Contact your school office.",
      demoCredentials: "Local demo accounts",

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
      portalLogin: "Family portal sign-in",
      family: "family",

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
      mpesaPayment: 'M-Pesa Payment',
      enterAmount: 'Enter Amount',
      enterPhoneNumber: 'Enter Phone Number',
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
      classPosition: 'Class Position',
      teacherComment: 'Teacher Comment',
      unreadNotifications: 'Unread Notifications',
      readAll: 'Mark All Read',
      feeReminder: 'Fee Reminder',
      absenceAlert: 'Absence Alert',
      examSchedule: 'Exam Schedule',
      schoolAnnouncement: 'School Announcement',
    },
    teacher: {
      portalLogin: "Teacher portal sign-in",
      teacherPortal: "Teacher portal",
      teacher: "Teacher",
      teaching: "teaching",
      onlyTeachersAllowed: "This workspace is for teachers.",
      notATeacher: "Choose the portal for your role.",
      parentPortal: "Family portal",
      mobileNav: {"home": "Home", "classes": "Classes", "attend": "Attendance", "grades": "Grades", "messages": "Messages"},

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
      superAdmin: "SUPER ADMIN",
      administration: "administration",
      platform: "Platform",
      platformAdministrator: "Platform administrator",
      securityMFA: "Security & MFA",
      auditLogs: "Audit logs",
      mobileNav: {"dashboard": "Dashboard", "schools": "Schools", "billing": "Billing", "system": "System"},

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

  // SWAHILI (KISWAHILI)
  sw: {
    common: {
      dashboard: "Dashibodi",
      profileSettings: "Mipangilio ya akaunti",
      helpSupport: "Msaada",
      school: "Shule",
      schoolWorkspace: "MAZINGIRA YA SHULE",
      connectedSchool: "SHULE ILIYOUNGANISHWA",
      betterSchoolDays: "Siku bora za shule.",
      brighterFutures: "Mustakabali mzuri.",
      workspaceDescription: "Mazingira ya kazi kwa watu wanaowezesha elimu. Unganisha jamii ya shule na kurahisisha kazi za kila siku.",
      peopleConnected: "Watu wameunganishwa",
      learningSupported: "Masomo yanaungwa mkono",
      accessProtected: "Ufikiaji umelindwa",
      placeToGrow: "Mahali pa kukua.",
      oneCommunity: "Shule moja. Jamii moja. Mazingira moja.",
      welcomeToKrypton: "KARIBU HUSTLERTECH",
      organizedSchools: "Shule zilizopangwa. Watu waliowezeshwa.",

      appName: 'HustlerTech Mfumo wa Shule',
      welcome: 'Karibu',
      login: 'Ingia',
      logout: 'Toka',
      email: 'Barua Pepe',
      password: 'Nywila',
      phone: 'Simu',
      name: 'Jina',
      firstName: 'Jina la Kwanza',
      lastName: 'Jina la Mwisho',
      address: 'Anwani',
      submit: 'Wasilisha',
      cancel: 'Ghairi',
      save: 'Hifadhi',
      delete: 'Futa',
      edit: 'Hariri',
      view: 'Tazama',
      search: 'Tafuta',
      filter: 'Chuja',
      refresh: 'Onyesha Upya',
      loading: 'Inapakia',
      error: 'Kosa',
      success: 'Imefanikiwa',
      warning: 'Onyo',
      info: 'Taarifa',
      yes: 'Ndio',
      no: 'Hapana',
      all: 'Zote',
      none: 'Hakuna',
      select: 'Chagua',
      download: 'Pakua',
      upload: 'Pakia',
      back: 'Rudi',
      next: 'Ifuatayo',
      close: 'Funga',
      open: 'Fungua',
      settings: 'Mipangilio',
    },
    auth: {
      email: "Barua pepe",
      password: "Nenosiri",
      signingIn: "Unaingia…",
      goodToSeeYou: "Karibu tena.",
      signInToWorkspace: "Akaunti moja. Mazingira yako ya shule.",
      workspaceRouting: "Ingia kisha utaelekezwa kwenye mazingira yaliyopangiwa akaunti yako.",
      unableToSignIn: "Imeshindikana kuingia. Hakiki taarifa zako na ujaribu tena.",
      showPassword: "Onyesha nenosiri",
      hidePassword: "Ficha nenosiri",
      accessAssigned: "Ufikiaji hutolewa na msimamizi wa shule.",
      needHelpContact: "Unahitaji msaada kuingia? Wasiliana na ofisi ya shule.",
      needHelp: "Unahitaji msaada?",
      contactSupport: "Wasiliana na ofisi ya shule.",
      demoCredentials: "Akaunti za majaribio",

      signIn: 'Ingia',
      signOut: 'Toka',
      forgotPassword: 'Umesahau Nywila?',
      rememberMe: 'Nikumbuke',
      emailAddress: 'Barua Pepe',
      enterPassword: 'Weka nywila yako',
      invalidCredentials: 'Barua pepe au nywila si sahihi',
      loginSuccess: 'Umeingia kikamilifu',
      logoutSuccess: 'Umetoka kikamilifu',
      sessionExpired: 'Kipindi chako kimeisha',
    },
    parent: {
      portalLogin: "Kuingia kwa familia",
      family: "familia",

      dashboard: 'Dashibodi',
      fees: 'Ada',
      attendance: 'Mahudhurio',
      grades: 'Alama',
      notifications: 'Arifa',
      myChildren: 'Watoto Wangu',
      feeBalance: 'Salio la Ada',
      attendanceRate: 'Kiwango cha Mahudhurio',
      recentGrades: 'Alama za Hivi Karibuni',
      payFees: 'Lipa Ada',
      viewAttendance: 'Tazama Mahudhurio',
      viewGrades: 'Tazama Alama',
      outstanding: 'Bado Inabaki',
      paid: 'Imelipwa',
      pending: 'Inasubiri',
      payNow: 'Lipa Sasa',
      paymentHistory: 'Historia ya Malipo',
      invoices: 'Ankara',
      receipts: 'Risiti',
      mpesaPayment: 'Malipo ya M-Pesa',
      enterAmount: 'Weka Kiasi',
      enterPhoneNumber: 'Weka Nambari ya Simu',
      paymentSuccess: 'Malipo yamefanikiwa',
      paymentFailed: 'Malipo yameshindikana',
      present: 'Yupo',
      absent: 'Hayupo',
      late: 'Amechelewa',
      excused: 'Ameruhusiwa',
      viewReportCard: 'Tazama Ripoti',
      downloadReport: 'Pakua Ripoti',
      termResults: 'Matokeo ya Muhula',
      subjectPerformance: 'Utendaji wa Somo',
      overallGrade: 'Alama ya Jumla',
      classPosition: 'Nafasi Darasani',
      teacherComment: 'Maoni ya Mwalimu',
      unreadNotifications: 'Arifa Ambazo Hazijasomwa',
      readAll: 'Weka Zote Zimesomwa',
      feeReminder: 'Ukumbusho wa Ada',
      absenceAlert: 'Arifa ya Kutokuwepo',
      examSchedule: 'Ratiba ya Mtihani',
      schoolAnnouncement: 'Tangazo la Shule',
    },
    teacher: {
      portalLogin: "Kuingia kwa mwalimu",
      teacherPortal: "Mazingira ya mwalimu",
      teacher: "Mwalimu",
      teaching: "ufundishaji",
      onlyTeachersAllowed: "Mazingira haya ni ya walimu.",
      notATeacher: "Chagua mazingira ya jukumu lako.",
      parentPortal: "Mazingira ya familia",
      mobileNav: {"home": "Nyumbani", "classes": "Madarasa", "attend": "Mahudhurio", "grades": "Alama", "messages": "Ujumbe"},

      dashboard: 'Dashibodi',
      myClasses: 'Madarasa Yangu',
      attendance: 'Mahudhurio',
      grades: 'Alama',
      timetable: 'Ratiba',
      performance: 'Utendaji',
      messages: 'Ujumbe',
      todaySchedule: 'Ratiba ya Leo',
      pendingTasks: 'Kazi Zinazobaki',
      classOverview: 'Muhtasari wa Darasa',
      markAttendance: 'Weka Mahudhurio',
      enterGrades: 'Weka Alama',
      viewTimetable: 'Tazama Ratiba',
      studentList: 'Orodha ya Wanafunzi',
      classReport: 'Ripoti ya Darasa',
      sendMessage: 'Tuma Ujumbe',
      unmarkedAttendance: 'Mahudhurio Yasiyowekwa',
      ungradedAssignments: 'Kazi Ambazo Hazijapewa Alama',
      unreadMessages: 'Ujumbe Ambao Haujasomwa',
      upcomingClasses: 'Madarasa Yanayokuja',
      selectClass: 'Chagua Darasa',
      selectPeriod: 'Chagua Kipindi',
      selectDate: 'Chagua Tarehe',
      markAllPresent: 'Weka Wote Wako',
      markAllAbsent: 'Weka Wote Hawako',
      submitAttendance: 'Wasilisha Mahudhurio',
      attendanceMarked: 'Mahudhurio yamewekwa kikamilifu',
      selectSubject: 'Chagua Somo',
      selectAssessment: 'Chagua Tathmini',
      enterMarks: 'Weka Alama',
      maximumMarks: 'Alama za Juu',
      averageGrade: 'Wastani wa Alama',
      highestScore: 'Alama ya Juu Kabisa',
      lowestScore: 'Alama ya Chini Kabisa',
      passRate: 'Kiwango cha Kufaulu',
      submitGrades: 'Wasilisha Alama',
      gradesSubmitted: 'Alama zimewekwa kikamilifu',
      weekView: 'Mtazamo wa Wiki',
      todayView: 'Mtazamo wa Leo',
      currentPeriod: 'Kipindi cha Sasa',
      freeSlot: 'Bure',
      performanceAnalytics: 'Uchambuzi wa Utendaji',
      atRiskStudents: 'Wanafunzi wenye Hatari',
      topPerformers: 'Watendaji Bora',
      improvementTrend: 'Mwenendo wa Maendeleo',
      attendanceTrend: 'Mwenendo wa Mahudhurio',
      needsAttention: 'Anahitaji Makini',
      excellentWork: 'Kazi Nzuri Sana',
      composeMessage: 'Tunga Ujumbe',
      sendToParents: 'Tumia Wazazi',
      sendToClass: 'Tumia Darasa',
      messageSubject: 'Kichwa',
      messageBody: 'Ujumbe',
      sendViaSMS: 'Tuma kwa SMS',
      sendViaEmail: 'Tuma kwa Barua Pepe',
      messageSent: 'Ujumbe umetumwa kikamilifu',
      replyReceived: 'Jibu limepokelewa',
    },
    admin: {
      superAdmin: "MSIMAMIZI MKUU",
      administration: "usimamizi",
      platform: "Jukwaa",
      platformAdministrator: "Msimamizi wa jukwaa",
      securityMFA: "Usalama na MFA",
      auditLogs: "Kumbukumbu za ukaguzi",
      mobileNav: {"dashboard": "Dashibodi", "schools": "Shule", "billing": "Malipo", "system": "Mfumo"},

      platformAdmin: 'Msimamizi wa Mfumo',
      dashboard: 'Dashibodi',
      schools: 'Shule',
      subscriptions: 'Usajili',
      users: 'Watumiaji',
      systemMonitoring: 'Ufuatiliaji wa Mfumo',
      support: 'Msaada',
      reports: 'Ripoti',
      totalSchools: 'Jumla ya Shule',
      activeSchools: 'Shule Zinazofanya Kazi',
      trialSchools: 'Shule za Majaribio',
      suspendedSchools: 'Shule Zilizosimamishwa',
      totalStudents: 'Jumla ya Wanafunzi',
      totalStaff: 'Jumla ya Wafanyakazi',
      monthlyRevenue: 'Mapato ya Mwezi',
      annualRevenue: 'Mapato ya Mwaka',
      pendingPayments: 'Malipo Yanayosubiri',
      systemHealth: 'Afya ya Mfumo',
      recentActivity: 'Shughuli za Hivi Karibuni',
      criticalAlerts: 'Arifa Muhimu',
      addSchool: 'Ongeza Shule',
      manageSchools: 'Simamia Shule',
      schoolDetails: 'Maelezo ya Shule',
      activateSchool: 'Washa Shule',
      suspendSchool: 'Simamisha Shule',
      subscriptionPlan: 'Mpango wa Usajili',
      expiryDate: 'Tarehe ya Kumalizika',
      renewSubscription: 'Fanya Upya Usajili',
      cancelSubscription: 'Ghairi Usajili',
      paymentMethod: 'Njia ya Malipo',
      transactionReference: 'Kumbukumbu ya Muamala',
      manageUsers: 'Simamia Watumiaji',
      createUser: 'Unda Mtumiaji',
      userRole: 'Jukumu la Mtumiaji',
      lastLogin: 'Mara ya Mwisho Kuingia',
      mfaEnabled: 'MFA Imewashwa',
      suspendUser: 'Simamisha Mtumiaji',
      activateUser: 'Washa Mtumiaji',
      uptime: 'Muda wa Kuwepo',
      apiResponse: 'Majibu ya API',
      databaseStatus: 'Hali ya Hifadhidata',
      storageUsage: 'Matumizi ya Uhifadhi',
      activeConnections: 'Miunganisho Inayofanya Kazi',
      errorRate: 'Kiwango cha Makosa',
      cpuUsage: 'Matumizi ya CPU',
      memoryUsage: 'Matumizi ya Kumbukumbu',
      diskUsage: 'Matumizi ya Diski',
      serviceHealth: 'Afya ya Huduma',
      backupHistory: 'Historia ya Nakala',
      runBackup: 'Fanya Nakala',
      supportTickets: 'Tiketi za Msaada',
      openTickets: 'Tiketi Zilizo Wazi',
      resolvedTickets: 'Tiketi Zilizotatuliwa',
      ticketPriority: 'Kipaumbele',
      announcements: 'Matangazo',
      createAnnouncement: 'Unda Tangazo',
      publishAnnouncement: 'Chapisha Tangazo',
    },
    status: {
      active: 'Inafanya Kazi',
      inactive: 'Haifanyi Kazi',
      pending: 'Inasubiri',
      approved: 'Imeidhinishwa',
      rejected: 'Imekataliwa',
      completed: 'Imekamilika',
      inProgress: 'Inaendelea',
      cancelled: 'Imeghairiwa',
      failed: 'Imeshindikana',
      success: 'Imefanikiwa',
      expired: 'Imeisha',
      trial: 'Jaribio',
      suspended: 'Imesimamishwa',
    },
    calendar: {
      monday: 'Jumatatu',
      tuesday: 'Jumanne',
      wednesday: 'Jumatano',
      thursday: 'Alhamisi',
      friday: 'Ijumaa',
      saturday: 'Jumamosi',
      sunday: 'Jumapili',
      january: 'Januari',
      february: 'Februari',
      march: 'Machi',
      april: 'Aprili',
      may: 'Mei',
      june: 'Juni',
      july: 'Julai',
      august: 'Agosti',
      september: 'Septemba',
      october: 'Oktoba',
      november: 'Novemba',
      december: 'Desemba',
      today: 'Leo',
      yesterday: 'Jana',
      tomorrow: 'Kesho',
      thisWeek: 'Wiki Hii',
      thisMonth: 'Mwezi Huu',
      thisYear: 'Mwaka Huu',
    },
    messages: {
      confirmDelete: 'Una uhakika unataka kufuta hii?',
      confirmSuspend: 'Una uhakika unataka kusimamisha hii?',
      confirmActivate: 'Una uhakika unataka kuwasha hii?',
      confirmCancel: 'Una uhakika unataka kughairi?',
      operationSuccess: 'Utekelezaji umekamilika kikamilifu',
      operationFailed: 'Utekelezaji umeshindikana',
      noDataFound: 'Hakuna data iliyopatikana',
      loadingData: 'Inapakia data...',
      savingChanges: 'Inahifadhi mabadiliko...',
      changesSaved: 'Mabadiliko yamehifadhiwa kikamilifu',
      errorOccurred: 'Kosa limetokea',
      tryAgain: 'Tafadhali jaribu tena',
      areYouSure: 'Una uhakika?',
      cannotBeUndone: 'Kitendo hiki hakiwezi kutenduliwa',
    },
  },
};

// Helper function to get translations
export const getTranslations = (locale: 'en' | 'sw'): Translations => {
  return translations[locale] || translations.en;
};

// Helper function to format currency
export const formatCurrency = (amount: number, locale: 'en' | 'sw' = 'en'): string => {
  return new Intl.NumberFormat(locale === 'en' ? 'en-KE' : 'sw-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount / 100);
};

// Helper function to format date
export const formatDate = (date: string | Date, locale: 'en' | 'sw' = 'en'): string => {
  return new Date(date).toLocaleDateString(locale === 'en' ? 'en-KE' : 'sw-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
