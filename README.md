# Aayan Bhaisal // Cyberpunk 2077 Style Portfolio

A personal portfolio built for the AWS Builder hackathon. It is a static site (HTML, CSS, JavaScript) hosted on **AWS Amplify Hosting**.

## Sections
- **About me**: story and education log
- **Tech superpowers**: skills with honest levels
- **Projects**: learning projects and the portfolio itself
- **Achievements**: NCC, cultural medal, basketball, academics
- **Contact**

## Creative feature: Netrunner quickhack interface
A pulsing **QUICKHACK [Q]** button sits in the bottom-right corner, and the hero shows a signal hint. Click it or press **Q** to open the HUD.

- **Targets:** About, Skills, Projects, Achievements, Contact. A classified target unlocks after three successful breaches.
- **Quickhacks:** PING (10 RAM), BREACH (25 RAM), OVERHEAT (40 RAM). Each runs a progress bar and reveals something about the target.
- **RAM:** regenerates over time, so the HUD stays playable.

The HUD is an extra layer. The rest of the site works fully without it.

## Run locally
No build step is needed. Open `index.html` in a browser, or serve the folder:

```
npx serve .
```

## Deploy on AWS Amplify
1. In the AWS Amplify console, choose **Host web app**.
2. Connect this GitHub repository, or choose **Deploy without Git provider** and upload the folder.
3. Amplify detects a static site. The build settings are optional: no build command, output directory `.`.

## Tech
- HTML5, CSS3 (custom properties, responsive grid, reduced-motion support)
- Vanilla JavaScript (no frameworks, no dependencies)
- Hosting: AWS Amplify Hosting
