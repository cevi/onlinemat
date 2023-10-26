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
For that just copy the `.env.example` file, rename it to `.env`, and add the missing secrets.
To get the `.env` values for the dev instance, please contact onlinemat@cevi.tools

**Where is the backend?**
For the backend we use Firebase. It's a NoSQL database provided by Google.

**How do I deploy the application?**
The application is auto deployed using a GitHub Action.
The action is triggered when a new commit is pushed to the `master` branch. It builds the docker container(s) and pushes
them to the [Private Container Registry](registry.cevi.tools). The container is then deployed to
the [Swarm Cluster](swarm.cevi.tools). All configs are stored in
the [Cevi Tools Infrastructure registry](https://github.com/cevi/cevi-tools-infrastructure).
