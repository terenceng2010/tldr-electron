// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
/*import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { greet } from './hello_world/hello_world'; // code authored by you in this project
import env from './env';*/

const os = require('os');
const electron = require('electron');
const { remote } = electron;
const jetpack = require('fs-jetpack');
const request = require('request');
const showdown = require('showdown');
const Handlebars = require('handlebars');

//const env = require('./env');

//console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());

// Holy crap! This is browser window with HTML and stuff, but I can read
// here files like it is node.js! Welcome to Electron world :)
console.log('The author of this app is:', appDir.read('package.json', 'json').author);

var tldrIndex;

request('http://tldr-pages.github.io/assets/index.json', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body) // Show the HTML for the Google homepage.
    tldrIndex = JSON.parse(body);
  }else{
    //fallback to offline index if cannot retrieve index from internet
    tldrIndex = appDir.read('offline-index.json', 'json')
  }
});

document.addEventListener('DOMContentLoaded', function () {
    
    document.getElementById('search-command-input').addEventListener("focus",function(){
        document.getElementsByClassName('app')[0].className = 'app active';
    });

    document.getElementById('list-all-commands').addEventListener("click",function(){
        document.getElementsByClassName('app')[0].className = 'app active';
    });

    document.getElementById('go-to-random-command').addEventListener("click",function(){
        document.getElementsByClassName('app')[0].className = 'app active';
    });    
    
    //document.getElementById('greet').innerHTML = greet();
    //document.getElementById('platform-info').innerHTML = os.platform();
    //document.getElementById('env-name').innerHTML = env.name;
});

function search(){
    var commandToQuery = document.getElementById('search-command-input').value;
    console.log('commandToQuery',commandToQuery);
    if(commandToQuery === ''){
        listAllCommands();
    }
    findIndex(commandToQuery)
}

function findIndex(commandToQuery){
   var result =  tldrIndex.commands.find(function(command){ return command.name === commandToQuery });
   console.log(result);
   if(result){
       console.log('Command is found in the index. Try to retrieve result from filesystem');
       retrieveCommandDescription(result);
   }else{
       console.log('Command is not found in the index. Break');
       let filtered = tldrIndex.commands.filter(function(command){ return command.name.startsWith( commandToQuery )});
       listFilteredCommands(filtered);
   }
}

function listFilteredCommands( filteredCommands ){
    var template = Handlebars.compile(appDir.read('commandList.hbs'));
    document.getElementById('command-content').innerHTML = template({commands: filteredCommands});
}

function retrieveCommandDescription(commandObj){
    var description = appDir.read(`./pages/${commandObj.platform[0]}/${commandObj.name}.md`);
    console.log(description);
    var converter = new showdown.Converter();
    var descriptionConverted = converter.makeHtml(description);
    document.getElementById('command-content').innerHTML = descriptionConverted;
    document.getElementById('command-content').insertAdjacentHTML("afterbegin", `<button onclick='listAllCommands("${commandObj.name}")'><-</button>`);
}

function listAllCommands(jumpToCommand){
    var template = Handlebars.compile(appDir.read('commandList.hbs'));
    document.getElementById('command-content').innerHTML = template(tldrIndex);
    
    if(jumpToCommand){
        var targetCommand = document.getElementById(jumpToCommand);
        var top = targetCommand.offsetTop; //Getting Y of target element
        
        window.scrollTo(0, top - 50);    
        targetCommand.parentNode.className = 'active';
        setTimeout(function(){ targetCommand.parentNode.className = ''; }, 500);
    }
    //console.log( template(tldrIndex) ) ; 
}

function randomCommand(){
    var commandIndex = getRandomInt(0, tldrIndex.commands.length - 1);
    retrieveCommandDescription(tldrIndex.commands[commandIndex]);
}

//From: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

