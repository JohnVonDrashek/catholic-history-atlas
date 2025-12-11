# ✅ How Custom Domains Work on GitHub Pages

**Extracted:** 2025-12-11T19:16:24.409Z
**Source:** https://chatgpt.com/share/693b16b6-81dc-8009-b56e-c9d5b865e8b9

---

## User

All right! Here's what I want to make. I want to make an interactive Catholic history websites. I want there to be a like the year at the top and then you can. Like you know there's like a left and right and allows you to like change the like increment or decrement the year that it is so you can like see sort of what the Christian like world look like at the time. So there's going to be different layers to this. There's going to be there's going to be a timeline view where you can view you know just like a straight line sort of timeline with all the saints and stuff and so that way you can see the time. That they're in and you can like scrub through that. But I also want a view of like a map of the world now. Obviously in the early days you don't need the entire world. So just the known world is fine. Like the mediterraneanish area and then it'll have like I want a poll from Wikipedia for like the images and stuff for those saints and like you can click on them and then it opens in like the rights like a little. I don't know what you would call it like a modal or something and you can see like you know obvious that image that's there to represent them and they can see like like a link to like new Advent for all of their letters and then link to Wikipedia and then some like highlight information. That's like kind of like a summary of whatever they were about, like who they were. Maybe some of their contributions maybe key points from some of their letters that are helpful. What do you think about that?

---

## Assistant

インタラクティブなカトリック歴史アトラス（いんたらくてぃぶなかとりっくれきしあとらす）
I think this idea is fantastic and very doable if you slice it into pieces. It’s the kind of thing I would absolutely use myself if it existed.
Let me react to the concept and then suggest a concrete way to structure v1.

1. Big picture: what you’re actually building
You’re basically describing four things glued together:


A global “year” state


A number at the top (e.g., 325, 1054, 1517…)


Left/right buttons + maybe a slider / scrubber


Changing the year updates everything else: timeline, map, and details.




Timeline view


Horizontal line with:


Saints


Councils


Major church events (schisms, reforms, etc.)




You scrub through it or click on a point to jump the “current year”.




Map view


For early centuries: Mediterranean + Near East (Roman Empire-ish).


Later centuries: expandable to Europe / world.


Dots or regions representing:


Major sees (Rome, Constantinople, Antioch, Alexandria, Jerusalem, etc.)


Monasteries, mission fields, etc. as you move forward in time.




Click a marker → open a modal with info.




Detail / modal view for a saint or event


Portrait/image (fetched from Wikipedia if available).


Basic metadata:


Name, lifespan, feast day


Where they lived/served




Links:


New Advent (letters, biographies, council docs)


Wikipedia




A short curated summary:


Who they were


Why they matter


2–3 bullet-point highlights (e.g., “Key themes of their writings”).






It’s like a Catholic “Google Earth + Timeline” for Church history, which is awesome.

2. Data model (how I’d structure the content)
Even before tech stack, think data. Something like:
Core entities


Person (Saint / Theologian / Pope / Bishop)


id


name


birth_year (nullable, approximate allowed)


death_year


feast_day (optional)


primary_tradition (e.g., Latin, Byzantine, Syriac…)


roles (bishop, monk, martyr, doctor of the Church…)


locations (refs to place IDs with start/end years)


wikipedia_url


new_advent_url


image_url (from Wikipedia / Wikidata)


summary (your curated text)


key_quotes (array of short quotations or paraphrases)




Event


id


name


start_year / end_year


type (council, schism, persecution, reform, etc.)


location_id


wikipedia_url


new_advent_url (for councils, etc.)


summary


key_documents (e.g., “Nicaea I – Nicene Creed”)




Place


id


name


lat, lng


region (e.g., “Asia Minor”, “Italia”, etc.)


modern_country (helpful for orientation)




Then your views become different lenses over the same data.

3. UX flows that make this feel really nice
A. Year control


At the top center:
← 313 →


Step size: maybe 10 years by default, with a way to jump (e.g., clicking the year opens an input or dropdown decades).


A play button later for “auto-advance” through history would be sick, but v2.




B. Timeline view


Horizontal timeline with:


Dots or icons for people (e.g., a cross for martyr, book icon for doctor).


Bars for councils or long-running events.




Hover → tooltip with name + years.


Click → jumps global year close to that person/event and opens the detail modal.


C. Map view


On year change:


Show only those people/events whose lifespan or date includes that year.


Example: in 380, you see where Basil the Great, Gregory Nazianzen, Ambrose, etc. are.




Different icons:


Person = round marker.


Council = star.


Important see = maybe a ring or “halo” marker.




Good v1 simplification:


Don’t draw political boundaries at first. Just coastline + markers.




D. Modal (detail)
When you click a saint/event:


Header: St. Athanasius (c. 296–373)


Subtitle: Bishop of Alexandria – Defender of Nicene Orthodoxy


Content:


Image on the left/top.


Short summary in 3–6 sentences.


Section: Highlights


“Opposed Arianism at Nicaea.”


“Wrote On the Incarnation.”




Section: Key excerpts / themes


Not full quotes, but very short selections from letters, homilies, etc.




Section: Sources


Link to New Advent


Link to Wikipedia


Maybe a small note on magisterial weight if you ever touch that (e.g., “Doctor of the Church”).






You can even tuck a discreet spiritual angle at the bottom like:

“Possible reflection: How does Athanasius’ perseverance under exile encourage us to remain faithful under pressure?”

That keeps it historical but also spiritually useful.

4. Data sourcing realities (Wikipedia, images, New Advent)
Wikipedia


Pros:


Easy access to basic facts & images.


Many saints already have good summary text & portraits.




Cons / cautions:


Quality varies.


You’ll want to cache and curate, not just render raw HTML.




Strategy:


Use Wikipedia/Wikidata to:


Get: life dates, main photo, links.


Then hand-curate your own summary text (even if it starts from a Wikipedia skeleton).




For images:


Respect licenses (many are CC BY-SA).


Store the image URL + attribution text and show attribution somewhere in the UI (e.g., in the modal footer).




New Advent


Excellent for:


Catholic Encyclopedia entries


Church Fathers’ works




You won’t necessarily parse them deeply at first. Just:


Link the relevant article.


Optionally pre-choose 1–2 important sections to summarize/quote.





5. How I’d build v1 (technically, at a high level)
Since you’re a backend engineer, I’ll keep it tech-flavored without going full code dump.
Step 1: Start as a static data + React app


Frontend: React (or Svelte/Vue, pick your flavor)


Global state: currentYear


Components:


<YearSelector />


<Timeline />


<MapView />


<DetailsModal />






Data: start with a small JSON file checked into the repo:


~20–30 key saints (Apostolic Fathers, major Greek/Latin Fathers, a couple of early martyrs)


3–4 major councils (Nicaea, Constantinople I, Ephesus, Chalcedon)




No backend at first: everything static, load JSON on page load.


Step 2: Add a real backend + DB
Once the prototype feels fun to use:


Add API (/saints, /events, /places) backed by a DB (Postgres would be great).


Admin UI (or just a private script) to add new saints/events.


Maybe a job to:


Fetch/update info from Wikipedia/Wikidata.


Store cleaned data in your DB so the frontend isn’t hitting Wikipedia directly.




Step 3: Gradually expand


Add more centuries.


Add more regions (Celtic missions, Slavic missions, etc.).


Eventually, multiple layers:


“People”


“Councils”


“Monastic movements”


“Schisms & reunions”


“Missions”





6. A small spiritual / historical note
If you want to sprinkle in something fitting, Catechism §882 says:

The Pope, Bishop of Rome and Peter’s successor, “is the perpetual and visible source and foundation of the unity both of the bishops and of the whole company of the faithful.”

That could become the basis of a feature: for any given year, highlight where the patriarchal sees and major centers of communion are, to make visible how unity and fragmentation appear historically.

7. What I’d do next if I were you
If you’d like, next step I can:


Help you sketch the data schema (SQL or TypeScript types).


Draft a component hierarchy for the frontend.


Or even stub out a minimal React page with:


currentYear state


A fake timeline with 3–4 saints


A modal opening on click




But conceptually: yes, your idea is solid, coherent, and can scale. If you keep the first iteration tiny and hand-curated, it’ll be much less overwhelming and you’ll have something delightful and usable pretty quickly.

---

## User

Awesome. Yeah, React makes sense. Um, I'm familiar with making, like, React native apps with Expo, so maybe I can reuse some of that knowledge. Uh, who do you think... Are there any... Like, I really don't want to put a lot of effort into infrastructure. Are there any hosting providers that can just, like, take these output files and display them for use? Like, what are my options there? I'd like to get this on the Internet at the end.

---

## Assistant

ホスティングの選択肢（ほすてぃんぐのせんたくし）
You’re in a great spot for low-infrastructure hosting, especially since this can start as a static React app. Let me walk through the main options that match your “just take my built files and serve them” requirement.

1. Zero-friction static hosting options
These are “git push and forget” style:
A. Vercel


What it is: Very popular for React/Next.js, but also great for plain static sites.


How you’d use it:


Put your app in a GitHub repo.


Connect the repo in Vercel.


Set the build command (e.g. npm run build) and output dir (e.g. dist or build).




Pros:


Automatic deploys on every push.


Free tier is usually enough for hobby projects.


Built-in preview deployments on pull requests.


Easy custom domain + HTTPS.




Cons:


Opinionated around Next.js (not a big issue, just some UI noise).




For a React SPA built with Vite or CRA, Vercel is probably the smoothest.

B. Netlify


What it is: Another excellent static hosting platform.


How you’d use it:


Same story: connect GitHub → configure build command → deploy.




Pros:


Very simple to get started.


Good free tier.


Built-in forms, functions, etc. if you later want serverless bits.




Cons:


Just one more dashboard to live in, similar tradeoffs as Vercel.




If you want something that feels a bit more “static-site generalist” than “React-first,” Netlify is great.

C. GitHub Pages (ギットハブぺーじ)


What it is: Static hosting tied directly to your GitHub repo.


How you’d use it (React SPA):


Build your app (npm run build).


Push the contents of the build folder to a gh-pages branch (or configure GitHub Actions to do it).




Pros:


Totally free.


No extra account besides GitHub.




Cons:


A bit more manual than Vercel/Netlify if you want auto builds.


SPA routing needs some config (e.g. 404 → index.html fallback).




Still, for a mostly static educational site, it can be perfectly fine.

2. “Static files from a bucket” options
These are a bit more “infra-y,” but still low-maintenance:
D. Cloudflare Pages


Git-connected static hosting, similar ease to Vercel/Netlify.


Very good performance (global CDN).


Straightforward custom domains and SSL.


E. S3 + CloudFront (AWS)


You upload your built files to an S3 bucket and put CloudFront in front.


Pros: Very robust, fine-grained control, scales forever.


Cons: More setup, probably overkill for your first version given you said “don’t want infra.”



3. What I’d recommend for you specifically
Given:


You’re comfortable with JS/React.


You don’t want infra headaches.


This starts as a static site (no heavy backend yet).


I’d pick one of these two:


Vercel if you like a super smooth “connect repo, deploy, preview” workflow.


Netlify if you want similar convenience but a slightly more generic static-site vibe.


Both will:


Build your React app from Git.


Host the static files on a CDN.


Give you a nice URL and HTTPS.


Let you add a custom domain later if you want something like catholic-atlas.example.



4. A possible minimal workflow
プロジェクトのながれ（ぷろじぇくとのながれ）


Build the app with Vite or CRA.


Push to GitHub.


Connect the repo to Vercel/Netlify.


Configure:


Build command: npm run build


Output directory: dist (Vite) or build (CRA)




Commit → push → it’s live.



If you tell me which provider sounds more appealing (Vercel, Netlify, GitHub Pages), I can outline the exact file structure and config you’d need for a basic React + TypeScript setup for this project.

---

## User

For GitHub Pages, um, would I be able to create, like, GitHub Actions to auto-deploy it? Like, is that an option? Because if so, like, I could always have... I could always write that. That's not a big deal.

---

## Assistant

GitHub Actions での自動デプロイ（ぎっとはぶ あくしょん での じどうでぷろい）
Yep, 100% yes — GitHub Pages + GitHub Actions is a totally valid and pretty common setup. You can absolutely have it auto-deploy on every push to main (or whatever branch you like).
Let me give you a concrete picture so you can basically copy-paste and tweak.

1. Typical setup for a React app on GitHub Pages
Assume:


Repo: yourname/catholic-history-atlas


Default branch: main


Build tool: Vite or CRA (I’ll note both)


You want:


Push to main → build → deploy to GitHub Pages.




Step A: Configure GitHub Pages
In your repo:


Settings → Pages


“Source” → select GitHub Actions (not branch)
This tells GitHub, “I’ll use a workflow to publish.”



2. Example GitHub Actions workflow
Create this file:
.github/workflows/deploy.yml
Here’s a simple version that works with most Node/React setups:
yamlCopy codename: Deploy to GitHub Pages

on:
  push:
    branches:
      - main  # or your preferred branch

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22  # or whatever you like

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist  # Vite default; use ./build for CRA

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4

If you’re using Create React App instead of Vite
Just change the build output path:
yamlCopy code      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./build   # CRA default

That’s it. Every push to main will:


Install dependencies


Build your React app


Publish the built files to GitHub Pages



3. SPA routing gotcha
Since this will be a single-page app:


GitHub Pages will serve index.html at /


But if you try to hit /saints/athanasius directly, GitHub Pages by default 404s instead of serving index.html.


Fix options:


Use hash routing for v1 (easiest)


e.g. React Router with <HashRouter> → URLs like /#/saints/athanasius




Or set up the common 404 fallback trick with a 404.html that loads your app and rewrites.


For a first version, I’d honestly just use HashRouter and not worry about it.

4. Is this compatible with your “no infra” goal?
Yes, this fits your constraints nicely:


No servers, no Docker, no cloud console.


It’s literally:


git push


GitHub Actions builds and deploys automatically.




You get:


A public URL like https://yourname.github.io/catholic-history-atlas


HTTPS, version history, etc., all for free.





If you tell me:


Vite vs CRA


What you want your repo name to be


I can sketch a tiny project structure and the exact package.json scripts + router setup that will play nicely with GitHub Pages.

---

## User

Uh, with GitHub Pages, will I have the option to like, if I really, you know, want to make it a little more professional, to like, link my own URL? Is that a possibility?

---

## Assistant

Absolutely — GitHub Pages fully supports custom domains, and it’s very easy to set up.
So yes, you can make your site look completely professional, like:
https://catholicatlas.com
or
https://history.yourname.dev
…instead of yourname.github.io.

✅ How Custom Domains Work on GitHub Pages
1. Buy a domain from any registrar
You can use:


Namecheap


Google Domains (now Squarespace Domains)


Cloudflare


Porkbun


GoDaddy


Etc.


Any registrar works — GitHub Pages is just static hosting.

2. In GitHub Pages settings, add your domain
In your repository:
Settings → Pages → Custom domain
Enter your domain:
Copy codecatholichistoryatlas.com

GitHub will tell you what DNS records to configure.

3. Add DNS records at your domain registrar
You’ll set up either A records or CNAME depending on whether you want apex or subdomain:
For www.example.com
Add a CNAME record:
makefileCopy codeType: CNAME
Host: www
Value: yourname.github.io

For root domain (example.com)
Add A records pointing to GitHub Pages IPs:
Copy code185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153

(These are GitHub’s static front-end servers.)

4. GitHub auto-issues HTTPS for your domain
After DNS propagates:


GitHub Pages will automatically generate SSL certs via Let’s Encrypt.


You’ll get secure https:// for free.


Usually takes a few minutes to an hour.

💡 Notes for Your Project
Using a custom domain with GitHub Pages keeps everything extremely lightweight:


No servers


No backend


No monthly cost except domain registration


Auto-deploy with GitHub Actions


Fully professional appearance


Perfect for an interactive historical atlas like you’re building.

🎯 Bottom line
Yes — you can absolutely use your own domain with GitHub Pages, and it’s simple.
Your project will look fully official once you attach a custom URL.

If you want, I can also help you pick a good domain or walk you through the DNS setup step-by-step when you're ready.

---

## User

Uh, don't mean to ping-pong, but I had an idea about, um, so that we can display more than just, like, Catholic saints, and we can show, like, other prominent figures, like Arius. I was thinking a way to distinguish them, because people aren't going to know at first, is, like, with frames around their images. So I was thinking we could have, like, you know, saints being gold, and then, uh, like, martyr saints. It could be, like, you know, like, those diagonal, like, lines, you know, where it, like, alternates colors? It could be, like, gold and red, you know, red for blood. Um, I don't know what we'd do for, for, like, the various other things, like schismatics or, uh, heretics or whatnot. Uh, I'd be having ideas for that, and then maybe, like, how we would go about doing that. Obviously, we're going to be getting the images from Wikipedia, so we just kind of need to format around that, but, yeah.

---

## Assistant

アイコン枠デザイン案（あいこんわくでざいんあん）
I love this idea. Frames are a super clean way to communicate “what kind of person is this?” without making people read a bunch of text first.
Let’s do two things:


Design a little “visual theology” system (what frames mean what).


Talk about how you’d implement it in React/CSS around Wikipedia images.



1. Visual categories: who gets what frame?
I’d keep the core categories pretty small, but expressive:
A. Canonized saints (non-martyrs)


Frame: solid gold border.


Optional subtle glow / inner shadow, so they “feel” set apart.


Tooltip on hover:

“Canonized saint in communion with the Catholic Church.”



B. Martyrs
You suggested gold + red stripes, which is perfect.


Frame: diagonal stripes: gold + deep red.


If they’re both saint + martyr (which is most), let martyrdom “override” and show stripe frame.


Tooltip:

“Martyr (died for the faith).”



C. Blessed / venerable / servants of God (if you ever go that far)
Optional, but future-proofing:


Frame: silver or desaturated gold border.


Maybe small cross icon, but less intense than full gold.


Tooltip:

“Beatified (Blessed)” / “Venerable” etc.



D. Orthodox but not saint (emperors, philosophers, etc., broadly sympathetic)
Think: Constantine, Theodosius, sympathetic rulers, theologians not canonized.


Frame: stone / gray border, maybe slightly textured or beveled.


Indicates “important, related to the Church, but not a saint.”


Tooltip:

“Important historical figure (not canonized).”



E. Schism leaders
People who break communion but aren’t primarily remembered for heretical doctrine (schism more than dogma).


Frame: split frame: half neutral, half muted red or orange, with a subtle “crack” or diagonal division.


Visually communicates “broken unity.”


Tooltip:

“Associated with a schism (rupture of communion).”



F. Heresiarchs (e.g., Arius, Nestorius, etc.)
Here we want clear distinction without turning this into a cartoon villain thing.


Frame: dark, maybe desaturated red or dark purple, with sharp corners or subtle “jagged” inner border.


Maybe a tiny warning-triangle icon tucked in one corner.


Tooltip:

“Teacher whose doctrine was condemned as heresy (e.g., Council of Nicaea I).”



G. Totally secular background figures (Roman officials, philosophers, etc.)
If you include them at all:


Frame: thin, neutral gray border or even no frame, just a soft shadow.


Tooltip:

“Secular historical figure (not a Church figure).”




2. Data model: how you encode this
Add a field in your person/event data:
tsCopy codetype FigureCategory =
  | 'saint'
  | 'martyr'
  | 'saint-martyr'   // you can derive this, or store martyr: true
  | 'blessed'
  | 'orthodox'
  | 'schismatic'
  | 'heresiarch'
  | 'secular';

Maybe also:
tsCopy codeinterface Figure {
  id: string;
  name: string;
  category: FigureCategory;
  // ...
}

Or you can do something like:
tsCopy codetype OrthodoxyStatus = 'canonized' | 'blessed' | 'orthodox' | 'schismatic' | 'heresiarch' | 'secular';

interface Figure {
  orthodoxyStatus: OrthodoxyStatus;
  isMartyr: boolean;
}

Then “martyr” is a flag that affects the frame style.

3. React component for framed portraits
Component idea
tsxCopy codetype OrthodoxyStatus =
  | 'canonized'
  | 'blessed'
  | 'orthodox'
  | 'schismatic'
  | 'heresiarch'
  | 'secular';

interface FigurePortraitProps {
  name: string;
  imageUrl: string;
  orthodoxyStatus: OrthodoxyStatus;
  isMartyr?: boolean;
}

export function FigurePortrait({
  name,
  imageUrl,
  orthodoxyStatus,
  isMartyr = false,
}: FigurePortraitProps) {
  const baseClass = 'portrait-frame';

  const statusClass = (() => {
    if (isMartyr && (orthodoxyStatus === 'canonized' || orthodoxyStatus === 'blessed')) {
      return 'portrait-frame--martyr';
    }

    switch (orthodoxyStatus) {
      case 'canonized':
        return 'portrait-frame--saint';
      case 'blessed':
        return 'portrait-frame--blessed';
      case 'orthodox':
        return 'portrait-frame--orthodox';
      case 'schismatic':
        return 'portrait-frame--schismatic';
      case 'heresiarch':
        return 'portrait-frame--heresiarch';
      case 'secular':
      default:
        return 'portrait-frame--secular';
    }
  })();

  const tooltip = (() => {
    if (isMartyr && (orthodoxyStatus === 'canonized' || orthodoxyStatus === 'blessed')) {
      return 'Canonized martyr';
    }
    switch (orthodoxyStatus) {
      case 'canonized':
        return 'Canonized saint in communion with the Catholic Church';
      case 'blessed':
        return 'Beatified (Blessed)';
      case 'orthodox':
        return 'Important historical figure supportive of the Church';
      case 'schismatic':
        return 'Figure associated with a schism (rupture of communion)';
      case 'heresiarch':
        return 'Teacher whose doctrines were condemned as heresy';
      case 'secular':
      default:
        return 'Secular historical figure';
    }
  })();

  return (
    <div className={`${baseClass} ${statusClass}`} aria-label={tooltip} title={tooltip}>
      <img src={imageUrl} alt={name} className="portrait-frame__image" />
    </div>
  );
}

All you have to do is feed in the Wikipedia image URL.

4. CSS for the different frames
Rough idea (not pixel-perfect, just the concept):
cssCopy code.portrait-frame {
  display: inline-flex;
  padding: 4px;
  border-radius: 8px;
  overflow: hidden;
  box-sizing: border-box;
}

.portrait-frame__image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 4px;
}

/* A. Canonized saint: solid gold */
.portrait-frame--saint {
  border: 3px solid #d4af37; /* gold */
  box-shadow: 0 0 6px rgba(212, 175, 55, 0.6);
}

/* B. Martyr: gold + red stripes */
.portrait-frame--martyr {
  border: 3px solid transparent;
  background-image: repeating-linear-gradient(
    45deg,
    #d4af37,
    #d4af37 6px,
    #a11b1b 6px,
    #a11b1b 12px
  );
}

/* Optional: inner white to keep image clean */
.portrait-frame--martyr .portrait-frame__image {
  border-radius: 3px;
  border: 2px solid #fff;
}

/* C. Blessed: softer gold / silver */
.portrait-frame--blessed {
  border: 2px solid #c0c0c0;
  box-shadow: 0 0 4px rgba(192, 192, 192, 0.6);
}

/* D. Orthodox-but-not-saint: stone/gray */
.portrait-frame--orthodox {
  border: 2px solid #777;
  background: #f7f7f7;
}

/* E. Schismatic: split border effect */
.portrait-frame--schismatic {
  border: 3px solid transparent;
  background-image: linear-gradient(
      to right,
      #777 0%,
      #777 50%,
      #b03a2e 50%,
      #b03a2e 100%
    );
}

/* F. Heresiarch: dark, sharp */
.portrait-frame--heresiarch {
  border: 3px solid #5b1a1a;
  box-shadow: 0 0 4px rgba(91, 26, 26, 0.8);
}

/* G. Secular: thin neutral border */
.portrait-frame--secular {
  border: 1px solid #bbb;
}

You can tweak colors, thicknesses, and radii to your taste. The key is consistency across the whole app.

5. Make it understandable in the UI
To avoid confusion, I’d add:


Legend somewhere (sidebar or “?” button):


Gold frame = canonized saint


Gold + red stripes = martyr


Gray stone = important non-saint figure


Split frame = schismatic


Dark red = condemned teacher (heresiarch)




Text in the modal (so it’s explicit, not just visual):

Status: Canonized saint, Bishop of Alexandria, Doctor of the Church
Condemned at: First Council of Nicaea (for heresiarchs, etc.)



Accessible text


The title and aria-label in the React component already help screen readers and users who can’t distinguish colors well.





6. Theological / historical nuance
Since you’re building this as a Catholic project:


Base labels like “heresiarch”, “schism” on official Catholic sources (council definitions, Catechism, etc.).


You might eventually want a source field:

“Status based on Council of Ephesus (431).”



And you can keep the tone factual:


“Condemned by the Council of Nicaea I for teaching X”
instead of just “bad guy”.





If you want, next step I can help you:


Expand the data model to include orthodoxyStatus + isMartyr cleanly.


Or design a matching map marker system that uses the same categories (so frame and map pin visually agree).

---

