import "./globals.css";

export const metadata = {
  title: "Dynamic Website Builder",
  description: "Create and manage dynamic websites easily.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      // Extensions can inject attributes on the document element before hydration.
      suppressHydrationWarning
      className="motion-safe:scroll-smooth [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:size-1.5 [&_*::-webkit-scrollbar]:size-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&_*::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-[10px] [&_*::-webkit-scrollbar-thumb]:rounded-[10px] [&::-webkit-scrollbar-thumb]:bg-slate-300 [&_*::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400 [&_*::-webkit-scrollbar-thumb:hover]:bg-slate-400"
    >
      <body className="bg-white text-[#171717] [font-family:Arial,Helvetica,sans-serif] antialiased [&_:is(input,textarea,select):not([aria-invalid=true]):focus]:border-slate-400 [&_:is(input,textarea,select):focus]:outline-none [&_:is(input,textarea,select):focus]:outline-offset-0 [&_:is(input,textarea,select):focus]:shadow-none [&_dialog_:is(a,button):focus-visible]:outline-2 [&_dialog_:is(a,button):focus-visible]:outline-solid [&_dialog_:is(a,button):focus-visible]:outline-[#0987F5] [&_dialog_:is(a,button):focus-visible]:outline-offset-3">
        {children}
      </body>
    </html>
  );
}
