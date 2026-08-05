# Publish a thought from iPhone

This uses one Apple Shortcut for both a Home Screen icon and the iPhone Action
Button. Apple Dictation produces the transcript; the publishing endpoint
conservatively removes fillers and false starts before creating the thought.
Audio is never uploaded or stored.

## Build the shortcut

In the Shortcuts app, create a shortcut named **Publish thought** with these
actions in order:

1. **Dictate Text**
   - Language: your preferred language
   - Stop Listening: **After Pause** for hands-free capture, or **On Tap** if
     your thoughts often contain long pauses
2. **URL**
   - `https://YOUR_DOMAIN/api/thoughts`
3. **Get Contents of URL**
   - URL: the URL from the previous action
   - Method: **POST**
   - Headers:
     - `Authorization`: `Bearer YOUR_PUBLISH_TOKEN`
     - `Content-Type`: `application/json`
   - Request Body: **JSON**
     - `text`: select the **Dictated Text** magic variable
     - `source`: `voice`
4. **Show Notification**
   - Text: `Thought published`

Run it once inside Shortcuts to grant microphone, dictation, and network
permissions. A successful capture is live as soon as the notification appears,
though the feed's 60-second edge cache may delay it by up to a minute.

Treat the publishing token like a password. If the phone is lost or the
shortcut is shared accidentally, replace `PUBLISH_TOKEN` in Vercel and update
the shortcut.

## Add it to the Home Screen

Open the shortcut's details, choose **Add to Home Screen**, give it a simple
black icon, and add it. Tap the icon to start dictation.

iOS reserves long-pressing Home Screen icons for system context menus, so an
icon cannot implement custom hold-to-record behavior without a native app.
Tap-to-dictate is the closest zero-app equivalent.

## Assign it to the Action Button

On a supported iPhone:

1. Open **Settings → Action Button**.
2. Swipe to **Shortcut**.
3. Choose **Publish thought**.

Press and hold the Action Button to launch the shortcut, then speak. Dictation
stops after a pause (or when tapped, depending on the option selected above),
publishes automatically, and shows the confirmation notification.
