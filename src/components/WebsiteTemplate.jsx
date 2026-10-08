export default function WebsiteTemplate({ content }) {
  const {
    businessName,
    logo,
    phone,
    theme,
    hero,
    about,
    services = [],
    testimonials = [],
    contact,
  } = content;
  const primary = theme?.primary || "#2563eb";
  const secondary = theme?.secondary || "#0f172a";
  return (
    <div
      className="min-h-screen bg-white text-slate-800"
      style={{ "--brand": primary, "--brand-dark": secondary }}
    >
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <a
            href="#home"
            className="flex items-center gap-3 text-xl font-bold"
            style={{ color: secondary }}
          >
            {logo ? (
              <img
                alt=""
                src={logo}
                className="h-10 w-10 rounded-md object-contain"
              />
            ) : (
              <span
                className="grid h-10 w-10 place-items-center rounded-xl text-white"
                style={{ background: primary }}
              >
                {businessName?.charAt(0)}
              </span>
            )}
            {businessName}
          </a>
          <nav className="flex flex-wrap gap-5 text-sm font-semibold">
            <a href="#about">About</a>
            <a href="#services">Services</a>
            <a href="#testimonials">Reviews</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>
      <main>
        <section id="home" className="bg-slate-50 px-6 py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
            <div>
              <p
                className="mb-4 text-sm font-bold uppercase tracking-widest"
                style={{ color: primary }}
              >
                {hero.eyebrow}
              </p>
              <h1
                className="max-w-xl text-4xl font-bold leading-tight md:text-6xl"
                style={{ color: secondary }}
              >
                {hero.heading}
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
                {hero.description}
              </p>
              <a
                href={hero.buttonUrl || "#contact"}
                className="mt-8 inline-flex rounded-xl px-7 py-4 font-semibold text-white"
                style={{ background: primary }}
              >
                {hero.buttonText}
              </a>
            </div>
            {hero.image ? (
              <img
                src={hero.image}
                alt={hero.heading}
                className="h-80 w-full rounded-3xl object-cover shadow-xl"
              />
            ) : (
              <div className="grid h-80 place-items-center rounded-3xl bg-white text-center shadow-lg">
                <span
                  className="text-6xl font-bold opacity-30"
                  style={{ color: primary }}
                >
                  {businessName}
                </span>
              </div>
            )}
          </div>
        </section>
        <section
          id="about"
          className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2"
        >
          {about.image ? (
            <img
              src={about.image}
              alt="About us"
              className="h-72 w-full rounded-3xl object-cover"
            />
          ) : (
            <div className="grid h-72 place-items-center rounded-3xl bg-slate-100 text-5xl">
              ✦
            </div>
          )}
          <div>
            <p className="mb-3 font-semibold" style={{ color: primary }}>
              ABOUT US
            </p>
            <h2
              className="text-3xl font-bold md:text-4xl"
              style={{ color: secondary }}
            >
              {about.heading}
            </h2>
            <p className="mt-5 leading-8 text-slate-600">{about.description}</p>
          </div>
        </section>
        <section id="services" className="bg-slate-50 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold" style={{ color: secondary }}>
              Our Services
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm"
                >
                  <div
                    className="mb-5 h-2 w-12 rounded"
                    style={{ background: primary }}
                  />
                  <h3 className="text-xl font-bold">{service.title}</h3>
                  <p className="mt-3 text-slate-600">{service.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="testimonials" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold" style={{ color: secondary }}>
            What Our Clients Say
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <blockquote
                key={t.id}
                className="rounded-2xl border border-slate-200 p-7"
              >
                <p className="text-lg">“{t.quote}”</p>
                <footer
                  className="mt-4 font-semibold"
                  style={{ color: primary }}
                >
                  {t.name}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
        <section id="contact" className="bg-slate-50 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold" style={{ color: secondary }}>
              Contact Us
            </h2>
            <div className="mt-6 space-y-2 text-lg">
              <p>{contact.address}</p>
              <p>
                <a href={`tel:${contact.phone || phone}`}>
                  {contact.phone || phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </p>
              {contact.instagram && (
                <p>
                  <a href={contact.instagram}>Instagram</a>
                </p>
              )}
              {contact.facebook && (
                <p>
                  <a href={contact.facebook}>Facebook</a>
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
      <footer
        className="px-6 py-8 text-center text-sm text-white"
        style={{ background: secondary }}
      >
        © {new Date().getFullYear()} {businessName}. All rights reserved.
      </footer>
    </div>
  );
}
