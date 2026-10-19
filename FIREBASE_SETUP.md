# Firebase setup

This static site uses Cloud Firestore for contact messages and live-editable page text. No Firebase service-account key belongs in this website.

## 1. Create a Firebase project and web app

1. Open the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. In **Project settings → General → Your apps**, add a **Web app**.
3. Copy the Firebase web configuration into `firebase-config.js`, replacing every `YOUR_...` value. The web config is public; never paste a service-account key or Admin SDK credentials into this repository.
4. In the Firebase console, register the GitHub Pages domain under **Authentication → Settings → Authorized domains** if Firebase requests it.

## 2. Create Firestore and publish its rules

1. Open **Build → Firestore Database** and create a database.
2. Install the official **Trigger Email from Firestore** extension (`firestore-send-email`) from **Extensions → Explore Extensions**. Select `contactMessages` as its collection path.
3. Configure the extension with SMTP server details and a verified sender address. Set the SMTP account's recipient to `tadhikary239@gmail.com` only if the extension asks for one; each queued email document already has a fixed `to` value. Keep SMTP credentials in the extension's private configuration, never in this repository or the browser.
4. Installing Firebase Extensions requires the Firebase project to use the **Blaze (pay-as-you-go) plan**. The extension runs as a Cloud Function and may incur charges according to Firebase and your SMTP provider's pricing.
5. Open the Firestore **Rules** tab, replace its rules with the contents of `firestore.rules`, then click **Publish**.
6. The rules allow public visitors to read only `siteContent/portfolio` and submit validated contact messages addressed only to `tadhikary239@gmail.com`. They do not allow the website to read messages or write page content. The email extension uses its service account to process the queue.
7. The contact form is public and can receive spam. Add and test Firebase App Check in the site before enabling App Check enforcement; enforcing it without the App Check client will block contact-form writes.

## 3. Add content you want to edit

In **Firestore Database → Data**, create collection `siteContent`, with document ID `portfolio`. Add only the fields you want to override; any omitted field keeps the text already in `index.html`. Firestore listens for changes and updates the open page automatically.

Each text field below is a string:

`siteTitle`, `siteDescription`, `brandName`, `heroTitle`, `heroDescription`, `heroPrimaryLabel`, `heroSecondaryLabel`, `statusText`, `factLocation`, `factProjectType`, `factReplyTime`, `factTools`, `spotlightTitle`, `spotlightDescription`, `servicesTitle`, `serviceOneTitle`, `serviceOneDescription`, `serviceOneDetails`, `serviceTwoTitle`, `serviceTwoDescription`, `serviceTwoDetails`, `serviceThreeTitle`, `serviceThreeDescription`, `serviceThreeDetails`, `projectsTitle`, `projectOneTitle`, `projectOneDescription`, `projectOneLinkLabel`, `projectOneUrl`, `projectTwoTitle`, `projectTwoDescription`, `projectTwoLinkLabel`, `projectTwoUrl`, `projectThreeTitle`, `projectThreeDescription`, `projectThreeLinkLabel`, `projectThreeUrl`, `portraitText`, `aboutTitle`, `aboutParagraphOne`, `aboutParagraphTwo`, `skillsTitle`, `contactTitle`, `contactDescription`, `contactEmail`, `contactLinkedIn`, `contactLinkedInUrl`, `contactGitHub`, `contactGitHubUrl`, `contactSubmitLabel`, `footerName`.

The array fields `projectOneTags`, `projectTwoTags`, `projectThreeTags`, and `skillsTags` accept arrays of strings. For project URLs, enter full `https://` or `http://` URLs.

To change text, open `siteContent/portfolio` in the console, add or edit that field, and save. The page updates live; refresh if it is not open.

## 4. Verify contact messages and email delivery

Submit the website contact form. New submissions appear in **Firestore Database → Data → contactMessages**, and the extension sends the notification to `tadhikary239@gmail.com`. Only you, through the Firebase Console, can read messages. Check the document's extension delivery status and the extension's Cloud Function logs if delivery fails. Do not put private information in `siteContent/portfolio`; visitors can read that document.

If a submission fails, open the page's developer tools (**F12 → Console**) and read the Firebase error:

- `permission-denied`: publish the supplied Firestore rules and confirm they are attached to the `(default)` database.
- `unavailable` or a network error: check connectivity, and open the site from `http://localhost` or its HTTPS GitHub Pages URL, not `file://`.
- `failed-precondition`: confirm the Firestore database exists and is enabled.
- A document appears but no email arrives: check the Trigger Email extension's collection path (`contactMessages`), SMTP credentials, sender verification, and Cloud Function logs. The page reports when an email job is queued; only the extension's delivery status confirms actual email delivery.

## 5. Publish the website changes

From the project folder, commit and push the integration:

```powershell
git add -- index.html script.js firebase.js firebase-config.js firestore.rules FIREBASE_SETUP.md
git commit -m "Connect portfolio to Firebase"
git push
```

GitHub Pages must serve the site over HTTPS for Firebase's web SDK. For local testing, use VS Code Live Server instead of opening `index.html` as a `file://` URL.

The Firebase web config must be filled in before Firestore is contacted. Until then, the site keeps showing its existing HTML content, and the contact form reports that it could not save the message. Editing HTML, CSS, JavaScript, images, or layout still requires changing and deploying the GitHub files; Firestore stores the page text, links, tags, and contact submissions.
