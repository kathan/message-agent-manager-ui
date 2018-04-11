const fs = require('fs');
const Url = require('url');
const http = require('http');
const path = require('path');

//==== Dependencies ====
const sendIt = require('@kathan/send-it');
const Async = require('async');

function cgi(req, res){
  var options = {
    protocol: 'http:',
    hostname: 'localhost',
    port: 8080,
    method: req.method,
    path: '/'+cleanUrl(__filename, req.path)
  };
  
  var url = `${options.protocol}://${options.hostname}:${options.port}/${cleanUrl(__filename, req.path)}`;
  var files = [];
  //res.json(req.files);
  Async.forEach(req.files, (file, next)=>{
    var new_path = path.resolve(file.path, '../'+file.name);
    fs.rename(file.path, new_path, (err)=>{
      if(err){return next(err);}
      //console.log(`Renamed ${file.path} to ${new_path}`);
      files.push(new_path);
      next();
    });
  },
  (err)=>{
    if(err){return res.send(err);}
    if(files.length > 0 || (req.body && Object.keys(req.body).length > 0)){
      //POST - Would PUT ever use multipart? 
      console.log('received files or data', url, req.body, files);
      sendIt(options, files, req.body, (err, result, reply)=>{
        if(err){return res.send(err);}
        console.log('reply', reply);
        res.send(reply);
      });
    }else{
      //GET
      var proxy = http.request(options, (resp) => {
        //console.log('statusCode', resp.statusCode);
        var json = '';
        switch(resp.statusCode){
          case 200:
            resp.on('data', (chunk) => {
              json += chunk;
            });
            resp.on('end', () => {
              var obj = {};
              try{
                obj = JSON.parse(json);
              }catch(err){
                console.log('JSON parse failed.', `"${json}"`, err);
              }
              obj = transformPrivateToPublicUrls(obj);
              
              //obj.boo = 'eek';
              res.json(obj);
            });
            break;
          default:
            res.status(resp.statusCode);
            res.end();
        }
      });
       
      proxy.on('response', function(resp) {
        res.status(resp.statusCode);
      });
      
      proxy.on('error', (e) => {
        res.send(`problem with request: ${e.message}`);
      });
      
      proxy.end();
    }
  });
  
  function cleanUrl(base, url){
    //console.log('base', base, 'url', url);
    var path_ary = url.split(/\//);
    //console.log('path_ary', path_ary);
    var past = false;
    var new_url = path_ary.filter((val)=>{
      if(past){
        return true;
      }else if(val === base){
        past = true;
      }
      return false;
    });
    //console.log('new_url', new_url);
    return new_url.join('/');
  }
  
  function transformPrivateToPublicUrls(obj){
    //console.log('typeof obj', typeof obj);
    if(typeof obj === 'object'){
      for(var i in obj){
        
        obj[i] = transformPrivateToPublicUrls(obj[i]);
      }
      return obj;
    }else if(typeof obj === 'string'){
      if(obj.substring(0, 4) === 'http'){
        return transformPrivateToPublicUrl(obj);
      }else{
        return obj;
      }
    }else{
      return obj;
    }
  }
  
  function transformPrivateToPublicUrl(url){
    try{
      var url_obj = Url.parse(url);
      //console.log('url_obj', url_obj);
      if(!url_obj.protocol){
        return url;
      }
      //
      var url_obj_path = url_obj.path.replace(/^\//, '');
      var req_path = req.path;
      var match = req_path.match(/\/$/);
      if(!match){
        req_path += '/';
      }
      //console.log('req_path', req_path, 'url_obj_path', url_obj_path);
      //console.log('__filename', __filename);
      var new_url =  Url.resolve(`${req.protocol}://${url_obj.hostname}`, `${req.headers.script_name}/${url_obj_path}`);
      return new_url;
    }catch(err){
      console.log('parse url failed.', url, err);
      return url;
    }
  }
  
  function transformPublicToPrivateUrls(obj){
    if(typeof obj === 'object'){
      for(var i in obj){
        obj[i] = transformPublicToPrivateUrls(obj[i]);
      }
      return obj;
    }else if(typeof obj === 'string'){
      if(obj.substring(0, 4) === 'http'){
        return transformPublicToPrivateUrl(obj);
      }else{
        return obj;
      }
    }else{
      return obj;
    }
  }
  
  function transformPublicToPrivateUrl(url){
    try{
      var url_obj = Url.parse(url);
      if(!url_obj.protocol){
        return url;
      }
      //console.log('paths', __filename, url_obj.path, cleanUrl(__filename, url_obj.path));
      var new_url =  Url.resolve(`${options.protocol}//${url_obj.hostname}:${options.port}`, cleanUrl(__filename, url_obj.path));
      //console.log('new_url', new_url);
      return new_url;
    }catch(err){
      //console.log('parse url failed.', url, err);
      return url;
    }
  }
}

