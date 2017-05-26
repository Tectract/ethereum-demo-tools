# ethereum-demo-tools

###dependencies

(install nodejs and npm, latest versions if you can)

npm i -g ethereumjs-testrpc

npm i -g ethereumjs-util     # see note below

npm i -g truffle

Useful tool info and examples for learning to write Ethereum smart-contracts, to accompany my BlockGeeks article

truffle commands:

truffle init

truffle compile

truffle migrate

truffle console

### testrpc startup with pre-set seed phrase and pre-defined networkID

COMMAND FROM DEMO ARTICLE: testrpc -m "sample dog come year spray crawl learn general detect silver jelly pilot" --network-id 20

networkID needs to be below decimal(108) for tx signature to work properly (tx.v must be one byte only)

note: ethereumjs-testrpc depends on OUTDATED ethereumjs-util, which has a signing bug which prevents Metamask from signing properly LOCALLY,

but it works ok on mainnet. In order to fix this, you should:

npm i -g ethereumjs-util@latest  # separately from ethereumjs-testrpc

now: you need to find where ethereumjs-testrpc and ethereumjs-util actually got installed, then go to the

cd path-to/ethereumjs-util/node_modules

mv ethereumjs-util ethereumjs-util_old

ln -s path-to/ethereumjs-util .

this symlink will trick ethereumjs-testrpc into using the latest version of ethereumjs-util, and solve the "signing bug" for local deployment


###examples of interacting with Geekt contract via truffle console:

Geekt = Geekt.deployed()

Geekt.then(function(instance){return instance.registerNewUser("Tectract","Denver","CO","USA");})

Geekt.then(function(instance){return instance.addImageToUser('https://avatars1.githubusercontent.com/u/3859005?v=3&u=f4863d518451ebe42c16c776930e913335eb837b&s=400','0x6c3e007e281f6948b37c511a11e43c8026d2a16a8a45fed4e83379b66b0ab927');})

Geekt.then(function(instance){return instance.addImageToUser('https://avatars1.githubusercontent.com/u/3859005?v=3&u=f4863d518451ebe42c16c776930e913335eb837b&s=400','');})

Geekt.then(function(instance){return instance.getUser('0x0ac21f1a6fe22241ccd3af85477e5358ac5847c2');})

Geekt.then(function(instance){return JSON.stringify(instance.abi);})

Geekt.then(function(instance){return instance.getUsers();})

Geekt.then(function(instance){return instance.getImages();})

Geekt.then(function(instance){return instance.getImage('0x6c3e007e281f6948b37c511a11e43c8026d2a16a8a45fed4e83379b66b0ab927');})

Geekt.then(function(instance){return instance.removeImage('0x6c3e007e281f6948b37c511a11e43c8026d2a16a8a45fed4e83379b66b0ab927');})

Geekt.then(function(instance){return instance.removeUser('0x0ac21f1a6fe22241ccd3af85477e5358ac5847c2');})


###app creation

this app was created with: create-react-app (see: https://github.com/facebookincubator/create-react-app)

this app uses a cors-anywhere proxy (deployed at heroku with a domain whitelist and rate-limit), to grab image data for sha256 hashing

see https://github.com/Rob--W/cors-anywhere for details on deploying a cors-anywhere proxy

### deployment info

to install the app locally

git clone https://www.github.com/tectract/ethereum-demo-tools/

cd ethereum-demo-tools/GeekReactApp

npm i

npm start 

(or) npm run build 

if testing against a localhost and local deployment of the contract, you'll have to update the contract address in App.js!

otherwise just use metamask plugin and connect to mainnet to test the app, even if running locally :)
