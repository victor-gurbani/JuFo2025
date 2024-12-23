class AccessLog {
    constructor(timestamp, direction, student, card, wasApproved) {
      this.timestamp = timestamp;
      this.direction = direction;
      this.student = student;
      this.card = card;
      this.wasApproved = wasApproved;
    }
  }
  module.exports = AccessLog;