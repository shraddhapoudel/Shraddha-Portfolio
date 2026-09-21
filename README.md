# Shraddha Poudel · Architecture Portfolio

Static, multi-page architecture portfolio. Editorial monograph style: paper `#f8f7f4`, ink `#1a1a1a`, accent `#a64f3c`. Manrope (display) + DM Sans (body). No build step, no framework: plain HTML/CSS/JS that runs from a folder.

## Pages (real URLs, no hash routing)

| File | Page |
|---|---|
| `index.html` | Home: hero, positioning line, 5 project cards, footer with email |
| `work.html` | Work index: grid of all projects |
| `project-nyano.html` | 01 · Nyano Learning School |
| `project-himal.html` | 02 · Himal Cafe & Bakery |
| `project-sahara.html` | 03 · साहारा · Khopasi Rural Community Center |
| `project-interior.html` | 04 · Interior Work (portfolio PDFs) |
| `project-hobbies.html` | 05 · Extra Hobbies & Works |
| `about.html` | About: portrait, bio, position, skills, languages |
| `cv.html` | CV: readable on-page + PDF download (print stylesheet included) |
| `contact.html` | Contact: email, location, availability, PDF downloads |
| `404.html` | Page not found, links back home |

## Structure

- `css/styles.css`: design system, layout, lightbox, reveal, print stylesheet
- `js/main.js`: minimal JS only (mobile nav toggle, image lightbox, subtle reveal)
- `favicon.svg`
- Image folders `00_Profile_CV` to `05_Extra_Hobbies_and_work`, numbered in order

## Editing content

Content is written directly in each HTML file. Open the page you want to change and edit the text. Search for the comment `EDIT` in the HTML: those mark fields only you know (team/role specifics, availability date, social URLs, skills levels). Use a plain text editor (Notepad, VS Code).

Image files were renamed during optimization (`.png` to `.jpg`, `01.portait.jpeg` to `01.portait.jpg`). All references in HTML use the current names.

## Performance

Every image compressed in place (originals backed up separately). Targets: about 300 KB per image, JPEG re-encode via GDI+. Largest files:

- `02_Himal_Cafe/03_Materplan.jpg` · 289 KB
- `03_Sahara_community_center/01_Cover.jpg` · 356 KB
- `05_Extra_Hobbies_and_work/02_Hand_Rendering.jpg` · 335 KB
- `05_Extra_Hobbies_and_work/09_Case_Study.jpg` · 311 KB

PDFs compressed with Ghostscript (`gswin64c.exe`): project PDFs 1.8 MB + 1.6 MB, CV 116 KB. Total site about 8.8 MB (was 363 MB before optimization).

## Publish (GitHub Desktop to Pages)

1. GitHub Desktop: File → Add local repository → `C:\Users\Lenovo\Desktop\website`
2. Create repository (public) → Commit to main (check the changes list shows all files)
3. Publish repository, keep "Keep this code private" unchecked
4. GitHub (in browser) → repo Settings → Pages → Source: Deploy from a branch → Branch `main`, folder `/ (root)` → Save
5. Site live at `https://<your-username>.github.io/<repo-name>/`

Checklist after publishing:

- [ ] Update `og:image` URLs in every `<head>` (currently `https://shraddhapoudel.github.io/website/...`) to your real URL
- [ ] Confirm the `EDIT` markers on each project page (team / role)
- [ ] Add real descriptions to project 04/05 if desired
- [ ] Add phone / LinkedIn / Instagram in `contact.html` if you want them public
- [ ] Test on an actual phone; test all PDF downloads and the mailto link