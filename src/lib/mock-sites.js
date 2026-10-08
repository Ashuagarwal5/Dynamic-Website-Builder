export const mockSites = [
  {
    id: "site_1",
    slug: "abc-dental",
    name: "ABC Dental",
    published: true,
    draft: {
      businessName: "ABC Dental",
      logo: "",
      phone: "+91 98765 43210",
      email: "hello@abcdental.com",
      theme: { primary: "#2563eb", secondary: "#0f172a" },
      hero: {
        eyebrow: "Family dentistry",
        heading: "Healthy Smiles Start Here",
        description: "Comfortable, modern dental care for the whole family.",
        buttonText: "Book an Appointment",
        buttonUrl: "#contact",
        image: "",
      },
      about: {
        heading: "Care You Can Trust",
        description:
          "Our team focuses on welcoming, personalized dental care for every patient.",
        image: "",
      },
      services: [
        {
          id: "s1",
          title: "General Dentistry",
          description: "Routine checkups and preventative care.",
        },
        {
          id: "s2",
          title: "Cosmetic Dentistry",
          description: "Beautiful, confident smiles.",
        },
        {
          id: "s3",
          title: "Teeth Whitening",
          description: "Professional whitening services.",
        },
      ],
      testimonials: [
        {
          id: "t1",
          name: "Happy Patient",
          quote: "Friendly team and a wonderful experience!",
        },
      ],
      contact: {
        address: "Jaipur, Rajasthan",
        phone: "+91 98765 43210",
        email: "hello@abcdental.com",
        instagram: "",
        facebook: "",
      },
      seo: {
        title: "ABC Dental | Family Dental Clinic",
        description: "Friendly, modern dental care in Jaipur.",
      },
    },
  },
  {
    id: "site_2",
    slug: "xyz-clinic",
    name: "XYZ Clinic",
    published: true,
    draft: {
      businessName: "XYZ Clinic",
      logo: "",
      phone: "+91 98765 12345",
      email: "care@xyzclinic.com",
      theme: { primary: "#0d9488", secondary: "#134e4a" },
      hero: {
        eyebrow: "Your health matters",
        heading: "Thoughtful Care, Every Day",
        description: "Trusted healthcare from a team that puts you first.",
        buttonText: "Contact Our Clinic",
        buttonUrl: "#contact",
        image: "",
      },
      about: {
        heading: "Here for Your Health",
        description: "We provide accessible care with a personal touch.",
        image: "",
      },
      services: [
        {
          id: "s1",
          title: "Consultations",
          description: "Personalized visits with our clinicians.",
        },
        {
          id: "s2",
          title: "Preventive Care",
          description: "Stay ahead with routine screenings.",
        },
      ],
      testimonials: [
        {
          id: "t1",
          name: "Clinic Visitor",
          quote: "Helpful staff and excellent care.",
        },
      ],
      contact: {
        address: "New Delhi, India",
        phone: "+91 98765 12345",
        email: "care@xyzclinic.com",
        instagram: "",
        facebook: "",
      },
      seo: {
        title: "XYZ Clinic | Caring for You",
        description: "Compassionate everyday healthcare.",
      },
    },
  },
];
export const initialSites = mockSites.map((site) => ({
  ...site,
  // Sample content is plain JSON; this also works on non-secure LAN origins.
  live: JSON.parse(JSON.stringify(site.draft)),
}));
