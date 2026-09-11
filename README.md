# Happy 23rd Birthday, Adina 💖

A small, self-contained interactive page built for one person. Mobile-first,
vanilla HTML/CSS/JS, no build step, no dependencies, no CDN — it runs as-is on
free GitHub Pages.

## The flow

1. **Consent gate** — a checkbox that must be ticked before the *I Consent*
   button unlocks. That tap is also what starts the music (browsers block audio
   autoplay until a real user gesture, and this is the one guaranteed gesture).
2. **The letter** — `start.txt` types itself out, character by character.
   * Tap the letter text to toggle 1× / 3× speed.
   * The page follows the text down as it types; swipe up to stop following.
3. **The descent** — scrolling zooms in on a locket on the floor. Scroll to the
   end and it becomes tappable. At 55% the *Take me there* shortcut appears.
4. **Cut the thread** — a dialog explains the rules: **three** taps. Every tap
   frays the thread by one strand. Tap the target and it takes the hit with a
   jolt; miss, and it slips to a random spot somewhere else. Either way the
   count drops, and on the third tap the thread lets go, in a burst of petals.
5. **Reveal** — `happy-birthday.png` zooms in, the music cross-fades to
   `final.mp3`, and the greeting lands. There are *Mute* and *Watch it again*
   controls.

## Project layout

```
index.html              all five acts, semantic sections
styles.css             every visual + animation; design tokens at the top
app.js                 state machine, audio, typewriter, challenge logic
start.txt              the letter (canonical copy, also embedded in app.js)
assets/
  site-music.mp3       loops for acts 1–3
  final.mp3            plays at the reveal
  target.png           floats on the thread in act 4
  happy-birthday.png   the reveal
.nojekyll              tells Pages to serve files as-is
robots.txt             asks crawlers to stay out
```

### Editing the letter

The letter lives in two places: `start.txt` (canonical) and the `LETTER`
constant near the top of `app.js`. It is embedded rather than fetched on
purpose — `fetch()` fails on `file://` and would race the first typed character.
**If you change one, change the other.**

## Preview locally

Open `index.html` directly, or better, serve it so relative paths behave exactly
as they will on Pages:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

To test the mobile experience on a desktop, use DevTools → device toolbar →
iPhone 14 Pro. The layout is capped at 480&nbsp;px wide and centred on large
screens.

## Deploying to GitHub Pages

```bash
cd "path/to/this/folder"
git init -b main
git add .
git commit -m "Happy 23rd birthday"
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

Then in the repository: **Settings → Pages → Source: Deploy from a branch →
Branch: `main` / `root` → Save.** The site appears at:

```
https://<username>.github.io/<repo>/
```

Allow a minute or two for the first build. Every later `git push` redeploys
automatically.

### A note on where this folder lives

This project currently sits inside a OneDrive-synced directory. A `.git` folder
inside OneDrive is a common cause of repo corruption and sync conflicts. If you
hit strange git errors, move the project to a local-only path such as
`C:\dev\birthday-site` and push from there.

## Accessibility & resilience

* `prefers-reduced-motion` is respected — hearts, parallax and the zoom are
  dropped, and the letter appears instantly. The whole flow still completes.
* If audio can't start, a *Tap for sound* chip appears rather than failing
  silently.
* Works with the page muted; nothing is gated behind sound.
* Hidden scenes are `display: none`, so focus order and page height always match
  the act on screen.
* The full letter is exposed to screen readers immediately via an `sr-only`
  paragraph, so nobody has to wait out the animation.

## Privacy

The page is `noindex, nofollow` and ships a blocking `robots.txt`. Be aware that
this only *discourages* crawlers — **anything on a public GitHub Pages site is
publicly readable by anyone who has the URL or finds the repo.** The reveal image
is a photograph of real people, so make sure everyone in it is happy for it to
be online, and if you want genuine privacy, share the page directly rather than
hosting it publicly.
