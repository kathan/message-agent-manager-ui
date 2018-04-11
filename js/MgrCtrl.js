var MgrApp = angular.module("MgrApp",[]);

MgrApp.controller('MgrCtrl', ($scope, $http) => {
  $scope.current_workflow;
  //$scope.current_agents = [];
  $scope.getData = (start) => {
    //start ? $scope.start = start : $scope.start = $scope.params.start;
    var params = {/*start: $scope.start*/};
    
    //$('#dup_list').wait();
    $http.get('api.njs', {params:params}).
      success((data, status, headers, config) => {
        $scope.data = data;
        $scope.data.modes = ['applescript'];
        for(var w in $scope.data.workflows){
          var wf = $scope.data.workflows[w];
          for(var a in wf.agents){
            var agent = wf.agents[a];
            if(agent.destination){
              var dest_agent = getAgent(wf, agent.destination);
              if(dest_agent){
                agent.dest_name = dest_agent.name;
              }
            }
          }
        }
        //$('#dup_list').stopwait();
      }).
      error((data, status, headers, config) => {
        //display_feedback({success:false, feedback:'An error ocurred. '+data})
        //$('#dup_list').stopwait();
      }
    );
  }
  
  //Fires on all clicks
  /*$(window).click(()=>{
    $scope.selectWorkflow();
    $scope.$apply();
  });*/
  
  $scope.selectWorkflow = (wf)=>{
    $scope.current_workflow ? $scope.current_workflow.this_class = 'nav-link' : null;
    if(wf){
      $scope.current_workflow = wf;
      wf.this_class = 'nav-link active';
    }
    
    $scope.selectAgent(null);
  }
  
  function getWorkflow(name){
    for(var i in $scope.data.workflows){
      if($scope.data.workflows[i].name === name){
        return $scope.data.workflows[i];
      }
    }
  }
  
  function getAgent(wf, name){
    for(var i in wf.agents){
      if(wf.agents[i].name === name){
        return wf.agents[i];
      }else if(wf.agents[i].url === name){
        return wf.agents[i];
      }
    }
  }
  
  $scope.setDest = (current_agent)=>{
    var found_agent = getAgent($scope.current_workflow, current_agent.dest_name);
    if(found_agent){
      current_agent.destination = found_agent.url;
    }
  }
  
  $scope.startAgent = (agent)=>{
     $http.put(`${agent.url}/start`).
        success((data, status, headers, config) => {
          $scope.feedback = data.feedback;
          agent.running = true;
        }).
        error((data, status, headers, config) => {
          $scope.feedback = data.feedback;
        }
      );
  }
  
  $scope.stopAgent = (agent)=>{
     $http.put(`${agent.url}/stop`).
        success((data, status, headers, config) => {
          $scope.feedback = data.feedback;
          agent.running = false;
        }).
        error((data, status, headers, config) => {
          $scope.feedback = data.feedback;
        }
      );
  }
  
  $scope.selectAgent = (agent)=>{
    $scope.current_agent ? $scope.current_agent.this_class = 'nav-link' : null;
    $scope.current_agent = agent;
    if(agent){
      if(agent.script){
        $scope.editor.setValue(agent.script);
        $scope.editor.session.setMode("ace/mode/"+agent.mode);
      }else{
        $scope.editor.setValue('');
      }
      agent.this_class = 'nav-link active';
      $scope.current_agents = $scope.current_workflow.agents.filter((a)=>{
        return a.name !== agent.name;
      }).map((a)=>{
        return a.name;
      });
      $( "#dest_name" ).autocomplete(
        {
          delay: 0,
          minLength: 0,
          source: $scope.current_agents
        }
      );
      $( "#dest_name" ).autocomplete({
        change: ( event, ui ) =>{
          $scope.$apply();
        }
      });
    }else{
      $scope.editor.setValue('');
    }
  }
  
  $scope.saveAgent = (agent)=>{
    var params = {};
    $scope.current_agent.destination ? params.destination = $scope.current_agent.destination: null;
    params.script = $scope.editor.getValue();
  
    $http.put(`api.njs/${$scope.current_workflow.name}/${$scope.current_agent.name}`, params).
        success((data, status, headers, config) => {
          $scope.feedback = data.feedback;
        }).
        error((data, status, headers, config) => {
          $scope.feedback = data.feedback;
        }
      );
  }
  
  $scope.newWorkflow = () =>{
    var wf_name = window.prompt("Enter new workflow name");
    if(wf_name){
      var params = {workflow: wf_name};
      $http.post('api.njs/workflows', params).
        success((data, status, headers, config) => {
          $scope.feedback = data.feedback;
          $scope.getData();
        }).
        error((data, status, headers, config) => {
          $scope.feedback = data.feedback;
        }
      );
    }
  };
  
  $scope.newAgent = () =>{
    var agent_name = window.prompt("Enter new agent name");
    if(agent_name){
      var params = {agent: agent_name};
      $http.post(`api.njs/${$scope.current_workflow.name}/agents`, params).
        success((data, status, headers, config) => {
          $scope.feedback = data.feedback;
          $scope.getData();
        }).
        error((data, status, headers, config) => {
          $scope.feedback = data.feedback;
        }
      );
    }
  };
  $scope.getData();
  $( "#destinations" ).autocomplete({
    source: $scope.current_agents
  });
  
  $scope.changeMode = function(){
    $scope.editor.session.setMode("ace/mode/"+$scope.current_agent.mode);
  }
  //var ta = document.getElementById('code_editor');
  $scope.editor = ace.edit("code_editor");
  $scope.editor.setTheme("ace/theme/tomorrow_night_eighties");
  
  $scope.editor.setAutoScrollEditorIntoView(true);
  $scope.editor.setOption("maxLines", 30);
  $scope.editor.resize(true);
  /*$scope.editor.addEventListener('change', (e)=>{
    var i = 1;
  });*/
});
