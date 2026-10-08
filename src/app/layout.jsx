
import "./globals.css";

export const metadata = {
  title: "Dynamic Website Builder",
  description: "Create and manage dynamic websites easily.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
