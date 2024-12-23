# My idea & Q+A


I want to build a project for my school's entrance system. Your task is to write the diagrams and doc that i will send to the schools IT department. Ill try to explain my project now, but before continuing with your task, please ask me 5 questions to make sure you've understood it correctly. The idea is that Teachers have in their room a few plastic cards. When a student gives permission to leave school for a day (e.g. illness), instead of having to organise it with the secretary's office, the teacher can directly access their ipad and enter the id of the card, the name of the student they are giving it to, and when it is valid. This helps both students who have to go in and out of school frequently for extracurricular activities and students who leave at a specific time, as they would not normally be able to leave if the parent is not physically present. 
To verify that the students are the ones using the cards, the system will include a reader at the entrance of the school, as well as a screen that can be seen by the caretaker. When the card is read, the screen shows a picture of the student who should have the card and can swipe it. That way the card can be verified that it has not been changed hands. I will take care of the software and hardware. The card will be like the metro cards in Madrid, which can't be cloned with any kind of tool. As all the data will be kept inside the school and Phidias already has a photo of each student, this will not cause any inconvenience or data protection problems. 

## Questions
Could you clarify the workflow for when a teacher assigns a card? For example, are the plastic cards pre-registered in the system with unique IDs, or does the teacher need to register new cards when giving them out?

Regarding the validity period: Can teachers set both start and end dates/times for the permission, or is it always for a single day? Also, can they set recurring permissions (e.g., for students who regularly leave early for sports practice)?

For the entrance verification system: Should the caretaker take any action to approve/deny entry, or is the screen just for visual verification? Also, should the system keep logs of entries/exits?

How will the system handle lost or stolen cards? Is there a way for teachers or administrators to immediately invalidate specific cards?

Will teachers need different levels of permissions? For example, should class tutors only be able to assign cards to their own students, or can any teacher give permission to any student?

## Answers

The cards will be preregistered in the system with their own uids, however a teacher will get a card, and note down the ID of the card to assign it to a child. This way the child can have a card to enter and exit the school during the period the teacher chooses.
Teachers can set start and end dates, as well as recurring dates, e.g.for punctual events like illnesses or recurring events like sports practice or children that live next to the school and prefer eating at home
The caretaker/security will enforce what the screen says, they will verify the child is the same as the one on the photo and if they are allowed to enter/leave the groudns. Logs should be kept for security reasons.
If a card goes missing, the system can easily get who the lat person who had the card was, that way they will have to pay a fine if not given back after 1 week (for example). They system should handle immediate invalidation of specific cards, this is however not a main concern as a card only contains a UID and its invalid if the person who should have the card (and therefore appears in the screen to the caretakers) is not the one with the card.
Yes, techers will have different levels of permiissions. If possible, all teachers or subsitutes of a specific student should have access to read when they can exit the grounds (to let them out of class) and tutors should be able to give out new cards to their students (assuming they have already received a confirmation from the parents).

