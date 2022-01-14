# AlertR

This Node.JS server will alert a Discord server webhook whenever it receives a push notification via the Google service pubsubhubbub.

In other words whenever new content is uploaded to a YouTube channel that you're interested in, this application will post it to a Discord channel via a WebHook.

![AlertR in action](images/discord.png "AlertR Example")

## Config

Config is contained in the `src/config` directory. Create a copy of the example file and rename it to `app.json` providing all the values it requires.

## Installation
Install [nvm](https://github.com/nvm-sh/nvm)

In a terminal at the project root run `nvm install v14 && nvm use`

Yarn is used in this project for package management so next run `npm i yarn -g` to install yarn globally for v14 of node.

Finally, install project dependencies by running `yarn`
## Testing

Tests can be executed with `yarn test`

## Usage
`yarn start`