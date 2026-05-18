# 🔌 API Documentation - ET PIM Alumni System

This document describes the Google Apps Script API used by the Alumni System.

---

## Overview

### Architecture
- **Type**: RESTful API via Google Apps Script
- **Authentication**: Username/Password with role-based access
- **Response Format**: JSON
- **Encoding**: UTF-8
- **Base URL**: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`

### Response Format
```json
{
  "status": "success|error",
  "data": {},
  "message": "Description",
  "timestamp": "2026-05-18T10:30:00Z"
}
```

---

## Endpoints

### 1. Authentication

#### Login
**Endpoint**: POST
**Parameters**:
```
action: "login"
username: "admin"
password: "admin123"
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": "admin_user_1",
    "username": "admin",
    "role": "admin",
    "name": "Administrator",
    "sessionToken": "abc123xyz"
  },
  "message": "Login successful"
}
```

**Errors**:
- `"status": "error"` - Invalid username/password
- `403` - User not authorized
- `500` - Server error

---

### 2. Data Operations

#### Get All Students
**Endpoint**: POST
**Parameters**:
```
action: "getData"
sessionToken: "abc123xyz"
```

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "idCard": "1234567890123",
      "nameTH": "นายสมชาย",
      "gradYear": 2564,
      "jobStatus": "ทำงาน",
      "jobCompany": "Google",
      ...
    },
    {...}
  ],
  "message": "Data retrieved",
  "count": 245
}
```

---

#### Get Student by ID
**Endpoint**: POST
**Parameters**:
```
action: "getStudent"
idCard: "1234567890123"
sessionToken: "abc123xyz"
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "idCard": "1234567890123",
    "nameTH": "นายสมชาย",
    "surnameEN": "Somchai",
    "email": "somchai@pim.ac.th",
    "phone": "0812345678",
    "gradYear": 2564,
    "branch": "CAI",
    "jobStatus": "ทำงาน",
    "jobCompany": "Google",
    "jobPosition": "Software Engineer",
    "jobSalary": 60000,
    ...
  }
}
```

---

#### Add Student
**Endpoint**: POST
**Parameters**:
```
action: "addStudent"
sessionToken: "abc123xyz"
data: {
  "idCard": "1234567890123",
  "prefix": "นาย",
  "nameTH": "สมชาย",
  "surnameTH": "ใจดี",
  "nameEN": "Somchai",
  "surnameEN": "Jaidi",
  "gradYear": 2564,
  "branch": "CAI",
  "faculty": "วิศวกรรมศาสตร์และเทคโนโลยี",
  "birthDate": "1999-05-15",
  "phone": "0812345678",
  "email": "somchai@pim.ac.th",
  ...
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "idCard": "1234567890123",
    "created": "2026-05-18T10:30:00Z"
  },
  "message": "Student added successfully"
}
```

**Required Fields**:
- idCard (13 digits)
- prefix, nameTH, surnameTH
- nameEN, surnameEN
- gradYear, branch, faculty
- birthDate (YYYY-MM-DD)
- phone, email

---

#### Update Student
**Endpoint**: POST
**Parameters**:
```
action: "updateStudent"
sessionToken: "abc123xyz"
idCard: "1234567890123"
data: {
  "jobStatus": "ศึกษาต่อ",
  "jobCompany": "Microsoft",
  ...
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "idCard": "1234567890123",
    "updated": "2026-05-18T10:31:00Z"
  },
  "message": "Student updated successfully"
}
```

---

#### Delete Student
**Endpoint**: POST
**Parameters**:
```
action: "deleteStudent"
sessionToken: "abc123xyz"
idCard: "1234567890123"
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "idCard": "1234567890123",
    "deleted": "2026-05-18T10:32:00Z"
  },
  "message": "Student deleted successfully"
}
```

---

### 3. Import/Export

#### Import Data
**Endpoint**: POST
**Parameters**:
```
action: "importData"
sessionToken: "abc123xyz"
mode: "upsert" // or "append" or "replace"
data: [
  {"idCard": "...", "nameTH": "...", ...},
  {...}
]
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "imported": 45,
    "updated": 10,
    "errors": 2
  },
  "message": "Import completed"
}
```

**Modes**:
- `upsert`: Update existing + Add new (default)
- `append`: Add all (may create duplicates)
- `replace`: Delete all and import new

---

#### Export Data
**Endpoint**: POST
**Parameters**:
```
action: "exportData"
sessionToken: "abc123xyz"
format: "xlsx" // or "csv"
filter: {
  "status": "ทำงาน",
  "year": 2564
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "url": "https://..../exported_data.xlsx",
    "recordCount": 245,
    "timestamp": "2026-05-18T10:30:00Z"
  }
}
```

---

### 4. Lookup/Search

#### Search Students
**Endpoint**: POST
**Parameters**:
```
action: "search"
sessionToken: "abc123xyz"
query: "สมชาย"
fields: ["nameTH", "nameEN", "email"]
limit: 10
```

**Response**:
```json
{
  "status": "success",
  "data": [
    {"idCard": "...", "nameTH": "นายสมชาย", ...},
    {...}
  ],
  "count": 3
}
```

---

#### Get Companies
**Endpoint**: POST
**Parameters**:
```
action: "getCompanies"
sessionToken: "abc123xyz"
```

**Response**:
```json
{
  "status": "success",
  "data": [
    {"name": "Google", "count": 12},
    {"name": "Microsoft", "count": 8},
    ...
  ],
  "total": 156
}
```

---

#### Get Statistics
**Endpoint**: POST
**Parameters**:
```
action: "getStatistics"
sessionToken: "abc123xyz"
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "total": 245,
    "employed": 198,
    "employmentRate": 0.809,
    "studying": 32,
    "unemployed": 15,
    "avgSalary": 45000,
    "avgTimeToJob": 4.2
  }
}
```

---

## Error Codes

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (missing parameters) |
| 401 | Unauthorized (invalid session) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found (student ID doesn't exist) |
| 500 | Server error |

### Error Response Example
```json
{
  "status": "error",
  "message": "Invalid username or password",
  "code": "AUTH_FAILED",
  "timestamp": "2026-05-18T10:30:00Z"
}
```

---

## Data Types

### Student Object
```json
{
  // Personal
  "idCard": "1234567890123",
  "prefix": "นาย",
  "nameTH": "สมชาย",
  "surnameTH": "ใจดี",
  "nameEN": "Somchai",
  "surnameEN": "Jaidi",
  "nickname": "ชาย",
  "gender": "M",
  "birthDate": "1999-05-15",
  "age": 27,
  
  // Address
  "currentAddress": "123 ถนนเศรษฐกิจ บางนา",
  "homeAddress": "456 ถนนสุขสวัสดิ์",
  
  // Academic
  "gradYear": 2564,
  "gradDate": "2021-05-15",
  "branch": "CAI",
  "branchCode": "340101",
  "faculty": "วิศวกรรมศาสตร์และเทคโนโลยี",
  
  // Contact
  "phone": "0812345678",
  "email": "somchai@pim.ac.th",
  
  // Parent
  "parentName": "นายประเทือง ใจดี",
  "parentPhone": "0899876543",
  "parentRelation": "Father",
  
  // Employment
  "jobStatus": "ทำงาน",
  "jobStartDate": "2021-08-01",
  "jobCurrentStatus": "Still working",
  "jobCompany": "Google",
  "jobPosition": "Software Engineer",
  "jobDept": "Engineering",
  "jobSalary": 60000,
  "durationToGetJob": "3 เดือน"
}
```

---

## Authentication

### Session Management
1. Login with username/password → Get `sessionToken`
2. Include `sessionToken` in all subsequent requests
3. Session valid for 24 hours
4. Logout to invalidate session

### Security
- Passwords hashed with BCRYPT
- Session tokens are one-time use per request
- HTTPS required
- CORS enabled for frontend only

---

## Rate Limiting

### Limits (per minute)
- Public endpoints: 60 requests
- Authenticated endpoints: 300 requests
- Import/Export: 10 requests

### Response Headers
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 295
X-RateLimit-Reset: 1684420260
```

---

## Examples

### JavaScript Example
```javascript
// Login
const response = await fetch(API_URL, {
  method: "POST",
  headers: {"Content-Type": "application/x-www-form-urlencoded"},
  body: new URLSearchParams({
    action: "login",
    username: "admin",
    password: "admin123"
  })
});
const result = await response.json();
const sessionToken = result.data.sessionToken;

// Get all students
const dataResponse = await fetch(API_URL, {
  method: "POST",
  body: new URLSearchParams({
    action: "getData",
    sessionToken: sessionToken
  })
});
const students = await dataResponse.json();
console.log(students.data);
```

### Curl Example
```bash
# Login
curl -X POST \
  -d "action=login&username=admin&password=admin123" \
  https://script.google.com/macros/s/YOUR_ID/exec

# Get data
curl -X POST \
  -d "action=getData&sessionToken=abc123xyz" \
  https://script.google.com/macros/s/YOUR_ID/exec
```

---

## Pagination

### Getting Large Datasets
```
action: "getData"
limit: 100
offset: 0
```

**Response**:
```json
{
  "data": [...100 items...],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 245,
    "hasMore": true
  }
}
```

---

## Filtering

### Search with Filters
```
action: "search"
query: ""
filters: {
  "status": "ทำงาน",
  "branch": "CAI",
  "gradYear": 2564
}
```

---

## Testing API

### Using Postman
1. Install [Postman](https://www.postman.com)
2. Create POST request to API_URL
3. Set Body → form-data
4. Add parameters
5. Send request

### Using Browser Console
```javascript
// Test in developer console (F12)
fetch(API_URL, {
  method: "POST",
  body: new URLSearchParams({
    action: "login",
    username: "admin",
    password: "admin123"
  })
}).then(r => r.json()).then(console.log);
```

---

## Changelog

### v2.0.0
- Added authentication
- Added all CRUD endpoints
- Added search and filters
- Added statistics
- Added import/export

### v1.0.0
- Initial API

---

**API Version**: 2.0.0
**Last Updated**: May 18, 2026
**Status**: Production Ready
