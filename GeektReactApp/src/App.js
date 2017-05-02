import React, { Component } from 'react';
import './App.css';
import Web3 from 'web3';
import _ from 'lodash';
import cryptojs from 'crypto-js';
// import fs from 'fs';

var GeektABI = [{"constant":true,"inputs":[],"name":"getUsers","outputs":[{"name":"","type":"address[]"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"handle","type":"string"},{"name":"city","type":"bytes32"},{"name":"state","type":"bytes32"},{"name":"country","type":"bytes32"}],"name":"registerNewUser","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"SHA256notaryHash","type":"bytes32"}],"name":"getImage","outputs":[{"name":"","type":"string"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"userAddress","type":"address"}],"name":"getUser","outputs":[{"name":"","type":"string"},{"name":"","type":"bytes32"},{"name":"","type":"bytes32"},{"name":"","type":"bytes32"},{"name":"","type":"bytes32[]"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"getAllImages","outputs":[{"name":"","type":"bytes32[]"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"imageURL","type":"string"},{"name":"SHA256notaryHash","type":"bytes32"}],"name":"addImageToUser","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"badUser","type":"address"}],"name":"removeUser","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"badImage","type":"bytes32"}],"name":"removeImage","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"userAddress","type":"address"}],"name":"getUserImages","outputs":[{"name":"","type":"bytes32[]"}],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"}];
//var GeektAddress = '0xe70ff0fa937a25d5dd4172318fa1593baba5a027';  // localhost testnet address
var GeektAddress = '0x6f283ca1ea2a305662e25437f65aa9a52ae31c90';    // mainnet address!

var GeektContract = {};
var web3 = {};
var alreadyLoaded = false;
var defaultAccount = 0;
// var algo = 'sha256';
// var shasum = crypto.createHash(algo);
var dataRead = 0;
var reader = new FileReader();
//var fullUserList = {};

function loadWeb3() {
  let web3Injected = window.web3;
  if(typeof web3Injected !== 'undefined'){
    console.log("saw injected web3!");
    web3 = new Web3(web3Injected.currentProvider);
  } else {
    console.log("did not see web3 injected!");
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }
}
class App extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {
      users: {},
      thisUser: '',
      selectedUser: '',
      thisImage: {},
      defaultHandle: 'Your Handle',
      defaultCity: 'Your City',
      defaultState: 'Your State',
      defaultCountry: 'Your Country',
      newImageURL: 'Paste Image URL Here',
      newImageSHA: '',
      newImageReady: 0,
      selectedUserImages: {},
      selectedUserImage: '',
      selectedUserImageVerified: false,
      selectedUserImageSHA: '',
      myImages: {},
      mySelectedImage: '',
      myImageVerified: false
    };
    this.RegisterChange = this.RegisterChange.bind(this);
    this.newUserSelected = this.newUserSelected.bind(this);
    this.newMyImageSelected = this.newMyImageSelected.bind(this);
    this.selectedUserImageSelected = this.selectedUserImageSelected.bind(this);
  }

  getInfo(){
    var outerThis = this;
    if(typeof web3.eth !== 'undefined'){
      GeektContract = web3.eth.contract(GeektABI).at(GeektAddress);
      if(typeof web3.eth.accounts !== 'undefined') {
        if(typeof web3.eth.accounts[0] !== 'undefined'){
          defaultAccount = web3.eth.accounts[0];
          console.debug("saw default eth account: " + web3.eth.accounts[0]);
          GeektContract.getUsers(function(err,usersResult){
            if(err) {
              outerThis.setState({
                users: {}
              });
            } else {
              console.log("saw users: " + JSON.stringify(usersResult) + ", err : " + err);
              var usersList = {};
              var usersLength = usersResult.length;
              var foundDefault = false;
              _.map(usersResult,function(key){
                //console.log("saw users key : " + key);
                GeektContract.getUser(key,function(err,userResult){
                  //console.log("saw result: "+ JSON.stringify(userResult));
                  //console.log("user: handle(" + userResult[0] + "), addr("+ key +")");
                  usersList[userResult[0]] = {
                    "address":key,
                    "City":web3.toAscii(userResult[1]).replace(/\u0000/g,''),
                    "State":web3.toAscii(userResult[2]).replace(/\u0000/g,''),
                    "Country":web3.toAscii(userResult[3]).replace(/\u0000/g,''),
                    "myImages":userResult[4]
                  };
                  if(key === defaultAccount){
                    //console.log("noticed this user's account! "+ userResult[0]);
                    outerThis.setState({
                      thisUser:userResult[0],
                      selectedUser:userResult[0]
                    });
                    outerThis.refs.userSelect.value = userResult[0];
                    outerThis.refreshUser(key);
                  }
                  outerThis.setState({
                    users:usersList
                  },function(){
                    //console.log("saw this user: " + userResult + ", length: " + Object.keys(outerThis.state.users).length);
                    if(Object.keys(outerThis.state.users).length === usersLength){  // this is sort of a funky callback mechanism
                      //console.log("all users loaded!");
                      if(!foundDefault){
                        outerThis.refs.userSelect.value = userResult[0];
                        outerThis.setState({
                          selectedUser: userResult[0]
                        },function(){
                          outerThis.refreshUser(key);
                        });
                      }
                      //fullUserList=outerThis.state.users;
                    }
                  });
                });
              });
            }
            return null;
          });
        }
      }
      //console.debug(web3.eth)
      web3.eth.getCompilers(function(err,resp){
        console.log("available compilers: " + resp);
      });
      web3.version.getNetwork((err, netId) => {
        var tempNetId = ''
        if(err) {
          tempNetId = err;
          console.log('web3.version.getNetwork() saw err: ' + err);
        }
        console.log("saw netId:" + netId);
        switch (netId) {
          case "1":
            tempNetId = "mainnet";
            console.log('This is mainnet');
            break
          case "2":
            tempNetId = "Morden  test network";
            console.log('This is the deprecated Morden test network.');
            break
          case "3":
            tempNetId = "ropsten test network";
            console.log('This is the ropsten test network.');
            break
          default:
            tempNetId = "localhost";
            console.log('This is an unknown/localhost network: ' + tempNetId);
        }
        // console.log("contract: ");
        // console.debug(GeektContract);
        outerThis.setState({
          thisNetId: tempNetId
        });
      });
    }
  }

  defaultEthAddressLink() {
    if(defaultAccount === 0) {
      return "(no web3.eth node link)"
    } else {
      var thisLink = "https://etherscan.io/address/" + defaultAccount;
      return <span><a href={ thisLink }target="_blank">{ defaultAccount }</a></span>
    }
  }

  getSelected() {  // draws the selected user profile in the bottom left panel
    var outerThis = this;
    //console.log("selectedUser : " + outerThis.state.selectedUser);
    //console.log("users : " + JSON.stringify(outerThis.state.users));
    if(outerThis.state.selectedUser && outerThis.state.users[outerThis.state.selectedUser]){
      return <span>
        <h4>{ outerThis.state.selectedUser }</h4>
        <h5>
          { outerThis.state.users[outerThis.state.selectedUser]["City"] },{'\u00A0'}
          { outerThis.state.users[outerThis.state.selectedUser]["State"] },{'\u00A0'}
          { outerThis.state.users[outerThis.state.selectedUser]["Country"] }
        </h5>
        <div style={{"position":"relative","backgroundColor":"#DDDDDD","minHeight":"50px","width":"100%","overflow":"hidden"}}>
          <img ref="selectedUserImageRef" src="" alt="" />
        </div><br /><br />
        Image SHA: <span style={{"fontSize":"13px","fontWeight":"bold"}}>{ outerThis.state.selectedUserImageSHA } { outerThis.selectedUserCheckMark() }</span><br /><br />
        Image Timestamp: <span style={{"fontSize":"13px","fontWeight":"bold"}}>{ outerThis.selectedUserTimestamp() }</span><br /><br />
        User Images: { outerThis.drawImageSelect(0,outerThis.state.selectedUser) }</span>
    } else {
      return null;
    }
  }

  selectedUserTimestamp() {
    //console.log("selectedUserTimestamp called! selectedUserImages" + JSON.stringify(this.state.selectedUserImages) + ", selectedUserImage: " + this.state.selectedUserImage);
    if(this.state.selectedUserImages && this.state.selectedUserImage){
      return <span>{ this.formatTimestamp(this.state.selectedUserImages[this.state.selectedUserImage].timestamp) }</span>;
    } else {
      return null;
    }
  }

  formatTimestamp(timestamp){
    var date = new Date(parseInt(timestamp)*1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = date.getFullYear();
    var month = months[date.getMonth()];
    var day = ('0' + date.getDate() ).substr(-2);
    var hour = date.getHours();
    var min = date.getMinutes();
    var sec = date.getSeconds();
    var time = month + ' ' + day + ' ' + year + ', ' + hour + ':' + min + ':' + sec ;
    return <span>{time}</span>;
  }

  selectedUserCheckMark(){
    //console.log("this.state.selectedUserImage: " + !!this.state.selectedUserImage);
    if(!!this.state.selectedUserImage){
      if(this.state.selectedUserImageVerified){
        return <span style={{"color":"green","fontSize":"18px","fontWeight":"bold"}}>{ '\u2713' }</span>
      } else {
        return <span style={{"color":"red","fontSize":"18px","fontWeight":"bold"}}>x</span>
      }
    }
  }

  getDefault(attribute) { // overloaded function for drawing input boxes, to reduce code repitition...
    var outerThis = this;
    if(defaultAccount === 0){ // we didn't see a "defaultAccount" loaded, maybe no web3 connection (they can't update a profile yet)
      return <span>{ attribute }: <input
               className="generalInput"
               name={"default"+attribute}
               ref={"default"+attribute}
               label={'Your '+attribute}
               style={{"backgroundColor":"#E9FEED","whiteSpace":"nowrap","resize":"none","overflowX":"hidden"}}
               value={this.state['default'+attribute]}
               disabled="true"
             /><br /><br /></span>
    } else {  // acct exists and user has already signed in (they can't update the profile, we can fill in their account details)
      if(outerThis.state.thisUser && outerThis.state.users[outerThis.state.thisUser]){
        if(attribute === "Handle") {
          return <span>{ outerThis.state.thisUser }</span>
        } else {
          var includeComma = '';
          if(attribute !== "Country") {
            includeComma = ',\u00A0';
          }
          return <h5 style={{"display":"inline-block"}}>{ outerThis.state.users[outerThis.state.thisUser][attribute] }{ includeComma }</h5>
        }
      } else {   // acct exists but user has yet to sign in (they can sign the GuestBook now!)
        return <span>{ attribute }: <input
               className="generalInput"
               name={"default"+attribute}
               ref={"default"+attribute}
               label={'Your '+attribute}
               style={{"backgroundColor":"#E9FEED","whiteSpace":"nowrap","resize":"none","overflowX":"hidden"}}
               value={this.state['default'+attribute]}
               onChange={this.RegisterChange}
               onFocus={() => { this.clearStateIf('default'+attribute,'Your '+attribute,null) } }
             /><br /><br /></span>
      }
    }
  }

  refreshUser(key) { // make sure we always have up-to-date user profile info when selectbox or user update callbacks fire
    console.log("refreshing user : " + key);
    var outerThis = this;
    if(typeof web3.eth !== 'undefined'){
      GeektContract = web3.eth.contract(GeektABI).at(GeektAddress);
      if(typeof web3.eth.accounts !== 'undefined') {
        if(typeof web3.eth.accounts[0] !== 'undefined'){
          defaultAccount = web3.eth.accounts[0];
          //console.log("saw default eth account: " + defaultAccount);
          var usersList = outerThis.state.users;
          GeektContract.getUser(key,function(err,userResult){
            //console.log("saw result: "+ JSON.stringify(userResult));
            //console.log("user: handle(" + userResult[0] + "), addr("+ key +")");
            usersList[userResult[0]] = {
              "address":key,
              "City":web3.toAscii(userResult[1]).replace(/\u0000/g,''),
              "State":web3.toAscii(userResult[2]).replace(/\u0000/g,''),
              "Country":web3.toAscii(userResult[3]).replace(/\u0000/g,''),
              "myImages":userResult[4]
            };
            GeektContract.getUserImages(key,function(err,imagesResult){
              if(err) {
                console.log("getUserImages saw err for user " + key + ": " + err)
              } else {
                console.log("saw user images : " + JSON.stringify(imagesResult) + ", length : " + imagesResult.length);
                if(imagesResult.length === 0){
                  if(key === defaultAccount){
                    outerThis.setState({
                      myImages:{},
                      mySelectedImage:'',
                      thisUser:userResult[0]
                    });
                  }
                  if(!!outerThis.refs.userSelect){
                    outerThis.refs.userSelect.value = userResult[0];
                  }
                  if(!!outerThis.refs.selectedUserImageRef){
                    outerThis.refs.selectedUserImageRef.src = '';
                  }
                  outerThis.setState({
                    selectedUser:userResult[0],
                    selectedUserImages:{},
                    selectedUserImage:'',
                    selectedUserImageSHA:''
                  });
                }
                var theseImages = {};
                var length = imagesResult.length;
                var highestTimestamp = 0;
                var latestImage = ''
                var selectHighestTimestamp = 0;
                var selectLatestImage = ''
                _.map(imagesResult,function(imageHash){
                  GeektContract.getImage(imageHash,function(err,imageResult){
                    if(key === defaultAccount){ // fill in myUserImages)
                      var newMyImages = outerThis.state.myImages;
                      newMyImages[imageHash]={}
                      newMyImages[imageHash].url = imageResult[0];
                      newMyImages[imageHash].timestamp = parseInt(imageResult[1]);
                      if(newMyImages[imageHash].timestamp > highestTimestamp){
                        highestTimestamp = newMyImages[imageHash].timestamp;
                        latestImage = imageHash;
                      }
                      console.log("saw image " + imageHash + ": " + JSON.stringify(imageResult) + ", myNewImages.length : " + Object.keys(newMyImages).length + ", length :" + length);
                      if(Object.keys(newMyImages).length === length) {
                        console.log("all myImages loaded, myImages length : " + length + ', saw latestImage: ' + latestImage);
                        outerThis.setState({
                          myImages:newMyImages,
                          mySelectedImage:latestImage,
                          thisUser:userResult[0]
                        });
                        outerThis.refs.myImagesSelect.value = latestImage;
                        outerThis.checkImage(1,latestImage);
                      }
                    }
                    var newSelectedImages = outerThis.state.selectedUserImages;
                    newSelectedImages[imageHash]={}
                    newSelectedImages[imageHash].url = imageResult[0];
                    newSelectedImages[imageHash].timestamp = parseInt(imageResult[1]);
                    if(newSelectedImages[imageHash].timestamp > selectHighestTimestamp){
                      selectHighestTimestamp = newSelectedImages[imageHash].timestamp;
                      selectLatestImage = imageHash;
                    }
                    console.log(" - saw image " + imageHash + ": " + JSON.stringify(imageResult) + ", newSelectedImages.length : " + Object.keys(newSelectedImages).length + ", length :" + length);
                    if(Object.keys(newSelectedImages).length === length) {
                      outerThis.refs.userSelect.value = userResult[0];
                      outerThis.setState({
                        users:usersList,
                        selectedUser:userResult[0],
                        selectedUserImages:newSelectedImages,
                        selectedUserImage: selectLatestImage
                      },function(){
                        console.log("selected user: " + userResult[0] + ", saw " + length + " images, latest image: " + selectLatestImage);
                        outerThis.refs.selectedUserImagesSelect.value = selectLatestImage;
                        outerThis.checkImage(0,selectLatestImage);
                      });
                    }
                  });
                });
              }
            });
          });
        }
      }
    }
  }

  newUserSelected(e){ // handles onChange of the userSelect box
    //console.log("selected : " + this.state.users[e.target.value].address)
    var targetValue = e.target.value;
    this.setState({
      selectedUserImage:'',
      selectedUserImages:{}
    },function(){
      this.refreshUser(this.state.users[targetValue].address);
    })
  }

  drawUserSelect(){ // draws the userSelect box and account links, in alphabetical order
    var outerThis = this;
    return(
      <select id="userSelect" className="userSelect" ref="userSelect" style={{width:'300px'}} onChange={outerThis.newUserSelected}>
      <option disabled>Select user</option>
      {
        _.sortBy(_.map(this.state.users,function(val,key){  // sort users by handle alphabetically here
          //console.log("key("+ key +"), val['addres'] : " + val['address']);
          return(<option value={key} key={val['address']}>{key}</option>); // don't mind the funky "reverse" key/val nomenclature here...
        }),function(i){
          return i.props.value;
        })
      }
      </select>
    );
  }

  viewOrSignButton() { // users will see a "sign now", or "add new image" input/button, or nothing if web3 didn't load properly
    var outerThis = this;
    if(defaultAccount === 0){
      return null;
    } else {
      if(outerThis.state.thisUser){  // acct exists and user has already signed in, they can now add images!
        return (
          <span>
            <div style={{"position":"relative","backgroundColor":"#DDDDDD","minHeight":"50px","width":"100%","overflow":"hidden"}}>
              <img ref="myImageRef" src="" alt="" />
            </div><br />
            { outerThis.newImageButton() }
          </span>
        );
      } else {
        return <button color="white" className="Button" onClick={ () => { this.signGuestbook() } }>Sign GuestBook</button>
      }
    }
  }

  goBack() {  // puts the bottom left panel back into ready state for new images to be added, after an image is added
    var myImage = this.refs.myImageRef;
    myImage.src='';
    this.setState({
      newImageReady:0,
      newImageURL:'Paste Image URL Here'
    });
    this.refreshUser(this.state.users[this.state.thisUser].address);
  }

  newImageButton() { // display SHA256 of the image to be added, and the button to click to add it to this user's account on-chain
    //console.log("newImageButton : " + this.state.newImageReady);
    var outerThis = this;
    if(outerThis.state.newImageReady===1){
      return(
        <span>
          Image SHA: <span style={{"fontSize":"13px","fontWeight":"bold"}}>{ outerThis.state.newImageSHA }</span><br /><br />
          <button color="white" className="Button" onClick={ () => { this.addImageToUser() } }>Add Image</button><br /><br />
          <span style={{"color":"blue"}} onClick={() => outerThis.goBack() }>Go Back</span>
        </span>
      );
    } else if(outerThis.state.newImageReady) { // if newImageReady is not 0/1, it's being used for loading / error display message
      return <span>{outerThis.state.newImageReady}</span>;
    } else {  // this is the default "ready to add new image" state, showing the myImages selector and the "paste image URL here" input box
      return <span>
                Image SHA: <span style={{"fontSize":"13px","fontWeight":"bold"}}>{ outerThis.state.newImageSHA }  { outerThis.myUserCheckMark() }</span><br /><br />
                Your Images: { outerThis.drawImageSelect(1,this.state.thisUser) }<br /><br />
                <span>Add Image: <input
                 className="generalInput"
                 name="newImageURL"
                 ref="newImageURL"
                 label="new image URL"
                 style={{"backgroundColor":"#E9FEED","whiteSpace":"nowrap","resize":"none","overflowX":"hidden"}}
                 value={this.state['newImageURL']}
                 onChange={this.RegisterChange}
                 onFocus={() => { this.clearStateIf('newImageURL','Paste Image URL Here',null) } }
                 /><br /><br /></span>
             </span>
    }
  }

  myUserCheckMark(){
    //console.log("myUserCheckMark called! : " + this.state.myImageVerified);
    if(!!this.state.mySelectedImage){
      if(this.state.myImageVerified){
        return <span style={{"color":"green","fontSize":"18px","fontWeight":"bold"}}>{ '\u2713' }</span>
      } else {
        return <span style={{"color":"red","fontSize":"18px","fontWeight":"bold"}}>x</span>
      }
    }
  }

  newMyImageSelected(e){
    //console.log("newMyImageSelected : name(" + e.target.name + "), value(" + e.target.value + ")");
    this.checkImage(1,e.target.value);
  }

  selectedUserImageSelected(e){
    console.log("selectedUserImageSelected : name(" + e.target.name + "), value(" + e.target.value + ")");
    this.checkImage(0,e.target.value);
  }

  drawImageSelect(mine,thisUser) {
    var outerThis = this;
    if(thisUser && outerThis.state.users[thisUser]) {
      //console.log("drawImageSelect! user: " + thisUser);
      if(mine){
        //console.log("drawing myUser image select: " + thisUser + ", myImages: " + JSON.stringify(outerThis.state.myImages));
        return(
          <select id="myImagesSelect" className="myImagesSelect" ref="myImagesSelect" style={{width:'300px'}} onChange={outerThis.newMyImageSelected}>
          <option disabled>Your Images: </option>
          {
            _.sortBy(_.map(outerThis.state.myImages,function(val,hash){  // sort users by handle alphabetically here
              //console.log("hash("+ hash +"), val : " + JSON.stringify(val));
              var thisImageSplit = val['url'].split('/');
              var thisImageString = val['ur'];
              thisImageString = thisImageSplit[thisImageSplit.length-1]; // make image urls more human-readable
              return(<option value={hash} key={val['timestamp']}>{thisImageString}</option>); // don't mind the funky "reverse" key/val nomenclature here...
            }),function(i){
              return -1*parseFloat(i.key);
            })
          }
          </select>
        );
      } else {
        //console.log("drawing selectedUser image select: " + thisUser + ", myImages: " + JSON.stringify(outerThis.state.myImages));
        return(
          <select id="selectedUserImagesSelect" className="selectedUserImagesSelect" ref="selectedUserImagesSelect" style={{width:'300px'}} onChange={outerThis.selectedUserImageSelected}>
          <option disabled>User Images: </option>
          {
            _.sortBy(_.map(outerThis.state.selectedUserImages,function(val,hash){  // sort users by handle alphabetically here
              //console.log("hash("+ hash +"), val : " + JSON.stringify(val));
              var thisImageSplit = val['url'].split('/');
              var thisImageString = val['ur'];
              thisImageString = thisImageSplit[thisImageSplit.length-1]; // make image urls more human-readable
              return(<option value={hash} key={val['timestamp']}>{thisImageString}</option>); // don't mind the funky "reverse" key/val nomenclature here...
            }),function(i){
              return -1*parseFloat(i.key);
            })
          }
          </select>
        );
      }
    }
  }

  addImageToUser() { // handles the "add image to user" button functionality
    var outerThis = this;
    console.log("adding image to user now!");
    console.log("imageURL : " + outerThis.state.newImageURL + ", sha: 0x"+ outerThis.state.newImageSHA);
    try {
      GeektContract.addImageToUser.estimateGas(outerThis.state.newImageURL,"0x"+outerThis.state.newImageSHA,{from:defaultAccount}, function(err, result){
        if(err) {
          throw err;
        } else {
          console.log("addNewImage gas estimate : " + result);
          var myGasNum = result;
          GeektContract.addImageToUser.sendTransaction(outerThis.state.newImageURL,"0x"+outerThis.state.newImageSHA,{from:defaultAccount, gas: myGasNum}, function(err, result){
            if(err) {
              throw err;
            } else {
              console.log("image added!")
              outerThis.goBack();
            }
          });
        }
      });
    } catch (err) {
      console.log("addImageToUser threw err: " + err);
    }
  }

  signGuestbook() { // handles the "sign guestbook now" button functionality
    var outerThis = this;
    console.log("signing GuestBook now!");
    console.log(outerThis.state.defaultHandle,outerThis.state.defaultCity,outerThis.state.defaultState,outerThis.state.defaultCountry);
    try {
      GeektContract.registerNewUser.estimateGas(outerThis.state.defaultHandle,outerThis.state.defaultCity,outerThis.state.defaultState,outerThis.state.defaultCountry,{from:defaultAccount}, function(err, result){
        if(err) {
          throw err;
        } else {
          console.log("registerNewUser gas estimate : " + result);
          var myGasNum = result;
          GeektContract.registerNewUser.sendTransaction(outerThis.state.defaultHandle,outerThis.state.defaultCity,outerThis.state.defaultState,outerThis.state.defaultCountry,{from:defaultAccount, gas: myGasNum}, function(err, result){
            if(err) {
              throw err;
            } else {
              console.log("GuestBook signed! TXID : " + result);
              outerThis.refreshUser(defaultAccount);
            }
          });
        }
      });
    } catch (err) {
      console.log("signing GuestBook threw err: " + err);
    }
    return null;
  }

  RegisterChange(e) { // updates input fields in response to user typing in them, gets SHA256 of new image if needed
    //console.log('registering change : ' + e.target.name + " - " + e.target.value);
    var outerThis = this;
    var newState = this.state;
    newState[e.target.name] = e.target.value;
    this.setState(newState);
    if(e.target.name === 'newImageURL'){
      outerThis.fetchNewImage();
    }
  }

  checkImage(mine,imageHash){
    console.log("checking image, mine(" + mine + ")");
    var outerThis = this;
    var thisURL = '';
    if(mine){
      thisURL = this.state.myImages[imageHash].url;
      this.refs.myImageRef.src = thisURL;
    } else {
      thisURL = this.state.selectedUserImages[imageHash].url;
      this.refs.selectedUserImageRef.src = thisURL;
    }
    console.log(" - image: " + imageHash + " url : " + thisURL);
     // fetch image via proxy, get sha hash, compare to on-chain image hash
    var proxyURL='https://fierce-temple-74228.herokuapp.com/'+thisURL;
    var request = new Request(proxyURL, {
      method: 'GET',
      mode: 'basic',
      redirect: 'follow',
      headers: new Headers({
        'Origin': 'localhost',
        'x-requested-with':'GeektReactApp'
      })
    });
    try {
      fetch(request).then(function(resp) {
        if(resp.ok) {
          return resp.blob();
        }
        //console.log("saw checkImage fetch response: " + JSON.stringify(resp));
        //console.debug(resp)
        throw new Error("Couldn't fetch this image! ");
      }).then(function(respBlob) {
        reader.readAsBinaryString(respBlob);
        reader.onloadend = function(){
          var dataURL = reader.result;
          var sha256 = cryptojs.SHA256(cryptojs.enc.Latin1.parse(dataURL)).toString(cryptojs.enc.Hex);
          //console.log("reader callback fired: " + dataURL);
          //console.log("saw sha256 of image data: 0x" + sha256 + ", comparing to chain sha: " + imageHash);
          if("0x" + sha256 === imageHash){
            if(mine){
              outerThis.setState({
                newImageSHA: "0x" + sha256,
                myImageVerified: true,
                mySelectedImage: imageHash
              });
            } else {
              outerThis.setState({
                selectedUserImageSHA: "0x" + sha256,
                selectedUserImageVerified: true,
                selectedUserImage: imageHash
              });
            }
          } else {
            if(mine){
              outerThis.setState({
                newImageSHA: "0x" + sha256,
                myImageVerified: false,
                mySelectedImage: imageHash
              });
            } else {
              outerThis.setState({
                selectedUserImageSHA: "0x" + sha256,
                selectedUserImageVerified: false,
                selectedUserImage: imageHash
              });
            }
          }
        }
      }).catch(function(error) {
        console.log('fetch saw error: ');
        if(mine){
          outerThis.setState({
            newImageSHA: '',
            myImageVerified: false,
            mySelectedImage: imageHash
          });
        } else {
          outerThis.setState({
            selectedUserImageSHA: '',
            selectedUserImageVerified: false,
            selectedUserImage: imageHash
          });
        }
        console.debug(error);
      });
    } catch (err) {
      console.log("checkImage caught error : " + err);
      if(mine){
        outerThis.setState({
          newImageSHA: '',
          myImageVerified: false,
          mySelectedImage: imageHash
        });
      } else {
        outerThis.setState({
          selectedUserImageSHA: '',
          selectedUserImageVerified: false,
          selectedUserImage: imageHash
        });
      }
    }
  }

  fetchNewImage() {  // when URL is pasted into newImage box, simple error-check, display, and get SHA256 hash of the image also
    var outerThis = this;
    console.log("fetch new image : " + this.state.newImageURL);
    var lastFour = this.state.newImageURL.substr(this.state.newImageURL.length - 4);
    var isNewImage = /png|bmp|gif|jpg|jpeg|tif|tiff/.test(lastFour.toLowerCase())
    // console.log("isImage test passed : " + isNewImage + ", lastFour : " + lastFour);
    //lastThree.includes('image');
    var myImage = this.refs.myImageRef;
    var proxyURL='https://fierce-temple-74228.herokuapp.com/'+this.state.newImageURL;
    if(isNewImage){
      outerThis.setState({
        newImageReady:'Checking image...',
        newImageSHA:'',
        myImageVerified:false
      });
      // myImage.src = "http://www.unm.edu/~reason/Tesseract.jpg"; // 3dc54764f06ec1f556fc27735a94a436bb28ed21b3ffcf8133c151b9ada68030
      var request = new Request(proxyURL, {
      	method: 'GET',
      	mode: 'basic',
      	redirect: 'follow',
      	headers: new Headers({
      		'Origin': 'localhost',
          'x-requested-with':'GeektReactApp'
      	})
      });
      try {
        fetch(request).then(function(resp) {
          if(resp.ok) {
            return resp.blob();
          }
          //console.debug(resp)
          throw new Error("Couldn't fetch this image! ");
        }).then(function(respBlob) {
          console.debug(respBlob);
          //reader.readAsDataURL(respBlob);
          var isBlobImage = respBlob.type.includes('image');
          if(isBlobImage){
            var objectURL = URL.createObjectURL(respBlob);
            myImage.src = objectURL;
            reader.readAsBinaryString(respBlob);
            outerThis.setState({
              newImageReady:'Getting image SHA256 hash...'
            });
            reader.onloadend = function(){
              var dataURL = reader.result;
              var sha256 = cryptojs.SHA256(cryptojs.enc.Latin1.parse(dataURL)).toString(cryptojs.enc.Hex);
              //console.log("reader callback fired: " + dataURL);
              console.log("saw sha256 of image data: " + sha256);
              outerThis.setState({
                newImageReady:1,
                newImageSHA:sha256
              });
            };
          }
        }).catch(function(error) {
          console.log('fetch saw error: ');
          console.debug(error);
        });
      } catch (err) {
        console.log("fetchImage caught error : " + err);
      }
    } else {
      console.log("didn't test file SHA, no image format detected.");
    }
  }

  clearState(target, warn) { // clears input boxes from their default value upon user clicking on that input box
    console.log("clearState called! target " + target);
    this.setState({
      [target]: '',
      [warn]: ''
    });
  }

  clearStateIf(target, val, warn) { // nested clearState calls allow for custom error/warning message clearing also, if needed
    console.log("clearStateIf called! target(" + this.state[target] + "), val (" + val + ")");
    if(this.state[target] === val){
      this.clearState(target,warn);
    }
  }

  componentDidMount() { // gets called every time a redraw occurs on the main top-level react elect (so, all the time)
    if(!alreadyLoaded){ // we only want this to happen once upon page load, not every component reload...
      alreadyLoaded = true;
      loadWeb3();
      this.getInfo();
    }
  }

  render() { // renders the main page, updates automatically upon setState() calls which alter the state
    return (
      <div className="App">
        <div className="App-header">
          <table style={{"minWidth":"70%","textAlign":"center","margin":"auto"}}>
            <tbody>
              <tr>
              <td style={{"width":"200px"}}>
                <a href="http://www.soles.io/" target="_blank"><img src="http://www.soles.io/new_glowy_logo.png" alt="SOLES-Logo" width="160px"/></a><br />
                <a href="http://www.soles.io/" target="_blank">SOLES.io</a>
              </td>
              <td>
                <a href="https://blockgeeks.com/" target="_blank"><img src="Blockgeeks-blue-black-white.png" alt="Blockgeeks-Logo" height="100px"/></a><br />
                <h3>Demo Ethereum GuestBook & Image Notary</h3>
              </td>
              <td style={{"width":"250px"}}>
                See the BlockGeeks Article<br /><br />
                See the <a href="https://github.com/Tectract/ethereum-demo-tools" target="_blank">Github Code Repository</a>
              </td></tr>
            </tbody>
          </table>
        </div><div className="App-main">
        <table style={{"minWidth":"90%","textAlign":"center","margin":"auto","height":"100%","whiteSpace":"nowrap"}}>
          <tbody style={{"height":"100%"}}>
            <tr className="bookTop">
              <td style={{"width":"50%","verticalAlign":"middle"}}>
                Users List<br />
                { this.drawUserSelect() }
              </td>
              <td style={{"width":"50%",}}>
              </td>
            </tr>
            <tr className="bookMain">
              <td style={{"width":"50%","border":"1px solid black"}}>
                { this.getSelected() }<br />
              </td>
              <td style={{"width":"50%","border":"1px solid black"}}><br />
                <div>Saw connection to network: <b>{ this.state.thisNetId }</b>!</div><br />
                Saw default account: { this.defaultEthAddressLink() }<br /><br />
                <h4 style={{"display":"inline"}}>{ this.getDefault('Handle') }</h4><br />
                { this.getDefault('City') }
                { this.getDefault('State') }
                { this.getDefault('Country') }<br />
                { this.viewOrSignButton() }
              </td>
            </tr>
          </tbody>
        </table>
        <hr />
        <span className="app-outro">
          <table style={{"minWidth":"70%","textAlign":"left","margin":"auto"}}>
            <tbody>
              <tr><td style={{"textAlign":"center"}}>
                <span style={{"fontSize":"15px","fontWeight":"bold"}}>
                  Thank you for visiting <a href="http://www.soles.io/" target="_blank">SOLES.io</a> and the <a href="https://github.com/Tectract/ethereum-demo-tools" target="_blank">Ethereum Guestbook Demo</a>!<br /><br />
                </span>
              </td></tr>
              <tr><td>
                <span style={{"fontSize":"13px","fontWeight":"bold"}}>
                  To use this tool you&#39;ll need a connection to an Ethereum network, via:<br />
                  <span style={{"padding":"0px 0px 0px 6px"}}>
                    1. start <a href="https://github.com/ethereum/go-ethereum" target="_blank">Ethereum server</a> or <a href="https://github.com/ethereumjs/testrpc" target="_blank">testrpc server</a> running at localhost:8545, then reload this page
                  </span><br /><span style={{"padding":"0px 0px 0px 6px"}}>
                    2. Install <a href="https://metamask.io/" target="_blank">Metamask plugin</a>, connect to network of your choice (including Mainnet!), then reload this page
                  </span><br />
                  <u>notes</u>: for localhost testrpc (testnet), you don&#39;t need Metamask running, see <a href="https://github.com/Tectract/EthDeployer/blob/master/README.md" target="_blank">the README</a> for metamask signing locally & ethereumjs-testrpc notes<br />
                  <u>notes</u>: sometimes you may need to reload once or twice for it to see your web3.eth.accounts[0] account
                  <br /><br />
                  Author: <a href="http://www.soles.io/blog/our-team/" target="_blank">Ryan Molecke</a>, sponsored by <a href="http://blockgeeks.com/" target="_blank">BlockGeeks.com</a>!<br />
                  Issues, comments, suggestions? Please use <a href="https://github.com/Tectract/ethereum-demo-tools/issues" target="_blank">this page</a> to start an issue ticket, do not email Ryan for help directly :)<br />
                  Also check out <a href="http://www.soles.io/EthDeployer/" target="_blank">Tectract&#39;s EthDeployer!</a>
                </span>
              </td></tr>
            </tbody>
          </table>
        </span>
        <br /><br />
        </div>
      </div>
    );
  }
}

export default App;
