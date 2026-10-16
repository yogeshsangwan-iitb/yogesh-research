// Your public links. Fill in the empty ones and they appear on the site automatically;
// empty links are hidden so visitors never hit a broken page.
const allLinks = [
  { label: "LinkedIn", href: "" }, // e.g. "https://www.linkedin.com/in/your-handle"
  { label: "GitHub", href: "https://github.com/yogeshsangwan-iitb" },
  { label: "Email", href: "" }, // e.g. "mailto:you@example.com"
  { label: "Resume", href: "" }, // e.g. "/resume.pdf" after adding the file to /public
];

export const profileLinks = allLinks.filter((l) => l.href);
