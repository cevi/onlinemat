# Onlinemat

## Getting started

### First installation

1. Install [node.js version management](https://github.com/coreybutler/nvm-windows)
2. Execute `nvm install 15.14.0`
3. Execute `nvm use 15.14.0`
4. Execute `npm i yarn -g` --> Installs yarn globally.
5. Execute `yarn` --> Installs all dependencies.


### Start the application

1. Execute: `yarn start` --> Runs the app in the development mode.
2. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.  
You will also see any lint errors in the console.

Happy Coding!


### FAQ

**The Application won't start**  
Don't forget to create the `.env` file with all the keys and values in it.

Keys:  
```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_SENTRY_DNS=
REACT_APP_AUTH0_DOMAIN=
REACT_APP_AUTH0_CLIENT_ID=
```