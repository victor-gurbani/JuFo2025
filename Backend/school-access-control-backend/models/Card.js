class Card {
  constructor(uid, lastAssigned, isValid) {
    this.uid = uid;
    this.lastAssigned = lastAssigned;
    this.isValid = isValid;
  }
  invalidate() {
    this.isValid = false;
  }
}
module.exports = Card;