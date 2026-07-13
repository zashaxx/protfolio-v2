#import "@preview/acorn-resume:0.1.0": *

#let name = "Aayush Koirala"
#let email = "aayushkoirala8848@gmail.com"
#let github = "https://github.com/zashaxx"
#let linkedin = "https://www.linkedin.com/in/aayushkoirala8848/"
#let personal-site = "https://aayush-koirala.com.np"

#show: resume.with(
  author: name,
  margin: (
    x: 1.2cm,
    y: 1.2cm,
  ),
  font: "Noto Sans",
  font-size: 10pt,
  link-style: (
    underline: true,
    color: black,
  )
)

#let header(name: none, contacts: none, position: center) = {
  align(
    position,
    [
      = #name
      #{
        set text(size: 9pt)
        contacts.map(((url, label)) => link(url)[#label]).join[ | ]
      }
    ]
  )
}

#header(
  name: name,
  contacts: (
    ("mailto:" + email, email),
    (github, "github.com/zashaxx"),
    (linkedin, "linkedin.com/in/aayushkoirala8848"),
    (personal-site, "aayush-koirala.com.np"),
  )
)

== Profile
#pad(
  top: 0.15em,
  [
    Final-year Computer Engineering student focused on *Backend Development* and *Full-Stack Engineering*. Skilled in building scalable server-side architectures, RESTful APIs, and database-driven applications using Node.js, Express, Python, and FastAPI. Seeking an internship to contribute to backend engineering and build robust systems.
  ]
)

== Skills
#pad(
  top: 0.15em,
  [
    *Languages:* JavaScript, TypeScript, Python, HTML, CSS/SCSS, C++, Java, C, C\#, SQL \
    *Frameworks/Libraries:* React, Next.js, Node.js, Express, Socket.io, FastAPI, Firebase \
    *Tools/Platforms:* Git, GitHub, MongoDB, PostgreSQL, Postman, Linux, Docker, Vercel
  ]
)

== Projects
#project(
  name: "MERCH Nepal",
  technologies: ("React", "Node.js", "Express", "MongoDB", "Socket.io", "Stripe"),
  repo-url: "https://github.com/zashaxx/Merch-Nepal",
  details: [
    - Full-stack e-commerce platform with seller registration, customer interaction, and administrative controls
    - Integrated Stripe payment gateway for secure transactions and Socket.io for real-time customer support chat
  ],
)

#project(
  name: "Nep Tube",
  technologies: ("Next.js", "TypeScript", "PostgreSQL", "tRPC", "Clerk Auth", "AI"),
  repo-url: "https://github.com/zashaxx/neptube",
  details: [
    - Full-stack video streaming platform with Clerk authentication, AI-powered tools, and PostgreSQL with Drizzle ORM
    - Dedicated video streaming server for optimized media delivery
  ],
)

#project(
  name: "GoodNotes",
  technologies: ("React", "Firebase", "MongoDB", "Node.js"),
  repo-url: "https://github.com/zashaxx/GoodNotesFinal",
  details: [
    - Educational resource portal for Pokhara University students to access and download notes
    - Built RESTful APIs using Node.js with MongoDB for document metadata and efficient data retrieval
  ],
)

#project(
  name: "Todo App",
  technologies: ("FastAPI", "React", "Python", "SQLAlchemy"),
  repo-url: "https://github.com/zashaxx/working_with_api/tree/master/fast-api",
  details: [
    - Full-stack task management app with FastAPI backend, React frontend, and SQLAlchemy ORM
    - RESTful API architecture for database operations
  ],
)

#project(
  name: "Portfolio",
  technologies: ("React", "Vite", "CSS3", "JavaScript"),
  repo-url: "https://github.com/zashaxx/protfolio-v2",
  live-url: "https://aayush-koirala.com.np",
  details: [
    - Personal portfolio website featuring dark/light theme, smooth scroll animations, and responsive layouts
  ],
)

== Education
#edu(
  degree: "Bachelor of Engineering in Computer Science",
  date: "2021 - Current",
  institution: "Nepal Engineering College",
  location: "Changunarayan, Bhaktapur, Nepal",
)

#pad(
  top: 0.15em,
  [
    *Affiliated to Pokhara University* \
    *Relevant Coursework:* Computer Networks, Advanced Web Technology, Artificial Intelligence, Operating Systems, Database Management
  ]
)

== Certifications
#pad(
  top: 0.15em,
  [
    *Python for Web Security* -- Understanding common web vulnerabilities (XSS, CSRF, SQL Injection) and implementing security best practices across the full development lifecycle
  ]
)
