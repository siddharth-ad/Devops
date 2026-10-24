# Firebase setup

This static site uses Cloud Firestore for contact messages, live-editable page text, and the public Pinterest gallery. Cloud Functions sync Pinterest photos server-side. No Firebase service-account key or Pinterest app secret belongs in the website.

## 1. Create a Firebase project and web app

1. Open the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. In **Project settings → General → Your apps**, add a **Web app**.
3. Copy the Firebase web configuration into `firebase-config.js`, replacing every `YOUR_...` value. The web config is public; never paste a service-account key or Admin SDK credentials into this repository.
4. In the Firebase console, register the GitHub Pages domain under **Authentication → Settings → Authorized domains** if Firebase requests it.

## 2. Create Firestore and publish its rules

1. Open **Build → Firestore Database** and create a database.
2. Open the Firestore **Rules** tab, replace its rules with the contents of `firestore.rules`, then click **Publish**.
3. The rules allow public visitors to read `siteContent/portfolio` and validated public image records in the `publicGallery` collection, and to submit validated contact messages. They do not allow website visitors to read contact messages or private Pinterest tokens, or to write gallery/page content.
4. Contact messages are saved in Firestore first. The website then sends a separate email notification through EmailJS; this avoids a Firebase billing-plan upgrade for email sending.
5. The contact form is public and can receive spam. Enable any available provider-side anti-abuse controls. Never put SMTP passwords or EmailJS private access tokens in this repository.

## 3. Configure contact email notifications

EmailJS sends a notification after the message has been saved in Firestore. The destination must be fixed to `tadhikary239@gmail.com` in the EmailJS template; visitors must not be able to choose a recipient.

1. Create an EmailJS account and connect an email service you control. Review the provider's current free-plan limits.
2. Create an email template. Set its **To Email** to `tadhikary239@gmail.com`, **Subject** to `{{subject}}`, **Reply-To** to `{{reply_to}}`, and include `{{from_name}}`, `{{reply_to}}`, and `{{message}}` in the email body. Use the connected email account as the From address.
3. You do not need to buy a custom domain. The public site uses GitHub Pages at `https://siddharth-ad.github.io/Devops/`. If EmailJS lets you edit its allowed-domain list, use the origin `https://siddharth-ad.github.io` (without the `/Devops/` path). For local development, use VS Code Live Server at `http://localhost:5500` rather than opening the page as `file://`.
4. The EmailJS **Service ID**, **Template ID**, and **Public Key** are configured in `emailjs-config.js`. The public key is designed for client-side use; never place an EmailJS private token or SMTP password in this file.
5. Submit the contact form. It reports success only after Firestore saves the message and EmailJS accepts the email request. If Firestore saves but email sending fails, the form says that the message is safely stored but the email notification failed. Check the EmailJS template, connected service, provider usage limits, and domain settings if editable on your plan.

## 4. Automatically sync the Pinterest lifestyle board

After the Pinterest API and Firebase Cloud Functions are configured, the Gallery page reads all public image pins from the `My life style` board into a dark, on-site photo gallery. A scheduled Cloud Function refreshes the board every six hours. Titles and descriptions are shown when available. Gallery cards are not links, so clicking a displayed photo does not navigate to Pinterest. The browser loads the photo files from Pinterest's image CDN.

The current Firebase project is `devops-10bda`. Cloud Functions and scheduled jobs require the Firebase Blaze billing plan and may incur charges. Review Firebase's current pricing and your account's budget alerts before enabling billing. Pinterest API app access and the `boards:read` and `pins:read` scopes must also be available to your Pinterest developer app. The sync only publishes board data after confirming the board is public.

1. In the [Pinterest Developers portal](https://developers.pinterest.com/), register an app and request the `boards:read` and `pins:read` scopes.
2. Add this exact OAuth redirect URI to the Pinterest app: `https://us-central1-devops-10bda.cloudfunctions.net/pinterestOAuth`
3. Install and sign in to the Firebase CLI, select project `devops-10bda`, then from the repository root run:

   ```powershell
   npm install -g firebase-tools
   firebase login
   firebase use devops-10bda
   firebase functions:secrets:set PINTEREST_CLIENT_SECRET
   firebase deploy --only functions,firestore:rules
   ```

   The CLI prompts for `PINTEREST_CLIENT_ID` the first time the function is deployed. Enter the app ID from Pinterest. Paste the app secret only into the CLI's secret prompt; never put it in a source file, GitHub, or chat. To replace a secret later, run `firebase functions:secrets:set PINTEREST_CLIENT_SECRET` again and redeploy.
4. If your Pinterest app was created before September 25, 2025, set `PINTEREST_CONTINUOUS_REFRESH=true` in the ignored local file `.env.devops-10bda` before deploying. Newer apps receive continuous refresh tokens automatically.
5. Connect your account once by opening `https://us-central1-devops-10bda.cloudfunctions.net/pinterestOAuth?action=connect` while signed in to the Pinterest account that owns the board. Approve the requested read-only permissions. The callback performs the first sync; later syncs run every six hours.
6. Publish the website changes to GitHub Pages. Ensure `firebase-config.js` points to the same Firebase project. Public visitors can read only sanitized public image records and sync status; OAuth tokens are stored in the private `privateIntegrations/pinterest` document and denied by Firestore rules.

Until the API is connected, the Gallery page shows its saved local fallback photo. Pinterest may restrict API access or board visibility; check the Cloud Functions logs if the initial sync or a later refresh fails. Pins without a description use their alt text when available. Only share photos you own or have permission to publish.

## 5. Add manual public gallery photos and videos

Manual media remains available as a fallback or for items not on Pinterest. Resize/compress a file and place it in `media/gallery/`, then add an entry to `gallery-media.js` using `type: "image"` or `type: "video"`, a relative `src`, a `title`, and a `description`. Publish the site changes to GitHub. GitHub and GitHub Pages have repository, file-size, bandwidth, and usage limits; large videos are not a good fit for this free static site. Music and Firebase in-page uploads are not supported.

## 6. Add content you want to edit

In **Firestore Database → Data**, create collection `siteContent`, with document ID `portfolio`. Add only the fields you want to override; any omitted field keeps the text already in `index.html`. Firestore listens for changes and updates the open page automatically.

Each text field below is a string:

`siteTitle`, `siteDescription`, `brandName`, `heroTitle`, `heroDescription`, `heroPrimaryLabel`, `heroSecondaryLabel`, `statusText`, `factLocation`, `factProjectType`, `factReplyTime`, `factTools`, `spotlightTitle`, `spotlightDescription`, `servicesTitle`, `serviceOneTitle`, `serviceOneDescription`, `serviceOneDetails`, `serviceTwoTitle`, `serviceTwoDescription`, `serviceTwoDetails`, `serviceThreeTitle`, `serviceThreeDescription`, `serviceThreeDetails`, `projectsTitle`, `projectOneTitle`, `projectOneDescription`, `projectOneLinkLabel`, `projectOneUrl`, `projectTwoTitle`, `projectTwoDescription`, `projectTwoLinkLabel`, `projectTwoUrl`, `projectThreeTitle`, `projectThreeDescription`, `projectThreeLinkLabel`, `projectThreeUrl`, `portraitText`, `aboutTitle`, `aboutParagraphOne`, `aboutParagraphTwo`, `skillsTitle`, `contactTitle`, `contactDescription`, `contactEmail`, `contactLinkedIn`, `contactLinkedInUrl`, `contactGitHub`, `contactGitHubUrl`, `contactSubmitLabel`, `footerName`.

The array fields `projectOneTags`, `projectTwoTags`, `projectThreeTags`, and `skillsTags` accept arrays of strings. For project URLs, enter full `https://` or `http://` URLs.

To change text, open `siteContent/portfolio` in the console, add or edit that field, and save. The page updates live; refresh if it is not open.

## 7. Verify contact messages and email delivery

Submit the website contact form. New submissions appear in **Firestore Database → Data → contactMessages**, and EmailJS sends a notification to `tadhikary239@gmail.com` when configured. Only you, through the Firebase Console, can read messages. Check EmailJS email history/delivery status if delivery fails. Do not put private information in `siteContent/portfolio`; visitors can read that document.

If a submission fails, open the page's developer tools (**F12 → Console**) and read the Firebase error:

- `permission-denied`: publish the supplied Firestore rules and confirm they are attached to the `(default)` database.
- `unavailable` or a network error: check connectivity, and open the site from `http://localhost` or its HTTPS GitHub Pages URL, not `file://`.
- `failed-precondition`: confirm the Firestore database exists and is enabled.
- A document appears but no email arrives: check `emailjs-config.js`, the EmailJS template's fixed recipient and variable names, the connected service status, plan limits, and EmailJS email history.

## 8. Publish the website changes

From the project folder, add the changed site files, media files, and `gallery-media.js`, then commit and push them. For example:

```powershell
git add -- FIREBASE_SETUP.md emailjs-config.js email-notifications.js script.js
git commit -m "Send contact notifications through EmailJS"
git push
```

GitHub Pages must serve the site over HTTPS for Firebase's web SDK. For local testing, use VS Code Live Server instead of opening `index.html` as a `file://` URL.

The Firebase web config must be filled in before Firestore is contacted. Until then, the site keeps showing its existing HTML content, and the contact form reports that it could not save the message. Editing HTML, CSS, JavaScript, images, or layout still requires changing and deploying the GitHub files; Firestore stores the page text, links, tags, and contact submissions.
