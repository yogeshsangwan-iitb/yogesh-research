// Your name and public links. Empty links are hidden automatically.
export const SHORT_NAME = "Yogesh";
export const OWNER_NAME = "Yogesh Sangwan";

type ProfileLink = { label: string; href: string; external: boolean };

const allLinks: ProfileLink[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/yogesh-sangwan-280119341", external: true },
  { label: "GitHub", href: "https://github.com/yogeshsangwan-iitb", external: true },
  { label: "Email", href: "mailto:1stmillionmile@gmail.com", external: false },
  // Public copy of the resume: date of birth, roll number and gender removed.
  { label: "Resume", href: "/resume.pdf", external: true },
];

export const profileLinks = allLinks.filter((l) => l.href);
