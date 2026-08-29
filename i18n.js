(() => {
  const T = {
    en: {
      meta: "Mehdi Baï. Lille. I studied law, then started building. WeWalk, Saqsi, WeGrow.",
      title: "Mehdi Baï",
      "nav.work": "Work",
      "nav.writing": "Writing",
      "nav.links": "Links",
      "nav.contact": "Contact",
      "hero.p1": "I studied law. Then I started building.",
      "hero.wewalk": " is for crossing paths in the street. ",
      "hero.saqsi": " is for competing. ",
      "hero.wegrow": "Both come from WeGrow, in Lille.",
      "work.title": "Work",
      "work.wewalk": "Company for a walk, what's happening nearby, a ping if something starts close by.",
      "work.saqsi": "An iPhone quiz. Ten themes, challenges with friends, a leaderboard.",
      "work.wegrow": "The studio, in Lille.",
      "writing.title": "Writing",
      "writing.date": "March 2026",
      "writing.headline": "It's not social. It's television.",
      "writing.dek": "We still say \"social network.\"",
      "links.title": "Links",
      "links.lead": "Tabs I never close.",
      "links.world": "The world as a system, not a feed.",
      "links.hobday": "Design rules you can actually use.",
      "links.emails": "Internal emails from tech companies.",
      scroll: "Scroll",
      "article.meta": "We still say \"social network.\"",
      "article.title": "It's not social. It's television. · Mehdi Baï",
      "article.back": "← Writing",
      "article.date": "March 2026",
      "article.h1": "It's not social. It's television.",
      "article.lede": "We still say \"social network.\"",
      "article.p1": "Facebook started as a directory. Twitter was a conversation. Instagram was a photo album.",
      "article.p2": "Then attention paid better than connection. Almost nobody posts. Everyone else scrolls.",
      "article.p3": "It's not social. It's television.",
      "article.p4": "We've never been more connected. Or more alone. The apps keep the thumb moving. They don't help two people meet on a street corner.",
      "article.p5": "That's where WeWalk starts. So you don't walk home alone.",
    },
    fr: {
      meta: "Mehdi Baï, Lille. J'ai fait du droit, puis des apps. WeWalk, Saqsi, WeGrow.",
      title: "Mehdi Baï",
      "nav.work": "Projets",
      "nav.writing": "Textes",
      "nav.links": "Liens",
      "nav.contact": "Contact",
      "hero.p1": "J'ai fait du droit. Puis des apps.",
      "hero.wewalk": ", pour croiser du monde dans la rue. ",
      "hero.saqsi": ", pour jouer entre amis. ",
      "hero.wegrow": "Les deux viennent de WeGrow, à Lille.",
      "work.title": "Projets",
      "work.wewalk": "Trouver quelqu'un pour marcher, voir ce qui se passe autour.",
      "work.saqsi": "Un quiz iPhone. Dix thèmes, des défis entre amis, un classement.",
      "work.wegrow": "Le studio, à Lille.",
      "writing.title": "Textes",
      "writing.date": "Mars 2026",
      "writing.headline": "Ce n'est plus social. C'est de la télé.",
      "writing.dek": "On dit encore « réseau social ».",
      "links.title": "Liens",
      "links.lead": "Des onglets que je ne ferme jamais.",
      "links.world": "Le monde comme un système, pas comme un fil.",
      "links.hobday": "Des règles de design, sans le jargon.",
      "links.emails": "Les mails internes des boîtes tech.",
      scroll: "Scroll",
      "article.meta": "On dit encore « réseau social ».",
      "article.title": "Ce n'est plus social. C'est de la télé. · Mehdi Baï",
      "article.back": "← Textes",
      "article.date": "Mars 2026",
      "article.h1": "Ce n'est plus social. C'est de la télé.",
      "article.lede": "On dit encore « réseau social ».",
      "article.p1": "Facebook, au départ, c'était un annuaire. Twitter, une conversation. Instagram, un album.",
      "article.p2": "L'attention a rapporté plus que le lien. Presque personne ne poste. Les autres scrollent.",
      "article.p3": "Ce n'est plus social. C'est de la télé.",
      "article.p4": "On n'a jamais été aussi connectés, et aussi seuls. Les apps sont faites pour qu'on reste dessus, pas pour se croiser dans la rue.",
      "article.p5": "C'est de là que part WeWalk : ne pas rentrer seul.",
    },
  };

  const KEY = "lang";

  function detect() {
    const saved = localStorage.getItem(KEY);
    if (saved === "fr" || saved === "en") return saved;
    return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
  }

  function apply(lang) {
    const dict = T[lang];
    if (!dict) return;
    document.documentElement.lang = lang;
    localStorage.setItem(KEY, lang);

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const val = dict[el.dataset.i18n];
      if (val != null) el.textContent = val;
    });

    const page = document.body.dataset.page || "home";
    if (page === "article") {
      if (dict["article.meta"]) {
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.content = dict["article.meta"];
      }
      if (dict["article.title"]) document.title = dict["article.title"];
    } else {
      if (dict.meta) {
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.content = dict.meta;
      }
      if (dict.title) document.title = dict.title;
    }

    document.querySelectorAll(".lang-switch button").forEach(btn => {
      const on = btn.dataset.lang === lang;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  const lang = detect();
  apply(lang);

  document.querySelectorAll(".lang-switch button").forEach(btn => {
    btn.addEventListener("click", () => apply(btn.dataset.lang));
  });
})();
