class Permission {
  constructor(startDate, endDate, isRecurring, recurrencePattern, isValid, assignedStudent, assignedBy, associatedCard) {
    this.startDate = startDate;
    this.endDate = endDate;
    this.isRecurring = isRecurring;
    this.recurrencePattern = recurrencePattern;
    this.isValid = isValid;
    this.assignedStudent = assignedStudent;
    this.assignedBy = assignedBy;
    this.associatedCard = associatedCard;
  }
}
module.exports = Permission;