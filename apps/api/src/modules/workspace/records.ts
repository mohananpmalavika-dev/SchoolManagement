import {BadRequestException} from '@nestjs/common';
import {isEmail,isUUID} from 'class-validator';
export interface RecordSpec {model:string;roles?:string[];nullable?:string[];fields:Record<string,string>}
export const recordSpecs:Record<string,RecordSpec> = {
  "students": {
    "model": "student",
    "nullable": ["currentClassId", "userId"],
    "roles": [
      "SCHOOL_OWNER",
      "PRINCIPAL",
      "DEPUTY_PRINCIPAL",
      "SCHOOL_ADMIN",
      "RECEPTIONIST"
    ],
    "fields": {
      "admissionNumber": "text!",
      "firstName": "text!",
      "lastName": "text!",
      "dateOfBirth": "date!",
      "gender": "enum:MALE,FEMALE,OTHER!",
      "admissionDate": "date!",
      "currentClassId": "ref:class",
      "status": "enum:ACTIVE,GRADUATED,TRANSFERRED,WITHDRAWN,SUSPENDED",
      "userId": "ref:user"
    }
  },
  "guardians": {
    "model": "guardian",
    "nullable": ["email", "userId"],
    "roles": [
      "SCHOOL_OWNER",
      "PRINCIPAL",
      "SCHOOL_ADMIN",
      "RECEPTIONIST"
    ],
    "fields": {
      "firstName": "text!",
      "lastName": "text!",
      "phone": "text!",
      "email": "email",
      "userId": "ref:user"
    }
  },
  "guardian-links": {
    "model": "guardianStudentLink",
    "roles": [
      "SCHOOL_OWNER",
      "PRINCIPAL",
      "SCHOOL_ADMIN",
      "RECEPTIONIST"
    ],
    "fields": {
      "guardianId": "ref:guardian!",
      "studentId": "ref:student!",
      "relationship": "enum:MOTHER,FATHER,GUARDIAN,GRANDPARENT,SIBLING,AUNT,UNCLE,OTHER!"
    }
  },
  "staff": {
    "model": "staff",
    "nullable": ["userId"],
    "roles": [
      "SCHOOL_OWNER",
      "PRINCIPAL",
      "SCHOOL_ADMIN"
    ],
    "fields": {
      "staffNumber": "text!",
      "firstName": "text!",
      "lastName": "text!",
      "email": "email!",
      "phone": "text!",
      "gender": "enum:MALE,FEMALE,OTHER!",
      "department": "enum:ADMINISTRATION,TEACHING,FINANCE,LIBRARY,TRANSPORT,MAINTENANCE,SECURITY,IT,OTHER!",
      "position": "text!",
      "employmentType": "enum:PERMANENT,CONTRACT,PART_TIME,TEMPORARY,INTERN!",
      "hireDate": "date!",
      "userId": "ref:user"
    }
  },
  "years": {
    "model": "academicYear",
    "fields": {
      "name": "text!",
      "startDate": "date!",
      "endDate": "date!"
    }
  },
  "terms": {
    "model": "term",
    "fields": {
      "name": "text!",
      "academicYearId": "ref:academicYear!",
      "termNumber": "int:1:4!",
      "startDate": "date!",
      "endDate": "date!"
    }
  },
  "classes": {
    "model": "class",
    "fields": {
      "name": "text!",
      "schoolId": "ref:school!",
      "level": "text!",
      "educationLevel": "enum:PRE_PRIMARY,PRIMARY,MIDDLE,SECONDARY,SENIOR_SECONDARY!"
    }
  },
  "streams": {
    "model": "stream",
    "fields": {
      "name": "text!",
      "schoolId": "ref:school!",
      "classId": "ref:class!",
      "capacity": "int:1:500!"
    }
  },
  "subjects": {
    "model": "subject",
    "fields": {
      "name": "text!",
      "code": "text!",
      "educationLevel": "enum:PRE_PRIMARY,PRIMARY,MIDDLE,SECONDARY,SENIOR_SECONDARY!"
    }
  },
  "schools": {
    "model": "school",
    "nullable": ["district", "pincode", "boardAffiliation"],
    "fields": {
      "name": "text!",
      "email": "email!",
      "phone": "text!",
      "address": "text!",
      "city": "text!",
      "district": "text",
      "state": "text!",
      "pincode": "text",
      "boardAffiliation": "enum:CBSE,ICSE,STATE_BOARD,IB,IGCSE",
      "schoolType": "enum:PUBLIC,PRIVATE,ACADEMY,TUITION_CENTRE,INTERNATIONAL!"
    }
  },
  "books": {
    "model": "book",
    "nullable": ["author", "isbn", "category"],
    "roles": [
      "SCHOOL_OWNER",
      "PRINCIPAL",
      "SCHOOL_ADMIN",
      "LIBRARIAN"
    ],
    "fields": {
      "title": "text!",
      "author": "text",
      "isbn": "text",
      "category": "text",
      "quantity": "int:1:10000!"
    }
  },
  "borrowings": {
    "model": "bookBorrowing",
    "roles": [
      "SCHOOL_OWNER",
      "PRINCIPAL",
      "SCHOOL_ADMIN",
      "LIBRARIAN"
    ],
    "fields": {
      "bookId": "ref:book!",
      "borrowerId": "ref:student!",
      "dueDate": "date!"
    }
  },
  "vehicles": {
    "model": "vehicle",
    "nullable": ["make", "model"],
    "roles": [
      "SCHOOL_OWNER",
      "PRINCIPAL",
      "SCHOOL_ADMIN",
      "TRANSPORT_OFFICER"
    ],
    "fields": {
      "registrationNumber": "text!",
      "make": "text",
      "model": "text",
      "capacity": "int:1:100!",
      "status": "enum:ACTIVE,MAINTENANCE,INACTIVE"
    }
  },
  "routes": {
    "model": "route",
    "nullable": ["vehicleId", "pickupTime", "dropoffTime"],
    "roles": [
      "SCHOOL_OWNER",
      "PRINCIPAL",
      "SCHOOL_ADMIN",
      "TRANSPORT_OFFICER"
    ],
    "fields": {
      "name": "text!",
      "vehicleId": "ref:vehicle",
      "pickupTime": "time",
      "dropoffTime": "time",
      "fee": "int:0:100000000"
    }
  },
  "inventory": {
    "model": "inventoryItem",
    "nullable": ["category", "unit"],
    "fields": {
      "name": "text!",
      "category": "text",
      "quantity": "int:0:100000!",
      "unit": "text",
      "reorderLevel": "int:0:100000"
    }
  },
  "events": {
    "model": "schoolEvent",
    "nullable": ["description", "location"],
    "fields": {
      "title": "text!",
      "description": "long",
      "eventType": "enum:HOLIDAY,EXAM,MEETING,SPORTS,CULTURAL,ACADEMIC,OTHER!",
      "category": "enum:ACADEMIC,ADMINISTRATIVE,EXTRACURRICULAR,HOLIDAY!",
      "startDate": "date!",
      "endDate": "date!",
      "location": "text"
    }
  },
  "timetable": {
    "model": "timetableEntry",
    "fields": {
      "classId": "ref:class!",
      "subjectId": "ref:subject!",
      "teacherId": "ref:staff!",
      "dayOfWeek": "int:1:7!",
      "period": "text!",
      "startTime": "time!",
      "endTime": "time!",
      "room": "text"
    }
  },
  "invoices": {
    "model": "invoice",
    "roles": [
      "SCHOOL_OWNER",
      "PRINCIPAL",
      "SCHOOL_ADMIN",
      "ACCOUNTANT"
    ],
    "fields": {
      "studentId": "ref:student!",
      "termId": "ref:term!",
      "description": "text!",
      "amount": "int:1:100000000!",
      "dueDate": "date"
    }
  },
  "payments": {
    "model": "payment",
    "roles": [
      "SCHOOL_OWNER",
      "PRINCIPAL",
      "SCHOOL_ADMIN",
      "ACCOUNTANT"
    ],
    "fields": {
      "invoiceId": "ref:invoice!",
      "amount": "int:1:100000000!",
      "paymentMethod": "enum:RAZORPAY,UPI,NET_BANKING,CASH,BANK_TRANSFER,CHEQUE,CARD,OTHER!",
      "reference": "text!",
      "paymentDate": "date"
    }
  },
  "examinations": {
    "model": "examination",
    "fields": {
      "name": "text!",
      "classId": "ref:class!",
      "termId": "ref:term!",
      "startDate": "date!",
      "endDate": "date!",
      "subjectId": "ref:subject!",
      "totalMarks": "int:1:1000!"
    }
  },
  "tickets": {
    "model": "supportTicket",
    "roles": ["SUPER_ADMIN", "SCHOOL_OWNER", "PRINCIPAL", "DEPUTY_PRINCIPAL", "SCHOOL_ADMIN", "ACCOUNTANT", "LIBRARIAN", "TRANSPORT_OFFICER", "RECEPTIONIST", "AUDITOR"],
    "fields": {
      "subject": "text!",
      "description": "long!",
      "priority": "enum:LOW,NORMAL,HIGH,URGENT"
    }
  },
  "assignments": {
    "model": "assignment",
    "roles": [
      "SUPER_ADMIN",
      "SCHOOL_OWNER",
      "PRINCIPAL",
      "SCHOOL_ADMIN",
      "TEACHER",
      "CLASS_TEACHER",
      "EXAM_OFFICER"
    ],
    "fields": {
      "title": "text!",
      "classId": "ref:class!",
      "subjectId": "ref:subject!",
      "description": "long!",
      "dueDate": "date!",
      "maxMarks": "int:1:1000!"
    }
  },
  "materials": {
    "model": "learningMaterial",
    "nullable": ["description"],
    "roles": [
      "SUPER_ADMIN",
      "SCHOOL_OWNER",
      "PRINCIPAL",
      "SCHOOL_ADMIN",
      "TEACHER",
      "CLASS_TEACHER",
      "EXAM_OFFICER"
    ],
    "fields": {
      "title": "text!",
      "classId": "ref:class!",
      "subjectId": "ref:subject!",
      "description": "long",
      "url": "url!"
    }
  },
  "report-cards": {
    "model": "reportCard",
    "fields": {
      "studentId": "ref:student!",
      "termId": "ref:term!",
      "classTeacherComments": "long",
      "principalComments": "long"
    }
  }
};
export const managers=['SUPER_ADMIN','SCHOOL_OWNER','PRINCIPAL','DEPUTY_PRINCIPAL','SCHOOL_ADMIN'];
export function parseRecord(spec:RecordSpec,input:Record<string,unknown>,partial=false):Record<string,any>{
 const result:Record<string,any>={};
 for(const key of Object.keys(input))if(!Object.hasOwn(spec.fields,key))throw new BadRequestException('Unknown field: '+key);
 for(const [key,rule] of Object.entries(spec.fields)){
  const required=rule.endsWith('!');const kind=rule.replace(/!$/,'');const value=input[key];
  if(value===undefined){if(required&&!partial)throw new BadRequestException(key+' is required');continue;}
  if(value===null||value===''){
   if(required)throw new BadRequestException(key+' is required');
   if(partial&&spec.nullable?.includes(key))result[key]=null;
   else if(value===null)throw new BadRequestException(key+' cannot be cleared');
   continue;
  }
  if(kind.startsWith('int:')){const [,min,max]=kind.split(':');if(typeof value!=='number'||!Number.isSafeInteger(value)||value<Number(min)||value>Number(max))throw new BadRequestException(key+' must be a whole number between '+min+' and '+max);result[key]=value;continue;}
  if(typeof value!=='string')throw new BadRequestException(key+' must be text');
  const trimmed=value.trim();if(!trimmed||trimmed.length>(kind==='long'?10000:kind==='password'?128:255))throw new BadRequestException('Invalid '+key);
  if(kind==='url'){try{if(new URL(trimmed).protocol!=='https:')throw new Error();}catch{throw new BadRequestException('Use an HTTPS resource link');}}
  if(kind==='email'&&!isEmail(trimmed))throw new BadRequestException('Invalid email address');
  if(kind.startsWith('ref:')&&!isUUID(trimmed))throw new BadRequestException('Invalid '+key);
  if(kind.startsWith('enum:')&&!kind.slice(5).split(',').includes(trimmed))throw new BadRequestException('Invalid '+key);
  if(kind==='date'){if(!/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(trimmed)||!Number.isFinite(Date.parse(trimmed))||new Date(trimmed.slice(0,10)+'T00:00:00.000Z').toISOString().slice(0,10)!==trimmed.slice(0,10))throw new BadRequestException('Invalid '+key);result[key]=new Date(trimmed);continue;}
  if(kind==='time'&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed))throw new BadRequestException('Invalid time');
  if(kind==='password'&&trimmed.length<12)throw new BadRequestException('Password must contain at least 12 characters');
  result[key]=kind==='email'?trimmed.toLowerCase():trimmed;
 }
 if(result.startDate&&result.endDate&&result.startDate>result.endDate)throw new BadRequestException('End date must follow start date');
 if(result.startTime&&result.endTime&&result.startTime>=result.endTime)throw new BadRequestException('End time must follow start time');
 return result;
}
