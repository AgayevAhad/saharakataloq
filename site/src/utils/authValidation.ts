export const PASSWORD_REQUIREMENT_TEXT =
  'Ən azı 8 simvol, bir hərf, bir böyük hərf və bir rəqəm istifadə edin.';

const LETTER_PATTERN = /[A-Za-zƏÖÜĞÇŞİəöüğçşı]/;
const UPPERCASE_PATTERN = /[A-ZƏÖÜĞÇŞİ]/;
const NUMBER_PATTERN = /\d/;

export const getPasswordRequirements = (password: string) => ({
  hasMinLength: password.length >= 8,
  hasLetter: LETTER_PATTERN.test(password),
  hasUppercase: UPPERCASE_PATTERN.test(password),
  hasNumber: NUMBER_PATTERN.test(password),
});

export const isStrongPassword = (password: string) => {
  const requirements = getPasswordRequirements(password);
  return Object.values(requirements).every(Boolean);
};
