# Firebase setup

This static site uses Cloud Firestore for contact messages and live-editable page text. No Firebase service-account key belongs in this website.

## 1. Create a Firebase project and web app

1. Open the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. In **Project settings → General → Your apps**, add a **Web app**.
3. Copy the Firebase web configuration into `firebase-config.js`, replacing every `YOUR_...` value. The web config is public; never paste a service-account key or Admin SDK credentials into this repository.
4. In the Firebase console, register the GitHub Pages domain under **Authentication → Settings → Authorized domains** if Firebase requests it.

## 2. Create Firestore and publish its rules

1. Open **Build → Firestore Database** and create a database.
2. Open the **Rules** tab, replace its rules with the contents of `firestore.rules`, then click **Publish**.
3. The rules allow public visitors to read only `siteContent/portfolio` and submit validated contact messages. They do not allow the website to read messages or write page content. You can still edit page content while signed in to the Firebase Console.
4. The contact form is public and can receive spam. Add and test Firebase App Check in the site before enabling App Check enforcement; enforcing it without the App Check client will block contact-form writes.

## 3. Add content you want to edit

In **Firestore Database → Data**, create collection `siteContent`, with document ID `portfolio`. Add only the fields you want to override; any omitted field keeps the text already in `index.html`. Firestore listens for changes and updates the open page automatically.

Each text field below is a string:

`siteTitle`, `siteDescription`, `brandName`, `heroTitle`, `heroDescription`, `heroPrimaryLabel`, `heroSecondaryLabel`, `statusText`, `factLocation`, `factProjectType`, `factReplyTime`, `factTools`, `spotlightTitle`, `spotlightDescription`, `servicesTitle`, `serviceOneTitle`, `serviceOneDescription`, `serviceOneDetails`, `serviceTwoTitle`, `serviceTwoDescription`, `serviceTwoDetails`, `serviceThreeTitle`, `serviceThreeDescription`, `serviceThreeDetails`, `projectsTitle`, `projectOneTitle`, `projectOneDescription`, `projectOneLinkLabel`, `projectOneUrl`, `projectTwoTitle`, `projectTwoDescription`, `projectTwoLinkLabel`, `projectTwoUrl`, `projectThreeTitle`, `projectThreeDescription`, `projectThreeLinkLabel`, `projectThreeUrl`, `portraitText`, `aboutTitle`, `aboutParagraphOne`, `aboutParagraphTwo`, `skillsTitle`, `contactTitle`, `contactDescription`, `contactEmail`, `contactLinkedIn`, `contactLinkedInUrl`, `contactGitHub`, `contactGitHubUrl`, `contactSubmitLabel`, `footerName`.

The array fields `projectOneTags`, `projectTwoTags`, `projectThreeTags`, and `skillsTags` accept arrays of strings. For project URLs, enter full `https://` or `http://` URLs.

To change text, open `siteContent/portfolio` in the console, add or edit that field, and save. The page updates live; refresh if it is not open.

## 4. Verify contact messages

Submit the website contact form. New submissions appear in **Firestore Database → Data → contactMessages**. Only you, through the Firebase Console, can read them. Do not put private information in `siteContent/portfolio`; visitors can read that document.

## 5. Publish the website changes

From the project folder, commit and push the integration:

```powershell
git add -- index.html script.js firebase.js firebase-config.js firestore.rules FIREBASE_SETUP.md
git commit -m "Connect portfolio to Firebase"
git push
```

GitHub Pages must serve the site over HTTPS for Firebase's web SDK. For local testing, use VS Code Live Server instead of opening `index.html` as a `file://` URL.

The Firebase web config must be filled in before Firestore is contacted. Until then, the site keeps showing its existing HTML content, and the contact form reports that it could not save the message. Editing HTML, CSS, JavaScript, images, or layout still requires changing and deploying the GitHub files; Firestore stores the page text, links, tags, and contact submissions.
