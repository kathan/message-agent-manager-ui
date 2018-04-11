var AgentApp = angular.module("AgentApp",["ui.bootstrap"]);

AgentApp.controller('AgentCtrl', ($scope, $http) => {
  $scope.trunc_len = 10;
  $scope.new_payloads = [];
  var hash_ary = window.location.hash.substr(1).split('/');
  $scope.workflow = null;
  $scope.agent_name = null;
  if(hash_ary.length > 0 && hash_ary[0] !== ''){
    $scope.workflow = hash_ary[0].replace(/%20/g,' ');
  }
  
  $scope.focus = function(id){
    window.setTimeout(()=>{
      var el = document.getElementById(id);
      if(el){
        el.focus();
      }
    },1);
  }
  if(hash_ary.length > 1){
    $scope.agent_name = hash_ary[1].replace(/%20/g,' ');
  }
  
  $scope.getAgent = function(cb){
    var params = {};
    $http.get(`api.njs/${$scope.workflow}/${$scope.agent_name}`, {params:params}).
      then(function successCallback(response) {
      //success((data, status, headers, config) => {
        $scope.agent = response.data.agent;
        $scope.payloads = response.data.payloads;
        cb();
      
      }, function errorCallback(response) {
      //error((data, status, headers, config) => {
        cb(response.data);
      });
  };
  
  $scope.removeFile = function(payload, file){
    for(var i in payload.files){
      if(payload.files[i] === file){
        payload.files.splice(i, 1);
      }
    }
  };
  
  $scope.removePayload = function(payload){
    for(var i in $scope.new_payloads){
      if($scope.new_payloads[i] === payload){
        $scope.new_payloads.splice(i, 1);
      }
    } 
  };
  
  $scope.getAgents = function(cb){
    var params = {};
    $http.get(`api.njs/${$scope.workflow}`, {params:params}).
      then(function successCallback(response) {
      //success((data, status, headers, config) => {
        $scope.agents = response.data.agents;
        cb();
      //}).
      }, function errorCallback(response) {
      //error((data, status, headers, config) => {
        cb(response.data);
      });
  };
  
  $scope.newPayload = function(files, data){
    var new_payload = {files: [], data:{}};
    if(Array.isArray(files)){
      new_payload.files = files;
    }
    
    if(typeof data === 'object'){
      new_payload.data = data;
    }
    $scope.new_payloads.push(new_payload);
  };
  
  $scope.getWorkflows = function(cb){
    var params = {};
    $http.get('api.njs', {params:params}).
      //success((data, status, headers, config) => {
      then(function successCallback(response) {
        $scope.workflows = response.data.workflows;
        cb();
      //}).
      //error((data, status, headers, config) => {
      }, function errorCallback(response) {
        cb(response.data);
      });
  };
  
  $scope.addData = function(payload){
    var key = prompt("Enter attribute name");
    if(key){
      if(!payload.data){
        payload.data = {};
      }
      payload.data[key] = "";
    }
  };
  
  $scope.removeData = function(payload, key){
    delete payload.data[key];
  };
  
  $scope.uploadPayload = function(payload){
    var xhr = new XMLHttpRequest();
    var form = document.createElement('form');
    
    var form_data = new FormData(form);
    for(var i in payload.files){
      var file = payload.files[i];
      form_data.append('file[]', file);
    }
    for(var i in payload.data){
      var val = payload.data[i];
      form_data.append(i, val);
    }
    xhr.upload.addEventListener("abort", function(e){
      
    });

    xhr.upload.addEventListener("error", function(e){
      $scope.feedback.push(e);
    });

    xhr.addEventListener('load', function(e) {
      var readyState = xhr.readyState,
          status = xhr.status;
      $scope.removePayload(payload);
    });
    
    //xhr.upload.addEventListener('progress', function(event){
    xhr.addEventListener('progress', function(event){
      payload.progress = (event.loaded/event.total)*100;
      $scope.$apply();
    });
    
    xhr.addEventListener('loadend', function(event){
      payload.progress = event.loaded/event.total;
      window.setTimeout(()=>{
        $scope.removePayload(payload);
        $scope.$apply();
      },3000);
    });
    
    xhr.open('POST', $scope.agent.url);
    xhr.send(form_data);
  };
  
  function workflowExists(){
    for(var i in $scope.workflows){
      var wf =  $scope.workflows[i];
      if(wf.name === $scope.workflow){
        return true;
      }
    }
    return false;
  }
  
  function agentExists(){
    for(var i in $scope.agents){
      var ag = $scope.agents[i];
      if(ag.name === $scope.agent_name){
        return true;
      }
    }
    return false;
  }
  
  if($scope.workflow && $scope.agent_name){
    $scope.getWorkflows((err)=>{
      if(workflowExists()){
        $scope.getAgents((err)=>{
          if(agentExists()){
            $scope.getAgent(()=>{
              $scope.enable;
            });
          }else{
            $scope.feedback = [`Agent "${$scope.agent_name}" not found.`];
          }
        });
      }else{
        $scope.feedback = [`Workflow "${$scope.workflow}" not found.`];
      }
    });
  }else{
    $scope.feedback = ["Missing workflow and/or agent."];
  }
  //==== file Drop ====
  var drop_el = document.getElementById('drop_zone');
  drop_el.addEventListener('dragenter', (e)=>{
    //drop_el.classList.add(du_hover);
    e.stopPropagation();
    e.preventDefault();
  });
  
  drop_el.addEventListener('dragend', (e)=>{
    //drop_el.classList.remove(du_hover);
    e.stopPropagation();
    e.preventDefault();
  });
  
  drop_el.addEventListener('dragleave', (e)=>{
    //drop_el.classList.remove(du_hover);
    e.stopPropagation();
    e.preventDefault();
  });
  
  drop_el.addEventListener('dragexit', (e)=>{
    //drop_el.classList.remove(du_hover);
    e.stopPropagation();
    e.preventDefault();
  });

  drop_el.addEventListener('dragover', (e)=>{
    //drop_el.classList.add(du_hover);
    e.stopPropagation();
    e.preventDefault();
  });
  
  function traverseFileTree(obj, path, cb) {
    path = path || "";
    var files = [];
    var entry = obj.item.webkitGetAsEntry();
    if (entry.isFile) {
      // Get file
      /*entry.file((file) => {
        files.push(file);
        cb(null, files);
      },
      (err)=>{
        cb(err);
      });*/
      files.push(obj.file);
      cb(null, files);
    } else if (entry.isDirectory) {
      // Get folder contents
      var dirReader = item.createReader();
      dirReader.readEntries((entries) => {
        async.forEachOf(entries, (entry, key, next) => {
          traverseFileTree(entry, path + item.name + "/", (err, dir_files)=>{
            if(err){return next(err);}
            if(dir_files){
              files = files.concat(dir_files);
            }
            next();
          });
        },(err)=>{
          if(err){return next(err);}
          cb(null, files);
        });
      });
    }
  }
  
  /*drop_el.addEventListener('drop', (e)=>{
    var l_files = e.dataTransfer.files;
    e.preventDefault();
    e.stopPropagation();
    window.setTimeout(function(){
      //drop_el.classList.remove(du_hover);

      //drop_el.dispatchEvent(new Event('drop_start'));
      //document.querySelector(self).trigger('drop_start');
      async.each(l_files, (file, next) => {
        //var file = l_files.item(i);
        console.log(file instanceof File);
        if (file instanceof File) {
          traverseFileTree(file, null, (err, files)=>{
            if(err){console.log(err);return next();}
            $scope.newPayload(files);
            next();
          });
        }
      },(err)=>{
        drop_el.dispatchEvent(new CustomEvent('files-dropped', {detail: files}));
        $scope.$apply();
      });
    }, 0);
  }, false);*/
  
  drop_el.addEventListener('drop', (e)=>{
    if(e.dataTransfer.items){
      var files = e.dataTransfer.files;
      var items = e.dataTransfer.items;
      e.preventDefault();
      e.stopPropagation();
      //window.setTimeout(function(){
        //var items = e.dataTransfer.items;
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var file = files[i];
          var obj = {file: files[i], item: item};
          //console.log(item instanceof File);
          //if (item && item instanceof File) {
            
              traverseFileTree(obj, null, (err, files)=>{
                if(err){return console.log(err);}
                $scope.newPayload(files);
                $scope.$apply();
              });
            
          //}
        }
      //},0);
    }
  }, false);
});

AgentApp.directive("contenteditable", function() {
  return {
    restrict: "A",
    require: "ngModel",
    link: function(scope, element, attrs, ngModel) {

      function read() {
        ngModel.$setViewValue(element.html());
      }

      ngModel.$render = function() {
        element.html(ngModel.$viewValue || "");
      };

      element.bind("blur keyup change", function() {
        scope.$apply(read);
      });
    }
  };
});
