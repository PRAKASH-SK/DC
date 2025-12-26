const db = require("../config/db");

exports.complaint_id = () => {
  return new Promise((resolve, reject) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const digits  = '0123456789'.split('');

    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    let candidate;
    while (true) {
      // pick 2-4 letters and the rest digits
      const letterCount = Math.floor(Math.random() * 3) + 2; // 2,3,4 letters
      const digitCount = 6 - letterCount; // 2,3,4 digits

      if (letterCount > letters.length || digitCount > digits.length) continue;

      // pick random letters/digits without repetition
      const chosenLetters = shuffle([...letters]).slice(0, letterCount);
      const chosenDigits  = shuffle([...digits]).slice(0, digitCount);

      candidate = shuffle([...chosenLetters, ...chosenDigits]).join('');

      // sanity check (at least 2 letters and 2 digits)
      const lettersNum = (candidate.match(/[A-Z]/g) || []).length;
      const digitsNum  = (candidate.match(/[0-9]/g) || []).length;

      if (lettersNum >= 2 && digitsNum >= 2) break;
    }

    resolve(`CMP-${candidate}`);
  });
};



exports.meeting_id = () => {
  return new Promise((resolve, reject) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const digits  = '0123456789'.split('');

    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    let candidate;
    while (true) {
      // pick at least 1 letter and 1 digit, total = 4
      // random letterCount between 1–3, remaining digits
      const letterCount = Math.floor(Math.random() * 3) + 1; // 1,2,3 letters
      const digitCount = 4 - letterCount;

      if (letterCount > letters.length || digitCount > digits.length) continue;

      // pick random letters/digits without repetition
      const chosenLetters = shuffle([...letters]).slice(0, letterCount);
      const chosenDigits  = shuffle([...digits]).slice(0, digitCount);

      candidate = shuffle([...chosenLetters, ...chosenDigits]).join('');

      // sanity check: at least 1 letter and 1 digit
      const lettersNum = (candidate.match(/[A-Z]/g) || []).length;
      const digitsNum  = (candidate.match(/[0-9]/g) || []).length;

      if (lettersNum >= 1 && digitsNum >= 1) break;
    }

    resolve(`MEET-${candidate}`);
  });
};
