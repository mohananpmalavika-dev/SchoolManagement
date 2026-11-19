import type { Column } from '@/components/ResourcePage';
import type { Field } from '@/components/RecordModal';
export interface ResourceConfig {title:string;description:string;endpoint:string;columns:Column[];fields?:Field[];editable?:boolean;createAllowed?:boolean;action?:{label:string;path:string}}
export const schoolResources:Record<string,ResourceConfig>={
  "students": {
    "title": "Students",
    "description": "Every student\u2019s journey starts with a place to belong.",
    "endpoint": "/workspace/students",
    "columns": [
      {
        "key": "name",
        "label": "Student"
      },
      {
        "key": "admissionNumber",
        "label": "Admission no."
      },
      {
        "key": "className",
        "label": "Class"
      },
      {
        "key": "status",
        "label": "Status",
        "format": "status"
      }
    ],
    "fields": [
      {
        "key": "admissionNumber",
        "label": "Admission no.",
        "required": true
      },
      {
        "key": "firstName",
        "label": "First name",
        "required": true
      },
      {
        "key": "lastName",
        "label": "Last name",
        "required": true
      },
      {
        "key": "dateOfBirth",
        "label": "Date of birth",
        "required": true,
        "type": "date"
      },
      {
        "key": "gender",
        "label": "Gender",
        "required": true,
        "options": [
          "MALE",
          "FEMALE",
          "OTHER"
        ]
      },
      {
        "key": "admissionDate",
        "label": "Admission date",
        "required": true,
        "type": "date"
      },
      {
        "key": "currentClassId",
        "label": "Class",
        "required": false,
        "source": "/workspace/classes",
        "clearable": true
      },
      {
        "key": "status",
        "label": "Status",
        "required": false,
        "options": [
          "ACTIVE",
          "GRADUATED",
          "TRANSFERRED",
          "WITHDRAWN",
          "SUSPENDED"
        ]
      },
      {
        "key": "userId",
        "label": "Student portal account",
        "source": "/workspace/student-accounts",
        "clearable": true
      }
    ],
    "editable": true
  },
  "guardians": {
    "title": "Guardians",
    "description": "Keep families connected to their school community.",
    "endpoint": "/workspace/guardians",
    "columns": [
      {
        "key": "name",
        "label": "Guardian"
      },
      {
        "key": "phone",
        "label": "Phone"
      },
      {
        "key": "email",
        "label": "Email"
      },
      {
        "key": "userId",
        "label": "Portal account"
      }
    ],
    "fields": [
      {
        "key": "firstName",
        "label": "First name",
        "required": true
      },
      {
        "key": "lastName",
        "label": "Last name",
        "required": true
      },
      {
        "key": "phone",
        "label": "Phone",
        "required": true
      },
      {
        "key": "email",
        "label": "Email",
        "required": false,
        "type": "email",
        "clearable": true
      },
      {
        "key": "userId",
        "label": "Portal account",
        "required": false,
        "source": "/workspace/guardian-accounts",
        "clearable": true
      }
    ],
    "editable": true
  },
  "guardian-links": {
    "title": "Family connections",
    "description": "Keep your school information organized and up to date.",
    "endpoint": "/workspace/guardian-links",
    "columns": [
      {
        "key": "guardianName",
        "label": "Guardian"
      },
      {
        "key": "studentName",
        "label": "Student"
      },
      {
        "key": "relationship",
        "label": "Relationship"
      }
    ],
    "fields": [
      {
        "key": "guardianId",
        "label": "Guardian",
        "required": true,
        "source": "/workspace/guardians"
      },
      {
        "key": "studentId",
        "label": "Student",
        "required": true,
        "source": "/workspace/students"
      },
      {
        "key": "relationship",
        "label": "Relationship",
        "required": true,
        "options": [
          "MOTHER",
          "FATHER",
          "GUARDIAN",
          "GRANDPARENT",
          "SIBLING",
          "AUNT",
          "UNCLE",
          "OTHER"
        ]
      }
    ],
    "editable": true
  },
  "staff": {
    "title": "Staff directory",
    "description": "The people who make your school run.",
    "endpoint": "/workspace/staff",
    "columns": [
      {
        "key": "name",
        "label": "Staff member"
      },
      {
        "key": "staffNumber",
        "label": "Staff no."
      },
      {
        "key": "department",
        "label": "Department"
      },
      {
        "key": "position",
        "label": "Position"
      },
      {
        "key": "status",
        "label": "Status",
        "format": "status"
      }
    ],
    "fields": [
      {
        "key": "staffNumber",
        "label": "Staff number",
        "required": true
      },
      {
        "key": "firstName",
        "label": "First name",
        "required": true
      },
      {
        "key": "lastName",
        "label": "Last name",
        "required": true
      },
      {
        "key": "email",
        "label": "Email",
        "required": true,
        "type": "email"
      },
      {
        "key": "phone",
        "label": "Phone",
        "required": true
      },
      {
        "key": "gender",
        "label": "Gender",
        "required": true,
        "options": [
          "MALE",
          "FEMALE",
          "OTHER"
        ]
      },
      {
        "key": "department",
        "label": "Department",
        "required": true,
        "options": [
          "ADMINISTRATION",
          "TEACHING",
          "FINANCE",
          "LIBRARY",
          "TRANSPORT",
          "MAINTENANCE",
          "SECURITY",
          "IT",
          "OTHER"
        ]
      },
      {
        "key": "position",
        "label": "Position",
        "required": true
      },
      {
        "key": "employmentType",
        "label": "Employment type",
        "required": true,
        "options": [
          "PERMANENT",
          "CONTRACT",
          "PART_TIME",
          "TEMPORARY",
          "INTERN"
        ]
      },
      {
        "key": "hireDate",
        "label": "Hire date",
        "required": true,
        "type": "date"
      },
      {
        "key": "userId",
        "label": "Portal account",
        "required": false,
        "source": "/workspace/staff-accounts",
        "clearable": true
      }
    ],
    "editable": true
  },
  "years": {
    "title": "Academic years",
    "description": "Keep your school information organized and up to date.",
    "endpoint": "/workspace/years",
    "columns": [
      {
        "key": "name",
        "label": "Year"
      },
      {
        "key": "startDate",
        "label": "Starts",
        "format": "date"
      },
      {
        "key": "endDate",
        "label": "Ends",
        "format": "date"
      },
      {
        "key": "isCurrent",
        "label": "Current"
      }
    ],
    "fields": [
      {
        "key": "name",
        "label": "Name",
        "required": true
      },
      {
        "key": "startDate",
        "label": "Start date",
        "required": true,
        "type": "date"
      },
      {
        "key": "endDate",
        "label": "End date",
        "required": true,
        "type": "date"
      }
    ],
    "action": {
      "label": "Set current",
      "path": "current"
    },
    "editable": true
  },
  "terms": {
    "title": "Terms",
    "description": "Keep your school information organized and up to date.",
    "endpoint": "/workspace/terms",
    "columns": [
      {
        "key": "name",
        "label": "Term"
      },
      {
        "key": "termNumber",
        "label": "Number"
      },
      {
        "key": "startDate",
        "label": "Starts",
        "format": "date"
      },
      {
        "key": "endDate",
        "label": "Ends",
        "format": "date"
      },
      {
        "key": "isCurrent",
        "label": "Current"
      }
    ],
    "fields": [
      {
        "key": "name",
        "label": "Name",
        "required": true
      },
      {
        "key": "academicYearId",
        "label": "Academic year",
        "required": true,
        "source": "/workspace/years"
      },
      {
        "key": "termNumber",
        "label": "Term number",
        "required": true,
        "type": "number",
        "min": 1,
        "max": 4
      },
      {
        "key": "startDate",
        "label": "Start date",
        "required": true,
        "type": "date"
      },
      {
        "key": "endDate",
        "label": "End date",
        "required": true,
        "type": "date"
      }
    ],
    "action": {
      "label": "Set current",
      "path": "current"
    },
    "editable": true
  },
  "classes": {
    "title": "Classes",
    "description": "Keep your school information organized and up to date.",
    "endpoint": "/workspace/classes",
    "columns": [
      {
        "key": "name",
        "label": "Class"
      },
      {
        "key": "level",
        "label": "Level"
      },
      {
        "key": "educationLevel",
        "label": "Education level"
      },
      {
        "key": "studentCount",
        "label": "Students"
      }
    ],
    "fields": [
      {
        "key": "name",
        "label": "Name",
        "required": true
      },
      {
        "key": "schoolId",
        "label": "Campus",
        "required": true,
        "source": "/workspace/schools"
      },
      {
        "key": "level",
        "label": "Level",
        "required": true
      },
      {
        "key": "educationLevel",
        "label": "Education level",
        "required": true,
        "options": [
          "PRE_PRIMARY",
          "PRIMARY",
          "MIDDLE",
          "SECONDARY",
          "SENIOR_SECONDARY"
        ]
      }
    ],
    "editable": true
  },
  "streams": {
    "title": "Streams",
    "description": "Keep your school information organized and up to date.",
    "endpoint": "/workspace/streams",
    "columns": [
      {
        "key": "name",
        "label": "Stream"
      },
      {
        "key": "capacity",
        "label": "Capacity"
      }
    ],
    "fields": [
      {
        "key": "name",
        "label": "Name",
        "required": true
      },
      {
        "key": "schoolId",
        "label": "Campus",
        "required": true,
        "source": "/workspace/schools"
      },
      {
        "key": "classId",
        "label": "Class",
        "required": true,
        "source": "/workspace/classes"
      },
      {
        "key": "capacity",
        "label": "Capacity",
        "required": true,
        "type": "number",
        "min": 1,
        "max": 500
      }
    ],
    "editable": true
  },
  "subjects": {
    "title": "Subjects",
    "description": "Keep your school information organized and up to date.",
    "endpoint": "/workspace/subjects",
    "columns": [
      {
        "key": "name",
        "label": "Subject"
      },
      {
        "key": "code",
        "label": "Code"
      },
      {
        "key": "educationLevel",
        "label": "Education level"
      }
    ],
    "fields": [
      {
        "key": "name",
        "label": "Name",
        "required": true
      },
      {
        "key": "code",
        "label": "Code",
        "required": true
      },
      {
        "key": "educationLevel",
        "label": "Education level",
        "required": true,
        "options": [
          "PRE_PRIMARY",
          "PRIMARY",
          "MIDDLE",
          "SECONDARY",
          "SENIOR_SECONDARY"
        ]
      }
    ],
    "editable": true
  },
  "schools": {
    "title": "Campuses",
    "description": "Keep your school information organized and up to date.",
    "endpoint": "/workspace/schools",
    "columns": [
      {
        "key": "name",
        "label": "Campus"
      },
      {
        "key": "email",
        "label": "Email"
      },
      {
        "key": "phone",
        "label": "Phone"
      },
      {
        "key": "city",
        "label": "City"
      }
    ],
    "fields": [
      {
        "key": "name",
        "label": "Name",
        "required": true
      },
      {
        "key": "email",
        "label": "Email",
        "required": true,
        "type": "email"
      },
      {
        "key": "phone",
        "label": "Phone",
        "required": true
      },
      {
        "key": "address",
        "label": "Address",
        "required": true
      },
      {
        "key": "city",
        "label": "City",
        "required": true
      },
      {
        "key": "state",
        "label": "State",
        "required": true
      },
      {
        "key": "schoolType",
        "label": "School type",
        "required": true,
        "options": [
          "PUBLIC",
          "PRIVATE",
          "ACADEMY",
          "TUITION_CENTRE",
          "INTERNATIONAL"
        ]
      }
    ],
    "editable": true
  },
  "books": {
    "title": "Book catalog",
    "description": "Open a world of learning, one book at a time.",
    "endpoint": "/workspace/books",
    "columns": [
      {
        "key": "title",
        "label": "Title"
      },
      {
        "key": "author",
        "label": "Author"
      },
      {
        "key": "category",
        "label": "Category"
      },
      {
        "key": "quantity",
        "label": "Copies"
      },
      {
        "key": "available",
        "label": "Available"
      }
    ],
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "required": true
      },
      {
        "key": "author",
        "label": "Author",
        "required": false,
        "clearable": true
      },
      {
        "key": "isbn",
        "label": "Isbn",
        "required": false,
        "clearable": true
      },
      {
        "key": "category",
        "label": "Category",
        "required": false,
        "clearable": true
      },
      {
        "key": "quantity",
        "label": "Quantity",
        "required": true,
        "type": "number",
        "min": 1,
        "max": 10000
      }
    ],
    "editable": true
  },
  "borrowings": {
    "title": "Book loans",
    "description": "Keep your school information organized and up to date.",
    "endpoint": "/workspace/borrowings",
    "columns": [
      {
        "key": "bookTitle",
        "label": "Book"
      },
      {
        "key": "borrowerName",
        "label": "Borrower"
      },
      {
        "key": "dueDate",
        "label": "Due",
        "format": "date"
      },
      {
        "key": "status",
        "label": "Status",
        "format": "status"
      }
    ],
    "fields": [
      {
        "key": "bookId",
        "label": "Book",
        "required": true,
        "source": "/workspace/books"
      },
      {
        "key": "borrowerId",
        "label": "Student borrower",
        "required": true,
        "source": "/workspace/students"
      },
      {
        "key": "dueDate",
        "label": "Due date",
        "required": true,
        "type": "date"
      }
    ],
    "action": {
      "label": "Return",
      "path": "return"
    }
  },
  "vehicles": {
    "title": "Vehicles",
    "description": "Keep your school information organized and up to date.",
    "endpoint": "/workspace/vehicles",
    "columns": [
      {
        "key": "registrationNumber",
        "label": "Registration"
      },
      {
        "key": "make",
        "label": "Make"
      },
      {
        "key": "capacity",
        "label": "Capacity"
      },
      {
        "key": "status",
        "label": "Status",
        "format": "status"
      }
    ],
    "fields": [
      {
        "key": "registrationNumber",
        "label": "Registration number",
        "required": true
      },
      {
        "key": "make",
        "label": "Make",
        "required": false,
        "clearable": true
      },
      {
        "key": "model",
        "label": "Model",
        "required": false,
        "clearable": true
      },
      {
        "key": "capacity",
        "label": "Capacity",
        "required": true,
        "type": "number",
        "min": 1,
        "max": 100
      },
      {
        "key": "status",
        "label": "Status",
        "required": false,
        "options": [
          "ACTIVE",
          "MAINTENANCE",
          "INACTIVE"
        ]
      }
    ],
    "editable": true
  },
  "routes": {
    "title": "Transport routes",
    "description": "Keep your school information organized and up to date.",
    "endpoint": "/workspace/routes",
    "columns": [
      {
        "key": "name",
        "label": "Route"
      },
      {
        "key": "pickupTime",
        "label": "Pickup"
      },
      {
        "key": "dropoffTime",
        "label": "Drop-off"
      },
      {
        "key": "fee",
        "label": "Monthly fee",
        "format": "money"
      }
    ],
    "fields": [
      {
        "key": "name",
        "label": "Name",
        "required": true
      },
      {
        "key": "vehicleId",
        "label": "Vehicle",
        "required": false,
        "source": "/workspace/vehicles",
        "clearable": true
      },
      {
        "key": "pickupTime",
        "label": "Pickup time",
        "required": false,
        "type": "time",
        "clearable": true
      },
      {
        "key": "dropoffTime",
        "label": "Dropoff time",
        "required": false,
        "type": "time",
        "clearable": true
      },
      {
        "key": "fee",
        "label": "Monthly fee (INR)",
        "required": false,
        "type": "currency",
        "min": 0,
        "max": 100000000
      }
    ],
    "editable": true
  },
  "inventory": {
    "title": "Inventory",
    "description": "Keep your school information organized and up to date.",
    "endpoint": "/workspace/inventory",
    "columns": [
      {
        "key": "name",
        "label": "Item"
      },
      {
        "key": "category",
        "label": "Category"
      },
      {
        "key": "quantity",
        "label": "Quantity"
      },
      {
        "key": "unit",
        "label": "Unit"
      },
      {
        "key": "reorderLevel",
        "label": "Reorder level"
      }
    ],
    "fields": [
      {
        "key": "name",
        "label": "Name",
        "required": true
      },
      {
        "key": "category",
        "label": "Category",
        "required": false,
        "clearable": true
      },
      {
        "key": "quantity",
        "label": "Quantity",
        "required": true,
        "type": "number",
        "min": 0,
        "max": 100000
      },
      {
        "key": "unit",
        "label": "Unit",
        "required": false,
        "clearable": true
      },
      {
        "key": "reorderLevel",
        "label": "Reorder level",
        "required": false,
        "type": "number",
        "min": 0,
        "max": 100000
      }
    ],
    "editable": true
  },
  "events": {
    "title": "School calendar",
    "description": "Make space for learning, celebration, and community.",
    "endpoint": "/workspace/events",
    "columns": [
      {
        "key": "title",
        "label": "Event"
      },
      {
        "key": "startDate",
        "label": "Starts",
        "format": "date"
      },
      {
        "key": "endDate",
        "label": "Ends",
        "format": "date"
      },
      {
        "key": "category",
        "label": "Category"
      },
      {
        "key": "location",
        "label": "Location"
      }
    ],
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "required": true
      },
      {
        "key": "description",
        "label": "Description",
        "required": false,
        "type": "textarea",
        "clearable": true
      },
      {
        "key": "eventType",
        "label": "Event type",
        "required": true,
        "options": [
          "HOLIDAY",
          "EXAM",
          "MEETING",
          "SPORTS",
          "CULTURAL",
          "ACADEMIC",
          "OTHER"
        ]
      },
      {
        "key": "category",
        "label": "Category",
        "required": true,
        "options": [
          "ACADEMIC",
          "ADMINISTRATIVE",
          "EXTRACURRICULAR",
          "HOLIDAY"
        ]
      },
      {
        "key": "startDate",
        "label": "Start date",
        "required": true,
        "type": "date"
      },
      {
        "key": "endDate",
        "label": "End date",
        "required": true,
        "type": "date"
      },
      {
        "key": "location",
        "label": "Location",
        "required": false,
        "clearable": true
      }
    ],
    "editable": true
  },
  "timetable": {
    "title": "Timetable",
    "description": "Keep your school information organized and up to date.",
    "endpoint": "/workspace/timetable",
    "columns": [
      {
        "key": "day",
        "label": "Day"
      },
      {
        "key": "startTime",
        "label": "Start"
      },
      {
        "key": "endTime",
        "label": "End"
      },
      {
        "key": "className",
        "label": "Class"
      },
      {
        "key": "subjectName",
        "label": "Subject"
      },
      {
        "key": "teacherName",
        "label": "Teacher"
      },
      {
        "key": "room",
        "label": "Room"
      }
    ],
    "fields": [
      {
        "key": "classId",
        "label": "Class",
        "required": true,
        "source": "/workspace/classes"
      },
      {
        "key": "subjectId",
        "label": "Subject",
        "required": true,
        "source": "/workspace/subjects"
      },
      {
        "key": "teacherId",
        "label": "Teacher",
        "required": true,
        "source": "/workspace/staff"
      },
      {
        "key": "dayOfWeek",
        "label": "Day (1 = Monday)",
        "required": true,
        "type": "number",
        "min": 1,
        "max": 7
      },
      {
        "key": "period",
        "label": "Period",
        "required": true
      },
      {
        "key": "startTime",
        "label": "Start time",
        "required": true,
        "type": "time"
      },
      {
        "key": "endTime",
        "label": "End time",
        "required": true,
        "type": "time"
      },
      {
        "key": "room",
        "label": "Room",
        "required": false
      }
    ]
  },
  "invoices": {
    "title": "Invoices",
    "description": "Clear fee records for a stronger school.",
    "endpoint": "/workspace/invoices",
    "columns": [
      {
        "key": "invoiceNumber",
        "label": "Invoice"
      },
      {
        "key": "studentName",
        "label": "Student"
      },
      {
        "key": "termName",
        "label": "Term"
      },
      {
        "key": "totalAmount",
        "label": "Total",
        "format": "money"
      },
      {
        "key": "balanceAmount",
        "label": "Balance",
        "format": "money"
      },
      {
        "key": "status",
        "label": "Status",
        "format": "status"
      }
    ],
    "fields": [
      {
        "key": "studentId",
        "label": "Student",
        "required": true,
        "source": "/workspace/students"
      },
      {
        "key": "termId",
        "label": "Term",
        "required": true,
        "source": "/workspace/terms"
      },
      {
        "key": "description",
        "label": "Description",
        "required": true
      },
      {
        "key": "amount",
        "label": "Amount (INR)",
        "required": true,
        "type": "currency",
        "min": 1,
        "max": 100000000
      },
      {
        "key": "dueDate",
        "label": "Due date",
        "required": false,
        "type": "date"
      }
    ]
  },
  "payments": {
    "title": "Payment records",
    "description": "Keep your school information organized and up to date.",
    "endpoint": "/workspace/payments",
    "columns": [
      {
        "key": "receiptNumber",
        "label": "Receipt"
      },
      {
        "key": "reference",
        "label": "Reference"
      },
      {
        "key": "amount",
        "label": "Amount",
        "format": "money"
      },
      {
        "key": "paymentMethod",
        "label": "Method"
      },
      {
        "key": "paymentDate",
        "label": "Date",
        "format": "date"
      }
    ],
    "fields": [
      {
        "key": "invoiceId",
        "label": "Invoice",
        "required": true,
        "source": "/workspace/invoices"
      },
      {
        "key": "amount",
        "label": "Amount (INR)",
        "required": true,
        "type": "currency",
        "min": 1,
        "max": 100000000
      },
      {
        "key": "paymentMethod",
        "label": "Payment method",
        "required": true,
        "options": [
          "RAZORPAY",
          "UPI",
          "NET_BANKING",
          "CASH",
          "BANK_TRANSFER",
          "CHEQUE",
          "CARD",
          "OTHER"
        ]
      },
      {
        "key": "reference",
        "label": "Reference",
        "required": true
      },
      {
        "key": "paymentDate",
        "label": "Payment date",
        "required": false,
        "type": "date"
      }
    ]
  },
  "examinations": {
    "title": "Examinations",
    "description": "Plan assessments and celebrate learning progress.",
    "endpoint": "/workspace/examinations",
    "columns": [
      {
        "key": "name",
        "label": "Assessment"
      },
      {
        "key": "className",
        "label": "Class"
      },
      {
        "key": "termName",
        "label": "Term"
      },
      {
        "key": "startDate",
        "label": "Starts",
        "format": "date"
      },
      {
        "key": "isPublished",
        "label": "Published"
      }
    ],
    "fields": [
      {
        "key": "name",
        "label": "Name",
        "required": true
      },
      {
        "key": "classId",
        "label": "Class",
        "required": true,
        "source": "/workspace/classes"
      },
      {
        "key": "termId",
        "label": "Term",
        "required": true,
        "source": "/workspace/terms"
      },
      {
        "key": "startDate",
        "label": "Start date",
        "required": true,
        "type": "date"
      },
      {
        "key": "endDate",
        "label": "End date",
        "required": true,
        "type": "date"
      },
      {
        "key": "subjectId",
        "label": "Subject",
        "required": true,
        "source": "/workspace/subjects"
      },
      {
        "key": "totalMarks",
        "label": "Maximum marks",
        "required": true,
        "type": "number",
        "min": 1,
        "max": 1000
      }
    ],
    "action": {
      "label": "Publish",
      "path": "publish"
    }
  },
  "tickets": {
    "title": "Support tickets",
    "description": "Get help keeping your school moving.",
    "endpoint": "/workspace/tickets",
    "columns": [
      {
        "key": "subject",
        "label": "Subject"
      },
      {
        "key": "description",
        "label": "Description"
      },
      {
        "key": "priority",
        "label": "Priority"
      },
      {
        "key": "status",
        "label": "Status",
        "format": "status"
      },
      {
        "key": "createdAt",
        "label": "Opened",
        "format": "date"
      }
    ],
    "fields": [
      {
        "key": "subject",
        "label": "Subject",
        "required": true
      },
      {
        "key": "description",
        "label": "Description",
        "required": true,
        "type": "textarea"
      },
      {
        "key": "priority",
        "label": "Priority",
        "required": false,
        "options": [
          "LOW",
          "NORMAL",
          "HIGH",
          "URGENT"
        ]
      }
    ]
  }
};
export const adminResources:Record<string,ResourceConfig>={
  "schools": {
    "title": "School communities",
    "description": "Keep your school communities connected and supported.",
    "endpoint": "/admin/schools",
    "columns": [
      {
        "key": "name",
        "label": "School"
      },
      {
        "key": "subdomain",
        "label": "Subdomain"
      },
      {
        "key": "contactEmail",
        "label": "Contact"
      },
      {
        "key": "status",
        "label": "Status",
        "format": "status"
      },
      {
        "key": "createdAt",
        "label": "Joined",
        "format": "date"
      }
    ],
    "fields": [
      {
        "key": "name",
        "label": "Name",
        "required": true
      },
      {
        "key": "subdomain",
        "label": "Subdomain",
        "required": true
      },
      {
        "key": "contactEmail",
        "label": "Contact email",
        "required": true,
        "type": "email"
      },
      {
        "key": "contactPhone",
        "label": "Contact phone",
        "required": true
      },
      {
        "key": "address",
        "label": "Address",
        "required": false
      },
      {
        "key": "status",
        "label": "Status",
        "required": false,
        "options": [
          "ACTIVE",
          "TRIAL",
          "SUSPENDED",
          "EXPIRED",
          "CANCELLED"
        ]
      }
    ],
    "editable": true
  },
  "users": {
    "title": "People & access",
    "description": "Keep your school communities connected and supported.",
    "endpoint": "/admin/users",
    "columns": [
      {
        "key": "name",
        "label": "Person"
      },
      {
        "key": "email",
        "label": "Email"
      },
      {
        "key": "schoolName",
        "label": "School"
      },
      {
        "key": "role",
        "label": "Role"
      },
      {
        "key": "status",
        "label": "Status",
        "format": "status"
      }
    ],
    "fields": [
      {
        "key": "tenantId",
        "label": "School",
        "required": true,
        "source": "/admin/schools"
      },
      {
        "key": "email",
        "label": "Email",
        "required": true,
        "type": "email"
      },
      {
        "key": "firstName",
        "label": "First name",
        "required": true
      },
      {
        "key": "lastName",
        "label": "Last name",
        "required": true
      },
      {
        "key": "password",
        "label": "Password",
        "required": true,
        "type": "password"
      },
      {
        "key": "role",
        "label": "Role",
        "required": true,
        "options": [
          "SUPER_ADMIN",
          "SCHOOL_OWNER",
          "PRINCIPAL",
          "DEPUTY_PRINCIPAL",
          "SCHOOL_ADMIN",
          "ACCOUNTANT",
          "TEACHER",
          "CLASS_TEACHER",
          "EXAM_OFFICER",
          "LIBRARIAN",
          "TRANSPORT_OFFICER",
          "PARENT",
          "RECEPTIONIST",
          "AUDITOR"
        ]
      },
      {
        "key": "status",
        "label": "Status",
        "required": false,
        "options": [
          "ACTIVE",
          "SUSPENDED"
        ]
      }
    ],
    "editable": true
  },
  "subscriptions": {
    "title": "Subscriptions",
    "description": "Keep your school communities connected and supported.",
    "endpoint": "/admin/subscriptions",
    "columns": [
      {
        "key": "schoolName",
        "label": "School"
      },
      {
        "key": "planName",
        "label": "Plan"
      },
      {
        "key": "price",
        "label": "Plan price",
        "format": "money"
      },
      {
        "key": "endDate",
        "label": "Ends",
        "format": "date"
      },
      {
        "key": "status",
        "label": "Status",
        "format": "status"
      }
    ],
    "fields": [
      {
        "key": "tenantId",
        "label": "School",
        "required": true,
        "source": "/admin/schools"
      },
      {
        "key": "planId",
        "label": "Plan",
        "required": true,
        "source": "/admin/plans"
      },
      {
        "key": "startDate",
        "label": "Start date",
        "required": true,
        "type": "date"
      },
      {
        "key": "endDate",
        "label": "End date",
        "required": true,
        "type": "date"
      },
      {
        "key": "status",
        "label": "Status",
        "required": true,
        "options": [
          "TRIAL",
          "ACTIVE",
          "PAST_DUE",
          "CANCELLED",
          "EXPIRED"
        ]
      }
    ],
    "editable": true
  },
  "tickets": {
    "title": "Support center",
    "description": "Keep your school communities connected and supported.",
    "endpoint": "/admin/tickets",
    "columns": [
      {
        "key": "schoolName",
        "label": "School"
      },
      {
        "key": "subject",
        "label": "Subject"
      },
      {
        "key": "description",
        "label": "Description"
      },
      {
        "key": "creatorName",
        "label": "Opened by"
      },
      {
        "key": "priority",
        "label": "Priority"
      },
      {
        "key": "status",
        "label": "Status",
        "format": "status"
      },
      {
        "key": "createdAt",
        "label": "Opened",
        "format": "date"
      }
    ],
    "fields": [
      {
        "key": "status",
        "label": "Status",
        "required": true,
        "options": [
          "OPEN",
          "IN_PROGRESS",
          "RESOLVED",
          "CLOSED"
        ]
      },
      {
        "key": "priority",
        "label": "Priority",
        "required": false,
        "options": [
          "LOW",
          "NORMAL",
          "HIGH",
          "URGENT"
        ]
      }
    ],
    "editable": true,
    "createAllowed": false
  },
  "announcements": {
    "title": "Platform announcements",
    "description": "Keep your school communities connected and supported.",
    "endpoint": "/admin/announcements",
    "columns": [
      {
        "key": "title",
        "label": "Title"
      },
      {
        "key": "status",
        "label": "Status",
        "format": "status"
      },
      {
        "key": "publishedAt",
        "label": "Published",
        "format": "date"
      }
    ],
    "fields": [
      {
        "key": "title",
        "label": "Title",
        "required": true
      },
      {
        "key": "body",
        "label": "Body",
        "required": true,
        "type": "textarea"
      }
    ],
    "editable": false,
    "action": {
      "label": "Publish",
      "path": "publish"
    }
  }
};

