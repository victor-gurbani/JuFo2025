# API Requirements Documentation
## Access Control System Integration

### Required API Endpoints by the school (assume given by the school)

#### 1. Student Information API
```
GET /api/students
```
Required fields:
- student_id (unique identifier)
- full_name
- class_group
- tutor_id
- photo_url (or photo data)
- active_status (boolean)
- parent_contact_info

Query parameters needed:
- Filter by class
- Filter by tutor
- Search by name
- Filter by active status

#### 2. Teacher Information API
```
GET /api/teachers
```
Required fields:
- teacher_id (unique identifier)
- full_name
- roles (array of roles: ["tutor", "subject_teacher", "admin"])
- assigned_classes (array of class_ids)
- active_status (boolean)
- subjects_taught (array of subjects)

Query parameters needed:
- Filter by role
- Filter by class
- Search by name

#### 3. Class Groups API
```
GET /api/classes
```
Required fields:
- class_id
- class_name
- tutor_id
- academic_year 
- schedule (regular school hours)
- student_list (array of student_ids)

#### 5. Schedule Information API
```
GET /api/schedules
```
Required fields:
- class_id
- regular_schedule (daily school hours)
- special_events
- holidays
- academic_calendar


Note: Authentication isnt the most important part of this project, as the project will be inside the schools LAN and only accesible from there. However, the projct should include safety measures to ensure teachers cannot break the system or access data they shouldnt.