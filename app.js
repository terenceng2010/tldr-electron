const os = require('os');
const electron = require('electron');
const { remote } = electron;
const jetpack = require('fs-jetpack');
const request = require('request');
const showdown = require('showdown');
const Handlebars = require('handlebars');
const AdmZip = require('adm-zip');

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());

const {webFrame} = electron;
webFrame.setZoomFactor(1.4);

var tldrIndex;

request('http://tldr-pages.github.io/assets/index.json', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    //console.log(body);
    tldrIndex = JSON.parse(body);
    jetpack.write('offline-index.json', tldrIndex);
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
    
});

function search(){
    var commandToQuery = document.getElementById('search-command-input').value;
    //console.log('commandToQuery',commandToQuery);
    if(commandToQuery === ''){
        listAllCommands();
    }
    findIndex(commandToQuery)
}

function findIndex(commandToQuery){
   var result =  tldrIndex.commands.find(function(command){ return command.name === commandToQuery });
   //console.log(result);
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
    //console.log(description);
    var converter = new showdown.Converter();
    var descriptionConverted = converter.makeHtml(description);
    document.getElementById('command-content').scrollTop = 0;
    document.getElementById('command-content').innerHTML = descriptionConverted;
    document.getElementById('command-content').insertAdjacentHTML("afterbegin", `<button onclick='listAllCommands("${commandObj.name}")'><-</button>`);
}

function listAllCommands(jumpToCommand){
    var template = Handlebars.compile(appDir.read('commandList.hbs'));
    document.getElementById('command-content').innerHTML = template(tldrIndex);
    
    if(jumpToCommand){
        var targetCommand = document.getElementById(jumpToCommand);
        var top = targetCommand.offsetTop; //Getting Y of target element
        document.getElementById('command-content').scrollTop = top - 150;
        
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

function updateDatabase(){
    //What event is triggered when EOF is reached while writing to a stream ?
    //http://stackoverflow.com/questions/13156243/event-associated-with-fs-createwritestream-in-node-js
    var w = appDir.createWriteStream('tldr.zip');
    var downloadZip = request('http://tldr-pages.github.io/assets/tldr.zip').pipe( w );
    
    w.on('finish',function(){
     var zip;
     if( process.platform === 'win32'){
       zip =  new AdmZip( app.getAppPath()+"\\tldr.zip" ); 
     }else{
       zip = new AdmZip( app.getAppPath()+"/tldr.zip" );
     }
     
     zip.extractAllToAsync( app.getAppPath() , /*overwrite*/true, function(){
         alert('update database completed!');
     });
    });
}
